import { auth, database } from '../services/firebaseConfig';
import {ref, update} from "firebase/database"
import useFetchData from "./useFetchData" 
import { useMemo } from 'react';

const useCurrentUser = () => {

    const {data: userData, loading} = useFetchData("responders");

    const currentUser = useMemo(() => {
        const userId = auth.currentUser?.uid;
        return userData.find((user) => user.id === userId) || null;   
    }, [userData]);

    const updateCurrentUser = async (updatedData) => {
        const userId = auth.currentUser?.uid;
        if(userId){
            const userRef = ref(database, `responders/${userId}`);
            try{
                await update(userRef, updatedData);
                console.log("User data updated successfully!")
            } catch(error){
                console.error("Error updating: ", error)
            }
        }
    }

  return {currentUser, updateCurrentUser, loading}
}

export default useCurrentUser
