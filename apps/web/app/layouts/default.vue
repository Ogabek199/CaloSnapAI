<script setup lang="ts">
const { t, locale } = useI18n();
const { siteUrl } = useRuntimeConfig().public;
const head = useLocaleHead({ dir: true, lang: true, seo: true });

const ogImage = computed(() => `${siteUrl}/og/${locale.value}.png`);

useHead(() => ({
  htmlAttrs: { lang: head.value.htmlAttrs?.lang, dir: head.value.htmlAttrs?.dir },
  link: head.value.link ?? [],
  meta: head.value.meta ?? [],
}));

useSeoMeta({
  ogType: 'website',
  ogSiteName: 'CaloSnap',
  ogImage: () => ogImage.value,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/png',
  ogImageAlt: () => t('meta.title'),
  twitterCard: 'summary_large_image',
  twitterImage: () => ogImage.value,
  twitterImageAlt: () => t('meta.title'),
});
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <SiteHeader />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
