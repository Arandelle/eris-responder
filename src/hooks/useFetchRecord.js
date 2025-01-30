import { useEffect, useState, useCallback } from "react";
import { auth, database } from "../services/firebaseConfig";
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database";

const useFetchRecord = (status) => {
  const [emergencyRecords, setEmergencyRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const requestRef = query(
      ref(database, `responders/${user.uid}/history`),
      orderByChild("status"), 
      equalTo(status) // Only fetch relevant status
    );

    const unsubscribe = onValue(requestRef, (snapshot) => {
      if (!snapshot.exists()) {
        setEmergencyRecords([]);
        setLoading(false);
        return;
      }

      const data = snapshot.val();
      const emergencyList = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));

      setEmergencyRecords(emergencyList);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [status]);

  return { emergencyRecords, loading };
};

export default useFetchRecord;
