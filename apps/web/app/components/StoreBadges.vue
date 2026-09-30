<script setup lang="ts">
withDefaults(defineProps<{ inverted?: boolean }>(), { inverted: false });

const { t } = useI18n();
const { appStoreUrl, playStoreUrl } = useRuntimeConfig().public;

const stores = computed(() => [
  { id: 'apple', name: 'App Store', caption: t('store.downloadOn'), url: appStoreUrl },
  { id: 'google', name: 'Google Play', caption: t('store.getItOn'), url: playStoreUrl },
]);
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <component
      :is="store.url ? 'a' : 'span'"
      v-for="store in stores"
      :key="store.id"
      :href="store.url || undefined"
      :target="store.url ? '_blank' : undefined"
      :rel="store.url ? 'noopener' : undefined"
      :aria-disabled="store.url ? undefined : 'true'"
      class="group relative inline-flex h-14 min-w-[172px] items-center gap-3 rounded-2xl px-4 transition"
      :class="[
        inverted
          ? 'bg-white text-zinc-900 hover:bg-zinc-100'
          : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200',
        store.url ? 'cursor-pointer' : 'cursor-default',
      ]"
    >
      <svg v-if="store.id === 'apple'" viewBox="0 0 24 24" class="size-7 shrink-0" fill="currentColor" aria-hidden="true">
        <path
          d="M16.37 12.64c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-2.99-.79-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.89 1.15 9.14.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.39-.92-2.4-3.66ZM14.1 5.9c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.27Z"
        />
      </svg>
      <svg v-else viewBox="0 0 24 24" class="size-6 shrink-0" aria-hidden="true">
        <path fill="#00D7FE" d="M3.6 1.8c-.3.3-.5.8-.5 1.4v17.6c0 .6.2 1.1.5 1.4l.1.1 9.9-9.9v-.2L3.7 1.7l-.1.1Z" />
        <path fill="#FFCE00" d="m16.9 15.7-3.3-3.3v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-3.9 2.2h-.1Z" />
        <path fill="#FF3A44" d="m17 15.6-3.4-3.4L3.6 22.2c.4.4 1 .4 1.7 0L17 15.6" />
        <path fill="#00F076" d="M17 8.8 5.3 2.1c-.7-.4-1.3-.3-1.7.1l10 10L17 8.8Z" />
      </svg>
      <span class="flex flex-col leading-tight">
        <span class="text-[11px] opacity-75">{{ store.url ? store.caption : t('store.soon') }}</span>
        <span class="text-[17px] font-semibold tracking-tight">{{ store.name }}</span>
      </span>
    </component>
  </div>
</template>
