import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '../../shared/i18n/translations';
import { intlLocale } from '../../shared/i18n/languages';

const RATES_URL = 'https://open.er-api.com/v6/latest/USD';
const RATES_STORAGE_KEY = 'fx-rates-usd-v1';
const RATES_TTL_MS = 12 * 60 * 60 * 1000;
const RATES_TIMEOUT_MS = 8000;

type UsdRates = Record<string, number>;

// Longest prefix wins, so '+998' is matched before '+99…' style shorter codes.
const DIAL_CURRENCY: Record<string, string> = {
  '+998': 'UZS', '+996': 'KGS', '+992': 'TJS', '+993': 'TMT', '+994': 'AZN',
  '+374': 'AMD', '+995': 'GEL', '+375': 'BYN', '+380': 'UAH', '+373': 'MDL',
  '+90': 'TRY', '+971': 'AED', '+966': 'SAR', '+974': 'QAR', '+965': 'KWD',
  '+973': 'BHD', '+968': 'OMR', '+972': 'ILS', '+98': 'IRR', '+93': 'AFN',
  '+92': 'PKR', '+91': 'INR', '+880': 'BDT', '+94': 'LKR', '+977': 'NPR',
  '+82': 'KRW', '+81': 'JPY', '+86': 'CNY', '+852': 'HKD', '+853': 'MOP',
  '+886': 'TWD', '+65': 'SGD', '+60': 'MYR', '+66': 'THB', '+84': 'VND',
  '+62': 'IDR', '+63': 'PHP', '+855': 'KHR', '+95': 'MMK',
  '+44': 'GBP', '+49': 'EUR', '+33': 'EUR', '+39': 'EUR', '+34': 'EUR',
  '+351': 'EUR', '+31': 'EUR', '+32': 'EUR', '+41': 'CHF', '+43': 'EUR',
  '+48': 'PLN', '+420': 'CZK', '+421': 'EUR', '+36': 'HUF', '+40': 'RON',
  '+359': 'BGN', '+30': 'EUR', '+385': 'EUR', '+381': 'RSD', '+46': 'SEK',
  '+47': 'NOK', '+45': 'DKK', '+358': 'EUR', '+353': 'EUR', '+370': 'EUR',
  '+371': 'EUR', '+372': 'EUR',
  '+1': 'USD', '+52': 'MXN', '+55': 'BRL', '+54': 'ARS', '+56': 'CLP',
  '+57': 'COP', '+51': 'PEN',
  '+20': 'EGP', '+212': 'MAD', '+234': 'NGN', '+27': 'ZAR', '+254': 'KES',
  '+61': 'AUD', '+64': 'NZD',
};

const DIAL_PREFIXES = Object.keys(DIAL_CURRENCY).sort((a, b) => b.length - a.length);

// Intl in Hermes renders these as bare ISO codes, so use the names people actually say.
const LOCAL_SUFFIX: Record<string, Partial<Record<Language, string>> & { default: string }> = {
  UZS: { uz: "so'm", ru: 'сум', kk: 'сум', default: 'UZS' },
  RUB: { uz: 'rubl', ru: '₽', default: '₽' },
  KZT: { uz: 'tenge', ru: '₸', kk: '₸', default: '₸' },
  KGS: { uz: 'som', ru: 'сом', kk: 'сом', default: 'KGS' },
  TJS: { uz: 'somoniy', ru: 'сомони', kk: 'сомони', default: 'TJS' },
};

/** Currency of the country the user registered their phone number in. */
export function currencyForPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const normalized = `+${phone.replace(/\D/g, '')}`;
  if (normalized.startsWith('+7')) {
    // Kazakhstan shares +7 with Russia; its mobile/landline ranges start with 6 or 7.
    return /^\+7[67]/.test(normalized) ? 'KZT' : 'RUB';
  }
  const prefix = DIAL_PREFIXES.find((p) => normalized.startsWith(p));
  return prefix ? DIAL_CURRENCY[prefix] : null;
}

let memoryRates: { rates: UsdRates; fetchedAt: number } | null = null;
let inflight: Promise<UsdRates | null> | null = null;

async function fetchRates(): Promise<UsdRates | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RATES_TIMEOUT_MS);
  try {
    const res = await fetch(RATES_URL, { signal: controller.signal });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.result === 'success' && body.rates ? (body.rates as UsdRates) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** USD-based exchange rates, cached for 12h; stale cache is still used when offline. */
export async function getUsdRates(): Promise<UsdRates | null> {
  if (memoryRates && Date.now() - memoryRates.fetchedAt < RATES_TTL_MS) return memoryRates.rates;
  if (inflight) return inflight;

  inflight = (async () => {
    let stored: { rates: UsdRates; fetchedAt: number } | null = memoryRates;
    if (!stored) {
      try {
        const raw = await AsyncStorage.getItem(RATES_STORAGE_KEY);
        stored = raw ? JSON.parse(raw) : null;
      } catch {
        stored = null;
      }
    }
    if (stored && Date.now() - stored.fetchedAt < RATES_TTL_MS) {
      memoryRates = stored;
      return stored.rates;
    }

    const fresh = await fetchRates();
    if (fresh) {
      memoryRates = { rates: fresh, fetchedAt: Date.now() };
      AsyncStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(memoryRates)).catch(() => {});
      return fresh;
    }
    if (stored) memoryRates = stored;
    return stored?.rates ?? null;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

function roundForDisplay(value: number): number {
  if (value >= 100_000) return Math.round(value / 1000) * 1000;
  if (value >= 10_000) return Math.round(value / 100) * 100;
  if (value >= 100) return Math.round(value);
  return Math.round(value * 100) / 100;
}

/**
 * "≈ 128 000 so'm" for a store price shown in another currency.
 * Null when the currencies match or a rate is missing, so nothing misleading is shown.
 */
export function formatApproxLocalPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string | null,
  rates: UsdRates | null,
  language: Language,
): string | null {
  if (!toCurrency || !rates || !amount) return null;
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (from === to) return null;
  const fromRate = from === 'USD' ? 1 : rates[from];
  const toRate = to === 'USD' ? 1 : rates[to];
  if (!fromRate || !toRate) return null;

  const value = roundForDisplay((amount / fromRate) * toRate);
  const locale = intlLocale(language);
  const suffix = LOCAL_SUFFIX[to];

  if (suffix) {
    const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
      .format(value)
      .replace(/,/g, ' ');
    return `≈ ${number} ${suffix[language] ?? suffix.default}`;
  }
  try {
    return `≈ ${new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: to,
      maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value)}`;
  } catch {
    return `≈ ${value} ${to}`;
  }
}
