import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
import MapView, { Polyline, Marker, Callout } from "react-native-maps";
import * as Location from 'expo-location';
import { OPENROUTE_API_KEY } from '@env'
import { ref, onValue, set } from "firebase/database";
import { database } from "../services/firebaseConfig";

const openRouteKey = OPENROUTE_API_KEY;

const Home = () => {
  const [responderPosition, setResponderPosition] = useState(null);
  const [emergencyData, setEmergencyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        setResponderPosition({ latitude: 14.33289, longitude: 120.85065 }); // Fallback position
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setResponderPosition({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      // Watch position changes
      Location.watchPositionAsync({ distanceInterval: 10 }, (newLocation) => {
        const { latitude, longitude } = newLocation.coords;
        setResponderPosition({ latitude, longitude });

        // Update location in Firebase
        const responderRef = ref(database, `admins/responder1`); // You can use dynamic ID for multiple responders
        set(responderRef, { latitude, longitude });
      });
    })();
  }, []);
  
  useEffect(() => {
    const requestRef = ref(database, "emergencyRequests");
    const unsubscribe = onValue(requestRef, (snapshot) => {
      try {
        const data = snapshot.val();
        const emergencyList = Object.entries(data)
          .filter(([_, emergency]) => emergency.location && emergency.status !== "done")
          .map(([id, emergency]) => ({
            id,
            name: emergency.name || "Unknown",
            type: emergency.type || "Unspecified",
            location: { latitude: emergency.location.latitude, longitude: emergency.location.longitude },
            status: emergency.status || "active",
            description: emergency.description || "none",
          }));
        setEmergencyData(emergencyList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching emergency data:", error);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (responderPosition && selectedEmergency) {
      fetchRoute();
    }
  }, [responderPosition, selectedEmergency]);

  const fetchRoute = async () => {
    if (!responderPosition || !selectedEmergency) return;

    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${openRouteKey}&start=${responderPosition.longitude},${responderPosition.latitude}&end=${selectedEmergency.location.longitude},${selectedEmergency.location.latitude}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates;
        const formattedRoute = coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0]
        }));
        setRoute(formattedRoute);
        setDistance(data.features[0].properties.summary.distance / 1000);
      }
    } catch (error) {
      console.error('Error fetching route:', error)
    }
  };

  useEffect(() => {
    const responderRef = ref(database, "responders/responder1");
    const unsubscribe = onValue(responderRef, (snapshot) => {
      const location = snapshot.val();
      if (location) {
        setResponderPosition({
          latitude: location.latitude,
          longitude: location.longitude
        });
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading || !responderPosition) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  const handleSelectEmergency = (emergency) =>{
    setSelectedEmergency(emergency)
  }

  return (
    <View style={styles.container}>
      <View style={styles.footer}>
        <Text>Distance to target: {distance.toFixed(2)} km</Text>
        {selectedEmergency && (
          <TouchableOpacity style={styles.button} onPress={fetchRoute}>
            <Text style={styles.buttonText}>Refresh Route</Text>
          </TouchableOpacity>
        )}
      </View>
      <MapView
        style={styles.map}
        initialRegion={{
          ...responderPosition,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        <Marker
          coordinate={responderPosition}
          title="You are here"
          pinColor="#42a5f5"
        />
        {emergencyData.map((emergency) => (
          <Marker
            key={emergency.id}
            coordinate={emergency.location}
            pinColor="red"
          >
            <Callout onPress={()=> handleSelectEmergency(emergency)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>Emergency Details</Text>
                <Text>Name: {emergency.name}</Text>
                <Text>Type: {emergency.type}</Text>
                <Text>Description: {emergency.description}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
        {route.length > 0 && (
          <Polyline coordinates={route} strokeColor="red" strokeWidth={2} />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8
  },
  footer: {
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  callout: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
});

export default Home;
