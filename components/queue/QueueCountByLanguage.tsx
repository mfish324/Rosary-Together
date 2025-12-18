import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../constants';
import { SUPPORTED_LANGUAGES, Language, QueueCounts } from '../../types';

export default function QueueCountByLanguage() {
  // In a real app, this would subscribe to Firebase Realtime Database
  const [queueCounts, setQueueCounts] = useState<QueueCounts>({
    en: 0,
    es: 0,
    pt: 0,
    tl: 0,
  });

  // Placeholder: In production, this would subscribe to presence data
  useEffect(() => {
    // TODO: Subscribe to queue counts from Firebase
    // For now, show placeholder data
    setQueueCounts({
      en: 2,
      es: 1,
      pt: 0,
      tl: 0,
    });
  }, []);

  const languages = Object.entries(SUPPORTED_LANGUAGES) as [Language, typeof SUPPORTED_LANGUAGES[Language]][];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Waiting now:</Text>
      {languages.map(([code, config]) => (
        <View key={code} style={styles.row}>
          <Text style={styles.flag}>{config.flag}</Text>
          <Text style={styles.languageName}>{config.nativeName}:</Text>
          <Text style={styles.count}>
            {queueCounts[code]} {queueCounts[code] === 1 ? 'person' : 'people'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  flag: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  languageName: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  count: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
});
