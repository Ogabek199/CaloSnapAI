import { PrismaClient, FoodCategory } from '@prisma/client';

const prisma = new PrismaClient();

interface UzbekFoodSeed {
  name: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  category: FoodCategory;
  defaultServingGrams: number;
  aliases: string[];
  nutrition: {
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    fiberPer100g: number;
  };
}

const uzbekFoods: UzbekFoodSeed[] = [
  {
    name: 'Plov (Toshkentcha)',
    nameUz: 'Toshkentcha Osh / Palov',
    nameRu: 'Ташкентский плов',
    nameEn: 'Tashkent Plov (Pilaf)',
    category: 'UZBEK_NATIONAL',
    defaultServingGrams: 350,
    aliases: ['plov', 'osh', 'palov', 'toshkent osh', 'pilaf', 'pilav'],
    nutrition: {
      caloriesPer100g: 177,
      proteinPer100g: 5.2,
      carbsPer100g: 21.4,
      fatPer100g: 8.1,
      fiberPer100g: 1.2,
    },
  },
  {
    name: 'Choyxona Palov',
    nameUz: 'Choyxona Palovi (Devzira)',
    nameRu: 'Чайханский плов',
    nameEn: 'Teahouse Devzira Plov',
    category: 'UZBEK_NATIONAL',
    defaultServingGrams: 350,
    aliases: ['choyxona osh', 'devzira osh', 'devzira plov'],
    nutrition: {
      caloriesPer100g: 195,
      proteinPer100g: 6.0,
      carbsPer100g: 22.0,
      fatPer100g: 9.5,
      fiberPer100g: 1.1,
    },
  },
  {
    name: 'Manti (Go‘shtli)',
    nameUz: 'Go‘shtli Manti',
    nameRu: 'Манты с мясом',
    nameEn: 'Meat Dumplings (Manti)',
    category: 'UZBEK_NATIONAL',
    defaultServingGrams: 300,
    aliases: ['manti', 'manti goshtli', 'manty', 'mantu'],
    nutrition: {
      caloriesPer100g: 210,
      proteinPer100g: 8.5,
      carbsPer100g: 22.0,
      fatPer100g: 9.8,
      fiberPer100g: 0.8,
    },
  },
  {
    name: 'Manti (Qovoqli)',
    nameUz: 'Qovoqli Manti',
    nameRu: 'Манты с тыквой',
    nameEn: 'Pumpkin Manti',
    category: 'UZBEK_NATIONAL',
    defaultServingGrams: 300,
    aliases: ['qovoq manti', 'тыква манты'],
    nutrition: {
      caloriesPer100g: 145,
      proteinPer100g: 3.5,
      carbsPer100g: 21.0,
      fatPer100g: 5.2,
      fiberPer100g: 1.8,
    },
  },
  {
    name: 'Tandir Somsa (Go‘shtli)',
    nameUz: 'Go‘shtli Tandir Somsa',
    nameRu: 'Тандырная самса с мясом',
    nameEn: 'Tandoor Meat Somsa (Samosa)',
    category: 'UZBEK_NATIONAL',
    defaultServingGrams: 150,
    aliases: ['somsa', 'samsa', 'tandir somsa', 'goshtli somsa'],
    nutrition: {
      caloriesPer100g: 285,
      proteinPer100g: 9.5,
      carbsPer100g: 28.0,
      fatPer100g: 15.0,
      fiberPer100g: 1.0,
    },
  },
  {
    name: 'Qatlama Somsa',
    nameUz: 'Qatlama Somsa',
    nameRu: 'Слоеная самса',
    nameEn: 'Layered Puff Pastry Somsa',
    category: 'UZBEK_NATIONAL',
    defaultServingGrams: 140,
    aliases: ['qatlama somsa', 'sloyonaya samsa'],
    nutrition: {
      caloriesPer100g: 310,
      proteinPer100g: 8.8,
      carbsPer100g: 30.0,
      fatPer100g: 17.5,
      fiberPer100g: 0.9,
    },
  },
  {
    name: 'Ko‘k Somsa',
    nameUz: 'Ko‘katli Somsa (Ko‘k somsa)',
    nameRu: 'Самса с зеленью',
    nameEn: 'Herbal Spring Somsa',
    category: 'UZBEK_NATIONAL',
    defaultServingGrams: 120,
    aliases: ['kok somsa', 'ko‘k somsa', 'ko‘kat somsa'],
    nutrition: {
      caloriesPer100g: 180,
      proteinPer100g: 5.0,
      carbsPer100g: 24.0,
      fatPer100g: 7.2,
      fiberPer100g: 2.5,
    },
  },
  {
    name: 'Qovurma Lag‘mon',
    nameUz: 'Qovurma Lag‘mon',
    nameRu: 'Жареный лагман',
    nameEn: 'Fried Lagman (Stir-fried Noodles)',
    category: 'UZBEK_NATIONAL',
    defaultServingGrams: 350,
    aliases: ['lagman', 'lagmon', 'qovurma lagmon', 'fried noodles'],
    nutrition: {
      caloriesPer100g: 165,
      proteinPer100g: 6.8,
      carbsPer100g: 21.5,
      fatPer100g: 5.9,
      fiberPer100g: 1.5,
    },
  },
  {
    name: 'Cho‘zma Lag‘mon (Sho‘rvali)',
    nameUz: 'Cho‘zma Sho‘rvali Lag‘mon',
    nameRu: 'Лагман с бульоном',
    nameEn: 'Soup Lagman',
    category: 'SOUP',
    defaultServingGrams: 450,
    aliases: ['lagmon shurva', 'lagman soup', 'suyuq lagmon'],
    nutrition: {
      caloriesPer100g: 115,
      proteinPer100g: 4.8,
      carbsPer100g: 14.5,
      fatPer100g: 4.2,
      fiberPer100g: 1.2,
    },
  },
  {
    name: 'Shashlik (Qiyma)',
    nameUz: 'Qiyma Shashlik',
    nameRu: 'Шашлык молотый (люля-кебаб)',
    nameEn: 'Minced Meat Kebab (Qiyma Shashlik)',
    category: 'MEAT_POULTRY',
    defaultServingGrams: 100,
    aliases: ['shashlik', 'qiyma', 'kebab', 'lyulya kebab'],
    nutrition: {
      caloriesPer100g: 260,
      proteinPer100g: 16.5,
      carbsPer100g: 2.0,
      fatPer100g: 21.0,
      fiberPer100g: 0.1,
    },
  },
  {
    name: 'Shashlik (Jaz / Bo‘lakli)',
    nameUz: 'Go‘shtli Jaz Shashlik',
    nameRu: 'Шашлык кусковой',
    nameEn: 'Chunk Beef/Lamb Shashlik',
    category: 'MEAT_POULTRY',
    defaultServingGrams: 120,
    aliases: ['jaz shashlik', 'gosht shashlik', 'shish kebab'],
    nutrition: {
      caloriesPer100g: 230,
      proteinPer100g: 21.0,
      carbsPer100g: 0.5,
      fatPer100g: 16.0,
      fiberPer100g: 0.0,
    },
  },
  {
    name: 'Qozonkabob',
    nameUz: 'Qozonkabob (Go‘sht va Kartoshka)',
    nameRu: 'Казан-кабоб',
    nameEn: 'Kazan Kebab (Roast Meat & Potatoes)',
    category: 'UZBEK_NATIONAL',
    defaultServingGrams: 350,
    aliases: ['qozon kabob', 'kazan kebab', 'qozonkabob'],
    nutrition: {
      caloriesPer100g: 215,
      proteinPer100g: 11.2,
      carbsPer100g: 13.0,
      fatPer100g: 13.1,
      fiberPer100g: 1.4,
    },
  },
  {
    name: 'Norin',
    nameUz: 'Norin (Qozi va mayda xamir)',
    nameRu: 'Нарын',
    nameEn: 'Naryn (Finely chopped meat and pasta)',
    category: 'UZBEK_NATIONAL',
    defaultServingGrams: 250,
    aliases: ['narin', 'norin', 'qazi norin'],
    nutrition: {
      caloriesPer100g: 220,
      proteinPer100g: 14.5,
      carbsPer100g: 24.0,
      fatPer100g: 7.2,
      fiberPer100g: 0.8,
    },
  },
  {
    name: 'Sho‘rva (Qo‘y go‘shti)',
    nameUz: 'Qo‘y go‘shtli Sho‘rva',
    nameRu: 'Шурпа из баранины',
    nameEn: 'Shurpa (Rich Lamb Soup)',
    category: 'SOUP',
    defaultServingGrams: 400,
    aliases: ['shurva', 'shorva', 'shurpa', 'kaynatma'],
    nutrition: {
      caloriesPer100g: 85,
      proteinPer100g: 5.5,
      carbsPer100g: 4.8,
      fatPer100g: 5.0,
      fiberPer100g: 0.9,
    },
  },
  {
    name: 'Mastava',
    nameUz: 'Mastava (Suyuq osh)',
    nameRu: 'Мастава',
    nameEn: 'Mastava (Rice Soup with Meat & Veggies)',
    category: 'SOUP',
    defaultServingGrams: 400,
    aliases: ['mastava', 'suyuq osh', 'rice soup'],
    nutrition: {
      caloriesPer100g: 90,
      proteinPer100g: 4.2,
      carbsPer100g: 10.5,
      fatPer100g: 3.5,
      fiberPer100g: 0.7,
    },
  },
  {
    name: 'Chuchvara (Sho‘rvali)',
    nameUz: 'Chuchvara Sho‘rva',
    nameRu: 'Чучвара в бульоне',
    nameEn: 'Chuchvara (Small Meat Dumpling Soup)',
    category: 'SOUP',
    defaultServingGrams: 350,
    aliases: ['chuchvara', 'pelmeni', 'dumpling soup'],
    nutrition: {
      caloriesPer100g: 120,
      proteinPer100g: 6.2,
      carbsPer100g: 14.0,
      fatPer100g: 4.5,
      fiberPer100g: 0.6,
    },
  },
  {
    name: 'Dimlama',
    nameUz: 'Dimlama (Sabzavotli dimlangan go‘sht)',
    nameRu: 'Дымляма',
    nameEn: 'Dimlama (Stewed Meat and Vegetables)',
    category: 'UZBEK_NATIONAL',
    defaultServingGrams: 350,
    aliases: ['dimlama', 'dumlama', 'stew'],
    nutrition: {
      caloriesPer100g: 110,
      proteinPer100g: 7.0,
      carbsPer100g: 8.5,
      fatPer100g: 5.5,
      fiberPer100g: 2.1,
    },
  },
  {
    name: 'Achichuk Salat',
    nameUz: 'Achichuk / Achchiq-chuchuk (Pomidor-piyoz)',
    nameRu: 'Ачичук (Салат из помидоров и лука)',
    nameEn: 'Achichuk Tomato Onion Salad',
    category: 'SALAD',
    defaultServingGrams: 150,
    aliases: ['achichuk', 'achchiq chuchuk', 'pomidor piyoz', 'tomato salad'],
    nutrition: {
      caloriesPer100g: 32,
      proteinPer100g: 1.1,
      carbsPer100g: 4.5,
      fatPer100g: 0.8,
      fiberPer100g: 1.4,
    },
  },
  {
    name: 'Tandir Non (Obi non)',
    nameUz: 'Tandir Obi Non',
    nameRu: 'Тандырная лепешка',
    nameEn: 'Uzbek Tandoor Flatbread',
    category: 'GRAIN_BREAD',
    defaultServingGrams: 200,
    aliases: ['non', 'tandir non', 'obi non', 'lepeshka', 'flatbread', 'bread'],
    nutrition: {
      caloriesPer100g: 245,
      proteinPer100g: 7.8,
      carbsPer100g: 48.0,
      fatPer100g: 2.5,
      fiberPer100g: 2.8,
    },
  },
  {
    name: 'Patir Non',
    nameUz: 'Samarqand Patir Noni',
    nameRu: 'Самаркандский патыр',
    nameEn: 'Samarkand Butter/Flaky Flatbread (Patir)',
    category: 'GRAIN_BREAD',
    defaultServingGrams: 250,
    aliases: ['patir', 'samarqand patir', 'sariyogli non'],
    nutrition: {
      caloriesPer100g: 320,
      proteinPer100g: 8.0,
      carbsPer100g: 49.0,
      fatPer100g: 10.5,
      fiberPer100g: 2.5,
    },
  },
  {
    name: 'Ko‘k Choy',
    nameUz: 'Ko‘k Choy (Shakarsiz)',
    nameRu: 'Зеленый чай',
    nameEn: 'Green Tea (Unsweetened)',
    category: 'BEVERAGE',
    defaultServingGrams: 250,
    aliases: ['choy', 'kok choy', 'green tea', 'tea'],
    nutrition: {
      caloriesPer100g: 1,
      proteinPer100g: 0.1,
      carbsPer100g: 0.0,
      fatPer100g: 0.0,
      fiberPer100g: 0.0,
    },
  },
];

async function main() {
  console.log('Seeding Uzbek Food Database into PostgreSQL...');

  for (const item of uzbekFoods) {
    const existing = await prisma.food.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      await prisma.foodNutrition.upsert({
        where: { foodId: existing.id },
        update: { ...item.nutrition },
        create: {
          foodId: existing.id,
          ...item.nutrition,
        },
      });
      console.log(`Updated food: ${item.name}`);
    } else {
      const created = await prisma.food.create({
        data: {
          name: item.name,
          nameUz: item.nameUz,
          nameRu: item.nameRu,
          nameEn: item.nameEn,
          category: item.category,
          defaultServingGrams: item.defaultServingGrams,
          aliases: item.aliases,
          nutrition: {
            create: {
              ...item.nutrition,
            },
          },
        },
      });
      console.log(`Created food: ${created.nameUz} (ID: ${created.id})`);
    }
  }

  console.log(`Successfully seeded ${uzbekFoods.length} national dishes!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
