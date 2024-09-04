import {View,TouchableWithoutFeedback,Text,TouchableOpacity, Modal } from "react-native"

const EmergencyDetailsModal = ({showModal,setShowModal, emergencyDetails,handleSelectEmergency,selectedEmergency, route }) => {
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
  )
}

export default EmergencyDetailsModal
