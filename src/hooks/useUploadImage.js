import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

const useUploadImage = () => {
  const [photo, setPhoto] = useState(null);

  const selectPhoto = async () => {
    console.log("Gallery button clicked"); // Debug log
  
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log("Permission Result:", permissionResult); // Debug log
  
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Denied",
        "Permission to access media library is required!"
      );
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
  
    console.log("ImagePicker Result:", result);
  
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };
  

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "Permission to access camera is required!");
      return;
    };

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const choosePhoto = async () => {
    Alert.alert(
      "Choose an image source",
      "Select an image source to upload",
      [
        {
          text: "Gallery",
          onPress: selectPhoto,
        },
        {
          text: "Camera",
          onPress: takePhoto,
        }, 
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  }

  return { photo, choosePhoto };
};

export default useUploadImage;
