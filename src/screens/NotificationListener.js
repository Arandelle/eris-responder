// NotificationListener.js
import React, { useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

// Function to play the notification sound
const playNotificationSound = async () => {
  try {
    // Load sound
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/emergencySound.mp3'),
      { shouldPlay: false }
    );

    // Set audio mode to ensure sound plays even when device is in silent mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // Play sound and increase volume
    await sound.setVolumeAsync(1.0);
    await sound.playAsync();

    // Ensure sound plays completely by waiting before unloading
    const status = await sound.getStatusAsync();
    if (status.durationMillis) {
      setTimeout(async () => {
        await sound.unloadAsync();
      }, status.durationMillis + 1000);
    } else {
      // If duration is unknown, use a reasonable default timeout
      setTimeout(async () => {
        await sound.unloadAsync();
      }, 5000);
    }
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

export default function NotificationListener() {
  useEffect(() => {
    // Set up listeners for different notification states
    
    // 1. Foreground notification listener - when app is open
    const foregroundSubscription = Notifications.addNotificationReceivedListener(() => {
      playNotificationSound();
    });

    // 2. Background/Killed notification listener - when user taps on notification to open app
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(() => {
      // Handle notification response (when user taps notification)
      playNotificationSound();
    });

    // Clean up listeners on unmount
    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  // This component doesn't render anything
  return null;
}