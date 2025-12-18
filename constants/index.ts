import { MysteryType } from '../types';

// Queue and matching settings
export const MIN_GROUP_SIZE = 3;
export const MAX_QUEUE_WAIT_MINUTES = 3;
export const QUEUE_CHECK_INTERVAL_MS = 30000;
export const PRESENCE_TIMEOUT_MS = 60000; // Consider user offline after 60s of no heartbeat

// Rosary structure
export const HAIL_MARYS_PER_DECADE = 10;
export const DECADES_PER_ROSARY = 5;
export const OPENING_HAIL_MARYS = 3;

// Day of week mysteries schedule
// Sunday=0, Monday=1, etc.
export const MYSTERIES_BY_DAY: Record<number, MysteryType> = {
  0: 'glorious', // Sunday
  1: 'joyful', // Monday
  2: 'sorrowful', // Tuesday
  3: 'glorious', // Wednesday
  4: 'luminous', // Thursday
  5: 'sorrowful', // Friday
  6: 'joyful', // Saturday
};

// Day names for display
export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// Mystery display names
export const MYSTERY_NAMES: Record<MysteryType, string> = {
  joyful: 'Joyful Mysteries',
  sorrowful: 'Sorrowful Mysteries',
  glorious: 'Glorious Mysteries',
  luminous: 'Luminous Mysteries',
};

// Theme colors
export const COLORS = {
  // Primary colors
  primary: '#6366f1', // Indigo
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',

  // Background colors
  background: '#1a1a2e',
  backgroundLight: '#16213e',
  surface: '#0f3460',
  surfaceLight: '#1a4b8c',

  // Text colors
  text: '#ffffff',
  textSecondary: '#a0aec0',
  textMuted: '#718096',

  // Accent colors
  gold: '#d4af37',
  goldLight: '#f4d03f',

  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Bead colors
  beadActive: '#d4af37',
  beadInactive: '#4a5568',
  beadComplete: '#10b981',
};

// Typography
export const FONTS = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Animation durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: '@rosary_user_preferences',
  OFFLINE_COMPLETIONS: '@rosary_offline_completions',
  CACHED_PRAYERS: '@rosary_cached_prayers',
  CACHED_MYSTERIES: '@rosary_cached_mysteries',
  LAST_LANGUAGE: '@rosary_last_language',
  LAST_COUNTRY: '@rosary_last_country',
};

// Firebase collection names
export const COLLECTIONS = {
  USERS: 'users',
  SESSIONS: 'sessions',
  INTENTIONS: 'intentions',
};

// Firebase Realtime Database paths
export const RTDB_PATHS = {
  PRESENCE: 'presence',
  QUEUE: 'queue',
};
