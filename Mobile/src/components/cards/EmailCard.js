import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { TYPOGRAPHY, SPACING } from '../../theme/theme';
import { formatTime, truncateText } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';

const EmailCard = memo(({
  email,
  onPress,
  onStar,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();

  const handlePress = useCallback(() => {
    if (onPress) onPress(email);
  }, [email, onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={`Email from ${email.sender}: ${email.subject}`}
    >
      <View style={styles.unreadContainer}>
        {email.unread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </View>

      <Avatar email={email.senderEmail} initials={email.initials} size={42} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.senderContainer}>
            <Text
              style={[styles.sender, { color: colors.textPrimary }, email.unread && styles.unreadText]}
              numberOfLines={1}
            >
              {email.sender}
            </Text>
            {email.locked && (
              <Feather name="lock" size={12} color={colors.primary} style={styles.lockIcon} />
            )}
          </View>
          <Text style={[styles.time, { color: colors.textTertiary }, email.unread && { color: colors.primary, fontWeight: '600' }]}>
            {formatTime(email.time)}
          </Text>
        </View>

        <Text
          style={[styles.subject, { color: colors.textPrimary }, email.unread && styles.unreadText]}
          numberOfLines={1}
        >
          {email.subject}
        </Text>

        <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={2}>
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
    borderBottomWidth: 1,
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
    fontWeight: '600',
  },
  lockIcon: {
    marginLeft: SPACING.xs,
  },
  unreadText: {
    fontWeight: '700',
  },
  time: {
    ...TYPOGRAPHY.caption,
  },
  subject: {
    ...TYPOGRAPHY.bodySmall,
    marginBottom: 2,
    fontWeight: '500',
  },
  preview: {
    ...TYPOGRAPHY.caption,
    lineHeight: 18,
  },
});

export default EmailCard;
