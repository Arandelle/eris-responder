import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";

const ForgotPass = ({ visible, onClose, onSubmit }) => {
  const [email, setEmail] = useState("");

  const handleEmailChange = (text) => {
    setEmail(text);
  };

  const handleSubmit = () => {
    onSubmit(email);
    setEmail(""); // Clear the input after submission
    onClose(); // Close the modal
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View className="flex-1 justify-center items-center" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
        <View className="w-72 p-4 bg-white rounded-md ">
          <Text className="font-bold mb-3 text-lg">Reset Password</Text>
          <Text className="font-thin mb-3 text-[16px]">Enter your email address</Text>
          <TextInput
            className="w-full p-2 border border-gray-400 rounded-md mb-5"
            placeholder="Email"
            onChangeText={handleEmailChange}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View className="flex flex-row justify-between w-100">
            <TouchableOpacity
              className="flex-1 p-2.5 rounded-md items-center bg-gray-400 mr-2.5"
              onPress={onClose}
            >
              <Text className="text-white font-bold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 p-2.5 rounded-md items-center bg-blue-600"
              onPress={handleSubmit}
            >
              <Text className="font-bold text-white">Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ForgotPass;
