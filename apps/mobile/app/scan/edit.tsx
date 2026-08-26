import React, { useState, useEffect } from 'react';
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
import { useAppStore } from '../../src/store/useAppStore';
import { useScanStore } from '../../src/store/useScanStore';
import { ApiClient } from '../../src/shared/api/api-client';
import { Food } from '@eda/types';

export default function EditFoodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, t } = useAppStore();
  const { swapItemFood, selectedItemIndex } = useScanStore();

  const currentTheme = theme();
  const strings = t();

  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFoods('');
  }, []);

  const loadFoods = async (searchQuery: string) => {
    setLoading(true);
    try {
      const results = await ApiClient.searchFoods(searchQuery);
      setFoods(results);
    } catch (e) {
      console.log('Food search error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = (food: Food) => {
    swapItemFood(selectedItemIndex, food);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background, paddingTop: insets.top }]}>
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
          placeholder="Qidiruv (masalan: Manti, Somsa, Osh)..."
          placeholderTextColor={currentTheme.textMuted}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            loadFoods(text);
          }}
          autoFocus
        />
        {query ? (
          <TouchableOpacity onPress={() => { setQuery(''); loadFoods(''); }}>
            <X color={currentTheme.textMuted} size={16} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Food List */}
      <FlatList
        data={foods}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.foodItemCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}
            onPress={() => handleSelectFood(item)}
          >
            <View style={[styles.foodIconBox, { backgroundColor: currentTheme.primaryBg }]}>
              <Utensils color={currentTheme.primary} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.foodItemTitle, { color: currentTheme.text }]}>
                {item.nameUz || item.name}
              </Text>
              <Text style={[styles.foodItemSub, { color: currentTheme.textMuted }]}>
                100g: {item.nutrition.calories} kcal • {strings.protein}: {item.nutrition.protein}g • {strings.carbs}: {item.nutrition.carbs}g • {strings.fat}: {item.nutrition.fat}g
              </Text>
            </View>
            <Check color={currentTheme.textMuted} size={18} />
          </TouchableOpacity>
        )}
      />
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
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
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
