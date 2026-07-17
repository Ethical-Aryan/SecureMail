import { Platform } from 'react-native';

export const COLORS = {
  primary: '#6B4EFF',
  primaryDark: '#5A3DE8',
  primaryLight: '#8B6FFF',
  secondary: '#8B5CF6',
  secondaryLight: '#A78BFA',

  background: '#F7F2EA', // Primary Beige
  backgroundDark: '#111827',
  surface: '#FFFFFF',
  surfaceDark: '#1F2937',
  card: '#FFFFFF',
  cardDark: '#1F2937',

  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#374151',

  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textLink: '#6B4EFF',

  inputBg: '#FFFFFF',
  inputBorder: '#E5E7EB',
  inputFocusBorder: '#6B4EFF',

  overlay: 'rgba(0, 0, 0, 0.5)',
  shimmer: '#E5E7EB',
  shimmerHighlight: '#F3F4F6',

  gradient: {
    primary: ['#6B4EFF', '#8B5CF6'],
    primaryReverse: ['#8B5CF6', '#6B4EFF'],
    splash: ['#F7F2EA', '#EAE0FE', '#DDD6FE'],
    onboarding: ['#F7F2EA', '#F3F0FF'],
    card: ['#FFFFFF', '#FAFAFE'],
  },

  avatarColors: [
    '#6B4EFF', '#8B5CF6', '#EC4899', '#EF4444',
    '#F59E0B', '#10B981', '#3B82F6', '#6366F1',
    '#14B8A6', '#F97316', '#8B5CF6', '#06B6D4',
  ],
};

export const TYPOGRAPHY = {
  fontFamily: 'Inter_400Regular',

  h1: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    lineHeight: 32,
  },
  h4: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
  },
  h5: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  bodySemiBold: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmallMedium: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  captionMedium: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  captionBold: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    lineHeight: 16,
  },
  overline: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
  },
  buttonSmall: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  section: 48,
  screen: 56,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const SHADOWS = Platform.select({
  ios: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    colored: {
      shadowColor: '#6B4EFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
  },
  android: {
    sm: { elevation: 2 },
    md: { elevation: 4 },
    lg: { elevation: 8 },
    xl: { elevation: 12 },
    colored: { elevation: 6 },
  },
});

export const ICON_SIZES = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
};

export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
};

const theme = {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  ICON_SIZES,
  ANIMATION,
};

export default theme;
