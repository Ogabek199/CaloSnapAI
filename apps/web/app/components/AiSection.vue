<script setup lang="ts">
import { ChefHat, HeartPulse, Info, MessageCircleHeart } from 'lucide-vue-next';

const { t } = useI18n();

const items = [
  { id: 'chef', icon: ChefHat },
  { id: 'nutritionist', icon: MessageCircleHeart },
  { id: 'health', icon: HeartPulse },
] as const;
</script>

<template>
  <section id="ai" class="py-20 sm:py-28">
    <div class="container-page">
      <div v-reveal class="brand-gradient relative overflow-hidden rounded-[2rem] px-6 py-14 text-white sm:px-12 sm:py-16">
        <div class="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div class="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-black/10 blur-3xl" aria-hidden="true" />

        <div class="relative mx-auto max-w-2xl text-center">
          <p class="text-sm font-semibold text-white/80">{{ t('ai.badge') }}</p>
          <h2 class="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{{ t('ai.title') }}</h2>
          <p class="mt-4 text-lg text-pretty text-white/85">{{ t('ai.subtitle') }}</p>
        </div>

        <div class="relative mt-12 grid gap-4 md:grid-cols-3">
          <article
            v-for="(item, i) in items"
            :key="item.id"
            v-reveal="i * 80"
            class="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm"
          >
            <span class="flex size-11 items-center justify-center rounded-2xl bg-white text-brand-700">
              <component :is="item.icon" class="size-5" aria-hidden="true" />
            </span>
            <h3 class="mt-5 text-lg font-semibold tracking-tight">{{ t(`ai.${item.id}.title`) }}</h3>
            <p class="mt-2 text-[15px] leading-relaxed text-white/85">{{ t(`ai.${item.id}.text`) }}</p>
          </article>
        </div>

        <p class="relative mx-auto mt-8 flex max-w-2xl items-start justify-center gap-2 text-center text-sm text-white/75">
          <Info class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {{ t('ai.disclaimer') }}
        </p>
      </div>
    </div>
  </section>
</template>
