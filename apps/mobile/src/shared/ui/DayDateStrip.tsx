import React, { memo, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, androidTextFix } from '../theme/spacing';
import { localDateKey } from '../../store/useDiaryStore';
import { todayLabel, weekdayShort } from '../i18n/dates';

const DAY_COUNT = 35;
const CHIP_WIDTH = 54;
const CHIP_HEIGHT = 78;
const CHIP_GAP = 8;

export type DayChip = {
  key: string;
  date: Date;
  weekday: string;
  dayNum: string;
  isToday: boolean;
};

function buildDays(locale: string): DayChip[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayKey = localDateKey(today);
  const days: DayChip[] = [];

  for (let i = DAY_COUNT - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(12, 0, 0, 0);
    const key = localDateKey(d);
    days.push({
      key,
      date: d,
      weekday: weekdayShort(d, locale),
      dayNum: String(d.getDate()),
      isToday: key === todayKey,
    });
  }
  return days;
}

export type DayDateStripProps = {
  selectedDate: string;
  onSelect: (dateKey: string) => void;
  locale?: string;
  primaryColor: string;
  primaryBg?: string;
  textColor: string;
  mutedColor: string;
  cardColor: string;
  borderColor: string;
};

export const DayDateStrip = memo(function DayDateStrip({
  selectedDate,
  onSelect,
  locale = 'uz-UZ',
  primaryColor,
  primaryBg,
  textColor,
  mutedColor,
  cardColor,
  borderColor,
}: DayDateStripProps) {
  const scrollRef = useRef<ScrollView>(null);
  // Recomputed every render so the strip rolls over at midnight while mounted.
  const todayKey = localDateKey();
  const days = useMemo(() => buildDays(locale), [locale, todayKey]);
  const didInitialScroll = useRef(false);
  const userTappedRef = useRef(false);

  const todayChipText = todayLabel(locale, true);

  const scrollToSelected = (dateKey: string, animated: boolean) => {
    const idx = days.findIndex((d) => d.key === dateKey);
    if (idx < 0) return;

    if (idx >= days.length - 1) {
      scrollRef.current?.scrollToEnd({ animated });
      return;
    }

    const targetX = Math.max(0, idx * (CHIP_WIDTH + CHIP_GAP) - CHIP_WIDTH * 1.5);
    scrollRef.current?.scrollTo({ x: targetX, animated });
  };

  useEffect(() => {
    if (!didInitialScroll.current) return;
    if (userTappedRef.current) {
      userTappedRef.current = false;
      return;
    }
    scrollToSelected(selectedDate, true);
  }, [selectedDate, days]);

  const handleSelect = (key: string) => {
    if (key > localDateKey()) return;
    if (key === selectedDate) return;
    userTappedRef.current = true;
    Haptics.selectionAsync();
    onSelect(key);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
        onContentSizeChange={() => {
          if (didInitialScroll.current) return;
          didInitialScroll.current = true;
          requestAnimationFrame(() => scrollToSelected(selectedDate, false));
        }}
      >
        {days.map((day) => {
          const selected = day.key === selectedDate;
          const labelWeekday = day.isToday ? todayChipText : day.weekday;

          const todayOutline = day.isToday && !selected;
          const isWeekend = day.date.getDay() === 0;

          return (
            <Pressable
              key={day.key}
              onPress={() => handleSelect(day.key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? primaryColor : cardColor,
                  borderColor: selected ? primaryColor : todayOutline ? primaryColor : borderColor,
                  borderWidth: todayOutline ? 1.5 : StyleSheet.hairlineWidth,
                  transform: [{ scale: pressed ? 0.94 : selected ? 1.04 : 1 }],
                },
                selected
                  ? {
                      shadowColor: primaryColor,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.32,
                      shadowRadius: 10,
                      elevation: 5,
                    }
                  : null,
              ]}
            >
              {selected ? (
                <LinearGradient
                  colors={[primaryColor, darken(primaryColor, 0.22)]}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.8, y: 1 }}
                  style={styles.chipFill}
                />
              ) : null}

              <Text
                style={[
                  styles.weekday,
                  androidTextFix,
                  {
                    color: selected
                      ? 'rgba(255,255,255,0.85)'
                      : todayOutline
                        ? primaryColor
                        : isWeekend
                          ? '#E5484D'
                          : mutedColor,
                  },
                ]}
                numberOfLines={1}
              >
                {labelWeekday}
              </Text>

              <Text
                style={[
                  styles.dayNum,
                  androidTextFix,
                  { color: selected ? '#FFFFFF' : todayOutline ? primaryColor : textColor },
                ]}
              >
                {day.dayNum}
              </Text>

              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: selected
                      ? '#FFFFFF'
                      : todayOutline
                        ? primaryColor
                        : 'transparent',
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 6,
    paddingBottom: 12,
    flexDirection: 'row',
  },
  chip: {
    width: CHIP_WIDTH,
    height: CHIP_HEIGHT,
    borderRadius: 18,
    paddingTop: 11,
    paddingBottom: 9,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: CHIP_GAP,
  },
  chipFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
  },
  weekday: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dayNum: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});

function darken(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}
