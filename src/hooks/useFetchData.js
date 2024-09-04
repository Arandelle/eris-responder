import {useState,useEffect} from 'react'
import {ref, onValue} from "firebase/database"
import {auth, database} from "../services/firebaseConfig"

export const useFetchData = () => {
    const [userData, setUserData] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if(user) {
      const userRef = ref(database, `responders/${user.uid}`);
      const unsubscribe = onValue(userRef, (snapshot)=>{
        if(snapshot.exists()){
          setUserData(snapshot.val());
        } else{
          setUserData(null);
          console.error("No user available");
        }
      });
      // cleanup subscription on unmount
      return ()=> unsubscribe();
    }
  }, []);

  return {userData, setUserData};
}
