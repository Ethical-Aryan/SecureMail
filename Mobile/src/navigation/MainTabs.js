import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../theme/theme';
import InboxStack from './InboxStack';
import SecurityCenterScreen from '../screens/Security/SecurityCenterScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'InboxTab':
              iconName = 'inbox';
              break;
            case 'VaultTab':
              iconName = 'shield';
              break;
            case 'AlertsTab':
              iconName = 'bell';
              break;
            case 'ProfileTab':
              iconName = 'user';
              break;
            default:
              iconName = 'circle';
          }

          return (
            <View style={[
              styles.tabIconContainer,
              focused && styles.tabIconFocused,
            ]}>
              <Feather name={iconName} size={20} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            paddingBottom: Math.max(insets.bottom, 8),
            height: 60 + Math.max(insets.bottom, 8),
          },
        ],
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tab.Screen
        name="InboxTab"
        component={InboxStack}
        options={{ tabBarLabel: 'Inbox' }}
      />
      <Tab.Screen
        name="VaultTab"
        component={SecurityCenterScreen}
        options={{ tabBarLabel: 'Vault' }}
      />
      <Tab.Screen
        name="AlertsTab"
        component={NotificationsScreen}
        options={{ tabBarLabel: 'Alerts' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabItem: {
    paddingTop: 6,
  },
  tabLabel: {
    fontFamily: TYPOGRAPHY.captionMedium.fontFamily,
    fontSize: 11,
    marginTop: 2,
  },
  tabIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconFocused: {
    backgroundColor: '#EDE9FE', // Light purple
  },
});
