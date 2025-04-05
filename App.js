import { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Alert, Text, View, Image, Button } from "react-native";
import { auth } from "./src/services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { get, getDatabase, ref } from "firebase/database";
import { NavigationContainer } from "@react-navigation/native";
import Home from "./src/screens/Map/Home";
import LoginForm from "./src/screens/LoginForm";
import TabNavigator from "./src/navigation/TabNavigator";
import UpdateProfile from "./src/screens/UpdateProfile";
import Logo from "./assets/logo.png";
import Records from "./src/screens/Records";
import ChangePassModal from "./src/screens/ChangePassModal";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AvatarList from "./src/components/AvatarList";
import * as Notifications from "expo-notifications";
import NotificationListener from "./src/screens/NotificationListener";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import useFetchData from "./src/hooks/useFetchData";
import AlertUi from "./src/screens/AlertUi";

const Stack = createNativeStackNavigator();
const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND_NOTIFICATION_TASK";
// Register the background task - this needs to be outside any component
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    // This task will be executed when notifications arrive in background
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background task failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Configure notification handler - needs to be outside component
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // Make sound play by default
    shouldSetBadge: false,
  }),
});

const App = () => {
  const [user, setUser] = useState(null);
  const [isResponder, setIsResponder] = useState(false);
  const [loading, setLoading] = useState(true);
  const { data: emergencyRequest } = useFetchData("emergencyRequest");
  const [pendingEmergency, setPendingEmergency] = useState([]);
  const [prevLength, setPrevLength] = useState(0);
  const [showAlert, setShowAlert] = useState(false);

  // Request permissions and set up background tasks
  useEffect(() => {
    // Function to request notification permissions
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Notification permissions are needed for emergency alerts."
        );
        return false;
      }
      return true;
    };

    // Set up background notification handling
    const setupBackgroundNotifications = async () => {
      // Register the app for background tasks
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

      // Create a notification category for emergency alerts
      await Notifications.setNotificationCategoryAsync("emergency", [
        {
          identifier: "view-emergency",
          buttonTitle: "View",
          options: {
            opensAppToForeground: true,
          },
        },
      ]);
    };

    // Initialize all notification settings
    const initializeNotifications = async () => {
      const permissionsGranted = await requestPermissions();
      if (permissionsGranted) {
        await setupBackgroundNotifications();
      }
    };

    initializeNotifications();

    // Clean up on component unmount
    return () => {
      Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    };
  }, []);

  // Function to send a test notification
  const sendTestNotification = async () => {
    const message =
     `🚨 ${pendingEmergency[0].emergencyType} at ${pendingEmergency[0].location.geoCodeLocation}. ${pendingEmergency[0].description}` 
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚨 Emergency Alert!",
        body: message || "New emergency occur",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: "emergency",
        autoDismiss: false,
        // You can specify a custom sound file for iOS
        sound: "emergency_sound.mp3",
        // Add vibration pattern for Android
        vibrate: [0, 250, 250, 250],
      },
      trigger: null, // Send immediately
    });
  };

  // check the current logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const db = getDatabase();
        const responderRef = ref(db, `responders/${user.uid}`);

        try {
          const responderSnapshot = await get(responderRef);
          console.log(
            `responder snapshot exists: ${responderSnapshot.exists()}`
          );
          setIsResponder(responderSnapshot.exists());
        } catch (error) {
          console.error("Error fetching admin data:", error);
          Alert.alert("Error", "Account is not found");
        }
      } else {
        setUser(null);
        setIsResponder(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading || !emergencyRequest) return; // Wait until data is loaded and ensure it exists
  
    // Filter emergency requests with "pending" status
    const pendingRequests = Array.isArray(emergencyRequest) 
      ? emergencyRequest.filter(req => req.status === "pending")
      : [];
  
    // Check if a new "pending" request was added
    if (pendingRequests.length > prevLength) {
      setPendingEmergency(pendingRequests);
      // Only send notification if there are pending emergencies
      if (pendingRequests.length > 0) {
        sendTestNotification(); // Trigger sound/notification
        setShowAlert(true);
        setTimeout(() => {
          setShowAlert(false)
        }, 10000);
      }
    }
  
    // Update previous length state
    setPrevLength(pendingRequests.length);
  }, [emergencyRequest, loading]);

  if (loading) {
    return (
      <View className="flex w-full h-full items-center justify-center">
        <Image source={Logo} alt="Loading..." />
        <Text>Loading please wait...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} pointerEvents="auto">
      <NotificationListener />
      {showAlert && <AlertUi/>}
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontWeight: "900",
              fontSize: 24,
            },
          }}
        >
          {user && isResponder ? (
            <>
              <Stack.Screen name="Eris">
                {() => <TabNavigator responderUid={user.uid} />}
              </Stack.Screen>
              <Stack.Screen name="Records" component={Records} />
              <Stack.Screen name="Map" component={Home} />
              <Stack.Screen
                name="ChangePassword"
                component={ChangePassModal}
                options={() => ({
                  title: "Change Password",
                  headerShown: true,
                })}
              />
              <Stack.Screen
                name="UpdateProfile"
                component={UpdateProfile}
                options={() => ({
                  title: "Update your profile",
                  headerShown: true,
                })}
              />
              <Stack.Screen
                name="Avatars"
                component={AvatarList}
                options={() => ({
                  title: "Choose Avatar",
                  headerShown: true,
                })}
              />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginForm} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
