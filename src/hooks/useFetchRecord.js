import {useEffect, useState} from 'react'
import { auth, database } from '../services/firebaseConfig';
import { ref, onValue } from 'firebase/database';

const useFetchRecord = (status) => {

    const [emergencyRecords, setEmergencyRecords] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const user = auth.currentUser;
      if (user) {
        const requestRef = ref(database, `responders/${user.uid}/history`);
        const unsubscribe = onValue(requestRef, (snapshot) => {
          try {
            const data = snapshot.val();
            const emergencyList = Object.keys(data)
              .map((key) => ({
                id: key,
                ...data[key],
              }))
              .filter((item) => item.status === status); // Filter by status
            setEmergencyRecords(emergencyList);
            setLoading(false);
          } catch (error) {
            console.error('Error fetching emergency data:', error);
            setLoading(false);
          }
        });
        return () => unsubscribe();
      }
    }, [status]);

  return {emergencyRecords}; 
}

export default useFetchRecord
