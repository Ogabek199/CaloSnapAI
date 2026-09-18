# 🥗 Taom AI — AI Food Scanner & Nutrition Monorepo

### 2. Bog‘liqliklarni o‘rnatish va loyihani yig‘ish (Build)

Ildiz (root) papkada quyidagi buyruqni bajaring:

```bash
# 1. Barcha paketlarni o'rnatish
pnpm install

# 2. Prisma klientini yaratish
pnpm --filter @eda/api db:generate

# 3. Monoreponi to'liq build qilish
pnpm build
```

----

Bazani yangilash va milliy taomlar ma’lumotlarini kiritish:

```bash
# Bazaga jadvallarni yaratish (push)
pnpm --filter @eda/api db:push

# O'zbek milliy taomlari bazasini seed qilish
pnpm --filter @eda/api db:seed
```

---

## 🧪 Matematik Dvigatelni Testlash

Kaloriya va makro hisoblashning deterministik aniqligini tekshirish uchun:

```bash
cd apps/api
npx ts-node test-nutrition.ts
```

Natija:
```text
--- Testing NutritionService (Determinstic Calorie Engine) ---
Plov 350g calculated: { calories: 619.5, protein: 18.2, carbs: 74.9, fat: 28.4, fiber: 4.2 }
✅ TEST 1 PASSED: 350g Plov = 619.5 kcal (~620 kcal)
✅ TEST 2 PASSED: 0g = 0 kcal
Aggregated meal total: { calories: 657.9, protein: 19.5, carbs: 80.3, fat: 29.4, fiber: 5.9 }
✅ TEST 3 PASSED: Meal aggregate total is accurate (657.9 kcal)
🎉 ALL NUTRITION ENGINE TESTS PASSED!
```
