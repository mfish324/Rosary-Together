import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS, MYSTERIES_BY_DAY, HAIL_MARYS_PER_DECADE } from '../../constants';
import { Language, Mystery, MysteryType, PrayerStep, AudioParticipant, ReportReason } from '../../types';
import BeadCounter from '../../components/prayer/BeadCounter';
import MysteryCard from '../../components/prayer/MysteryCard';
import PrayerProgress from '../../components/prayer/PrayerProgress';
import AudioControls from '../../components/audio/AudioControls';
import ParticipantAudio from '../../components/audio/ParticipantAudio';
import ReportModal from '../../components/audio/ReportModal';
import { getPrayers } from '../../content/prayers';
import { getMysteries } from '../../content/mysteries';
import { useAudio } from '../../hooks/useAudio';
import { useAuth } from '../../contexts/AuthContext';

// Full rosary prayer sequence
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

export default function PrayScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode: string; language: string; sessionId?: string; roomId?: string }>();
  const { firebaseUser } = useAuth();

  const language = (params.language as Language) || 'en';
  const mode = params.mode || 'offline'; // 'offline', 'queue', or 'room'

  // Create a stable sessionId based on language and date (so all users in same language join same room)
  const sessionId = useMemo(() => {
    if (params.sessionId) return params.sessionId;
    if (mode === 'room' && params.roomId) return params.roomId;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `rosary-${language}-${today}`;
  }, [params.sessionId, params.roomId, mode, language]);

  // Audio context
  const {
    isConnected,
    isConnecting,
    connectionError,
    isMicEnabled,
    toggleMic,
    participants,
    muteParticipant,
    unmuteParticipant,
    blockParticipant,
    reportParticipant,
    joinRoom,
    leaveRoom,
  } = useAudio();

  // Get today's mysteries
  const today = new Date();
  const mysteryType = MYSTERIES_BY_DAY[today.getDay()];

  const [prayers, setPrayers] = useState<any>(null);
  const [mysteriesData, setMysteriesData] = useState<Mystery[]>([]);
  const [prayerSequence, setPrayerSequence] = useState<PrayerStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Report modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<AudioParticipant | null>(null);

  // Calculate participant count (self + others)
  const participantCount = (mode === 'queue' || mode === 'room') ? participants.length + 1 : 1;

  // Load prayers and mysteries
  useEffect(() => {
    const loadContent = async () => {
      const prayerContent = await getPrayers(language);
      const mysteryContent = await getMysteries(mysteryType, language);

      setPrayers(prayerContent);
      setMysteriesData(mysteryContent.mysteries);
      setPrayerSequence(generatePrayerSequence(mysteryContent.mysteries));
    };

    loadContent();
  }, [language, mysteryType]);

  // Join/leave audio room for queue mode
  useEffect(() => {
    if ((mode === 'queue' || mode === 'room') && sessionId) {
      joinRoom(sessionId);
    }

    return () => {
      if (mode === 'queue' || mode === 'room') {
        leaveRoom();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sessionId]); // joinRoom/leaveRoom are stable callbacks

  // Report modal handlers
  const handleOpenReportModal = useCallback((participant: AudioParticipant) => {
    setSelectedParticipant(participant);
    setReportModalVisible(true);
  }, []);

  const handleCloseReportModal = useCallback(() => {
    setReportModalVisible(false);
    setSelectedParticipant(null);
  }, []);

  const handleSubmitReport = useCallback(
    async (reason: ReportReason, details?: string, alsoBlock?: boolean) => {
      if (!selectedParticipant) return;
      await reportParticipant(selectedParticipant.userId, reason, details, alsoBlock);
      handleCloseReportModal();
    },
    [selectedParticipant, reportParticipant]
  );

  const currentStep = prayerSequence[currentStepIndex];

  // Calculate current decade (0-4, or -1 for opening/closing)
  const getCurrentDecade = (): number => {
    if (!currentStep) return -1;
    if (currentStep.type === 'mystery_announcement') {
      return currentStep.mysteryNumber - 1;
    }
    // Count mystery announcements before current step
    let decadeCount = -1;
    for (let i = 0; i <= currentStepIndex; i++) {
      if (prayerSequence[i]?.type === 'mystery_announcement') {
        decadeCount++;
      }
    }
    return decadeCount;
  };

  const handleNextPrayer = () => {
    if (currentStepIndex < prayerSequence.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handlePreviousPrayer = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const getPrayerTitle = (): string => {
    if (!currentStep || !prayers) return '';

    switch (currentStep.type) {
      case 'sign_of_cross':
        return prayers.signOfTheCross?.title || 'Sign of the Cross';
      case 'creed':
        return prayers.apostlesCreed?.title || "Apostles' Creed";
      case 'our_father':
        return prayers.ourFather?.title || 'Our Father';
      case 'hail_mary':
        return prayers.hailMary?.title || 'Hail Mary';
      case 'glory_be':
        return prayers.gloryBe?.title || 'Glory Be';
      case 'fatima_prayer':
        return prayers.fatimaPrayer?.title || 'Fatima Prayer';
      case 'hail_holy_queen':
        return prayers.hailHolyQueen?.title || 'Hail Holy Queen';
      case 'final_prayer':
        return prayers.finalPrayer?.title || 'Final Prayer';
      case 'mystery_announcement':
        return currentStep.mystery.title;
      default:
        return '';
    }
  };

  const getPrayerText = (): string => {
    if (!currentStep || !prayers) return '';

    switch (currentStep.type) {
      case 'sign_of_cross':
        return prayers.signOfTheCross?.text || '';
      case 'creed':
        return prayers.apostlesCreed?.text || '';
      case 'our_father':
        return prayers.ourFather?.text || '';
      case 'hail_mary':
        return prayers.hailMary?.text || '';
      case 'glory_be':
        return prayers.gloryBe?.text || '';
      case 'fatima_prayer':
        return prayers.fatimaPrayer?.text || '';
      case 'hail_holy_queen':
        return prayers.hailHolyQueen?.text || '';
      case 'final_prayer':
        return prayers.finalPrayer?.text || '';
      case 'mystery_announcement':
        return '';
      default:
        return '';
    }
  };

  const currentDecade = getCurrentDecade();
  const currentMystery = currentDecade >= 0 && currentDecade < mysteriesData.length
    ? mysteriesData[currentDecade]
    : null;

  // Completion screen
  if (isComplete) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionEmoji}>✨</Text>
          <Text style={styles.completionTitle}>Amen</Text>
          <Text style={styles.completionText}>
            You prayed the {mysteriesData.length > 0 ? 'rosary' : 'prayers'}
            {participantCount > 1 ? ` with ${participantCount} people worldwide` : ''}
          </Text>

          <View style={styles.statsCard}>
            <Text style={styles.statText}>🔥 Your streak: 1 day</Text>
            <Text style={styles.statText}>📿 Total rosaries: 1</Text>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.prayAgainButton}
            onPress={() => {
              setCurrentStepIndex(0);
              setIsComplete(false);
            }}
          >
            <Text style={styles.prayAgainButtonText}>Pray Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!prayers || prayerSequence.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading prayers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Mystery Display */}
        {currentMystery && (
          <MysteryCard
            mystery={currentMystery}
            mysteryNumber={currentDecade + 1}
            mysteryType={mysteryType}
          />
        )}

        {/* Current Prayer */}
        <View style={styles.prayerSection}>
          <Text style={styles.prayerTitle}>{getPrayerTitle()}</Text>

          {currentStep?.type === 'mystery_announcement' ? (
            <View style={styles.mysteryAnnouncementContent}>
              <Text style={styles.scriptureText}>
                "{currentStep.mystery.scripture}"
              </Text>
              <Text style={styles.referenceText}>
                — {currentStep.mystery.reference}
              </Text>
              <Text style={styles.fruitText}>
                Fruit: {currentStep.mystery.fruit}
              </Text>
            </View>
          ) : (
            <Text style={styles.prayerText}>{getPrayerText()}</Text>
          )}
        </View>

        {/* Bead Counter for Hail Marys */}
        {currentStep?.type === 'hail_mary' && (
          <BeadCounter
            current={currentStep.count}
            total={currentStep.total}
          />
        )}

        {/* Progress */}
        <PrayerProgress
          currentStep={currentStepIndex}
          totalSteps={prayerSequence.length}
          currentDecade={currentDecade}
        />

        {/* Participant List for Queue Mode */}
        {(mode === 'queue' || mode === 'room') && (
          <View style={styles.participantsSection}>
            <View style={styles.participantHeader}>
              <Text style={styles.participantHeaderEmoji}>👥</Text>
              <Text style={styles.participantHeaderText}>
                Praying together ({participantCount})
              </Text>
            </View>
            {/* Current user */}
            <View style={styles.currentUserRow}>
              <Text style={styles.currentUserFlag}>
                {firebaseUser ? '🙏' : '👤'}
              </Text>
              <Text style={styles.currentUserName}>You</Text>
              <View style={styles.micIndicator}>
                <Text style={styles.micEmoji}>{isMicEnabled ? '🎙️' : '🔇'}</Text>
              </View>
            </View>

            {/* Other participants */}
            {participants.map((participant) => (
              <ParticipantAudio
                key={participant.userId}
                participant={participant}
                isCurrentUser={false}
                onMute={() => muteParticipant(participant.userId)}
                onUnmute={() => unmuteParticipant(participant.userId)}
                onReport={() => handleOpenReportModal(participant)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Audio Controls for Queue Mode */}
        {(mode === 'queue' || mode === 'room') && (
          <AudioControls
            isMicEnabled={isMicEnabled}
            isConnected={isConnected}
            isConnecting={isConnecting}
            participantCount={participantCount}
            onMicToggle={toggleMic}
          />
        )}

        {/* Navigation Buttons */}
        <View style={styles.navigationRow}>
          <TouchableOpacity
            style={[styles.navButton, currentStepIndex === 0 && styles.navButtonDisabled]}
            onPress={handlePreviousPrayer}
            disabled={currentStepIndex === 0}
          >
            <Text style={[styles.navEmoji, currentStepIndex === 0 && styles.navEmojiDisabled]}>◀️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextPrayer}
          >
            <Text style={styles.nextButtonText}>
              {currentStepIndex === prayerSequence.length - 1 ? 'Finish' : 'Next Prayer'}
            </Text>
            <Text style={styles.nextEmoji}>✓</Text>
          </TouchableOpacity>

          <View style={styles.navButtonPlaceholder} />
        </View>
      </View>

      {/* Report Modal */}
      <ReportModal
        visible={reportModalVisible}
        participant={selectedParticipant}
        onSubmit={handleSubmitReport}
        onCancel={handleCloseReportModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 160, // Extra padding for AudioControls + navigation
  },
  prayerSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  prayerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.gold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  prayerText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text,
    lineHeight: 28,
    textAlign: 'center',
  },
  mysteryAnnouncementContent: {
    alignItems: 'center',
  },
  scriptureText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  referenceText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  fruitText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.gold,
    fontWeight: FONTS.weights.medium,
  },
  participantsSection: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    padding: SPACING.md,
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  participantHeaderEmoji: {
    fontSize: 16,
  },
  participantHeaderText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.gold,
  },
  micEmoji: {
    fontSize: 14,
  },
  navEmoji: {
    fontSize: 20,
  },
  navEmojiDisabled: {
    opacity: 0.5,
  },
  nextEmoji: {
    fontSize: 18,
    color: COLORS.text,
  },
  debugText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  currentUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  currentUserFlag: {
    fontSize: 20,
  },
  currentUserName: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    fontWeight: FONTS.weights.medium,
  },
  micIndicator: {
    padding: SPACING.xs,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonPlaceholder: {
    width: 44,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 25,
    gap: SPACING.sm,
  },
  nextButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  completionEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  completionTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.gold,
    marginBottom: SPACING.md,
  },
  completionText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.xl,
    width: '100%',
  },
  statText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: 25,
    marginBottom: SPACING.md,
  },
  doneButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text,
  },
  prayAgainButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  prayAgainButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
});
