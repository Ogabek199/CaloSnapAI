export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface MealConfig {
  type: MealType;
  title: string;
  emoji: string;
  timeRange: string;
  accentDark: string;
  accentLight: string;
  badgeBgDark: string;
  badgeBgLight: string;
}

export const MEAL_CONFIG_LIST: MealConfig[] = [
  {
    type: 'BREAKFAST',
    title: 'Nonushta',
    emoji: '🍳',
    timeRange: '07:00 – 10:00',
    accentDark: '#F59E0B',
    accentLight: '#D97706',
    badgeBgDark: 'rgba(245, 158, 11, 0.14)',
    badgeBgLight: 'rgba(217, 119, 6, 0.10)',
  },
  {
    type: 'LUNCH',
    title: 'Tushlik',
    emoji: '🍲',
    timeRange: '12:00 – 15:00',
    accentDark: '#1A9B6C',
    accentLight: '#14855B',
    badgeBgDark: 'rgba(26, 155, 108, 0.14)',
    badgeBgLight: 'rgba(26, 155, 108, 0.10)',
  },
  {
    type: 'DINNER',
    title: 'Kechki ovqat',
    emoji: '🥩',
    timeRange: '18:00 – 21:00',
    accentDark: '#818CF8',
    accentLight: '#4F46E5',
    badgeBgDark: 'rgba(129, 140, 248, 0.14)',
    badgeBgLight: 'rgba(79, 70, 229, 0.10)',
  },
  {
    type: 'SNACK',
    title: 'Qisqa tamaddi',
    emoji: '🥪',
    timeRange: 'Oraliq vaqtlar',
    accentDark: '#F472B6',
    accentLight: '#DB2777',
    badgeBgDark: 'rgba(244, 114, 182, 0.14)',
    badgeBgLight: 'rgba(219, 39, 119, 0.10)',
  },
];

export const MEAL_CONFIGS: Record<MealType, MealConfig> = {
  BREAKFAST: MEAL_CONFIG_LIST[0],
  LUNCH: MEAL_CONFIG_LIST[1],
  DINNER: MEAL_CONFIG_LIST[2],
  SNACK: MEAL_CONFIG_LIST[3],
};
