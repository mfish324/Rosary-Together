import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Session, Language, MysteryType } from '../types';
import { COLLECTIONS } from '../constants';

// Create a new prayer session
export async function createSession(
  participants: string[],
  language: Language,
  mysteries: MysteryType
): Promise<Session> {
  const sessionData = {
    startedAt: serverTimestamp(),
    completedAt: null,
    mysteries,
    language,
    participants,
    participantCount: participants.length,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.SESSIONS), sessionData);

  return {
    id: docRef.id,
    startedAt: new Date(),
    completedAt: undefined,
    mysteries,
    language,
    participants,
    participantCount: participants.length,
  };
}

// Get a session by ID
export async function getSession(sessionId: string): Promise<Session | null> {
  const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    startedAt: (data.startedAt as Timestamp)?.toDate() || new Date(),
    completedAt: (data.completedAt as Timestamp)?.toDate(),
    mysteries: data.mysteries,
    language: data.language,
    participants: data.participants,
    participantCount: data.participantCount,
  };
}

// Join an existing session
export async function joinSession(
  sessionId: string,
  userId: string
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Session not found');
  }

  const data = docSnap.data();
  const newParticipantCount = (data.participantCount || 0) + 1;

  await updateDoc(docRef, {
    participants: arrayUnion(userId),
    participantCount: newParticipantCount,
  });
}

// Leave a session
export async function leaveSession(
  sessionId: string,
  userId: string
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return;
  }

  const data = docSnap.data();
  const newParticipantCount = Math.max((data.participantCount || 1) - 1, 0);

  await updateDoc(docRef, {
    participants: arrayRemove(userId),
    participantCount: newParticipantCount,
  });
}

// Mark session as completed for a user
export async function completeSession(
  sessionId: string,
  userId: string
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return;
  }

  // Check if this is the last participant
  const data = docSnap.data();
  const participants = data.participants || [];

  if (participants.length <= 1) {
    // Last participant, mark session as completed
    await updateDoc(docRef, {
      completedAt: serverTimestamp(),
    });
  }
}

// Subscribe to session updates
export function subscribeToSession(
  sessionId: string,
  callback: (session: Session | null) => void
): () => void {
  const docRef = doc(db, COLLECTIONS.SESSIONS, sessionId);

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }

    const data = docSnap.data();
    callback({
      id: docSnap.id,
      startedAt: (data.startedAt as Timestamp)?.toDate() || new Date(),
      completedAt: (data.completedAt as Timestamp)?.toDate(),
      mysteries: data.mysteries,
      language: data.language,
      participants: data.participants,
      participantCount: data.participantCount,
    });
  });

  return unsubscribe;
}

// Get active session for user (if any)
export async function getActiveSessionForUser(
  userId: string
): Promise<Session | null> {
  // This would require a query on participants array
  // For simplicity, we'll handle this through presence data instead
  return null;
}
