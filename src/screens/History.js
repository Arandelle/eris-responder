import {useState, useEffect} from 'react'
import { View, Text, ScrollView, Modal} from 'react-native'
import {auth, database } from '../services/firebaseConfig'
import { ref, get } from 'firebase/database'

const History = () => {

  const [emergencyHistory, setEmergencyHistory] = useState([]);

  useEffect(() => {
      fetchEmergencyHistory();
  }, []);

  const fetchEmergencyHistory = async () => {
    const user = auth.currentUser;

    if (user) {
      const userRef = ref(database, `emergencyRequest`);
      const historySnapshot = await get(userRef);
      const historyData = historySnapshot.val();

      if (historyData) {
        const emergencyPromises = Object.keys(historyData).map(async (key) => {
          const emergencyRef = ref(database, `emergencyRequest/${key}`);
          const emergencySnapshot = await get(emergencyRef);
          return { id: key, ...emergencySnapshot.val() };
        });

        const emergencies = await Promise.all(emergencyPromises);
        setEmergencyHistory(emergencies);
      } else {
        setEmergencyHistory([]);
      }
    }
  };
  

  return (
      <View className="bg-gray-100 h-full p-2 w-full rounded-lg shadow-lg">
        <ScrollView>
          {emergencyHistory.length > 0 ? (
            emergencyHistory.map((emergency) => (
              <View
                key={emergency.id}
                className="mb-4 p-2 border-b border-gray-200"
              >
                <Text className="text-lg text-blue-600">
                  Emergency ID: {emergency.id}
                </Text>
                <Text className="text-sm text-gray-800">
                  User ID: {emergency.userId}
                </Text>
                <Text className="text-sm text-gray-800">
                  Type: {emergency.type}
                </Text>
                <Text className="text-sm text-gray-600">
                  Name: {emergency.name}
                </Text>
                <Text className="text-sm text-gray-600">
                  Description: {emergency.description}
                </Text>
                <Text className="text-sm text-gray-600">
                  Location: {emergency.location.latitude},{" "}
                  {emergency.location.longitude}
                </Text>
                <Text className={`text-sm ${emergency.status === "expired" ? "text-red-600" : "text-gray-600 "}`}>
                  Status: {emergency.status}
                </Text>
                {emergency.status === "expired" && (
                <Text className="text-sm text-gray-600">
                  Expired At: {new Date(emergency.expiresAt).toLocaleString()}
                </Text>
                )}
                <Text className="text-sm text-gray-600">
                  Submitted: {new Date(emergency.timestamp).toLocaleString()}
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
