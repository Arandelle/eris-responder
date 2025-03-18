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
  ToastAndroid,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ref, push, serverTimestamp } from "firebase/database";
import { auth, database, storage} from "../services/firebaseConfig";
import CustomInput from "../components/CustomInput";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import useCurrentUser from "../hooks/useCurrentUser";
import useUploadImage from "../hooks/useUploadImage";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import colors from "../constants/colors";


const UpdateProfile = () => {
  const navigation = useNavigation();
  const { file,setFile, chooseFile} = useUploadImage("image");
  const { currentUser, updateCurrentUser } = useCurrentUser();
  const [userData, setUserData] = useState({
    fullname: "",
    mobileNum: "",
    gender: "Male",
    img: "https://flowbite.com/docs/images/people/profile-picture-1.jpg",
    imageFile: null,
  });

  const genders = ["Male", "Female"];
  const [loading, setLoading] = useState(false);
  const [error, setErrors] = useState("");
  const [valid, setValid] = useState(true);

  const imageUrl = [
    ...Array.from(
      {
        length: 3,
      },
      (_, i) =>
        `https://flowbite.com/docs/images/people/profile-picture-${i + 1}.jpg`
    ),
    ...Array.from(
      { length: 5 },
      (_, i) => `https://api.dicebear.com/7.x/avataaars/png?seed=${i + 1}`
    ),
  ];

  useEffect(() => {
    if (currentUser) {
      setUserData({
        email: currentUser.email || "Not verified",
        fullname: currentUser.fullname || "",
        mobileNum: currentUser.mobileNum || "",
        gender: currentUser.gender || "Male",
        img: currentUser.img || "https://flowbite.com/docs/images/people/profile-picture-1.jpg",
        imageFile: null,
      });
    }
  }, [currentUser]);

 
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

  const handleAvatarSelection = (url) => {
    setFile({ uri: url, type: "image" });
    setUserData({...userData, img: url, imageFile: null});
  }

  const handleUpdateProfile = async () => {
    setLoading(true);
    const user = auth.currentUser;

    let imageUrl = userData.img;

    //check if user upload photo
    if (userData.imageFile) {
      const imageRef = storageRef(storage, `profile-images/${Date.now()}.jpg`);

      try {
        const response = await fetch(userData.imageFile);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
      } catch (error) {
        Alert.alert("Error uploading image", `${error}`);
        setLoading(false);
        return;
      }
    }

    if (currentUser?.img) {
      try {
        const oldImageRef = storageRef(storage, currentUser?.img);
        await deleteObject(oldImageRef);
      } catch (deleteError) {
        console.error("Error Deleting", `${deleteError}`);
        // if no data still proceed to upload image
      }
    }

    const updatedData = {
      ...userData,
      img: imageUrl,
      profileComplete: Boolean(
          userData.fullname &&
          userData.mobileNum &&
          userData.gender &&
          imageUrl
      ),
    };

    try {
      await updateCurrentUser(updatedData);

      const responderNotificationRef = ref(
        database,
        `responders/${user.uid}/notifications`
      );
      const logsDataRef = ref(database, `usersLog`);

      const notificationData = {
        title: "Profile Updated!",
        message: `Congratulations!, you have successfully update your profile information.`,
        isSeen: false,
        date: new Date().toISOString(),
        timestamp: serverTimestamp(),
        icon: "account-check",
      };

      const usersLogData = {
        userId: user?.uid,
        date: new Date().toISOString(),
        type: "Update Profile",   
      }

      await push(responderNotificationRef, notificationData);
      await push(logsDataRef, usersLogData);

      ToastAndroid.show("Profile update successfully",
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM
      );
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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-lg text-blue-800 font-bold">Avatar: </Text>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <View className="flex flex-row py-4 space-x-3 justify-center">
              <TouchableOpacity onPress={chooseFile}>
                <View className="h-16 w-16 rounded-full bg-gray-200 flex justify-center items-center">
                  <Icon name="camera" size={40} color={"gray"} />
                </View>
              </TouchableOpacity>

              {userData
              .img && (
                <TouchableOpacity
                  onPress={() => setUserData({ ...userData, img:null, imageFile: file.uri })}
                >
                  <View className="h-16 w-16 rounded-full bg-gray-200 flex justify-center items-center relative">
                    <Image
                      source={{ uri: file.uri || userData.img }}
                      className="w-16 h-16 rounded-full"
                    />
                    {userData.img && (
                        <View className="absolute top-0 right-0 bg-white rounded-full">
                          <Icon
                            name="checkbox-marked-circle"
                            size={20}
                            color="green"
                          />
                        </View>
                      )}
                  </View>
                </TouchableOpacity>
              )}

              {imageUrl.map((url) => (
                <TouchableOpacity
                  key={url}
                  onPress={() =>
                    handleAvatarSelection(url)
                  }
                  className="relative"
                >
                  <Image
                    source={{ uri: url }}
                    className="h-16 w-16 rounded-full"
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
              <TouchableOpacity onPress={() => navigation.navigate("Avatars", {
                onSelectAvatar: handleAvatarSelection
              })} 
              className="h-16 w-16 rounded-full bg-gray-200 flex justify-center items-center"
              >
                <Icon name="arrow-right-thick" size={20} color={colors.blue[800]}/>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <View className="">
            <CustomInput
              type="email"
              label={"Email"}
              value={userData.email}
              onChangeText={(value) => handleFieldChange("email", value)}
            />
            <CustomInput
              label={"Fullname"}
              value={userData.fullname}
              onChangeText={(value) => handleFieldChange("fullname", value)}
              placeholder="Enter your fullname"
            />
            <CustomInput
              type="mobile phone"
              label={"Mobile phone"}
              value={userData.mobileNum}
              onChangeText={(value) => handleFieldChange("mobileNum", value)}
              placeholder="Enter your mobile number"
              errorMessage={error}
            />
            <View className="w-full mb-4">
              <Text className="text-lg mb-1 text-blue-800 font-bold">
                Select Gender:
              </Text>
              <View className="flex flex-row justify-around p-2">
                {genders.map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    className={`flex flex-row items-center my-1`}
                    onPress={() => setUserData({ ...userData, gender })}
                  >
                    <View className="h-6 w-6 rounded-full border-2 border-blue-800 flex items-center justify-center">
                      {userData.gender === gender && (
                        <View className="h-3 w-3 rounded-full bg-blue-800" />
                      )}
                    </View>
                    <Text className="ml-2 font-bold text-lg">{gender}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <View className="p-4">
        <TouchableOpacity
          className={`p-3 w-full rounded-2xl ${
            !valid ? "bg-gray-400" : "bg-blue-800"
          }`}
          onPress={handleUpdateProfile}
          disabled={!valid}
        >
          <Text className="text-center text-lg font-extrabold text-white">
            Update Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default UpdateProfile;
