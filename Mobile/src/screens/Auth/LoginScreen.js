import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, StyleSheet, StatusBar, Platform,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import useBiometric from '../../hooks/useBiometric';
import { validateEmail, validatePassword } from '../../utils/validators';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login, isLoading, error, clearError } = useAuth();
  const { isAvailable, isEnabled, biometricType, biometricLogin } = useBiometric();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleLogin = useCallback(async () => {
    clearError();
    const errors = {};

    const emailResult = validateEmail(email);
    if (!emailResult.valid) errors.email = emailResult.error;

    const passwordResult = validatePassword(password);
    if (!passwordResult.valid) errors.password = passwordResult.error;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    await login(email, password);
  }, [email, password, login, clearError, navigation]);

  const handleBiometricLogin = useCallback(async () => {
    const credentials = await biometricLogin();
    if (credentials) {
      await login(credentials.email, credentials.password);
    }
  }, [biometricLogin, login, navigation]);

  const handleEmailChange = useCallback((text) => {
    setEmail(text);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: null }));
    }
  }, [fieldErrors.email]);

  const handlePasswordChange = useCallback((text) => {
    setPassword(text);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: null }));
    }
  }, [fieldErrors.password]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Feather name="shield" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>SecureMail</Text>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to your encrypted inbox</Text>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <Input
            label="Email address"
            value={email}
            onChangeText={handleEmailChange}
            placeholder="name@company.com"
            icon="mail"
            keyboardType="email-address"
            error={fieldErrors.email}
            autoCapitalize="none"
            returnKeyType="next"
          />

          {/* Password Input */}
          <Input
            label="Password"
            value={password}
            onChangeText={handlePasswordChange}
            placeholder="Enter your password"
            icon="lock"
            secureTextEntry
            error={fieldErrors.password}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPasswordRow}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Continue Button */}
          <Button
            title="Continue"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
          />

          {/* Biometric Option */}
          {isAvailable && isEnabled && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                title={`Sign in with ${biometricType || 'Face ID'}`}
                onPress={handleBiometricLogin}
                variant="outline"
                icon="maximize"
                iconPosition="left"
              />
            </>
          )}

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New here? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Create an account</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Feather name="shield" size={12} color={COLORS.textTertiary} />
            <Text style={styles.footerText}>Protected by end-to-end encryption</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.xxxxl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    ...TYPOGRAPHY.h5,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  heading: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subheading: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxxl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.danger,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  loginButton: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  forgotPasswordRow: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
    marginTop: -SPACING.xs,
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.primary,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginHorizontal: SPACING.lg,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  registerText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  registerLink: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.primary,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xxxl,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginLeft: SPACING.xs,
  },
});
