const assert = require('assert');

const {
  buildDayNutritionTarget,
  buildNutritionEstimate,
  isMuscleGainGoal,
  mergeNutritionFallback,
  normalizeBodyWeight
} = require('../miniprogram/utils/nutritionInsight');

function testWeightNormalize() {
  assert.strictEqual(normalizeBodyWeight(80), 80);
  assert.strictEqual(normalizeBodyWeight(20), 70);
  assert.strictEqual(normalizeBodyWeight(260), 200);
}

function testGoalDetect() {
  assert.strictEqual(isMuscleGainGoal('增肌'), true);
  assert.strictEqual(isMuscleGainGoal(['减脂', '增重']), true);
  assert.strictEqual(isMuscleGainGoal('塑形'), false);
}

function testEstimate() {
  const bulking = buildNutritionEstimate({ goal: '增肌', weightKg: 70 });
  assert.deepStrictEqual(
    {
      dailyCalories: bulking.dailyCalories,
      protein: bulking.protein,
      fat: bulking.fat,
      carbs: bulking.carbs
    },
    {
      dailyCalories: 2660,
      protein: 140,
      fat: 63,
      carbs: 383
    }
  );

  const cutting = buildNutritionEstimate({ goal: '减脂', weightKg: 70 });
  assert.strictEqual(cutting.dailyCalories, 1960);
  assert.strictEqual(cutting.protein, 112);
  assert.strictEqual(cutting.fat, 63);
  assert.strictEqual(cutting.carbs, 236);
}

function testFallbackMerge() {
  const merged = mergeNutritionFallback(
    { dailyCalories: 2100, protein: 0, tips: ['保留模型建议'] },
    { goal: '增肌', weightKg: 70 }
  );
  assert.strictEqual(merged.dailyCalories, 2100);
  assert.strictEqual(merged.protein, 140);
  assert.deepStrictEqual(merged.tips, ['保留模型建议']);
}

function testDayNutritionTarget() {
  const base = buildNutritionEstimate({ goal: '增肌', weightKg: 70 });
  const training = buildDayNutritionTarget(base, 'training');
  const rest = buildDayNutritionTarget(base, 'rest');
  assert.strictEqual(training.dailyCalories, 2660);
  assert.strictEqual(rest.protein, 140);
  assert.strictEqual(rest.carbs, 326);
  assert.strictEqual(rest.dailyCalories, 2431);
  assert.ok(rest.adjustmentText.includes('碳水下调'));
}

function run() {
  testWeightNormalize();
  testGoalDetect();
  testEstimate();
  testFallbackMerge();
  testDayNutritionTarget();
  console.log('nutritionInsight 算法测试通过');
}

run();
