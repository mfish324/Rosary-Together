import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants';
import { AudioParticipant } from '../../types';
import { getCountryFlag } from '../../utils/countries';

interface ParticipantAudioProps {
  participant: AudioParticipant;
  isCurrentUser?: boolean;
  onMute: () => void;
  onUnmute: () => void;
  onReport: () => void;
}

export default function ParticipantAudio({
  participant,
  isCurrentUser = false,
  onMute,
  onUnmute,
  onReport,
}: ParticipantAudioProps) {
  const { displayName, country, isSpeaking, isMicEnabled, isMutedByMe, isBlocked } =
    participant;

  const flag = getCountryFlag(country);
  const name = displayName || 'Anonymous';

  return (
    <View style={[styles.container, isBlocked && styles.containerBlocked]}>
      {/* Flag and name */}
      <View style={styles.nameContainer}>
        <Text style={styles.flag}>{flag}</Text>
        <View style={styles.nameWrapper}>
          <Text
            style={[styles.name, isBlocked && styles.nameBlocked]}
            numberOfLines={1}
          >
            {isCurrentUser ? 'You' : name}
          </Text>
          {isBlocked && (
            <Text style={styles.blockedLabel}>Blocked</Text>
          )}
        </View>
      </View>

      {/* Status indicators and controls */}
      <View style={styles.controls}>
        {/* Speaking indicator */}
        {!isCurrentUser && isMicEnabled && isSpeaking && !isMutedByMe && !isBlocked && (
          <View style={styles.speakingIndicator}>
            <Text style={styles.volumeEmoji}>🔊</Text>
          </View>
        )}

        {/* Mic status indicator for current user */}
        {isCurrentUser && (
          <View style={styles.micStatus}>
            <Text style={[styles.micEmoji, !isMicEnabled && styles.micEmojiOff]}>
              {isMicEnabled ? '🎙️' : '🔇'}
            </Text>
          </View>
        )}

        {/* Mute/unmute button (only for other participants) */}
        {!isCurrentUser && !isBlocked && (
          <TouchableOpacity
            style={[styles.controlButton, isMutedByMe && styles.controlButtonActive]}
            onPress={isMutedByMe ? onUnmute : onMute}
          >
            <Text style={styles.muteEmoji}>{isMutedByMe ? '🔇' : '🔉'}</Text>
          </TouchableOpacity>
        )}

        {/* Report button (only for other participants) */}
        {!isCurrentUser && (
          <TouchableOpacity style={styles.controlButton} onPress={onReport}>
            <Text style={styles.reportEmoji}>🚩</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  containerBlocked: {
    opacity: 0.5,
    backgroundColor: COLORS.backgroundLight,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  flag: {
    fontSize: 20,
  },
  nameWrapper: {
    flex: 1,
  },
  name: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    fontWeight: FONTS.weights.medium,
  },
  nameBlocked: {
    color: COLORS.textMuted,
  },
  blockedLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  speakingIndicator: {
    padding: SPACING.xs,
  },
  micStatus: {
    padding: SPACING.xs,
  },
  controlButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundLight,
  },
  controlButtonActive: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  volumeEmoji: {
    fontSize: 14,
  },
  micEmoji: {
    fontSize: 14,
  },
  micEmojiOff: {
    opacity: 0.5,
  },
  muteEmoji: {
    fontSize: 16,
  },
  reportEmoji: {
    fontSize: 16,
  },
});
