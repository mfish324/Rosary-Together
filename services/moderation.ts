import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  addDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { ReportReason, BlockedUser } from '../types';

const MUTED_USERS_KEY = 'muted_users';

// ============================================================================
// Client-Side Muting (AsyncStorage - local only)
// ============================================================================

/**
 * Mute a user locally. This only affects your audio stream.
 * The muted user won't know they're muted, and others can still hear them.
 */
export async function muteUser(userId: string): Promise<void> {
  const muted = await getMutedUsers();
  muted.add(userId);
  await AsyncStorage.setItem(MUTED_USERS_KEY, JSON.stringify([...muted]));
}

/**
 * Unmute a previously muted user.
 */
export async function unmuteUser(userId: string): Promise<void> {
  const muted = await getMutedUsers();
  muted.delete(userId);
  await AsyncStorage.setItem(MUTED_USERS_KEY, JSON.stringify([...muted]));
}

/**
 * Get the set of all muted user IDs.
 */
export async function getMutedUsers(): Promise<Set<string>> {
  try {
    const stored = await AsyncStorage.getItem(MUTED_USERS_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch (error) {
    console.error('Error getting muted users:', error);
    return new Set();
  }
}

/**
 * Check if a specific user is muted.
 */
export async function isUserMuted(userId: string): Promise<boolean> {
  const muted = await getMutedUsers();
  return muted.has(userId);
}

// ============================================================================
// Blocking (Firestore - persists across sessions)
// ============================================================================

/**
 * Block a user. Blocked users won't be matched with you in future sessions.
 * Also automatically mutes them locally.
 */
export async function blockUser(
  currentUserId: string,
  blockedUserId: string
): Promise<void> {
  const blockedRef = doc(
    db,
    'users',
    currentUserId,
    'blocked',
    blockedUserId
  );

  await setDoc(blockedRef, {
    blockedAt: serverTimestamp(),
  });

  // Also mute them locally
  await muteUser(blockedUserId);
}

/**
 * Unblock a user.
 */
export async function unblockUser(
  currentUserId: string,
  blockedUserId: string
): Promise<void> {
  const blockedRef = doc(
    db,
    'users',
    currentUserId,
    'blocked',
    blockedUserId
  );

  await deleteDoc(blockedRef);
}

/**
 * Get all blocked users for the current user.
 */
export async function getBlockedUsers(
  currentUserId: string
): Promise<BlockedUser[]> {
  try {
    const blockedRef = collection(db, 'users', currentUserId, 'blocked');
    const snapshot = await getDocs(blockedRef);

    return snapshot.docs.map((doc) => ({
      userId: doc.id,
      blockedAt: doc.data().blockedAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error('Error getting blocked users:', error);
    return [];
  }
}

/**
 * Check if a specific user is blocked.
 */
export async function isUserBlocked(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    const blockedRef = doc(
      db,
      'users',
      currentUserId,
      'blocked',
      targetUserId
    );
    const blockedDoc = await getDoc(blockedRef);
    return blockedDoc.exists();
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return false;
  }
}

/**
 * Get a Set of blocked user IDs for quick lookup.
 */
export async function getBlockedUserIds(
  currentUserId: string
): Promise<Set<string>> {
  const blocked = await getBlockedUsers(currentUserId);
  return new Set(blocked.map((b) => b.userId));
}

// ============================================================================
// Reporting (Firestore - creates report for review)
// ============================================================================

/**
 * Report a user for inappropriate behavior.
 * If alsoBlock is true, the user will also be blocked.
 */
export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  sessionId: string,
  reason: ReportReason,
  details?: string,
  alsoBlock: boolean = false
): Promise<string> {
  const reportsRef = collection(db, 'reports');

  const reportDoc = await addDoc(reportsRef, {
    reporterId,
    reportedUserId,
    sessionId,
    reason,
    details: details || null,
    createdAt: serverTimestamp(),
    status: 'pending',
  });

  // Optionally block the user as well
  if (alsoBlock) {
    await blockUser(reporterId, reportedUserId);
  }

  return reportDoc.id;
}

/**
 * Check if the current user has already reported a specific user in this session.
 */
export async function hasReportedInSession(
  reporterId: string,
  reportedUserId: string,
  sessionId: string
): Promise<boolean> {
  try {
    const reportsRef = collection(db, 'reports');
    const q = query(
      reportsRef,
      where('reporterId', '==', reporterId),
      where('reportedUserId', '==', reportedUserId),
      where('sessionId', '==', sessionId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking existing report:', error);
    return false;
  }
}

// ============================================================================
// Report Reason Display Names
// ============================================================================

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  inappropriate_audio: 'Inappropriate audio content',
  harassment: 'Harassment',
  disruptive_behavior: 'Disruptive behavior',
  spam: 'Spam',
  other: 'Other',
};
