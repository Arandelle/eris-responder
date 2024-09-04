import { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { useFetchData } from '../hooks/useFetchData';

const ProfileReminderModal = () => {
  const navigation = useNavigation();
  const {userData} = useFetchData();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (userData) {
      setModalVisible(!userData.profileComplete);
    }
  }, [userData]);
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View className="flex-1 justify-center items-center shadow-lg" style={{backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View className="bg-white w-80 p-5 rounded-md">
          <Text className="text-lg mb-4">
            To access certain features of the app, please update and verify your information.
          </Text>
          <View className=" flex-row justify-around">
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text className="text-gray-500 text-lg">Remind Me Later</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                navigation.navigate("UpdateProfile");
              }}
            >
              <Text className="text-blue-600 text-lg" >Update Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ProfileReminderModal;
