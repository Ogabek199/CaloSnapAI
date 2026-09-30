<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';
import {
  getLegalDoc,
  LEGAL_LANGS,
  LEGAL_UPDATED_AT,
  LEGAL_UPDATED_LABEL,
  type LegalLang,
  type LegalPage,
} from '@eda/legal';

const props = defineProps<{ page: LegalPage }>();

const { locale, t } = useI18n();
const localePath = useLocalePath();

const lang = computed<LegalLang>(() =>
  (LEGAL_LANGS as readonly string[]).includes(locale.value) ? (locale.value as LegalLang) : 'en',
);
const doc = computed(() => getLegalDoc(props.page, lang.value));

useSeoMeta({
  title: () => `${doc.value.title} — CaloSnap`,
  description: () => doc.value.intro,
  ogTitle: () => `${doc.value.title} — CaloSnap`,
  ogDescription: () => doc.value.intro,
  ogType: 'article',
  twitterTitle: () => `${doc.value.title} — CaloSnap`,
  twitterDescription: () => doc.value.intro,
});
</script>

<template>
  <article class="container-page max-w-3xl py-12 sm:py-16">
    <NuxtLink
      :to="localePath('/')"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      {{ t('legal.back') }}
    </NuxtLink>

    <h1 class="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">{{ doc.title }}</h1>
    <p class="mt-3 text-sm text-zinc-500">
      {{ LEGAL_UPDATED_LABEL[lang] }}: <time :datetime="LEGAL_UPDATED_AT">{{ LEGAL_UPDATED_AT }}</time>
    </p>
    <p class="mt-8 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">{{ doc.intro }}</p>

    <section v-for="section in doc.sections" :key="section.h" class="mt-10">
      <h2 class="text-xl font-semibold tracking-tight">{{ section.h }}</h2>
      <p
        v-for="(p, i) in section.p"
        :key="i"
        class="legal-p mt-3 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400"
        v-html="p"
      />
    </section>
  </article>
</template>

<style scoped>
.legal-p :deep(a) {
  color: var(--color-brand-600);
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
