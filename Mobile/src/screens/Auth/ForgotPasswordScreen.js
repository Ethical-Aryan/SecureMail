import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, StyleSheet, StatusBar, Platform,
  Animated, Dimensions, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import authService from '../../services/authService';
import { validateEmail, validatePassword } from '../../utils/validators';

const OTP_EXPIRY_SECONDS = 60;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // ─── State ───────────────────────────────────────────────
  const [step, setStep] = useState(1); // 1 = request OTP, 2 = verify & reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(OTP_EXPIRY_SECONDS);
  const [canResend, setCanResend] = useState(false);

  // ─── Animations ──────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // In-app Notification Animations
  const notificationY = useRef(new Animated.Value(-150)).current;
  const notificationOpacityAnim = useRef(new Animated.Value(0)).current;
  const [notificationOtp, setNotificationOtp] = useState(null);

  // Mount animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 18,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ─── Countdown Timer for OTP ─────────────────────────────
  useEffect(() => {
    if (step !== 2) return;

    setCountdown(OTP_EXPIRY_SECONDS);
    setCanResend(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // ─── Transition to Step 2 ────────────────────────────────
  const transitionToStep2 = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -SCREEN_WIDTH,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(2);
      slideAnim.setValue(SCREEN_WIDTH * 0.3);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  // ─── Notification Handlers ──────────────────────────────
  const hideNotification = useCallback(() => {
    Animated.parallel([
      Animated.timing(notificationY, {
        toValue: -150,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(notificationOpacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      setNotificationOtp(null);
    });
  }, [notificationY, notificationOpacityAnim]);

  const triggerNotification = useCallback((otpCode) => {
    setNotificationOtp(otpCode);
    
    // Auto-fill OTP into the input field for maximum user convenience
    setOtp(otpCode);
    
    // Animate notification sliding down
    Animated.parallel([
      Animated.spring(notificationY, {
        toValue: 10,
        useNativeDriver: true,
        bounciness: 8,
      }),
      Animated.timing(notificationOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    // Auto-hide after 8 seconds
    const timer = setTimeout(() => {
      hideNotification();
    }, 8000);

    return () => clearTimeout(timer);
  }, [notificationY, notificationOpacityAnim, hideNotification]);

  const handleNotificationTap = useCallback(() => {
    if (notificationOtp) {
      setOtp(notificationOtp);
      hideNotification();
    }
  }, [notificationOtp, hideNotification]);

  // ─── Step 1: Request OTP ─────────────────────────────────
  const handleRequestOtp = useCallback(async () => {
    setApiError(null);
    setApiSuccess(null);

    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      setFieldErrors({ email: emailResult.error });
      return;
    }
    setFieldErrors({});
    setIsLoading(true);

    try {
      const data = await authService.requestPasswordReset(email);
      setApiSuccess(data.message || 'OTP sent! Check the server terminal.');
      
      // If server returned OTP, trigger the push-like notification banner
      if (data && data.otp) {
        triggerNotification(data.otp);
      }
      
      transitionToStep2();
    } catch (error) {
      setApiError(error.userMessage || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [email, transitionToStep2, triggerNotification]);

  // ─── Step 2: Reset Password ──────────────────────────────
  const handleResetPassword = useCallback(async () => {
    setApiError(null);
    setApiSuccess(null);
    const errors = {};

    if (!otp || otp.trim().length !== 6) {
      errors.otp = 'Enter the 6-digit OTP code';
    }

    const passResult = validatePassword(newPassword);
    if (!passResult.valid) {
      errors.newPassword = passResult.error;
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsLoading(true);

    try {
      const data = await authService.resetPassword(email, otp, newPassword);
      setApiSuccess(data.message || 'Password reset successfully!');

      // Navigate back to login after a short delay
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (error) {
      setApiError(error.userMessage || 'Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [email, otp, newPassword, confirmPassword, navigation]);

  // ─── Resend OTP ──────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (!canResend) return;
    setApiError(null);
    setApiSuccess(null);
    setIsLoading(true);

    try {
      const data = await authService.requestPasswordReset(email);
      setApiSuccess('A new OTP has been sent.');
      
      // If server returned OTP, trigger the push-like notification banner
      if (data && data.otp) {
        triggerNotification(data.otp);
      }

      setCountdown(OTP_EXPIRY_SECONDS);
      setCanResend(false);

      // Restart timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setApiError(error.userMessage || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  }, [email, canResend, triggerNotification]);

  // ─── Format countdown ────────────────────────────────────
  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Render ──────────────────────────────────────────────
  return (
    <LinearGradient
      colors={['#F7F2EA', '#EDE5FA', '#E0D4F5']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.xxxxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={COLORS.gradient.primary}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather
                name={step === 1 ? 'key' : 'shield'}
                size={30}
                color="#FFFFFF"
              />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.heading}>
            {step === 1 ? 'Reset Password' : 'Verify & Reset'}
          </Text>
          <Text style={styles.subheading}>
            {step === 1
              ? 'Enter your email and we\'ll send a one-time code to verify your identity.'
              : `Enter the 6-digit code sent to ${email} and choose a new password.`}
          </Text>

          {/* ─── Glassmorphism Card ─────────────────────────── */}
          <Animated.View
            style={[
              styles.glassCard,
              {
                transform: [
                  { scale: cardScale },
                  { translateX: slideAnim },
                ],
                opacity: Animated.multiply(cardOpacity, fadeAnim),
              },
            ]}
          >
            {/* Inner frosted border */}
            <View style={styles.glassInner}>
              {/* API Error */}
              {apiError && (
                <View style={styles.errorBanner}>
                  <Feather name="alert-circle" size={16} color={COLORS.danger} />
                  <Text style={styles.errorBannerText}>{apiError}</Text>
                </View>
              )}

              {/* API Success */}
              {apiSuccess && (
                <View style={styles.successBanner}>
                  <Feather name="check-circle" size={16} color={COLORS.success} />
                  <Text style={styles.successBannerText}>{apiSuccess}</Text>
                </View>
              )}

              {step === 1 ? (
                <>
                  {/* Step 1: Email Input */}
                  <Input
                    label="Email address"
                    value={email}
                    onChangeText={(t) => { setEmail(t); setFieldErrors({}); setApiError(null); }}
                    placeholder="name@company.com"
                    icon="mail"
                    keyboardType="email-address"
                    error={fieldErrors.email}
                    autoCapitalize="none"
                    returnKeyType="go"
                    onSubmitEditing={handleRequestOtp}
                  />

                  <Button
                    title="Send OTP"
                    onPress={handleRequestOtp}
                    loading={isLoading}
                    icon="send"
                    iconPosition="right"
                    style={styles.actionButton}
                  />
                </>
              ) : (
                <>
                  {/* Step 2: OTP + New Password */}

                  {/* Countdown */}
                  <View style={styles.countdownRow}>
                    <View style={[
                      styles.countdownBadge,
                      countdown === 0 && styles.countdownExpired,
                    ]}>
                      <Feather
                        name="clock"
                        size={14}
                        color={countdown > 0 ? COLORS.primary : COLORS.danger}
                      />
                      <Text style={[
                        styles.countdownText,
                        countdown === 0 && styles.countdownTextExpired,
                      ]}>
                        {countdown > 0
                          ? `Expires in ${formatCountdown(countdown)}`
                          : 'OTP expired'}
                      </Text>
                    </View>
                  </View>

                  <Input
                    label="6-Digit OTP Code"
                    value={otp}
                    onChangeText={(t) => {
                      // Only allow digits, max 6
                      const cleaned = t.replace(/[^0-9]/g, '').slice(0, 6);
                      setOtp(cleaned);
                      setFieldErrors((prev) => ({ ...prev, otp: null }));
                      setApiError(null);
                    }}
                    placeholder="000000"
                    icon="hash"
                    keyboardType="number-pad"
                    error={fieldErrors.otp}
                    maxLength={6}
                  />

                  <Input
                    label="New Password"
                    value={newPassword}
                    onChangeText={(t) => { setNewPassword(t); setFieldErrors((prev) => ({ ...prev, newPassword: null })); }}
                    placeholder="At least 8 characters"
                    icon="lock"
                    secureTextEntry
                    error={fieldErrors.newPassword}
                  />

                  <Input
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={(t) => { setConfirmPassword(t); setFieldErrors((prev) => ({ ...prev, confirmPassword: null })); }}
                    placeholder="Re-enter your new password"
                    icon="lock"
                    secureTextEntry
                    error={fieldErrors.confirmPassword}
                    returnKeyType="go"
                    onSubmitEditing={handleResetPassword}
                  />

                  <Button
                    title="Reset Password"
                    onPress={handleResetPassword}
                    loading={isLoading}
                    icon="check"
                    iconPosition="right"
                    style={styles.actionButton}
                  />

                  {/* Resend link */}
                  <TouchableOpacity
                    onPress={handleResend}
                    disabled={!canResend || isLoading}
                    style={styles.resendRow}
                  >
                    <Text style={[
                      styles.resendText,
                      (!canResend || isLoading) && styles.resendTextDisabled,
                    ]}>
                      {canResend ? 'Resend OTP' : `Resend in ${formatCountdown(countdown)}`}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>← Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Push Notification Dropdown Banner ─────────────────── */}
      {notificationOtp && (
        <Animated.View 
          style={[
            styles.notificationContainer, 
            { 
              transform: [{ translateY: notificationY }], 
              opacity: notificationOpacityAnim,
              top: insets.top + SPACING.sm
            }
          ]}
        >
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={handleNotificationTap}
            style={styles.notificationCard}
          >
            <View style={styles.notificationIconContainer}>
              <Feather name="bell" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>SecureMail System Alert</Text>
              <Text style={styles.notificationText}>
                Your requested verification OTP is <Text style={styles.notificationCode}>{notificationOtp}</Text>. Tap to copy/fill.
              </Text>
            </View>
            <TouchableOpacity onPress={hideNotification} style={styles.notificationClose}>
              <Feather name="x" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

// ─── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.colored,
  },
  heading: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subheading: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.sm,
  },

  // ─── Glassmorphism Card ────────────────────────────────
  glassCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xxl,
    ...Platform.select({
      ios: {
        shadowColor: '#6B4EFF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
    }),
  },
  glassInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    padding: SPACING.xxl,
  },

  // ─── Banners ───────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorBannerText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.danger,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  successBannerText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.success,
    marginLeft: SPACING.sm,
    flex: 1,
  },

  // ─── Countdown ─────────────────────────────────────────
  countdownRow: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 78, 255, 0.08)',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(107, 78, 255, 0.15)',
  },
  countdownExpired: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  countdownText: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  countdownTextExpired: {
    color: COLORS.danger,
  },

  // ─── Action Button ─────────────────────────────────────
  actionButton: {
    marginTop: SPACING.sm,
  },

  // ─── Resend ────────────────────────────────────────────
  resendRow: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  resendText: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.primary,
    fontWeight: '700',
  },
  resendTextDisabled: {
    color: COLORS.textTertiary,
    fontWeight: '500',
  },

  // ─── Footer ────────────────────────────────────────────
  footerRow: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  footerLink: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // ─── Notification Styles ───────────────────────────────
  notificationContainer: {
    position: 'absolute',
    left: SPACING.xl,
    right: SPACING.xl,
    zIndex: 10000,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B', // Rich dark indigo background
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 78, 255, 0.45)',
    ...Platform.select({
      ios: {
        shadowColor: '#6B4EFF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  notificationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  notificationText: {
    ...TYPOGRAPHY.caption,
    color: '#E0D4F5',
    marginTop: 2,
    lineHeight: 16,
  },
  notificationCode: {
    fontWeight: '850',
    color: '#F59E0B', // Bright golden yellow
    fontSize: 13,
  },
  notificationClose: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});
