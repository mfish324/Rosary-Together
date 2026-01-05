import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants';
import { getMysteryImageUrl } from '../../constants/mysteryImages';
import { Mystery, MysteryType } from '../../types';

interface MysteryCardProps {
  mystery: Mystery;
  mysteryNumber: number;
  mysteryType: MysteryType;
  showLargeImage?: boolean;
}

const MYSTERY_TYPE_LABELS: Record<MysteryType, string> = {
  joyful: 'Joyful',
  sorrowful: 'Sorrowful',
  glorious: 'Glorious',
  luminous: 'Luminous',
};

export default function MysteryCard({
  mystery,
  mysteryNumber,
  mysteryType,
  showLargeImage = false,
}: MysteryCardProps) {
  const typeLabel = MYSTERY_TYPE_LABELS[mysteryType];
  const imageUrl = getMysteryImageUrl(mysteryType, mysteryNumber);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <View style={styles.container}>
      {/* Large image at top when showLargeImage is true */}
      {showLargeImage && (
        <View style={styles.largeImageContainer}>
          {imageLoading && !imageError && (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="large" color={COLORS.gold} />
            </View>
          )}
          {!imageError ? (
            <Image
              source={{ uri: imageUrl }}
              style={[styles.largeImage, imageLoading && styles.hidden]}
              resizeMode="cover"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>🙏</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.header}>
        {/* Thumbnail image */}
        {!showLargeImage && (
          <View style={styles.thumbnailContainer}>
            {!imageError ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <Text style={styles.fallbackEmoji}>🙏</Text>
            )}
          </View>
        )}
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
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  largeImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.backgroundLight,
  },
  largeImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  placeholderText: {
    fontSize: 48,
  },
  hidden: {
    opacity: 0,
    position: 'absolute',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  thumbnailContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  fallbackEmoji: {
    fontSize: 28,
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
