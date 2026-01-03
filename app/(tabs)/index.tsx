import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS, MYSTERIES_BY_DAY, MYSTERY_NAMES, DAY_NAMES } from '../../constants';
import { SUPPORTED_LANGUAGES, Language } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import LanguageSelector from '../../components/ui/LanguageSelector';
import QueueCountByLanguage from '../../components/queue/QueueCountByLanguage';
import NameEntryModal from '../../components/ui/NameEntryModal';
import { subscribeToStats } from '../../services/stats';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { profile, setProfile, isLoading: isUserLoading } = useUser();

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    user?.preferredLanguage || 'en'
  );
  const [prayingCount, setPrayingCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  // Get today's mysteries
  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayMysteries = MYSTERIES_BY_DAY[dayOfWeek];
  const mysteryName = MYSTERY_NAMES[todayMysteries];
  const dayName = DAY_NAMES[dayOfWeek];

  // Subscribe to global user count
  useEffect(() => {
    const unsubscribe = subscribeToStats((stats) => {
      setTotalUsers(stats.totalUsers);
    });
    return () => unsubscribe();
  }, []);

  const handleReadyToPray = () => {
    // If no profile, show name entry modal first
    if (!profile) {
      setShowNameModal(true);
      return;
    }

    navigateToPray();
  };

  const navigateToPray = () => {
    setIsReady(true);
    router.push({
      pathname: '/pray',
      params: { mode: 'queue', language: selectedLanguage },
    });
  };

  const handleNameSubmit = async (name: string, email?: string) => {
    await setProfile({ displayName: name, email });
    setShowNameModal(false);
    navigateToPray();
  };

  const handleSkipName = async () => {
    // Use "Anonymous" if they skip
    await setProfile({ displayName: 'Anonymous' });
    setShowNameModal(false);
    navigateToPray();
  };

  const handlePrayOffline = () => {
    router.push({
      pathname: '/pray',
      params: { mode: 'offline', language: selectedLanguage },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🌍</Text>
          <Text style={styles.title}>Rosary Together</Text>
          <Text style={styles.tagline}>{t('home.tagline', 'Never pray alone again')}</Text>
        </View>

        {/* Praying Now Counter */}
        <View style={styles.counterCard}>
          <Text style={styles.counterEmoji}>👥</Text>
          <Text style={styles.counterText}>
            {t('home.prayingNow', { count: prayingCount, defaultValue: `${prayingCount} praying now` })}
          </Text>
        </View>

        {/* Language Selector */}
        <View style={styles.languageSection}>
          <Text style={styles.sectionLabel}>{t('home.language', 'Language')}:</Text>
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
          />
        </View>

        {/* Ready to Pray Button */}
        <TouchableOpacity
          style={styles.readyButton}
          onPress={handleReadyToPray}
          activeOpacity={0.8}
        >
          <Text style={styles.readyButtonText}>
            {t('home.readyToPray', "I'm Ready to Pray")}
          </Text>
          <Text style={styles.readyButtonSubtext}>
            {t('home.tapToJoin', 'tap to join queue')}
          </Text>
        </TouchableOpacity>

        {/* Today's Mysteries */}
        <View style={styles.mysteryInfo}>
          <Text style={styles.mysteryEmoji}>☀️</Text>
          <Text style={styles.mysteryText}>
            {t('home.todaysMysteries', {
              mysteries: mysteryName,
              day: dayName,
              defaultValue: `Today: ${mysteryName} (${dayName})`,
            })}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Queue Counts */}
        <QueueCountByLanguage />

        {/* Pray Offline Button */}
        <TouchableOpacity
          style={styles.offlineButton}
          onPress={handlePrayOffline}
          activeOpacity={0.7}
        >
          <Text style={styles.offlineEmoji}>📴</Text>
          <Text style={styles.offlineButtonText}>
            {t('home.prayOffline', 'Pray Offline')}
          </Text>
        </TouchableOpacity>

        {/* About Link */}
        <TouchableOpacity
          style={styles.aboutButton}
          onPress={() => router.push('/about')}
          activeOpacity={0.7}
        >
          <Text style={styles.aboutEmoji}>ℹ️</Text>
          <Text style={styles.aboutButtonText}>About Rosary Together</Text>
        </TouchableOpacity>

        {/* Show current user */}
        {profile && (
          <View style={styles.userInfo}>
            <Text style={styles.userEmoji}>👤</Text>
            <Text style={styles.userInfoText}>
              Praying as {profile.displayName}
            </Text>
            <TouchableOpacity onPress={() => setShowNameModal(true)}>
              <Text style={styles.changeNameText}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer - shown when we have 100+ users */}
        {totalUsers >= 100 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Helping over {Math.floor(totalUsers / 10) * 10} people pray together
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Name Entry Modal */}
      <NameEntryModal
        visible={showNameModal}
        onSubmit={handleNameSubmit}
        onCancel={handleSkipName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  tagline: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  counterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  counterText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text,
    fontWeight: FONTS.weights.medium,
  },
  languageSection: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  readyButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  readyButtonText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  readyButtonSubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  mysteryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  mysteryText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.surface,
    marginVertical: SPACING.lg,
  },
  offlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 12,
    marginTop: SPACING.lg,
  },
  offlineEmoji: {
    fontSize: 20,
  },
  offlineButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  aboutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  aboutEmoji: {
    fontSize: 20,
  },
  aboutButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  userEmoji: {
    fontSize: 16,
  },
  userInfoText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  changeNameText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  headerEmoji: {
    fontSize: 32,
  },
  counterEmoji: {
    fontSize: 24,
  },
  mysteryEmoji: {
    fontSize: 20,
  },
  footer: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    alignItems: 'center',
    width: '100%',
  },
  footerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});
