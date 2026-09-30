<script setup lang="ts">
defineProps<{ eyebrow?: string; title: string; subtitle?: string }>();
</script>

<template>
  <div v-reveal class="mx-auto max-w-2xl text-center">
    <p v-if="eyebrow" class="text-sm font-semibold text-brand-600 dark:text-brand-400">{{ eyebrow }}</p>
    <h2 class="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{{ title }}</h2>
    <p v-if="subtitle" class="mt-4 text-lg text-zinc-600 text-pretty dark:text-zinc-400">{{ subtitle }}</p>
  </div>
</template>
