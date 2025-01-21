// components/CustomInput.js
import React from "react";
import { View, Text, TextInput } from "react-native";

const CustomInput = ({type = "", label, value, onChangeText, placeholder, errorMessage }) => {

  const inputConfig = {
    age: {
      maxLength: 2,
      keyboardType: "phone-pad"
    },
    "mobile phone" : {
      keyboardType: "phone-pad"
    },
    email: {
      editable: false
    }
  }
 
  const config = inputConfig[type.toLowerCase()] || {};
  return (
    <View className="w-full space-y-2">
      <Text className="text-lg text-blue-800 font-bold">{label}</Text>
      <TextInput
       className={`bg-gray-50 border text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2 ${errorMessage ? "border-red-300" : "border-gray-300"} ${!config.editable && config.editable !== undefined ? "bg-gray-300" : ""}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        maxLength={config.maxLength || null}
        keyboardType={config.keyboardType || "default"}
        editable={config.editable !== undefined ? config.editable : true}
      />
    <Text className="text-lg text-red-500">  {errorMessage}</Text>
    </View>
  );
};

export default CustomInput;
