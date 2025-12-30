import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  set,
  onValue,
  remove,
  onDisconnect,
  serverTimestamp as rtdbServerTimestamp,
} from 'firebase/database';
import { db, rtdb } from './firebase';
import { Room, Language, RoomType } from '../types';
import { COLLECTIONS, RTDB_PATHS, PUBLIC_ROOM_IDS } from '../constants';

// Initialize public rooms (call once on app startup or via admin)
export async function initializePublicRooms(): Promise<void> {
  const languages: Language[] = ['en', 'es', 'pt', 'tl'];
  
  for (const lang of languages) {
    const roomId = PUBLIC_ROOM_IDS[lang];
    const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      await setDoc(roomRef, {
        id: roomId,
        name: getPublicRoomName(lang),
        language: lang,
        type: 'public' as RoomType,
        createdBy: 'system',
        createdAt: serverTimestamp(),
        isActive: true,
        participantCount: 0,
      });
    }
  }
}

function getPublicRoomName(lang: Language): string {
  const names: Record<Language, string> = {
    en: 'English Prayer Room',
    es: 'Sala de Oración en Español',
    pt: 'Sala de Oração em Português',
    tl: 'Tagalog Prayer Room',
  };
  return names[lang];
}

// Get a room by ID
export async function getRoom(roomId: string): Promise<Room | null> {
  const docRef = doc(db, COLLECTIONS.ROOMS, roomId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    language: data.language,
    type: data.type,
    groupId: data.groupId,
    createdBy: data.createdBy,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    isActive: data.isActive,
    currentSessionId: data.currentSessionId,
    participantCount: data.participantCount || 0,
    maxParticipants: data.maxParticipants,
  };
}

// Get public room for a language
export async function getPublicRoom(language: Language): Promise<Room | null> {
  const roomId = PUBLIC_ROOM_IDS[language];
  return getRoom(roomId);
}

// Get all public rooms
export async function getAllPublicRooms(): Promise<Room[]> {
  const roomsQuery = query(
    collection(db, COLLECTIONS.ROOMS),
    where('type', '==', 'public')
  );
  
  const snapshot = await getDocs(roomsQuery);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      language: data.language,
      type: data.type,
      groupId: data.groupId,
      createdBy: data.createdBy,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      isActive: data.isActive,
      currentSessionId: data.currentSessionId,
      participantCount: data.participantCount || 0,
      maxParticipants: data.maxParticipants,
    };
  });
}

// Join a room (real-time presence)
export async function joinRoom(
  roomId: string,
  userId: string,
  displayName?: string
): Promise<void> {
  // Add user to RTDB presence
  const presenceRef = ref(rtdb, `${RTDB_PATHS.ROOMS}/${roomId}/participants/${userId}`);
  
  await set(presenceRef, {
    userId: userId,
    displayName: displayName || null,
    joinedAt: rtdbServerTimestamp(),
    isSpeaking: false,
    isMicEnabled: false,
  });

  // Set up disconnect handler
  onDisconnect(presenceRef).remove();

  // Increment participant count in Firestore
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
  await updateDoc(roomRef, {
    participantCount: increment(1),
  });
}

// Leave a room
export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  // Remove from RTDB presence
  const presenceRef = ref(rtdb, `${RTDB_PATHS.ROOMS}/${roomId}/participants/${userId}`);
  await remove(presenceRef);

  // Decrement participant count in Firestore
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
  await updateDoc(roomRef, {
    participantCount: increment(-1),
  });
}

// Subscribe to room updates
export function subscribeToRoom(
  roomId: string,
  callback: (room: Room | null) => void
): () => void {
  const docRef = doc(db, COLLECTIONS.ROOMS, roomId);

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }

    const data = docSnap.data();
    callback({
      id: docSnap.id,
      name: data.name,
      language: data.language,
      type: data.type,
      groupId: data.groupId,
      createdBy: data.createdBy,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      isActive: data.isActive,
      currentSessionId: data.currentSessionId,
      participantCount: data.participantCount || 0,
      maxParticipants: data.maxParticipants,
    });
  });

  return unsubscribe;
}

// Subscribe to room participants (real-time)
export function subscribeToRoomParticipants(
  roomId: string,
  callback: (participants: Record<string, any>) => void
): () => void {
  const participantsRef = ref(rtdb, `${RTDB_PATHS.ROOMS}/${roomId}/participants`);

  const unsubscribe = onValue(participantsRef, (snapshot) => {
    const participants = snapshot.val() || {};
    callback(participants);
  });

  return unsubscribe;
}

// Get participant count for a room
export function subscribeToRoomCount(
  roomId: string,
  callback: (count: number) => void
): () => void {
  const participantsRef = ref(rtdb, `${RTDB_PATHS.ROOMS}/${roomId}/participants`);

  const unsubscribe = onValue(participantsRef, (snapshot) => {
    const participants = snapshot.val() || {};
    callback(Object.keys(participants).length);
  });

  return unsubscribe;
}

// Create a private room for a group
export async function createPrivateRoom(
  groupId: string,
  name: string,
  language: Language,
  createdBy: string,
  maxParticipants?: number
): Promise<Room> {
  const roomData = {
    name,
    language,
    type: 'private' as RoomType,
    groupId,
    createdBy,
    createdAt: serverTimestamp(),
    isActive: true,
    participantCount: 0,
    maxParticipants,
  };

  const docRef = doc(collection(db, COLLECTIONS.ROOMS));
  await setDoc(docRef, { ...roomData, id: docRef.id });

  return {
    id: docRef.id,
    name,
    language,
    type: 'private',
    groupId,
    createdBy,
    createdAt: new Date(),
    isActive: true,
    participantCount: 0,
    maxParticipants,
  };
}

// Get rooms for a group
export async function getGroupRooms(groupId: string): Promise<Room[]> {
  const roomsQuery = query(
    collection(db, COLLECTIONS.ROOMS),
    where('groupId', '==', groupId),
    where('type', '==', 'private')
  );

  const snapshot = await getDocs(roomsQuery);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      language: data.language,
      type: data.type,
      groupId: data.groupId,
      createdBy: data.createdBy,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      isActive: data.isActive,
      currentSessionId: data.currentSessionId,
      participantCount: data.participantCount || 0,
      maxParticipants: data.maxParticipants,
    };
  });
}

// Update room session
export async function updateRoomSession(
  roomId: string,
  sessionId: string | null
): Promise<void> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
  await updateDoc(roomRef, {
    currentSessionId: sessionId,
  });
}
