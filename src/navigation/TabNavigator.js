import {useState, useEffect} from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../screens/Map/Home";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Notification from "../screens/Notification";
import { View } from "react-native";
import Profile from "../screens/Profile";
import TopBarNavigator from "../navigation/TopBarNavigator";
import { useNotificationData } from "../hooks/useNotificationData";
import colors from "../constants/colors";
import useCurrentUser from "../hooks/useCurrentUser";

const Tab = createBottomTabNavigator();

const TabNavigator = ({responderUid}) => {

  const {currentUser} = useCurrentUser();
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const {notificationsCount} = useNotificationData();
  
  useEffect(() => {
    if (currentUser) {
      setIsProfileComplete(currentUser?.profileComplete);
    }
  }, [currentUser]);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: "map-marker",
            Records: "history",
            Notification: "bell",
            Profile: "account-circle",
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
        headerTintColor: "white",
        headerStyle: {
          backgroundColor:  colors.blue[800],
          shadowColor: "transparent"},
        tabBarActiveTintColor: colors.blue[800],
        tabBarInactiveTintColor: colors.gray[400],
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
      <Tab.Screen name="Home" options={{
        headerShown: false
      }}>
      {(props)=> <Home {...props} responderUid={responderUid}   setIsProfileComplete={setIsProfileComplete} />}
      </Tab.Screen>
      <Tab.Screen 
      name="Records" 
      component={TopBarNavigator}
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
          tabBarBadge: notificationsCount > 99 ? "99+" : notificationsCount === 0 ? null : notificationsCount,
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
