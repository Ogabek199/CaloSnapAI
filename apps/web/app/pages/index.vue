<script setup lang="ts">
const { t, locale, locales } = useI18n();
const { siteUrl, appStoreUrl, playStoreUrl } = useRuntimeConfig().public;
const localePath = useLocalePath();

const FAQ_KEYS = ['accuracy', 'foods', 'free', 'privacy', 'cancel', 'languages'] as const;

useSeoMeta({
  title: () => t('meta.title'),
  description: () => t('meta.description'),
  ogTitle: () => t('meta.title'),
  ogDescription: () => t('meta.description'),
  twitterTitle: () => t('meta.title'),
  twitterDescription: () => t('meta.description'),
});

const structuredData = computed(() => {
  const pageUrl = `${siteUrl}${localePath('/') === '/' ? '' : localePath('/')}`;
  const languages = locales.value.map((l) => l.language);
  const organizationId = `${siteUrl}/#organization`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: 'CaloSnap',
        url: siteUrl,
        logo: `${siteUrl}/icon-512.png`,
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: 'CaloSnap',
        url: siteUrl,
        inLanguage: languages,
        publisher: { '@id': organizationId },
      },
      {
        '@type': 'MobileApplication',
        name: 'CaloSnap',
        description: t('meta.description'),
        url: pageUrl,
        image: `${siteUrl}/og/${locale.value}.png`,
        applicationCategory: 'HealthApplication',
        operatingSystem: 'iOS, Android',
        inLanguage: languages,
        publisher: { '@id': organizationId },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        ...(appStoreUrl || playStoreUrl ? { sameAs: [appStoreUrl, playStoreUrl].filter(Boolean) } : {}),
      },
      {
        '@type': 'FAQPage',
        inLanguage: locales.value.find((l) => l.code === locale.value)?.language,
        mainEntity: FAQ_KEYS.map((key) => ({
          '@type': 'Question',
          name: t(`faq.${key}.q`),
          acceptedAnswer: { '@type': 'Answer', text: t(`faq.${key}.a`) },
        })),
      },
    ],
  };
});

useHead(() => ({
  script: [{ key: 'ld-json', type: 'application/ld+json', innerHTML: JSON.stringify(structuredData.value) }],
}));
</script>

<template>
  <div>
    <HeroSection />
    <FeatureGrid />
    <HowItWorks />
    <AiSection />
    <ProSection />
    <FaqSection />
    <DownloadCta />
  </div>
</template>
