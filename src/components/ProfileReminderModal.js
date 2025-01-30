import React, { useCallback, useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import useCurrentUser from "../hooks/useCurrentUser";
import AsyncStorage from "@react-native-async-storage/async-storage";

const REMINDER_INTERVAL = 30 * 60 * 1000; // 30 mins in milliseconds
const LAST_REMINDER_KEY = "lastProfileReminderTime";

const ProfileReminderModal = () => {
  const navigation = useNavigation();
  const { currentUser } = useCurrentUser();
  const [modalVisible, setModalVisible] = useState(false);

  const checkProfileCompletion = useCallback(async () => {
    if (!currentUser || currentUser.profileComplete) {
      return;
    }

    try {
      const lastReminderTime = await AsyncStorage.getItem(LAST_REMINDER_KEY);
      const currentTime = new Date().getTime();

      if (
        !lastReminderTime ||
        currentTime - parseInt(lastReminderTime) >= REMINDER_INTERVAL
      ) {
        setModalVisible(true);
        await AsyncStorage.setItem(LAST_REMINDER_KEY, currentTime.toString());
      }
    } catch (error) {
      console.error("Error checking profile reminder time: ", error);
    }
  }, [currentUser]);

  useEffect(() => {
    checkProfileCompletion();

    // set up interval to check periodically
    const intervalId = setInterval(checkProfileCompletion, REMINDER_INTERVAL);

    return () => clearInterval(intervalId);
  }, [checkProfileCompletion]);

  const handleRemindLater = async () => {
    try {
      const currentTime = new Date().getTime();
      await AsyncStorage.setItem(LAST_REMINDER_KEY, currentTime.toString());
      setModalVisible(false);
    } catch (error) {
      console.error("Error setting reminder time: ", error);
      setModalVisible(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={handleRemindLater}
    >
      <View
        className="flex-1 justify-center items-center shadow-lg"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <View className="bg-white w-80 p-5 rounded-md">
          <Text className="text-lg mb-4">
            To access certain features of the app, please update and verify your
            information.
          </Text>
          <View className="flex-row justify-around">
            <TouchableOpacity onPress={handleRemindLater}>
              <Text className="text-gray-500 text-lg">Remind Me Later</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                navigation.navigate("UpdateProfile");
              }}
            >
              <Text className="text-blue-600 text-lg">Update Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ProfileReminderModal;
