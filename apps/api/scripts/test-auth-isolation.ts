/**
 * Automated Verification Script: Comprehensive Login / Logout / Profile & Diary Persistence
 */
async function runTests() {
  const baseUrl = 'http://localhost:3000/api/v1';
  console.log('🚀 Starting Full Profile & Diary Persistence Tests on:', baseUrl);

  const testPhone = `+99890${Math.floor(1000000 + Math.random() * 9000000)}`;
  const password = 'MySecurePassword99!';
  const customProfile = {
    age: 32,
    gender: 'MALE' as const,
    heightCm: 182,
    weightKg: 87.5,
    activityLevel: 'VERY_ACTIVE' as const,
    goal: 'BUILD_MUSCLE' as const,
    dailyCalorieGoal: 2850,
    proteinGoalGrams: 175,
    carbsGoalGrams: 350,
    fatGoalGrams: 75,
  };

  console.log(`\n--- TEST 1: Register User with Custom Profile (${testPhone}) ---`);
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: testPhone,
      name: 'Shahzod Olimov',
      password,
      profile: customProfile,
    }),
  });
  const regData = await regRes.json();
  console.log('Registration status:', regRes.status);
  if (!regData.accessToken) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }
  const token = regData.accessToken;
  const userProfile = regData.user?.profile;
  console.log('User registered with Daily Calorie Goal:', userProfile?.dailyCalorieGoal, 'Weight:', userProfile?.weightKg);
  if (userProfile?.dailyCalorieGoal !== 2850 || userProfile?.weightKg !== 87.5) {
    throw new Error('Initial profile data was not saved correctly to database!');
  }
  console.log('✓ User profile accurately saved in PostgreSQL');

  console.log(`\n--- TEST 2: Add Meals to User Diary ---`);
  const foodsRes = await fetch(`${baseUrl}/foods`);
  const foods = await foodsRes.json();
  const food1 = foods[0];
  const food2 = foods[1] || foods[0];

  const add1 = await fetch(`${baseUrl}/diary/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mealType: 'BREAKFAST', foodId: food1.id, weightGrams: 300 }),
  });
  console.log('Add meal 1 status:', add1.status);

  const add2 = await fetch(`${baseUrl}/diary/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mealType: 'LUNCH', foodId: food2.id, weightGrams: 400 }),
  });
  console.log('Add meal 2 status:', add2.status);

  const diaryBefore = await (await fetch(`${baseUrl}/diary/today`, {
    headers: { Authorization: `Bearer ${token}` },
  })).json();

  const mealCountBefore = diaryBefore.meals.reduce((acc: number, m: any) => acc + m.items.length, 0);
  console.log(`User has ${mealCountBefore} meals logged in today's diary. Goal: ${diaryBefore.goalCalories} kcal`);
  if (mealCountBefore !== 2 || diaryBefore.goalCalories !== 2850) {
    throw new Error('Meals or goal calories mismatch in diary before logout');
  }
  console.log('✓ Meals and calorie goals confirmed in database');

  console.log(`\n--- TEST 2.5: Update Profile Avatar ---`);
  const avatarDataUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';
  const avatarRes = await fetch(`${baseUrl}/auth/avatar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ avatarUrl: avatarDataUrl }),
  });
  console.log('Avatar update status:', avatarRes.status);
  const updatedUser = await avatarRes.json();
  if (updatedUser.avatarUrl !== avatarDataUrl) {
    throw new Error('Avatar was not saved properly in database!');
  }
  console.log('✓ Avatar successfully updated in PostgreSQL database');

  console.log(`\n--- TEST 3: Simulate Logout & Guest Access Block ---`);
  // Unauthenticated request must fail
  const blockedRes = await fetch(`${baseUrl}/diary/today`);
  console.log('Unauthenticated access status:', blockedRes.status);
  if (blockedRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized, got ${blockedRes.status}`);
  }
  console.log('✓ Guest access blocked with 401 Unauthorized');

  console.log(`\n--- TEST 4: Log Back in using Phone & Password ---`);
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testPhone, password }),
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status);
  if (!loginData.accessToken) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const newToken = loginData.accessToken;
  const restoredProfile = loginData.user?.profile;
  console.log('Restored User Profile:', {
    name: loginData.user?.name,
    phone: loginData.user?.phone,
    weightKg: restoredProfile?.weightKg,
    heightCm: restoredProfile?.heightCm,
    age: restoredProfile?.age,
    goal: restoredProfile?.goal,
    dailyCalorieGoal: restoredProfile?.dailyCalorieGoal,
  });

  if (
    restoredProfile?.dailyCalorieGoal !== 2850 ||
    restoredProfile?.weightKg !== 87.5 ||
    restoredProfile?.heightCm !== 182 ||
    restoredProfile?.age !== 32 ||
    restoredProfile?.goal !== 'BUILD_MUSCLE' ||
    loginData.user?.avatarUrl !== avatarDataUrl
  ) {
    throw new Error('RESTORE ERROR: User profile stats or avatar were NOT preserved properly on re-login!');
  }
  console.log('✓ User profile, avatar image, physical stats, and goals 100% PRESERVED');

  console.log(`\n--- TEST 5: Verify Diary Meals are Fully Restored ---`);
  const diaryAfter = await (await fetch(`${baseUrl}/diary/today`, {
    headers: { Authorization: `Bearer ${newToken}` },
  })).json();

  const mealCountAfter = diaryAfter.meals.reduce((acc: number, m: any) => acc + m.items.length, 0);
  console.log(`User restored diary meal count: ${mealCountAfter}, Goal: ${diaryAfter.goalCalories} kcal`);
  if (mealCountAfter !== 2 || diaryAfter.goalCalories !== 2850) {
    throw new Error('RESTORE ERROR: Diary meals or calorie goal lost after re-login!');
  }
  console.log('✓ All diary meals and calorie goals 100% PRESERVED');

  console.log('\n🎉 ALL PERSISTENCE AND LOGIN/LOGOUT TESTS COMPLETED SUCCESSFULLY! 🎉\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
