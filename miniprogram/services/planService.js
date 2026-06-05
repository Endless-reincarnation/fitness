const { plans } = require('../data/mock');
const {
  advanceActivePlan,
  getActivePlan,
  getCustomPlans,
  saveCustomPlan,
  setActivePlan,
  setActivePlanDay
} = require('../utils/workout');
const { getCollection, isCloudEnabled } = require('./cloudService');
const { getExerciseById } = require('./exerciseService');

let cloudPlansCache = null;

const levelTextMap = {
  beginner: '新手',
  intermediate: '进阶',
  advanced: '高级'
};

function withPlanType(plan, planType) {
  return {
    ...plan,
    planType: plan.planType || planType
  };
}

function normalizeTemplate(template) {
  return withPlanType({
    id: template.id || template._id,
    name: template.name,
    goal: template.goal || template.goal_tags || [],
    level: levelTextMap[template.level] || template.level,
    durationWeeks: template.durationWeeks || template.duration_weeks,
    weeklyFrequency: template.weeklyFrequency || template.weekly_frequency,
    equipmentTags: template.equipmentTags || template.equipment_tags || [],
    targetUsers: template.targetUsers || template.target_users || [],
    status: template.status,
    version: template.version || template.current_version || 1,
    summary: template.summary || '',
    notes: template.notes || [],
    days: []
  }, 'official');
}

function normalizeDay(day) {
  return {
    id: day.id || day._id,
    dayIndex: day.dayIndex || day.day_index,
    name: day.name,
    focus: day.focus || '',
    targetMuscles: day.targetMuscles || day.target_muscles || [],
    exercises: []
  };
}

function normalizeDayExercise(item) {
  return {
    exerciseId: item.exerciseId || item.exercise_id,
    exerciseName: item.exerciseName || item.exercise_name,
    order: item.order,
    role: item.role,
    roleLabel: item.roleLabel || item.role_label,
    sets: item.sets,
    reps: item.reps,
    rpe: item.rpe,
    restSeconds: item.restSeconds || item.rest_seconds,
    weightRule: item.weightRule || item.weight_rule || '',
    progressionRule: item.progressionRule || item.progression_rule || '',
    notes: item.notes || ''
  };
}

async function listCloudCollection(collectionKey) {
  const collection = getCollection(collectionKey);
  if (!collection) return [];

  const result = await collection.limit(100).get();
  return result.data || [];
}

function listLocalOfficialPlans() {
  return plans.map((plan) => withPlanType(plan, 'official'));
}

async function listCloudOfficialPlans() {
  const [templates, days, dayExercises] = await Promise.all([
    listCloudCollection('planTemplates'),
    listCloudCollection('planDays'),
    listCloudCollection('planDayExercises')
  ]);

  if (!templates.length) return [];

  const dayMap = days.reduce((map, item) => {
    const planTemplateId = item.plan_template_id;
    if (!map[planTemplateId]) map[planTemplateId] = [];
    map[planTemplateId].push(normalizeDay(item));
    return map;
  }, {});

  const exerciseMap = dayExercises.reduce((map, item) => {
    const planDayId = item.plan_day_id;
    if (!map[planDayId]) map[planDayId] = [];
    map[planDayId].push(normalizeDayExercise(item));
    return map;
  }, {});

  return templates.map((template) => {
    const plan = normalizeTemplate(template);
    const planDays = (dayMap[plan.id] || []).sort((a, b) => a.dayIndex - b.dayIndex);
    plan.days = planDays.map((day) => ({
      ...day,
      exercises: (exerciseMap[day.id] || []).sort((a, b) => a.order - b.order)
    }));
    return plan;
  });
}

async function listOfficialPlans() {
  if (!isCloudEnabled()) return listLocalOfficialPlans();

  try {
    const cloudPlans = await listCloudOfficialPlans();
    if (!cloudPlans.length) return listLocalOfficialPlans();
    cloudPlansCache = cloudPlans;
    return cloudPlans;
  } catch (error) {
    console.warn('读取云端计划库失败，已回落本地数据', error);
    return listLocalOfficialPlans();
  }
}

function listCustomPlans() {
  return getCustomPlans().map((plan) => withPlanType(plan, 'custom'));
}

async function listAllPlans() {
  return {
    officialPlans: await listOfficialPlans(),
    customPlans: listCustomPlans()
  };
}

async function getPlanById(planId, planType) {
  const sourcePlans = planType === 'custom' ? listCustomPlans() : await listOfficialPlans();
  return sourcePlans.find((plan) => plan.id === planId) || null;
}

async function getActivePlanDetail() {
  const activePlan = getActivePlan();
  const plan = activePlan ? await getPlanById(activePlan.planId, activePlan.planType) : null;

  return {
    activePlan,
    plan
  };
}

async function buildDayView(day) {
  if (!day) return null;

  const exercises = await Promise.all(day.exercises.map(async (item) => ({
    ...item,
    detail: await getExerciseById(item.exerciseId)
  })));

  return {
    ...day,
    exercises
  };
}

async function buildPlanView(plan) {
  if (!plan) return null;

  const days = await Promise.all(plan.days.map(buildDayView));
  return {
    ...plan,
    days
  };
}

function enablePlan(plan) {
  return setActivePlan(plan);
}

function saveUserPlan(plan) {
  return saveCustomPlan(plan);
}

module.exports = {
  advanceActivePlan,
  buildDayView,
  buildPlanView,
  enablePlan,
  getActivePlanDetail,
  getPlanById,
  listAllPlans,
  listCustomPlans,
  listOfficialPlans,
  saveUserPlan,
  setActivePlanDay
};
