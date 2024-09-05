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
            const emergencyList = Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
            }))
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
