<script setup lang="ts">
import { Send } from 'lucide-vue-next';

const { t } = useI18n();
const localePath = useLocalePath();
const sectionLink = useSectionLink();
const { telegramUrl } = useRuntimeConfig().public;
const year = new Date().getFullYear();

const legal = [
  { to: '/privacy', key: 'footer.privacy' },
  { to: '/terms', key: 'footer.terms' },
  { to: '/delete-account', key: 'footer.deleteAccount' },
] as const;
</script>

<template>
  <footer class="border-t border-zinc-200 dark:border-zinc-800/80">
    <div class="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
      <div class="sm:col-span-2 lg:col-span-1">
        <NuxtLink :to="localePath('/')" class="inline-flex items-center gap-2.5">
          <BrandLogo size="sm" />
          <span class="text-[17px] font-bold tracking-tight">CaloSnap</span>
        </NuxtLink>
        <p class="mt-3 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">{{ t('footer.tagline') }}</p>
      </div>

      <div>
        <h3 class="text-sm font-semibold">{{ t('footer.product') }}</h3>
        <ul class="mt-4 space-y-2.5 text-sm">
          <li v-for="id in SECTIONS" :key="id">
            <NuxtLink
              :to="sectionLink(id)"
              class="text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              {{ t(`nav.${id}`) }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="text-sm font-semibold">{{ t('footer.legal') }}</h3>
        <ul class="mt-4 space-y-2.5 text-sm">
          <li v-for="item in legal" :key="item.to">
            <NuxtLink
              :to="localePath(item.to)"
              class="text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              {{ t(item.key) }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="text-sm font-semibold">{{ t('footer.contact') }}</h3>
        <a
          :href="telegramUrl"
          target="_blank"
          rel="noopener"
          class="mt-4 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
        >
          <Send class="size-4" aria-hidden="true" />
          {{ t('footer.telegram') }}
        </a>
      </div>
    </div>

    <div class="border-t border-zinc-200 dark:border-zinc-800/80">
      <p class="container-page py-6 text-xs text-zinc-500 dark:text-zinc-500">
        © {{ year }} CaloSnap. {{ t('footer.rights') }}
      </p>
    </div>
  </footer>
</template>
