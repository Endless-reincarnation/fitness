const { plans } = require('../data/mock');
const workoutStore = require('../utils/workout');
const { getCollection, isCloudEnabled } = require('./cloudService');
const { getExerciseById } = require('./exerciseService');

const getActivePlan = () => workoutStore.getActivePlan();
const clearActivePlan = () => workoutStore.clearActivePlan();
const getCustomPlans = () => workoutStore.getCustomPlans();
const saveCustomPlan = (plan) => workoutStore.saveCustomPlan(plan);
const setActivePlan = (plan) => workoutStore.setActivePlan(plan);

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
      overview: item.overview || '',
      generationSteps: item.generation_steps || [],
      tips: item.tips || [],
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

async function getActivePlanFromCloud() {
  if (!isCloudEnabled()) return null;

  try {
    const collection = getCollection('userPlans');
    if (!collection) return null;

    const res = await collection
      .where({ status: 'active' })
      .orderBy('updated_at', 'desc')
      .limit(1)
      .get();

    if (res.data && res.data.length > 0) {
      const cloudRecord = res.data[0];
      return {
        planId: cloudRecord.plan_id,
        planType: cloudRecord.plan_type,
        name: cloudRecord.name,
        currentDayIndex: cloudRecord.current_day_index || 0,
        totalDays: cloudRecord.total_days || 1,
        completedSessions: cloudRecord.completed_sessions || 0,
        startedAt: cloudRecord.started_at || Date.now()
      };
    }
  } catch (error) {
    console.warn('拉取云端活跃计划失败', error);
  }
  return null;
}

async function abandonCloudActivePlan(planId) {
  if (!isCloudEnabled()) return;

  try {
    const collection = getCollection('userPlans');
    if (!collection) return;

    const result = await collection.where({ status: 'active', plan_id: planId }).get();
    for (const record of result.data || []) {
      await collection.doc(record._id).update({
        data: {
          status: 'abandoned',
          updated_at: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.warn('清理云端活跃计划失败', error);
  }
}

async function getActivePlanDetail() {
  let activePlan = getActivePlan();

  if (!activePlan && isCloudEnabled()) {
    activePlan = await getActivePlanFromCloud();
    if (activePlan) {
      wx.setStorageSync('activePlan', activePlan);
    }
  }

  const plan = activePlan ? await getPlanById(activePlan.planId, activePlan.planType) : null;
  if (activePlan && !plan) {
    // 活跃计划指向的模板或自定义计划已不存在时，立即清理状态，避免页面继续展示悬空计划。
    clearActivePlan();
    await abandonCloudActivePlan(activePlan.planId);
    return {
      activePlan: null,
      plan: null
    };
  }

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

async function enablePlan(plan) {
  const activePlan = setActivePlan(plan);

  if (isCloudEnabled()) {
    try {
      const collection = getCollection('userPlans');
      if (collection) {
        // 1. 将该用户在云端所有活跃的计划状态修改为 abandoned (已放弃)
        const activeRecords = await collection.where({ status: 'active' }).get();
        if (activeRecords.data && activeRecords.data.length > 0) {
          for (const record of activeRecords.data) {
            await collection.doc(record._id).update({
              data: {
                status: 'abandoned',
                updated_at: new Date().toISOString()
              }
            });
          }
        }

        // 2. 添加新活跃计划记录到云端
        await collection.add({
          data: {
            plan_id: activePlan.planId,
            plan_type: activePlan.planType,
            name: activePlan.name,
            current_day_index: activePlan.currentDayIndex,
            total_days: activePlan.totalDays,
            completed_sessions: activePlan.completedSessions,
            started_at: activePlan.startedAt,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.warn('云端同步启用计划失败', error);
    }
  }

  return activePlan;
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
      overview: plan.overview || '',
      generation_steps: plan.generationSteps || [],
      tips: plan.tips || [],
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
    clearActivePlan();
  }

  // 3. 云端删除
  if (!isCloudEnabled()) return true;

  try {
    const collection = getCollection('customPlans');
    if (!collection) return true;

    await collection.doc(planId).remove();
    await abandonCloudActivePlan(planId);
  } catch (error) {
    console.warn('删除云端自定义计划失败', error);
  }
  return true;
}

async function advanceActivePlan(totalDays) {
  const nextPlan = workoutStore.advanceActivePlan(totalDays);
  if (nextPlan && isCloudEnabled()) {
    try {
      const collection = getCollection('userPlans');
      if (collection) {
        const res = await collection
          .where({ status: 'active' })
          .orderBy('updated_at', 'desc')
          .limit(1)
          .get();

        if (res.data && res.data.length > 0) {
          await collection.doc(res.data[0]._id).update({
            data: {
              current_day_index: nextPlan.currentDayIndex,
              completed_sessions: nextPlan.completedSessions,
              updated_at: new Date().toISOString()
            }
          });
        }
      }
    } catch (error) {
      console.warn('云端同步推进训练日失败', error);
    }
  }
  return nextPlan;
}

async function setActivePlanDay(dayIndex) {
  const nextPlan = workoutStore.setActivePlanDay(dayIndex);
  if (nextPlan && isCloudEnabled()) {
    try {
      const collection = getCollection('userPlans');
      if (collection) {
        const res = await collection
          .where({ status: 'active' })
          .orderBy('updated_at', 'desc')
          .limit(1)
          .get();

        if (res.data && res.data.length > 0) {
          await collection.doc(res.data[0]._id).update({
            data: {
              current_day_index: nextPlan.currentDayIndex,
              updated_at: new Date().toISOString()
            }
          });
        }
      }
    } catch (error) {
      console.warn('云端同步切换训练日失败', error);
    }
  }
  return nextPlan;
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
