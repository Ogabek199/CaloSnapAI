<script setup lang="ts">
import { Camera, NotebookPen, PartyPopper, ScanBarcode, ShieldCheck, Target } from 'lucide-vue-next';

const { t } = useI18n();

const items = [
  { id: 'scan', icon: Camera },
  { id: 'barcode', icon: ScanBarcode },
  { id: 'diary', icon: NotebookPen },
  { id: 'goal', icon: Target },
  { id: 'feast', icon: PartyPopper },
  { id: 'secure', icon: ShieldCheck },
] as const;
</script>

<template>
  <section id="features" class="py-20 sm:py-28">
    <div class="container-page">
      <SectionHeading :eyebrow="t('nav.features')" :title="t('features.title')" :subtitle="t('features.subtitle')" />

      <div class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="(item, i) in items"
          :key="item.id"
          v-reveal="(i % 3) * 80"
          class="group rounded-3xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-brand-800"
        >
          <span
            class="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:scale-105 dark:bg-brand-500/10 dark:text-brand-400"
          >
            <component :is="item.icon" class="size-5" aria-hidden="true" />
          </span>
          <h3 class="mt-5 text-lg font-semibold tracking-tight">{{ t(`features.${item.id}.title`) }}</h3>
          <p class="mt-2 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            {{ t(`features.${item.id}.text`) }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
