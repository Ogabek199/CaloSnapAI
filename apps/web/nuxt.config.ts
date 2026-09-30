import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL || 'https://calosnap-ai.uz').replace(/\/$/, '');

const locales = [
  { code: 'uz', language: 'uz-UZ', name: 'O‘zbekcha', file: 'uz.json' },
  { code: 'ru', language: 'ru-RU', name: 'Русский', file: 'ru.json' },
  { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
  { code: 'tr', language: 'tr-TR', name: 'Türkçe', file: 'tr.json' },
  { code: 'kk', language: 'kk-KZ', name: 'Қазақша', file: 'kk.json' },
  { code: 'ko', language: 'ko-KR', name: '한국어', file: 'ko.json' },
  { code: 'es', language: 'es-ES', name: 'Español', file: 'es.json' },
  { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
  { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.json' },
];

const pages = ['', '/privacy', '/terms', '/delete-account'];
const prerenderRoutes = locales.flatMap(({ code }) =>
  pages.map((p) => (code === 'uz' ? p || '/' : `/${code}${p}`)),
);

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: false },

  modules: ['@nuxtjs/i18n', '@nuxtjs/color-mode', '@nuxt/fonts', '@nuxtjs/sitemap'],

  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },

  alias: {
    '@eda/legal': fileURLToPath(new URL('../../packages/legal/src/index.ts', import.meta.url)),
  },

  app: {
    head: {
      meta: [
        { name: 'theme-color', content: '#1A9B6C' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'application-name', content: 'CaloSnap' },
        { name: 'apple-mobile-web-app-title', content: 'CaloSnap' },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1' },
      ],
      link: [
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', type: 'image/png', sizes: '64x64', href: '/favicon.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      siteUrl,
      appStoreUrl: '',
      playStoreUrl: '',
      telegramUrl: 'https://t.me/otaxonov_o17',
    },
  },

  site: { url: siteUrl, name: 'CaloSnap', defaultLocale: 'uz' },

  sitemap: {
    exclude: ['/200', '/404'],
  },

  i18n: {
    baseUrl: siteUrl,
    defaultLocale: 'uz',
    strategy: 'prefix_except_default',
    locales,
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'calosnap_lang',
      redirectOn: 'root',
      fallbackLocale: 'en',
    },
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
    storageKey: 'calosnap-theme',
  },

  fonts: {
    defaults: {
      weights: [400, 500, 600, 700, 800],
      subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
    },
    families: [{ name: 'Inter', provider: 'google' }],
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: prerenderRoutes,
    },
  },
});
