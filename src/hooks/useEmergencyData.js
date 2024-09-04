import { useEffect, useState } from "react";
import {ref, onValue} from "firebase/database"
import { database } from "../services/firebaseConfig";

const useEmergencyData = () => {

    const [emergencyData, setEmergencyData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const requestRef = ref(database, "emergencyRequest");
        const unsubscribe = onValue(requestRef, (snapshot) => {
          try {
            const data = snapshot.val();
            const emergencyList = Object.entries(data)
              .filter(
                ([_, emergency]) =>
                  emergency.locationCoords && emergency.status !== "done"
              )
              .map(([id, emergency]) => ({
                id,
                userId: emergency.userId,
                name: emergency.name || "Unknown",
                type: emergency.type || "Unspecified",
                locationCoords: {
                  latitude: emergency.locationCoords.latitude,
                  longitude: emergency.locationCoords.longitude,
                },
                location: emergency.location,
                status: emergency.status || "active",
                description: emergency.description || "none",
                timestamp: new Date(emergency.timestamp).toLocaleString(),
              }));
            setEmergencyData(emergencyList);
            setLoading(false);
          } catch (error) {
            console.error("Error fetching emergency data:", error);
            setLoading(false);
          }
        });
        return () => unsubscribe();
      }, []);

  return {emergencyData, loading}
}

export default useEmergencyData
