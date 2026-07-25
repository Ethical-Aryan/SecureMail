import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/theme';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import useMail from '../../hooks/useMail';
import { useTheme } from '../../context/ThemeContext';
import storageService from '../../services/storageService';
import { getDisplayName, countUnread } from '../../utils/helpers';
import { APP_INFO } from '../../constants/constants';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { emails } = useMail();

  const [storageInfo, setStorageInfo] = useState(null);
  const [loadingStorage, setLoadingStorage] = useState(true);

  useEffect(() => {
    loadStorage();
  }, []);

  const loadStorage = async () => {
    try {
      const data = await storageService.getStorageInfo();
      setStorageInfo(data);
    } catch {
      // Silently fail
    } finally {
      setLoadingStorage(false);
    }
  };

  const displayName = getDisplayName(user?.email);
  const unreadCount = countUnread(emails);
  const totalEmails = emails.length;

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  }, [logout]);

  const menuItems = [
    { icon: 'settings', label: 'Settings', color: colors.textSecondary, screen: 'SettingsTab' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Profile</Text>

        {/* User Card */}
        <Card variant="default" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar email={user?.email || ''} initials={user?.email ? user.email.substring(0, 2).toUpperCase() : 'AM'} size={72} />
            <Text style={[styles.displayName, { color: colors.textPrimary }]}>{displayName}</Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email || 'user@securemail.com'}</Text>
          </View>

          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalEmails}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Messages</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{unreadCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Unread</Text>
            </View>
          </View>
        </Card>

        {/* Storage Usage */}
        <Card variant="default" style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <View style={[styles.storageIconBox, { backgroundColor: isDark ? '#312E81' : '#EDE9FE' }]}>
              <Feather name="database" size={20} color={colors.primary} />
            </View>
            <View style={styles.storageTitleBox}>
              <Text style={[styles.storageTitle, { color: colors.textPrimary }]}>Vault Storage</Text>
              <Text style={[styles.storageSubtitle, { color: colors.textSecondary }]}>
                {storageInfo ? `${storageInfo.gb_used || 0} GB of ${storageInfo.quota_gb || 15} GB used` : '15 GB Storage'}
              </Text>
            </View>
          </View>

          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(storageInfo?.percent_used || 5, 100)}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </Card>

        {/* Settings Menu */}
        <View style={[styles.menuList, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              onPress={() => item.screen && navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <Feather name={item.icon} size={20} color={colors.primary} />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
              <Feather name="chevron-right" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="danger"
          icon="log-out"
          iconPosition="left"
          style={styles.logoutButton}
        />

        {/* Footer */}
        <Text style={[styles.versionText, { color: colors.textTertiary }]}>{APP_INFO.NAME} v{APP_INFO.VERSION}</Text>
        <Text style={[styles.copyrightText, { color: colors.textTertiary }]}>{APP_INFO.COPYRIGHT}</Text>
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
  profileCard: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    padding: SPACING.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  displayName: {
    ...TYPOGRAPHY.h4,
    marginTop: SPACING.md,
  },
  email: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...TYPOGRAPHY.h4,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  storageCard: {
    marginBottom: SPACING.xxl,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  storageIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storageTitleBox: {
    marginLeft: SPACING.md,
  },
  storageTitle: {
    ...TYPOGRAPHY.bodySmallMedium,
    fontWeight: '600',
  },
  storageSubtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  menuList: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.xxl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  menuLabel: {
    ...TYPOGRAPHY.bodySmallMedium,
    flex: 1,
    marginLeft: SPACING.md,
    fontWeight: '600',
  },
  logoutButton: {
    marginBottom: SPACING.xl,
  },
  versionText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
  },
  copyrightText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginTop: 4,
  },
});
