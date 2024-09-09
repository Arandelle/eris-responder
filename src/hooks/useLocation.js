import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { Alert } from "react-native";
import { ref, update, onValue } from "firebase/database";
import { database } from "../services/firebaseConfig";

const useLocation = (responderUid) => {
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

          const responderRef = ref(
            database,
            `responders/${responderUid}/location`
          );
          update(responderRef, fallbackLocation);
          setResponderPosition(fallbackLocation);
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setResponderPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        Location.watchPositionAsync({ distanceInterval: 1 }, (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setResponderPosition({ latitude, longitude });

          const responderRef = ref(database, `responders/${responderUid}`);
          update(responderRef, { location: { latitude, longitude } });
        });
        setLoading(false);
      } catch (error) {
        console.error("Location request failed: ", error);
        Alert.alert(
          "Location permission was denied",
          "The app is using a default fallback location. Please enable location permissions in your device settings for accurate location tracking."
        );
        const fallbackLocation = { latitude: 14.33289, longitude: 120.85065 }; // fallback position

        const responderRef = ref(
          database,
          `responders/${responderUid}/location`
        );
        update(responderRef, fallbackLocation);
        setResponderPosition(fallbackLocation);
        setLoading(false);
      }
    };
    requestLocation();
  }, [responderUid]);

  useEffect(() => {
    const respondeRef = ref(database, `responders/${responderUid}`);
    const unsubscribe = onValue(respondeRef, (snapshot) => {
      const responderData = snapshot.val();

      if (responderData && responderData.locationCoords) {
        setResponderPosition({
          latitude: responderData.locationCoords.latitude,
          longitude: responderData.locationCoords.longitude,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  return { responderPosition, setResponderPosition, loading, setLoading };
};

export default useLocation;
