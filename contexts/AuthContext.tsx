import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  subscribeToAuthState,
  signInAnonymousUser,
  signInWithEmail,
  createAccountWithEmail,
  linkAnonymousToEmail,
  signOut,
  getUserDocument,
  updateUserDocument,
} from '../services/auth';
import { User, Language } from '../types';

interface AuthContextType {
  // Auth state
  firebaseUser: FirebaseUser | null;
  user: User | null;
  isLoading: boolean;
  isAnonymous: boolean;

  // Auth actions
  signInAnonymously: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  createAccount: (email: string, password: string, displayName?: string) => Promise<void>;
  linkToEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // User actions
  updateUser: (updates: Partial<Omit<User, 'id' | 'createdAt'>>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Fetch user document from Firestore
        const userDoc = await getUserDocument(fbUser.uid);
        setUser(userDoc);
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInAnonymously = async () => {
    setIsLoading(true);
    try {
      await signInAnonymousUser();
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const createAccount = async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
      await createAccountWithEmail(email, password, displayName);
    } finally {
      setIsLoading(false);
    }
  };

  const linkToEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await linkAnonymousToEmail(email, password);
      // Refresh user document
      if (firebaseUser) {
        const userDoc = await getUserDocument(firebaseUser.uid);
        setUser(userDoc);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<Omit<User, 'id' | 'createdAt'>>) => {
    if (!firebaseUser) return;

    await updateUserDocument(firebaseUser.uid, updates);

    // Update local state
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const refreshUser = async () => {
    if (!firebaseUser) return;

    const userDoc = await getUserDocument(firebaseUser.uid);
    setUser(userDoc);
  };

  const value: AuthContextType = {
    firebaseUser,
    user,
    isLoading,
    isAnonymous: firebaseUser?.isAnonymous ?? false,

    signInAnonymously,
    signInWithEmailPassword,
    createAccount,
    linkToEmail,
    logout,

    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
