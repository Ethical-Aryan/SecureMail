import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, StyleSheet, Platform,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import useBiometric from '../../hooks/useBiometric';
import { useTheme } from '../../context/ThemeContext';
import secureStorage from '../../utils/secureStorage';
import { validateEmail, validatePassword } from '../../utils/validators';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { login, biometricLogin: contextBiometricLogin, isLoading, error, clearError } = useAuth();
  const { isAvailable, isEnabled, biometricType, biometricLogin } = useBiometric();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [hasBiometricToken, setHasBiometricToken] = useState(false);

  React.useEffect(() => {
    secureStorage.getBiometricToken().then(token => {
      setHasBiometricToken(!!token);
    });
  }, []);

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
  }, [email, password, login, clearError]);

  const handleBiometricLogin = useCallback(async () => {
    const refreshToken = await biometricLogin();
    if (refreshToken) {
      await contextBiometricLogin(refreshToken);
    }
  }, [biometricLogin, contextBiometricLogin]);

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
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
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
            <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
              <Feather name="shield" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.logoText, { color: colors.primary }]}>SecureMail</Text>
          </View>

          {/* Heading */}
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>Sign in to your encrypted inbox</Text>

          {/* Error Banner */}
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
              <Feather name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.errorBannerText, { color: colors.danger }]}>{error}</Text>
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
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Continue Button */}
          <Button
            title="Continue"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
          />

          {/* Biometric Option */}
          {isAvailable && isEnabled && hasBiometricToken && (
            <>
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
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
            <Text style={[styles.registerText, { color: colors.textSecondary }]}>New here? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: colors.primary }]}>Create an account</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Feather name="shield" size={12} color={colors.textTertiary} />
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>Protected by end-to-end encryption</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    ...TYPOGRAPHY.h5,
    marginLeft: SPACING.sm,
  },
  heading: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.sm,
  },
  subheading: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.xxxl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
  },
  errorBannerText: {
    ...TYPOGRAPHY.bodySmall,
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
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
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
  },
  registerLink: {
    ...TYPOGRAPHY.bodySmallMedium,
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
    marginLeft: SPACING.xs,
  },
});
