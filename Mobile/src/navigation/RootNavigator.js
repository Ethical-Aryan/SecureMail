import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuth from '../hooks/useAuth';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import Loader from '../components/common/Loader';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  // Show loading while restoring auth state
  if (isLoading) {
    return <Loader fullScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ animation: 'fade' }}
        />
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthStack}
          options={{ animation: 'fade' }}
        />
      )}
    </Stack.Navigator>
  );
}
