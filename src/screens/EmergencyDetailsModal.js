import { ref, remove, update } from "firebase/database";
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
  const handleEmergencyDone = (emergency) => {
    Alert.alert("Notice!", "Are you sure this emergency is done?", [
      {
        text: "cancel",
      },
      {
        text: "Sure",
        onPress: async () => {
          try {
            const user = auth.currentUser;
            if (user) {
              await remove(
                ref(database, `responders/${user.uid}/pendingEmergency`)
              );
              await remove(
                ref(database, `users/${emergency.userId}/activeRequest`)
              );

              const updates = {};

              updates[`emergencyRequest/${emergency.id}/status`] = "done";
              updates[
                `users/${emergency.userId}/emergencyHistory/${emergency.id}/status`
              ] = "done";

              await update(ref(database), updates);

              Alert.alert("Success!", "Emergency request succussfully done!");
              setSelectedEmergency(false);
              setRoute(0);
              setDistance(0);
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
          {emergencyDetails && (
            <View className="justify-center bg-white w-full absolute bottom-0 rounded-t-xl">
              <View className="flex p-3 justify-between flex-row bg-gray-200 rounded-t-xl">
                <Text className="text-lg font-bold">Emergency Id:</Text>
                <Text className="text-lg">{emergencyDetails.id}</Text>
              </View>

              <View className="flex p-3 flex-row items-center space-x-2">
              <View className="flex flex-col items-center justify-center space-y-2">
                  <Image
                    source={{
                      uri: "https://flowbite.com/docs/images/people/profile-picture-1.jpg",
                    }}
                    className="h-20 w-20 rounded-full"
                  />
                  <Text className="text-md font-bold text-blue-500">
                    {getTimeDifference(emergencyDetails.timestamp)}
                  </Text>
              </View>
                <View className="p-2 space-y-1">
                  <Text className="text-lg">{emergencyDetails.location}</Text>
                  <Text className="text-lg font-bold">
                    {emergencyDetails.name}
                  </Text>
                  <Text className="text-lg">
                    {emergencyDetails.type.toUpperCase()}
                  </Text>
                  <Text className="text-lg">
                    {emergencyDetails.description}
                  </Text>
                </View>
              </View>

              <View className="space-y-3 p-3 pt-0">
                <TouchableOpacity
                  disabled={
                    selectedEmergency?.id === emergencyDetails.id &&
                    route.length > 0
                  }
                  className={`py-3 text-white items-center w-full rounded-md ${
                    selectedEmergency?.id === emergencyDetails.id &&
                    route.length > 0
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
                  onPress={() => {
                    handleSelectEmergency(emergencyDetails);
                  }}
                >
                  <Text className="text-white font-bold text-lg">
                    {selectedEmergency?.id === emergencyDetails.id &&
                    route.length > 0
                      ? "Responding..."
                      : "Navigate to this location"}
                  </Text>
                </TouchableOpacity>
                {selectedEmergency?.id === emergencyDetails.id &&
                  route.length > 0 && (
                    <TouchableOpacity
                      className="py-3 items-center w-full rounded-md bg-green-500"
                      onPress={() => handleEmergencyDone(emergencyDetails)}
                    >
                      <Text className="text-white font-bold text-lg">
                        Mark as done
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
