<script setup lang="ts">
import { Plus } from 'lucide-vue-next';

const { t } = useI18n();

const items = ['accuracy', 'foods', 'free', 'privacy', 'cancel', 'languages'] as const;
</script>

<template>
  <section id="faq" class="py-20 sm:py-28">
    <div class="container-page max-w-3xl">
      <SectionHeading :eyebrow="t('nav.faq')" :title="t('faq.title')" />

      <div class="mt-12 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        <details v-for="item in items" :key="item" v-reveal class="group py-5">
          <summary
            class="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-[17px] font-semibold tracking-tight [&::-webkit-details-marker]:hidden"
          >
            {{ t(`faq.${item}.q`) }}
            <Plus
              class="size-5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-45 group-open:text-brand-600"
              aria-hidden="true"
            />
          </summary>
          <p class="mt-3 pr-9 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{{ t(`faq.${item}.a`) }}</p>
        </details>
      </div>
    </div>
  </section>
</template>
