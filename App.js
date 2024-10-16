  import { useState, useEffect } from 'react';
  import { createNativeStackNavigator } from "@react-navigation/native-stack";
  import { Alert, Text, View, TouchableOpacity,Image } from 'react-native';
  import { auth } from './src/services/firebaseConfig';
  import { onAuthStateChanged } from 'firebase/auth';
  import { get, getDatabase, ref } from 'firebase/database';
  import { NavigationContainer } from '@react-navigation/native';
  import Home from './src/screens/Home';
  import LoginForm from './src/screens/LoginForm';
  import TabNavigator from './src/navigation/TabNavigator';
  import UpdateProfile from './src/screens/UpdateProfile';
  import Logo from "./assets/logo.png"
  import Icon from "react-native-vector-icons/MaterialCommunityIcons";

  const Stack = createNativeStackNavigator();

  const App = () => {
    const [user, setUser] = useState(null);
    const [isResponder, setIsResponder] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUser(user);
          const db = getDatabase();
          const responderRef = ref(db, `responders/${user.uid}`);
          
          try {
            const responderSnapshot = await get(responderRef);
            console.log(`responder snapshot exists: ${responderSnapshot.exists()}`);
            setIsResponder(responderSnapshot.exists());
          } catch (error) {
            console.error('Error fetching admin data:', error);
            Alert.alert("Error", "Account is not found")
          }
        } else {
          setUser(null);
          setIsResponder(false);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }, []);

    if (loading) {
      return (
        <View className="flex w-full h-full items-center justify-center">
       <Image source={Logo} alt="Loading..."/>
       <Text>Loading please wait...</Text>
      </View>
      );
    }

    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false,
         headerTitleAlign: "center",
          headerTitleStyle: {
            fontWeight: "900",
            fontSize: 24,
          },}}>
          {user && isResponder ? (
           <>
              <Stack.Screen name="Eris">
              {()=> <TabNavigator responderUid={user.uid}/>}
              </Stack.Screen>
              <Stack.Screen name='Map' component={Home} />
              <Stack.Screen
                name="UpdateProfile"
                component={UpdateProfile}
                options={({ navigation }) => ({
                  title: "Update your profile",
                  headerShown: true,
                  headerLeft: () => (
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Profile")}
                    >
                     <Icon name="arrow-left-thick" size={25} color={"blue"}/>
                    </TouchableOpacity>
                  ),
                })}
              />
           </>
          ) : (
            <Stack.Screen name="Login" component={LoginForm} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  export default App;
