import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { LIGHT_COLORS, DARK_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, ICON_SIZES, ANIMATION } from '../theme/theme';
import secureStorage from '../utils/secureStorage';

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState('system'); // 'light' | 'dark' | 'system'
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadStoredTheme() {
      try {
        const savedMode = await secureStorage.getThemeMode();
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode);
        }
      } catch (error) {
        console.warn('Failed to load theme mode from SecureStore:', error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadStoredTheme();
  }, []);

  const setThemeMode = useCallback(async (newMode) => {
    if (!['light', 'dark', 'system'].includes(newMode)) return;
    setThemeModeState(newMode);
    try {
      await secureStorage.setThemeMode(newMode);
    } catch (error) {
      console.warn('Failed to persist theme mode to SecureStore:', error);
    }
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const colors = useMemo(() => {
    return isDark ? DARK_COLORS : LIGHT_COLORS;
  }, [isDark]);

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      isDark,
      colors,
      typography: TYPOGRAPHY,
      spacing: SPACING,
      borderRadius: BORDER_RADIUS,
      shadows: SHADOWS,
      iconSizes: ICON_SIZES,
      animation: ANIMATION,
      isLoaded,
    }),
    [themeMode, setThemeMode, isDark, colors, isLoaded]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
