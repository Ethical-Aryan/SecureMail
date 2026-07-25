import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import Header from '../../components/common/Header';
import EmptyView from '../../components/common/EmptyView';
import Loader from '../../components/common/Loader';
import useApp from '../../hooks/useApp';
import useMail from '../../hooks/useMail';
import { useTheme } from '../../context/ThemeContext';
import notificationService from '../../services/notificationService';
import { formatTime } from '../../utils/helpers';

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { showToast, setUnreadNotificationsCount } = useApp();
  const { emails } = useMail();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.fetchNotifications();
      setNotifications(data.notifications || []);
      setUnreadNotificationsCount(data.unread_count || 0);
    } catch (error) {
      if (__DEV__) console.warn('Failed to load notifications from backend:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setUnreadNotificationsCount]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationService.markAsRead();
      showToast('All notifications marked as read', 'success');
      loadNotifications();
    } catch (error) {
      showToast('Failed to mark notifications as read', 'error');
    }
  }, [loadNotifications, showToast]);

  const handleSendTest = useCallback(async () => {
    try {
      await notificationService.sendTestNotification();
      showToast('Test notification sent from backend', 'success');
      loadNotifications();
    } catch (error) {
      showToast('Failed to send test notification', 'error');
    }
  }, [loadNotifications, showToast]);

  const handleDelete = useCallback(async (id) => {
    try {
      await notificationService.deleteNotification(id);
      showToast('Notification deleted', 'info');
      loadNotifications();
    } catch (error) {
      showToast('Failed to delete notification', 'error');
    }
  }, [loadNotifications, showToast]);

  const handleNotificationPress = useCallback(async (notification) => {
    if (!notification.is_read) {
      try {
        await notificationService.markAsRead(notification.id);
        loadNotifications();
      } catch (e) {
        // ignore
      }
    }

    if (notification.data && notification.data.email_id) {
      const email = emails.find((e) => e.id === notification.data.email_id);
      if (email) {
        navigation.navigate('InboxTab', {
          screen: 'EmailDetail',
          params: { email },
        });
      } else {
        navigation.navigate('InboxTab');
      }
    }
  }, [emails, loadNotifications, navigation]);

  const renderNotification = useCallback(({ item }) => {
    const iconNames = {
      new_email: 'mail',
      encrypted_email: 'lock',
      security_alert: 'shield',
      info: 'info',
    };

    const iconColors = {
      new_email: colors.primary,
      encrypted_email: colors.warning,
      security_alert: colors.danger,
      info: colors.primary,
    };

    const iconName = iconNames[item.type] || 'bell';
    const iconColor = iconColors[item.type] || colors.primary;

    return (
      <TouchableOpacity
        style={[
          styles.notifCard,
          { backgroundColor: colors.card },
          !item.is_read && { borderLeftWidth: 3, borderLeftColor: colors.primary },
          SHADOWS.sm,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.notifIconBox, { backgroundColor: `${iconColor}15` }]}>
          <Feather name={iconName} size={18} color={iconColor} />
        </View>

        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, { color: colors.textPrimary }, !item.is_read && styles.unreadText]}>
            {item.title}
          </Text>
          <Text style={[styles.notifMessage, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={[styles.notifTime, { color: colors.textTertiary }]}>
            {formatTime(item.created_at)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.deleteBtn}
        >
          <Feather name="trash-2" size={14} color={colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [colors, handleDelete, handleNotificationPress]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Header
        title="Alerts & Notifications"
        rightActions={[
          { icon: 'check-circle', onPress: handleMarkAllRead },
          { icon: 'plus-circle', onPress: handleSendTest },
        ]}
      />

      {loading ? (
        <Loader fullScreen />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.emptyList,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyView
              icon="bell"
              title="No notifications"
              message="You're all caught up! Real-time alerts will appear here."
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {notifications.length > 0 && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Feather name="shield" size={12} color={colors.textTertiary} />
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Flask REST Backend Managed Notifications
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxxl,
  },
  emptyList: {
    flex: 1,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
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
    fontWeight: '600',
  },
  unreadText: {
    fontWeight: '700',
  },
  notifMessage: {
    ...TYPOGRAPHY.caption,
    marginTop: 3,
    lineHeight: 18,
  },
  notifTime: {
    ...TYPOGRAPHY.caption,
    marginTop: 4,
    fontSize: 11,
  },
  deleteBtn: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    marginLeft: SPACING.xs,
  },
});
