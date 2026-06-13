const assert = require('assert');
const {
  buildCalorieTrend,
  buildWorkoutEstimate,
  CALORIE_FORMULA_VERSION,
  formatDuration
} = require('../miniprogram/utils/calorieEstimate');

function run() {
  const start = Date.parse('2026-06-13T10:00:00+08:00');

  const normal = buildWorkoutEstimate({
    startedAt: start,
    endedAt: start + 60 * 60 * 1000,
    completedSetCount: 18,
    bodyWeightKg: 70
  });
  assert.strictEqual(normal.durationSeconds, 3600);
  assert.strictEqual(normal.densityLevel, 'normal');
  assert.strictEqual(normal.estimatedCalories, 315);
  assert.strictEqual(normal.calorieFormulaVersion, CALORIE_FORMULA_VERSION);

  const isoTime = buildWorkoutEstimate({
    startedAt: '2026-06-13T10:00:00+08:00',
    endedAt: '2026-06-13T11:00:00+08:00',
    completedSetCount: 18,
    bodyWeightKg: 70
  });
  assert.strictEqual(isoTime.durationSeconds, 3600);
  assert.strictEqual(isoTime.estimatedCalories, 315);

  const invalidStart = buildWorkoutEstimate({
    startedAt: 'invalid-date',
    endedAt: start + 60 * 60 * 1000,
    completedSetCount: 18,
    bodyWeightKg: 70
  });
  assert.strictEqual(invalidStart.durationSeconds, 0);
  assert.strictEqual(invalidStart.estimatedCalories, null);

  const missingWeight = buildWorkoutEstimate({
    startedAt: start,
    endedAt: start + 60 * 60 * 1000,
    completedSetCount: 18,
    bodyWeightKg: null
  });
  assert.strictEqual(missingWeight.estimatedCalories, null);
  assert.strictEqual(missingWeight.calorieHint, '记录体重后可估算热量消耗');

  const tooShort = buildWorkoutEstimate({
    startedAt: start,
    endedAt: start + 2 * 60 * 1000,
    completedSetCount: 2,
    bodyWeightKg: 70
  });
  assert.strictEqual(tooShort.estimatedCalories, null);

  const capped = buildWorkoutEstimate({
    startedAt: start,
    endedAt: start + 5 * 60 * 60 * 1000,
    completedSetCount: 40,
    bodyWeightKg: 70
  });
  assert.strictEqual(capped.durationCapped, true);
  assert.ok(capped.estimatedCalories > 0);

  // 高密度训练会使用更高的密度系数。
  const highDensity = buildWorkoutEstimate({
    startedAt: start,
    endedAt: start + 30 * 60 * 1000,
    completedSetCount: 18,
    bodyWeightKg: 70
  });
  assert.strictEqual(highDensity.densityLevel, 'high');
  assert.strictEqual(highDensity.densityFactor, 1.15);

  assert.strictEqual(formatDuration(65 * 60), '1小时5分钟');
  assert.strictEqual(formatDuration(3600), '1小时');
  assert.strictEqual(formatDuration(60), '1分钟');

  const trend = buildCalorieTrend([
    { id: 'newest', completedAt: '2026-06-13T10:00:00+08:00', estimatedCalories: 300 },
    { id: 'ignored', completedAt: '2026-06-12T10:00:00+08:00', estimatedCalories: 0 },
    { id: 'middle', completedAt: '2026-06-11T10:00:00+08:00', estimatedCalories: 150 },
    { id: 'oldest', completedAt: '2026-06-10T10:00:00+08:00', estimatedCalories: 75 }
  ]);
  assert.deepStrictEqual(trend.map((item) => item.id), ['oldest', 'middle', 'newest']);
  assert.deepStrictEqual(trend.map((item) => item.calories), [75, 150, 300]);
  assert.strictEqual(trend[0].height, 36);
  assert.strictEqual(trend[2].height, 132);

  console.log('calorie estimate tests passed');
}

run();
