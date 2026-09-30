<script setup lang="ts">
import { Menu, X } from 'lucide-vue-next';

const { t } = useI18n();
const localePath = useLocalePath();
const sectionLink = useSectionLink();
const route = useRoute();

const open = ref(false);
const scrolled = ref(false);

watch(() => route.fullPath, () => (open.value = false));

function onScroll() {
  scrolled.value = window.scrollY > 8;
}

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b transition-colors duration-300"
    :class="
      scrolled || open
        ? 'border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80'
        : 'border-transparent bg-transparent'
    "
  >
    <div class="container-page flex h-16 items-center gap-4">
      <NuxtLink :to="localePath('/')" class="flex items-center gap-2.5" :aria-label="t('nav.home')">
        <BrandLogo size="sm" />
        <span class="text-[17px] font-bold tracking-tight">CaloSnap</span>
      </NuxtLink>

      <nav class="ml-6 hidden items-center gap-1 lg:flex">
        <NuxtLink
          v-for="id in SECTIONS"
          :key="id"
          :to="sectionLink(id)"
          class="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
        >
          {{ t(`nav.${id}`) }}
        </NuxtLink>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <div class="hidden sm:block">
          <LangSelect />
        </div>
        <ThemeToggle />
        <NuxtLink
          :to="sectionLink('download')"
          class="brand-gradient hidden h-9 items-center rounded-full px-4 text-sm font-semibold text-white shadow-sm shadow-brand-700/25 transition hover:brightness-110 md:inline-flex"
        >
          {{ t('nav.download') }}
        </NuxtLink>
        <button
          type="button"
          class="inline-flex size-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 lg:hidden dark:border-zinc-800 dark:text-zinc-300"
          :aria-label="t('nav.menu')"
          :aria-expanded="open"
          aria-controls="mobile-nav"
          @click="open = !open"
        >
          <X v-if="open" class="size-4" aria-hidden="true" />
          <Menu v-else class="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <nav v-if="open" id="mobile-nav" class="container-page pb-5 lg:hidden">
        <div class="flex flex-col gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <NuxtLink
            v-for="id in SECTIONS"
            :key="id"
            :to="sectionLink(id)"
            class="rounded-xl px-3 py-2.5 text-[15px] font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            @click="open = false"
          >
            {{ t(`nav.${id}`) }}
          </NuxtLink>
          <div class="mt-2 flex items-center gap-2 px-1">
            <div class="sm:hidden">
              <LangSelect align="left" />
            </div>
            <NuxtLink
              :to="sectionLink('download')"
              class="brand-gradient inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-white"
              @click="open = false"
            >
              {{ t('nav.download') }}
            </NuxtLink>
          </div>
        </div>
      </nav>
    </Transition>
  </header>
</template>
