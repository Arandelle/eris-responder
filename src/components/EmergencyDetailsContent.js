import { useMemo } from "react";
import { View,Text,Image, TouchableOpacity  } from "react-native";
import {getTimeDifference} from "../helper/getTimeDifference"

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
    const isResponding = useMemo(() => {
      return Boolean(selectedEmergency?.id === emergencyDetails?.emergencyId && route.length > 0)
    }, [selectedEmergency?.id, emergencyDetails?.emergencyId, route.length]);
     
    return (
      <View className="">
        <View className="flex p-4 justify-between items-center flex-row bg-gray-100 border-b border-gray-200">
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
          {emergencyDetails?.imageUrl && (
            <Image source={{uri: emergencyDetails?.imageUrl}} className="h-60 w-60"/>
          )}
         
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

  export default EmergencyDetailsContent;