import React, { useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

// Function to play the notification sound
const playNotificationSound = async () => {
  try {
    const soundObject = new Audio.Sound();
    
    try {
      // Use require with a more defensive approach
      await soundObject.loadAsync(require('../../assets/sounds/emergency_sound.mp3'));
      
      // Set audio mode to ensure sound plays even when device is in silent mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // Play sound
      await soundObject.setVolumeAsync(1.0);
      await soundObject.playAsync();
      
      // Return a cleanup function
      return () => {
        try {
          soundObject.unloadAsync();
        } catch (error) {
          console.log('Error unloading sound', error);
        }
      };
    } catch (error) {
      console.log('Error loading sound', error);
    }
  } catch (error) {
    console.error('Error initializing sound object:', error);
  }
};

export default function NotificationListener() {
  useEffect(() => {
    let cleanup = null;
    
    // Set up listeners for different notification states
    const foregroundSubscription = Notifications.addNotificationReceivedListener(async () => {
      cleanup = await playNotificationSound();
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(async () => {
      cleanup = await playNotificationSound();
    });

    // Clean up on unmount
    return () => {
      if (cleanup) cleanup();
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return null;
}