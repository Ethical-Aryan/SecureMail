import React, { memo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';

const Card = memo(({
  children,
  variant = 'default', // 'default' | 'elevated' | 'outlined' | 'glass'
  padding = SPACING.xl,
  borderRadius = BORDER_RADIUS.xl,
  style,
}) => {
  const { colors, isDark } = useTheme();

  const variantStyles = {
    default: [styles.base, { backgroundColor: colors.card }, SHADOWS.sm],
    elevated: [styles.base, { backgroundColor: colors.card }, SHADOWS.lg],
    outlined: [styles.base, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }],
    glass: [
      styles.base,
      {
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
      },
    ],
  };

  return (
    <View
      style={[
        ...variantStyles[variant],
        { padding, borderRadius },
        style,
      ]}
    >
      {children}
    </View>
  );
});

Card.displayName = 'Card';

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.xl,
  },
});

export default Card;
