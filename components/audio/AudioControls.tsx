import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants';

interface AudioControlsProps {
  isMicEnabled: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  participantCount: number;
  onMicToggle: () => void;
}

export default function AudioControls({
  isMicEnabled,
  isConnected,
  isConnecting,
  participantCount,
  onMicToggle,
}: AudioControlsProps) {
  return (
    <View style={styles.container}>
      {/* Connection status */}
      <View style={styles.statusContainer}>
        {isConnecting ? (
          <>
            <ActivityIndicator size="small" color={COLORS.gold} />
            <Text style={styles.statusText}>Connecting...</Text>
          </>
        ) : isConnected ? (
          <>
            <View style={styles.connectedDot} />
            <Text style={styles.statusText}>
              {participantCount} {participantCount === 1 ? 'person' : 'people'} praying
            </Text>
          </>
        ) : (
          <>
            <View style={styles.disconnectedDot} />
            <Text style={styles.statusText}>Offline</Text>
          </>
        )}
      </View>

      {/* Mic toggle button */}
      <TouchableOpacity
        style={[
          styles.micButton,
          isMicEnabled ? styles.micButtonOn : styles.micButtonOff,
        ]}
        onPress={onMicToggle}
        disabled={!isConnected}
      >
        <Text style={styles.micEmoji}>{isMicEnabled ? '🎙️' : '🔇'}</Text>
        <Text
          style={[
            styles.micButtonText,
            isMicEnabled ? styles.micButtonTextOn : styles.micButtonTextOff,
          ]}
        >
          {isMicEnabled ? 'Mic On' : 'Mic Off'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  disconnectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  statusText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  micButtonOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  micButtonOff: {
    backgroundColor: COLORS.backgroundLight,
    borderColor: COLORS.surfaceLight,
  },
  micButtonText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
  },
  micButtonTextOn: {
    color: COLORS.text,
  },
  micButtonTextOff: {
    color: COLORS.textMuted,
  },
  micEmoji: {
    fontSize: 20,
  },
});
