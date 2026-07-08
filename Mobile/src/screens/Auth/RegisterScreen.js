import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, StyleSheet, StatusBar, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import { validateRegistrationForm } from '../../utils/validators';

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
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
      // Auto-login after registration
      const loginResult = await login(email, password);
      if (loginResult.success) {
        navigation.replace('MainTabs');
      } else {
        setSuccess(true);
      }
    }
  }, [email, password, confirmPassword, register, login, clearError, navigation]);

  if (success) {
    return (
      <View style={[styles.container, styles.successContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.successIcon}>
          <Feather name="check-circle" size={48} color={COLORS.success} />
        </View>
        <Text style={styles.successTitle}>Account Created!</Text>
        <Text style={styles.successMessage}>
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
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoRow}>
            <LinearGradient
              colors={COLORS.gradient.primary}
              style={styles.logoBox}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name="shield" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.logoText}>SecureMail</Text>
          </View>

          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.subheading}>Start your journey with encrypted communication</Text>

          {error && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorBannerText}>{error}</Text>
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
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Sign In</Text>
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
    backgroundColor: COLORS.background,
  },
  successContainer: {
    justifyContent: 'center',
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
    backgroundColor: COLORS.card,
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
    color: COLORS.textSecondary,
  },
  loginLink: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.primary,
    fontWeight: '700',
  },
  successIcon: {
    marginBottom: SPACING.xxl,
  },
  successTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  successMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxxl,
  },
  successButton: {
    width: '100%',
  },
});
