import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { auth, database } from '../services/firebaseConfig';
import { ref, onValue } from 'firebase/database';

const FilteredHistory = ({ status }) => {
  const [emergencyHistory, setEmergencyHistory] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const requestRef = ref(database, `responders/${user.uid}/history`);
      const unsubscribe = onValue(requestRef, (snapshot) => {
        const data = snapshot.val();
        const emergencyList = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((item) => item.status === status); // Filter by status

        setEmergencyHistory(emergencyList);
      });
      return () => unsubscribe();
    }
  }, [status]);

  return (
    <ScrollView>
      {emergencyHistory.length > 0 ? (
        emergencyHistory.map((history) => (
          <View key={history.id}>
            <Text>Type: {history.type.toUpperCase()}</Text>
            <Text>Name: {history.name}</Text>
            <Text>Status: {history.status.toUpperCase()}</Text>
          </View>
        ))
      ) : (
        <Text>No records found for {status}</Text>
      )}
    </ScrollView>
  );
};

const History = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'awaiting', title: 'Awaiting Response' },
    { key: 'ongoing', title: 'On-going' },
    { key: 'resolved', title: 'Resolved' },
    { key: 'expired', title: 'Expired' },
  ]);

  const renderScene = SceneMap({
    awaiting: () => <FilteredHistory status="awaiting response" />,
    ongoing: () => <FilteredHistory status="on-going" />,
    resolved: () => <FilteredHistory status="resolved" />,
    expired: () => <FilteredHistory status="expired" />,
  });

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: 400 }} // Adjust width if needed
      renderTabBar={(props) => (
        <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: 'blue' }}
          style={{ backgroundColor: 'white' }}
          labelStyle={{fontWeight: "bold"}}
          activeColor='blue'
          inactiveColor='gray'
        />
      )}
    />
  );
};

export default History;
