import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ToastAndroid,
} from "react-native";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, database } from "../services/firebaseConfig";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import ForgotPass from "./ForgotPass";
import { get, push, ref } from "firebase/database";
import colors from "../constants/colors";
import logAuditTrail from "../hooks/useAuditTrail";

const LoginForm = () => {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [forgotPassModal, setForgotPassModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleShowPass = () => {
    setShowPass(!showPass);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    setLoading(true);
    try {
      const userCredentials = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredentials.user;
      if (user.emailVerified) {
        const adminRef = ref(database, `responders/${user.uid}`);

        const adminSnapshot = await get(adminRef);
        if (adminSnapshot.exists()) {
          await logAuditTrail("Login", user.uid);
          console.log("Login successful");
          navigation.navigate("Eris");
          ToastAndroid.show(
            "Login Successfully",
            ToastAndroid.SHORT,
            ToastAndroid.BOTTOM
          );
        } else {
          Alert.alert("Error", "You are not an admin");
          await auth.signOut();
        }
      } else {
        Alert.alert("Error", "Email is not verified");
        await auth.signOut();
      }
    } catch (error) {
      Alert.alert("Logins Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotPassModal(!forgotPassModal);
  };

  const handlePasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Success", "Password reset email sent");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View className="flex items-center mt-20">
      <View className="w-full max-w-sm">
        <Text className="text-center text-2xl mb-3">Welcome to Eris App!</Text>
        <View className="space-y-4">
          <View className="space-y-2">
            <Text className="text-lg">Email</Text>
            <View className="relative z-10">
              <View className="flex items-center absolute top-3 left-3 z-50">
                <Icon name="alternate-email" size={20} color={colors.blue[800]} />
              </View>
              <TextInput
                className="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full ps-10 p-2.5 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onChangeText={setEmail}
                value={email}
                placeholder="Enter your email"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>
          <View className="space-y-2">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-lg">Password</Text>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text className="text-lg underline">Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View className="relative z-10">
              <View className="flex items-center absolute top-3 left-3 z-50">
                <Icon name="lock" size={20} color={colors.blue[800]} />
              </View>
              <TextInput
                className="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full ps-10 p-2.5 pl-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onChangeText={setPassword}
                value={password}
                placeholder="Enter your password"
                secureTextEntry={!showPass}
              />
              <TouchableOpacity
                className="absolute right-4 top-3 flex items-center"
                onPress={handleShowPass}
              >
                <Icon
                  name={showPass ? "visibility" : "visibility-off"}
                  size={20}
                  color={colors.blue[800]}
                />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            className="w-full bg-blue-800 p-2.5 rounded-md"
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-center text-lg text-white font-bold">
              {loading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>
          <ForgotPass
            visible={forgotPassModal}
            onClose={handleForgotPassword}
            onSubmit={handlePasswordReset}
          />
        </View>
      </View>
    </View>
  );
};

export default LoginForm;
