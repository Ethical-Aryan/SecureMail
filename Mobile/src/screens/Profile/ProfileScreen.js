import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import useAuth from '../../hooks/useAuth';
import useMail from '../../hooks/useMail';
import storageService from '../../services/storageService';
import { getDisplayName, formatStorageUsage, countUnread } from '../../utils/helpers';
import { APP_INFO } from '../../constants/constants';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
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
      // Silently fail — storage is not critical
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
    { icon: 'settings', label: 'Settings', color: COLORS.textSecondary, screen: 'SettingsTab' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.screenTitle}>Profile</Text>

        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar email={user?.email} size={72} />
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalEmails}</Text>
              <Text style={styles.statLabel}>Total Emails</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{unreadCount}</Text>
              <Text style={styles.statLabel}>Unread</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {emails.filter((e) => e.locked).length}
              </Text>
              <Text style={styles.statLabel}>Encrypted</Text>
            </View>
          </View>
        </Card>

        {/* Storage Card */}
        <Card variant="default" padding={SPACING.lg} style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <View style={styles.storageIconBox}>
              <Feather name="hard-drive" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.storageText}>
              <Text style={styles.storageTitle}>Storage</Text>
              {storageInfo ? (
                <Text style={styles.storageUsage}>
                  {formatStorageUsage(storageInfo.gb_used, storageInfo.quota_gb)} of {storageInfo.quota_gb} GB used
                </Text>
              ) : (
                <Text style={styles.storageUsage}>Loading...</Text>
              )}
            </View>
          </View>
          {storageInfo && (
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={COLORS.gradient.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(storageInfo.percent_used, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{storageInfo.percent_used}%</Text>
            </View>
          )}
        </Card>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: `${item.color}15` }]}>
                <Feather name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.badge > 0 && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <Feather name="chevron-right" size={18} color={COLORS.textTertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="danger"
          icon="log-out"
          iconPosition="left"
          style={styles.logoutButton}
        />

        {/* Footer */}
        <Text style={styles.versionText}>{APP_INFO.NAME} v{APP_INFO.VERSION}</Text>
        <Text style={styles.copyrightText}>{APP_INFO.COPYRIGHT}</Text>
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
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  email: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.borderLight,
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
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storageText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  storageTitle: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  storageUsage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    minWidth: 36,
    textAlign: 'right',
  },
  menuSection: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xxl,
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    flex: 1,
    marginLeft: SPACING.md,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: SPACING.sm,
  },
  menuBadgeText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textInverse,
    fontSize: 11,
  },
  logoutButton: {
    marginBottom: SPACING.xxl,
  },
  versionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 4,
  },
  copyrightText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});
