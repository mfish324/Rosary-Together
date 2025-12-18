import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  setUserPresence,
  updateUserStatus,
  joinQueue as joinQueueService,
  leaveQueue as leaveQueueService,
  setUserPraying,
  removeUserPresence,
  subscribeToQueueCounts,
  subscribeToPrayingCount,
  sendHeartbeat,
  getReadyUsersByLanguage,
} from '../services/presence';
import { useAuth } from './AuthContext';
import { QueueCounts, Language, UserStatus, PresenceUser } from '../types';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

interface PresenceContextType {
  // State
  isOnline: boolean;
  queueCounts: QueueCounts;
  prayingCount: number;
  currentStatus: UserStatus;
  queueUsers: PresenceUser[];

  // Actions
  joinQueue: (language: Language) => Promise<void>;
  leaveQueue: () => Promise<void>;
  startPraying: (sessionId: string) => Promise<void>;
  stopPraying: () => Promise<void>;
  refreshQueueUsers: (language: Language) => Promise<void>;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

interface PresenceProviderProps {
  children: ReactNode;
}

export function PresenceProvider({ children }: PresenceProviderProps) {
  const { firebaseUser, user } = useAuth();

  const [isOnline, setIsOnline] = useState(true);
  const [queueCounts, setQueueCounts] = useState<QueueCounts>({
    en: 0,
    es: 0,
    pt: 0,
    tl: 0,
  });
  const [prayingCount, setPrayingCount] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<UserStatus>('idle');
  const [queueUsers, setQueueUsers] = useState<PresenceUser[]>([]);

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Initialize presence when user logs in
  useEffect(() => {
    if (!firebaseUser || !user) return;

    // Set initial presence
    setUserPresence(firebaseUser.uid, {
      status: 'idle',
      language: user.preferredLanguage,
      country: user.country,
      displayName: user.displayName || null,
    });

    // Start heartbeat
    heartbeatIntervalRef.current = setInterval(() => {
      if (appStateRef.current === 'active') {
        sendHeartbeat(firebaseUser.uid);
      }
    }, HEARTBEAT_INTERVAL);

    // Clean up presence on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      removeUserPresence(firebaseUser.uid);
    };
  }, [firebaseUser, user]);

  // Subscribe to queue counts
  useEffect(() => {
    const unsubscribe = subscribeToQueueCounts(setQueueCounts);
    return () => unsubscribe();
  }, []);

  // Subscribe to praying count
  useEffect(() => {
    const unsubscribe = subscribeToPrayingCount(setPrayingCount);
    return () => unsubscribe();
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground
        if (firebaseUser) {
          sendHeartbeat(firebaseUser.uid);
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [firebaseUser]);

  const joinQueue = useCallback(
    async (language: Language) => {
      if (!firebaseUser || !user) return;

      await joinQueueService(
        firebaseUser.uid,
        language,
        user.country,
        user.displayName
      );
      setCurrentStatus('ready');
    },
    [firebaseUser, user]
  );

  const leaveQueue = useCallback(async () => {
    if (!firebaseUser) return;

    await leaveQueueService(firebaseUser.uid);
    setCurrentStatus('idle');
  }, [firebaseUser]);

  const startPraying = useCallback(
    async (sessionId: string) => {
      if (!firebaseUser) return;

      await setUserPraying(firebaseUser.uid, sessionId);
      setCurrentStatus('praying');
    },
    [firebaseUser]
  );

  const stopPraying = useCallback(async () => {
    if (!firebaseUser) return;

    await updateUserStatus(firebaseUser.uid, 'idle');
    setCurrentStatus('idle');
  }, [firebaseUser]);

  const refreshQueueUsers = useCallback(async (language: Language) => {
    const users = await getReadyUsersByLanguage(language);
    setQueueUsers(users);
  }, []);

  const value: PresenceContextType = {
    isOnline,
    queueCounts,
    prayingCount,
    currentStatus,
    queueUsers,

    joinQueue,
    leaveQueue,
    startPraying,
    stopPraying,
    refreshQueueUsers,
  };

  return (
    <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}
