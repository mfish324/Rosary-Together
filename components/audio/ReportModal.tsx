import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SPACING, FONTS, RADIUS } from '../../constants';
import { AudioParticipant, ReportReason } from '../../types';
import { REPORT_REASON_LABELS } from '../../services/moderation';
import { getCountryFlag } from '../../utils/countries';

interface ReportModalProps {
  visible: boolean;
  participant: AudioParticipant | null;
  onSubmit: (reason: ReportReason, details?: string, alsoBlock?: boolean) => Promise<void>;
  onCancel: () => void;
}

const REPORT_REASONS: ReportReason[] = [
  'inappropriate_audio',
  'harassment',
  'disruptive_behavior',
  'spam',
  'other',
];

export default function ReportModal({
  visible,
  participant,
  onSubmit,
  onCancel,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a reason for your report');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(selectedReason, details || undefined, alsoBlock);
      // Reset form
      setSelectedReason(null);
      setDetails('');
      setAlsoBlock(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedReason(null);
    setDetails('');
    setAlsoBlock(false);
    setError(null);
    onCancel();
  };

  if (!participant) return null;

  const flag = getCountryFlag(participant.country);
  const name = participant.displayName || 'Anonymous';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Report User</Text>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <Text style={styles.closeEmoji}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* User info */}
            <View style={styles.userInfo}>
              <Text style={styles.flag}>{flag}</Text>
              <Text style={styles.userName}>{name}</Text>
            </View>

            {/* Reason selection */}
            <Text style={styles.sectionLabel}>Reason for report</Text>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  selectedReason === reason && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <View style={styles.radioCircle}>
                  {selectedReason === reason && (
                    <View style={styles.radioCircleFilled} />
                  )}
                </View>
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason && styles.reasonTextSelected,
                  ]}
                >
                  {REPORT_REASON_LABELS[reason]}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Details input */}
            <Text style={styles.sectionLabel}>Additional details (optional)</Text>
            <TextInput
              style={styles.detailsInput}
              placeholder="Please describe what happened..."
              placeholderTextColor={COLORS.textMuted}
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Block checkbox */}
            <TouchableOpacity
              style={styles.blockOption}
              onPress={() => setAlsoBlock(!alsoBlock)}
            >
              <View style={[styles.checkbox, alsoBlock && styles.checkboxChecked]}>
                {alsoBlock && (
                  <Text style={styles.checkEmoji}>✓</Text>
                )}
              </View>
              <Text style={styles.blockText}>Also block this user</Text>
            </TouchableOpacity>

            {/* Error message */}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedReason || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.text} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  flag: {
    fontSize: 24,
  },
  userName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  sectionLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reasonOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceLight,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleFilled: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  reasonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  reasonTextSelected: {
    fontWeight: FONTS.weights.medium,
  },
  detailsInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    minHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  blockOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  blockText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  errorText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.error,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.error,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text,
  },
  closeEmoji: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  checkEmoji: {
    fontSize: 14,
    color: COLORS.text,
  },
});
