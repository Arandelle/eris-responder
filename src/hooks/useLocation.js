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

  const updateLocation = async (latitude, longitude) =>{
    const responderRef = ref(database, `responders/${responderUid}/location`);
          
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
  }

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
          await updateLocation(fallbackLocation.latitude, fallbackLocation.longitude)
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
          await updateLocation(latitude, longitude)
        });

        setLoading(false);
      } catch (error) {
        console.error("Location request failed: ", error);
        Alert.alert(
          "Location permission was denied",
          "The app is using a default fallback location. Please enable location permissions in your device settings for accurate location tracking."
        );
        
        const fallbackLocation = { latitude: 14.33289, longitude: 120.85065 };
        await updateLocation(fallbackLocation.latitude, fallbackLocation.longitude)
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
