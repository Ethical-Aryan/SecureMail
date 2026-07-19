import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import secureStorage from '../utils/secureStorage';

// ==============================================================
// Biometric Authentication Hook
// ==============================================================

export default function useBiometric() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState(null);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const available = compatible && enrolled;
      setIsAvailable(available);

      if (available) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Fingerprint');
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('Iris scanner');
        } else {
          setBiometricType('Biometrics');
        }
      }

      const enabled = await secureStorage.isBiometricEnabled();
      setIsEnabled(enabled);
    } catch {
      setIsAvailable(false);
    }
  }, []);

  const authenticate = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access SecureMail',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use Passcode',
      });
      return result.success;
    } catch {
      return false;
    }
  }, []);

  const enableBiometric = useCallback(async () => {
    const success = await authenticate();
    if (success) {
      const currentRefreshToken = await secureStorage.getRefreshToken();
      if (currentRefreshToken) {
        await secureStorage.setBiometricToken(currentRefreshToken);
      }
      await secureStorage.setBiometricEnabled(true);
      setIsEnabled(true);
      return true;
    }
    return false;
  }, [authenticate]);

  const disableBiometric = useCallback(async () => {
    await secureStorage.setBiometricEnabled(false);
    await secureStorage.clearBiometricToken();
    setIsEnabled(false);
  }, []);

  const biometricLogin = useCallback(async () => {
    const success = await authenticate();
    if (success) {
      const biometricToken = await secureStorage.getBiometricToken();
      return biometricToken;
    }
    return null;
  }, [authenticate]);

  return {
    isAvailable,
    isEnabled,
    biometricType,
    authenticate,
    enableBiometric,
    disableBiometric,
    biometricLogin,
  };
}
