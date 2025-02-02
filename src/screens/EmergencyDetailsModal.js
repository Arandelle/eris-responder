import { get, ref, remove, update, push,serverTimestamp } from "firebase/database";
import {
  View,
  TouchableWithoutFeedback,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
} from "react-native";
import { auth, database } from "../services/firebaseConfig";
import { getTimeDifference } from "../helper/getTimeDifference";
import useFetchData from "../hooks/useFetchData";

const EmergencyDetailsModal = ({
  showModal,
  setShowModal,
  emergencyDetails,
  handleSelectEmergency,
  selectedEmergency,
  setSelectedEmergency,
  route,
  setRoute,
  setDistance,
}) => {

  const {data: userData} = useFetchData("users")
  const userDetails = userData?.find((user) => user.id === emergencyDetails?.userId);

  const handleEmergencyDone = (emergency) => {
    Alert.alert("Notice!", "Are you sure this emergency is resolved?", [
      {
        text: "cancel",
      },
      {
        text: "Mark as  Resolved",
        onPress: async () => {
          try {
            const user = auth.currentUser;
            if (user) {

              const responderDataRef = ref(database, `responders/${user.uid}/pendingEmergency`);
              const responderSnapshot = await get(responderDataRef);

              if(responderSnapshot.exists()){
                const responderData = responderSnapshot.val();
                const historyId = responderData?.historyId;

                await remove(ref(database, `responders/${user.uid}/pendingEmergency`));
                await remove(ref(database, `users/${emergency.userId}/activeRequest`));

                const notificationRefForUser = ref(database, `users/${emergency.userId}/notifications`);
                const newNotificationForUser = {
                  responderId: user.uid,
                  type: "responder",
                  title: "Emergency report resolved!",
                  message: `Your report for ${emergency.type} has been resolved`,
                  isSeen: false,
                  date: new Date().toISOString(),
                  timestamp: serverTimestamp(),
                  icon: "shield-check"
                }

                await push(notificationRefForUser, newNotificationForUser);
  
                const updates = {};
                updates[`emergencyRequest/${emergency.id}/status`] = "resolved";
                updates[
                  `users/${emergency.userId}/emergencyHistory/${emergency.id}/status`
                ] = "resolved";
                updates[
                  `responders/${user.uid}/history/${historyId}/status`
                ] = "resolved";

                updates[`emergencyRequest/${emergency.id}/dateResolved`] = new Date().toISOString();
                updates[
                  `users/${emergency.userId}/emergencyHistory/${emergency.id}/dateResolved`
                ] = new Date().toISOString();
                updates[
                  `responders/${user.uid}/history/${historyId}/dateResolved`
                ] =new Date().toISOString();
  
                await update(ref(database), updates);
  
                Alert.alert("Success!", "Emergency request succussfully resolved!");
                setSelectedEmergency(false);
                setRoute(0);
                setDistance(0);
                setShowModal(false);

              } else{
                console.log("No pending emergency")
              }
           
            } else {
              console.log("No user available");
            }
          } catch (error) {
            console.error("Error", error);
          }
        },
      },
    ]);
  };

  return (
    <Modal transparent={true} animationType="slide" visible={showModal}>
      <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
        <View
          className="flex w-full h-full"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          {emergencyDetails &&  (
            <View className=" bg-white w-full absolute bottom-0 rounded-t-xl">
              <View className="flex p-3 justify-between flex-row bg-gray-200 rounded-t-xl">
                <Text className="text-lg font-bold">Emergency Id:</Text>
                <Text className="text-lg">{emergencyDetails.emergencyId}</Text>
              </View>

              <View className="flex px-3 py-6 flex-row items-center space-x-2">
              <View className="flex flex-col items-center space-y-3">
                  <Image
                    source={{
                      uri: userDetails?.img,
                    }}
                    className="h-20 w-20 rounded-full"
                  />
                  <Text className="text-md font-bold text-blue-500">
                    {getTimeDifference(emergencyDetails.timestamp)}
                  </Text>
              </View>
                <View className="p-2 space-y-3">
                 <View className="flex flex-row items-center space-x-2">
                    <Text className="text-lg font-bold">
                      {userDetails?.fullname}
                    </Text>
                    <Text className="p-1 rounded-lg bg-yellow-100">{userDetails?.customId}</Text>
                 </View>
                 <Text className="text-lg">{userDetails?.location.address}</Text>
                  <Text className="text-lg bg-yellow-100 p-2 rounded-lg max-w-xs">
                    {emergencyDetails.description ?? "No description`"}
                  </Text>
                </View>
              </View>

              <View className="space-y-3 px-3 py-4 pt-0">
                <TouchableOpacity
                  disabled={
                    selectedEmergency?.id === emergencyDetails.emergencyId &&
                    route.length > 0
                  }
                  className={`py-3 text-white items-center w-full rounded-md ${
                    selectedEmergency?.id === emergencyDetails.emergencyId &&
                    route.length > 0
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
                  onPress={() => {
                    handleSelectEmergency(emergencyDetails);
                  }}
                >
                  <Text className="text-white font-bold text-lg">
                    {selectedEmergency?.id === emergencyDetails.emergencyId &&
                    route.length > 0
                      ? "Responding..."
                      : "Navigate to this location"}
                  </Text>
                </TouchableOpacity>
                {selectedEmergency?.id === emergencyDetails?.emergencyId &&
                  route.length > 0 && (
                    <TouchableOpacity
                      className="py-3 items-center w-full rounded-md bg-gray-500"
                      onPress={() => handleEmergencyDone(emergencyDetails)}
                    >
                      <Text className="text-white font-bold text-lg">
                        Mark as resolved
                      </Text>
                    </TouchableOpacity>
                  )}
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default EmergencyDetailsModal;
