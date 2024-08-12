import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Image } from "react-native";
import MapView, { Polyline, Marker, Callout } from "react-native-maps";
import * as Location from 'expo-location';
import { OPENROUTE_API_KEY } from '@env'
import { ref, onValue, set } from "firebase/database";
import { database } from "../services/firebaseConfig";
import responderMarker from "../../assets/ambulance.png"

const openRouteKey = OPENROUTE_API_KEY;

const Home = ({responderUid}) => {
  const [responderPosition, setResponderPosition] = useState(null);
  const [heading, setHeading] = useState(0);
  const [emergencyData, setEmergencyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        setResponderPosition({ latitude: 14.33289, longitude: 120.85065 }); // Fallback position
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setResponderPosition({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      //watch position changes
      Location.watchPositionAsync({distanceInterval: 1}, (newLocation) => {
        const {latitude, longitude} = newLocation.coords;
        setResponderPosition({latitude, longitude});
        if (route.length > 0) {
          const newHeading = calculateBearing(latitude, longitude, route[1].latitude, route[1].longitude);
          setHeading(newHeading);
        }
        const responderRef = ref(database, `responders/${responderUid}`);
        set(responderRef, {latitude, longitude});
      });
    })();
  }, []);
  
  useEffect(() => {
    const requestRef = ref(database, "emergencyRequest");
    const unsubscribe = onValue(requestRef, (snapshot) => {
      try {
        const data = snapshot.val();
        const emergencyList = Object.entries(data)
          .filter(([_, emergency]) => emergency.location && emergency.status !== "done")
          .map(([id, emergency]) => ({
            id,
            name: emergency.name || "Unknown",
            type: emergency.type || "Unspecified",
            location: { latitude: emergency.location.latitude, longitude: emergency.location.longitude },
            status: emergency.status || "active",
            description: emergency.description || "none",
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
        const formattedRoute = coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0]
        }));
        setRoute(formattedRoute);
        setDistance(data.features[0].properties.summary.distance / 1000);
      }
    } catch (error) {
      console.error('Error fetching route:', error)
    }
  };

  useEffect(()=>{
    const respondeRef = ref(database,`responders/${responderUid}`);
    const unsubscribe = onValue(respondeRef, (snapshot) => {
      const location = snapshot.val();

      if(location){
        setResponderPosition({
          latitude: location.latitude,
          longitude: location.longitude
        });
      }
    });
    return ()=> unsubscribe();
  }, [])

  if (loading || !responderPosition) {
    return <View className="flex items-center justify-center w-full h-full"><Text>Loading...</Text></View>;
  }

  const handleSelectEmergency = (emergency) =>{
    setSelectedEmergency(emergency)
  }

  return (
    <View>
        {selectedEmergency && (
          <View className="p-2.5 items-center bg-white flex-row justify-between border-t-2 border-t-blue-500 absolute top-0 z-50 w-full">
            <Text>Distance: {distance.toFixed(2)} km</Text>
            <TouchableOpacity className="p-2.5 bg-blue-500 rounded-md" onPress={fetchRoute}>
              <Text className="text-white font-bold">Refresh Route</Text>
            </TouchableOpacity>
            </View>
        )}
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
         <Image source={responderMarker} className="h-12 w-12"/>
        </Marker>
        {emergencyData.map((emergency) => (
          <Marker
            key={emergency.id}
            coordinate={emergency.location}
            pinColor="red"
          >
            <Callout className="flex items-center justify-center p-2.5" onPress={()=> handleSelectEmergency(emergency)}>
              <View className="w-48 py-2.5">
                <Text className="font-bold text-center mb-2.5">Emergency Details</Text>
                <Text>Name: {emergency.name}</Text>
                <Text>Type: {emergency.type}</Text>
                <Text>Description: {emergency.description}</Text>
              </View>
              <TouchableOpacity className="p-2.5 text-white bg-green-500 items-center w-full rounded-md">
                  <Text>Route to this area</Text>
                </TouchableOpacity>
            </Callout>
          </Marker>
        ))}
        {route.length > 0 && (
          <Polyline coordinates={route} strokeColor="red" strokeWidth={2} />
        )}
      </MapView>
    </View>
  );
};

export default Home;
