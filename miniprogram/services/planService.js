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

async function listCustomPlans() {
  if (!isCloudEnabled()) {
    return getCustomPlans().map((plan) => withPlanType(plan, 'custom'));
  }

  try {
    const collection = getCollection('customPlans');
    if (!collection) return getCustomPlans().map((plan) => withPlanType(plan, 'custom'));

    const result = await collection.limit(100).get();
    let cloudCustomPlans = (result.data || []).map((item) => ({
      id: item._id,
      planType: 'custom',
      name: item.name,
      goal: item.goal_tags || ['自定义'],
      level: '自定义',
      durationWeeks: 4,
      weeklyFrequency: item.weekly_frequency || item.days.length,
      summary: `我的自定义计划 · ${item.days.length} 个训练日 · ${item.days.reduce((sum, d) => sum + d.exercises.length, 0)} 个动作`,
      days: item.days,
      updatedAt: item.updated_at
    }));

    cloudCustomPlans.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    // 合并本地缓存
    const localPlans = getCustomPlans().map((plan) => withPlanType(plan, 'custom'));
    const allPlans = [...cloudCustomPlans];
    localPlans.forEach((localPlan) => {
      if (!allPlans.some((p) => p.id === localPlan.id)) {
        allPlans.push(localPlan);
      }
    });

    return allPlans;
  } catch (error) {
    console.warn('读取云端自定义计划失败，已回落本地数据', error);
    return getCustomPlans().map((plan) => withPlanType(plan, 'custom'));
  }
}

async function listAllPlans() {
  return {
    officialPlans: await listOfficialPlans(),
    customPlans: await listCustomPlans()
  };
}

async function getPlanById(planId, planType) {
  const sourcePlans = planType === 'custom' ? await listCustomPlans() : await listOfficialPlans();
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

async function saveUserPlan(plan) {
  saveCustomPlan(plan);

  if (!isCloudEnabled()) return plan;

  try {
    const collection = getCollection('customPlans');
    if (!collection) return plan;

    const dataToSave = {
      name: plan.name,
      goal_tags: plan.goal || ['自定义'],
      weekly_frequency: plan.weeklyFrequency,
      days: plan.days.map((day) => ({
        id: day.id,
        name: day.name,
        focus: day.focus || '自定义训练日',
        exercises: day.exercises.map((item) => ({
          exerciseId: item.exerciseId,
          sets: Number(item.sets),
          reps: item.reps,
          rpe: item.rpe,
          restSeconds: Number(item.restSeconds),
          role: item.role,
          roleLabel: item.roleLabel,
          weightRule: item.weightRule,
          progressionRule: item.progressionRule
        }))
      })),
      status: 'active',
      updated_at: new Date().toISOString()
    };

    try {
      await collection.doc(plan.id).update({
        data: dataToSave
      });
    } catch (err) {
      await collection.doc(plan.id).set({
        data: {
          ...dataToSave,
          created_at: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.warn('保存云端自定义计划失败', error);
  }
  return plan;
}

async function deleteUserPlan(planId) {
  // 1. 本地缓存删除
  const plans = getCustomPlans();
  const nextPlans = plans.filter((item) => item.id !== planId);
  wx.setStorageSync('customPlans', nextPlans);

  // 2. 检查并清理当前启用的计划
  const activePlan = getActivePlan();
  if (activePlan && activePlan.planId === planId) {
    wx.removeStorageSync('activePlan');
  }

  // 3. 云端删除
  if (!isCloudEnabled()) return true;

  try {
    const collection = getCollection('customPlans');
    if (!collection) return true;

    await collection.doc(planId).remove();
  } catch (error) {
    console.warn('删除云端自定义计划失败', error);
  }
  return true;
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
  deleteUserPlan,
  setActivePlanDay
};
