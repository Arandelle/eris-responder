import { ref, remove, update } from "firebase/database";
import {
  View,
  TouchableWithoutFeedback,
  Text,
  TouchableOpacity,
  Modal,
  Alert
} from "react-native";
import { auth, database } from "../services/firebaseConfig";

const EmergencyDetailsModal = ({
  showModal,
  setShowModal,
  emergencyDetails,
  handleSelectEmergency,
  selectedEmergency,
  setSelectedEmergency,
  route,
  setRoute,
  setDistance
}) => {

  const handleEmergencyDone = (emergency) => {
    Alert.alert("Notice!", "Are you sure this emergency is done?", [
      {
        text: "cancel"
      },{
        text: "Sure",
        onPress: async ()=>{
          try{
            const user = auth.currentUser;
            if(user){
              await remove(ref(database, `responders/${user.uid}/pendingEmergency`));

              const updates = {}

               updates[`emergencyRequest/${emergency.id}/status`] = "done"
               updates[`users/${emergency.userId}/emergencyHistory/${emergency.id}/status`] = "done"

              await update(ref(database), updates);

              Alert.alert("Success!", "Emergency request succussfully done!");
              setSelectedEmergency(false)
              setRoute(0)
              setDistance(0)
            } else{
              console.log("No user available");
            }
          } catch(error){
            console.error("Error", error)
          }
        }
      }
    ])
  }

  return (
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
                  disabled={
                    selectedEmergency?.id === emergencyDetails.id &&
                    route.length > 0
                  }
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
                {selectedEmergency?.id === emergencyDetails.id &&
                  route.length > 0 && (
                    <TouchableOpacity className="p-2.5 items-center w-full rounded-md bg-green-500"
                    onPress={()=>handleEmergencyDone(emergencyDetails)}>
                      <Text className="text-white">Mark as done</Text>
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
