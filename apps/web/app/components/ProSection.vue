<script setup lang="ts">
import { Check, Crown } from 'lucide-vue-next';

const { t } = useI18n();
const sectionLink = useSectionLink();

const items = ['scan', 'multi', 'chef', 'chat', 'health', 'feast'] as const;
</script>

<template>
  <section id="pro" class="bg-zinc-50 py-20 sm:py-28 dark:bg-zinc-900/30">
    <div class="container-page grid items-center gap-12 lg:grid-cols-2">
      <div v-reveal class="text-center lg:text-left">
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"
        >
          <Crown class="size-3.5" aria-hidden="true" />
          {{ t('pro.badge') }}
        </span>
        <h2 class="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{{ t('pro.title') }}</h2>
        <p class="mx-auto mt-4 max-w-lg text-lg text-pretty text-zinc-600 lg:mx-0 dark:text-zinc-400">
          {{ t('pro.subtitle') }}
        </p>
        <p class="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-zinc-500 lg:mx-0">{{ t('pro.note') }}</p>
      </div>

      <div
        v-reveal="100"
        class="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-900/5 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/30"
      >
        <ul class="space-y-4">
          <li v-for="item in items" :key="item" class="flex items-start gap-3">
            <span class="brand-gradient mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-white">
              <Check class="size-3.5" stroke-width="3" aria-hidden="true" />
            </span>
            <span class="text-[15px] leading-relaxed">{{ t(`pro.items.${item}`) }}</span>
          </li>
        </ul>
        <NuxtLink
          :to="sectionLink('download')"
          class="brand-gradient mt-8 flex h-12 items-center justify-center rounded-2xl text-[15px] font-semibold text-white shadow-lg shadow-brand-700/25 transition hover:brightness-110"
        >
          {{ t('pro.trial') }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
