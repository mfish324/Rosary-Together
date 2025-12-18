import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
  off,
  query,
  orderByChild,
  equalTo,
  get,
  remove,
} from 'firebase/database';
import { rtdb } from './firebase';
import { PresenceData, PresenceUser, Language, UserStatus, QueueCounts } from '../types';
import { RTDB_PATHS, PRESENCE_TIMEOUT_MS } from '../constants';

// Set user presence data
export async function setUserPresence(
  userId: string,
  data: Partial<PresenceData>
): Promise<void> {
  const presenceRef = ref(rtdb, `${RTDB_PATHS.PRESENCE}/${userId}`);

  const presenceData: PresenceData = {
    userId,
    status: data.status || 'idle',
    joinedQueueAt: data.joinedQueueAt || null,
    country: data.country || 'US',
    displayName: data.displayName || null,
    language: data.language || 'en',
    sessionId: data.sessionId || null,
    lastSeen: Date.now(),
  };

  await set(presenceRef, presenceData);

  // Set up disconnect handler to clean up presence when user goes offline
  const disconnectRef = onDisconnect(presenceRef);
  await disconnectRef.remove();
}

// Update user status
export async function updateUserStatus(
  userId: string,
  status: UserStatus,
  sessionId?: string
): Promise<void> {
  const presenceRef = ref(rtdb, `${RTDB_PATHS.PRESENCE}/${userId}`);

  const updates: Partial<PresenceData> = {
    status,
    lastSeen: Date.now(),
  };

  if (status === 'ready') {
    updates.joinedQueueAt = Date.now();
  } else if (status === 'idle') {
    updates.joinedQueueAt = null;
    updates.sessionId = null;
  }

  if (sessionId !== undefined) {
    updates.sessionId = sessionId;
  }

  const snapshot = await get(presenceRef);
  if (snapshot.exists()) {
    const currentData = snapshot.val() as PresenceData;
    await set(presenceRef, { ...currentData, ...updates });
  }
}

// Join the prayer queue
export async function joinQueue(
  userId: string,
  language: Language,
  country: string,
  displayName?: string
): Promise<void> {
  await setUserPresence(userId, {
    status: 'ready',
    joinedQueueAt: Date.now(),
    language,
    country,
    displayName: displayName || null,
  });
}

// Leave the prayer queue
export async function leaveQueue(userId: string): Promise<void> {
  await updateUserStatus(userId, 'idle');
}

// Set user to praying status
export async function setUserPraying(
  userId: string,
  sessionId: string
): Promise<void> {
  await updateUserStatus(userId, 'praying', sessionId);
}

// Remove user presence (on sign out)
export async function removeUserPresence(userId: string): Promise<void> {
  const presenceRef = ref(rtdb, `${RTDB_PATHS.PRESENCE}/${userId}`);
  await remove(presenceRef);
}

// Subscribe to all presence updates
export function subscribeToPresence(
  callback: (users: PresenceUser[]) => void
): () => void {
  const presenceRef = ref(rtdb, RTDB_PATHS.PRESENCE);

  const unsubscribe = onValue(presenceRef, (snapshot) => {
    const users: PresenceUser[] = [];

    if (snapshot.exists()) {
      const data = snapshot.val();
      const now = Date.now();

      Object.values(data).forEach((userData: any) => {
        // Filter out stale presence (users who haven't updated in a while)
        if (now - userData.lastSeen < PRESENCE_TIMEOUT_MS) {
          users.push({
            userId: userData.userId,
            status: userData.status,
            joinedQueueAt: userData.joinedQueueAt,
            country: userData.country,
            displayName: userData.displayName,
            language: userData.language,
            sessionId: userData.sessionId,
          });
        }
      });
    }

    callback(users);
  });

  return () => off(presenceRef);
}

// Get users in queue by language
export async function getReadyUsersByLanguage(
  language: Language
): Promise<PresenceUser[]> {
  const presenceRef = ref(rtdb, RTDB_PATHS.PRESENCE);
  const snapshot = await get(presenceRef);

  const users: PresenceUser[] = [];

  if (snapshot.exists()) {
    const data = snapshot.val();
    const now = Date.now();

    Object.values(data).forEach((userData: any) => {
      if (
        userData.status === 'ready' &&
        userData.language === language &&
        now - userData.lastSeen < PRESENCE_TIMEOUT_MS
      ) {
        users.push({
          userId: userData.userId,
          status: userData.status,
          joinedQueueAt: userData.joinedQueueAt,
          country: userData.country,
          displayName: userData.displayName,
          language: userData.language,
          sessionId: userData.sessionId,
        });
      }
    });
  }

  return users;
}

// Get queue counts by language
export async function getQueueCountsByLanguage(): Promise<QueueCounts> {
  const presenceRef = ref(rtdb, RTDB_PATHS.PRESENCE);
  const snapshot = await get(presenceRef);

  const counts: QueueCounts = {
    en: 0,
    es: 0,
    pt: 0,
    tl: 0,
  };

  if (snapshot.exists()) {
    const data = snapshot.val();
    const now = Date.now();

    Object.values(data).forEach((userData: any) => {
      if (
        userData.status === 'ready' &&
        now - userData.lastSeen < PRESENCE_TIMEOUT_MS
      ) {
        const lang = userData.language as Language;
        if (lang in counts) {
          counts[lang]++;
        }
      }
    });
  }

  return counts;
}

// Get count of users currently praying
export async function getPrayingCount(): Promise<number> {
  const presenceRef = ref(rtdb, RTDB_PATHS.PRESENCE);
  const snapshot = await get(presenceRef);

  let count = 0;

  if (snapshot.exists()) {
    const data = snapshot.val();
    const now = Date.now();

    Object.values(data).forEach((userData: any) => {
      if (
        userData.status === 'praying' &&
        now - userData.lastSeen < PRESENCE_TIMEOUT_MS
      ) {
        count++;
      }
    });
  }

  return count;
}

// Subscribe to queue counts
export function subscribeToQueueCounts(
  callback: (counts: QueueCounts) => void
): () => void {
  const presenceRef = ref(rtdb, RTDB_PATHS.PRESENCE);

  const unsubscribe = onValue(presenceRef, (snapshot) => {
    const counts: QueueCounts = {
      en: 0,
      es: 0,
      pt: 0,
      tl: 0,
    };

    if (snapshot.exists()) {
      const data = snapshot.val();
      const now = Date.now();

      Object.values(data).forEach((userData: any) => {
        if (
          userData.status === 'ready' &&
          now - userData.lastSeen < PRESENCE_TIMEOUT_MS
        ) {
          const lang = userData.language as Language;
          if (lang in counts) {
            counts[lang]++;
          }
        }
      });
    }

    callback(counts);
  });

  return () => off(presenceRef);
}

// Subscribe to praying count
export function subscribeToPrayingCount(
  callback: (count: number) => void
): () => void {
  const presenceRef = ref(rtdb, RTDB_PATHS.PRESENCE);

  const unsubscribe = onValue(presenceRef, (snapshot) => {
    let count = 0;

    if (snapshot.exists()) {
      const data = snapshot.val();
      const now = Date.now();

      Object.values(data).forEach((userData: any) => {
        if (
          userData.status === 'praying' &&
          now - userData.lastSeen < PRESENCE_TIMEOUT_MS
        ) {
          count++;
        }
      });
    }

    callback(count);
  });

  return () => off(presenceRef);
}

// Heartbeat to keep presence alive
export async function sendHeartbeat(userId: string): Promise<void> {
  const presenceRef = ref(rtdb, `${RTDB_PATHS.PRESENCE}/${userId}/lastSeen`);
  await set(presenceRef, Date.now());
}
