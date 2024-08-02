import React from 'react'
import { View, Text, Button} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';


const Profile = () => {

    const navigation = useNavigation();

    const handleLogout = async () =>{
        try{
            await signOut(auth);
            navigation.navigate("Login");
        } catch(error){
            console.error(error);
        }
    }

  return (
    <View className="h-full flex items-center justify-center">
        <Text>This is the Profile</Text>
        <Button title='Logout' onPress={handleLogout}/>
    </View>
  )
}

export default Profile
