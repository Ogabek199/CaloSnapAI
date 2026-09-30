<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <section id="download" class="pb-20 sm:pb-28">
    <div class="container-page">
      <div
        v-reveal
        class="relative overflow-hidden rounded-[2rem] bg-zinc-900 px-6 py-14 text-center text-white sm:px-12 sm:py-16 dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800"
      >
        <div
          class="brand-gradient pointer-events-none absolute -top-40 left-1/2 size-96 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          aria-hidden="true"
        />
        <div class="relative">
          <BrandLogo size="lg" class="mx-auto" />
          <h2 class="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{{ t('cta.title') }}</h2>
          <p class="mx-auto mt-4 max-w-lg text-lg text-zinc-300">{{ t('cta.subtitle') }}</p>
          <StoreBadges inverted class="mt-8 justify-center" />
        </div>
      </div>
    </div>
  </section>
</template>
