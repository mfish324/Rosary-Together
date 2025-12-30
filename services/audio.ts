/**
 * LiveKit Audio Service
 *
 * Real LiveKit integration for audio rooms in prayer sessions.
 * Falls back to mock mode if LiveKit URL is not configured.
 */

import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrackPublication,
  LocalParticipant,
  Track,
  ParticipantEvent,
  ConnectionState,
} from 'livekit-client';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { AudioParticipant, AudioConnectionState } from '../types';
import { getMutedUsers, getBlockedUserIds } from './moderation';

// LiveKit configuration
const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL;

// Use mock mode if LiveKit URL is not configured
const USE_MOCK = !LIVEKIT_URL;

// Callbacks for state updates
type ParticipantCallback = (participants: AudioParticipant[]) => void;
type ConnectionCallback = (state: AudioConnectionState, error?: string) => void;

let participantCallbacks: ParticipantCallback[] = [];
let connectionCallbacks: ConnectionCallback[] = [];
let room: Room | null = null;
let currentSessionId: string | null = null;
let currentUserId: string | null = null;
let isMicEnabled = false;
let mutedUserIds: Set<string> = new Set();
let blockedUserIds: Set<string> = new Set();

// Mock mode variables
let mockParticipants: AudioParticipant[] = [];
let speakingInterval: NodeJS.Timeout | null = null;

const MOCK_PARTICIPANTS = [
  { userId: 'mock-user-1', displayName: 'María', country: 'MX' },
  { userId: 'mock-user-2', displayName: 'Carmen', country: 'ES' },
  { userId: 'mock-user-3', displayName: 'Diego', country: 'AR' },
  { userId: 'mock-user-4', displayName: 'João', country: 'BR' },
  { userId: 'mock-user-5', displayName: 'Patrick', country: 'IE' },
];

/**
 * Join an audio room for a prayer session.
 */
export async function joinAudioRoom(
  sessionId: string,
  userId: string
): Promise<void> {
  currentSessionId = sessionId;
  currentUserId = userId;

  // Load muted and blocked users
  mutedUserIds = await getMutedUsers();
  blockedUserIds = await getBlockedUserIds(userId);

  if (USE_MOCK) {
    await joinMockRoom();
  } else {
    await joinLiveKitRoom(sessionId);
  }
}

/**
 * Leave the current audio room.
 */
export async function leaveAudioRoom(): Promise<void> {
  if (USE_MOCK) {
    leaveMockRoom();
  } else {
    await leaveLiveKitRoom();
  }

  currentSessionId = null;
  currentUserId = null;
  isMicEnabled = false;
}

/**
 * Toggle the local microphone state.
 */
export async function toggleMicrophone(enabled: boolean): Promise<void> {
  isMicEnabled = enabled;

  if (!USE_MOCK && room) {
    try {
      await room.localParticipant.setMicrophoneEnabled(enabled);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  }
}

/**
 * Get whether the mic is currently enabled.
 */
export function getMicEnabled(): boolean {
  return isMicEnabled;
}

/**
 * Get the current session ID.
 */
export function getCurrentSessionId(): string | null {
  return currentSessionId;
}

/**
 * Get the current user ID.
 */
export function getCurrentUserId(): string | null {
  return currentUserId;
}

/**
 * Subscribe to participant updates.
 */
export function subscribeToParticipants(
  callback: ParticipantCallback
): () => void {
  participantCallbacks.push(callback);

  // Immediately call with current state
  if (USE_MOCK) {
    callback([...mockParticipants]);
  } else {
    callback(buildParticipantList());
  }

  return () => {
    participantCallbacks = participantCallbacks.filter((cb) => cb !== callback);
  };
}

/**
 * Subscribe to connection state changes.
 */
export function subscribeToConnectionState(
  callback: ConnectionCallback
): () => void {
  connectionCallbacks.push(callback);

  return () => {
    connectionCallbacks = connectionCallbacks.filter((cb) => cb !== callback);
  };
}

/**
 * Update a participant's muted state (client-side only).
 */
export async function setParticipantMuted(
  userId: string,
  muted: boolean
): Promise<void> {
  if (muted) {
    mutedUserIds.add(userId);
  } else {
    mutedUserIds.delete(userId);
  }

  if (USE_MOCK) {
    const participant = mockParticipants.find((p) => p.userId === userId);
    if (participant) {
      participant.isMutedByMe = muted;
    }
  } else {
    // Mute/unmute the actual audio element
    const audioElement = document.getElementById(`audio-${userId}`) as HTMLAudioElement;
    if (audioElement) {
      audioElement.muted = muted;
    }
  }

  notifyParticipants();
}

/**
 * Update a participant's blocked state.
 */
export async function setParticipantBlocked(
  userId: string,
  blocked: boolean
): Promise<void> {
  if (blocked) {
    blockedUserIds.add(userId);
    mutedUserIds.add(userId); // Also mute when blocking
  } else {
    blockedUserIds.delete(userId);
  }

  if (USE_MOCK) {
    const participant = mockParticipants.find((p) => p.userId === userId);
    if (participant) {
      participant.isBlocked = blocked;
      if (blocked) {
        participant.isMutedByMe = true;
      }
    }
  }

  notifyParticipants();
}

// ============================================================================
// LiveKit Implementation
// ============================================================================

async function joinLiveKitRoom(sessionId: string): Promise<void> {
  notifyConnectionState('connecting');

  try {
    // Get token from Cloud Function
    const getToken = httpsCallable<{ sessionId: string }, { token: string; roomName: string }>(
      functions,
      'getAudioRoomToken'
    );

    const result = await getToken({ sessionId });
    const { token } = result.data;

    // Create and connect to room
    room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Set up event handlers
    setupRoomEventHandlers(room);

    // Connect to room
    await room.connect(LIVEKIT_URL!, token);

    // Start with mic disabled
    await room.localParticipant.setMicrophoneEnabled(false);
    isMicEnabled = false;

    notifyConnectionState('connected');
    notifyParticipants();
  } catch (error) {
    console.error('Failed to join LiveKit room:', error);
    notifyConnectionState('error', error instanceof Error ? error.message : 'Failed to connect');
    throw error;
  }
}

async function leaveLiveKitRoom(): Promise<void> {
  if (room) {
    await room.disconnect();
    room = null;
  }

  notifyConnectionState('disconnected');
  notifyParticipants();
}

function setupRoomEventHandlers(room: Room): void {
  // Connection state changes
  room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
    switch (state) {
      case ConnectionState.Connecting:
        notifyConnectionState('connecting');
        break;
      case ConnectionState.Connected:
        notifyConnectionState('connected');
        break;
      case ConnectionState.Disconnected:
        notifyConnectionState('disconnected');
        break;
      case ConnectionState.Reconnecting:
        notifyConnectionState('connecting');
        break;
    }
  });

  // Participant events
  room.on(RoomEvent.ParticipantConnected, () => {
    notifyParticipants();
  });

  room.on(RoomEvent.ParticipantDisconnected, () => {
    notifyParticipants();
  });

  // Track events (for speaking detection and audio playback)
  room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    if (track.kind === Track.Kind.Audio) {
      // Attach audio track to DOM for playback
      const audioElement = track.attach();
      audioElement.id = `audio-${participant.identity}`;
      document.body.appendChild(audioElement);

      // Apply muting if user is muted by us
      if (mutedUserIds.has(participant.identity)) {
        audioElement.muted = true;
      }
    }
    notifyParticipants();
  });

  room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
    if (track.kind === Track.Kind.Audio) {
      // Remove audio element from DOM
      track.detach().forEach((el) => el.remove());
    }
    notifyParticipants();
  });

  room.on(RoomEvent.TrackMuted, () => {
    notifyParticipants();
  });

  room.on(RoomEvent.TrackUnmuted, () => {
    notifyParticipants();
  });

  // Speaking detection
  room.on(RoomEvent.ActiveSpeakersChanged, () => {
    notifyParticipants();
  });
}

function buildParticipantList(): AudioParticipant[] {
  if (!room) return [];

  const participants: AudioParticipant[] = [];

  // Add remote participants
  room.remoteParticipants.forEach((remoteParticipant: RemoteParticipant) => {
    const participantId = remoteParticipant.identity;
    const isSpeaking = remoteParticipant.isSpeaking;
    const audioTrack = remoteParticipant.getTrackPublication(Track.Source.Microphone);
    const participantMicEnabled = audioTrack?.isMuted === false;

    participants.push({
      userId: participantId,
      displayName: remoteParticipant.name || 'Anonymous',
      country: (remoteParticipant.metadata && JSON.parse(remoteParticipant.metadata)?.country) || 'UN',
      isSpeaking,
      isMicEnabled: participantMicEnabled,
      isMutedByMe: mutedUserIds.has(participantId),
      isBlocked: blockedUserIds.has(participantId),
    });
  });

  return participants;
}

// ============================================================================
// Mock Implementation (fallback)
// ============================================================================

async function joinMockRoom(): Promise<void> {
  notifyConnectionState('connecting');

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Generate mock participants
  const numParticipants = Math.floor(Math.random() * 3) + 2;
  const shuffled = [...MOCK_PARTICIPANTS].sort(() => Math.random() - 0.5);

  mockParticipants = shuffled.slice(0, numParticipants).map((p) => ({
    userId: p.userId,
    displayName: p.displayName,
    country: p.country,
    isSpeaking: false,
    isMicEnabled: Math.random() > 0.3,
    isMutedByMe: mutedUserIds.has(p.userId),
    isBlocked: blockedUserIds.has(p.userId),
  }));

  // Start voice activity simulation
  startVoiceActivitySimulation();

  notifyConnectionState('connected');
  notifyParticipants();
}

function leaveMockRoom(): void {
  stopVoiceActivitySimulation();
  mockParticipants = [];
  notifyConnectionState('disconnected');
  notifyParticipants();
}

function startVoiceActivitySimulation(): void {
  const simulate = () => {
    if (mockParticipants.length === 0) return;

    mockParticipants.forEach((p) => {
      p.isSpeaking = false;
    });

    const numSpeaking = Math.floor(Math.random() * 3);
    const activeParticipants = mockParticipants.filter((p) => p.isMicEnabled);

    for (let i = 0; i < numSpeaking && i < activeParticipants.length; i++) {
      const randomIdx = Math.floor(Math.random() * activeParticipants.length);
      activeParticipants[randomIdx].isSpeaking = true;
    }

    notifyParticipants();

    const delay = 2000 + Math.random() * 2000;
    speakingInterval = setTimeout(simulate, delay);
  };

  simulate();
}

function stopVoiceActivitySimulation(): void {
  if (speakingInterval) {
    clearTimeout(speakingInterval);
    speakingInterval = null;
  }
}

// ============================================================================
// Notification helpers
// ============================================================================

function notifyParticipants(): void {
  const participants = USE_MOCK ? [...mockParticipants] : buildParticipantList();
  participantCallbacks.forEach((cb) => cb(participants));
}

function notifyConnectionState(state: AudioConnectionState, error?: string): void {
  connectionCallbacks.forEach((cb) => cb(state, error));
}
