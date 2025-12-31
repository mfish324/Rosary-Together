import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS } from '../../constants';
import { PrayerGroup, Language, SUPPORTED_LANGUAGES, GroupInvitation } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  getUserGroups,
  createGroup,
  getInvitationByCode,
  acceptInvitation,
  createInvitation,
  leaveGroup,
} from '../../services/groups';
import LanguageSelector from '../../components/ui/LanguageSelector';

interface GroupCardProps {
  group: PrayerGroup;
  onPress: () => void;
}

function GroupCard({ group, onPress }: GroupCardProps) {
  const langConfig = SUPPORTED_LANGUAGES[group.defaultLanguage];

  return (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.groupIcon}>
        <Text style={styles.groupIconText}>
          {group.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupMeta}>
          {langConfig.flag} {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
        </Text>
      </View>
      <Text style={styles.arrowIcon}>→</Text>
    </TouchableOpacity>
  );
}

export default function GroupsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [groups, setGroups] = useState<PrayerGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Create group form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupLanguage, setNewGroupLanguage] = useState<Language>('en');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Join group form
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const userGroups = await getUserGroups(user.id);
      setGroups(userGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  const handleCreateGroup = async () => {
    if (!user?.id || !newGroupName.trim()) return;

    setIsCreating(true);
    try {
      const group = await createGroup(
        newGroupName.trim(),
        user.id,
        newGroupLanguage,
        newGroupDescription.trim() || undefined
      );
      setGroups((prev) => [...prev, group]);
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      Alert.alert('Success', 'Prayer group created!');
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user?.id || !inviteCode.trim()) return;

    setIsJoining(true);
    try {
      const invitation = await getInvitationByCode(inviteCode.trim());

      if (!invitation) {
        Alert.alert('Invalid Code', 'This invite code is invalid or has expired.');
        setIsJoining(false);
        return;
      }

      const result = await acceptInvitation(invitation.id, user.id);

      if (result.success && result.groupId) {
        await loadGroups();
        setShowJoinModal(false);
        setInviteCode('');
        Alert.alert('Success', `You have joined ${invitation.groupName}!`, [
          {
            text: 'View Group',
            onPress: () => {
              router.push({
                pathname: '/group/[id]',
                params: { id: result.groupId },
              });
            },
          },
        ]);
      } else if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to join group.');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleGroupPress = (group: PrayerGroup) => {
    router.push({
      pathname: '/group/[id]',
      params: { id: group.id },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.title}>{t('groups.title', 'Prayer Groups')}</Text>
          <Text style={styles.subtitle}>
            {t('groups.subtitle', 'Pray together with friends and family')}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>✨</Text>
            <Text style={styles.actionText}>Create Group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => setShowJoinModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>🔗</Text>
            <Text style={styles.actionText}>Join with Code</Text>
          </TouchableOpacity>
        </View>

        {/* Groups List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('groups.myGroups', 'My Groups')}
          </Text>

          {groups.length > 0 ? (
            <View style={styles.groupsList}>
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onPress={() => handleGroupPress(group)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🙏</Text>
              <Text style={styles.emptyText}>
                {t('groups.noGroups', "You're not in any groups yet")}
              </Text>
              <Text style={styles.emptySubtext}>
                Create a new group or join one with an invite code
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Prayer Group</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Group Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Family Rosary"
                placeholderTextColor={COLORS.textMuted}
                value={newGroupName}
                onChangeText={setNewGroupName}
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Default Language</Text>
              <LanguageSelector
                selectedLanguage={newGroupLanguage}
                onSelectLanguage={setNewGroupLanguage}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="What is this group about?"
                placeholderTextColor={COLORS.textMuted}
                value={newGroupDescription}
                onChangeText={setNewGroupDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!newGroupName.trim() || isCreating) && styles.disabledButton,
                ]}
                onPress={handleCreateGroup}
                disabled={!newGroupName.trim() || isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={COLORS.text} />
                ) : (
                  <Text style={styles.submitButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join a Group</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Invite Code</Text>
              <TextInput
                style={[styles.textInput, styles.codeInput]}
                placeholder="ABCD1234"
                placeholderTextColor={COLORS.textMuted}
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                maxLength={8}
                autoCapitalize="characters"
              />
              <Text style={styles.inputHint}>
                Ask your group admin for an invite code
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!inviteCode.trim() || isJoining) && styles.disabledButton,
                ]}
                onPress={handleJoinGroup}
                disabled={!inviteCode.trim() || isJoining}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color={COLORS.text} />
                ) : (
                  <Text style={styles.submitButtonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
  },
  actionButtonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  groupsList: {
    gap: SPACING.md,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  groupIconText: {
    fontSize: 20,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  groupMeta: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 4,
  },
  inputHint: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  cancelButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  submitButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
