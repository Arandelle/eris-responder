import { Button, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
const Home = () => {
  const navigation = useNavigation();
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate("Login");
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <View>
      <View className="h-full flex items-center justify-center bg-gray-100">
        <View className="flex w-full justify-between items-center">
          <Button title="Logout" onPress={handleLogout}/>
        </View>
      </View>
    </View>
  );
};

export default Home;
