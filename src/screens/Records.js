import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { auth, database } from '../services/firebaseConfig';
import { ref, onValue } from 'firebase/database';

const Records = ({ status }) => {
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

  // Sorting history by date
  emergencyRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

  const emergencyStatus = {
    "awaiting response": 'bg-yellow-300',
    "on-ging": 'bg-orange-300',
    resolved: 'bg-green-300',
    expired: 'bg-red-300',
  };

  return (
    <View className="bg-gray-100 h-full p-2 w-full rounded-lg shadow-lg">
      <ScrollView>
        {emergencyRecords.length > 0 ? (
          emergencyRecords.map((history) => (
            <View key={history.id}>
              <View
                className={`flex flex-row justify-between p-2 border border-gray-500 ${emergencyStatus[history.status]}`}
              >
                <Text className="text-lg font-bold">History ID:</Text>
                <Text className="text-lg">{history.id}</Text>
              </View>
              <View className="space-y-2 p-3">
                <Text className="text-lg font-bold">
                  Type: {history.type.toUpperCase()}
                </Text>
                <Text className="text-lg">Name: {history.name}</Text>
                <Text className="text-lg">Description: {history.description}</Text>
                <Text className="text-lg">Location: {history.location}</Text>
                <Text className="text-lg">Status: {history.status.toUpperCase()}</Text>
                <Text className="text-lg">
                  Submitted: {new Date(history.date).toLocaleString()}
                </Text>
                <Text className="text-lg">
                  Date Accepted: {new Date(history.dateAccepted).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text className="text-center text-gray-500">{`No records found for ${status}`}</Text>
        )}
      </ScrollView>
    </View>
  );
};

export default Records;
