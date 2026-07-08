import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/theme';

const Badge = memo(({
  text,
  icon,
  variant = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'info' | 'encrypted'
  size = 'sm', // 'sm' | 'md'
  style,
}) => {
  const variantColors = {
    default: { bg: COLORS.borderLight, text: COLORS.textSecondary, icon: COLORS.textSecondary },
    success: { bg: COLORS.successLight, text: '#059669', icon: '#059669' },
    warning: { bg: COLORS.warningLight, text: '#D97706', icon: '#D97706' },
    danger: { bg: COLORS.dangerLight, text: '#DC2626', icon: '#DC2626' },
    info: { bg: COLORS.infoLight, text: '#2563EB', icon: '#2563EB' },
    encrypted: { bg: '#EDE9FE', text: COLORS.primary, icon: COLORS.primary },
  };

  const colors = variantColors[variant] || variantColors.default;
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.bg,
        paddingVertical: isSmall ? 3 : 5,
        paddingHorizontal: isSmall ? 8 : 12,
      },
      style,
    ]}>
      {icon && (
        <Feather
          name={icon}
          size={isSmall ? 10 : 12}
          color={colors.icon}
          style={styles.icon}
        />
      )}
      <Text style={[
        styles.text,
        {
          color: colors.text,
          fontSize: isSmall ? 10 : 12,
          fontWeight: '600',
        },
      ]}>
        {text}
      </Text>
    </View>
  );
});

Badge.displayName = 'Badge';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    letterSpacing: 0.2,
  },
});

export default Badge;
