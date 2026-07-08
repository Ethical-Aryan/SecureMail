import React, { memo, useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';

const Toast = memo(({ toast, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const typeConfig = {
    success: { icon: 'check-circle', bg: COLORS.success, iconColor: '#FFFFFF' },
    error: { icon: 'alert-circle', bg: COLORS.danger, iconColor: '#FFFFFF' },
    warning: { icon: 'alert-triangle', bg: COLORS.warning, iconColor: '#FFFFFF' },
    info: { icon: 'info', bg: COLORS.primary, iconColor: '#FFFFFF' },
  };

  const config = typeConfig[toast.type] || typeConfig.info;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 15,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      dismiss();
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss(toast.id);
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + SPACING.md,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.toast, { backgroundColor: config.bg }]}
        onPress={dismiss}
        activeOpacity={0.9}
      >
        <Feather name={config.icon} size={18} color={config.iconColor} />
        <Text style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
        <Feather name="x" size={16} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    </Animated.View>
  );
});

Toast.displayName = 'Toast';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.xl,
    right: SPACING.xl,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.lg,
  },
  message: {
    flex: 1,
    ...TYPOGRAPHY.bodySmallMedium,
    color: '#FFFFFF',
    marginHorizontal: SPACING.sm,
  },
});

export default Toast;
