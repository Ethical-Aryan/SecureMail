import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InboxScreen from '../screens/Inbox/InboxScreen';
import EmailDetailScreen from '../screens/Inbox/EmailDetailScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import SecurityCenterScreen from '../screens/Security/SecurityCenterScreen';

const Stack = createNativeStackNavigator();

export default function InboxStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="InboxList" component={InboxScreen} />
      <Stack.Screen name="EmailDetail" component={EmailDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="SecurityCenter" component={SecurityCenterScreen} />
    </Stack.Navigator>
  );
}
