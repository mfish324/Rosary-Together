/**
 * Sacred Art Images for Rosary Mysteries
 *
 * Images are stored in Firebase Storage for reliable loading.
 * Upload images to: Firebase Console > Storage > mysteries/{type}/{number}.jpg
 *
 * Expected folder structure:
 *   mysteries/
 *     joyful/
 *       1.jpg  (Annunciation)
 *       2.jpg  (Visitation)
 *       3.jpg  (Nativity)
 *       4.jpg  (Presentation)
 *       5.jpg  (Finding in Temple)
 *     sorrowful/
 *       1.jpg  (Agony in Garden)
 *       2.jpg  (Scourging)
 *       3.jpg  (Crowning with Thorns)
 *       4.jpg  (Carrying the Cross)
 *       5.jpg  (Crucifixion)
 *     glorious/
 *       1.jpg  (Resurrection)
 *       2.jpg  (Ascension)
 *       3.jpg  (Pentecost)
 *       4.jpg  (Assumption)
 *       5.jpg  (Coronation)
 *     luminous/
 *       1.jpg  (Baptism)
 *       2.jpg  (Wedding at Cana)
 *       3.jpg  (Proclamation)
 *       4.jpg  (Transfiguration)
 *       5.jpg  (Last Supper)
 */

export interface MysteryImageSet {
  joyful: string[];
  sorrowful: string[];
  glorious: string[];
  luminous: string[];
}

// Firebase Storage bucket
const STORAGE_BUCKET = 'rosary-together.firebasestorage.app';

// Helper to create Firebase Storage URL
function storageUrl(path: string): string {
  const encodedPath = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media`;
}

// Fallback to placeholder if image not found
const PLACEHOLDER_BASE = 'https://placehold.co';
const COLORS = {
  joyful: { bg: '4A90D9', text: 'FFFFFF' },
  sorrowful: { bg: '8B0000', text: 'FFFFFF' },
  glorious: { bg: 'DAA520', text: '000000' },
  luminous: { bg: 'F0E68C', text: '000000' },
};

const MYSTERY_TITLES = {
  joyful: ['Annunciation', 'Visitation', 'Nativity', 'Presentation', 'Finding+in+Temple'],
  sorrowful: ['Agony+in+Garden', 'Scourging', 'Crown+of+Thorns', 'Carrying+Cross', 'Crucifixion'],
  glorious: ['Resurrection', 'Ascension', 'Pentecost', 'Assumption', 'Coronation'],
  luminous: ['Baptism', 'Wedding+at+Cana', 'Proclamation', 'Transfiguration', 'Last+Supper'],
};

function placeholderUrl(type: keyof typeof COLORS, title: string): string {
  const { bg, text } = COLORS[type];
  return `${PLACEHOLDER_BASE}/800x600/${bg}/${text}?text=${title}&font=playfair-display`;
}

// Firebase Storage URLs for each mystery
export const MYSTERY_IMAGES: MysteryImageSet = {
  joyful: [1, 2, 3, 4, 5].map(n => storageUrl(`mysteries/joyful/${n}.jpg`)),
  sorrowful: [1, 2, 3, 4, 5].map(n => storageUrl(`mysteries/sorrowful/${n}.jpg`)),
  glorious: [1, 2, 3, 4, 5].map(n => storageUrl(`mysteries/glorious/${n}.jpg`)),
  luminous: [1, 2, 3, 4, 5].map(n => storageUrl(`mysteries/luminous/${n}.jpg`)),
};

// Fallback placeholder images (shown if Firebase images not yet uploaded)
export const MYSTERY_PLACEHOLDERS: MysteryImageSet = {
  joyful: MYSTERY_TITLES.joyful.map(title => placeholderUrl('joyful', title)),
  sorrowful: MYSTERY_TITLES.sorrowful.map(title => placeholderUrl('sorrowful', title)),
  glorious: MYSTERY_TITLES.glorious.map(title => placeholderUrl('glorious', title)),
  luminous: MYSTERY_TITLES.luminous.map(title => placeholderUrl('luminous', title)),
};

// General prayer images
export const PRAYER_IMAGES = {
  crucifix: storageUrl('prayers/crucifix.jpg'),
  holySpirit: storageUrl('prayers/holy-spirit.jpg'),
  madonna: storageUrl('prayers/madonna.jpg'),
  prayingHands: storageUrl('prayers/praying-hands.jpg'),
};

/**
 * Get the image URL for a specific mystery.
 * Returns Firebase Storage URL (falls back to placeholder in component if 404)
 */
export function getMysteryImageUrl(type: keyof MysteryImageSet, mysteryNumber: number): string {
  const images = MYSTERY_IMAGES[type];
  const index = Math.max(0, Math.min(mysteryNumber - 1, images.length - 1));
  return images[index];
}

/**
 * Get the placeholder URL for a specific mystery (used as fallback)
 */
export function getMysteryPlaceholderUrl(type: keyof MysteryImageSet, mysteryNumber: number): string {
  const images = MYSTERY_PLACEHOLDERS[type];
  const index = Math.max(0, Math.min(mysteryNumber - 1, images.length - 1));
  return images[index];
}
