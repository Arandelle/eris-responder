import { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Button } from "react-native";
import { useFetchData } from "../hooks/useFetchData";
import { getTimeDifference } from "../helper/getTimeDifference";
import { formatDate } from "../helper/FormatDate";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useNotificationData } from "../hooks/useNotificationData";

const Notification = () => {
  const navigation = useNavigation();
  const { userData } = useFetchData();
  const {notificationsCount,notifications, handleSpecificNotification, markAllNotificationsAsRead } = useNotificationData();
  const [viewAll, setViewAll] = useState(false);

  const displayedNotifications = viewAll ? notifications : notifications.slice(0,6); // it's like telling viewAll is true? then show all notifications else slice it to 7

  const notificationData = {
    users: "bg-red-500",
    updateProfile: "bg-blue-500",
    emergency: "bg-orange-500 "
  };

  return (
   <>
   {notificationsCount !== 0 && (
    <TouchableOpacity className="sticky" onPress={markAllNotificationsAsRead}>
      <Text className="bg-white p-2 text-center text-lg text-blue-500 rounded-md">Mark all as read</Text>
    </TouchableOpacity>
   )}
      <ScrollView className="bg-white">
        <View className="h-full w-full">
    
    {displayedNotifications.length > 0 ? (
      displayedNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => {
                handleSpecificNotification(notification.id);
                if (userData?.profileComplete && notification.type === "users") {
                  navigation.navigate("Profile");
                } else if(notification.type === "emergency"){
                  navigation.navigate("Map");
                }
                else {
                  navigation.navigate("UpdateProfile");
                }
              }}
            >
              <View
                className={`flex flex-row justify-between p-4 ${
                  notification.isSeen ? "bg-white" : "bg-blue-50"
                }`}
              >
                <View className="relative">
                 <View>
                    <Image
                      source={{ uri: notification.img }}
                      className="rounded-full h-14 w-14 border-4 border-blue-500"
                    />
                    <View
                      className={`absolute bottom-0 right-0 ${
                        notificationData[notification.type]
                      } rounded-full p-1 border-2 border-white`}
                    >
                      <Icon name={notification.icon} size={16} color={"white"} />
                    </View>
                 </View>
                </View>
                <View className="pl-4 flex-1">
                  <View className="text-sm mb-1 text-gray-600">
                    <Text className="font-semibold text-lg text-gray-800">
                      {notification.title}
                    </Text>
                    <Text>{notification.message.toUpperCase()}</Text>
                  </View>
                  <View className="flex flex-row justify-between text-xs text-gray-500">
                    <Text>{getTimeDifference(notification.timestamp)}</Text>
                    <Text className="text-blue-500">
                      {formatDate(notification.date)}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
    ) : (
     <View className="flex items-center justify-center mt-60"> 
     <Text className="text-center text-xl text-gray-500">No notification found</Text>
     </View>
    )}
        
          {!viewAll && notifications.length > 6 && ( // is viewAll true? and notifications is more than seven? then show the button
                <TouchableOpacity
                  className="mx-3 my-2 rounded-md p-2.5 text-center text-gray-500 bg-gray-200"
                  onPress={() => setViewAll(true)}
                >
                  <Text className="text-center text">
                    See previous notification
                  </Text>
                </TouchableOpacity>
              )}
        </View>
      </ScrollView>
   </>
  );
};

export default Notification;
