import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { auth, database } from "./firebaseConfig";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FetchingData = ({ setIsProfileComplete }) => {
  const [email, setEmail] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchUserData = async (uid) => {
    setLoading(true);
    const userRef = ref(database, `responders/${uid}`);
    try {
      const snapshot = await new Promise((resolve, reject) => {
        onValue(userRef, resolve, reject, { onlyOnce: true });
      });
      const data = snapshot.val();
      if (data) {
        setEmail(data.email || "");    
        const profileComplete = data.profileComplete || false;
        setModalVisible(!profileComplete);
        setIsProfileComplete(profileComplete);
        // await AsyncStorage.setItem("userData", JSON.stringify(data));
      }
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
        // setAuth(false); // Uncomment or define setAuth if necessary
        navigation.navigate("Login");
      }
    });

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        const user = auth.currentUser;
        if (user) {
          fetchUserData(user.uid);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      subscription.remove();
    };
  }, []);

  const handleProfileUpdated = (updatedData) => {
    // Handle the profile update
    setEmail(updatedData.email || "");
    setIsProfileComplete(updatedData.profileComplete || false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
    
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View className="flex-1 justify-center items-center shadow-lg" style={{backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View className="bg-white w-80 p-5 rounded-md">
          <Text className="text-lg mb-4">
            To access certain features of the app, please update and verify your information.
          </Text>
          <View className=" flex-row justify-around">
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text className="text-gray-500 text-lg">Remind Me Later</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                navigation.navigate("UpdateProfile", { onProfileUpdated: handleProfileUpdated });
              }}
            >
              <Text className="text-blue-600 text-lg" >Update Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FetchingData;
