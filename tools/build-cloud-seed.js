const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const seedDir = path.join(rootDir, 'seed');
const outputDir = path.join(seedDir, 'cloud-import');
const generatedAt = new Date().toISOString();

const roleRules = {
  main: {
    role_label: '主项',
    weight_rule: '选择能完成目标次数且保留约 2 次余量的重量，动作质量优先。',
    progression_rule: '如果所有组都达到次数上限且 RPE 不高于 8，下次小幅加重；否则维持重量。'
  },
  assistance: {
    role_label: '辅助项',
    weight_rule: '选择中等重量，能稳定完成目标次数，不需要每组做到力竭。',
    progression_rule: '如果所有组都达到目标次数上限，下次可小幅加重或增加 1-2 次；动作变形则维持。'
  },
  isolation: {
    role_label: '孤立项',
    weight_rule: '使用小重量控制动作轨迹，最后 1-2 组可以接近力竭。',
    progression_rule: '优先增加次数和控制感，连续稳定达到上限后再小幅加重。'
  }
};

function readJsonBySuffix(suffix) {
  const fileName = fs.readdirSync(seedDir).find((name) => name.endsWith(suffix));
  if (!fileName) {
    throw new Error(`找不到种子文件：${suffix}`);
  }
  return JSON.parse(fs.readFileSync(path.join(seedDir, fileName), 'utf8'));
}

function withTimestamps(record) {
  return {
    ...record,
    created_at: record.created_at || generatedAt,
    updated_at: record.updated_at || generatedAt
  };
}

function normalizePlanTemplate(planTemplate) {
  const version = Number(planTemplate.version || planTemplate.current_version || 1);
  return withTimestamps({
    _id: planTemplate._id || planTemplate.id,
    name: planTemplate.name,
    source_type: planTemplate.source_type,
    goal_tags: planTemplate.goal_tags || planTemplate.goal || [],
    level: planTemplate.level,
    duration_weeks: planTemplate.duration_weeks,
    weekly_frequency: planTemplate.weekly_frequency,
    equipment_tags: planTemplate.equipment_tags || [],
    target_users: planTemplate.target_users || [],
    status: planTemplate.status || 'draft',
    current_version: version,
    version,
    summary: planTemplate.summary || '',
    notes: planTemplate.notes || []
  });
}

function normalizePlanDay(day, planTemplate) {
  return withTimestamps({
    _id: day._id || day.id,
    plan_template_id: planTemplate._id,
    plan_version: planTemplate.current_version,
    day_index: day.day_index,
    name: day.name,
    focus: day.focus || '',
    target_muscles: day.target_muscles || []
  });
}

function normalizePlanDayExercise(day, exercise, planTemplate) {
  const rules = roleRules[exercise.role] || {};
  return withTimestamps({
    _id: `${day._id}_${String(exercise.order).padStart(2, '0')}_${exercise.exercise_id}`,
    plan_template_id: planTemplate._id,
    plan_version: planTemplate.current_version,
    plan_day_id: day._id,
    exercise_id: exercise.exercise_id,
    exercise_name: exercise.name,
    order: exercise.order,
    role: exercise.role,
    role_label: rules.role_label || '',
    sets: exercise.sets,
    reps: exercise.reps,
    rpe: exercise.rpe,
    rest_seconds: exercise.rest_seconds,
    weight_rule: exercise.weight_rule || rules.weight_rule || '',
    progression_rule: exercise.progression_rule || rules.progression_rule || '',
    notes: exercise.notes || ''
  });
}

function buildCloudSeed() {
  fs.mkdirSync(outputDir, { recursive: true });

  const muscles = readJsonBySuffix('肌群.seed.json').map((item) => withTimestamps(item));
  const exercises = readJsonBySuffix('动作库.seed.json').map((item) => withTimestamps(item));
  const planSeed = readJsonBySuffix('三分化计划.seed.json');
  const planTemplate = normalizePlanTemplate(planSeed.plan_template);
  const planDays = planSeed.plan_days.map((day) => normalizePlanDay(day, planTemplate));
  const planDayExercises = planSeed.plan_days.flatMap((day) => {
    const normalizedDay = normalizePlanDay(day, planTemplate);
    return day.exercises.map((exercise) => normalizePlanDayExercise(normalizedDay, exercise, planTemplate));
  });
  const planTemplateVersion = {
    _id: `${planTemplate._id}_v${planTemplate.current_version}`,
    plan_template_id: planTemplate._id,
    version: planTemplate.current_version,
    snapshot: {
      plan_template: planTemplate,
      plan_days: planDays,
      plan_day_exercises: planDayExercises
    },
    status: planTemplate.status,
    created_at: generatedAt,
    published_at: planTemplate.status === 'published' ? generatedAt : null
  };

  const collections = {
    muscles,
    exercises,
    plan_templates: [planTemplate],
    plan_template_versions: [planTemplateVersion],
    plan_days: planDays,
    plan_day_exercises: planDayExercises,
    exercise_alternatives: []
  };

  Object.entries(collections).forEach(([collectionName, records]) => {
    fs.writeFileSync(
      path.join(outputDir, `${collectionName}.json`),
      `${JSON.stringify(records, null, 2)}\n`,
      'utf8'
    );
  });

  const manifest = {
    generated_at: generatedAt,
    source_dir: 'seed',
    import_order: Object.keys(collections),
    counts: Object.fromEntries(Object.entries(collections).map(([name, records]) => [name, records.length]))
  };
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return manifest;
}

const manifest = buildCloudSeed();
console.log(JSON.stringify(manifest, null, 2));
