import { Platform } from 'react-native';
import notificationService from '../services/notificationService';
import secureStorage from './secureStorage';

let Notifications = null;
try {
  Notifications = require('expo-notifications');
  if (Notifications && Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch {
  // Notifications module unavailable
}

/**
 * Register device for Expo Push Notifications
 */
export async function registerForPushNotificationsAsync() {
  if (!Notifications) {
    return null;
  }

  let token = null;

  try {
    let finalStatus = 'denied';
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    } catch (permError) {
      return null;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6B4EFF',
        });
      } catch (channelError) {
        // Channel creation skipped
      }
    }

    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync();
      token = pushTokenData.data;
    } catch (tokenError) {
      // Token skipped
    }

    if (token) {
      await secureStorage.setPushToken(token);
      await notificationService.registerPushToken(token, Platform.OS);
    }
  } catch (error) {
    // Registration failed silently
  }

  return token;
}

/**
 * Unregister device push token
 */
export async function unregisterPushNotificationsAsync() {
  try {
    const token = await secureStorage.getPushToken();
    if (token) {
      await notificationService.removePushToken(token);
      await secureStorage.clearPushToken();
    }
  } catch (error) {
    // Unregistration error silently handled
  }
}

/**
 * Setup notification event listeners
 */
export function setupNotificationListeners(onNotificationReceived, onNotificationResponse) {
  if (!Notifications || !Notifications.addNotificationReceivedListener) {
    return () => {};
  }

  try {
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      if (onNotificationResponse) {
        const data = response.notification.request.content.data;
        onNotificationResponse(data);
      }
    });

    return () => {
      if (Notifications && Notifications.removeNotificationSubscription) {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
      }
    };
  } catch (listenerError) {
    return () => {};
  }
}
