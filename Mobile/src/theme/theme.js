import { Platform } from 'react-native';

export const COLORS = {
  primary: '#6B4EFF',
  primaryDark: '#5A3DE8',
  primaryLight: '#8B6FFF',
  secondary: '#8B5CF6',
  secondaryLight: '#A78BFA',

  background: '#F8F7FC',
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

  inputBg: '#F6F5FD',
  inputBorder: '#E6E3FA',
  inputFocusBorder: '#6B4EFF',

  overlay: 'rgba(0, 0, 0, 0.5)',
  shimmer: '#E5E7EB',
  shimmerHighlight: '#F3F4F6',

  gradient: {
    primary: ['#6B4EFF', '#8B5CF6'],
    primaryReverse: ['#8B5CF6', '#6B4EFF'],
    splash: ['#F8F7FC', '#EDE9FE', '#DDD6FE'],
    onboarding: ['#F8F7FC', '#F3F0FF'],
    card: ['#FFFFFF', '#FAFAFE'],
  },

  avatarColors: [
    '#6B4EFF', '#8B5CF6', '#EC4899', '#EF4444',
    '#F59E0B', '#10B981', '#3B82F6', '#6366F1',
    '#14B8A6', '#F97316', '#8B5CF6', '#06B6D4',
  ],
};

export const TYPOGRAPHY = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
  }),

  h1: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  bodySemiBold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmallMedium: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  captionMedium: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600',
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
