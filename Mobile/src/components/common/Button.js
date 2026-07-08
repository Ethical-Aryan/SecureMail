import React, { memo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';

const Button = memo(({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon,
  iconPosition = 'right',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14 },
    md: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 16 },
    lg: { paddingVertical: 18, paddingHorizontal: 24, fontSize: 18 },
  };

  const currentSize = sizeStyles[size];

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[fullWidth && styles.fullWidth, style]}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <LinearGradient
          colors={isDisabled ? ['#A5A3B5', '#A5A3B5'] : COLORS.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.base,
            { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal },
            SHADOWS.colored,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textInverse} size="small" />
          ) : (
            <View style={styles.content}>
              {icon && iconPosition === 'left' && (
                <Feather name={icon} size={currentSize.fontSize} color={COLORS.textInverse} style={styles.iconLeft} />
              )}
              <Text style={[styles.primaryText, { fontSize: currentSize.fontSize }, textStyle]}>
                {title}
              </Text>
              {icon && iconPosition === 'right' && (
                <Feather name={icon} size={currentSize.fontSize} color={COLORS.textInverse} style={styles.iconRight} />
              )}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles = {
    outline: {
      container: [styles.base, styles.outlineContainer, { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal }],
      text: [styles.outlineText, { fontSize: currentSize.fontSize }],
      iconColor: COLORS.primary,
    },
    ghost: {
      container: [styles.base, styles.ghostContainer, { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal }],
      text: [styles.ghostText, { fontSize: currentSize.fontSize }],
      iconColor: COLORS.primary,
    },
    danger: {
      container: [styles.base, styles.dangerContainer, { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal }],
      text: [styles.dangerText, { fontSize: currentSize.fontSize }],
      iconColor: COLORS.danger,
    },
  };

  const vs = variantStyles[variant] || variantStyles.outline;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[fullWidth && styles.fullWidth, style]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[...vs.container, isDisabled && styles.disabledContainer]}>
        {loading ? (
          <ActivityIndicator color={vs.iconColor} size="small" />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' && (
              <Feather name={icon} size={currentSize.fontSize} color={vs.iconColor} style={styles.iconLeft} />
            )}
            <Text style={[...vs.text, textStyle]}>{title}</Text>
            {icon && iconPosition === 'right' && (
              <Feather name={icon} size={currentSize.fontSize} color={vs.iconColor} style={styles.iconRight} />
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  base: {
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: COLORS.textInverse,
    fontWeight: '600',
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  outlineText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  dangerContainer: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  dangerText: {
    color: COLORS.danger,
    fontWeight: '600',
  },
  disabledContainer: {
    opacity: 0.5,
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
});

export default Button;
