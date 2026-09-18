export interface CountryItem {
  code: string;
  flag: string;
  name: string;
  maxDigits: number;
}

/**
 * Popular + regional country dial codes for phone signup.
 * Sorted: Uzbekistan first, then CIS / neighbors, then rest A–Z by name.
 */
export const COUNTRIES: CountryItem[] = [
  // Home / CIS
  { code: '+998', flag: '🇺🇿', name: "O'zbekiston", maxDigits: 9 },
  { code: '+7', flag: '🇷🇺', name: 'Rossiya', maxDigits: 10 },
  { code: '+7', flag: '🇰🇿', name: "Qozog'iston", maxDigits: 10 },
  { code: '+996', flag: '🇰🇬', name: "Qirg'iziston", maxDigits: 9 },
  { code: '+992', flag: '🇹🇯', name: 'Tojikiston', maxDigits: 9 },
  { code: '+993', flag: '🇹🇲', name: 'Turkmaniston', maxDigits: 8 },
  { code: '+994', flag: '🇦🇿', name: 'Ozarbayjon', maxDigits: 9 },
  { code: '+374', flag: '🇦🇲', name: 'Armaniston', maxDigits: 8 },
  { code: '+995', flag: '🇬🇪', name: 'Gruziya', maxDigits: 9 },
  { code: '+375', flag: '🇧🇾', name: 'Belarus', maxDigits: 9 },
  { code: '+380', flag: '🇺🇦', name: 'Ukraina', maxDigits: 9 },
  { code: '+373', flag: '🇲🇩', name: 'Moldova', maxDigits: 8 },

  // Nearby / popular destinations
  { code: '+90', flag: '🇹🇷', name: 'Turkiya', maxDigits: 10 },
  { code: '+971', flag: '🇦🇪', name: 'BAA (Dubai)', maxDigits: 9 },
  { code: '+966', flag: '🇸🇦', name: 'Saudiya Arabistoni', maxDigits: 9 },
  { code: '+974', flag: '🇶🇦', name: 'Qatar', maxDigits: 8 },
  { code: '+965', flag: '🇰🇼', name: 'Quvayt', maxDigits: 8 },
  { code: '+973', flag: '🇧🇭', name: 'Bahrayn', maxDigits: 8 },
  { code: '+968', flag: '🇴🇲', name: 'Ummon', maxDigits: 8 },
  { code: '+972', flag: '🇮🇱', name: 'Isroil', maxDigits: 9 },
  { code: '+98', flag: '🇮🇷', name: 'Eron', maxDigits: 10 },
  { code: '+93', flag: '🇦🇫', name: 'Afg‘oniston', maxDigits: 9 },
  { code: '+92', flag: '🇵🇰', name: 'Pokiston', maxDigits: 10 },
  { code: '+91', flag: '🇮🇳', name: 'Hindiston', maxDigits: 10 },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh', maxDigits: 10 },
  { code: '+94', flag: '🇱🇰', name: 'Shri-Lanka', maxDigits: 9 },
  { code: '+977', flag: '🇳🇵', name: 'Nepal', maxDigits: 10 },

  // East / SE Asia
  { code: '+82', flag: '🇰🇷', name: 'Janubiy Koreya', maxDigits: 10 },
  { code: '+81', flag: '🇯🇵', name: 'Yaponiya', maxDigits: 10 },
  { code: '+86', flag: '🇨🇳', name: 'Xitoy', maxDigits: 11 },
  { code: '+852', flag: '🇭🇰', name: 'Gonkong', maxDigits: 8 },
  { code: '+853', flag: '🇲🇴', name: 'Makao', maxDigits: 8 },
  { code: '+886', flag: '🇹🇼', name: 'Tayvan', maxDigits: 9 },
  { code: '+65', flag: '🇸🇬', name: 'Singapur', maxDigits: 8 },
  { code: '+60', flag: '🇲🇾', name: 'Malayziya', maxDigits: 9 },
  { code: '+66', flag: '🇹🇭', name: 'Tailand', maxDigits: 9 },
  { code: '+84', flag: '🇻🇳', name: 'Vyetnam', maxDigits: 9 },
  { code: '+62', flag: '🇮🇩', name: 'Indoneziya', maxDigits: 11 },
  { code: '+63', flag: '🇵🇭', name: 'Filippin', maxDigits: 10 },
  { code: '+855', flag: '🇰🇭', name: 'Kambodja', maxDigits: 9 },
  { code: '+95', flag: '🇲🇲', name: 'Myanma', maxDigits: 9 },

  // Europe
  { code: '+44', flag: '🇬🇧', name: 'Buyuk Britaniya', maxDigits: 10 },
  { code: '+49', flag: '🇩🇪', name: 'Germaniya', maxDigits: 11 },
  { code: '+33', flag: '🇫🇷', name: 'Fransiya', maxDigits: 9 },
  { code: '+39', flag: '🇮🇹', name: 'Italiya', maxDigits: 10 },
  { code: '+34', flag: '🇪🇸', name: 'Ispaniya', maxDigits: 9 },
  { code: '+351', flag: '🇵🇹', name: 'Portugaliya', maxDigits: 9 },
  { code: '+31', flag: '🇳🇱', name: 'Niderlandiya', maxDigits: 9 },
  { code: '+32', flag: '🇧🇪', name: 'Belgiya', maxDigits: 9 },
  { code: '+41', flag: '🇨🇭', name: 'Shveytsariya', maxDigits: 9 },
  { code: '+43', flag: '🇦🇹', name: 'Avstriya', maxDigits: 10 },
  { code: '+48', flag: '🇵🇱', name: 'Polsha', maxDigits: 9 },
  { code: '+420', flag: '🇨🇿', name: 'Chexiya', maxDigits: 9 },
  { code: '+421', flag: '🇸🇰', name: 'Slovakiya', maxDigits: 9 },
  { code: '+36', flag: '🇭🇺', name: 'Vengriya', maxDigits: 9 },
  { code: '+40', flag: '🇷🇴', name: 'Ruminiya', maxDigits: 9 },
  { code: '+359', flag: '🇧🇬', name: 'Bolgariya', maxDigits: 9 },
  { code: '+30', flag: '🇬🇷', name: 'Gretsiya', maxDigits: 10 },
  { code: '+385', flag: '🇭🇷', name: 'Xorvatiya', maxDigits: 9 },
  { code: '+381', flag: '🇷🇸', name: 'Serbiya', maxDigits: 9 },
  { code: '+46', flag: '🇸🇪', name: 'Shvetsiya', maxDigits: 9 },
  { code: '+47', flag: '🇳🇴', name: 'Norvegiya', maxDigits: 8 },
  { code: '+45', flag: '🇩🇰', name: 'Daniya', maxDigits: 8 },
  { code: '+358', flag: '🇫🇮', name: 'Finlyandiya', maxDigits: 10 },
  { code: '+353', flag: '🇮🇪', name: 'Irlandiya', maxDigits: 9 },
  { code: '+370', flag: '🇱🇹', name: 'Litva', maxDigits: 8 },
  { code: '+371', flag: '🇱🇻', name: 'Latviya', maxDigits: 8 },
  { code: '+372', flag: '🇪🇪', name: 'Estoniya', maxDigits: 8 },

  // Americas
  { code: '+1', flag: '🇺🇸', name: 'AQSH', maxDigits: 10 },
  { code: '+1', flag: '🇨🇦', name: 'Kanada', maxDigits: 10 },
  { code: '+52', flag: '🇲🇽', name: 'Meksika', maxDigits: 10 },
  { code: '+55', flag: '🇧🇷', name: 'Braziliya', maxDigits: 11 },
  { code: '+54', flag: '🇦🇷', name: 'Argentina', maxDigits: 10 },
  { code: '+56', flag: '🇨🇱', name: 'Chili', maxDigits: 9 },
  { code: '+57', flag: '🇨🇴', name: 'Kolumbiya', maxDigits: 10 },
  { code: '+51', flag: '🇵🇪', name: 'Peru', maxDigits: 9 },

  // Africa / Oceania
  { code: '+20', flag: '🇪🇬', name: 'Misr', maxDigits: 10 },
  { code: '+212', flag: '🇲🇦', name: 'Marokash', maxDigits: 9 },
  { code: '+234', flag: '🇳🇬', name: 'Nigeriya', maxDigits: 10 },
  { code: '+27', flag: '🇿🇦', name: 'Janubiy Afrika', maxDigits: 9 },
  { code: '+254', flag: '🇰🇪', name: 'Keniya', maxDigits: 9 },
  { code: '+61', flag: '🇦🇺', name: 'Avstraliya', maxDigits: 9 },
  { code: '+64', flag: '🇳🇿', name: 'Yangi Zelandiya', maxDigits: 9 },
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
