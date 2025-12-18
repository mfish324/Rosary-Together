import { Language, MysteryType, MysterySet, Mystery } from '../../types';

// Import all mystery content
import joyful from './joyful.json';
import sorrowful from './sorrowful.json';
import glorious from './glorious.json';
import luminous from './luminous.json';

// English mysteries (default)
const mysteriesByType: Record<MysteryType, MysterySet> = {
  joyful: joyful as MysterySet,
  sorrowful: sorrowful as MysterySet,
  glorious: glorious as MysterySet,
  luminous: luminous as MysterySet,
};

// Localized mystery titles and scripture
// In a full implementation, these would be in separate JSON files per language
const localizedNames: Record<Language, Record<MysteryType, string>> = {
  en: {
    joyful: 'Joyful Mysteries',
    sorrowful: 'Sorrowful Mysteries',
    glorious: 'Glorious Mysteries',
    luminous: 'Luminous Mysteries',
  },
  es: {
    joyful: 'Misterios Gozosos',
    sorrowful: 'Misterios Dolorosos',
    glorious: 'Misterios Gloriosos',
    luminous: 'Misterios Luminosos',
  },
  pt: {
    joyful: 'Mistérios Gozosos',
    sorrowful: 'Mistérios Dolorosos',
    glorious: 'Mistérios Gloriosos',
    luminous: 'Mistérios Luminosos',
  },
  tl: {
    joyful: 'Mga Misteryo ng Tuwa',
    sorrowful: 'Mga Misteryo ng Hapis',
    glorious: 'Mga Misteryo ng Luwalhati',
    luminous: 'Mga Misteryo ng Liwanag',
  },
};

export async function getMysteries(
  type: MysteryType,
  language: Language = 'en'
): Promise<MysterySet> {
  const mysteries = mysteriesByType[type];

  // Return with localized name
  return {
    ...mysteries,
    name: localizedNames[language]?.[type] || mysteries.name,
  };
}

export function getMysteriesSync(
  type: MysteryType,
  language: Language = 'en'
): MysterySet {
  const mysteries = mysteriesByType[type];

  return {
    ...mysteries,
    name: localizedNames[language]?.[type] || mysteries.name,
  };
}

export function getMysteryName(type: MysteryType, language: Language = 'en'): string {
  return localizedNames[language]?.[type] || localizedNames.en[type];
}

export default mysteriesByType;
