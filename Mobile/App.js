import React from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { MailProvider } from './src/context/MailContext';
import { AppProvider } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import ToastContainer from './src/components/common/ToastContainer';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProvider>
          <AuthProvider>
            <MailProvider>
              <NavigationContainer>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <RootNavigator />
                <ToastContainer />
              </NavigationContainer>
            </MailProvider>
          </AuthProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});