import React, { useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import Header from '../../components/common/Header';
import EmptyView from '../../components/common/EmptyView';
import useMail from '../../hooks/useMail';
import notificationService from '../../services/notificationService';
import { formatTime } from '../../utils/helpers';

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { emails } = useMail();

  const notifications = useMemo(
    () => notificationService.generateNotifications(emails),
    [emails]
  );

  const handleNotificationPress = useCallback((notification) => {
    if (notification.emailId) {
      const email = emails.find((e) => e.id === notification.emailId);
      if (email) {
        // Navigate across tabs: go to InboxTab, then push EmailDetail
        navigation.navigate('InboxTab', {
          screen: 'EmailDetail',
          params: { email },
        });
      }
    }
  }, [emails, navigation]);

  const renderNotification = useCallback(({ item }) => {
    const iconColors = {
      new_email: COLORS.primary,
      security: COLORS.success,
    };

    return (
      <TouchableOpacity
        style={styles.notifCard}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.notifIconBox,
          { backgroundColor: `${iconColors[item.type] || COLORS.primary}15` },
        ]}>
          <Feather
            name={item.icon}
            size={18}
            color={iconColors[item.type] || COLORS.primary}
          />
        </View>
        <View style={styles.notifContent}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.notifTime}>{formatTime(item.time)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  }, [handleNotificationPress]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <Header
        title="Alerts"
      />

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={
          <EmptyView
            icon="bell"
            title="No notifications"
            message="You're all caught up! New notifications will appear here."
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {notifications.length > 0 && (
        <View style={styles.footer}>
          <Feather name="info" size={12} color={COLORS.textTertiary} />
          <Text style={styles.footerText}>
            Notifications generated from unread emails
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxxl,
  },
  emptyList: {
    flex: 1,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  notifIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  notifTitle: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  notifMessage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  notifTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 4,
    fontSize: 11,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginLeft: SPACING.xs,
  },
});
