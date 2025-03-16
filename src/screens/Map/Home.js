import { useEffect, useState, useMemo, useCallback, act } from "react";
import { Text, View, Image, Alert, TouchableOpacity } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { ref, set } from "firebase/database";
import { database } from "../../services/firebaseConfig";
import responderMarker from "../../../assets/ambulance.png";
import Logo from "../../../assets/logo.png";
import ProfileReminderModal from "../../components/ProfileReminderModal";
import useLocation from "../../hooks/useLocation";
import useRoute from "../../hooks/useRoute";
import useCurrentUser from "../../hooks/useCurrentUser";
import useFetchData from "../../hooks/useFetchData";
import MyDialog from "../../components/MyDialog";
import EmergencyDetailsContent from "../../components/EmergencyDetailsContent";
import Hotlines from "./Hotlines";
import useEmergencyFunction from "./useEmergencyFunction";

const Home = ({ responderUid }) => {
  const { data: emergencyData, loading: emergencyLoading } =
    useFetchData("emergencyRequest");
  const { data: userData } = useFetchData("users");
  const { data: hotlines } = useFetchData("hotlines");
  const { currentUser } = useCurrentUser();
  const { responderPosition, loading: locationLoading } =
    useLocation(responderUid);
  const [distance, setDistance] = useState(0);
  const [route, setRoute] = useState([]);
  const [emergencyDetails, setEmergencyDetails] = useState(null); // emergency details
  const [isEmergencyDone, setIsEmergencyDone] = useState(false);
  const [logMessage, setLogMessage] = useState("");
  const [recommendedHotlines, setRecommendedHotlines] = useState([]);
  const [showRecommended, setShowRecommended] = useState(false);

  const [region, setRegion] = useState(null);
  const [isOutOfScreen, setIsOutOfScreen] = useState(false);

  // Add this function to calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // use hooks for selecting and marking as done for the emergency
  const { handleSelectEmergency, handleEmergencyDone, selectedEmergency } =
    useEmergencyFunction(
      setIsEmergencyDone,
      setRoute,
      setDistance,
      currentUser
    );

  // get route when it has selected emergency (pending)
  useRoute(responderPosition, selectedEmergency, setDistance, setRoute);

  // set the value of region, ensure the responder position is exists first
  useEffect(() => {
    if (responderPosition?.latitude && responderPosition?.longitude) {
      setRegion({
        latitude: responderPosition.latitude,
        longitude: responderPosition.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      });
    }
  }, [responderPosition]);

  // to check the recommended hotlines
  useEffect(() => {
    if (selectedEmergency && emergencyDetails) {
      const recommended =
        Array.isArray(hotlines) &&
        hotlines.filter(
          (hotlines) => hotlines.category === emergencyDetails.emergencyType
        );
      setRecommendedHotlines(recommended || []);
    }
  }, [selectedEmergency, emergencyDetails, hotlines]);

  // Memoize filtered emergency data
  const activeEmergencies = useMemo(
    () =>
      emergencyData.filter(
        (emergency) =>
          emergency.status === "pending" || emergency.status === "on-going"
      ),
    [emergencyData]
  );

  // In your useEffect that checks for out-of-screen emergencies
  useEffect(() => {
    if (!region || activeEmergencies.length === 0 || !responderPosition) return;

    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;

    // Filter only the pending emergencies
    const pendingEmergencies = activeEmergencies.filter(
      (emergency) => emergency.status === "pending"
    );

    // Check which emergencies are out of screen
    const outOfScreenEmergencies = pendingEmergencies.filter((emergency) => {
      const { latitude: emergencyLat, longitude: emergencyLng } =
        emergency.location;

      return !(
        emergencyLat > latitude - latitudeDelta / 2 &&
        emergencyLat < latitude + latitudeDelta / 2 &&
        emergencyLng > longitude - longitudeDelta / 2 &&
        emergencyLng < longitude + longitudeDelta / 2
      );
    });

    setIsOutOfScreen(outOfScreenEmergencies.length > 0);

    // Find nearest emergency among those out of screen
    if (outOfScreenEmergencies.length > 0) {
      const emergenciesWithDistance = outOfScreenEmergencies.map(
        (emergency) => ({
          ...emergency,
          distance: calculateDistance(
            responderPosition.latitude,
            responderPosition.longitude,
            emergency.location.latitude,
            emergency.location.longitude
          ),
        })
      );

      // Sort by distance
      emergenciesWithDistance.sort((a, b) => a.distance - b.distance);

      // Store the nearest emergency
      setNearestEmergency(emergenciesWithDistance[0]);
    } else {
      setNearestEmergency(null);
    }
  }, [region, activeEmergencies, responderPosition]);

  // Add this state
  const [nearestEmergency, setNearestEmergency] = useState(null);

  // Then modify your navigation function
  const navigateToNearestEmergency = () => {
    if (nearestEmergency) {
      // Adjust the zoom level based on distance
      const zoomLevel = Math.min(
        0.04,
        Math.max(0.004, nearestEmergency.distance * 0.02)
      );

      setRegion({
        latitude: nearestEmergency.location.latitude,
        longitude: nearestEmergency.location.longitude,
        latitudeDelta: zoomLevel,
        longitudeDelta: zoomLevel,
      });

      // Optionally, show emergency details
      handleShowEmergencyDetails(nearestEmergency);
    }
  };

  // Memoize user details
  const userDetails = useMemo(
    () => userData?.find((user) => user.id === emergencyDetails?.userId),
    [userData, emergencyDetails?.userId]
  );

  // Memoize handlers
  const handleShowEmergencyDetails = useCallback((emergency) => {
    setEmergencyDetails(emergency);
  }, []);

  const addMessageLog = async (id, logMessage) => {
    if (!id) {
      console.error("Error: Emergency ID is undefined!");
      return; // Prevent Firebase error
    }

    try {
      const emergencyRef = ref(database, `emergencyRequest/${id}/messageLog`);
      await set(emergencyRef, logMessage);
      setEmergencyDetails(null);
      setLogMessage("");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  if (emergencyLoading || locationLoading || !responderPosition) {
    return (
      <View className="flex w-full h-full items-center justify-center">
        <Image source={Logo} alt="Loading..." />
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <>
      <ProfileReminderModal />
      {/** dialog to narate the process of emergency */}
      <MyDialog
        visible={isEmergencyDone}
        setVisible={setIsEmergencyDone}
        title={"Emergency Resolve!"}
        subMesage={"Short description how you resolved the issue"}
        onChangeText={setLogMessage}
        value={logMessage}
        onPress={() => addMessageLog(emergencyDetails?.id, logMessage)}
      />

      {isOutOfScreen && (
        <TouchableOpacity
          className="absolute top-10 self-center bg-green-500 z-50 p-2 rounded-md"
          onPress={navigateToNearestEmergency}
        > 
          <Text className="text-white text-center">
           🚨 Navigate to nearest emergency 
          </Text>
          <Text className="text-white text-center text-lg font-thin">(
            {nearestEmergency
              ? `${nearestEmergency.distance.toFixed(1)} km away`
              : "Go to emergency!"}
            )</Text>
        </TouchableOpacity>
      )}

      <MapView
        className="flex-1"
        initialRegion={region}
        onRegionChangeComplete={setRegion}
      >
        <Marker coordinate={responderPosition} title="Your Location">
          <Image source={responderMarker} className="h-10 w-10" />
        </Marker>

        {activeEmergencies.map((emergency) => (
          <Marker
            key={emergency.id}
            coordinate={{
              latitude: emergency.location.latitude,
              longitude: emergency.location.longitude,
            }}
            pinColor={emergency.status === "pending" ? "red" : "yellow"}
            onPress={() => handleShowEmergencyDetails(emergency)}
          />
        ))}

        {route.length > 0 && (
          <Polyline coordinates={route} strokeColor="red" strokeWidth={2} />
        )}
      </MapView>

      {/** display the total distance and recommended hotlines */}
      {selectedEmergency && distance > 0 && (
        <Hotlines
          distance={distance}
          showRecommended={showRecommended}
          recommendedHotlines={recommendedHotlines}
          setShowRecommended={setShowRecommended}
        />
      )}

      {emergencyDetails && (
        <EmergencyDetailsContent
          emergencyDetails={emergencyDetails}
          userDetails={userDetails}
          selectedEmergency={selectedEmergency}
          route={route}
          onNavigate={() => handleSelectEmergency(emergencyDetails)}
          onMarkResolved={() => handleEmergencyDone(emergencyDetails)}
          onClose={() => setEmergencyDetails(null)}
        />
      )}
    </>
  );
};

export default Home;
