import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import notificationService from '../services/notificationService';
import secureStorage from './secureStorage';

// Configure default notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token = null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    const pushTokenData = await Notifications.getExpoPushTokenAsync();
    token = pushTokenData.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
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
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}
