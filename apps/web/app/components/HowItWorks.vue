<script setup lang="ts">
import { Camera, NotebookPen, Sparkles } from 'lucide-vue-next';

const { t } = useI18n();

const steps = [
  { id: 'snap', icon: Camera },
  { id: 'analyze', icon: Sparkles },
  { id: 'log', icon: NotebookPen },
] as const;
</script>

<template>
  <section id="how" class="bg-zinc-50 py-20 sm:py-28 dark:bg-zinc-900/30">
    <div class="container-page">
      <SectionHeading :eyebrow="t('nav.how')" :title="t('how.title')" :subtitle="t('how.subtitle')" />

      <div class="relative mt-14">
        <div
          class="absolute top-7 right-[16.66%] left-[16.66%] hidden h-px bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 md:block dark:from-brand-900 dark:via-brand-700 dark:to-brand-900"
          aria-hidden="true"
        />
        <ol class="relative grid gap-10 md:grid-cols-3 md:gap-6">
          <li v-for="(step, i) in steps" :key="step.id" v-reveal="i * 100" class="relative text-center">
            <span
              class="brand-gradient relative mx-auto flex size-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-brand-700/25"
            >
              <component :is="step.icon" class="size-6" aria-hidden="true" />
              <span
                class="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border-2 border-zinc-50 bg-zinc-900 text-[11px] font-bold text-white dark:border-zinc-950 dark:bg-white dark:text-zinc-900"
              >
                {{ i + 1 }}
              </span>
            </span>
            <h3 class="mt-6 text-lg font-semibold tracking-tight">{{ t(`how.${step.id}.title`) }}</h3>
            <p class="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              {{ t(`how.${step.id}.text`) }}
            </p>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>
