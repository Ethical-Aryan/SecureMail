import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="SettingsTab" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
