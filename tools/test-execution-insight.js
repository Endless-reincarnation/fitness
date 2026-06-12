const assert = require('assert');

const {
  applyScheduleOverrides,
  buildExecutionInsight,
  buildNutritionFocus,
  buildWeeklySchedule,
  getWeeklyTargetDays
} = require('../miniprogram/utils/executionInsight');

const plan = {
  weeklyFrequency: 3,
  days: [
    { name: '推力日' },
    { name: '拉力日' },
    { name: '下肢日' }
  ]
};

const activePlan = {
  currentDayIndex: 1,
  totalDays: 3
};

function testWeeklySchedule() {
  const schedule = buildWeeklySchedule(plan, activePlan, [], '2026-06-10T10:00:00.000Z');
  assert.strictEqual(schedule.length, 7);
  assert.strictEqual(schedule[0].label, '推力日');
  assert.strictEqual(schedule[2].label, '拉力日');
  assert.strictEqual(schedule[4].label, '下肢日');
  assert.strictEqual(schedule[2].isToday, true);
}

function testScheduleOverrides() {
  const schedule = buildWeeklySchedule(
    plan,
    activePlan,
    [],
    '2026-06-10T10:00:00.000Z',
    { 3: 'rest', 4: 'training' }
  );
  assert.strictEqual(schedule[2].type, 'rest');
  assert.strictEqual(schedule[2].label, '休息');
  assert.strictEqual(schedule[3].type, 'training');
  assert.strictEqual(schedule[3].label, '拉力日');

  const normalized = applyScheduleOverrides(
    [{ weekday: 1, type: 'training' }, { weekday: 2, type: 'rest' }],
    [{ weekday: 1, type: 'rest' }]
  );
  assert.strictEqual(normalized[0].type, 'rest');
}

function testAdviceTraining() {
  const insight = buildExecutionInsight({
    plan,
    activePlan,
    history: [
      { completedAt: '2026-06-08T10:00:00.000Z' }
    ],
    baseDate: '2026-06-10T12:00:00.000Z'
  });
  assert.strictEqual(insight.todayAdvice.type, 'training');
  assert.strictEqual(insight.todayAdvice.completedDays, 1);
  assert.strictEqual(insight.todayAdvice.targetDays, 3);
  assert.strictEqual(insight.todayAdvice.remainingDays, 2);
  assert.strictEqual(insight.todayAdvice.progressPercent, 33);
  assert.strictEqual(insight.todayAdvice.nextDayName, '拉力日');
  assert.strictEqual(insight.todayAdvice.nutritionFocus.dayType, 'training');
}

function testAdviceRestByRecovery() {
  const insight = buildExecutionInsight({
    plan,
    activePlan,
    history: [
      { completedAt: '2026-06-10T01:00:00.000Z' }
    ],
    baseDate: '2026-06-10T12:00:00.000Z'
  });
  assert.strictEqual(insight.todayAdvice.type, 'rest');
}

function testAdviceOptionalOnRestDay() {
  const insight = buildExecutionInsight({
    plan,
    activePlan,
    history: [
      { completedAt: '2026-06-09T08:00:00.000Z' }
    ],
    baseDate: '2026-06-11T12:00:00.000Z'
  });
  assert.strictEqual(insight.todayAdvice.type, 'optional');
}

function testTargetAndNutritionFocus() {
  assert.strictEqual(getWeeklyTargetDays({ weeklyFrequency: 5 }, activePlan), 5);
  assert.strictEqual(buildNutritionFocus('rest').title, '休息日');
  assert.strictEqual(buildNutritionFocus('optional').dayType, 'optional');
}

function run() {
  testWeeklySchedule();
  testScheduleOverrides();
  testAdviceTraining();
  testAdviceRestByRecovery();
  testAdviceOptionalOnRestDay();
  testTargetAndNutritionFocus();
  console.log('executionInsight 算法测试通过');
}

run();
