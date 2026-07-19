import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../constants/constants';

// ==============================================================
// Secure Storage Wrapper
// Uses expo-secure-store for all sensitive data (tokens, credentials)
// NEVER uses AsyncStorage for JWT or passwords
// ==============================================================

const secureStorage = {
  async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await SecureStore.setItemAsync(key, stringValue);
      return true;
    } catch (error) {
      console.error(`SecureStore setItem error [${key}]:`, error.message);
      return false;
    }
  },

  async getItem(key) {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.error(`SecureStore getItem error [${key}]:`, error.message);
      return null;
    }
  },

  async getJSON(key) {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error(`SecureStore getJSON error [${key}]:`, error.message);
      return null;
    }
  },

  async removeItem(key) {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error(`SecureStore removeItem error [${key}]:`, error.message);
      return false;
    }
  },

  // Token Management
  async setTokens(accessToken, refreshToken) {
    await Promise.all([
      this.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      this.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  async getAccessToken() {
    return this.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken() {
    return this.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async clearTokens() {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  },

  // User Data
  async setUserData(userData) {
    return this.setItem(STORAGE_KEYS.USER_DATA, userData);
  },

  async getUserData() {
    return this.getJSON(STORAGE_KEYS.USER_DATA);
  },

  async clearUserData() {
    return this.removeItem(STORAGE_KEYS.USER_DATA);
  },


  // Onboarding
  async setOnboardingSeen() {
    return this.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
  },

  async hasSeenOnboarding() {
    const value = await this.getItem(STORAGE_KEYS.ONBOARDING_SEEN);
    return value === 'true';
  },

  // Biometric Toggle
  async setBiometricEnabled(enabled) {
    return this.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled ? 'true' : 'false');
  },

  async isBiometricEnabled() {
    const value = await this.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return value === 'true';
  },

  async setBiometricToken(token) {
    return this.setItem(STORAGE_KEYS.BIOMETRIC_TOKEN, token);
  },

  async getBiometricToken() {
    return this.getItem(STORAGE_KEYS.BIOMETRIC_TOKEN);
  },

  async clearBiometricToken() {
    return this.removeItem(STORAGE_KEYS.BIOMETRIC_TOKEN);
  },

  // Theme
  async setThemeMode(mode) {
    return this.setItem(STORAGE_KEYS.THEME_MODE, mode);
  },

  async getThemeMode() {
    return this.getItem(STORAGE_KEYS.THEME_MODE);
  },

  // Clear All
  async clearAll() {
    const allKeys = Object.values(STORAGE_KEYS);
    await Promise.all(allKeys.map((key) => this.removeItem(key)));
  },
};

export default secureStorage;
