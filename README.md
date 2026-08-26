# 🥗 Taom AI — AI Food Scanner & Nutrition Monorepo

**Taom AI** — ovqat rasmini olib, Google Gemini Vision orqali taom va porsiya hajmini aniqlaydigan, O‘zbek milliy va xalqaro taomlar bazasi (PostgreSQL + Prisma) asosida deterministik kaloriya hamda makrolarni hisoblaydigan to‘liq tizim.

---

## 🏗 Arxitektura (Monorepo)

```text
Taom AI/
├── apps/
│   ├── api/          # NestJS REST API, Prisma ORM, JWT Auth, Gemini 2.5 Flash Vision
│   └── mobile/       # React Native (Expo Router v3), Zustand, SafeStorage
├── packages/
│   ├── types/        # Umumiy TypeScript turlari (@eda/types)
│   ├── validation/   # Zod validatsiya sxemalari (@eda/validation)
│   └── tsconfig/     # Umumiy TypeScript konfiguratsiyasi (@eda/tsconfig)
├── turbo.json        # Turborepo build tizimi
└── pnpm-workspace.yaml
```

---

## 🚀 Loyihani Ishga Tushirish (Quick Start)

### 1. Talablar (Prerequisites)
- **Node.js**: v18+ (tavsiya etiladi: v20 yoki v22)
- **pnpm**: v10+ (`npm i -g pnpm`)
- **PostgreSQL**: Local yoki Docker (yoki Supabase / Neon)

---

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

---

### 3. Ma’lumotlar bazasini sozlash va O‘zbek taomlarini yuklash (Seed)

`apps/api/.env` faylida PostgreSQL ulanish manzilini tekshiring:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eda_ai?schema=public"
JWT_SECRET="eda-ai-super-secret-jwt-token-key-2026"
GEMINI_API_KEY="SIZNING_GEMINI_API_KALITINGIZ"
PORT=3000
```

> **Eslatma:** Agar `GEMINI_API_KEY` kiritilmasa, tizim avtomatik ravishda aqlli fallback/demo rejimida ishlaydi. Kalit kiritilganda esa to‘g‘ridan-to‘g‘ri real Gemini Vision API faollashadi.

Bazani yangilash va milliy taomlar ma’lumotlarini kiritish:

```bash
# Bazaga jadvallarni yaratish (push)
pnpm --filter @eda/api db:push

# O'zbek milliy taomlari bazasini seed qilish
pnpm --filter @eda/api db:seed
```

---

### 4. Backend (NestJS API) ni ishga tushirish

```bash
cd apps/api
pnpm dev
```
- **API manzili:** `http://localhost:3000/api/v1`
- **Swagger interaktiv API hujjati:** `http://localhost:3000/api/docs`

---

### 5. Mobil ilovani (Expo React Native) ishga tushirish

Yangi terminal ochib:

```bash
cd apps/mobile
pnpm start
```

Terminalda quyidagi tugmalarni bosish mumkin:
- **`w`** — Brauzerda ochish (Web rejim)
- **`i`** — iOS Simulator'da ochish
- **`a`** — Android Emulator'da ochish
- Yoki telefondagi **Expo Go** ilovasi orqali QR kodni skanerlash

---

### 6. Barcha ilovalarni parallel bir vaqtda ishga tushirish (Monorepo)

Ildiz (root) papkadan turib:

```bash
pnpm dev
```

Turborepo bir vaqtning o‘zida ham Backend'ni (`http://localhost:3000`), ham Mobile ilovani (`Expo`) parallel ishga tushiradi.

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

---

## 📋 Asosiy API Endpointlar

| Metod | Endpoint | Tavsifi |
| :--- | :--- | :--- |
| `POST` | `/api/v1/food-scans` | Taom rasmini yuklash va AI tahlilini olish |
| `GET` | `/api/v1/food-scans/:id` | Skanerlash natijasini olish |
| `PATCH`| `/api/v1/food-scans/:id/items/:itemId` | Porsiya og‘irligi yoki taomni o‘zgartirish (Correction) |
| `GET` | `/api/v1/foods` | Taomlar bazasini qidirish |
| `GET` | `/api/v1/foods/:id` | Bitta taomning 100g ga to‘g‘ri keluvchi makrolari |
| `GET` | `/api/v1/diary/today` | Bugungi ovqatlanish kundaligi (Nonushta, Tushlik, Kechki) |
| `POST` | `/api/v1/diary/items` | Kundalikka taom qo‘shish |
| `POST` | `/api/v1/goals/calculate` | Foydalanuvchi ko‘rsatkichlari bo‘yicha TDEE hisoblash |
| `POST` | `/api/v1/auth/register` | Ro‘yxatdan o‘tish |
| `POST` | `/api/v1/auth/login` | Tizimga kirish va JWT olish |

---

## 🎯 Keyingi Bosqichlar (Kelajakda qo‘shish mumkin bo‘lgan narsalar)

1. **Cloudinary / AWS S3**: Haqiqiy bulutli rasm saqlash servisini ulash (hozirda base64 / local URL ishlatilmoqda).
2. **Redis + BullMQ**: Foydalanuvchilar soni keskin oshganda AI tahlilini foniy navbat (queue) orqali boshqarish.
3. **AI Oshpaz va Maslahatchi**: Qolgan kaloriya bo‘yicha taom tavsiya qiluvchi aqlli chatbot.

