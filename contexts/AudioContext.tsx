import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import {
  joinAudioRoom,
  leaveAudioRoom,
  toggleMicrophone,
  getMicEnabled,
  subscribeToParticipants,
  subscribeToConnectionState,
  setParticipantMuted,
  setParticipantBlocked,
  getCurrentSessionId,
} from '../services/audio';
import {
  muteUser,
  unmuteUser,
  getMutedUsers,
  blockUser,
  getBlockedUserIds,
  reportUser as reportUserService,
} from '../services/moderation';
import { useAuth } from './AuthContext';
import { AudioParticipant, AudioConnectionState, ReportReason } from '../types';

interface AudioContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // Local audio
  isMicEnabled: boolean;
  toggleMic: () => Promise<void>;

  // Participants
  participants: AudioParticipant[];

  // Muting (client-side)
  muteParticipant: (userId: string) => Promise<void>;
  unmuteParticipant: (userId: string) => Promise<void>;

  // Blocking
  blockParticipant: (userId: string) => Promise<void>;

  // Reporting
  reportParticipant: (
    userId: string,
    reason: ReportReason,
    details?: string,
    alsoBlock?: boolean
  ) => Promise<void>;

  // Room management
  joinRoom: (sessionId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;

  // Session info
  currentSessionId: string | null;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const { firebaseUser } = useAuth();

  const [connectionState, setConnectionState] =
    useState<AudioConnectionState>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [participants, setParticipants] = useState<AudioParticipant[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const unsubscribeParticipantsRef = useRef<(() => void) | null>(null);
  const unsubscribeConnectionRef = useRef<(() => void) | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const micWasEnabledBeforeBackground = useRef<boolean>(false);

  // Subscribe to connection state changes
  useEffect(() => {
    unsubscribeConnectionRef.current = subscribeToConnectionState(
      (state, error) => {
        setConnectionState(state);
        setConnectionError(error || null);
      }
    );

    return () => {
      if (unsubscribeConnectionRef.current) {
        unsubscribeConnectionRef.current();
      }
    };
  }, []);

  // Subscribe to participant updates
  useEffect(() => {
    unsubscribeParticipantsRef.current = subscribeToParticipants(
      (updatedParticipants) => {
        setParticipants(updatedParticipants);
      }
    );

    return () => {
      if (unsubscribeParticipantsRef.current) {
        unsubscribeParticipantsRef.current();
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (getCurrentSessionId()) {
        leaveAudioRoom();
      }
    };
  }, []);

  // Handle app state changes (background/foreground) for mic restoration
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // App going to background - save mic state
      if (
        appStateRef.current === 'active' &&
        (nextAppState === 'inactive' || nextAppState === 'background')
      ) {
        micWasEnabledBeforeBackground.current = isMicEnabled;
      }

      // App coming to foreground - restore mic if it was enabled
      if (
        (appStateRef.current === 'inactive' || appStateRef.current === 'background') &&
        nextAppState === 'active'
      ) {
        if (micWasEnabledBeforeBackground.current && currentSessionId) {
          // Re-enable the microphone after a short delay to ensure audio context is ready
          setTimeout(async () => {
            try {
              await toggleMicrophone(true);
              setIsMicEnabled(true);
            } catch (error) {
              console.error('Failed to restore microphone:', error);
              // If restoration fails, update UI to reflect actual state
              setIsMicEnabled(false);
            }
          }, 500);
        }
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isMicEnabled, currentSessionId]);

  const joinRoom = useCallback(
    async (sessionId: string) => {
      if (!firebaseUser) {
        setConnectionError('Not authenticated');
        return;
      }

      try {
        setConnectionError(null);
        await joinAudioRoom(sessionId, firebaseUser.uid);
        setCurrentSessionId(sessionId);
        setIsMicEnabled(false);
      } catch (error) {
        console.error('Failed to join audio room:', error);
        setConnectionError(
          error instanceof Error ? error.message : 'Failed to join audio room'
        );
      }
    },
    [firebaseUser]
  );

  const leaveRoom = useCallback(async () => {
    try {
      await leaveAudioRoom();
      setCurrentSessionId(null);
      setIsMicEnabled(false);
      setParticipants([]);
    } catch (error) {
      console.error('Failed to leave audio room:', error);
    }
  }, []);

  const toggleMic = useCallback(async () => {
    const newState = !isMicEnabled;
    try {
      await toggleMicrophone(newState);
      setIsMicEnabled(newState);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
      // Keep the current state if toggle fails
    }
  }, [isMicEnabled]);

  const muteParticipant = useCallback(async (userId: string) => {
    await muteUser(userId);
    await setParticipantMuted(userId, true);
  }, []);

  const unmuteParticipant = useCallback(async (userId: string) => {
    await unmuteUser(userId);
    await setParticipantMuted(userId, false);
  }, []);

  const blockParticipant = useCallback(
    async (userId: string) => {
      if (!firebaseUser) return;

      await blockUser(firebaseUser.uid, userId);
      await setParticipantBlocked(userId, true);
    },
    [firebaseUser]
  );

  const reportParticipant = useCallback(
    async (
      userId: string,
      reason: ReportReason,
      details?: string,
      alsoBlock: boolean = false
    ) => {
      if (!firebaseUser || !currentSessionId) {
        throw new Error('Not in a session');
      }

      await reportUserService(
        firebaseUser.uid,
        userId,
        currentSessionId,
        reason,
        details,
        alsoBlock
      );

      if (alsoBlock) {
        await setParticipantBlocked(userId, true);
      }
    },
    [firebaseUser, currentSessionId]
  );

  const value: AudioContextType = {
    // Connection state
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    connectionError,

    // Local audio
    isMicEnabled,
    toggleMic,

    // Participants
    participants,

    // Muting
    muteParticipant,
    unmuteParticipant,

    // Blocking
    blockParticipant,

    // Reporting
    reportParticipant,

    // Room management
    joinRoom,
    leaveRoom,

    // Session info
    currentSessionId,
  };

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
