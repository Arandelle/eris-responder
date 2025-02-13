import React from "react";
import { View } from "react-native";
import Dialog from "react-native-dialog";

const MyDialog = ({visible,setVisible, title, subMesage, onChangeText, value, onPress}) => {
  return (
    <View className="flex items-center justify-center">
        <Dialog.Container visible={visible}>
          <Dialog.Title
            style={{ fontSize: 22, fontWeight: "bold", marginVertical: 5 }}
          >
           {title}
          </Dialog.Title>
          <Dialog.Title>{subMesage}</Dialog.Title>
          <Dialog.Input
            placeholder="Type here..."
            onChangeText={onChangeText}
            value={value}
          />
          <Dialog.Button label="Cancel" onPress={() => setVisible(false)} />
          <Dialog.Button
            label="OK"
            onPress={() => {onPress(), setVisible(false)}}
          />
        </Dialog.Container>
    </View>
  );
};

export default MyDialog;
