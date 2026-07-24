import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import InboxStack from './InboxStack';
import SecurityCenterScreen from '../screens/Security/SecurityCenterScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
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
              focused && { backgroundColor: isDark ? '#312E81' : '#EDE9FE' },
            ]}>
              <Feather name={iconName} size={20} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
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
    borderTopWidth: 1,
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
});
