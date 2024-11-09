import { useEffect, useState } from "react"
import {ref, onValue} from "firebase/database"
import { database } from "../services/firebaseConfig";

const useFetchData = (dataType) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(()=>{
        const dataRef = ref(database, dataType);
        const unsubscribe = onValue(dataRef, (snapshot) => {
            if(snapshot.exists()){
                const data = snapshot.val();
                const dataList = Object.keys(data).map((key) =>({
                    id: key,
                    ...data[key],
                }));
                setData(dataList);
            }else{
                setData([])
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [dataType])

  return {data, loading}
}

export default useFetchData