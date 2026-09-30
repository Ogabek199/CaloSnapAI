export const LEGAL_LANGS = ['uz', 'ru', 'en', 'tr', 'kk', 'ko', 'es', 'de', 'fr'] as const;
export type LegalLang = (typeof LEGAL_LANGS)[number];
export type LegalPage = 'privacy' | 'terms' | 'delete-account';

export const SUPPORT_TELEGRAM = 'otaxonov_o17';

export type Section = { h: string; p: string[] };
export type Doc = { title: string; intro: string; sections: Section[] };
export type LegalDocSet = Record<LegalPage, Doc>;

export const tgLink = (label: string) => `<a href="https://t.me/${SUPPORT_TELEGRAM}">${label}</a>`;
