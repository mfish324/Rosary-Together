import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../constants';

interface BeadCounterProps {
  current: number;
  total: number;
}

export default function BeadCounter({ current, total }: BeadCounterProps) {
  const beads = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <View style={styles.beadsRow}>
        {beads.map((bead) => (
          <View
            key={bead}
            style={[
              styles.bead,
              bead < current && styles.beadComplete,
              bead === current && styles.beadActive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.countText}>
        {current}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  beadsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  bead: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.beadInactive,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  beadActive: {
    backgroundColor: COLORS.beadActive,
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  beadComplete: {
    backgroundColor: COLORS.beadComplete,
    borderColor: COLORS.beadComplete,
  },
  countText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
});
