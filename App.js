import { useState, useEffect } from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Alert, Text, View } from 'react-native';
import { auth } from './src/services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { get, getDatabase, ref } from 'firebase/database';
import { NavigationContainer } from '@react-navigation/native';
import Home from './src/screens/Home';
import LoginForm from './src/screens/LoginForm';

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
        const adminRef = ref(db, `admins/${user.uid}`);
        
        try {
          const adminSnapshot = await get(adminRef);
          console.log(`Admin snapshot exists: ${adminSnapshot.exists()}`);
          setIsResponder(adminSnapshot.exists());
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
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user && isResponder ? (
          <Stack.Screen name="Home" component={Home} />
        ) : (
          <Stack.Screen name="Login" component={LoginForm} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
