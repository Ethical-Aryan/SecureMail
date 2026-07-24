import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, StyleSheet, Platform,
  Animated, Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { validateEmail, validatePassword } from '../../utils/validators';

const OTP_EXPIRY_SECONDS = 60;

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [step, setStep] = useState(1);
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

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

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

  const animateToStep = (targetStep) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(targetStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 120, useNativeDriver: true }),
      ]).start();
    });
  };

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
      const response = await authService.forgotPassword(email);
      setApiSuccess(response.message || 'OTP sent to your email.');
      setTimeout(() => animateToStep(2), 600);
    } catch (error) {
      setApiError(error.userMessage || 'Failed to send OTP. Try again.');
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  const handleResetPassword = useCallback(async () => {
    setApiError(null);
    setApiSuccess(null);
    const errors = {};

    if (!otp.trim() || otp.trim().length !== 6) {
      errors.otp = '6-digit OTP code is required';
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
      const response = await authService.resetPassword(email, otp.trim(), newPassword);
      setApiSuccess(response.message || 'Password reset successfully!');
      setTimeout(() => navigation.replace('Login'), 1500);
    } catch (error) {
      setApiError(error.userMessage || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  }, [email, otp, newPassword, confirmPassword, navigation]);

  const handleResend = useCallback(async () => {
    if (!canResend) return;
    setApiError(null);
    setApiSuccess(null);
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      setApiSuccess(response.message || 'A new OTP has been sent.');
      setCountdown(OTP_EXPIRY_SECONDS);
      setCanResend(false);
    } catch (error) {
      setApiError(error.userMessage || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  }, [email, canResend]);

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <LinearGradient
      colors={colors.gradient.splash}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
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
            style={[styles.backButton, { backgroundColor: colors.card }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={colors.gradient.primary}
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
          <Text style={[styles.heading, { color: colors.textPrimary }]}>
            {step === 1 ? 'Reset Password' : 'Verify & Reset'}
          </Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>
            {step === 1
              ? 'Enter your email and we\'ll send a one-time code to verify your identity.'
              : `Enter the 6-digit code sent to ${email} and choose a new password.`}
          </Text>

          {/* Glassmorphism Card */}
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
            <View style={[styles.glassInner, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {apiError && (
                <View style={[styles.errorBanner, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
                  <Feather name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[styles.errorBannerText, { color: colors.danger }]}>{apiError}</Text>
                </View>
              )}

              {apiSuccess && (
                <View style={[styles.successBanner, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
                  <Feather name="check-circle" size={16} color={colors.success} />
                  <Text style={[styles.successBannerText, { color: colors.success }]}>{apiSuccess}</Text>
                </View>
              )}

              {step === 1 ? (
                <>
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
                  <View style={styles.countdownRow}>
                    <View style={[
                      styles.countdownBadge,
                      { backgroundColor: isDark ? '#312E81' : '#EDE9FE', borderColor: colors.primary },
                      countdown === 0 && { backgroundColor: colors.dangerLight, borderColor: colors.danger },
                    ]}>
                      <Feather
                        name="clock"
                        size={14}
                        color={countdown > 0 ? colors.primary : colors.danger}
                      />
                      <Text style={[
                        styles.countdownText,
                        { color: colors.primary },
                        countdown === 0 && { color: colors.danger },
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

                  <TouchableOpacity
                    onPress={handleResend}
                    disabled={!canResend || isLoading}
                    style={styles.resendRow}
                  >
                    <Text style={[
                      styles.resendText,
                      { color: colors.primary },
                      (!canResend || isLoading) && { color: colors.textTertiary },
                    ]}>
                      {canResend ? 'Resend OTP' : `Resend in ${formatCountdown(countdown)}`}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>

          <View style={styles.footerRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>← Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.colored,
  },
  heading: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subheading: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.md,
  },
  glassCard: {
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xxl,
    ...SHADOWS.xl,
  },
  glassInner: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    padding: SPACING.xxl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
  },
  errorBannerText: {
    ...TYPOGRAPHY.bodySmall,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
  },
  successBannerText: {
    ...TYPOGRAPHY.bodySmall,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  countdownRow: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
  },
  countdownText: {
    ...TYPOGRAPHY.captionBold,
    marginLeft: SPACING.sm,
  },
  actionButton: {
    marginTop: SPACING.sm,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  resendText: {
    ...TYPOGRAPHY.bodySmallMedium,
    fontWeight: '700',
  },
  footerRow: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  footerLink: {
    ...TYPOGRAPHY.bodySmallMedium,
    fontWeight: '600',
  },
});
