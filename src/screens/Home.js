import { useEffect, useState } from "react";
import { Text, View, Image, Alert } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { ref, serverTimestamp, push, update, onValue } from "firebase/database";
import { auth, database } from "../services/firebaseConfig";
import responderMarker from "../../assets/ambulance.png";
import Logo from "../../assets/logo.png";
import ProfileReminderModal from "../components/ProfileReminderModal";
import useLocation from "../hooks/useLocation";
import useEmergencyData from "../hooks/useEmergencyData";
import useRoute from "../hooks/useRoute";
import EmergencyDetailsModal from "./EmergencyDetailsModal";
import { useFetchData } from "../hooks/useFetchData";

const Home = ({ responderUid }) => {
  const { userData } = useFetchData();
  const { responderPosition, loading: locationLoading } =
    useLocation(responderUid);
  const { emergencyData, loading: emergencyLoading } = useEmergencyData();
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const { route, setRoute, distance, setDistance } = useRoute(
    responderPosition,
    selectedEmergency
  );
  const [emergencyDetails, setEmergencyDetails] = useState(null);
  const [heading, setHeading] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    const respondeRef = ref(
      database,
      `responders/${user.uid}/pendingEmergency`
    );
    const unsubscribe = onValue(respondeRef, (snapshot) => {
      const responderData = snapshot.val();

      if (responderData && responderData.locationCoords) {
        setSelectedEmergency({
          latitude: responderData.locationCoords.latitude,
          longitude: responderData.locationCoords.longitude,
          id: responderData.emergencyId,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (responderPosition && !userData.pendingEmergency) {
      Alert.alert("Have a nice day!", "No emergency request yet");
    }
  }, []);

  const handleShowEmergencyDetails = (emergency) => {
    setEmergencyDetails(emergency);
    setShowModal(true);
  };

  if (emergencyLoading || locationLoading || !responderPosition) {
    return (
      <View className="flex w-full h-full items-center justify-center">
        <Image source={Logo} alt="Loading..." />
        <Text>Your map is loading...</Text>
      </View>
    );
  }

  const handleSelectEmergency = async (emergency) => {
    try {
      // if (userData.pendingEmergency) {
      //   Alert.alert(
      //     "Error Navigating",
      //     "You have on-going emergency,please make sure to assist them first"
      //   );
      //   return;
      // }
      const user = auth.currentUser;
      const historyRef = ref(database, `responders/${user.uid}/history`);
      const newHistoryEntry = {
        emergencyId: emergency.emergencyId,
        userId: emergency.userId,
        timestamp: serverTimestamp(),
        location: emergency.location.address,
        description: emergency.description ?? "No description",
        status: "on-going",
        date: emergency.date,
        responseTime: new Date().toISOString(),
      };
      const newHistoryRef = await push(historyRef, newHistoryEntry);
      const historyId = newHistoryRef.key;

      // Update responder's on-going emergency assistance
      await update(ref(database, `responders/${user.uid}/`), {
        pendingEmergency: {
          userId: emergency.userId,
          emergencyId: emergency.emergencyId,
          historyId: historyId,
          locationCoords: {
            latitude: emergency.location.latitude,
            longitude: emergency.location.longitude,
          },
        },
      });

      const notificationRefForUser = ref(
        database,
        `users/${emergency.userId}/notifications`
      );
      const newNotificationForUser = {
        responderId: user.uid,
        type: "responder",
        title: `Emergency report receieved!`,
        message: `Your report for ${emergency.type} has been recieved. Help is on the way`,
        isSeen: false,
        date: new Date().toISOString(),
        timestamp: serverTimestamp(),
        icon: "car-emergency",
      };

      await push(notificationRefForUser, newNotificationForUser);

      const updates = {};

      updates[`emergencyRequest/${emergency.id}/status`] = "on-going";
      updates[
        `users/${emergency.userId}/emergencyHistory/${emergency.id}/status`
      ] = "on-going";

      updates[`emergencyRequest/${emergency.id}/locationOfResponder`] = {
        latitude: userData.location.latitude,
        longitude: userData.location.longitude,
      };

      updates[
        `users/${emergency.userId}/emergencyHistory/${emergency.id}/locationOfResponder`
      ] = {
        latitude: userData?.location.latitude,
        longitude: userData?.location.longitude,
      };

      updates[`emergencyRequest/${emergency.id}/responderId`] =
        user.uid;
      updates[
        `users/${emergency.userId}/emergencyHistory/${emergency.id}/responderId`
      ] = user.uid;

      updates[`users/${emergency.userId}/activeRequest/responderId`] = user.uid;
      updates[`users/${emergency.userId}/activeRequest/locationOfResponder`] = {
        latitude: userData.location.latitude,
        longitude: userData.location.longitude,
      };

      updates[`emergencyRequest/${emergency.id}/responseTime`] = new Date().toISOString();
      updates[
        `users/${emergency.userId}/emergencyHistory/${emergency.id}/responseTime`
      ] = new Date().toISOString();

      await update(ref(database), updates);

      Alert.alert(
        "Success",
        "We are counting on you to ensure a successful resolution"
      );
    } catch (error) {
      console.error("Error: ", error);
    }
    setShowModal(false);
    console.log(selectedEmergency)
  };

  return (
    <View className="flex-1">
      <ProfileReminderModal />
      <MapView
        className="flex-1"
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
        {emergencyData
          .filter(
            (emergency) =>
              emergency.status === "awaiting response" ||
              emergency.status === "on-going"
          )
          .map((emergency, key) => (
            <Marker
              key={key}
              coordinate={{
                latitude: emergency.location.latitude,
                longitude: emergency.location.longitude,
              }}
              pinColor={
                emergency.status === "awaiting response" ? "red" : "yellow"
              }
              onPress={() => handleShowEmergencyDetails(emergency)}
            />
          ))}

        {route.length > 0 && (
          <Polyline coordinates={route} strokeColor="red" strokeWidth={2} />
        )}
      </MapView>

      {selectedEmergency && distance > 0 && (
        <View className="bg-gray-500 p-2">
          <Text className="text-white text-lg">
            Distance to user: {distance.toFixed(2)} km
          </Text>
        </View>
      )}

      <EmergencyDetailsModal
        showModal={showModal}
        setShowModal={setShowModal}
        emergencyDetails={emergencyDetails}
        handleSelectEmergency={handleSelectEmergency}
        selectedEmergency={selectedEmergency}
        setSelectedEmergency={setSelectedEmergency}
        route={route}
        setRoute={setRoute}
        setDistance={setDistance}
      />
    </View>
  );
};

export default Home;
