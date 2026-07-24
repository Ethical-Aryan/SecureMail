import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, StyleSheet, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { validateRegistrationForm } from '../../utils/validators';

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { register, login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleRegister = useCallback(async () => {
    clearError();

    const { valid, errors } = validateRegistrationForm({ email, password, confirmPassword });
    if (!valid) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    const result = await register(email, password);

    if (result.success) {
      const loginResult = await login(email, password);
      if (!loginResult.success) {
        setSuccess(true);
      }
    }
  }, [email, password, confirmPassword, register, login, clearError]);

  if (success) {
    return (
      <View style={[styles.container, styles.successContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.successIcon}>
          <Feather name="check-circle" size={48} color={colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Account Created!</Text>
        <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
          Your secure email account has been created successfully.
        </Text>
        <Button
          title="Sign In"
          onPress={() => navigation.replace('Login')}
          style={styles.successButton}
        />
      </View>
    );
  }

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
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: colors.card }]}
          >
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoRow}>
            <LinearGradient
              colors={colors.gradient.primary}
              style={styles.logoBox}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name="shield" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.logoText, { color: colors.primary }]}>SecureMail</Text>
          </View>

          <Text style={[styles.heading, { color: colors.textPrimary }]}>Create account</Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>Start your journey with encrypted communication</Text>

          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
              <Feather name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.errorBannerText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          <Input
            label="Email address"
            value={email}
            onChangeText={(t) => { setEmail(t); setFieldErrors((p) => ({ ...p, email: null })); }}
            placeholder="name@company.com"
            icon="mail"
            keyboardType="email-address"
            error={fieldErrors.email}
            autoCapitalize="none"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={(t) => { setPassword(t); setFieldErrors((p) => ({ ...p, password: null })); }}
            placeholder="At least 8 characters"
            icon="lock"
            secureTextEntry
            error={fieldErrors.password}
          />

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setFieldErrors((p) => ({ ...p, confirmPassword: null })); }}
            placeholder="Re-enter your password"
            icon="lock"
            secureTextEntry
            error={fieldErrors.confirmPassword}
            onSubmitEditing={handleRegister}
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            icon="arrow-right"
            style={styles.registerButton}
          />

          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
            </TouchableOpacity>
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
  successContainer: {
    justify.content: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
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
  registerButton: {
    marginTop: SPACING.sm,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  loginText: {
    ...TYPOGRAPHY.bodySmall,
  },
  loginLink: {
    ...TYPOGRAPHY.bodySmallMedium,
    fontWeight: '700',
  },
  successIcon: {
    marginBottom: SPACING.xxl,
  },
  successTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.sm,
  },
  successMessage: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    marginBottom: SPACING.xxxl,
  },
  successButton: {
    width: '100%',
  },
});
