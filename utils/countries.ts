// Common countries with their flag emojis
export const COUNTRIES: Record<string, { name: string; flag: string }> = {
  US: { name: 'United States', flag: '🇺🇸' },
  MX: { name: 'Mexico', flag: '🇲🇽' },
  BR: { name: 'Brazil', flag: '🇧🇷' },
  PH: { name: 'Philippines', flag: '🇵🇭' },
  ES: { name: 'Spain', flag: '🇪🇸' },
  IT: { name: 'Italy', flag: '🇮🇹' },
  PT: { name: 'Portugal', flag: '🇵🇹' },
  FR: { name: 'France', flag: '🇫🇷' },
  DE: { name: 'Germany', flag: '🇩🇪' },
  PL: { name: 'Poland', flag: '🇵🇱' },
  IE: { name: 'Ireland', flag: '🇮🇪' },
  GB: { name: 'United Kingdom', flag: '🇬🇧' },
  CA: { name: 'Canada', flag: '🇨🇦' },
  AR: { name: 'Argentina', flag: '🇦🇷' },
  CO: { name: 'Colombia', flag: '🇨🇴' },
  PE: { name: 'Peru', flag: '🇵🇪' },
  VE: { name: 'Venezuela', flag: '🇻🇪' },
  CL: { name: 'Chile', flag: '🇨🇱' },
  EC: { name: 'Ecuador', flag: '🇪🇨' },
  GT: { name: 'Guatemala', flag: '🇬🇹' },
  CU: { name: 'Cuba', flag: '🇨🇺' },
  DO: { name: 'Dominican Republic', flag: '🇩🇴' },
  HN: { name: 'Honduras', flag: '🇭🇳' },
  SV: { name: 'El Salvador', flag: '🇸🇻' },
  NI: { name: 'Nicaragua', flag: '🇳🇮' },
  CR: { name: 'Costa Rica', flag: '🇨🇷' },
  PA: { name: 'Panama', flag: '🇵🇦' },
  PR: { name: 'Puerto Rico', flag: '🇵🇷' },
  NG: { name: 'Nigeria', flag: '🇳🇬' },
  KE: { name: 'Kenya', flag: '🇰🇪' },
  UG: { name: 'Uganda', flag: '🇺🇬' },
  TZ: { name: 'Tanzania', flag: '🇹🇿' },
  ZA: { name: 'South Africa', flag: '🇿🇦' },
  IN: { name: 'India', flag: '🇮🇳' },
  KR: { name: 'South Korea', flag: '🇰🇷' },
  VN: { name: 'Vietnam', flag: '🇻🇳' },
  ID: { name: 'Indonesia', flag: '🇮🇩' },
  AU: { name: 'Australia', flag: '🇦🇺' },
  NZ: { name: 'New Zealand', flag: '🇳🇿' },
  VA: { name: 'Vatican City', flag: '🇻🇦' },
  // Default for unknown
  UN: { name: 'Unknown', flag: '🌍' },
};

/**
 * Get country info by code
 */
export function getCountry(code: string): { name: string; flag: string } {
  return COUNTRIES[code.toUpperCase()] || COUNTRIES.UN;
}

/**
 * Get country flag emoji by code
 */
export function getCountryFlag(code: string): string {
  return getCountry(code).flag;
}

/**
 * Get country name by code
 */
export function getCountryName(code: string): string {
  return getCountry(code).name;
}

/**
 * Get all countries as an array for selection
 */
export function getCountryList(): Array<{ code: string; name: string; flag: string }> {
  return Object.entries(COUNTRIES)
    .filter(([code]) => code !== 'UN')
    .map(([code, { name, flag }]) => ({ code, name, flag }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
