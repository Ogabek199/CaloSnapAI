import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, X, Check, Utensils } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore, usePalette, useStrings } from '../../src/store/useAppStore';
import { foodName } from '../../src/shared/i18n/languages';
import { useScanStore } from '../../src/store/useScanStore';
import { useToastStore } from '../../src/store/useToastStore';
import { ApiClient } from '../../src/shared/api/api-client';
import { Food } from '@eda/types';
import { FadeIn, FoodListSkeleton } from '../../src/shared/ui/Skeleton';

export default function EditFoodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const language = useAppStore((s) => s.language);
  const swapItemFood = useScanStore((s) => s.swapItemFood);
  const selectedItemIndex = useScanStore((s) => s.selectedItemIndex);
  const showToast = useToastStore((s) => s.showToast);

  const currentTheme = usePalette();
  const strings = useStrings();

  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const searchSeq = useRef(0);
  const selectedRef = useRef(false);

  const loadFoods = async (searchQuery: string) => {
    const seq = ++searchSeq.current;
    setLoading(true);
    try {
      const results = await ApiClient.searchFoods(searchQuery);
      if (seq !== searchSeq.current) return;
      setFoods(results);
    } catch (e: any) {
      if (seq !== searchSeq.current) return;
      if (e?.message) showToast(e.message, 'error');
    } finally {
      if (seq === searchSeq.current) setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadFoods(query), query ? 280 : 0);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectFood = (food: Food) => {
    if (selectedRef.current) return;
    selectedRef.current = true;
    swapItemFood(selectedItemIndex, food);
    router.back();
  };

  const showSkeleton = loading && foods.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{strings.changeFood}</Text>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}
          onPress={() => router.back()}
        >
          <X color={currentTheme.text} size={18} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={[styles.searchBox, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
        <Search color={currentTheme.textMuted} size={18} />
        <TextInput
          style={[styles.input, { color: currentTheme.text }]}
          placeholder={strings.searchFoodPlaceholder}
          placeholderTextColor={currentTheme.textMuted}
          textAlignVertical="center"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <X color={currentTheme.textMuted} size={16} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showSkeleton ? (
        <FoodListSkeleton rows={8} />
      ) : (
        <FadeIn style={{ flex: 1 }}>
          <FlatList
            data={foods}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
            ListEmptyComponent={
              !loading ? (
                <Text style={{ color: currentTheme.textMuted, textAlign: 'center', marginTop: 24 }}>
                  {strings.noResults}
                </Text>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.foodItemCard,
                  {
                    backgroundColor: currentTheme.card,
                    borderColor: currentTheme.border,
                    opacity: loading ? 0.55 : 1,
                  },
                ]}
                onPress={() => handleSelectFood(item)}
                disabled={loading}
              >
                <View style={[styles.foodIconBox, { backgroundColor: currentTheme.primaryBg }]}>
                  <Utensils color={currentTheme.primary} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.foodItemTitle, { color: currentTheme.text }]}>
                    {foodName(item, language)}
                  </Text>
                  <Text style={[styles.foodItemSub, { color: currentTheme.textMuted }]}>
                    100g: {item.nutrition.calories} kcal • {strings.protein}: {item.nutrition.protein}g • {strings.carbs}: {item.nutrition.carbs}g • {strings.fat}: {item.nutrition.fat}g
                  </Text>
                </View>
                <Check color={currentTheme.textMuted} size={18} />
              </TouchableOpacity>
            )}
          />
        </FadeIn>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  listContent: {
    gap: 8,
  },
  foodItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  foodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  foodItemSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
