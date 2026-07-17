import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import { formatTime, truncateText } from '../../utils/helpers';

const EmailCard = memo(({
  email,
  onPress,
  onStar,
  onDelete,
}) => {
  const handlePress = useCallback(() => {
    if (onPress) onPress(email);
  }, [email, onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={`Email from ${email.sender}: ${email.subject}`}
    >
      <View style={styles.unreadContainer}>
        {email.unread && <View style={styles.unreadDot} />}
      </View>

      <Avatar email={email.senderEmail} initials={email.initials} size={42} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.senderContainer}>
            <Text
              style={[styles.sender, email.unread && styles.unreadText]}
              numberOfLines={1}
            >
              {email.sender}
            </Text>
            {email.locked && (
              <Feather name="lock" size={12} color={COLORS.primary} style={styles.lockIcon} />
            )}
          </View>
          <Text style={[styles.time, email.unread && styles.unreadTime]}>
            {formatTime(email.time)}
          </Text>
        </View>

        <Text
          style={[styles.subject, email.unread && styles.unreadText]}
          numberOfLines={1}
        >
          {email.subject}
        </Text>

        <Text style={styles.preview} numberOfLines={2}>
          {truncateText(email.preview, 80)}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

EmailCard.displayName = 'EmailCard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.background, // Match the screen background
    borderBottomWidth: 1,
    borderBottomColor: '#EBE5D9', // Subtle divider color
  },
  unreadContainer: {
    width: 12,
    alignItems: 'center',
    paddingTop: 16,
    marginRight: 4,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sender: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  lockIcon: {
    marginLeft: SPACING.xs,
  },
  unreadText: {
    fontWeight: '700',
    color: '#000000',
  },
  time: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  unreadTime: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  subject: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
    marginBottom: 2,
    fontWeight: '500',
  },
  preview: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

export default EmailCard;
