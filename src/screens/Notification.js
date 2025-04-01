import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ToastAndroid,
  ActivityIndicator
} from "react-native";
import  useFetchData  from "../hooks/useFetchData";
import { getTimeDifference } from "../helper/getTimeDifference";
import { formatDate } from "../helper/FormatDate";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useNotificationData } from "../hooks/useNotificationData";
import useCurrentUser from "../hooks/useCurrentUser";
import { ref, remove } from "firebase/database";
import { database } from "../services/firebaseConfig";
import colors from "../constants/colors"

const Notification = () => {
  const {
    notificationsCount,
    notifications,
    markAllNotificationsAsRead,
  } = useNotificationData();

  const sortedNotifications = useMemo(() => {
    return notifications.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [notifications]);

  const [displayedNotifications, setDisplayedNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const itemPerPage = 6;

  useEffect(() => {
    setDisplayedNotifications(sortedNotifications.slice(0, page * itemPerPage));
  }, [page, sortedNotifications]);
   
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
                <NotificationItem key={notification.id} notification={notification} />
            ))
          ) : (
            <View className="flex items-center justify-center mt-60">
              <Text className="text-center text-xl text-gray-500">
                No notification found
              </Text>
            </View>
          )}

          {notifications.length > 6 && displayedNotifications.length !== notifications.length && (
              <TouchableOpacity
                className="mx-3 my-2 rounded-md p-2.5 text-center text-gray-500 bg-gray-200"
                onPress={() => setPage(page + 1)}
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
  const {currentUser} = useCurrentUser();
  const {data: userData} = useFetchData("users")
  const userDetails = userData?.find((user) => user.id === notification?.userId);
  const { handleSpecificNotification} = useNotificationData();

  const [isDeleting, setIsDeleting] = useState(false);

  const notificationImg = {
    "account-check": currentUser?.img,
    "account-alert": currentUser?.img,
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

  const handleDeleteNotification = async (id) => {
    if(isDeleting) return;
    setIsDeleting(true);

    try{
      if(id){
        const notificationRef = ref(database, `responders/${currentUser?.id}/notifications/${id}`);
        await remove(notificationRef);
        ToastAndroid.show(
          "Deleted successfully",
          ToastAndroid.BOTTOM,
          ToastAndroid.SHORT
        );
      }
    } catch(error){
      console.error(error);
      Alert.alert("Error deleting notification: ", `${error}`);
    }finally{
      setIsDeleting(false);
    }
  }


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
              source={{
                uri:
                  notificationImg[notification.icon]
              }}
              className="rounded-full h-16 w-16 border-4 border-blue-500"
            />
            <View
              className={`absolute bottom-0 -right-[4px] ${
                notificationData[notification.icon]
              } rounded-full p-1.5 border border-blue-50`}
            >
              <Icon name={notification.icon} size={18} color={"white"} />
            </View>
          </View>
        </View>
        <View className="pl-4 flex-1">
          <View className="flex relative flex-row justify-between">
            <View className="text-sm mb-1 text-gray-600">
              <Text className="font-semibold text-lg text-gray-800">
                {isDeleting ? "Deleting ..." : notification.title}
              </Text>
              <Text className="font-semibold text-gray-500">
                {notification.message}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteNotification(notification.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.red[400]} />
              ) : (
                <Icon name="delete-forever" size={20} color={colors.red[400]} />
              )}
            </TouchableOpacity>
          </View>
          <View className="flex flex-row justify-between text-xs text-gray-500">
            <Text className="text-blue-500">
              {getTimeDifference(notification.date)}
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
