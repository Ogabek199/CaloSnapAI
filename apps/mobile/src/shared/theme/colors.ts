export interface ThemePalette {
  background: string;
  card: string;
  cardHover: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  tabBar: string;
  tabBarBorder: string;

  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryBg: string;

  secondary: string;
  secondaryBg: string;

  danger: string;
  dangerBg: string;

  info: string;
  infoBg: string;

  purple: string;
  purpleBg: string;

  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
}

export const DarkTheme: ThemePalette = {
  background: '#0B0F19',
  card: '#151C2C',
  cardHover: '#1E293B',
  border: '#2A364F',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  tabBar: 'rgba(15, 23, 42, 0.94)',
  tabBarBorder: 'rgba(255, 255, 255, 0.08)',

  primary: '#10B981',
  primaryLight: '#34D399',
  primaryDark: '#059669',
  primaryBg: 'rgba(16, 185, 129, 0.14)',

  secondary: '#F59E0B',
  secondaryBg: 'rgba(245, 158, 11, 0.14)',

  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.14)',

  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.14)',

  purple: '#8B5CF6',
  purpleBg: 'rgba(139, 92, 246, 0.14)',

  protein: '#3B82F6',
  carbs: '#F59E0B',
  fat: '#EF4444',
  fiber: '#10B981',
};

export const LightTheme: ThemePalette = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardHover: '#F1F5F9',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  tabBar: 'rgba(255, 255, 255, 0.94)',
  tabBarBorder: 'rgba(0, 0, 0, 0.08)',

  primary: '#10B981',
  primaryLight: '#34D399',
  primaryDark: '#059669',
  primaryBg: 'rgba(16, 185, 129, 0.12)',

  secondary: '#D97706',
  secondaryBg: 'rgba(217, 119, 6, 0.12)',

  danger: '#DC2626',
  dangerBg: 'rgba(220, 38, 38, 0.12)',

  info: '#2563EB',
  infoBg: 'rgba(37, 99, 235, 0.12)',

  purple: '#7C3AED',
  purpleBg: 'rgba(124, 58, 237, 0.12)',

  protein: '#2563EB',
  carbs: '#D97706',
  fat: '#DC2626',
  fiber: '#10B981',
};

export const Colors = DarkTheme;
