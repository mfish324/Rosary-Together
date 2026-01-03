/**
 * Stats Service
 *
 * Tracks global app statistics like total user count.
 * Uses a single Firestore document for atomic counter updates.
 */

import { doc, getDoc, setDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

const STATS_DOC = 'stats/global';

interface GlobalStats {
  totalUsers: number;
  updatedAt?: Date;
}

/**
 * Get the current global stats.
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  const docRef = doc(db, STATS_DOC);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return { totalUsers: 0 };
  }

  const data = docSnap.data();
  return {
    totalUsers: data.totalUsers || 0,
    updatedAt: data.updatedAt?.toDate(),
  };
}

/**
 * Increment the total user count by 1.
 * Called when a new user signs up.
 */
export async function incrementUserCount(): Promise<void> {
  const docRef = doc(db, STATS_DOC);

  try {
    await setDoc(
      docRef,
      {
        totalUsers: increment(1),
        updatedAt: new Date(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to increment user count:', error);
  }
}

/**
 * Subscribe to real-time stats updates.
 */
export function subscribeToStats(
  callback: (stats: GlobalStats) => void
): () => void {
  const docRef = doc(db, STATS_DOC);

  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback({ totalUsers: 0 });
        return;
      }

      const data = docSnap.data();
      callback({
        totalUsers: data.totalUsers || 0,
        updatedAt: data.updatedAt?.toDate(),
      });
    },
    (error) => {
      console.error('Stats subscription error:', error);
      callback({ totalUsers: 0 });
    }
  );

  return unsubscribe;
}
