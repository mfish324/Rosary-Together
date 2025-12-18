import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import {
  createSession,
  joinSession,
  leaveSession,
  completeSession,
  subscribeToSession,
} from '../services/sessions';
import { updateUserStats } from '../services/auth';
import { useAuth } from './AuthContext';
import { usePresence } from './PresenceContext';
import {
  Session,
  Language,
  MysteryType,
  PrayerStep,
  Mystery,
  PrayerContent,
} from '../types';
import { getPrayers } from '../content/prayers';
import { getMysteries } from '../content/mysteries';
import { MYSTERIES_BY_DAY } from '../constants';

interface PrayerContextType {
  // Session state
  session: Session | null;
  isInSession: boolean;
  isLoading: boolean;

  // Prayer state
  prayers: PrayerContent | null;
  mysteries: Mystery[];
  mysteryType: MysteryType;
  currentStepIndex: number;
  prayerSequence: PrayerStep[];
  isComplete: boolean;

  // Actions
  startOfflinePrayer: (language: Language, mysteryType?: MysteryType) => Promise<void>;
  startGroupPrayer: (sessionId: string, language: Language) => Promise<void>;
  nextStep: () => void;
  previousStep: () => void;
  completePrayer: () => Promise<void>;
  exitPrayer: () => Promise<void>;
}

const PrayerContext = createContext<PrayerContextType | undefined>(undefined);

interface PrayerProviderProps {
  children: ReactNode;
}

// Generate the full rosary prayer sequence
function generatePrayerSequence(mysteries: Mystery[]): PrayerStep[] {
  const sequence: PrayerStep[] = [];

  // Opening
  sequence.push({ type: 'sign_of_cross' });
  sequence.push({ type: 'creed' });
  sequence.push({ type: 'our_father' });

  // Opening 3 Hail Marys
  for (let i = 1; i <= 3; i++) {
    sequence.push({ type: 'hail_mary', count: i, total: 3 });
  }
  sequence.push({ type: 'glory_be' });

  // 5 Decades
  for (let decade = 0; decade < 5; decade++) {
    // Mystery announcement
    sequence.push({
      type: 'mystery_announcement',
      mystery: mysteries[decade],
      mysteryNumber: decade + 1,
    });

    // Our Father
    sequence.push({ type: 'our_father' });

    // 10 Hail Marys
    for (let i = 1; i <= 10; i++) {
      sequence.push({ type: 'hail_mary', count: i, total: 10 });
    }

    // Glory Be
    sequence.push({ type: 'glory_be' });

    // Fatima Prayer
    sequence.push({ type: 'fatima_prayer' });
  }

  // Closing
  sequence.push({ type: 'hail_holy_queen' });
  sequence.push({ type: 'final_prayer' });
  sequence.push({ type: 'sign_of_cross' });

  return sequence;
}

export function PrayerProvider({ children }: PrayerProviderProps) {
  const { firebaseUser, refreshUser } = useAuth();
  const { startPraying, stopPraying } = usePresence();

  // Session state
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Prayer content
  const [prayers, setPrayers] = useState<PrayerContent | null>(null);
  const [mysteries, setMysteries] = useState<Mystery[]>([]);
  const [mysteryType, setMysteryType] = useState<MysteryType>('joyful');
  const [prayerSequence, setPrayerSequence] = useState<PrayerStep[]>([]);

  // Prayer progress
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const isInSession = session !== null || prayerSequence.length > 0;

  // Subscribe to session updates
  useEffect(() => {
    if (!session) return;

    const unsubscribe = subscribeToSession(session.id, (updatedSession) => {
      if (updatedSession) {
        setSession(updatedSession);
      }
    });

    return () => unsubscribe();
  }, [session?.id]);

  // Load prayer content
  const loadPrayerContent = useCallback(
    async (language: Language, mystery: MysteryType) => {
      setIsLoading(true);
      try {
        const [prayerContent, mysteryContent] = await Promise.all([
          getPrayers(language),
          getMysteries(mystery, language),
        ]);

        setPrayers(prayerContent);
        setMysteries(mysteryContent.mysteries);
        setMysteryType(mystery);
        setPrayerSequence(generatePrayerSequence(mysteryContent.mysteries));
        setCurrentStepIndex(0);
        setIsComplete(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Start offline prayer (solo)
  const startOfflinePrayer = useCallback(
    async (language: Language, mystery?: MysteryType) => {
      const dayOfWeek = new Date().getDay();
      const todayMystery = mystery || MYSTERIES_BY_DAY[dayOfWeek];

      await loadPrayerContent(language, todayMystery);
    },
    [loadPrayerContent]
  );

  // Start group prayer (from queue/session)
  const startGroupPrayer = useCallback(
    async (sessionId: string, language: Language) => {
      setIsLoading(true);
      try {
        if (firebaseUser) {
          await joinSession(sessionId, firebaseUser.uid);
          await startPraying(sessionId);
        }

        const dayOfWeek = new Date().getDay();
        const todayMystery = MYSTERIES_BY_DAY[dayOfWeek];

        await loadPrayerContent(language, todayMystery);

        // Session info will be populated by subscription
        setSession({
          id: sessionId,
          startedAt: new Date(),
          mysteries: todayMystery,
          language,
          participants: firebaseUser ? [firebaseUser.uid] : [],
          participantCount: 1,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [firebaseUser, loadPrayerContent, startPraying]
  );

  // Navigate to next step
  const nextStep = useCallback(() => {
    if (currentStepIndex < prayerSequence.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsComplete(true);
    }
  }, [currentStepIndex, prayerSequence.length]);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  // Complete prayer and update stats
  const completePrayer = useCallback(async () => {
    if (!firebaseUser) return;

    // Update user stats
    await updateUserStats(firebaseUser.uid);

    // Complete session if in group
    if (session) {
      await completeSession(session.id, firebaseUser.uid);
    }

    await stopPraying();
    await refreshUser();
  }, [firebaseUser, session, stopPraying, refreshUser]);

  // Exit prayer without completing
  const exitPrayer = useCallback(async () => {
    if (session && firebaseUser) {
      await leaveSession(session.id, firebaseUser.uid);
    }

    await stopPraying();

    // Reset state
    setSession(null);
    setPrayers(null);
    setMysteries([]);
    setPrayerSequence([]);
    setCurrentStepIndex(0);
    setIsComplete(false);
  }, [session, firebaseUser, stopPraying]);

  const value: PrayerContextType = {
    session,
    isInSession,
    isLoading,

    prayers,
    mysteries,
    mysteryType,
    currentStepIndex,
    prayerSequence,
    isComplete,

    startOfflinePrayer,
    startGroupPrayer,
    nextStep,
    previousStep,
    completePrayer,
    exitPrayer,
  };

  return (
    <PrayerContext.Provider value={value}>{children}</PrayerContext.Provider>
  );
}

export function usePrayer() {
  const context = useContext(PrayerContext);
  if (context === undefined) {
    throw new Error('usePrayer must be used within a PrayerProvider');
  }
  return context;
}
