import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const totalRosaries = user?.totalRosaries || 0;
  const currentStreak = user?.currentStreak || 0;
  const longestStreak = user?.longestStreak || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📿</Text>
            <Text style={styles.statValue}>{totalRosaries}</Text>
            <Text style={styles.statLabel}>Total Rosaries</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
        </View>

        {/* Calendar Placeholder */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>Prayer Calendar</Text>
          <View style={styles.calendarPlaceholder}>
            <Text style={styles.placeholderEmoji}>📅</Text>
            <Text style={styles.placeholderText}>
              Your prayer history will appear here
            </Text>
          </View>
        </View>

        {/* Recent Sessions */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {totalRosaries === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>❤️</Text>
              <Text style={styles.emptyStateText}>
                No prayers yet. Start your first rosary!
              </Text>
            </View>
          ) : (
            <View style={styles.sessionsList}>
              {/* Session items would go here */}
              <Text style={styles.comingSoonText}>
                Session history coming soon
              </Text>
            </View>
          )}
        </View>
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
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.gold,
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  calendarSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  calendarPlaceholder: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  recentSection: {
    marginBottom: SPACING.xl,
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  sessionsList: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  comingSoonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  emptyEmoji: {
    fontSize: 48,
  },
});
