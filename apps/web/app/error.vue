<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps<{ error: NuxtError }>();

const { t } = useI18n();
const localePath = useLocalePath();

useSeoMeta({ title: () => `${t('notFound.title')} — CaloSnap`, robots: 'noindex' });
</script>

<template>
  <NuxtLayout>
    <div class="container-page flex flex-col items-center py-28 text-center">
      <p class="text-gradient text-7xl font-extrabold tracking-tight">{{ error.statusCode || 404 }}</p>
      <h1 class="mt-6 text-2xl font-bold tracking-tight">{{ t('notFound.title') }}</h1>
      <p class="mt-3 max-w-md text-zinc-600 dark:text-zinc-400">{{ t('notFound.text') }}</p>
      <NuxtLink
        :to="localePath('/')"
        class="brand-gradient mt-8 inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold text-white"
      >
        {{ t('legal.back') }}
      </NuxtLink>
    </div>
  </NuxtLayout>
</template>
