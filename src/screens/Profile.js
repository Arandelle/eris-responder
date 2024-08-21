import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Image
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ref, onValue } from "firebase/database";
import { auth, database } from "../services/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";

const Profile = ({ setIsProfileComplete }) => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logout, setLogout] = useState(false);

  const fetchUserData = async (uid) => {
    setLoading(true);
    const userRef = ref(database, `responders/${uid}`);
    try {
      const snapshot = await new Promise((resolve, reject) => {
        onValue(userRef, resolve, reject, { onlyOnce: true });
      });
      const data = snapshot.val();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to fetch user data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        navigation.navigate("Login");
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleShowUpdateForm = () => {
    navigation.navigate("UpdateProfile", {
      onProfileUpdated: (updatedData) => {
        setUserData(updatedData);
        const isProfileCompleted =
          updatedData.firstname &&
          updatedData.lastname &&
          updatedData.age &&
          updatedData.gender &&
          updatedData.address &&
          updatedData.mobileNum;
        setIsProfileComplete(isProfileCompleted);
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1">
        <ActivityIndicator size="large" color="#007bff" />
      </SafeAreaView>
    );
  }

  const renderPlaceholder = (value, placeholder) => {
    return value ? (
      <Text className="text-xl text-gray-500">{value}</Text>
    ) : (
      <Text className="italic text-xl text-gray-900">{placeholder}</Text>
    );
  };

  const handleLogoutModal = () => {
    setLogout(!logout);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate("Login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-200">
      <View className="flex-1 justify-between bg-white rounded-lg m-4 p-5 shadow-md ">
        <View>
          <View className="items-center pb-5">
          {userData.img ? (
            <Image source={{uri: userData.img}}
            className="h-[100px] w-[100px] rounded-full" />
          ) : (
            <Text className="text-lg text-gray-900 italic">Image not available</Text>
          )}
            <Text className="text-2xl font-bold pb-2">
              {userData?.firstname && userData?.lastname
                ? `${userData.firstname} ${userData.lastname}`
                : renderPlaceholder(null, "Your Name")}
            </Text>
            <Text className="text-lg text-white bg-sky-300 p-1 rounded-lg">
              {userData?.mobileNum
                ? userData.mobileNum
                : renderPlaceholder(null, "Phone number")}
            </Text>
          </View>
          <View className="mb-5 space-y-8">
            <View>
              <Text className="text-xl font-bold mb-2 ">
                Age:{" "}
                <Text className="text-lg text-gray-500 font-bold">
                  {userData?.age
                    ? userData?.age
                    : renderPlaceholder(null, "Age")}
                </Text>
              </Text>
            </View>
            <View>
              <Text className="text-xl font-bold mb-2 ">
                Gender:{" "}
                <Text className="text-lg text-gray-500 font-bold">
                  {userData?.gender
                    ? userData?.gender
                    : renderPlaceholder(null, "Your gender")}
                </Text>
              </Text>
            </View>
            <View>
              <Text className="text-xl font-bold mb-2 ">Email Address:</Text>
              <Text className="text-lg text-gray-500 font-bold">
                {userData?.email}
              </Text>
            </View>
            <View>
              <Text className="text-xl font-bold mb-2 ">Current Address:</Text>
              <Text className="text-lg text-gray-500 font-bold">
                {userData?.address
                  ? userData.address
                  : renderPlaceholder(null, "House No. Street Barangay")}
              </Text>
            </View>
          </View>
        </View>
        <View className="mb-2 space-y-2.5">
          <TouchableOpacity
            className="p-3 bg-green-500 rounded-md"
            onPress={handleShowUpdateForm}
          >
            <Text className="text-center text-lg text-white font-bold">
              Update profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="p-3 bg-red-500 rounded-md"
            onPress={handleLogoutModal}
          >
            <Text className="text-center text-lg text-white font-bold">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={logout}
        onRequestClose={() => setLogout(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLogout(false)}>
          <View
            className="flex w-full h-full py-14 items-center justify-center"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          >
            <View className="h-56 justify-center bg-white w-full absolute bottom-0 rounded-t-xl">
              <View className="space-y-3">
                <Text className="text-gray-900 font-extrabold text-2xl text-center">
                  Are you sure you want to logout?
                </Text>
                <View className="space-y-3 py-3 px-5">
                    <TouchableOpacity className="p-3 w-full bg-blue-600 rounded-2xl" onPress={handleLogout}>
                      <Text className="text-white text-lg text-center font-extrabold">Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="p-3 w-full border-2 border-blue-500 rounded-2xl" 
                    onPress={handleLogoutModal}>
                      <Text className="text-center text-lg font-extrabold text-blue-500">Cancel</Text>
                    </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
