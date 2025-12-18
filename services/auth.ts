import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User as AppUser, Language } from '../types';
import { COLLECTIONS } from '../constants';

// Sign in anonymously for quick start
export async function signInAnonymousUser(): Promise<User> {
  const result = await signInAnonymously(auth);
  await createUserDocument(result.user.uid, {
    isAnonymous: true,
  });
  return result.user;
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// Create account with email and password
export async function createAccountWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await createUserDocument(result.user.uid, {
    displayName,
    isAnonymous: false,
  });
  return result.user;
}

// Link anonymous account to email/password
export async function linkAnonymousToEmail(
  email: string,
  password: string
): Promise<User> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.isAnonymous) {
    throw new Error('No anonymous user to link');
  }

  const credential = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(currentUser, credential);

  await updateDoc(doc(db, COLLECTIONS.USERS, result.user.uid), {
    isAnonymous: false,
  });

  return result.user;
}

// Sign in with Google (requires additional setup for native)
export async function signInWithGoogle(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);

  // Check if user document exists, create if not
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, result.user.uid));
  if (!userDoc.exists()) {
    await createUserDocument(result.user.uid, {
      displayName: result.user.displayName || undefined,
      isAnonymous: false,
    });
  }

  return result.user;
}

// Sign in with Apple (requires additional setup for native)
export async function signInWithApple(idToken: string, nonce: string): Promise<User> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken,
    rawNonce: nonce,
  });
  const result = await signInWithCredential(auth, credential);

  // Check if user document exists, create if not
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, result.user.uid));
  if (!userDoc.exists()) {
    await createUserDocument(result.user.uid, {
      displayName: result.user.displayName || undefined,
      isAnonymous: false,
    });
  }

  return result.user;
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Subscribe to auth state changes
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Create user document in Firestore
async function createUserDocument(
  userId: string,
  data: {
    displayName?: string;
    isAnonymous: boolean;
  }
): Promise<void> {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const newUser: Omit<AppUser, 'id' | 'createdAt' | 'lastPrayedAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      isAnonymous: boolean;
    } = {
      displayName: data.displayName,
      country: 'US', // Default, will be updated by user
      preferredLanguage: 'en' as Language,
      totalRosaries: 0,
      currentStreak: 0,
      longestStreak: 0,
      preferences: {
        showLocation: true,
        notifications: true,
        audioGuided: false,
      },
      createdAt: serverTimestamp(),
      isAnonymous: data.isAnonymous,
    };

    await setDoc(userRef, newUser);
  }
}

// Get user document from Firestore
export async function getUserDocument(userId: string): Promise<AppUser | null> {
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();
  return {
    id: userId,
    displayName: data.displayName,
    country: data.country,
    preferredLanguage: data.preferredLanguage,
    totalRosaries: data.totalRosaries,
    currentStreak: data.currentStreak,
    longestStreak: data.longestStreak,
    lastPrayedAt: data.lastPrayedAt?.toDate(),
    createdAt: data.createdAt?.toDate() || new Date(),
    preferences: data.preferences,
  } as AppUser;
}

// Update user document
export async function updateUserDocument(
  userId: string,
  updates: Partial<Omit<AppUser, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), updates);
}

// Update user stats after completing a rosary
export async function updateUserStats(userId: string): Promise<void> {
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
  if (!userDoc.exists()) return;

  const data = userDoc.data();
  const now = new Date();
  const lastPrayed = data.lastPrayedAt?.toDate();

  // Calculate streak
  let newStreak = 1;
  if (lastPrayed) {
    const daysSinceLastPrayer = Math.floor(
      (now.getTime() - lastPrayed.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastPrayer === 1) {
      // Consecutive day, increase streak
      newStreak = (data.currentStreak || 0) + 1;
    } else if (daysSinceLastPrayer === 0) {
      // Same day, keep streak
      newStreak = data.currentStreak || 1;
    }
    // If > 1 day, streak resets to 1
  }

  const newLongestStreak = Math.max(newStreak, data.longestStreak || 0);

  await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
    totalRosaries: (data.totalRosaries || 0) + 1,
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastPrayedAt: serverTimestamp(),
  });
}
