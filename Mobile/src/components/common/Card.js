import React, { memo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';

const Card = memo(({
  children,
  variant = 'default', // 'default' | 'elevated' | 'outlined' | 'glass'
  padding = SPACING.xl,
  borderRadius = BORDER_RADIUS.xl,
  style,
}) => {
  const variantStyles = {
    default: [styles.base, SHADOWS.sm],
    elevated: [styles.base, SHADOWS.lg],
    outlined: [styles.base, styles.outlined],
    glass: [styles.base, styles.glass],
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
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    ...Platform.select({
      ios: {
        backdropFilter: 'blur(10px)',
      },
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default Card;
