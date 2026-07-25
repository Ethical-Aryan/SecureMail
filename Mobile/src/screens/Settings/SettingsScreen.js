import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING } from '../../theme/theme';
import Card from '../../components/common/Card';
import useApp from '../../hooks/useApp';
import useBiometric from '../../hooks/useBiometric';
import { useTheme } from '../../context/ThemeContext';
import { APP_INFO } from '../../constants/constants';
import { registerForPushNotificationsAsync, unregisterPushNotificationsAsync } from '../../utils/pushNotificationHandler';

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { themeMode, setThemeMode } = useTheme();
  const { showToast } = useApp();
  const { isAvailable: biometricAvailable, isEnabled: biometricEnabled, biometricType, enableBiometric, disableBiometric } = useBiometric();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleThemeModeChange = useCallback(async (mode) => {
    await setThemeMode(mode);
    showToast(`Theme changed to ${mode} mode`, 'success');
  }, [setThemeMode, showToast]);

  const handleNotificationToggle = useCallback(async (value) => {
    setNotificationsEnabled(value);
    if (value) {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        showToast('Push notifications enabled', 'success');
      } else {
        showToast('Push notification permission denied', 'warning');
      }
    } else {
      await unregisterPushNotificationsAsync();
      showToast('Push notifications disabled', 'info');
    }
  }, [showToast]);

  const handleBiometricToggle = useCallback(async (value) => {
    if (value) {
      const success = await enableBiometric();
      if (success) {
        showToast('App lock enabled', 'success');
      } else {
        showToast('Failed to enable app lock', 'error');
      }
    } else {
      await disableBiometric();
      showToast('App lock disabled', 'info');
    }
  }, [enableBiometric, disableBiometric, showToast]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Settings</Text>

        {/* Theme Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Theme Preference</Text>
          <Card variant="default" padding={SPACING.md} style={styles.sectionCard}>
            <View style={styles.themeOptionsRow}>
              {[
                { mode: 'light', label: 'Light', icon: 'sun' },
                { mode: 'dark', label: 'Dark', icon: 'moon' },
                { mode: 'system', label: 'System', icon: 'smartphone' },
              ].map((item) => {
                const active = themeMode === item.mode;
                return (
                  <TouchableOpacity
                    key={item.mode}
                    onPress={() => handleThemeModeChange(item.mode)}
                    style={[
                      styles.themeOptionBtn,
                      { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border },
                    ]}
                  >
                    <Feather name={item.icon} size={20} color={active ? '#FFFFFF' : colors.textPrimary} />
                    <Text style={[styles.themeOptionLabel, { color: active ? '#FFFFFF' : colors.textPrimary }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Security</Text>
          <Card variant="default" padding={0} style={styles.sectionCard}>
            <View style={styles.settingItem}>
              <View style={[styles.settingIconBox, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="shield" size={18} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  {biometricType ? `${biometricType} App Lock` : 'Biometric App Lock'}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {biometricAvailable ? `Require ${biometricType || 'biometrics'} on launch` : 'Not available on device'}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                disabled={!biometricAvailable}
                trackColor={{ false: colors.border, true: '#C4B5FD' }}
                thumbColor={biometricEnabled ? colors.primary : '#F4F3F4'}
              />
            </View>
          </Card>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notifications</Text>
          <Card variant="default" padding={0} style={styles.sectionCard}>
            <View style={styles.settingItem}>
              <View style={[styles.settingIconBox, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="bell" size={18} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Push Notifications</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Backend-driven real-time email alerts
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: '#C4B5FD' }}
                thumbColor={notificationsEnabled ? colors.primary : '#F4F3F4'}
              />
            </View>
          </Card>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About</Text>
          <Card variant="default" padding={0} style={styles.sectionCard}>
            <View style={[styles.settingItem, styles.settingBorder, { borderBottomColor: colors.border }]}>
              <View style={[styles.settingIconBox, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="info" size={18} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Version</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{APP_INFO.VERSION}</Text>
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={[styles.settingIconBox, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="lock" size={18} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Security & Encryption</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Argon2id + AES-256 GCM</Text>
              </View>
            </View>
          </Card>
        </View>

        <Text style={[styles.footerText, { color: colors.textTertiary }]}>{APP_INFO.COPYRIGHT}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxxl,
  },
  screenTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.captionBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  sectionCard: {
    overflow: 'hidden',
  },
  themeOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  themeOptionLabel: {
    ...TYPOGRAPHY.bodySmallMedium,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  settingBorder: {
    borderBottomWidth: 1,
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
    fontWeight: '600',
  },
  settingDescription: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
