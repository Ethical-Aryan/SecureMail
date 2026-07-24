import React, { memo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';

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
  const { colors } = useTheme();
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
        <View
          style={[
            styles.base,
            { backgroundColor: isDisabled ? '#A5A3B5' : colors.primary },
            { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal },
            SHADOWS.colored,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.content}>
              {icon && iconPosition === 'left' && (
                <Feather name={icon} size={currentSize.fontSize} color="#FFFFFF" style={styles.iconLeft} />
              )}
              <Text style={[styles.primaryText, TYPOGRAPHY.button, { fontSize: currentSize.fontSize, color: '#FFFFFF' }, textStyle]}>
                {title}
              </Text>
              {icon && iconPosition === 'right' && (
                <Feather name={icon} size={currentSize.fontSize} color="#FFFFFF" style={styles.iconRight} />
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  const variantStyles = {
    outline: {
      container: [
        styles.base,
        { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
        { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal },
      ],
      text: [styles.outlineText, { fontSize: currentSize.fontSize, color: colors.primary }],
      iconColor: colors.primary,
    },
    ghost: {
      container: [
        styles.base,
        { backgroundColor: 'transparent' },
        { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal },
      ],
      text: [styles.ghostText, { fontSize: currentSize.fontSize, color: colors.primary }],
      iconColor: colors.primary,
    },
    danger: {
      container: [
        styles.base,
        { backgroundColor: colors.dangerLight, borderWidth: 1, borderColor: colors.danger },
        { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal },
      ],
      text: [styles.dangerText, { fontSize: currentSize.fontSize, color: colors.danger }],
      iconColor: colors.danger,
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
    fontWeight: '600',
  },
  outlineText: {
    fontWeight: '600',
  },
  ghostText: {
    fontWeight: '600',
  },
  dangerText: {
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
