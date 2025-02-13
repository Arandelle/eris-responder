import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Text, View, Image, Alert, TouchableOpacity } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { ref, serverTimestamp, push, update, onValue, get, remove } from "firebase/database";
import { auth, database } from "../services/firebaseConfig";
import responderMarker from "../../assets/ambulance.png";
import Logo from "../../assets/logo.png";
import ProfileReminderModal from "../components/ProfileReminderModal";
import useLocation from "../hooks/useLocation";
import useRoute from "../hooks/useRoute";
import useCurrentUser from "../hooks/useCurrentUser";
import useFetchData from "../hooks/useFetchData";
import MyBottomSheet from "../components/MyBottomSheet";
import { getTimeDifference } from "../helper/getTimeDifference";

// Separate EmergencyDetailsContent component for better organization
const EmergencyDetailsContent = ({
  emergencyDetails,
  userDetails,
  selectedEmergency,
  route,
  onNavigate,
  onMarkResolved,
}) => {
  const severity = emergencyDetails?.type?.toLowerCase().includes("crime")
    ? "bg-red-100"
    : "bg-yellow-100";
  const isResponding =
    selectedEmergency?.id === emergencyDetails?.emergencyId && route.length > 0;

  return (
    <View className="bg-white w-full rounded-t-xl">
      <View className="flex p-4 justify-between items-center flex-row bg-gray-100 rounded-t-xl border-b border-gray-200">
        <View>
          <Text className="text-lg font-bold text-gray-800 uppercase">
            {emergencyDetails?.emergencyType}
          </Text>
          <Text className="text-sm text-gray-600">
            ID: {emergencyDetails?.emergencyId}
          </Text>
        </View>
        <Text>{}</Text>
      </View>

      <View className="flex px-4 py-6 space-y-4">
        {/* User Info Section */}
        <View className="flex flex-row items-start space-x-4">
          <Image
            source={{ uri: userDetails?.img }}
            className="h-16 w-16 rounded-full"
          />
          <View className="flex-1">
            <View className="flex flex-row items-center space-x-2 mb-1">
              <Text className="text-lg font-bold text-gray-800">
                {userDetails?.fullname}
              </Text>
              <Text className="px-2 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm">
                {userDetails?.customId}
              </Text>
            </View>
            <Text className="text-gray-600">
              📍{userDetails?.location?.address}
            </Text>
            <Text className="text-sm text-blue-600 mt-1">
              Reported {getTimeDifference(emergencyDetails?.timestamp)}
            </Text>
          </View>
        </View>

        {/* Emergency Description */}
        {emergencyDetails?.description && (
          <View className={`p-4 rounded-lg ${severity}`}>
            <Text className="text-gray-800 leading-relaxed">
              {emergencyDetails.description}
            </Text>
          </View>
        )}

        <Image source={{uri: emergencyDetails?.imageUrl}} className="h-60 w-60"/>

        {/* Action Buttons */}
        <View className="pt-2">
          <TouchableOpacity
            className={`py-4 items-center w-full rounded-lg ${
              isResponding ? "bg-green-600" : "bg-blue-600"
            }`}
            onPress={isResponding ? onMarkResolved : onNavigate}
          >
            <Text className="text-white font-bold text-lg">
              {isResponding ? "Mark as resolved" : "Respond to Emergency"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const Home = ({ responderUid }) => {
  const bottomSheetRef = useRef(null);
  const { data: emergencyData, loading: emergencyLoading } =
    useFetchData("emergencyRequest");
  const { currentUser } = useCurrentUser();
  const { responderPosition, loading: locationLoading } =
    useLocation(responderUid);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const { route, setRoute, distance, setDistance } = useRoute(
    responderPosition,
    selectedEmergency
  );
  const [emergencyDetails, setEmergencyDetails] = useState(null);
  const [heading, setHeading] = useState(0);

  const { data: userData } = useFetchData("users");

  // Memoize filtered emergency data
  const activeEmergencies = useMemo(
    () =>
      emergencyData.filter(
        (emergency) =>
          emergency.status === "awaiting response" ||
          emergency.status === "on-going"
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
    bottomSheetRef.current?.openBottomSheet();
  }, []);

  const handleSelectEmergency = useCallback(
    async (emergency) => {
      try {
        if (currentUser?.pendingEmergency) {
          Alert.alert(
            "Error Navigating",
            "You have an ongoing emergency. Please assist them first."
          );
          return;
        }

        const user = auth.currentUser;

        // Create history entry
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

        // Batch updates for better performance
        const updates = {
          [`responders/${user.uid}/pendingEmergency`]: {
            userId: emergency.userId,
            emergencyId: emergency.emergencyId,
            historyId: historyId,
            locationCoords: {
              latitude: emergency.location.latitude,
              longitude: emergency.location.longitude,
            },
          },
          [`emergencyRequest/${emergency.id}/status`]: "on-going",
          [`emergencyRequest/${emergency.id}/locationOfResponder`]: {
            latitude: currentUser?.location.latitude,
            longitude: currentUser?.location.longitude,
          },
          [`emergencyRequest/${emergency.id}/responderId`]: user.uid,
          [`emergencyRequest/${emergency.id}/responseTime`]:
            new Date().toISOString(),
          [`users/${emergency.userId}/emergencyHistory/${emergency.id}/status`]:
            "on-going",
          [`users/${emergency.userId}/emergencyHistory/${emergency.id}/locationOfResponder`]:
            {
              latitude: currentUser?.location.latitude,
              longitude: currentUser?.location.longitude,
            },
          [`users/${emergency.userId}/emergencyHistory/${emergency.id}/responderId`]:
            user.uid,
          [`users/${emergency.userId}/emergencyHistory/${emergency.id}/responseTime`]:
            new Date().toISOString(),
          [`users/${emergency.userId}/activeRequest/responderId`]: user.uid,
          [`users/${emergency.userId}/activeRequest/locationOfResponder`]: {
            latitude: currentUser?.location.latitude,
            longitude: currentUser?.location.longitude,
          },
        };

        // Create notification
        const notificationRef = ref(
          database,
          `users/${emergency.userId}/notifications`
        );
        await push(notificationRef, {
          responderId: user.uid,
          type: "responder",
          title: "Emergency Response Dispatched",
          message: `A responder has been dispatched for your ${emergency.type} emergency.`,
          isSeen: false,
          date: new Date().toISOString(),
          timestamp: serverTimestamp(),
          icon: "car-emergency",
        });

        await update(ref(database), updates);

        Alert.alert(
          "Response Initiated",
          "You have been assigned to this emergency. Please proceed to the location."
        );

        bottomSheetRef.current?.closeBottomSheet();
      } catch (error) {
        console.error("Error selecting emergency:", error);
        Alert.alert(
          "Error",
          "Failed to process emergency response. Please try again."
        );
      }
    },
    [currentUser]
  );

  const handleEmergencyDone = useCallback((emergency) => {
    Alert.alert("Notice!", "Are you sure this emergency is resolved?", [
      {
        text: "cancel",
      },
      {
        text: "Mark as Resolved",
        onPress: async () => {
          try {
            const user = auth.currentUser;
            if (user) {
              const responderDataRef = ref(
                database,
                `responders/${user.uid}/pendingEmergency`
              );
              const responderSnapshot = await get(responderDataRef);
  
              if (responderSnapshot.exists()) {
                const responderData = responderSnapshot.val();
                const historyId = responderData?.historyId;
  
                await remove(
                  ref(database, `responders/${user.uid}/pendingEmergency`)
                );
                await remove(ref(database, `users/${emergency.userId}/activeRequest`));
  
                const notificationRefForUser = ref(
                  database,
                  `users/${emergency.userId}/notifications`
                );
                await push(notificationRefForUser, {
                  responderId: user.uid,
                  type: "responder",
                  title: "Emergency report resolved!",
                  message: `Your report for ${emergency.type} has been resolved`,
                  isSeen: false,
                  date: new Date().toISOString(),
                  timestamp: serverTimestamp(),
                  icon: "shield-check",
                });
  
                const updates = {
                  [`emergencyRequest/${emergency.id}/status`]: "resolved",
                  [`users/${emergency.userId}/emergencyHistory/${emergency.id}/status`]: "resolved",
                  [`responders/${user.uid}/history/${historyId}/status`]: "resolved",
                  [`emergencyRequest/${emergency.id}/dateResolved`]: new Date().toISOString(),
                  [`users/${emergency.userId}/emergencyHistory/${emergency.id}/dateResolved`]: new Date().toISOString(),
                  [`responders/${user.uid}/history/${historyId}/dateResolved`]: new Date().toISOString(),
                };
  
                await update(ref(database), updates);
  
                Alert.alert("Success!", "Emergency request successfully resolved!");
                setSelectedEmergency(false);
                setRoute(0);
                setDistance(0);
              } else {
                console.log("No pending emergency");
              }
            } else {
              console.log("No user available");
            }
            bottomSheetRef.current?.closeBottomSheet();
          } catch (error) {
            console.error("Error", error);
          }
        },
      },
    ]);
  }, []);
  

  // Effect for pending emergency subscription
  useEffect(() => {
    const user = auth.currentUser;
    const respondeRef = ref(
      database,
      `responders/${user.uid}/pendingEmergency`
    );

    return onValue(respondeRef, (snapshot) => {
      const responderData = snapshot.val();
      if (responderData?.locationCoords) {
        setSelectedEmergency({
          latitude: responderData.locationCoords.latitude,
          longitude: responderData.locationCoords.longitude,
          id: responderData.emergencyId,
        });
      }
    });
  }, []);

  if (emergencyLoading || locationLoading || !responderPosition) {
    return (
      <View className="flex w-full h-full items-center justify-center">
        <Image source={Logo} alt="Loading..." />
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ProfileReminderModal />
      <MapView
        className="flex-1"
        initialRegion={{
          ...responderPosition,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }}
      >
        <Marker
          coordinate={responderPosition}
          title="Your Location"
          rotation={heading}
        >
          <Image source={responderMarker} className="h-10 w-10" />
        </Marker>

        {activeEmergencies.map((emergency) => (
          <Marker
            key={emergency.id}
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
        <View className="absolute top-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg">
          <Text className="text-lg font-semibold">
            Distance to emergency: {distance.toFixed(2)} km
          </Text>
        </View>
      )}

      <MyBottomSheet ref={bottomSheetRef}>
        {emergencyDetails && (
          <EmergencyDetailsContent
            emergencyDetails={emergencyDetails}
            userDetails={userDetails}
            selectedEmergency={selectedEmergency}
            route={route}
            onNavigate={() => handleSelectEmergency(emergencyDetails)}
            onMarkResolved={() => handleEmergencyDone(emergencyDetails)}
          />
        )}
      </MyBottomSheet>
    </View>
  );
};

export default Home;
