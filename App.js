import { useState, useEffect } from 'react';
import {createNativeStackNavigator} from "@react-navigation/native-stack"
import { Text, View } from 'react-native';
import { auth } from './src/services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { get, getDatabase, ref } from 'firebase/database';
import { NavigationContainer } from '@react-navigation/native';
import Home from './src/screens/Home';

const Stack = createNativeStackNavigator();

const App = () =>  {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const db = getDatabase();
        const adminRef = ref(db, `admins/${user.uid}`);
        const adminSnapshot = await get(adminRef);
        setIsAdmin(adminSnapshot.exists());
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    // <View className="w-full h-full flex items-center justify-center">
    //   <Text>Open up App.js to start working on your app!</Text>
    //   <StatusBar style="auto" />
    // </View>
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
