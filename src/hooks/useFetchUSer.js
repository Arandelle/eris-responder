import { onValue, ref } from 'firebase/database';
import {useEffect, useState} from 'react'
import { database } from '../services/firebaseConfig';
import useEmergencyData from './useEmergencyData';

const useFetchUSer = () => {

    const [userDetails, setUserDetails] = useState(null);
    const {emergencyData} = useEmergencyData()

    useEffect(() => {

        if(emergencyData?.userId){
            const userRef = ref(database, `users/${emergencyData.userId}`);
            const unsubscribe = onValue(userRef, (snapshot) => {
                if(snapshot.exists()){
                    setDataOFUser(snapshot.val())
                }else{
                    setDataOFUser(null);
                };
            });
    
            return ()=> unsubscribe();
        }
    }, [emergencyData]);

  return {userDetails}
}

export default useFetchUSer
