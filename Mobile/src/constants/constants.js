// ==============================================================
// SecureMail Mobile — Constants
// ==============================================================

// API Configuration
// IMPORTANT: Change this to your machine's LAN IP for development
// Example: 'http://192.168.1.100:5000'
// For production, use your deployed backend URL
export const API_BASE_URL = 'http://10.247.160.52:5000';

// API Endpoints (mapped from Flask backend)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  EMAILS: {
    LIST: '/api/emails',
    COMPOSE: '/api/emails',
    UPDATE: (id) => `/api/emails/${id}`,
    DELETE: (id) => `/api/emails/${id}`,
    DECRYPT: (id) => `/api/emails/${id}/decrypt`,
  },
  STORAGE: {
    INFO: '/api/storage',
  },
};

// Secure Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'securemail_access_token',
  REFRESH_TOKEN: 'securemail_refresh_token',
  USER_DATA: 'securemail_user_data',
  ONBOARDING_SEEN: 'securemail_onboarding_seen',
  BIOMETRIC_ENABLED: 'securemail_biometric_enabled',
  STORED_EMAIL: 'securemail_stored_email',
  STORED_PASSWORD: 'securemail_stored_password',
  THEME_MODE: 'securemail_theme_mode',
  APP_LOCK_ENABLED: 'securemail_app_lock',
  NOTIFICATION_PREFS: 'securemail_notification_prefs',
};

// Email Folders
export const FOLDERS = {
  INBOX: 'inbox',
  SENT: 'sent',
  STARRED: 'starred',
  TRASH: 'trash',
  ALL: 'all',
};

// Folder Display Names
export const FOLDER_LABELS = {
  [FOLDERS.INBOX]: 'Inbox',
  [FOLDERS.SENT]: 'Sent',
  [FOLDERS.STARRED]: 'Starred',
  [FOLDERS.TRASH]: 'Trash',
  [FOLDERS.ALL]: 'All Mail',
};

// Validation Rules
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_SUBJECT_LENGTH: 255,
  MAX_BODY_LENGTH: 50000,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  SERVER_ERROR: 500,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  GENERIC: 'An unexpected error occurred. Please try again.',
  NO_INTERNET: 'No internet connection. Some features may be unavailable.',
};

// Onboarding Slides
export const ONBOARDING_SLIDES = [
  {
    id: '1',
    icon: 'shield',
    title: 'Your inbox, encrypted\nby default',
    description: 'Every message is protected end-to-end. Not even we can read your mail.',
    gradientColors: ['#F8F7FC', '#EDE9FE'],
  },
  {
    id: '2',
    icon: 'lock',
    title: 'Passkey-protected\nmessages',
    description: 'Add an extra layer of security with passkey encryption on sensitive emails.',
    gradientColors: ['#EDE9FE', '#DDD6FE'],
  },
  {
    id: '3',
    icon: 'zap',
    title: 'Fast, secure,\nbeautiful',
    description: 'A modern email experience designed for privacy-first communication.',
    gradientColors: ['#DDD6FE', '#C4B5FD'],
  },
];

// Tab Configuration
export const TAB_CONFIG = {
  INBOX: {
    name: 'InboxTab',
    label: 'Inbox',
    icon: 'inbox',
  },
  COMPOSE: {
    name: 'ComposeTab',
    label: 'Compose',
    icon: 'edit',
  },
  SENT: {
    name: 'SentTab',
    label: 'Sent',
    icon: 'send',
  },
  PROFILE: {
    name: 'ProfileTab',
    label: 'Profile',
    icon: 'user',
  },
  SETTINGS: {
    name: 'SettingsTab',
    label: 'Settings',
    icon: 'settings',
  },
};

// Screen Names
export const SCREENS = {
  SPLASH: 'Splash',
  ONBOARDING: 'Onboarding',
  LOGIN: 'Login',
  REGISTER: 'Register',
  INBOX: 'Inbox',
  EMAIL_DETAIL: 'EmailDetail',
  COMPOSE: 'Compose',
  SENT: 'Sent',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  SECURITY_CENTER: 'SecurityCenter',
  NOTIFICATIONS: 'Notifications',
  FORGOT_PASSWORD: 'ForgotPassword',
};

// App Info
export const APP_INFO = {
  NAME: 'SecureMail',
  TAGLINE: 'Private communication.',
  VERSION: '1.0.0',
  COPYRIGHT: `© ${new Date().getFullYear()} SecureMail Inc.`,
};

// Request Timeouts (ms)
export const TIMEOUTS = {
  DEFAULT: 5000,
  UPLOAD: 60000,
  AUTH: 5000,
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  INITIAL_PAGE: 1,
};
