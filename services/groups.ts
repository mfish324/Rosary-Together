import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { PrayerGroup, GroupMember, GroupInvitation, Language, GroupRole } from '../types';
import { COLLECTIONS, INVITE_CODE_LENGTH, DEFAULT_INVITE_EXPIRY_DAYS } from '../constants';

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0, O, 1, I)
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new prayer group
export async function createGroup(
  name: string,
  createdBy: string,
  defaultLanguage: Language,
  description?: string
): Promise<PrayerGroup> {
  const groupRef = doc(collection(db, COLLECTIONS.GROUPS));

  const groupData = {
    id: groupRef.id,
    name,
    description: description || null,
    createdBy,
    createdAt: serverTimestamp(),
    memberCount: 1,
    defaultLanguage,
    imageUrl: null,
  };

  await setDoc(groupRef, groupData);

  // Add creator as owner
  const memberRef = doc(db, COLLECTIONS.GROUPS, groupRef.id, COLLECTIONS.GROUP_MEMBERS, createdBy);
  await setDoc(memberRef, {
    userId: createdBy,
    groupId: groupRef.id,
    role: 'owner' as GroupRole,
    joinedAt: serverTimestamp(),
  });

  return {
    id: groupRef.id,
    name,
    description,
    createdBy,
    createdAt: new Date(),
    memberCount: 1,
    defaultLanguage,
  };
}

// Get a group by ID
export async function getGroup(groupId: string): Promise<PrayerGroup | null> {
  const docRef = doc(db, COLLECTIONS.GROUPS, groupId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    description: data.description,
    createdBy: data.createdBy,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    memberCount: data.memberCount || 0,
    defaultLanguage: data.defaultLanguage,
    imageUrl: data.imageUrl,
  };
}

// Get groups for a user
export async function getUserGroups(userId: string): Promise<PrayerGroup[]> {
  const groupsSnapshot = await getDocs(collection(db, COLLECTIONS.GROUPS));
  const groups: PrayerGroup[] = [];

  for (const groupDoc of groupsSnapshot.docs) {
    const memberRef = doc(db, COLLECTIONS.GROUPS, groupDoc.id, COLLECTIONS.GROUP_MEMBERS, userId);
    const memberSnap = await getDoc(memberRef);

    if (memberSnap.exists()) {
      const data = groupDoc.data();
      groups.push({
        id: groupDoc.id,
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        memberCount: data.memberCount || 0,
        defaultLanguage: data.defaultLanguage,
        imageUrl: data.imageUrl,
      });
    }
  }

  return groups;
}

// Get members of a group
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const membersRef = collection(db, COLLECTIONS.GROUPS, groupId, COLLECTIONS.GROUP_MEMBERS);
  const snapshot = await getDocs(membersRef);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      userId: data.userId,
      groupId: data.groupId,
      role: data.role,
      displayName: data.displayName,
      joinedAt: (data.joinedAt as Timestamp)?.toDate() || new Date(),
    };
  });
}

// Get user role in a group
export async function getUserRole(groupId: string, userId: string): Promise<GroupRole | null> {
  const memberRef = doc(db, COLLECTIONS.GROUPS, groupId, COLLECTIONS.GROUP_MEMBERS, userId);
  const memberSnap = await getDoc(memberRef);

  if (!memberSnap.exists()) {
    return null;
  }

  return memberSnap.data().role as GroupRole;
}

// Create an invitation
export async function createInvitation(
  groupId: string,
  groupName: string,
  createdBy: string,
  expiryDays?: number,
  maxUses?: number
): Promise<GroupInvitation> {
  const code = generateInviteCode();
  const inviteRef = doc(collection(db, COLLECTIONS.GROUP_INVITATIONS));

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (expiryDays || DEFAULT_INVITE_EXPIRY_DAYS));

  const inviteData = {
    id: inviteRef.id,
    groupId,
    groupName,
    code,
    createdBy,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
    maxUses: maxUses || null,
    usedCount: 0,
    isActive: true,
  };

  await setDoc(inviteRef, inviteData);

  return {
    id: inviteRef.id,
    groupId,
    groupName,
    code,
    createdBy,
    createdAt: new Date(),
    expiresAt,
    maxUses,
    usedCount: 0,
    isActive: true,
  };
}

// Get invitation by code
export async function getInvitationByCode(code: string): Promise<GroupInvitation | null> {
  const invitesQuery = query(
    collection(db, COLLECTIONS.GROUP_INVITATIONS),
    where('code', '==', code.toUpperCase()),
    where('isActive', '==', true)
  );

  const snapshot = await getDocs(invitesQuery);

  if (snapshot.empty) {
    return null;
  }

  const inviteDoc = snapshot.docs[0];
  const data = inviteDoc.data();

  // Check if expired
  const expiresAt = (data.expiresAt as Timestamp)?.toDate();
  if (expiresAt && expiresAt < new Date()) {
    return null;
  }

  // Check if max uses reached
  if (data.maxUses && data.usedCount >= data.maxUses) {
    return null;
  }

  return {
    id: inviteDoc.id,
    groupId: data.groupId,
    groupName: data.groupName,
    code: data.code,
    createdBy: data.createdBy,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    expiresAt,
    maxUses: data.maxUses,
    usedCount: data.usedCount,
    isActive: data.isActive,
  };
}

// Accept an invitation (join group)
export async function acceptInvitation(
  invitationId: string,
  userId: string,
  displayName?: string
): Promise<{ success: boolean; groupId?: string; error?: string }> {
  const inviteRef = doc(db, COLLECTIONS.GROUP_INVITATIONS, invitationId);
  const inviteSnap = await getDoc(inviteRef);

  if (!inviteSnap.exists()) {
    return { success: false, error: 'Invitation not found' };
  }

  const inviteData = inviteSnap.data();
  const groupId = inviteData.groupId;

  // Check if already a member
  const memberRef = doc(db, COLLECTIONS.GROUPS, groupId, COLLECTIONS.GROUP_MEMBERS, userId);
  const memberSnap = await getDoc(memberRef);

  if (memberSnap.exists()) {
    return { success: false, error: 'Already a member of this group' };
  }

  // Add user as member
  await setDoc(memberRef, {
    userId,
    groupId,
    role: 'member' as GroupRole,
    displayName: displayName || null,
    joinedAt: serverTimestamp(),
  });

  // Update group member count
  const groupRef = doc(db, COLLECTIONS.GROUPS, groupId);
  await updateDoc(groupRef, {
    memberCount: increment(1),
  });

  // Increment invitation use count
  await updateDoc(inviteRef, {
    usedCount: increment(1),
  });

  return { success: true, groupId };
}

// Leave a group
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const role = await getUserRole(groupId, userId);

  if (role === 'owner') {
    throw new Error('Owner cannot leave the group. Transfer ownership or delete the group.');
  }

  const memberRef = doc(db, COLLECTIONS.GROUPS, groupId, COLLECTIONS.GROUP_MEMBERS, userId);
  await deleteDoc(memberRef);

  const groupRef = doc(db, COLLECTIONS.GROUPS, groupId);
  await updateDoc(groupRef, {
    memberCount: increment(-1),
  });
}

// Update member role
export async function updateMemberRole(
  groupId: string,
  userId: string,
  newRole: GroupRole,
  requesterId: string
): Promise<void> {
  const requesterRole = await getUserRole(groupId, requesterId);

  if (requesterRole !== 'owner' && requesterRole !== 'admin') {
    throw new Error('Permission denied');
  }

  if (newRole === 'owner' && requesterRole !== 'owner') {
    throw new Error('Only owner can transfer ownership');
  }

  const memberRef = doc(db, COLLECTIONS.GROUPS, groupId, COLLECTIONS.GROUP_MEMBERS, userId);
  await updateDoc(memberRef, { role: newRole });

  if (newRole === 'owner') {
    const currentOwnerRef = doc(db, COLLECTIONS.GROUPS, groupId, COLLECTIONS.GROUP_MEMBERS, requesterId);
    await updateDoc(currentOwnerRef, { role: 'admin' });

    const groupRef = doc(db, COLLECTIONS.GROUPS, groupId);
    await updateDoc(groupRef, { createdBy: userId });
  }
}

// Remove member from group
export async function removeMember(
  groupId: string,
  userId: string,
  requesterId: string
): Promise<void> {
  const requesterRole = await getUserRole(groupId, requesterId);
  const targetRole = await getUserRole(groupId, userId);

  if (requesterRole !== 'owner' && requesterRole !== 'admin') {
    throw new Error('Permission denied');
  }

  if (targetRole === 'owner') {
    throw new Error('Cannot remove group owner');
  }

  if (targetRole === 'admin' && requesterRole !== 'owner') {
    throw new Error('Only owner can remove admins');
  }

  const memberRef = doc(db, COLLECTIONS.GROUPS, groupId, COLLECTIONS.GROUP_MEMBERS, userId);
  await deleteDoc(memberRef);

  const groupRef = doc(db, COLLECTIONS.GROUPS, groupId);
  await updateDoc(groupRef, {
    memberCount: increment(-1),
  });
}

// Delete a group (owner only)
export async function deleteGroup(groupId: string, requesterId: string): Promise<void> {
  const role = await getUserRole(groupId, requesterId);

  if (role !== 'owner') {
    throw new Error('Only owner can delete the group');
  }

  // Delete all members
  const membersRef = collection(db, COLLECTIONS.GROUPS, groupId, COLLECTIONS.GROUP_MEMBERS);
  const membersSnap = await getDocs(membersRef);

  for (const memberDoc of membersSnap.docs) {
    await deleteDoc(memberDoc.ref);
  }

  // Delete group
  await deleteDoc(doc(db, COLLECTIONS.GROUPS, groupId));

  // Deactivate all invitations
  const invitesQuery = query(
    collection(db, COLLECTIONS.GROUP_INVITATIONS),
    where('groupId', '==', groupId)
  );
  const invitesSnap = await getDocs(invitesQuery);

  for (const inviteDoc of invitesSnap.docs) {
    await updateDoc(inviteDoc.ref, { isActive: false });
  }
}

// Subscribe to group updates
export function subscribeToGroup(
  groupId: string,
  callback: (group: PrayerGroup | null) => void
): () => void {
  const docRef = doc(db, COLLECTIONS.GROUPS, groupId);

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }

    const data = docSnap.data();
    callback({
      id: docSnap.id,
      name: data.name,
      description: data.description,
      createdBy: data.createdBy,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      memberCount: data.memberCount || 0,
      defaultLanguage: data.defaultLanguage,
      imageUrl: data.imageUrl,
    });
  });

  return unsubscribe;
}

// Update group details
export async function updateGroup(
  groupId: string,
  updates: Partial<Pick<PrayerGroup, 'name' | 'description' | 'defaultLanguage' | 'imageUrl'>>,
  requesterId: string
): Promise<void> {
  const role = await getUserRole(groupId, requesterId);

  if (role !== 'owner' && role !== 'admin') {
    throw new Error('Permission denied');
  }

  const groupRef = doc(db, COLLECTIONS.GROUPS, groupId);
  await updateDoc(groupRef, updates);
}
