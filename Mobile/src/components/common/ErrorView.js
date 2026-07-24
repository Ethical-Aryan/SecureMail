import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TYPOGRAPHY, SPACING } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';

const ErrorView = memo(({
  title = 'Something went wrong',
  message = 'Please try again later',
  icon = 'alert-circle',
  onRetry,
  retryText = 'Try Again',
  style,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.border }]}>
        <Feather name={icon} size={48} color={colors.textTertiary} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={[styles.retryButton, { backgroundColor: isDark ? '#312E81' : '#EDE9FE' }]}
          activeOpacity={0.7}
        >
          <Feather name="refresh-cw" size={16} color={colors.primary} />
          <Text style={[styles.retryText, { color: colors.primary }]}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

ErrorView.displayName = 'ErrorView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxxl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h5,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: 12,
  },
  retryText: {
    ...TYPOGRAPHY.buttonSmall,
    marginLeft: SPACING.sm,
  },
});

export default ErrorView;
