import React, { useState, useEffect } from "react";
import {
  View,
  Button,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ref, update, onValue } from "firebase/database";
import { auth, database } from "../services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import CustomInput from "../components/CustomInput";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const UpdateProfile = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [mobileNum, setMobileNum] = useState("");
  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [address, setCurrentAddress] = useState("");
  const [selectedGender, setSelectedGender] = useState("Male");
  const [selectedProfile, setSelectedProfile] = useState(
    "https://flowbite.com/docs/images/people/profile-picture-1.jpg"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const genders = ["Male", "Female"];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = ref(database, `responders/${user.uid}`);

        try {
          const snapshot = await new Promise((resolve, reject) => {
            onValue(userRef, resolve, reject, { onlyOnce: true });
          });
          const data = snapshot.val();
          setUserData(data);
          setMobileNum(data?.mobileNum || "");
          setFirstName(data?.firstname || "");
          setLastName(data?.lastname || "");
          setAge(data?.age || "");
          setSelectedGender(data?.gender || "");
          setSelectedProfile(data?.img || "");
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
    const isProfileCompleted = Boolean(
      firstname &&
        lastname &&
        age &&
        address &&
        mobileNum &&
        selectedGender &&
        selectedProfile
    );

    // if (
    //   !firstname ||
    //   !lastname ||
    //   !age ||
    //   !address ||
    //   !mobileNum ||
    //   !selectedGender ||
    //   !selectedProfile
    // ) {
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
        img: selectedProfile,
        profileComplete: isProfileCompleted,
      };

      const userRef = ref(database, `responders/${user.uid}`);
      try {
        await update(userRef, updatedData);
        setUserData(updatedData);

        navigation.setParams({ updatedUserData: updatedData });

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
                navigation.goBack();
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

  const multiavatar = Array.from({ length: 10 },(_, i) => 
  `https://api.multiavatar.com/${i + 1}.png`
  );
  const robohash = Array.from({ length: 99 }, (_, i) => 
  `https://robohash.org/${i + 1}.png`
);
  const flowbite = Array.from({ length: 5 },(_, i) => 
  `https://flowbite.com/docs/images/people/profile-picture-${i+1}.jpg`
  );

  const ImageUrl = [...flowbite, ...robohash]

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="">
        <View className="flex-1">
          <Text className="text-lg m-4 text-sky-600 font-bold">Avatar: </Text>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <View className="flex flex-row space-x-3 justify-center">
            <TouchableOpacity>
              <View className="h-[70px] w-[70px] rounded-full bg-gray-200 flex justify-center items-center">
                <Icon name="plus" size={40} color={"gray"}/>
              </View>
            </TouchableOpacity>
              {ImageUrl.map((url) => (
                <TouchableOpacity
                  key={url}
                  onPress={() => setSelectedProfile(url)}
                  className="relative"
                >
                  <Image
                    source={{ uri: url }}
                    className="h-[70px] w-[70px] rounded-full"
                  />

                  {selectedProfile === url && (
                    <View className="absolute top-0 right-0 bg-white rounded-full">
                      <Icon
                        name="checkbox-marked-circle"
                        size={20}
                        color={"green"}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View className="m-4">
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
              <Text className="text-lg mb-1 text-sky-600 font-bold">
                Select Gender:
              </Text>
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

            <TouchableOpacity
              className="p-3 w-full bg-green-500 rounded-2xl"
              onPress={handleUpdateProfile}
            >
              <Text className="text-center text-lg font-extrabold text-white">
                Update Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UpdateProfile;
