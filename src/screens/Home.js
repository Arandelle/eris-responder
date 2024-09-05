import { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { ref,serverTimestamp, push, update } from "firebase/database";
import { auth, database } from "../services/firebaseConfig";
import responderMarker from "../../assets/ambulance.png";
import drunk from "../../assets/drunk.png";
import Logo from "../../assets/logo.png";
import ProfileReminderModal from "../components/ProfileReminderModal";
import useLocation from "../hooks/useLocation"
import useEmergencyData from "../hooks/useEmergencyData";
import useRoute from "../hooks/useRoute";
import EmergencyDetailsModal from "./EmergencyDetailsModal";
import { useFetchData } from "../hooks/useFetchData";

const Home = ({ responderUid }) => {
  const {userData} = useFetchData();
  const {responderPosition, loading: locationLoading } = useLocation(responderUid);
  const {emergencyData, loading: emergencyLoading} = useEmergencyData();
  const [selectedEmergency, setSelectedEmergency] = useState(null);
 
  const { route, distance, fetchRoute } = useRoute(responderPosition, selectedEmergency);
  const [emergencyDetails, setEmergencyDetails] = useState(null);
  const [heading, setHeading] = useState(0);
 
  const [showModal, setShowModal] = useState(false);

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
      const user = auth.currentUser;
      const historyRef = ref(database, `responders/${user.uid}/history`);
      const newHistoryEntry = {
        emergencyId: emergency.id,
        userId: emergency.userId,
        timestamp: serverTimestamp(),
        location: emergency.location,
        type: emergency.type,
        description: emergency.description,
        status: emergency.status,
        name: emergency.name,
      };
      await push(historyRef, newHistoryEntry);

      const notificationRefForUser = ref(database, `users/${emergency.userId}/notifications`);
      const newNotificationForUser = {
        type: "emergency",
        message: `Your responder is coming`,
        description: "Medical assistance is on your way",
        email: `${userData.email}`,
        isSeen: false,
        date: new Date().toISOString(),
        timestamp: serverTimestamp(),
        img: `${userData.img}`,
        icon: "hospital-box"
      }

      await push(notificationRefForUser, newNotificationForUser);

      const emergencyRef = ref(database, `emergencyRequest/${emergency.id}`);
      await update(emergencyRef, {status: "accepted"});

      Alert.alert("Success", "You have successfully accepted the emergency request");
      
    } catch (error) {
      console.error("Error: ", error);
    }
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
      <ProfileReminderModal />
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
            coordinate={emergency.locationCoords}
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
      <EmergencyDetailsModal
      showModal={showModal}
      setShowModal={setShowModal}
      emergencyDetails={emergencyDetails}
      handleSelectEmergency={handleSelectEmergency}
      selectedEmergency={selectedEmergency}
      route={route}
       />
    </View>
  );
};

export default Home;
