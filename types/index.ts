// User types
export interface User {
  id: string;
  displayName?: string;
  country: string;
  preferredLanguage: Language;
  totalRosaries: number;
  currentStreak: number;
  longestStreak: number;
  lastPrayedAt?: Date;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  showLocation: boolean;
  notifications: boolean;
  audioGuided: boolean;
}

export type Language = 'en' | 'es' | 'pt' | 'tl';

export type UserStatus = 'idle' | 'ready' | 'praying';

export interface PresenceUser {
  userId: string;
  status: UserStatus;
  joinedQueueAt?: number;
  country: string;
  displayName?: string;
  language: Language;
  sessionId?: string;
}

// Mystery types
export type MysteryType = 'joyful' | 'sorrowful' | 'glorious' | 'luminous';

export interface Mystery {
  number: number;
  title: string;
  scripture: string;
  reference: string;
  fruit: string;
  imageKey: string;
}

export interface MysterySet {
  name: string;
  type: MysteryType;
  mysteries: Mystery[];
}

// Session types
export interface Session {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  mysteries: MysteryType;
  language: Language;
  participants: string[];
  participantCount: number;
}

export interface PrayerCompletion {
  userId: string;
  sessionId?: string;
  mysteries: MysteryType;
  language: Language;
  completedAt: Date;
  wasOffline: boolean;
}

// Intention types
export interface Intention {
  id: string;
  userId: string;
  text: string;
  isAnonymous: boolean;
  prayerCount: number;
  language: Language;
  createdAt: Date;
}

// Prayer flow types
export type PrayerStep =
  | { type: 'sign_of_cross' }
  | { type: 'creed' }
  | { type: 'our_father' }
  | { type: 'hail_mary'; count: number; total: number }
  | { type: 'glory_be' }
  | { type: 'fatima_prayer' }
  | { type: 'mystery_announcement'; mystery: Mystery; mysteryNumber: number }
  | { type: 'hail_holy_queen' }
  | { type: 'final_prayer' };

export interface PrayerState {
  currentDecade: number; // 0-4
  currentStep: PrayerStep;
  isComplete: boolean;
  stepIndex: number;
}

export interface QueueCounts {
  en: number;
  es: number;
  pt: number;
  tl: number;
}

// Language configuration
export interface LanguageConfig {
  name: string;
  flag: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: Record<Language, LanguageConfig> = {
  en: { name: 'English', flag: '🇺🇸', nativeName: 'English' },
  es: { name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  pt: { name: 'Portuguese', flag: '🇧🇷', nativeName: 'Português' },
  tl: { name: 'Tagalog', flag: '🇵🇭', nativeName: 'Tagalog' },
};

// Prayer content types
export interface Prayer {
  title: string;
  text: string;
}

export interface PrayerContent {
  signOfTheCross: Prayer;
  apostlesCreed: Prayer;
  ourFather: Prayer;
  hailMary: Prayer;
  gloryBe: Prayer;
  fatimaPrayer: Prayer;
  hailHolyQueen: Prayer;
  finalPrayer: Prayer;
}

// Firebase presence data
export interface PresenceData {
  userId: string;
  status: UserStatus;
  joinedQueueAt: number | null;
  country: string;
  displayName: string | null;
  language: Language;
  sessionId: string | null;
  lastSeen: number;
}
