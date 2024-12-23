import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

const useUploadImage = () => {
  const [photo, setPhoto] = useState(null);

  const selectPhoto = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
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

    console.log(result);

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };
  return { photo, selectPhoto };
};

export default useUploadImage;
