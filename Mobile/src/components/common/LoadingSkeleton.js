import React, { memo, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';

const SkeletonLine = memo(({ width = '100%', height = 16, borderRadius = 8, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, opacity },
        styles.line,
        style,
      ]}
    />
  );
});

const LoadingSkeleton = memo(({ type = 'email', count = 5 }) => {
  if (type === 'email') {
    return (
      <View style={styles.container}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.emailCard}>
            <SkeletonLine width={44} height={44} borderRadius={22} />
            <View style={styles.emailContent}>
              <View style={styles.emailTop}>
                <SkeletonLine width="40%" height={14} />
                <SkeletonLine width={50} height={12} />
              </View>
              <SkeletonLine width="70%" height={14} style={styles.mt8} />
              <SkeletonLine width="90%" height={12} style={styles.mt6} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (type === 'profile') {
    return (
      <View style={styles.container}>
        <View style={styles.profileCenter}>
          <SkeletonLine width={80} height={80} borderRadius={40} />
          <SkeletonLine width="50%" height={20} style={styles.mt16} />
          <SkeletonLine width="40%" height={14} style={styles.mt8} />
        </View>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.settingRow}>
            <SkeletonLine width={36} height={36} borderRadius={18} />
            <View style={styles.settingContent}>
              <SkeletonLine width="60%" height={14} />
              <SkeletonLine width="40%" height={12} style={styles.mt6} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonLine key={index} width="100%" height={60} borderRadius={12} style={styles.mt12} />
      ))}
    </View>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
  },
  line: {
    backgroundColor: COLORS.shimmer,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  emailContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  emailTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileCenter: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  settingContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  mt6: { marginTop: 6 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
});

export default LoadingSkeleton;
