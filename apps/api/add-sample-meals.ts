/**
 * Adds sample foods to today's diary for the first user in DB.
 * Run: pnpm --filter @eda/api exec ts-node add-sample-meals.ts
 */
import { PrismaClient, MealType } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_IMAGE =
  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&auto=format&fit=crop';

async function main() {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!user) {
    throw new Error('Foydalanuvchi topilmadi. Avval ilovada ro‘yxatdan o‘ting.');
  }

  console.log(`User: ${user.name} (${user.email})`);

  // Ensure at least a few foods exist
  let foods = await prisma.food.findMany({
    include: { nutrition: true },
    take: 5,
    orderBy: { nameUz: 'asc' },
  });

  if (foods.length === 0) {
    console.log('Food jadvali bo‘sh — demo taom yaratilmoqda...');
    const created = await prisma.food.create({
      data: {
        name: 'Plov Demo',
        nameUz: 'Osh / Palov',
        nameRu: 'Плов',
        nameEn: 'Plov',
        category: 'UZBEK_NATIONAL',
        defaultServingGrams: 350,
        aliases: ['plov', 'osh', 'palov'],
        imageUrl: SAMPLE_IMAGE,
        nutrition: {
          create: {
            caloriesPer100g: 177,
            proteinPer100g: 5.2,
            carbsPer100g: 21.4,
            fatPer100g: 8.1,
            fiberPer100g: 1.2,
          },
        },
      },
      include: { nutrition: true },
    });
    foods = [created];
  }

  // Attach image to foods missing one
  for (const f of foods) {
    if (!f.imageUrl) {
      await prisma.food.update({
        where: { id: f.id },
        data: { imageUrl: SAMPLE_IMAGE },
      });
      f.imageUrl = SAMPLE_IMAGE;
    }
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const samples: { type: MealType; foodIndex: number; grams: number }[] = [
    { type: 'BREAKFAST', foodIndex: 0, grams: 250 },
    { type: 'LUNCH', foodIndex: Math.min(1, foods.length - 1), grams: 350 },
    { type: 'DINNER', foodIndex: Math.min(2, foods.length - 1), grams: 300 },
  ];

  for (const sample of samples) {
    const food = foods[sample.foodIndex];
    const n = food.nutrition;
    if (!n) {
      console.log(`Skip ${food.nameUz}: nutrition yo‘q`);
      continue;
    }

    const factor = sample.grams / 100;
    const calories = Math.round(n.caloriesPer100g * factor * 10) / 10;
    const protein = Math.round(n.proteinPer100g * factor * 10) / 10;
    const carbs = Math.round(n.carbsPer100g * factor * 10) / 10;
    const fat = Math.round(n.fatPer100g * factor * 10) / 10;
    const fiber = Math.round(n.fiberPer100g * factor * 10) / 10;

    let meal = await prisma.meal.findFirst({
      where: {
        userId: user.id,
        type: sample.type,
        eatenAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (!meal) {
      meal = await prisma.meal.create({
        data: {
          userId: user.id,
          type: sample.type,
          eatenAt: new Date(),
        },
      });
    }

    const item = await prisma.mealItem.create({
      data: {
        mealId: meal.id,
        foodId: food.id,
        weightGrams: sample.grams,
        calories,
        protein,
        carbs,
        fat,
        fiber,
      },
    });

    console.log(
      `✅ ${sample.type}: ${food.nameUz} ${sample.grams}g → ${calories} kcal (item ${item.id})`,
    );
  }

  console.log('Tayyor! Ilovani pull-to-refresh qiling.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
