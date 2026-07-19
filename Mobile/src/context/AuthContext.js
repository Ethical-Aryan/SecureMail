import React, { createContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/authService';
import secureStorage from '../utils/secureStorage';
import { setOnUnauthorized } from '../services/api';

// ==============================================================
// Auth Context & Provider
// ==============================================================

export const AuthContext = createContext(null);

const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESTORE_TOKEN: 'RESTORE_TOKEN',
  SET_ONBOARDING_SEEN: 'SET_ONBOARDING_SEEN',
};

const initialState = {
  isLoading: true,
  isAuthenticated: false,
  user: null,
  error: null,
  hasSeenOnboarding: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return { ...state, isLoading: false, error: action.payload };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case AUTH_ACTIONS.RESTORE_TOKEN:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: !!action.payload,
        user: action.payload,
      };

    case AUTH_ACTIONS.SET_ONBOARDING_SEEN:
      return { ...state, hasSeenOnboarding: action.payload };

    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Register unauthorized handler
  useEffect(() => {
    setOnUnauthorized(() => {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    });
  }, []);

  // Restore auth state on app launch
  useEffect(() => {
    async function restoreAuth() {
      try {
        const [token, userData, seenOnboarding, isBiometricEnabled] = await Promise.all([
          secureStorage.getAccessToken(),
          secureStorage.getUserData(),
          secureStorage.hasSeenOnboarding(),
          secureStorage.isBiometricEnabled(),
        ]);

        dispatch({
          type: AUTH_ACTIONS.SET_ONBOARDING_SEEN,
          payload: seenOnboarding,
        });

        if (token && userData) {
          if (isBiometricEnabled) {
            const LocalAuthentication = require('expo-local-authentication');
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Authenticate to unlock SecureMail',
              cancelLabel: 'Cancel',
              disableDeviceFallback: false,
              fallbackLabel: 'Use Passcode',
            });
            
            if (!result.success) {
              // Biometric failed or cancelled. Do not restore token.
              dispatch({ type: AUTH_ACTIONS.RESTORE_TOKEN, payload: null });
              return;
            }
          }
          dispatch({ type: AUTH_ACTIONS.RESTORE_TOKEN, payload: userData });
        } else {
          dispatch({ type: AUTH_ACTIONS.RESTORE_TOKEN, payload: null });
        }
      } catch {
        dispatch({ type: AUTH_ACTIONS.RESTORE_TOKEN, payload: null });
      }
    }
    restoreAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const data = await authService.login(email, password);

      await secureStorage.setTokens(data.access_token, data.refresh_token);
      await secureStorage.setUserData(data.user);

      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: data.user });
      return { success: true, data };
    } catch (error) {
      const message = error.userMessage || error.response?.data?.error || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const data = await authService.register(email, password);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: true, data };
    } catch (error) {
      const message = error.userMessage || error.response?.data?.error || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      return { success: false, error: message };
    }
  }, []);

  const biometricLogin = useCallback(async (refreshToken) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      const data = await authService.refresh(refreshToken);

      await secureStorage.setTokens(data.access_token, refreshToken);
      await secureStorage.setUserData(data.user);

      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: data.user });
      return { success: true, data };
    } catch (error) {
      const message = error.userMessage || error.response?.data?.error || 'Biometric login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      
      // If the refresh token is invalid, clear credentials
      try {
        await secureStorage.clearTokens();
        await secureStorage.clearUserData();
      } catch (e) {}

      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore network errors during logout
    }

    try {
      await secureStorage.clearTokens();
      await secureStorage.clearUserData();
    } catch {
      // Continue with logout even if storage clear fails
    }
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  const setOnboardingSeen = useCallback(async () => {
    await secureStorage.setOnboardingSeen();
    dispatch({ type: AUTH_ACTIONS.SET_ONBOARDING_SEEN, payload: true });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      biometricLogin,
      register,
      logout,
      clearError,
      setOnboardingSeen,
    }),
    [state, login, biometricLogin, register, logout, clearError, setOnboardingSeen]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
