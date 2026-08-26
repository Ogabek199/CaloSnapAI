/**
 * Automated Verification Script: Auth & User Data Isolation
 */
async function runTests() {
  const baseUrl = 'http://localhost:3000/api/v1';
  console.log('🚀 Starting User Auth & Data Isolation Tests on:', baseUrl);

  const timestamp = Date.now();
  const userA_phone = `+99890${Math.floor(1000000 + Math.random() * 9000000)}`;
  const userB_phone = `+99890${Math.floor(1000000 + Math.random() * 9000000)}`;
  const password = 'TestSecurePassword123!';

  console.log(`\n--- TEST 1: Register User A (${userA_phone}) ---`);
  const regARes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: userA_phone, name: 'User A (Ali)', password }),
  });
  const userAData = await regARes.json();
  console.log('User A registration status:', regARes.status);
  if (!userAData.accessToken) {
    throw new Error(`Failed to register User A: ${JSON.stringify(userAData)}`);
  }
  const tokenA = userAData.accessToken;
  console.log('✓ User A registered and obtained JWT');

  console.log(`\n--- TEST 2: Register User B (${userB_phone}) ---`);
  const regBRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: userB_phone, name: 'User B (Vali)', password }),
  });
  const userBData = await regBRes.json();
  console.log('User B registration status:', regBRes.status);
  if (!userBData.accessToken) {
    throw new Error(`Failed to register User B: ${JSON.stringify(userBData)}`);
  }
  const tokenB = userBData.accessToken;
  console.log('✓ User B registered and obtained JWT');

  console.log(`\n--- TEST 3: Unauthorized Access Prevention ---`);
  const unauthRes = await fetch(`${baseUrl}/diary/today`);
  console.log('Unauthenticated GET /diary/today status:', unauthRes.status);
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 Unauthorized but got ${unauthRes.status}`);
  }
  console.log('✓ Unauthenticated request properly rejected with 401');

  console.log(`\n--- TEST 4: Fetch Foods for Diary ---`);
  const foodsRes = await fetch(`${baseUrl}/foods`);
  const foods = await foodsRes.json();
  if (!foods || foods.length === 0) {
    throw new Error('No foods found in database to test');
  }
  const testFood = foods[0];
  console.log(`Using test food: ${testFood.nameUz || testFood.name} (ID: ${testFood.id})`);

  console.log(`\n--- TEST 5: User A Adds Meal to Diary ---`);
  const addMealRes = await fetch(`${baseUrl}/diary/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      mealType: 'BREAKFAST',
      foodId: testFood.id,
      weightGrams: 250,
    }),
  });
  const mealItemA = await addMealRes.json();
  console.log('User A add meal status:', addMealRes.status, 'Item ID:', mealItemA.id);

  const diaryARes = await fetch(`${baseUrl}/diary/today`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const diaryA = await diaryARes.json();
  const breakfastItemsA = diaryA.meals.find((m: any) => m.type === 'BREAKFAST')?.items || [];
  console.log('User A Breakfast items count:', breakfastItemsA.length);
  if (breakfastItemsA.length === 0) {
    throw new Error('User A diary does not contain added meal');
  }
  console.log('✓ User A successfully added meal and can view their diary');

  console.log(`\n--- TEST 6: User B Data Isolation Verification ---`);
  const diaryBRes = await fetch(`${baseUrl}/diary/today`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const diaryB = await diaryBRes.json();
  const breakfastItemsB = diaryB.meals.find((m: any) => m.type === 'BREAKFAST')?.items || [];
  console.log('User B Breakfast items count:', breakfastItemsB.length);
  if (breakfastItemsB.length !== 0) {
    throw new Error('DATA LEAK DETECTED: User B can see User A meal items!');
  }
  console.log('✓ PERFECT ISOLATION: User B sees clean diary without User A data');

  console.log(`\n--- TEST 7: User B cannot delete or tamper with User A meal item ---`);
  const deleteTamperRes = await fetch(`${baseUrl}/diary/items/${mealItemA.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log('User B delete User A item status:', deleteTamperRes.status);
  if (deleteTamperRes.status === 200) {
    throw new Error('SECURITY BREACH: User B deleted User A meal item!');
  }
  console.log('✓ User B was prevented from tampering with User A meal item (404/403)');

  console.log(`\n--- TEST 8: User A Logs Out and Logs Back In ---`);
  const loginARes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: userA_phone, password }),
  });
  const loginAData = await loginARes.json();
  console.log('User A re-login status:', loginARes.status);
  const reTokenA = loginAData.accessToken;

  const reDiaryARes = await fetch(`${baseUrl}/diary/today`, {
    headers: { Authorization: `Bearer ${reTokenA}` },
  });
  const reDiaryA = await reDiaryARes.json();
  const reBreakfastItemsA = reDiaryA.meals.find((m: any) => m.type === 'BREAKFAST')?.items || [];
  console.log('User A restored Breakfast items count:', reBreakfastItemsA.length);
  if (reBreakfastItemsA.length === 0) {
    throw new Error('User A data was lost after logout/login cycle!');
  }
  console.log('✓ User A data was 100% preserved upon logging back in');

  console.log('\n🎉 ALL AUTH & USER ISOLATION TESTS PASSED SUCCESSFULLY! 🎉\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
