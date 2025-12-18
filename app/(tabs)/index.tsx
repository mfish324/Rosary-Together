import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS, MYSTERIES_BY_DAY, MYSTERY_NAMES, DAY_NAMES } from '../../constants';
import { SUPPORTED_LANGUAGES, Language } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from '../../components/ui/LanguageSelector';
import QueueCountByLanguage from '../../components/queue/QueueCountByLanguage';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    user?.preferredLanguage || 'en'
  );
  const [prayingCount, setPrayingCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Get today's mysteries
  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayMysteries = MYSTERIES_BY_DAY[dayOfWeek];
  const mysteryName = MYSTERY_NAMES[todayMysteries];
  const dayName = DAY_NAMES[dayOfWeek];

  const handleReadyToPray = () => {
    setIsReady(true);
    // Navigate to pray screen with queue mode
    router.push({
      pathname: '/pray',
      params: { mode: 'queue', language: selectedLanguage },
    });
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
          <Ionicons name="globe-outline" size={32} color={COLORS.gold} />
          <Text style={styles.title}>Rosary Together</Text>
          <Text style={styles.tagline}>{t('home.tagline', 'Never pray alone again')}</Text>
        </View>

        {/* Praying Now Counter */}
        <View style={styles.counterCard}>
          <Ionicons name="people" size={24} color={COLORS.gold} />
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
          <Ionicons name="sunny" size={20} color={COLORS.gold} />
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
          <Ionicons name="cloud-offline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.offlineButtonText}>
            {t('home.prayOffline', 'Pray Offline')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  offlineButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
});
