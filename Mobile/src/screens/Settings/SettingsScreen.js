import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import Card from '../../components/common/Card';
import useApp from '../../hooks/useApp';
import useBiometric from '../../hooks/useBiometric';
import useAuth from '../../hooks/useAuth';
import { APP_INFO } from '../../constants/constants';

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { themeMode, setTheme, showToast } = useApp();
  const { isAvailable: biometricAvailable, isEnabled: biometricEnabled, biometricType, enableBiometric, disableBiometric } = useBiometric();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState(true);

  const handleBiometricToggle = useCallback(async (value) => {
    if (value) {
      // Need credentials to store for biometric login
      showToast('Enable biometric login from the login screen', 'info');
    } else {
      await disableBiometric();
      showToast('Biometric login disabled', 'info');
    }
  }, [enableBiometric, disableBiometric, showToast, user]);

  const settingsSections = [
    {
      title: 'Appearance',
      items: [
        {
          icon: 'moon',
          label: 'Dark Mode',
          description: 'Switch to dark theme',
          type: 'switch',
          value: themeMode === 'dark',
          onToggle: (v) => {
            setTheme(v ? 'dark' : 'light');
            showToast('Theme support coming soon', 'info');
          },
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: 'smartphone',
          label: biometricType || 'Biometric Login',
          description: biometricAvailable
            ? `Use ${biometricType || 'biometric'} to unlock`
            : 'Not available on this device',
          type: 'switch',
          value: biometricEnabled,
          onToggle: handleBiometricToggle,
          disabled: !biometricAvailable,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'bell',
          label: 'Push Notifications',
          description: 'Receive notifications for new emails',
          type: 'switch',
          value: notifications,
          onToggle: (v) => {
            setNotifications(v);
            showToast('Notification preferences saved locally', 'info');
          },
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'info',
          label: 'Version',
          description: APP_INFO.VERSION,
          type: 'info',
        },
        {
          icon: 'shield',
          label: 'Privacy Policy',
          description: 'Read our privacy policy',
          type: 'link',
        },
        {
          icon: 'file-text',
          label: 'Terms of Service',
          description: 'Read our terms',
          type: 'link',
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Settings</Text>

        {settingsSections.map((section, sIndex) => (
          <View key={sIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card variant="default" padding={0} style={styles.sectionCard}>
              {section.items.map((item, iIndex) => (
                <View
                  key={iIndex}
                  style={[
                    styles.settingItem,
                    iIndex < section.items.length - 1 && styles.settingBorder,
                  ]}
                >
                  <View style={[styles.settingIconBox, { backgroundColor: `${COLORS.primary}10` }]}>
                    <Feather name={item.icon} size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                  {item.type === 'switch' && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      disabled={item.disabled}
                      trackColor={{ false: COLORS.border, true: '#C4B5FD' }}
                      thumbColor={item.value ? COLORS.primary : '#F4F3F4'}
                      ios_backgroundColor={COLORS.border}
                    />
                  )}
                  {item.type === 'link' && (
                    <Feather name="chevron-right" size={18} color={COLORS.textTertiary} />
                  )}
                </View>
              ))}
            </Card>
          </View>
        ))}

        <Text style={styles.footerText}>{APP_INFO.COPYRIGHT}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxxl,
  },
  screenTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  sectionCard: {
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  settingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  settingLabel: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  settingDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
