import { MysteryType } from '../types';
import { MYSTERIES_BY_DAY, MYSTERY_NAMES, DAY_NAMES } from '../constants';

/**
 * Get today's mystery type based on the day of the week
 */
export function getTodaysMysteryType(): MysteryType {
  const dayOfWeek = new Date().getDay();
  return MYSTERIES_BY_DAY[dayOfWeek];
}

/**
 * Get the mystery type for a specific date
 */
export function getMysteryTypeForDate(date: Date): MysteryType {
  const dayOfWeek = date.getDay();
  return MYSTERIES_BY_DAY[dayOfWeek];
}

/**
 * Get the display name for a mystery type
 */
export function getMysteryDisplayName(type: MysteryType): string {
  return MYSTERY_NAMES[type];
}

/**
 * Get the day name for a day index (0 = Sunday)
 */
export function getDayName(dayIndex: number): string {
  return DAY_NAMES[dayIndex] || 'Unknown';
}

/**
 * Get today's day name
 */
export function getTodaysDayName(): string {
  const dayOfWeek = new Date().getDay();
  return DAY_NAMES[dayOfWeek];
}

/**
 * Check if it's a liturgical season that might override the default mysteries
 * (Advent, Lent, Easter season)
 */
export function getLiturgicalSeasonOverride(): MysteryType | null {
  const now = new Date();
  const year = now.getFullYear();

  // Calculate Easter (simplified - actual calculation is complex)
  // This is the Computus algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month, day);

  // Lent: 46 days before Easter (40 days + 6 Sundays)
  const lentStart = new Date(easter);
  lentStart.setDate(lentStart.getDate() - 46);

  // Easter Season: Easter to Pentecost (50 days)
  const pentecost = new Date(easter);
  pentecost.setDate(pentecost.getDate() + 49);

  // Check if we're in Lent (recommend Sorrowful)
  if (now >= lentStart && now < easter) {
    return 'sorrowful';
  }

  // Check if we're in Easter Season (recommend Glorious)
  if (now >= easter && now <= pentecost) {
    return 'glorious';
  }

  // Advent: ~4 weeks before Christmas (simplified: Dec 1-24)
  if (now.getMonth() === 11 && now.getDate() < 25) {
    return 'joyful';
  }

  return null;
}

/**
 * Get recommended mystery for today, considering liturgical seasons
 */
export function getRecommendedMystery(): MysteryType {
  const override = getLiturgicalSeasonOverride();
  return override || getTodaysMysteryType();
}
