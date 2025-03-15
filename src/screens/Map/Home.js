import { useEffect, useState, useMemo, useCallback } from "react";
import { Text, View, Image, Alert } from "react-native";
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

  // use hooks for selecting and marking as done for the emergency
  const { handleSelectEmergency, handleEmergencyDone, selectedEmergency } =
    useEmergencyFunction(
      setIsEmergencyDone,
      setRoute,
      setDistance,
      currentUser
    );

  // get route when it has selected emergency (pending)
  useRoute(
    responderPosition,
    selectedEmergency,
    setDistance,
    setRoute
  );

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
      <MapView
        className="flex-1"
        initialRegion={{
          ...responderPosition,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }}
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
