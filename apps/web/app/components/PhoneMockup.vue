<script setup lang="ts">
import { BookOpen, Camera, ChefHat, House, MessageCircle, User } from 'lucide-vue-next';

const { t, localeProperties } = useI18n();

const eaten = 1240;
const goal = 1960;
const ringRadius = 63;
const circumference = 2 * Math.PI * ringRadius;

const REFERENCE_DAY = Date.UTC(2026, 8, 30);
const DAY_MS = 86_400_000;

const language = computed(() => localeProperties.value.language);
const num = computed(() => new Intl.NumberFormat(language.value));

const days = computed(() => {
  const weekday = new Intl.DateTimeFormat(language.value, { weekday: 'short', timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(REFERENCE_DAY - (6 - i) * DAY_MS);
    return {
      key: i,
      weekday: weekday.format(date).replace('.', ''),
      day: date.getUTCDate(),
      sunday: date.getUTCDay() === 0,
      selected: i === 6,
    };
  });
});

const macros = computed(() => [
  { label: t('mockup.protein'), value: 78, max: 120, color: '#2563EB' },
  { label: t('mockup.carbs'), value: 142, max: 220, color: '#D97706' },
  { label: t('mockup.fat'), value: 41, max: 65, color: '#DC2626' },
]);

const meals = computed(() => [
  {
    emoji: '🍳',
    tint: 'rgba(217,119,6,.10)',
    name: t('mockup.meal1'),
    meta: `${t('mockup.breakfast')} · 250g`,
    macros: `${t('mockup.protein')} 14g · ${t('mockup.carbs')} 58g · ${t('mockup.fat')} 9g`,
  },
  {
    emoji: '🍲',
    tint: 'rgba(26,155,108,.10)',
    name: t('mockup.meal2'),
    meta: `${t('mockup.lunch')} · 320g`,
    macros: `${t('mockup.protein')} 38g · ${t('mockup.carbs')} 22g · ${t('mockup.fat')} 18g`,
  },
]);

const tabs = computed(() => [
  { icon: House, label: t('mockup.tabHome'), active: true },
  { icon: BookOpen, label: t('mockup.tabDiary'), active: false },
  { icon: Camera, label: t('mockup.tabScan'), active: false },
  { icon: User, label: t('mockup.tabProfile'), active: false },
]);
</script>

<template>
  <div class="phone relative mx-auto [--s:0.66] sm:[--s:0.74] lg:[--s:0.8]" aria-hidden="true">
    <div class="brand-gradient absolute -inset-10 -z-10 rounded-full opacity-25 blur-3xl dark:opacity-20" />

    <div class="device">
      <span class="btn left-[-3px] top-[168px] h-[34px]" />
      <span class="btn left-[-3px] top-[228px] h-[62px]" />
      <span class="btn left-[-3px] top-[304px] h-[62px]" />
      <span class="btn right-[-3px] top-[250px] h-[98px]" />

      <div class="bezel">
        <div class="screen">
          <div class="status">
            <span class="time">9:41</span>
            <span class="flex items-center gap-[6px]">
              <svg width="19" height="12" viewBox="0 0 19 12" fill="#14171C">
                <rect x="0" y="7.5" width="3.2" height="4.5" rx="1" />
                <rect x="5.2" y="5" width="3.2" height="7" rx="1" />
                <rect x="10.4" y="2.5" width="3.2" height="9.5" rx="1" />
                <rect x="15.6" y="0" width="3.2" height="12" rx="1" />
              </svg>
              <svg width="17" height="12" viewBox="0 0 17 12" fill="#14171C">
                <path
                  d="M8.5 2.4c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8.5.7C5.7.7 3.2 1.8 1.3 3.6l1.2 1.2c1.6-1.5 3.7-2.4 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.2-1.2a6.9 6.9 0 0 0-9.6 0l1.2 1.2c1-.9 2.2-1.4 3.6-1.4Zm0 3.4c.5 0 1 .2 1.3.5L8.5 11 7.2 9.7c.3-.3.8-.5 1.3-.5Z"
                />
              </svg>
              <svg width="27" height="13" viewBox="0 0 27 13">
                <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" fill="none" stroke="#14171C" stroke-opacity=".35" />
                <rect x="2" y="2" width="20" height="9" rx="2.5" fill="#14171C" />
                <path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="#14171C" fill-opacity=".4" />
              </svg>
            </span>
          </div>
          <div class="island" />

          <div class="content">
            <div class="strip">
              <div
                v-for="d in days"
                :key="d.key"
                class="chip"
                :class="d.selected ? 'chip-selected' : 'chip-idle'"
              >
                <span
                  class="text-[10.5px] font-bold tracking-[0.4px] uppercase"
                  :style="{ color: d.selected ? 'rgba(255,255,255,.85)' : d.sunday ? '#E5484D' : '#8B939E' }"
                >
                  {{ d.weekday }}
                </span>
                <span class="text-[20px] font-extrabold tracking-[-0.5px] tabular-nums">{{ d.day }}</span>
                <span class="size-[5px] rounded-full" :class="d.selected ? 'bg-white' : 'bg-transparent'" />
              </div>
            </div>

            <section class="card">
              <p class="title">{{ t('mockup.balance') }}</p>
              <div class="mt-2 flex items-center">
                <div class="relative size-[140px] shrink-0">
                  <svg viewBox="0 0 140 140" class="size-full -rotate-90">
                    <circle cx="70" cy="70" :r="ringRadius" fill="none" stroke="#ECECE8" stroke-width="10" />
                    <circle
                      cx="70"
                      cy="70"
                      :r="ringRadius"
                      fill="none"
                      stroke="#1A9B6C"
                      stroke-width="10"
                      stroke-linecap="round"
                      :stroke-dasharray="circumference"
                      :stroke-dashoffset="circumference * (1 - eaten / goal)"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-[12px] font-medium text-[#8B939E]">{{ t('mockup.remaining') }}</span>
                    <span class="text-[28px] leading-[34px] font-bold tracking-[-0.8px]">{{ num.format(goal - eaten) }}</span>
                    <span class="text-[12px] font-medium text-[#8B939E]">kcal</span>
                  </div>
                </div>
                <div class="ml-5 min-w-0 flex-1">
                  <p class="text-[22px] leading-[26px] font-bold tracking-[-0.5px]">{{ num.format(eaten) }}</p>
                  <p class="mt-0.5 text-[12px] font-medium text-[#8B939E]">{{ t('mockup.consumed') }}</p>
                  <div class="my-3 h-px bg-[#E6E6E2]" />
                  <p class="text-[22px] leading-[26px] font-bold tracking-[-0.5px] text-[#D97706]">{{ num.format(goal) }}</p>
                  <p class="mt-0.5 text-[12px] font-medium text-[#8B939E]">{{ t('mockup.goalKcal') }}</p>
                </div>
              </div>
              <div class="mt-5 flex">
                <div v-for="m in macros" :key="m.label" class="mx-1 min-w-0 flex-1">
                  <p class="text-[15px] font-bold tracking-[-0.3px]">{{ m.value }}g</p>
                  <div class="mt-1.5 mb-1.5 h-[6px] overflow-hidden rounded-full bg-[#ECECE8]">
                    <div class="h-full rounded-full" :style="{ width: `${(m.value / m.max) * 100}%`, background: m.color }" />
                  </div>
                  <p class="truncate text-[12px] font-medium text-[#8B939E]">{{ m.label }}</p>
                </div>
              </div>
            </section>

            <p class="title mt-4 mb-2">{{ t('mockup.aiTools') }}</p>
            <div class="flex gap-3">
              <div
                v-for="tool in [
                  { icon: ChefHat, color: '#F59E0B', title: t('mockup.chef'), sub: t('mockup.chefSub') },
                  { icon: MessageCircle, color: '#1A9B6C', title: t('mockup.chat'), sub: t('mockup.chatSub') },
                ]"
                :key="tool.title"
                class="card relative min-w-0 flex-1 !p-4"
              >
                <span class="pro">PRO</span>
                <span class="flex size-10 items-center justify-center rounded-xl" :style="{ background: `${tool.color}22` }">
                  <component :is="tool.icon" :size="21" :color="tool.color" :stroke-width="2" />
                </span>
                <p class="mt-2.5 truncate text-[15px] font-bold">{{ tool.title }}</p>
                <p class="mt-0.5 line-clamp-2 text-[12px] leading-4 text-[#8B939E]">{{ tool.sub }}</p>
              </div>
            </div>

            <section class="card mt-4 flex items-center justify-between !py-4">
              <div>
                <p class="title">{{ t('mockup.water') }}</p>
                <p class="mt-1 text-[17px] font-bold">{{ num.format(750) }} / {{ num.format(2000) }} ml</p>
              </div>
              <span class="rounded-full bg-[#1A9B6C] px-3.5 py-2.5 text-[14px] font-bold text-white">
                {{ t('mockup.addWater') }}
              </span>
            </section>

            <div class="mt-4 mb-2 flex items-baseline justify-between">
              <p class="text-[17px] font-bold tracking-[-0.3px]">{{ t('mockup.todaysMeals') }}</p>
              <p class="text-[13px] font-semibold text-[#1A9B6C]">{{ t('mockup.seeAll') }}</p>
            </div>
            <section class="card !py-1">
              <div
                v-for="(meal, i) in meals"
                :key="meal.name"
                class="flex items-center gap-3 py-3"
                :class="i > 0 && 'border-t-[0.5px] border-[#E6E6E2]'"
              >
                <span class="flex size-14 shrink-0 items-center justify-center rounded-[14px] text-[26px]" :style="{ background: meal.tint }">
                  {{ meal.emoji }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[15px] font-bold">{{ meal.name }}</p>
                  <p class="mt-0.5 truncate text-[12px] text-[#8B939E]">{{ meal.meta }}</p>
                  <p class="mt-0.5 truncate text-[11px] text-[#5C6570]">{{ meal.macros }}</p>
                </div>
              </div>
            </section>
          </div>

          <nav class="tabbar">
            <div
              v-for="tab in tabs"
              :key="tab.label"
              class="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5"
              :style="{ color: tab.active ? '#1A9B6C' : '#8B939E' }"
            >
              <span v-if="tab.active" class="tab-pill" />
              <component :is="tab.icon" :size="23" :stroke-width="tab.active ? 2.3 : 1.7" class="relative" />
              <span class="relative max-w-full truncate px-1 text-[10px] tracking-[-0.15px]" :class="tab.active ? 'font-semibold' : 'font-medium'">
                {{ tab.label }}
              </span>
            </div>
          </nav>
          <span class="home-indicator" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.phone {
  width: calc(421px * var(--s));
  height: calc(880px * var(--s));
}

.device {
  position: absolute;
  top: 0;
  left: 0;
  width: 421px;
  height: 880px;
  transform: scale(var(--s));
  transform-origin: top left;
  border-radius: 68px;
  padding: 5px;
  background: linear-gradient(145deg, #4a4a4d 0%, #1d1d1f 30%, #2c2c2e 60%, #48484b 100%);
  box-shadow:
    inset 0 0 0 1.5px rgba(255, 255, 255, 0.14),
    inset 0 0 0 3px rgba(0, 0, 0, 0.6),
    0 50px 100px -20px rgba(15, 23, 42, 0.35),
    0 30px 60px -30px rgba(0, 0, 0, 0.45);
}

:global(.dark) .device {
  box-shadow:
    inset 0 0 0 1.5px rgba(255, 255, 255, 0.14),
    inset 0 0 0 3px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 50px 100px -20px rgba(0, 0, 0, 0.7);
}

.btn {
  position: absolute;
  width: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, #2a2a2c, #5a5a5e, #2a2a2c);
}

.bezel {
  height: 100%;
  border-radius: 63px;
  padding: 9px;
  background: #000;
}

.screen {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 55px;
  background: #f7f7f5;
  color: #14171c;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.screen::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(115deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 38%);
}

.status {
  position: absolute;
  inset: 0 0 auto;
  z-index: 3;
  display: flex;
  height: 54px;
  align-items: center;
  justify-content: space-between;
  padding: 4px 32px 0 50px;
}

.time {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.island {
  position: absolute;
  top: 11px;
  left: 50%;
  z-index: 4;
  width: 126px;
  height: 37px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: #000;
}

.content {
  padding: 62px 20px 0;
}

.strip {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin: 0 -20px 12px;
  padding: 6px 20px 0;
  overflow: hidden;
}

.chip {
  display: flex;
  width: 54px;
  height: 78px;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 11px 0 9px;
  border-radius: 18px;
}

.chip-idle {
  background: #fff;
  border: 0.5px solid #e6e6e2;
}

.chip-selected {
  color: #fff;
  background: linear-gradient(155deg, #1a9b6c 0%, #147954 100%);
  box-shadow: 0 6px 10px rgba(26, 155, 108, 0.32);
  transform: scale(1.04);
}

.card {
  border-radius: 24px;
  padding: 20px;
  background: #fff;
  border: 0.5px solid #e6e6e2;
  box-shadow: 0 1.5px 6px rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: #5c6570;
}

.pro {
  position: absolute;
  top: 14px;
  right: 14px;
  border-radius: 6px;
  padding: 2px 6px;
  background: #f59e0b;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
}

.tabbar {
  position: absolute;
  right: 18px;
  bottom: 42px;
  left: 18px;
  z-index: 3;
  display: flex;
  height: 62px;
  padding: 4px;
  border-radius: 28px;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.tab-pill {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  border: 0.5px solid rgba(0, 0, 0, 0.06);
  background:
    linear-gradient(rgba(26, 155, 108, 0.1), rgba(26, 155, 108, 0.1)),
    linear-gradient(#fff, #f0f0f5);
  box-shadow: 0 2px 8px rgba(148, 163, 184, 0.1);
}

.home-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  z-index: 3;
  width: 139px;
  height: 5px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: #14171c;
}
</style>
