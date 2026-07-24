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
  console.log('[PushNotification] expo-notifications package not loaded.');
}

/**
 * Register device for Expo Push Notifications
 */
export async function registerForPushNotificationsAsync() {
  if (!Notifications) {
    console.log('[PushNotification] Skipping registration — expo-notifications module unavailable.');
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
      console.log('[PushNotification] Push permissions check skipped (Expo Go SDK 53+ limitation):', permError.message);
      return null;
    }

    if (finalStatus !== 'granted') {
      console.log('[PushNotification] Permission denied.');
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
        console.log('[PushNotification] Android notification channel creation skipped:', channelError.message);
      }
    }

    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync();
      token = pushTokenData.data;
    } catch (tokenError) {
      console.log('[PushNotification] Expo Push Token skipped (Expo Go SDK 53+ limitation or missing EAS project ID):', tokenError.message);
    }

    if (token) {
      await secureStorage.setPushToken(token);
      await notificationService.registerPushToken(token, Platform.OS);
    }
  } catch (error) {
    console.warn('[PushNotification] Registration error:', error);
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
    console.warn('[PushNotification] Unregistration error:', error);
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
    console.log('[PushNotification] Notification listeners setup skipped:', listenerError.message);
    return () => {};
  }
}
