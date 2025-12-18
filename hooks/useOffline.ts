import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerCompletion } from '../types';
import { STORAGE_KEYS } from '../constants';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCompletions, setPendingCompletions] = useState<PrayerCompletion[]>([]);

  // Monitor network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? true);
    });

    // Check initial state
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  // Load pending completions from storage
  useEffect(() => {
    const loadPending = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_COMPLETIONS);
        if (stored) {
          setPendingCompletions(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Failed to load offline completions:', error);
      }
    };

    loadPending();
  }, []);

  // Store a completion for later sync
  const storeOfflineCompletion = useCallback(
    async (completion: PrayerCompletion) => {
      try {
        const updated = [...pendingCompletions, completion];
        await AsyncStorage.setItem(
          STORAGE_KEYS.OFFLINE_COMPLETIONS,
          JSON.stringify(updated)
        );
        setPendingCompletions(updated);
      } catch (error) {
        console.warn('Failed to store offline completion:', error);
      }
    },
    [pendingCompletions]
  );

  // Clear synced completions
  const clearSyncedCompletions = useCallback(
    async (syncedIds: string[]) => {
      try {
        const remaining = pendingCompletions.filter(
          (c) => !syncedIds.includes(c.userId + c.completedAt.toString())
        );
        await AsyncStorage.setItem(
          STORAGE_KEYS.OFFLINE_COMPLETIONS,
          JSON.stringify(remaining)
        );
        setPendingCompletions(remaining);
      } catch (error) {
        console.warn('Failed to clear synced completions:', error);
      }
    },
    [pendingCompletions]
  );

  return {
    isOnline,
    pendingCompletions,
    pendingCount: pendingCompletions.length,
    storeOfflineCompletion,
    clearSyncedCompletions,
  };
}

export default useOffline;
