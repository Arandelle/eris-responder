import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

const useUploadImage = (mode = "both") => {
  const [file, setFile] = useState({uri: null, type: null});

  const selectFile = async () => {

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Denied",
        "Permission to access media library is required!"
      );
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mode === "image" ? ['images'] : ['images', 'videos'],
      allowsEditing: mode === "image",
      aspect: [1, 1],
      quality: 1,
    });
  
    if (!result.canceled) {
      const asset = result.assets[0];
      if(mode === "image" && asset.type !== "image"){
        Alert.alert("Invalid Selection", "Please select an image file.");
          return;
      }
      setFile({ uri: asset.uri, type: asset.type });
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
      setFile({uri: result.assets[0].uri, type: "image"});
    }
  };

  const chooseFile = async () => {
    Alert.alert(
      "Choose an media source",
      `Select a file source`,
      [
        {
          text: "Gallery",
          onPress: selectFile,
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

  return { file,setFile, chooseFile };
};

export default useUploadImage;
