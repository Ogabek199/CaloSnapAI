export interface ThemePalette {
  background: string;
  surface: string;
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
  onPrimary: string;

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
  background: '#0F1115',
  surface: '#171A21',
  card: '#171A21',
  cardHover: '#1E222B',
  border: '#2A2F3A',
  text: '#F4F5F7',
  textSecondary: '#9AA3B2',
  textMuted: '#6B7380',
  tabBar: '#171A21',
  tabBarBorder: '#2A2F3A',

  primary: '#1A9B6C',
  primaryLight: '#22B57D',
  primaryDark: '#14855B',
  primaryBg: 'rgba(26, 155, 108, 0.14)',
  onPrimary: '#FFFFFF',

  secondary: '#D97706',
  secondaryBg: 'rgba(217, 119, 6, 0.14)',

  danger: '#E5484D',
  dangerBg: 'rgba(229, 72, 77, 0.14)',

  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.14)',

  purple: '#7C3AED',
  purpleBg: 'rgba(124, 58, 237, 0.14)',

  protein: '#3B82F6',
  carbs: '#D97706',
  fat: '#E5484D',
  fiber: '#1A9B6C',
};

export const LightTheme: ThemePalette = {
  background: '#F7F7F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardHover: '#F0F0EE',
  border: '#E6E6E2',
  text: '#14171C',
  textSecondary: '#5C6570',
  textMuted: '#8B939E',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E6E6E2',

  primary: '#1A9B6C',
  primaryLight: '#22B57D',
  primaryDark: '#14855B',
  primaryBg: 'rgba(26, 155, 108, 0.10)',
  onPrimary: '#FFFFFF',

  secondary: '#D97706',
  secondaryBg: 'rgba(217, 119, 6, 0.10)',

  danger: '#DC2626',
  dangerBg: 'rgba(220, 38, 38, 0.10)',

  info: '#2563EB',
  infoBg: 'rgba(37, 99, 235, 0.10)',

  purple: '#7C3AED',
  purpleBg: 'rgba(124, 58, 237, 0.10)',

  protein: '#2563EB',
  carbs: '#D97706',
  fat: '#DC2626',
  fiber: '#1A9B6C',
};

export const Colors = LightTheme;
