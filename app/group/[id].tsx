import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Share,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS } from '../../constants';
import {
  PrayerGroup,
  GroupMember,
  GroupInvitation,
  GroupRole,
  SUPPORTED_LANGUAGES,
  Room,
} from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  getGroup,
  getGroupMembers,
  getUserRole,
  createInvitation,
  leaveGroup,
  removeMember,
  updateMemberRole,
} from '../../services/groups';
import { getGroupRooms, createPrivateRoom } from '../../services/rooms';

interface MemberCardProps {
  member: GroupMember;
  isCurrentUser: boolean;
  currentUserRole: GroupRole | null;
  onRemove: () => void;
  onUpdateRole: (role: GroupRole) => void;
}

function MemberCard({
  member,
  isCurrentUser,
  currentUserRole,
  onRemove,
  onUpdateRole,
}: MemberCardProps) {
  const canManage =
    currentUserRole === 'owner' ||
    (currentUserRole === 'admin' && member.role === 'member');
  const canRemove = canManage && !isCurrentUser && member.role !== 'owner';

  const getRoleBadge = (role: GroupRole) => {
    switch (role) {
      case 'owner':
        return { text: 'Owner', color: COLORS.gold };
      case 'admin':
        return { text: 'Admin', color: COLORS.primary };
      default:
        return { text: 'Member', color: COLORS.textMuted };
    }
  };

  const badge = getRoleBadge(member.role);

  return (
    <View style={styles.memberCard}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {(member.displayName || 'U').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {member.displayName || 'Unknown User'}
          {isCurrentUser && ' (You)'}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: badge.color + '20' }]}>
          <Text style={[styles.roleBadgeText, { color: badge.color }]}>
            {badge.text}
          </Text>
        </View>
      </View>
      {canRemove && (
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function GroupDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [group, setGroup] = useState<PrayerGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<GroupRole | null>(null);
  const [invitation, setInvitation] = useState<GroupInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  const loadGroupData = useCallback(async () => {
    if (!id || !user?.id) return;

    try {
      const [groupData, membersData, roomsData, role] = await Promise.all([
        getGroup(id),
        getGroupMembers(id),
        getGroupRooms(id),
        getUserRole(id, user.id),
      ]);

      setGroup(groupData);
      setMembers(membersData);
      setRooms(roomsData);
      setCurrentUserRole(role);
    } catch (error) {
      console.error('Error loading group:', error);
      Alert.alert('Error', 'Failed to load group details.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadGroupData();
  };

  const handleCreateInvite = async () => {
    if (!group || !user?.id) return;

    setIsCreatingInvite(true);
    try {
      const invite = await createInvitation(group.id, group.name, user.id);
      setInvitation(invite);
    } catch (error) {
      console.error('Error creating invitation:', error);
      Alert.alert('Error', 'Failed to create invitation.');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleCopyCode = () => {
    if (invitation) {
      Clipboard.setString(invitation.code);
      Alert.alert('Copied!', 'Invite code copied to clipboard.');
    }
  };

  const handleShareInvite = async () => {
    if (!invitation || !group) return;

    try {
      await Share.share({
        message: `Join my prayer group "${group.name}" on Rosary Together!\n\nUse invite code: ${invitation.code}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id || !user?.id) return;

    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember(id, memberId, user.id);
              setMembers((prev) => prev.filter((m) => m.userId !== memberId));
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove member.');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    if (!id || !user?.id) return;

    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup(id, user.id);
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to leave group.');
            }
          },
        },
      ]
    );
  };

  const handleCreateRoom = async () => {
    if (!group || !user?.id) return;

    try {
      const room = await createPrivateRoom(
        group.id,
        `${group.name} Room`,
        group.defaultLanguage,
        user.id
      );
      setRooms((prev) => [...prev, room]);
      Alert.alert('Success', 'Prayer room created!');
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create room.');
    }
  };

  const handleJoinRoom = (room: Room) => {
    router.push({
      pathname: '/pray',
      params: { mode: 'room', roomId: room.id, language: room.language },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading group...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>Group not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const langConfig = SUPPORTED_LANGUAGES[group.defaultLanguage];
  const canInvite = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canCreateRoom = currentUserRole === 'owner' || currentUserRole === 'admin';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
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
        {/* Back Button */}
        <TouchableOpacity style={styles.backNav} onPress={() => router.back()}>
          <Text style={styles.backNavText}>← Back to Groups</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.groupIconLarge}>
            <Text style={styles.groupIconText}>
              {group.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.title}>{group.name}</Text>
          {group.description && (
            <Text style={styles.description}>{group.description}</Text>
          )}
          <Text style={styles.meta}>
            {langConfig.flag} {group.memberCount} member
            {group.memberCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Invite Section */}
        {canInvite && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invite Members</Text>

            {invitation ? (
              <View style={styles.inviteCard}>
                <Text style={styles.inviteLabel}>Invite Code</Text>
                <Text style={styles.inviteCode}>{invitation.code}</Text>
                <View style={styles.inviteActions}>
                  <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={handleCopyCode}
                  >
                    <Text style={styles.inviteButtonText}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.inviteButton, styles.inviteButtonPrimary]}
                    onPress={handleShareInvite}
                  >
                    <Text style={styles.inviteButtonTextPrimary}>Share</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.inviteExpiry}>
                  Expires in 7 days
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.createInviteButton}
                onPress={handleCreateInvite}
                disabled={isCreatingInvite}
              >
                {isCreatingInvite ? (
                  <ActivityIndicator size="small" color={COLORS.text} />
                ) : (
                  <>
                    <Text style={styles.createInviteIcon}>🔗</Text>
                    <Text style={styles.createInviteText}>Generate Invite Code</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Prayer Rooms Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prayer Rooms</Text>
            {canCreateRoom && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleCreateRoom}
              >
                <Text style={styles.addButtonText}>+ New Room</Text>
              </TouchableOpacity>
            )}
          </View>

          {rooms.length > 0 ? (
            <View style={styles.roomsList}>
              {rooms.map((room) => (
                <TouchableOpacity
                  key={room.id}
                  style={styles.roomCard}
                  onPress={() => handleJoinRoom(room)}
                >
                  <View style={styles.roomInfo}>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomMeta}>
                      {room.participantCount} praying now
                    </Text>
                  </View>
                  <Text style={styles.joinRoomText}>Join →</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyRooms}>
              <Text style={styles.emptyRoomsText}>
                No active rooms. Create one to start praying together!
              </Text>
            </View>
          )}
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          <View style={styles.membersList}>
            {members.map((member) => (
              <MemberCard
                key={member.userId}
                member={member}
                isCurrentUser={member.userId === user?.id}
                currentUserRole={currentUserRole}
                onRemove={() => handleRemoveMember(member.userId)}
                onUpdateRole={(role) => {
                  // Future: implement role update UI
                }}
              />
            ))}
          </View>
        </View>

        {/* Leave Group Button */}
        {currentUserRole !== 'owner' && (
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveGroup}
          >
            <Text style={styles.leaveButtonText}>Leave Group</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  backButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  backNav: {
    marginBottom: SPACING.lg,
  },
  backNavText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  groupIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  groupIconText: {
    fontSize: 36,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  description: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  meta: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  addButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  inviteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  inviteLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  inviteCode: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.gold,
    letterSpacing: 4,
    marginBottom: SPACING.md,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  inviteButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
  },
  inviteButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  inviteButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  inviteButtonTextPrimary: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  inviteExpiry: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  createInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  createInviteIcon: {
    fontSize: 24,
  },
  createInviteText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  roomsList: {
    gap: SPACING.md,
  },
  roomCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  roomMeta: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  joinRoomText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.primary,
  },
  emptyRooms: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyRoomsText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  membersList: {
    gap: SPACING.sm,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: 4,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium,
  },
  removeButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  removeButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.error,
  },
  leaveButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.lg,
  },
  leaveButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.error,
  },
});
