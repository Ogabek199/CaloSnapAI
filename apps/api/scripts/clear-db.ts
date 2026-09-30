import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllAccounts() {
  console.log('🧹 Clearing all accounts and user data from database...');

  // 1. Delete MealItems
  const deletedMealItems = await prisma.mealItem.deleteMany({});
  console.log(`Deleted ${deletedMealItems.count} meal items.`);

  // 2. Delete Meals
  const deletedMeals = await prisma.meal.deleteMany({});
  console.log(`Deleted ${deletedMeals.count} meals.`);

  // 3. Delete FoodScanItems
  const deletedScanItems = await prisma.foodScanItem.deleteMany({});
  console.log(`Deleted ${deletedScanItems.count} food scan items.`);

  // 4. Delete FoodScans
  const deletedScans = await prisma.foodScan.deleteMany({});
  console.log(`Deleted ${deletedScans.count} food scans.`);

  // 5. Delete User Profiles
  const deletedProfiles = await prisma.userProfile.deleteMany({});
  console.log(`Deleted ${deletedProfiles.count} user profiles.`);

  // 6. Delete Users
  const deletedUsers = await prisma.user.deleteMany({});
  console.log(`Deleted ${deletedUsers.count} users.`);

  console.log('✨ All user accounts and related data have been completely wiped! Foods catalogue is preserved.');
}

clearAllAccounts()
  .catch((e) => {
    console.error('Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
