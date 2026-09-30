<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next';

const colorMode = useColorMode();
const { t } = useI18n();

function toggle() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
}
</script>

<template>
  <button
    type="button"
    class="inline-flex size-9 items-center justify-center rounded-full border border-zinc-200 bg-white/70 text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
    :aria-label="t('theme.toggle')"
    :title="t('theme.toggle')"
    @click="toggle"
  >
    <ClientOnly>
      <Sun v-if="colorMode.value === 'dark'" class="size-4" aria-hidden="true" />
      <Moon v-else class="size-4" aria-hidden="true" />
      <template #fallback>
        <span class="size-4" />
      </template>
    </ClientOnly>
  </button>
</template>
