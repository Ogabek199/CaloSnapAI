<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next';

const { t } = useI18n();
</script>

<template>
  <section class="relative overflow-hidden">
    <div
      class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-brand-50 to-transparent dark:from-brand-950/40"
    />
    <div class="container-page grid items-center gap-14 pt-10 pb-20 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:pt-20 lg:pb-28">
      <div class="animate-fade-up text-center lg:text-left">
        <span
          class="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300"
        >
          <Sparkles class="size-3.5" aria-hidden="true" />
          {{ t('hero.badge') }}
        </span>
        <h1 class="mt-6 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {{ t('hero.title') }}
          <span class="text-gradient block pb-1">{{ t('hero.titleAccent') }}</span>
        </h1>
        <p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 lg:mx-0 dark:text-zinc-400">
          {{ t('hero.subtitle') }}
        </p>
        <StoreBadges class="mt-9 justify-center lg:justify-start" />
        <p class="mt-4 text-sm text-zinc-500">{{ t('hero.note') }}</p>
      </div>

      <div class="animate-fade-up [animation-delay:150ms]">
        <PhoneMockup />
      </div>
    </div>
  </section>
</template>
