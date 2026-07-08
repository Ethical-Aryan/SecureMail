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

  const handleStar = useCallback(() => {
    if (onStar) onStar(email.id, email.starred);
  }, [email.id, email.starred, onStar]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.container,
        email.unread && styles.unreadContainer,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Email from ${email.sender}: ${email.subject}`}
    >
      <View style={styles.row}>
        <Avatar email={email.senderEmail} initials={email.initials} size={46} />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text
              style={[styles.sender, email.unread && styles.unreadText]}
              numberOfLines={1}
            >
              {email.sender}
            </Text>
            <Text style={styles.time}>{formatTime(email.time)}</Text>
          </View>

          <View style={styles.subjectRow}>
            <Text
              style={[styles.subject, email.unread && styles.unreadText]}
              numberOfLines={1}
            >
              {email.subject}
            </Text>
            {email.locked && (
              <Badge text="Encrypted" icon="lock" variant="encrypted" size="sm" style={styles.badge} />
            )}
          </View>

          <Text style={styles.preview} numberOfLines={1}>
            {truncateText(email.preview, 80)}
          </Text>

          <View style={styles.bottomRow}>
            <View style={styles.indicators}>
              {email.attachment && (
                <Feather name="paperclip" size={12} color={COLORS.textTertiary} style={styles.indicator} />
              )}
              {email.unread && <View style={styles.unreadDot} />}
            </View>

            <TouchableOpacity
              onPress={handleStar}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={email.starred ? 'Unstar email' : 'Star email'}
            >
              <Feather
                name={email.starred ? 'star' : 'star'}
                size={16}
                color={email.starred ? COLORS.warning : COLORS.textTertiary}
                style={email.starred ? { fill: COLORS.warning } : undefined}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

EmailCard.displayName = 'EmailCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  unreadContainer: {
    backgroundColor: '#FAFAFF',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  sender: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  unreadText: {
    fontWeight: '700',
  },
  time: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  subject: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  badge: {
    marginLeft: SPACING.xs,
  },
  preview: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    marginRight: SPACING.sm,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.primary,
  },
});

export default EmailCard;
