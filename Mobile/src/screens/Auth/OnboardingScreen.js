import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Animated,
  StyleSheet, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import { ONBOARDING_SLIDES } from '../../constants/constants';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
  const { setOnboardingSeen } = useAuth();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = useCallback(() => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleComplete();
    }
  }, [currentIndex]);

  const handleSkip = useCallback(async () => {
    await setOnboardingSeen();
    navigation.replace('Login');
  }, [navigation, setOnboardingSeen]);

  const handleComplete = useCallback(async () => {
    await setOnboardingSeen();
    navigation.replace('Login');
  }, [navigation, setOnboardingSeen]);

  const renderSlide = useCallback(({ item }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.illustrationContainer}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.iconBox}>
          <Feather name={item.icon} size={42} color={COLORS.primary} />
        </View>
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  ), []);

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {ONBOARDING_SLIDES.map((_, index) => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });
        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity: dotOpacity,
                backgroundColor: COLORS.primary,
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <LinearGradient
      colors={COLORS.gradient.onboarding}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <View />
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        bounces={false}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.xxl }]}>
        {renderDots()}

        <Button
          title={currentIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          variant="primary"
          style={styles.continueButton}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.xl,
  },
  skipButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  skipText: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  illustrationContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxxxl,
  },
  circle1: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EBE5D9', // Darker beige
  },
  circle2: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#EAE0FE', // Light purple
  },
  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: SPACING.xxl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  continueButton: {
    width: '100%',
  },
});
