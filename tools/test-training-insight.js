const assert = require('assert');

const {
  buildExercisePerformance,
  buildExerciseProgressList,
  buildProgressionSuggestions,
  buildWeeklyInsight,
  estimateOneRepMax,
  getSuggestedNextWeight,
  roundTrainingWeight
} = require('../miniprogram/utils/trainingInsight');

function makeRecord(overrides) {
  return {
    exerciseId: 'barbell_bench_press',
    exerciseName: '杠铃卧推',
    setIndex: 1,
    weightKg: 40,
    reps: 10,
    targetReps: '8-12',
    plannedSets: 3,
    role: 'main',
    ...overrides
  };
}

function makeCurrentWeekDate(offsetDays = 0) {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset + offsetDays, 12, 0, 0);
  return date.toISOString();
}

function testProgressionSuggestions() {
  const increase = buildProgressionSuggestions([
    makeRecord({ setIndex: 1, reps: 12 }),
    makeRecord({ setIndex: 2, reps: 12 }),
    makeRecord({ setIndex: 3, reps: 12 })
  ])[0];
  assert.strictEqual(increase.action, 'increase');
  assert.strictEqual(increase.nextWeightKg, getSuggestedNextWeight(40, 'main'));

  const addReps = buildProgressionSuggestions([
    makeRecord({ setIndex: 1, reps: 12 }),
    makeRecord({ setIndex: 2, reps: 11 }),
    makeRecord({ setIndex: 3, reps: 11 })
  ])[0];
  assert.strictEqual(addReps.action, 'add_reps');

  const reduce = buildProgressionSuggestions([
    makeRecord({ setIndex: 1, reps: 8 }),
    makeRecord({ setIndex: 2, reps: 7 }),
    makeRecord({ setIndex: 3, reps: 6 })
  ])[0];
  assert.strictEqual(reduce.action, 'reduce');

  const trackWeight = buildProgressionSuggestions([
    makeRecord({ setIndex: 1, weightKg: 0, reps: 12 }),
    makeRecord({ setIndex: 2, weightKg: 0, reps: 12 })
  ])[0];
  assert.strictEqual(trackWeight.action, 'track_weight');
}

function testMathHelpers() {
  assert.strictEqual(roundTrainingWeight(42.24), 42);
  assert.strictEqual(roundTrainingWeight(42.26), 42.5);
  assert.strictEqual(getSuggestedNextWeight(40, 'main'), 41.5);
  assert.strictEqual(Math.round(estimateOneRepMax(40, 10) * 10) / 10, 53.3);
}

function testWeeklyInsight() {
  const history = [
    { completedAt: makeCurrentWeekDate(0), setCount: 6, totalVolume: 1200 },
    { completedAt: makeCurrentWeekDate(2), setCount: 8, totalVolume: 1600 }
  ];
  const insight = buildWeeklyInsight(history, 4);
  assert.strictEqual(insight.completedDays, 2);
  assert.strictEqual(insight.progressPercent, 50);
  assert.strictEqual(insight.totalSets, 14);
  assert.strictEqual(insight.totalVolume, 2800);
}

function testExerciseProgressAndPerformance() {
  const history = [
    {
      completedAt: '2026-06-10T12:00:00.000Z',
      planName: '测试计划',
      dayName: '推力日',
      setCount: 2,
      totalVolume: 1120,
      records: [
        makeRecord({ weightKg: 40, reps: 12 }),
        makeRecord({ weightKg: 42.5, reps: 10 })
      ],
      suggestions: [
        { exerciseId: 'barbell_bench_press', actionLabel: '小幅加重', targetText: '44kg · 先守住 8 次下限', advice: '测试建议' }
      ]
    },
    {
      completedAt: '2026-06-03T12:00:00.000Z',
      planName: '测试计划',
      dayName: '推力日',
      setCount: 2,
      totalVolume: 960,
      records: [
        makeRecord({ weightKg: 40, reps: 10 }),
        makeRecord({ weightKg: 40, reps: 9 })
      ],
      suggestions: []
    }
  ];

  const progress = buildExerciseProgressList(history)[0];
  assert.strictEqual(progress.exerciseId, 'barbell_bench_press');
  assert.strictEqual(progress.isUp, true);

  const performance = buildExercisePerformance('barbell_bench_press', history);
  assert.strictEqual(performance.sessionCount, 2);
  assert.strictEqual(performance.bestWeight, 42.5);
  assert.strictEqual(performance.bestReps, 12);
  assert.strictEqual(performance.suggestion.actionLabel, '小幅加重');
}

function run() {
  testMathHelpers();
  testProgressionSuggestions();
  testWeeklyInsight();
  testExerciseProgressAndPerformance();
  console.log('trainingInsight 算法测试通过');
}

run();
