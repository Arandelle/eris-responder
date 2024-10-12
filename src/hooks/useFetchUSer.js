import { onValue, ref } from 'firebase/database';
import {useEffect, useState} from 'react'
import { database } from '../services/firebaseConfig';

const useFetchUser = ({userId}) => {

    const [userDetails, setUserDetails] = useState(null);

    useEffect(() => {

        if(userId){
            const userRef = ref(database, `users/${userId}`);
            const unsubscribe = onValue(userRef, (snapshot) => {
                if(snapshot.exists()){
                    setUserDetails(snapshot.val())
                }else{
                    setUserDetails(null);
                };
            });
    
            return ()=> unsubscribe();
        }
    }, [userId]);

  return {userDetails}
}

export default useFetchUser
