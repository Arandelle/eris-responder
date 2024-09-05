import {useState, useEffect} from 'react'
import { View, Text, ScrollView} from 'react-native'
import {auth, database } from '../services/firebaseConfig'
import { ref, onValue } from 'firebase/database'

const History = () => {

  const [emergencyHistory, setEmergencyHistory] = useState([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
      const user = auth.currentUser
      if(user){
        const requestRef = ref(database, `responders/${user.uid}/history`);
        const unsubscribe = onValue(requestRef, (snapshot) => {
          try {
            const data = snapshot.val();
            const emergencyList = Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
            }))
            setEmergencyHistory(emergencyList);
            setLoading(false);
          } catch (error) {
            console.error("Error fetching emergency data:", error);
            setLoading(false);
          }
        });
        return () => unsubscribe();
      }
      }, []);

  return (
      <View className="bg-gray-100 h-full p-2 w-full rounded-lg shadow-lg">
        <ScrollView>
          {emergencyHistory.length > 0 ? (
            emergencyHistory.map((history) => (
              <View
                key={history.id}
                className="mb-4 p-2 border-b border-gray-200"
              >
                <Text className="text-lg text-blue-600">
                  Emergency ID: {history.emergencyId}
                </Text>
                <Text className="text-lg text-blue-600">
                  History ID: {history.id}
                </Text>
                <Text className="text-sm text-gray-800">
                  User ID: {history.userId}
                </Text>
                <Text className="text-sm text-gray-800">
                  Type: {history.type}
                </Text>
                <Text className="text-sm text-gray-600">
                  Name: {history.name}
                </Text>
                <Text className="text-sm text-gray-600">
                  Description: {history.description}
                </Text>
                <Text className="text-sm text-gray-600">
                  Location: {history.location}
                </Text>
                <Text className={`text-sm ${history.status === "expired" ? "text-red-600" : "text-gray-600 "}`}>
                  Status: {history.status}
                </Text>
                {history.status === "expired" && (
                <Text className="text-sm text-gray-600">
                  Expired At: {new Date(history.expiresAt).toLocaleString()}
                </Text>
                )}
                <Text className="text-sm text-gray-600">
                  Submitted: {new Date(history.timestamp).toLocaleString()}
                </Text>
                 <Text className="text-sm text-gray-600">
                  submiited by user: {new Date(history.date).toLocaleString()}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-center text-gray-500">No history found</Text>
          )}
        </ScrollView>
      </View>
  )
}

export default History
