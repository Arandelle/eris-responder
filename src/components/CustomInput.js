// components/CustomInput.js
import React from "react";
import { View, Text, TextInput } from "react-native";
import { Input } from "react-native-elements";

const CustomInput = ({ label, value, onChangeText, placeholder, errorMessage }) => {

  return (
    <View className="w-full mb-4">
      <Text className="text-lg mb-1 text-sky-600 font-bold">{label}</Text>

      <Input
      //  className="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        errorMessage={value.length === 0 ? null : <Text className="text-sm">{errorMessage}</Text>}
        // maxLength={(label === "Mobile phone" ? 11 : label === "Age" ? 2 : null)}
        keyboardType={(label === "Mobile phone" || label === "Age" ? "phone-pad" : "default" )}
      />
    </View>
  );
};

export default CustomInput;
