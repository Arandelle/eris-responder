import {useState, useEffect} from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../screens/Home";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Notification from "../screens/Notification";
import { View } from "react-native";
import History from "../screens/History";
import Profile from "../screens/Profile";
import { useFetchData } from "../hooks/useFetchData";
import { useNotificationData } from "../hooks/useNotificationData";

const Tab = createBottomTabNavigator();

const TabNavigator = ({responderUid}) => {

  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const {userData} = useFetchData();
  const {notificationsCount} = useNotificationData();
  
  useEffect(() => {
    if (userData) {
      setIsProfileComplete(userData.profileComplete);
    }
  }, [userData]);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: "map-marker-radius-outline",
            History: "history",
            Notification: "bell-outline",
            Profile: "account-circle-outline",
          };

          const iconName = icons[route.name];

          return (
            <View className="items-center">
              <View className={`items-center justify-center bg-transparent`}>
                <Icon
                  name={iconName}
                  size={ size + 4}
                  color={color}
                />
              </View>
            </View>
          );
        },
        tabBarActiveTintColor: "#42a5f5",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          paddingBottom: 10,
          paddingTop: 10,
          height: 70,
          // position: "absolute",
          // bottom: 16,
          // right: 16,
          // left: 16,
          // borderRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 15,
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Home">
      {(props)=> <Home {...props} responderUid={responderUid}   setIsProfileComplete={setIsProfileComplete} />}
      </Tab.Screen>
      <Tab.Screen 
      name="History" 
      component={History}
      options={{
        title: "Emergency Records",
        tabBarLabel: "Records",
      }}
      />
      <Tab.Screen
        name="Notification"
        component={Notification}
        options={{
          title: "Notification",
          tabBarBadge: notificationsCount === 0 ? null : notificationsCount,
        }}
      />
      <Tab.Screen
        name="Profile"
        options={{
          title: "Profile",
          headerShown: true,
          tabBarBadge: !isProfileComplete ? true : null,
        }}
      >
        {(props) => (
          <Profile {...props} responderUid={responderUid} setIsProfileComplete={setIsProfileComplete} />
        )}
      </Tab.Screen>
      
    </Tab.Navigator>
  );
};

export default TabNavigator;
