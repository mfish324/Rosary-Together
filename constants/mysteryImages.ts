/**
 * Sacred Art Images for Rosary Mysteries
 *
 * All images are public domain artworks from Wikimedia Commons.
 * These are famous masterpieces depicting each mystery of the Rosary.
 */

export interface MysteryImageSet {
  joyful: string[];
  sorrowful: string[];
  glorious: string[];
  luminous: string[];
}

// Wikimedia Commons URLs for mystery images
// Using classic masterpieces that are in the public domain
export const MYSTERY_IMAGES: MysteryImageSet = {
  // Joyful Mysteries
  joyful: [
    // 1. The Annunciation - Fra Angelico
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Annunciation_%28Fra_Angelico%2C_San_Marco%29.jpg/800px-Annunciation_%28Fra_Angelico%2C_San_Marco%29.jpg',
    // 2. The Visitation - Raphael
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Visitaci%C3%B3n_%28Rafael%29.jpg/800px-Visitaci%C3%B3n_%28Rafael%29.jpg',
    // 3. The Nativity - Gerard van Honthorst
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Gerard_van_Honthorst_-_Adoration_of_the_Shepherds_%281622%29.jpg/800px-Gerard_van_Honthorst_-_Adoration_of_the_Shepherds_%281622%29.jpg',
    // 4. The Presentation - Fra Angelico
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Fra_Angelico_-_Presentation_of_Jesus_in_the_Temple_%28detail%29_-_WGA00509.jpg/800px-Fra_Angelico_-_Presentation_of_Jesus_in_the_Temple_%28detail%29_-_WGA00509.jpg',
    // 5. Finding in the Temple - Heinrich Hofmann
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Young_Jesus_in_the_Temple%2C_by_Heinrich_Hofmann%2C_%28ARC%29.jpg/800px-Young_Jesus_in_the_Temple%2C_by_Heinrich_Hofmann%2C_%28ARC%29.jpg',
  ],

  // Sorrowful Mysteries
  sorrowful: [
    // 1. Agony in the Garden - El Greco
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/El_Greco_-_The_Agony_in_the_Garden_-_WGA10558.jpg/800px-El_Greco_-_The_Agony_in_the_Garden_-_WGA10558.jpg',
    // 2. Scourging at the Pillar - Caravaggio
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Caravaggio_-_La_Flagellazione_di_Cristo.jpg/800px-Caravaggio_-_La_Flagellazione_di_Cristo.jpg',
    // 3. Crowning with Thorns - Caravaggio
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Caravaggio_-_Ecce_Homo_-_WGA04152.jpg/800px-Caravaggio_-_Ecce_Homo_-_WGA04152.jpg',
    // 4. Carrying the Cross - El Greco
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Christ_Carrying_the_Cross_1580.jpg/800px-Christ_Carrying_the_Cross_1580.jpg',
    // 5. The Crucifixion - Diego Velázquez
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Cristo_crucificado.jpg/800px-Cristo_crucificado.jpg',
  ],

  // Glorious Mysteries
  glorious: [
    // 1. The Resurrection - Carl Bloch
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Bloch-Resurrection.jpg/800px-Bloch-Resurrection.jpg',
    // 2. The Ascension - Garofalo
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Garofalo_-_Ascension_of_Christ_-_WGA08474.jpg/800px-Garofalo_-_Ascension_of_Christ_-_WGA08474.jpg',
    // 3. Descent of the Holy Spirit - El Greco
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Pentecost%C3%A9s_%28El_Greco%2C_1597%29.jpg/800px-Pentecost%C3%A9s_%28El_Greco%2C_1597%29.jpg',
    // 4. Assumption of Mary - Guido Reni
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Guido_Reni_-_The_Assumption_of_the_Virgin_Mary_-_Google_Art_Project.jpg/800px-Guido_Reni_-_The_Assumption_of_the_Virgin_Mary_-_Google_Art_Project.jpg',
    // 5. Coronation of Mary - Diego Velázquez
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Coronaci%C3%B3n_de_la_Virgen%2C_by_Diego_Vel%C3%A1zquez.jpg/800px-Coronaci%C3%B3n_de_la_Virgen%2C_by_Diego_Vel%C3%A1zquez.jpg',
  ],

  // Luminous Mysteries
  luminous: [
    // 1. Baptism of Jesus - Andrea del Verrocchio
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Andrea_del_Verrocchio%2C_Leonardo_da_Vinci_-_Baptism_of_Christ_-_Uffizi.jpg/800px-Andrea_del_Verrocchio%2C_Leonardo_da_Vinci_-_Baptism_of_Christ_-_Uffizi.jpg',
    // 2. Wedding at Cana - Paolo Veronese
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Paolo_Veronese_-_The_Wedding_at_Cana_-_WGA24854.jpg/800px-Paolo_Veronese_-_The_Wedding_at_Cana_-_WGA24854.jpg',
    // 3. Proclamation of the Kingdom - Carl Bloch (Sermon on Mount)
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Bloch-SermonOnTheMount.jpg/800px-Bloch-SermonOnTheMount.jpg',
    // 4. Transfiguration - Raphael
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Transfiguration_Raphael.jpg/800px-Transfiguration_Raphael.jpg',
    // 5. Institution of the Eucharist - Juan de Juanes
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Juan_de_Juanes_-_The_Last_Supper_-_Google_Art_Project.jpg/800px-Juan_de_Juanes_-_The_Last_Supper_-_Google_Art_Project.jpg',
  ],
};

// General prayer images (for opening/closing prayers)
export const PRAYER_IMAGES = {
  // Sign of the Cross / Crucifix
  crucifix: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Cristo_crucificado.jpg/800px-Cristo_crucificado.jpg',
  // Holy Spirit / Pentecost
  holySpirit: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Pentecost%C3%A9s_%28El_Greco%2C_1597%29.jpg/800px-Pentecost%C3%A9s_%28El_Greco%2C_1597%29.jpg',
  // Madonna with Child - Sassoferrato
  madonna: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Sassoferrato_-_Madonna_and_Child_-_WGA20880.jpg/800px-Sassoferrato_-_Madonna_and_Child_-_WGA20880.jpg',
  // Praying Hands - Albrecht Dürer
  prayingHands: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Praying_Hands_-_Albrecht_Durer.png/800px-Praying_Hands_-_Albrecht_Durer.png',
};

/**
 * Get the image URL for a specific mystery.
 * @param type - The mystery type (joyful, sorrowful, glorious, luminous)
 * @param mysteryNumber - 1-5, the number of the mystery within its set
 * @returns The Wikimedia Commons URL for the sacred art image
 */
export function getMysteryImageUrl(type: keyof MysteryImageSet, mysteryNumber: number): string {
  const images = MYSTERY_IMAGES[type];
  const index = Math.max(0, Math.min(mysteryNumber - 1, images.length - 1));
  return images[index];
}
