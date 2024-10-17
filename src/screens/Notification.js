import { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useFetchData } from "../hooks/useFetchData";
import { getTimeDifference } from "../helper/getTimeDifference";
import { formatDate } from "../helper/FormatDate";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useNotificationData } from "../hooks/useNotificationData";
import useFetchUser from "../hooks/useFetchUser";

const Notification = () => {
  const {
    notificationsCount,
    notifications,
    markAllNotificationsAsRead,
  } = useNotificationData();
  const [viewAll, setViewAll] = useState(false);

  notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

  const displayedNotifications = viewAll
    ? notifications
    : notifications.slice(0, 6); // it's like telling viewAll is true? then show all notifications else slice it to 7

   
  return (
    <>
      {notificationsCount !== 0 && (
        <TouchableOpacity
          className="sticky"
          onPress={markAllNotificationsAsRead}
        >
          <Text className="bg-white p-2 text-center text-lg text-blue-500 rounded-md">
            Mark all as read
          </Text>
        </TouchableOpacity>
      )}
      <ScrollView className="bg-white">
        <View className="h-full w-full">
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map((notification) => (
              <View>
                <NotificationItem key={notification.id} notification={notification} />
              </View>
            ))
          ) : (
            <View className="flex items-center justify-center mt-60">
              <Text className="text-center text-xl text-gray-500">
                No notification found
              </Text>
            </View>
          )}

          {!viewAll &&
            notifications.length > 6 && ( // is viewAll true? and notifications is more than seven? then show the button
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

const NotificationItem = ({ notification }) => {
  const navigation = useNavigation();
  const { userData } = useFetchData();
  const { userDetails } = useFetchUser(notification.userId);
  const { handleSpecificNotification} = useNotificationData();

  const notificationImg = {
    "account-check": userData?.img,
    "account-alert": userData?.img,
    "hospital-box": userDetails?.img,
    "shield-check": userDetails?.img,
    "car-emergency": userDetails?.img,
  };

  const notificationData = {
    "account-check": "bg-blue-500",
    "account-alert": "bg-red-500",
    "hospital-box": "bg-orange-500",
    "shield-check": "bg-green-500",
    "car-emergency": "bg-red-500",
  };


  return (
    <TouchableOpacity
      onPress={() => {
        handleSpecificNotification(notification.id);
        switch (notification.icon) {
            case "account-check":
            case "account-alert":
              navigation.navigate("Profile");
              break;
            case "hospital-box":
              navigation.navigate("Map");
              break;
            case "shield-check":
              navigation.navigate("Records", { screen: "resolved" });
              break;
            case "car-emergency":
              navigation.navigate("Records", { screen: "on-going" });
              break;
            default:
              break;
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
                source={{ uri: notificationImg[notification.icon] }}
                className="rounded-full h-16 w-16 border-4 border-blue-500"
              />
              <View
                className={`absolute bottom-0 -right-[4px] ${
                  notificationData[notification.icon]
                } rounded-full p-1.5`}
              >
                <Icon name={notification.icon} size={18} color={"white"} />
              </View>
            </View>
          </View>
          <View className="pl-4 flex-1">
            <View className="text-sm mb-1 text-gray-600">
              <Text className="font-semibold text-lg text-gray-800">
                {notification.title}
              </Text>
              <Text className="font-semibold text-gray-500">
                {notification.message}
              </Text>
            </View>
            <View className="flex flex-row justify-between text-xs text-gray-500">
              <Text className="text-blue-500">
                {getTimeDifference(notification.timestamp)}
              </Text>
              <Text className="text-gray-500">
                {formatDate(notification.date)}
              </Text>
            </View>
          </View>
        </View>
    </TouchableOpacity>
  );
};

export default Notification;
