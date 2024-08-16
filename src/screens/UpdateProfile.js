import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Button,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ref, update, onValue } from "firebase/database";
import { auth, database } from "../services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import CustomInput from "../components/CustomInput";

const UpdateProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { onProfileUpdated, setIsProfileComplete } = route.params;
  const [responderData, setResponderData] = useState(null);
  const [mobileNum, setMobileNum] = useState("");
  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [address, setCurrentAddress] = useState("");
  const [selectedGender, setSelectedGender] = useState("Male");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const genders = ["Male", "Female"];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = ref(database, `users/${user.uid}`);

        try {
          const snapshot = await new Promise((resolve, reject) => {
            onValue(userRef, resolve, reject, { onlyOnce: true });
          });
          const data = snapshot.val();
          setResponderData(data);
          setMobileNum(data?.mobileNum || "");
          setFirstName(data?.firstname || "");
          setLastName(data?.lastname || "");
          setAge(data?.age || "");
          setSelectedGender(data?.gender || "")
          setCurrentAddress(data?.address || "");
          setLoading(false);
        } catch (error) {
          console.error("Error fetching user data:", error);
          Alert.alert("Error", "Failed to fetch user data. Please try again.");
        }
      } else {
        navigation.navigate("Login");
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleUpdateProfile = async () => {
    const user = auth.currentUser;
    const isProfileCompleted =
      firstname && lastname && age && address && mobileNum && selectedGender;
    // if (!firstname || !lastname || !age || !address || !mobileNum) {
    //   Alert.alert(
    //     "Validation Error",
    //     "Please fill in all fields before updating your profile."
    //   );
    //   return; // Exit the function if any field is empty
    // }

    if (user) {
      const updatedData = {
        firstname,
        lastname,
        age,
        address,
        email: user.email,
        mobileNum,
        gender: selectedGender,
        profileComplete: isProfileCompleted,
      };

      const userRef = ref(database, `responders/${user.uid}`);
      try {
        await update(userRef, updatedData);
        setResponderData(updatedData);
        Alert.alert(
          "Success",
          "Profile updated successfully!",
          [
            {
              text: "Cancel",
              onPress: () => console.log("Cancel Pressed"),
              style: "cancel",
            },
            {
              text: "OK",
              onPress: () => {
                console.log("OK Pressed");
                onProfileUpdated(updatedData); // Notify parent component about the update
                if (setIsProfileComplete) {
                  setIsProfileComplete(isProfileCompleted); // Update profile completion status
                }
                navigation.navigate("Profile");
              },
            },
          ],
          { cancelable: false }
        );
      } catch (error) {
        console.error("Error updating user data:", error);
        Alert.alert("Error", error.message);
      }
    } else {
      Alert.alert("Error", "User not authenticated");
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  const handleChange = (value) => {
    const regex = /^(09\d{9}|\+639\d{9})$/;

    if (regex.test(value)) {
      setError("");
    } else {
      setError("Please enter a valid PH contact number");
    }

    setMobileNum(value);
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="">
        <View className="flex-1">
          <View style={{ margin: 16 }}>
            <CustomInput
              label={"First Name"}
              value={firstname}
              onChangeText={setFirstName}
              placeholder="Enter your firstname"
            />
            <CustomInput
              label={"Last Name"}
              value={lastname}
              onChangeText={setLastName}
              placeholder="Enter your lastname"
            />
            <CustomInput
              label={"Mobile phone"}
              value={mobileNum}
              onChangeText={handleChange}
              placeholder="Enter your mobile number"
              errorMessage={error}
            />
            <CustomInput
              label={"Age"}
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              errorMessage={age < 18 ? "User must be above 18 years old" : null}
            />

            <View className="w-full mb-4">
              <Text className="text-lg mb-1 text-sky-600 font-bold">Select Gender:</Text>
              <View className="flex flex-row justify-around p-2">
                {genders.map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    className={`flex flex-row items-center my-1`}
                    onPress={() => setSelectedGender(gender)}
                  >
                    <View className="h-5 w-5 rounded-full border-2 border-blue-600 items-center justify-center">
                      {selectedGender === gender && (
                        <View className="h-3 w-3 rounded-full bg-blue-600" />
                      )}
                    </View>
                    <Text className="ml-2 font-bold text-lg">{gender}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <CustomInput
              label={"Complete Address"}
              value={address}
              onChangeText={setCurrentAddress}
              placeholder="Enter your current address"
            />

            <Button title="Update Profile" onPress={handleUpdateProfile} />

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  radioButtonLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
});
export default UpdateProfile;
