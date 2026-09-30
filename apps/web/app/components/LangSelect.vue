<script setup lang="ts">
import { Check, ChevronDown, Globe } from 'lucide-vue-next';

const props = withDefaults(defineProps<{ align?: 'left' | 'right' }>(), { align: 'right' });

const { locale, locales, setLocale, t } = useI18n();
const switchLocalePath = useSwitchLocalePath();

type Code = typeof locale.value;

const open = ref(false);
const active = ref(0);
const root = ref<HTMLElement>();
const button = ref<HTMLButtonElement>();
const options = ref<HTMLElement[]>([]);
const listId = useId();

const current = computed(() => locales.value.find((l) => l.code === locale.value));

const PANEL_CHROME = 48;
const VIEWPORT_GAP = 12;
const dropUp = ref(false);
const listMaxHeight = ref(420);

function placePanel() {
  const rect = button.value?.getBoundingClientRect();
  if (!rect) return;
  const below = window.innerHeight - rect.bottom - VIEWPORT_GAP;
  const above = rect.top - VIEWPORT_GAP;
  dropUp.value = below < 260 && above > below;
  listMaxHeight.value = Math.max(140, Math.min(420, (dropUp.value ? above : below) - PANEL_CHROME));
}

function openMenu(focusIndex = locales.value.findIndex((l) => l.code === locale.value)) {
  options.value = [];
  placePanel();
  open.value = true;
  active.value = Math.max(0, focusIndex);
  nextTick(() => options.value[active.value]?.focus());
}

function close(returnFocus = false) {
  open.value = false;
  if (returnFocus) button.value?.focus();
}

async function select(code: Code) {
  close(true);
  if (code !== locale.value) await setLocale(code);
}

function move(delta: number) {
  const count = locales.value.length;
  active.value = (active.value + delta + count) % count;
  options.value[active.value]?.focus();
}

function onListKeydown(e: KeyboardEvent) {
  const keys: Record<string, () => void> = {
    ArrowDown: () => move(1),
    ArrowUp: () => move(-1),
    Home: () => move(-active.value),
    End: () => move(locales.value.length - 1 - active.value),
    Escape: () => close(true),
    Tab: () => close(),
  };
  const handler = keys[e.key];
  if (!handler) return;
  if (e.key !== 'Tab') e.preventDefault();
  handler();
}

function onButtonKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    openMenu();
  }
}

function onPointerDown(e: PointerEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) close();
}

function onResize() {
  if (open.value) placePanel();
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('resize', onResize);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown);
  window.removeEventListener('resize', onResize);
});
</script>

<template>
  <div ref="root" class="relative">
    <button
      ref="button"
      type="button"
      class="inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white/70 pr-2.5 pl-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-zinc-700"
      :class="open && 'border-brand-300 ring-4 ring-brand-500/10 dark:border-brand-700'"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-label="`${t('lang.label')}: ${current?.name}`"
      @click="open ? close() : openMenu()"
      @keydown="onButtonKeydown"
    >
      <Globe class="size-4 text-zinc-500" aria-hidden="true" />
      <span>{{ current?.name }}</span>
      <ChevronDown
        class="size-4 text-zinc-500 transition-transform duration-200"
        :class="open && 'rotate-180'"
        aria-hidden="true"
      />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="scale-95 opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="scale-95 opacity-0"
    >
      <div
        v-if="open"
        class="absolute z-50 w-60 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40"
        :class="[
          dropUp ? 'bottom-full mb-2' : 'top-full mt-2',
          props.align === 'right' ? 'right-0' : 'left-0',
          {
            'origin-top-right': !dropUp && props.align === 'right',
            'origin-top-left': !dropUp && props.align === 'left',
            'origin-bottom-right': dropUp && props.align === 'right',
            'origin-bottom-left': dropUp && props.align === 'left',
          },
        ]"
      >
        <p class="px-3 pt-2 pb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
          {{ t('lang.label') }}
        </p>
        <ul
          :id="listId"
          role="listbox"
          :aria-label="t('lang.label')"
          class="overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
          :style="{ maxHeight: `${listMaxHeight}px` }"
          @keydown="onListKeydown"
        >
          <li v-for="(l, i) in locales" :key="l.code" role="presentation">
            <NuxtLink
              :ref="(el) => { if (el) options[i] = (el as { $el: HTMLElement }).$el }"
              :to="switchLocalePath(l.code)"
              role="option"
              :aria-selected="l.code === locale"
              :tabindex="i === active ? 0 : -1"
              class="group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm outline-none transition hover:bg-zinc-100 focus-visible:bg-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800"
              :class="l.code === locale ? 'text-brand-700 dark:text-brand-300' : 'text-zinc-700 dark:text-zinc-300'"
              @click.prevent="select(l.code)"
              @mouseenter="active = i"
            >
              <span
                class="flex h-6 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold tracking-wide uppercase transition"
                :class="
                  l.code === locale
                    ? 'brand-gradient text-white'
                    : 'bg-zinc-100 text-zinc-500 group-hover:bg-white dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-700'
                "
              >
                {{ l.code }}
              </span>
              <span class="flex-1 font-medium">{{ l.name }}</span>
              <Check v-if="l.code === locale" class="size-4" stroke-width="2.5" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
