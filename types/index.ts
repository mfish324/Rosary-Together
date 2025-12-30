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

// Audio & Moderation Types

export interface AudioParticipant {
  userId: string;
  displayName?: string;
  country: string;
  isSpeaking: boolean;      // voice activity detected
  isMicEnabled: boolean;    // their mic is on/off
  isMutedByMe: boolean;     // I've muted them locally
  isBlocked: boolean;       // I've blocked this user
}

export type ReportReason =
  | 'inappropriate_audio'
  | 'harassment'
  | 'disruptive_behavior'
  | 'spam'
  | 'other';

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  sessionId: string;
  reason: ReportReason;
  details?: string;
  createdAt: Date;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
}

export interface BlockedUser {
  userId: string;
  blockedAt: Date;
}

export interface UserSuspension {
  suspended: boolean;
  suspendedAt?: Date;
  suspensionReason?: 'auto_multiple_reports' | 'manual_review';
}

export type AudioConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface AudioRoomState {
  sessionId: string | null;
  connectionState: AudioConnectionState;
  error: string | null;
  participants: AudioParticipant[];
  isMicEnabled: boolean;
}

// Prayer Room types
export type RoomType = 'public' | 'private';

export interface Room {
  id: string;
  name: string;
  language: Language;
  type: RoomType;
  groupId?: string; // Only for private rooms
  createdBy: string; // userId
  createdAt: Date;
  isActive: boolean; // Room is currently in session
  currentSessionId?: string;
  participantCount: number;
  maxParticipants?: number; // Optional limit for private rooms
}

export interface RoomParticipant {
  userId: string;
  joinedAt: number;
  isSpeaking: boolean;
  isMicEnabled: boolean;
}

// Prayer Group types
export type GroupRole = 'owner' | 'admin' | 'member';

export interface PrayerGroup {
  id: string;
  name: string;
  description?: string;
  createdBy: string; // userId
  createdAt: Date;
  memberCount: number;
  defaultLanguage: Language;
  imageUrl?: string;
}

export interface GroupMember {
  userId: string;
  groupId: string;
  role: GroupRole;
  displayName?: string;
  joinedAt: Date;
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  code: string; // Unique 8-char invite code
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date; // Optional expiry
  maxUses?: number; // Optional use limit
  usedCount: number;
  isActive: boolean;
}
