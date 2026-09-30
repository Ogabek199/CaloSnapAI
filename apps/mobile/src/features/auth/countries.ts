export interface CountryItem {
  code: string;
  flag: string;
  /** ISO 3166-1 alpha-2, uppercase. */
  iso: string;
  /** Uzbek name. */
  name: string;
  maxDigits: number;
}

/**
 * Popular + regional country dial codes for phone signup.
 * Sorted: Uzbekistan first, then CIS / neighbors, then rest A–Z by name.
 */
export const COUNTRIES: CountryItem[] = [
  // Home / CIS
  { code: '+998', flag: '🇺🇿', iso: 'UZ', name: "O'zbekiston", maxDigits: 9 },
  { code: '+7', flag: '🇷🇺', iso: 'RU', name: 'Rossiya', maxDigits: 10 },
  { code: '+7', flag: '🇰🇿', iso: 'KZ', name: "Qozog'iston", maxDigits: 10 },
  { code: '+996', flag: '🇰🇬', iso: 'KG', name: "Qirg'iziston", maxDigits: 9 },
  { code: '+992', flag: '🇹🇯', iso: 'TJ', name: 'Tojikiston', maxDigits: 9 },
  { code: '+993', flag: '🇹🇲', iso: 'TM', name: 'Turkmaniston', maxDigits: 8 },
  { code: '+994', flag: '🇦🇿', iso: 'AZ', name: 'Ozarbayjon', maxDigits: 9 },
  { code: '+374', flag: '🇦🇲', iso: 'AM', name: 'Armaniston', maxDigits: 8 },
  { code: '+995', flag: '🇬🇪', iso: 'GE', name: 'Gruziya', maxDigits: 9 },
  { code: '+375', flag: '🇧🇾', iso: 'BY', name: 'Belarus', maxDigits: 9 },
  { code: '+380', flag: '🇺🇦', iso: 'UA', name: 'Ukraina', maxDigits: 9 },
  { code: '+373', flag: '🇲🇩', iso: 'MD', name: 'Moldova', maxDigits: 8 },

  // Nearby / popular destinations
  { code: '+90', flag: '🇹🇷', iso: 'TR', name: 'Turkiya', maxDigits: 10 },
  { code: '+971', flag: '🇦🇪', iso: 'AE', name: 'BAA (Dubai)', maxDigits: 9 },
  { code: '+966', flag: '🇸🇦', iso: 'SA', name: 'Saudiya Arabistoni', maxDigits: 9 },
  { code: '+974', flag: '🇶🇦', iso: 'QA', name: 'Qatar', maxDigits: 8 },
  { code: '+965', flag: '🇰🇼', iso: 'KW', name: 'Quvayt', maxDigits: 8 },
  { code: '+973', flag: '🇧🇭', iso: 'BH', name: 'Bahrayn', maxDigits: 8 },
  { code: '+968', flag: '🇴🇲', iso: 'OM', name: 'Ummon', maxDigits: 8 },
  { code: '+972', flag: '🇮🇱', iso: 'IL', name: 'Isroil', maxDigits: 9 },
  { code: '+98', flag: '🇮🇷', iso: 'IR', name: 'Eron', maxDigits: 10 },
  { code: '+93', flag: '🇦🇫', iso: 'AF', name: 'Afg‘oniston', maxDigits: 9 },
  { code: '+92', flag: '🇵🇰', iso: 'PK', name: 'Pokiston', maxDigits: 10 },
  { code: '+91', flag: '🇮🇳', iso: 'IN', name: 'Hindiston', maxDigits: 10 },
  { code: '+880', flag: '🇧🇩', iso: 'BD', name: 'Bangladesh', maxDigits: 10 },
  { code: '+94', flag: '🇱🇰', iso: 'LK', name: 'Shri-Lanka', maxDigits: 9 },
  { code: '+977', flag: '🇳🇵', iso: 'NP', name: 'Nepal', maxDigits: 10 },

  // East / SE Asia
  { code: '+82', flag: '🇰🇷', iso: 'KR', name: 'Janubiy Koreya', maxDigits: 10 },
  { code: '+81', flag: '🇯🇵', iso: 'JP', name: 'Yaponiya', maxDigits: 10 },
  { code: '+86', flag: '🇨🇳', iso: 'CN', name: 'Xitoy', maxDigits: 11 },
  { code: '+852', flag: '🇭🇰', iso: 'HK', name: 'Gonkong', maxDigits: 8 },
  { code: '+853', flag: '🇲🇴', iso: 'MO', name: 'Makao', maxDigits: 8 },
  { code: '+886', flag: '🇹🇼', iso: 'TW', name: 'Tayvan', maxDigits: 9 },
  { code: '+65', flag: '🇸🇬', iso: 'SG', name: 'Singapur', maxDigits: 8 },
  { code: '+60', flag: '🇲🇾', iso: 'MY', name: 'Malayziya', maxDigits: 9 },
  { code: '+66', flag: '🇹🇭', iso: 'TH', name: 'Tailand', maxDigits: 9 },
  { code: '+84', flag: '🇻🇳', iso: 'VN', name: 'Vyetnam', maxDigits: 9 },
  { code: '+62', flag: '🇮🇩', iso: 'ID', name: 'Indoneziya', maxDigits: 11 },
  { code: '+63', flag: '🇵🇭', iso: 'PH', name: 'Filippin', maxDigits: 10 },
  { code: '+855', flag: '🇰🇭', iso: 'KH', name: 'Kambodja', maxDigits: 9 },
  { code: '+95', flag: '🇲🇲', iso: 'MM', name: 'Myanma', maxDigits: 9 },

  // Europe
  { code: '+44', flag: '🇬🇧', iso: 'GB', name: 'Buyuk Britaniya', maxDigits: 10 },
  { code: '+49', flag: '🇩🇪', iso: 'DE', name: 'Germaniya', maxDigits: 11 },
  { code: '+33', flag: '🇫🇷', iso: 'FR', name: 'Fransiya', maxDigits: 9 },
  { code: '+39', flag: '🇮🇹', iso: 'IT', name: 'Italiya', maxDigits: 10 },
  { code: '+34', flag: '🇪🇸', iso: 'ES', name: 'Ispaniya', maxDigits: 9 },
  { code: '+351', flag: '🇵🇹', iso: 'PT', name: 'Portugaliya', maxDigits: 9 },
  { code: '+31', flag: '🇳🇱', iso: 'NL', name: 'Niderlandiya', maxDigits: 9 },
  { code: '+32', flag: '🇧🇪', iso: 'BE', name: 'Belgiya', maxDigits: 9 },
  { code: '+41', flag: '🇨🇭', iso: 'CH', name: 'Shveytsariya', maxDigits: 9 },
  { code: '+43', flag: '🇦🇹', iso: 'AT', name: 'Avstriya', maxDigits: 10 },
  { code: '+48', flag: '🇵🇱', iso: 'PL', name: 'Polsha', maxDigits: 9 },
  { code: '+420', flag: '🇨🇿', iso: 'CZ', name: 'Chexiya', maxDigits: 9 },
  { code: '+421', flag: '🇸🇰', iso: 'SK', name: 'Slovakiya', maxDigits: 9 },
  { code: '+36', flag: '🇭🇺', iso: 'HU', name: 'Vengriya', maxDigits: 9 },
  { code: '+40', flag: '🇷🇴', iso: 'RO', name: 'Ruminiya', maxDigits: 9 },
  { code: '+359', flag: '🇧🇬', iso: 'BG', name: 'Bolgariya', maxDigits: 9 },
  { code: '+30', flag: '🇬🇷', iso: 'GR', name: 'Gretsiya', maxDigits: 10 },
  { code: '+385', flag: '🇭🇷', iso: 'HR', name: 'Xorvatiya', maxDigits: 9 },
  { code: '+381', flag: '🇷🇸', iso: 'RS', name: 'Serbiya', maxDigits: 9 },
  { code: '+46', flag: '🇸🇪', iso: 'SE', name: 'Shvetsiya', maxDigits: 9 },
  { code: '+47', flag: '🇳🇴', iso: 'NO', name: 'Norvegiya', maxDigits: 8 },
  { code: '+45', flag: '🇩🇰', iso: 'DK', name: 'Daniya', maxDigits: 8 },
  { code: '+358', flag: '🇫🇮', iso: 'FI', name: 'Finlyandiya', maxDigits: 10 },
  { code: '+353', flag: '🇮🇪', iso: 'IE', name: 'Irlandiya', maxDigits: 9 },
  { code: '+370', flag: '🇱🇹', iso: 'LT', name: 'Litva', maxDigits: 8 },
  { code: '+371', flag: '🇱🇻', iso: 'LV', name: 'Latviya', maxDigits: 8 },
  { code: '+372', flag: '🇪🇪', iso: 'EE', name: 'Estoniya', maxDigits: 8 },

  // Americas
  { code: '+1', flag: '🇺🇸', iso: 'US', name: 'AQSH', maxDigits: 10 },
  { code: '+1', flag: '🇨🇦', iso: 'CA', name: 'Kanada', maxDigits: 10 },
  { code: '+52', flag: '🇲🇽', iso: 'MX', name: 'Meksika', maxDigits: 10 },
  { code: '+55', flag: '🇧🇷', iso: 'BR', name: 'Braziliya', maxDigits: 11 },
  { code: '+54', flag: '🇦🇷', iso: 'AR', name: 'Argentina', maxDigits: 10 },
  { code: '+56', flag: '🇨🇱', iso: 'CL', name: 'Chili', maxDigits: 9 },
  { code: '+57', flag: '🇨🇴', iso: 'CO', name: 'Kolumbiya', maxDigits: 10 },
  { code: '+51', flag: '🇵🇪', iso: 'PE', name: 'Peru', maxDigits: 9 },

  // Africa / Oceania
  { code: '+20', flag: '🇪🇬', iso: 'EG', name: 'Misr', maxDigits: 10 },
  { code: '+212', flag: '🇲🇦', iso: 'MA', name: 'Marokash', maxDigits: 9 },
  { code: '+234', flag: '🇳🇬', iso: 'NG', name: 'Nigeriya', maxDigits: 10 },
  { code: '+27', flag: '🇿🇦', iso: 'ZA', name: 'Janubiy Afrika', maxDigits: 9 },
  { code: '+254', flag: '🇰🇪', iso: 'KE', name: 'Keniya', maxDigits: 9 },
  { code: '+61', flag: '🇦🇺', iso: 'AU', name: 'Avstraliya', maxDigits: 9 },
  { code: '+64', flag: '🇳🇿', iso: 'NZ', name: 'Yangi Zelandiya', maxDigits: 9 },
];

/** Display formatting for the phone input. */
export function formatPhoneDisplay(val: string, country: CountryItem): string {
  const clean = val.replace(/\D/g, '').slice(0, country.maxDigits);
  if (country.code === '+998') {
    if (clean.length <= 2) return clean;
    if (clean.length <= 5) return `${clean.slice(0, 2)} ${clean.slice(2)}`;
    if (clean.length <= 7) return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5)}`;
    return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)}`;
  }
  if (country.code === '+7' || country.code === '+1') {
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 10)}`;
  }
  // Generic grouping: 3-3-rest
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
}

/** E.164-like phone for API: +998901234567 */
export function toE164(countryCode: string, digits: string): string {
  const code = countryCode.replace(/\D/g, '');
  const local = digits.replace(/\D/g, '');
  return `+${code}${local}`;
}
