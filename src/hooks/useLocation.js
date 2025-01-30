import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { Alert } from "react-native";
import { ref, update, onValue, get } from "firebase/database";
import { database } from "../services/firebaseConfig";
import useFetchData from "./useFetchData";

const useLocation = (responderUid) => {
  const { data: userData } = useFetchData("responders");
  const [responderPosition, setResponderPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateLocation = async (latitude, longitude) => {
    const responderRef = ref(database, `responders/${responderUid}/location`);
    
    try {
      // Always update the responder's location
      await update(responderRef, { latitude, longitude });
      console.log("Responder location updated successfully");
  
      if (userData?.pendingEmergency?.userId) {
        // Check if the user actually has an active request
        const userActiveRequestRef = ref(database, `users/${userData.pendingEmergency.userId}/activeRequest`);
        const activeRequestSnapshot = await get(userActiveRequestRef);
  
        if (activeRequestSnapshot.exists()) {
          // User has an active request, update responder's location for the user
          const responderLocationForUser = ref(database, `users/${userData.pendingEmergency.userId}/activeRequest/locationOfResponder`);
          await update(responderLocationForUser, { latitude, longitude });
          console.log("Responder location updated for user with active request");
        } else {
          console.log("User does not have an active request. Skipping update of locationOfResponder.");
        }
      }
    } catch (error) {
      console.error("Error updating location: ", error);
    }
  }

  const hasLocationChanged = (oldLocation, newLocation, threshold = 0.0001) => {
    return (
      Math.abs(oldLocation.latitude - newLocation.latitude) > threshold ||
      Math.abs(oldLocation.longitude - newLocation.longitude) > threshold
    );
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
          await updateLocation(fallbackLocation.latitude, fallbackLocation.longitude);
          setResponderPosition(fallbackLocation);
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setResponderPosition({ latitude, longitude });

        Location.watchPositionAsync({ distanceInterval: 1 }, async (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          if (!responderPosition || hasLocationChanged(responderPosition, { latitude, longitude })) {
            setResponderPosition({ latitude, longitude });
            await updateLocation(latitude, longitude);
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
        await updateLocation(fallbackLocation.latitude, fallbackLocation.longitude);
        setResponderPosition(fallbackLocation);
        setLoading(false);
      }
    };

    requestLocation();
  }, [responderUid, userData]);

  // Firebase real-time listener for the responder's location
  useEffect(() => {
    const responderRef = ref(database, `responders/${responderUid}/location`);
    
    const unsubscribe = onValue(responderRef, (snapshot) => {
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
