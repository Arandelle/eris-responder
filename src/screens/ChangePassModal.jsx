import React from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { auth } from "../services/firebaseConfig";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";

const ChangePassModal = () => {
    const navigate = useNavigation();
  const user = auth.currentUser;
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    reEnterPass: "",
  });
  const [isComplete, setIsComplete] = useState(false);

  const handleChangePass = async () => {
    const {oldPassword, newPassword, reEnterPass} = passwordData;
    if (!user) {
      Alert.alert("No user!", "Sorry no user logged in!");
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      if (newPassword === oldPassword) {
        Alert.alert(
          "Error updating!",
          "New password cannot be same as oldpassword!"
        );
      } else if (newPassword !== reEnterPass) {
        Alert.alert("Error updating!", "New password do not match");
      } else {
        await updatePassword(user, newPassword);
        Alert.alert("Success update!", "Successfully changed password");
        navigate.goBack();
      }
    } catch (error) {
      if (error.code === "auth/invalid-credential") {
        Alert.alert("Error updating", "Old password is incorrect");
      } else {
        Alert.alert("Error updating", `${error}`);
      }
    }
  };

  useEffect(() => {
        const {oldPassword, newPassword, reEnterPass} = passwordData;
      const completed = oldPassword && newPassword && reEnterPass;
      setIsComplete(completed);
    }, [passwordData.oldPassword, passwordData.newPassword, passwordData.reEnterPass]);

  return (
    <View className="p-4 space-y-4 bg-white h-screen">

      <Text>Old Password</Text>
        <TextInput
          className="w-full border border-gray-300 rounded-lg p-4"
          placeholder={"Enter old Password"}
          value={passwordData.oldPassword}
          onChangeText={(value) =>
            setPasswordData({
              ...passwordData,
              oldPassword: value,
            })
          }
          secureTextEntry
        />
        <Text>New Password</Text>
        <TextInput
          className="w-full border border-gray-300 rounded-lg p-4"
          placeholder={"Enter new password"}
          value={passwordData.newPassword}
          onChangeText={(value) =>
            setPasswordData({
              ...passwordData,
              newPassword: value,
            })
          }
          secureTextEntry
        />
        <Text>Re-enter password</Text>
        <TextInput
          className="w-full border border-gray-300 rounded-lg p-4"
          placeholder={"Re-enter your new password"}
          value={passwordData.reEnterPass}
          onChangeText={(value) =>
            setPasswordData({
              ...passwordData,
              reEnterPass: value,
            })
          }
          secureTextEntry
        />
      <TouchableOpacity className={`p-4 rounded-lg ${isComplete ? "bg-blue-500" : "bg-gray-500"}`}
      disabled={!isComplete}
      onPress={handleChangePass}>
        <Text className="text-center text-white font-bold">
          Change Password
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChangePassModal;
