import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { Alert } from "react-native";
import { ref, update, onValue } from "firebase/database";
import { database } from "../services/firebaseConfig";
import { useFetchData } from "./useFetchData";

const useLocation = (responderUid) => {
  const { userData } = useFetchData();
  const [responderPosition, setResponderPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const requestLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          console.error("Permission to access location was denied");
          Alert.alert(
            "Eris says: ",
            "Permission to access location was denied"
          );

          const fallbackLocation = { latitude: 14.33289, longitude: 120.85065 }; // fallback position
          const responderRef = ref(database, `responders/${responderUid}/location`);
          
          // Ensure that the userData is available and valid before updating
          if (userData?.pendingEmergency?.userId) {
            const responderLocationForUser = ref(database, `users/${userData.pendingEmergency.userId}/activeRequest/locationOfResponder`);
            
            try {
              await update(responderRef, fallbackLocation);
              await update(responderLocationForUser, fallbackLocation);
              console.log("Fallback location successfully updated to both responder and user");
            } catch (error) {
              console.error("Error updating location: ", error);
            }
          }

          setResponderPosition(fallbackLocation);
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setResponderPosition({ latitude, longitude });

        Location.watchPositionAsync({ distanceInterval: 1 }, async (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setResponderPosition({ latitude, longitude });

          const responderRef = ref(database, `responders/${responderUid}/location`);
          
          // Ensure user data is available and valid before updating
          if (userData?.pendingEmergency?.userId) {
            const responderLocationForUser = ref(database, `users/${userData.pendingEmergency.userId}/activeRequest/locationOfResponder`);

            try {
              await update(responderRef, { latitude, longitude });
              await update(responderLocationForUser, { latitude, longitude });
              console.log("Location successfully updated for both responder and user");
            } catch (error) {
              console.error("Error updating location: ", error);
            }
          }
        });

        setLoading(false);
      } catch (error) {
        console.error("Location request failed: ", error);
        Alert.alert(
          "Location permission was denied",
          "The app is using a default fallback location. Please enable location permissions in your device settings for accurate location tracking."
        );
        
        const fallbackLocation = { latitude: 14.33289, longitude: 120.85065 };

        const responderRef = ref(database, `responders/${responderUid}/location`);
        
        if (userData?.pendingEmergency?.userId) {
          const responderLocationForUser = ref(database, `users/${userData.pendingEmergency.userId}/activeRequest/locationOfResponder`);
          
          try {
            await update(responderRef, fallbackLocation);
            await update(responderLocationForUser, fallbackLocation);
            console.log("Fallback location successfully updated for both responder and user");
          } catch (error) {
            console.error("Error updating location: ", error);
          }
        }

        setResponderPosition(fallbackLocation);
        setLoading(false);
      }
    };

    requestLocation();
  }, [responderUid, userData]);

  // Firebase real-time listener for the responder's location
  useEffect(() => {
    const respondeRef = ref(database, `responders/${responderUid}/location`);
    
    const unsubscribe = onValue(respondeRef, (snapshot) => {
      const responderLocation = snapshot.val();
      if (responderLocation) {
        setResponderPosition({
          latitude: responderLocation.latitude,
          longitude: responderLocation.longitude,
        });
      }
    });

    return () => unsubscribe();
  }, [responderUid]);

  return { responderPosition, loading };
};

export default useLocation;
