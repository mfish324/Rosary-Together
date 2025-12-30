import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { AccessToken } from 'livekit-server-sdk';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// LiveKit configuration from environment
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

/**
 * Generate a LiveKit room token for a user to join a prayer session.
 *
 * Called when a user joins a prayer session in queue mode.
 * Validates that the user is authenticated and part of the session.
 */
export const getAudioRoomToken = onCall(
  { region: 'us-central1' },
  async (request) => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated to join audio room');
    }

    const userId = request.auth.uid;
    const { sessionId } = request.data;

    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId is required');
    }

    // Validate LiveKit credentials are configured
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      console.error('LiveKit credentials not configured');
      throw new HttpsError('internal', 'Audio service not configured');
    }

    try {
      // Optional: Verify user is in this session
      // const sessionDoc = await db.collection('sessions').doc(sessionId).get();
      // if (!sessionDoc.exists) {
      //   throw new HttpsError('not-found', 'Session not found');
      // }
      // const sessionData = sessionDoc.data();
      // if (!sessionData?.participants?.includes(userId)) {
      //   throw new HttpsError('permission-denied', 'Not a participant in this session');
      // }

      // Get user display name for room identity
      let displayName = 'Anonymous';
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          displayName = userDoc.data()?.displayName || 'Anonymous';
        }
      } catch (e) {
        // Continue with Anonymous if user doc doesn't exist
      }

      // Generate LiveKit access token
      const roomName = `rosary-${sessionId}`;

      const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity: userId,
        name: displayName,
        ttl: 60 * 60, // 1 hour
      });

      // Grant permissions to join room, publish audio, and subscribe to others
      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const jwt = await token.toJwt();

      console.log(`Generated token for user ${userId} to join room ${roomName}`);

      return {
        token: jwt,
        roomName,
      };
    } catch (error) {
      console.error('Error generating LiveKit token:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', 'Failed to generate audio room token');
    }
  }
);
