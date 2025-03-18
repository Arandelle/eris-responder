import React, {useCallback, useState, useEffect} from 'react';
import { Alert } from 'react-native';
import { auth,database } from '../../services/firebaseConfig';
import { ref, get, remove, push, serverTimestamp, update, onValue } from 'firebase/database';

const useEmergencyFunction = (
    setIsEmergencyDone,
    setRoute,
    setDistance,
    currentUser
) => {
    const [selectedEmergency, setSelectedEmergency] = useState(null); // on-going emergency
    const [loading, setLoading] = useState(false);

      // Effect for pending emergency subscription
      useEffect(() => {
        const user = auth.currentUser;
        const respondeRef = ref(
          database,
          `responders/${user.uid}/pendingEmergency`
        );
    
        return onValue(respondeRef, (snapshot) => {
          const responderData = snapshot.val();
          if (responderData?.locationCoords) {
            setSelectedEmergency({
              latitude: responderData.locationCoords.latitude,
              longitude: responderData.locationCoords.longitude,
              id: responderData.emergencyId,
            });
          } else {
            setSelectedEmergency(null);
          }
        });
      }, []);
    

    const handleSelectEmergency = useCallback(
        async (emergency) => {
          setLoading(true);
          try {
            if (currentUser?.pendingEmergency) {
              Alert.alert(
                "Error Navigating",
                "You have an ongoing emergency. Please assist them first."
              );
              return;
            }
    
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated.");
    
            // Create history entry first
            const historyRef = ref(database, `responders/${user.uid}/history`);
            const newHistoryEntry = {
              emergencyId: emergency.emergencyId,
              userId: emergency.userId,
              timestamp: serverTimestamp(),
              location: emergency.location.geoCodeLocation,
              description: emergency.description ?? "No description",
              status: "on-going",
              date: emergency.date,
              responseTime: new Date().toISOString(),
            };
    
            const newHistoryRef = await push(historyRef, newHistoryEntry);
            if (!newHistoryRef.key)
              throw new Error("Failed to create history entry.");
    
            const historyId = newHistoryRef.key;
    
            // Notification Data
            const notificationRef = ref(
              database,
              `users/${emergency.userId}/notifications`
            );
            const notificationData = {
              responderId: user.uid,
              type: "responder",
              title: "Emergency Response Dispatched",
              message: `A responder has been dispatched for your ${emergency.type} emergency.`,
              isSeen: false,
              date: new Date().toISOString(),
              timestamp: serverTimestamp(),
              icon: "car-emergency",
            };
    
            // Create notification BEFORE updates
            await push(notificationRef, notificationData);

            const logsDataRef = ref(database, `usersLog`);
            const usersLogData = {
              userId: user?.uid,
              date: new Date().toISOString(),
              type: "Assist an emergency",   
            }
            await push(logsDataRef,usersLogData);
           
    
            // If history entry and notification succeeded, proceed with batch updates
            const updates = {
              [`responders/${user.uid}/pendingEmergency`]: {
                userId: emergency.userId,
                emergencyId: emergency.emergencyId,
                historyId: historyId,
                locationCoords: {
                  latitude: emergency.location.latitude,
                  longitude: emergency.location.longitude,
                },
              },
              [`emergencyRequest/${emergency.id}/status`]: "on-going",
              [`emergencyRequest/${emergency.id}/locationOfResponder`]: {
                latitude: currentUser?.location?.latitude,
                longitude: currentUser?.location?.longitude,
              },
              [`emergencyRequest/${emergency.id}/responderId`]: user.uid,
              [`emergencyRequest/${emergency.id}/responseTime`]:
                new Date().toISOString(),
              [`users/${emergency.userId}/emergencyHistory/${emergency.id}/status`]:
                "on-going",
              [`users/${emergency.userId}/emergencyHistory/${emergency.id}/locationOfResponder`]:
                {
                  latitude: currentUser?.location.latitude,
                  longitude: currentUser?.location.longitude,
                },
              [`users/${emergency.userId}/emergencyHistory/${emergency.id}/responderId`]:
                user.uid,
              [`users/${emergency.userId}/emergencyHistory/${emergency.id}/responseTime`]:
                new Date().toISOString(),
              [`users/${emergency.userId}/activeRequest/responderId`]: user.uid,
              [`users/${emergency.userId}/activeRequest/locationOfResponder`]: {
                latitude: currentUser?.location.latitude,
                longitude: currentUser?.location.longitude,
              },
              [`users/${emergency.userId}/activeRequest/status`]: "on-going",
            };
    
            await update(ref(database), updates);
    
            Alert.alert(
              "Response Initiated",
              "You have been assigned to this emergency. Please proceed to the location."
            );
          } catch (error) {
            console.error("Error selecting emergency:", error);
            Alert.alert(
              "Error",
              "Failed to process emergency response. Please try again."
            );
          } finally{
            setLoading(false);
          }
        },
        [currentUser]
      );

    const handleEmergencyDone = useCallback((emergency) => {
        Alert.alert("Notice!", "Are you sure this emergency is resolved?", [
          {
            text: "cancel",
          },
          {
            text: "Mark as Resolved",
            onPress: async () => {
              try {
                setLoading(true)
                const user = auth.currentUser;
                if (user) {
                  const responderDataRef = ref(
                    database,
                    `responders/${user.uid}/pendingEmergency`
                  );
                  const responderSnapshot = await get(responderDataRef);
    
                  if (responderSnapshot.exists()) {
                    const responderData = responderSnapshot.val();
                    const historyId = responderData?.historyId;
    
                    await remove(
                      ref(database, `responders/${user.uid}/pendingEmergency`)
                    );
                    await remove(
                      ref(database, `users/${emergency.userId}/activeRequest`)
                    );
    
                    const notificationRefForUser = ref(
                      database,
                      `users/${emergency.userId}/notifications`
                    );
                    
                    const logsDataRef = ref(database, `usersLog`);
                    const usersLogData = {
                      userId: user?.uid,
                      date: new Date().toISOString(),
                      type: "Emergency mark as done",   
                    }

                    await push(notificationRefForUser, {
                      responderId: user.uid,
                      type: "responder",
                      title: "Emergency report resolved!",
                      message: `Your report for ${emergency.type} has been resolved`,
                      isSeen: false,
                      date: new Date().toISOString(),
                      timestamp: serverTimestamp(),
                      icon: "shield-check",
                    });
                    await push(logsDataRef, usersLogData);

                    const updates = {
                      [`emergencyRequest/${emergency.id}/status`]: "resolved",
                      [`users/${emergency.userId}/emergencyHistory/${emergency.id}/status`]:
                        "resolved",
                      [`responders/${user.uid}/history/${historyId}/status`]:
                        "resolved",
                      [`emergencyRequest/${emergency.id}/dateResolved`]:
                        new Date().toISOString(),
                      [`users/${emergency.userId}/emergencyHistory/${emergency.id}/dateResolved`]:
                        new Date().toISOString(),
                      [`responders/${user.uid}/history/${historyId}/dateResolved`]:
                        new Date().toISOString(),
                    };
    
                    await update(ref(database), updates);
    
                    Alert.alert(
                      "Success!",
                      "Emergency request successfully resolved!"
                    );
                    setSelectedEmergency(false);
                    setIsEmergencyDone(true);
                    setRoute(0);
                    setDistance(0);
                  } else {
                    console.log("No pending emergency");
                  }
                } else {
                  console.log("No user available");
                }
              } catch (error) {
                console.error("Error", error);
              } finally{
                setLoading(false);
              }
            },
          },
        ]);
      }, []);

  return {handleSelectEmergency,handleEmergencyDone,selectedEmergency, loading }
}

export default useEmergencyFunction;
