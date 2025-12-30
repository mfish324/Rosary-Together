import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';

interface UserProfile {
  displayName: string;
  email?: string;
}

interface UserContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  setProfile: (profile: UserProfile) => Promise<void>;
  clearProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_PROFILE_KEY = '@rosary_user_profile';

export function UserProvider({ children }: { children: ReactNode }) {
  const { firebaseUser } = useAuth();
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (stored) {
        setProfileState(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setProfile = async (newProfile: UserProfile) => {
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));
      setProfileState(newProfile);

      // Also save to Firestore if user is authenticated (for Cloud Function to read)
      if (firebaseUser) {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          displayName: newProfile.displayName,
          email: newProfile.email || null,
          updatedAt: new Date(),
        }, { merge: true });
      }
    } catch (error) {
      console.error('Failed to save user profile:', error);
      throw error;
    }
  };

  const clearProfile = async () => {
    try {
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      setProfileState(null);
    } catch (error) {
      console.error('Failed to clear user profile:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ profile, isLoading, setProfile, clearProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
