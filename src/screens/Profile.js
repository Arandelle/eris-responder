import React, { useState, useEffect, useCallback } from "react";
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
  Image,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ref, onValue } from "firebase/database";
import { auth, database } from "../services/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useFetchData } from "../hooks/useFetchData";
import colors from "../constants/colors";

const Profile = ({ setIsProfileComplete }) => {
  const navigation = useNavigation();
  const { userData } = useFetchData();
  const [loading, setLoading] = useState(true);
  const [logout, setLogout] = useState(false);

  const handleShowUpdateForm = () => {
    navigation.navigate("UpdateProfile");
  };

  // if (loading) {
  //   return (
  //     <SafeAreaView className="flex-1">
  //       <ActivityIndicator size="large" color="#007bff" />
  //     </SafeAreaView>
  //   );
  // }

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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        <View className="flex flex-row items-center h-40 bg-blue-800 pl-8 space-x-4">
          {userData?.img ? (
            <View className="relative border border-white rounded-full">
              <Image
                source={{ uri: userData.img }}
                className="h-24 w-24  rounded-full"
              />
              <TouchableOpacity
                className="absolute bottom-0 right-0 rounded-full p-2 bg-blue-800 border border-white"
                onPress={handleShowUpdateForm}
              >
                <Icon name="pencil" size={18} color={"white"} />
              </TouchableOpacity>
            </View>
          ) : (
            <Text className="text-gray-900 text-lg">Image not available</Text>
          )}

          <View className="text-2xl space-y-1 font-bold p-2">
            {userData?.firstname || userData?.lastname ? (
              <View className="flex flex-row items-center space-x-2">
                <Text className="text-xl text-white font-bold">
                  {[userData?.firstname, userData?.lastname]
                    .filter(Boolean)
                    .join(" ")}
                </Text>
                {auth.currentUser.emailVerified && (
                  <View className="p-0.5 rounded-full border border-white bg-green-500">
                    <Icon name="check" size={12} color={"white"} />
                  </View>
                )}
              </View>
            ) : (
              <>
                <Text className="font-bold text-xl text-white">
                  Update your fullname
                </Text>
              </>
            )}
            <Text className="text-blue-200">{userData?.customId}</Text>
          </View>
        </View>

        <View className="px-2 py-4 space-y-4">
          <View className="border-b pb-4 border-gray-300">
            <View className="space-y-4 py-4 px-6 bg-blue-100 rounded-xl">
              <View>
                <Text className="text-xl font-bold">Contact:</Text>
                <View className="flex flex-col justify-between space-y-1">
                  <Text className="text-lg text-gray-500 font-bold">
                    {userData?.email ?? "Add email"}
                  </Text>
                  <Text className="text-lg text-gray-500 font-bold">
                    {userData?.mobileNum ?? "Add mobile number"}
                  </Text>
                </View>
              </View>
              <View>
                <Text className="text-xl font-bold mb-2 ">
                  Gender:{" "}
                  <Text className="text-lg text-gray-500 font-bold">
                    {userData?.gender ? userData?.gender : "Your gender"}
                  </Text>
                </Text>
              </View>

              {!userData?.profileComplete && (
                <View className="p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
                  <View className="flex flex-row items-center gap-2">
                    <Icon name={"shield"} color={colors.red[300]} size={20} />
                    <Text className="text-gray-800 text-lg font-medium">
                      Finish Setting Up Your Profile
                    </Text>
                  </View>
                  <Text className="text-gray-600 mt-1">
                    Complete your profile to ensure faster assistance during
                    emergencies
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className="space-y-4">
            <TouchableOpacity
              className="p-3 flex-row items-center justify-between bg-blue-100 rounded-lg"
              onPress={handleLogoutModal}
            >
              <View className="flex flex-row space-x-5">
                <Icon name="logout" size={24} color={colors.blue[800]} />
                <Text className="text-lg font-bold text-red-500">Logout</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
                  <TouchableOpacity
                    className="p-3 w-full bg-blue-800 rounded-2xl"
                    onPress={handleLogout}
                  >
                    <Text className="text-white text-lg text-center font-extrabold">
                      Confirm
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="p-3 w-full border-2 border-blue-800 rounded-2xl"
                    onPress={handleLogoutModal}
                  >
                    <Text className="text-center text-lg font-extrabold text-blue-800">
                      Cancel
                    </Text>
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
