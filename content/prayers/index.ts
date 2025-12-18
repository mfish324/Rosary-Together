import { Language, PrayerContent } from '../../types';

// Import all prayer content
import en from './en.json';
import es from './es.json';
import pt from './pt.json';
import tl from './tl.json';

const prayersByLanguage: Record<Language, PrayerContent> = {
  en: en as PrayerContent,
  es: es as PrayerContent,
  pt: pt as PrayerContent,
  tl: tl as PrayerContent,
};

export async function getPrayers(language: Language): Promise<PrayerContent> {
  return prayersByLanguage[language] || prayersByLanguage.en;
}

export function getPrayersSync(language: Language): PrayerContent {
  return prayersByLanguage[language] || prayersByLanguage.en;
}

export default prayersByLanguage;
