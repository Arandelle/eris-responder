import { onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { auth, database } from "../services/firebaseConfig";
import { getTimeDifference } from "../helper/getTimeDifference";
import { formatDate } from "../helper/FormatDate";

const Notification = () => {
  const [notificationData, setNotificationData] = useState([]);
  const [loading, setLoading] = useState(true);

  const notificationDatas = {
    users: "bg-red-500",
    updateProfile: "bg-blue-500",
    emergency: "bg-orange-500 "
  };


  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      const notificationRef = ref(
        database,
        `responders/${user.uid}/notifications`
      );
      const unsubscribe = onValue(notificationRef, (snapshot) => {
        try {
          const data = snapshot.val();
          const notificationList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setNotificationData(notificationList);
          setLoading(false);
        } catch (error) {
          console.error("Error, ", error);
          setLoading(false);
        }
      });

      return () => unsubscribe();
    }
  }, []);

  return (
    <View className="bg-gray-100 h-full p-2 w-full rounded-lg shadow-lg">
      <ScrollView>
        {notificationData.length > 0 ? (
          notificationData.map((notification) => (
            <TouchableOpacity
              key={notification.id}
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
                        notificationDatas[notification.type]
                      } rounded-full p-1 border-2 border-white`}
                    >
                      <Icon
                        name={notification.icon}
                        size={16}
                        color={"white"}
                      />
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
            <Text className="text-center text-xl text-gray-500">
              No notification found
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Notification;
