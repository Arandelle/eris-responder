import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Alert
} from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import * as Location from "expo-location";
import { OPENROUTE_API_KEY } from "@env";
import { ref, onValue, set, update } from "firebase/database";
import { database } from "../services/firebaseConfig";
import responderMarker from "../../assets/ambulance.png";
import drunk from "../../assets/drunk.png";
import crime from "../../assets/murder.png";
import Logo from "../../assets/logo.png";
import FetchingData from "../services/FetchingData";

const openRouteKey = OPENROUTE_API_KEY;

const Home = ({ responderUid, setIsProfileComplete }) => {
  const [responderPosition, setResponderPosition] = useState(null);
  const [heading, setHeading] = useState(0);
  const [emergencyData, setEmergencyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emergencyDetails, setEmergencyDetails] = useState(null);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const handleShowEmergencyDetails = (emergency) => {
    setEmergencyDetails(emergency);
    setShowModal(true);
  };

  useEffect(() => {
    const requestLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          console.error("Permission to access location was denied");
          Alert.alert(
            "Eris says: ",
            "Permission to access location was denied"
          );
          setResponderPosition({ latitude: 14.33289, longitude: 120.85065 }); //fallback position
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setResponderPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        //watch postion changes

        Location.watchPositionAsync({ distanceInterval: 1 }, (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setResponderPosition({ latitude, longitude });

          const responderRef = ref(database, `responders/${responderUid}`);
          update(responderRef, { location: { latitude, longitude } });
        });
        setLoading(false);
      } catch (error) {
        console.error("Location request failed: ", error);
        Alert.alert(
          "Location permission was denied",
          "The app is using a default fallback location. Please enable location permissions in your device settings for accurate location tracking."
        );
        setResponderPosition({ latitude: 14.33289, longitude: 120.85065 }); // Fallback position
        setLoading(false); // Stop loading on error
      }
    };
    requestLocation();
  }, []);

  useEffect(() => {
    const requestRef = ref(database, "emergencyRequest");
    const unsubscribe = onValue(requestRef, (snapshot) => {
      try {
        const data = snapshot.val();
        const emergencyList = Object.entries(data)
          .filter(
            ([_, emergency]) =>
              emergency.locationCoords && emergency.status !== "done"
          )
          .map(([id, emergency]) => ({
            id,
            name: emergency.name || "Unknown",
            type: emergency.type || "Unspecified",
            location: {
              latitude: emergency.locationCoords.latitude,
              longitude: emergency.locationCoords.longitude,
            },
            status: emergency.status || "active",
            description: emergency.description || "none",
            timestamp: new Date(emergency.timestamp).toLocaleString(),
          }));
        setEmergencyData(emergencyList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching emergency data:", error);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (responderPosition && selectedEmergency) {
      fetchRoute();
    }
  }, [responderPosition, selectedEmergency]);

  const fetchRoute = async () => {
    if (!responderPosition || !selectedEmergency) return;

    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${openRouteKey}&start=${responderPosition.longitude},${responderPosition.latitude}&end=${selectedEmergency.location.longitude},${selectedEmergency.location.latitude}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates;
        const formattedRoute = coordinates.map((coord) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setRoute(formattedRoute);
        setDistance(data.features[0].properties.summary.distance / 1000);
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  useEffect(() => {
    const respondeRef = ref(database, `responders/${responderUid}`);
    const unsubscribe = onValue(respondeRef, (snapshot) => {
      const responderData = snapshot.val();

      if (responderData && responderData.locationCoords) {
        setResponderPosition({
          latitude: responderData.locationCoords.latitude,
          longitude: responderData.locationCoords.longitude,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading || !responderPosition) {
    return (
      <View className="flex w-full h-full items-center justify-center">
        <Image source={Logo} alt="Loading..." />
        <Text>Your map is loading...</Text>
      </View>
    );
  }

  const handleSelectEmergency = (emergency) => {
    setSelectedEmergency(emergency);
    setShowModal(false);
  };

  return (
    <View>
      {selectedEmergency && (
        <View className="p-2.5 items-center bg-white flex-row justify-between border-t-2 border-t-blue-500 absolute top-0 z-50 w-full">
          <Text>Distance: {distance.toFixed(2)} km</Text>
          <TouchableOpacity
            className="p-2.5 bg-blue-500 rounded-md"
            onPress={fetchRoute}
          >
            <Text className="text-white font-bold">Refresh Route</Text>
          </TouchableOpacity>
        </View>
      )}
      <FetchingData setIsProfileComplete={setIsProfileComplete} />
      <MapView
        className="w-full h-full"
        initialRegion={{
          ...responderPosition,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        <Marker
          coordinate={responderPosition}
          title="You are here"
          pinColor="#42a5f5"
          rotation={heading}
        >
          <Image source={responderMarker} className="h-12 w-12" />
        </Marker>
        {emergencyData.map((emergency) => (
          <Marker
            key={emergency.id}
            coordinate={emergency.location}
            pinColor="red"
            onPress={() => handleShowEmergencyDetails(emergency)}
          >
            {emergency.type === "noise" && (
              <Image source={drunk} className="h-14 w-12 animate-spin" />
            )}
          </Marker>
        ))}

        {route.length > 0 && (
          <Polyline coordinates={route} strokeColor="red" strokeWidth={2} />
        )}
      </MapView>

      <Modal transparent={true} animationType="slide" visible={showModal}>
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View
            className="flex w-full h-full items-center justify-center"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          >
            {emergencyDetails && (
              <View className="w-80 bg-white rounded-sm shadow-lg">
                <View className="flex p-2 justify-between flex-row bg-gray-200">
                  <Text className="text-lg font-bold">Emergency Id:</Text>
                  <Text className="text-lg">{emergencyDetails.id}</Text>
                </View>
                <View className="p-2 space-y-3">
                  <Text className="text-lg">Name: {emergencyDetails.name}</Text>
                  <Text className="text-lg">Type: {emergencyDetails.type}</Text>
                  <Text className="text-lg">
                    Description: {emergencyDetails.description}
                  </Text>
                  <Text className="text-lg">
                    {" "}
                    Submitted: {emergencyDetails.timestamp}
                  </Text>
                  <TouchableOpacity
                    className={`p-2.5 text-white items-center w-full rounded-md ${
                      selectedEmergency?.id === emergencyDetails.id &&
                      route.length > 0
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                    onPress={() => {
                      handleSelectEmergency(emergencyDetails);
                    }}
                  >
                    <Text className="text-white font-bold">
                      {selectedEmergency?.id === emergencyDetails.id &&
                      route.length > 0
                        ? "Responding..."
                        : "Navigate to this location"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default Home;
