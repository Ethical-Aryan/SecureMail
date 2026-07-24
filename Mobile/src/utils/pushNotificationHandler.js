import { Platform } from 'react-native';
import notificationService from '../services/notificationService';
import secureStorage from './secureStorage';

/**
 * Push Notification Handler
 *
 * Uses expo-notifications when available. Falls back gracefully
 * if the package is not installed, so the app continues to work
 * without push notification hardware support.
 */

let Notifications = null;

function getNotificationsModule() {
  if (Notifications !== null) return Notifications;
  try {
    Notifications = require('expo-notifications');
    return Notifications;
  } catch {
    console.log('[PushNotification] expo-notifications is not installed. Push notifications are disabled.');
    Notifications = false;
    return false;
  }
}

// Configure default notification handler (runs at import time only if module exists)
try {
  const mod = getNotificationsModule();
  if (mod) {
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch {
  // Silently ignore — module not available
}

export async function registerForPushNotificationsAsync() {
  const mod = getNotificationsModule();
  if (!mod) {
    console.log('[PushNotification] Skipping registration — expo-notifications not available.');
    return null;
  }

  let token = null;

  try {
    const { status: existingStatus } = await mod.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await mod.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    const pushTokenData = await mod.getExpoPushTokenAsync();
    token = pushTokenData.data;

    if (Platform.OS === 'android') {
      await mod.setNotificationChannelAsync('default', {
        name: 'default',
        importance: mod.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6B4EFF',
      });
    }

    if (token) {
      await secureStorage.setPushToken(token);
      await notificationService.registerPushToken(token, Platform.OS);
    }
  } catch (error) {
    console.warn('Error registering for push notifications:', error);
  }

  return token;
}

export async function unregisterPushNotificationsAsync() {
  try {
    const token = await secureStorage.getPushToken();
    if (token) {
      await notificationService.removePushToken(token);
      await secureStorage.clearPushToken();
    }
  } catch (error) {
    console.warn('Error unregistering push notifications:', error);
  }
}

export function setupNotificationListeners(onNotificationReceived, onNotificationResponse) {
  const mod = getNotificationsModule();
  if (!mod) {
    // Return a no-op cleanup function
    return () => {};
  }

  const notificationListener = mod.addNotificationReceivedListener((notification) => {
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  const responseListener = mod.addNotificationResponseReceivedListener((response) => {
    if (onNotificationResponse) {
      const data = response.notification.request.content.data;
      onNotificationResponse(data);
    }
  });

  return () => {
    mod.removeNotificationSubscription(notificationListener);
    mod.removeNotificationSubscription(responseListener);
  };
}
