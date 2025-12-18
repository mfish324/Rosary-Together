import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants';
import { Mystery, MysteryType } from '../../types';

interface MysteryCardProps {
  mystery: Mystery;
  mysteryNumber: number;
  mysteryType: MysteryType;
}

const MYSTERY_TYPE_LABELS: Record<MysteryType, string> = {
  joyful: 'Joyful',
  sorrowful: 'Sorrowful',
  glorious: 'Glorious',
  luminous: 'Luminous',
};

const MYSTERY_ICONS: Record<MysteryType, keyof typeof Ionicons.glyphMap> = {
  joyful: 'happy',
  sorrowful: 'heart-dislike',
  glorious: 'sunny',
  luminous: 'flash',
};

export default function MysteryCard({
  mystery,
  mysteryNumber,
  mysteryType,
}: MysteryCardProps) {
  const typeLabel = MYSTERY_TYPE_LABELS[mysteryType];
  const icon = MYSTERY_ICONS[mysteryType];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={32} color={COLORS.gold} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.mysteryNumber}>
            {mysteryNumber}{getOrdinalSuffix(mysteryNumber)} {typeLabel} Mystery
          </Text>
          <Text style={styles.title}>{mystery.title}</Text>
        </View>
      </View>
    </View>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  mysteryNumber: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gold,
    fontWeight: FONTS.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
});
