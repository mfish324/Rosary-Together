/**
 * Re-export useAudio hook from AudioContext for clean imports.
 *
 * Usage:
 *   import { useAudio } from '../hooks/useAudio';
 *   const { isMicEnabled, toggleMic, participants } = useAudio();
 */
export { useAudio } from '../contexts/AudioContext';
