import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FontSize, Radius, Spacing } from '../theme/spacing';
import { localDateKey } from '../../store/useDiaryStore';

const DAY_COUNT = 30;
const CHIP_WIDTH = 56;
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
      weekday: d.toLocaleDateString(locale, { weekday: 'short' }).replace('.', ''),
      dayNum: String(d.getDate()),
      isToday: key === todayKey,
    });
  }
  return days;
}

type Props = {
  selectedDate: string;
  onSelect: (dateKey: string) => void;
  locale?: string;
  primaryColor: string;
  textColor: string;
  mutedColor: string;
  cardColor: string;
  borderColor: string;
};

export function DayDateStrip({
  selectedDate,
  onSelect,
  locale = 'uz-UZ',
  primaryColor,
  textColor,
  mutedColor,
  cardColor,
  borderColor,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const days = useMemo(() => buildDays(locale), [locale]);
  const didInitialScroll = useRef(false);
  const userTappedRef = useRef(false);

  const scrollToSelected = (dateKey: string, animated: boolean) => {
    const idx = days.findIndex((d) => d.key === dateKey);
    if (idx < 0) return;

    if (idx >= days.length - 1) {
      scrollRef.current?.scrollToEnd({ animated });
      return;
    }

    const x = idx * (CHIP_WIDTH + CHIP_GAP);
    scrollRef.current?.scrollTo({ x, animated });
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
        return (
          <Pressable
            key={day.key}
            onPress={() => handleSelect(day.key)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? primaryColor : cardColor,
                borderColor: selected ? primaryColor : borderColor,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.weekday,
                { color: selected ? 'rgba(255,255,255,0.85)' : mutedColor },
              ]}
              numberOfLines={1}
            >
              {day.isToday ? (locale.startsWith('ru') ? 'Сег' : locale.startsWith('en') ? 'Tod' : 'Bug') : day.weekday}
            </Text>
            <Text
              style={[
                styles.dayNum,
                { color: selected ? '#FFFFFF' : textColor },
              ]}
            >
              {day.dayNum}
            </Text>
            {day.isToday && !selected ? (
              <View style={[styles.dot, { backgroundColor: primaryColor }]} />
            ) : (
              <View style={styles.dotPlaceholder} />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.xl,
    gap: CHIP_GAP,
    paddingVertical: 2,
  },
  chip: {
    width: CHIP_WIDTH,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 2,
  },
  weekday: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dayNum: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
    marginTop: 2,
  },
});
