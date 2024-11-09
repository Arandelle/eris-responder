import React, { useState, useEffect } from "react";
import {
  View,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ref, update, onValue, push, serverTimestamp } from "firebase/database";
import { auth, database } from "../services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import CustomInput from "../components/CustomInput";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import useCurrentUser from "../hooks/useCurrentUser";

const UpdateProfile = () => {
  const navigation = useNavigation();
  const { currentUser, updateCurrentUser } = useCurrentUser();
  const [userData, setUserData] = useState({
    firstname: "",
    lastname: "",
    mobileNum: "",
    gender: "Male",
    img: "https://flowbite.com/docs/images/people/profile-picture-1.jpg",
  });

  const genders = ["Male", "Female"];
  const [loading, setLoading] = useState(true);
  const [error, setErrors] = useState("");
  const [valid, setValid] = useState(true);

  const imageUrl = [
    ...Array.from(
      {
        length: 5,
      },
      (_, i) =>
        `https://flowbite.com/docs/images/people/profile-picture-${i + 1}.jpg`
    ),
    ...Array.from(
      { length: 99 },
      (_, i) => `https://api.multiavatar.com/${i + 1}.png`
    ),
  ];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = ref(database, `responders/${user.uid}`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) setUserData(data);
          setLoading(false);
        });
      } else {
        navigation.navigate("Login");
      }
    });
    return unsubscribeAuth;
  }, [navigation]);

  const handleFieldChange = (field, value) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
    validateInput(field, value);
  };

  const validateInput = (field, value) => {
    if (field === "mobileNum") {
      if (!/^(09\d{9}|\+639\d{9})$/.test(value)) {
        setErrors("Please enter a valid PH contact number");
        setValid(false);
      } else {
        setErrors("");
        setValid(true);
      }
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    const user = auth.currentUser;

    const updatedData = {
      ...userData,
      profileComplete: Boolean(
        userData.firstname &&
          userData.lastname &&
          userData.mobileNum &&
          userData.gender &&
          userData.img
      ),
    };

    try {
      await updateCurrentUser(updatedData);

      const responderNotificationRef = ref(
        database,
        `responders/${user.uid}/notifications`
      );
      const notificationData = {
        title: "Profile Updated!",
        message: `Congratulations!, you have successfully update your profile information.`,
        isSeen: false,
        date: new Date().toISOString(),
        timestamp: serverTimestamp(),
        icon: "account-check",
      };

      await push(responderNotificationRef, notificationData);

      Alert.alert("Success", "Profile update successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating user data:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="">
        <View className="flex-1">
          <Text className="text-lg m-4 text-sky-600 font-bold">Avatar: </Text>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <View className="flex flex-row space-x-3 justify-center">
              <TouchableOpacity>
                <View className="h-[70px] w-[70px] rounded-full bg-gray-200 flex justify-center items-center">
                  <Icon name="plus" size={40} color={"gray"} />
                </View>
              </TouchableOpacity>
              {imageUrl.map((url) => (
                <TouchableOpacity
                  key={url}
                  onPress={() => setUserData({ ...userData, img: url })}
                  className="relative"
                >
                  <Image
                    source={{ uri: url }}
                    className="h-[70px] w-[70px] rounded-full"
                  />

                  {userData.img === url && (
                    <View className="absolute top-0 right-0 bg-white rounded-full">
                      <Icon
                        name="checkbox-marked-circle"
                        size={20}
                        color={"green"}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View className="m-4">
            <CustomInput
              label={"First Name"}
              value={userData.firstname}
              onChangeText={(value) => handleFieldChange("firstname", value)}
              placeholder="Enter your firstname"
            />
            <CustomInput
              label={"Last Name"}
              value={userData.lastname}
              onChangeText={(value) => handleFieldChange("lastname", value)}
              placeholder="Enter your lastname"
            />
            <CustomInput
              label={"Mobile phone"}
              value={userData.mobileNum}
              onChangeText={(value) => handleFieldChange("mobileNum", value)}
              placeholder="Enter your mobile number"
              errorMessage={error}
            />
            <View className="w-full mb-4">
              <Text className="text-lg mb-1 text-sky-600 font-bold">
                Select Gender:
              </Text>
              <View className="flex flex-row justify-around p-2">
                {genders.map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    className={`flex flex-row items-center my-1`}
                    onPress={() => setUserData({ ...userData, gender })}
                  >
                    <View className="h-5 w-5 rounded-full border-2 border-blue-600 items-center justify-center">
                      {userData.gender === gender && (
                        <View className="h-3 w-3 rounded-full bg-blue-600" />
                      )}
                    </View>
                    <Text className="ml-2 font-bold text-lg">{gender}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              className={`p-3 w-full rounded-2xl ${
                !valid ? "bg-gray-400" : "bg-green-500"
              }`}
              onPress={handleUpdateProfile}
              disabled={!valid}
            >
              <Text className="text-center text-lg font-extrabold text-white">
                Update Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UpdateProfile;
