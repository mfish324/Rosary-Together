import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS, DECADES_PER_ROSARY } from '../../constants';

interface PrayerProgressProps {
  currentStep: number;
  totalSteps: number;
  currentDecade: number; // -1 for opening/closing, 0-4 for decades
}

export default function PrayerProgress({
  currentStep,
  totalSteps,
  currentDecade,
}: PrayerProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const decades = Array.from({ length: DECADES_PER_ROSARY }, (_, i) => i);

  return (
    <View style={styles.container}>
      {/* Decade indicators */}
      <View style={styles.decadesRow}>
        {decades.map((decade) => (
          <View
            key={decade}
            style={[
              styles.decadeIndicator,
              decade < currentDecade && styles.decadeComplete,
              decade === currentDecade && styles.decadeActive,
            ]}
          >
            <Text
              style={[
                styles.decadeText,
                (decade <= currentDecade) && styles.decadeTextActive,
              ]}
            >
              {decade + 1}
            </Text>
          </View>
        ))}
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Step counter */}
      <Text style={styles.stepText}>
        {currentStep + 1} / {totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  decadesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  decadeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  decadeActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  decadeComplete: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  decadeText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textMuted,
  },
  decadeTextActive: {
    color: COLORS.text,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 2,
  },
  stepText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
});
