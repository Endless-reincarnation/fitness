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
    nutrition: template.nutrition || null,
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

function buildCustomPlanFromAiDraft(draft, activePlan) {
  const days = (draft.days || []).map((day, index) => ({
    id: day.id || `custom_day_${Date.now()}_${index}`,
    name: day.name || `训练日 ${index + 1}`,
    focus: day.focus || '自定义训练日',
    exercises: (day.exercises || []).map((item) => ({
      exerciseId: item.exerciseId,
      exerciseName: item.exerciseName,
      sets: item.sets,
      reps: item.reps,
      rpe: item.rpe,
      restSeconds: item.restSeconds,
      role: item.role,
      roleLabel: item.roleLabel,
      weightRule: item.weightRule,
      progressionRule: item.progressionRule,
      notes: item.notes || ''
    }))
  })).filter((day) => day.exercises.length);

  return {
    id: activePlan.planId,
    planType: 'custom',
    name: activePlan.name || draft.name,
    sourcePlanId: draft.id,
    goal: draft.goal || ['自定义'],
    level: draft.level || '自定义',
    durationWeeks: draft.durationWeeks || 4,
    weeklyFrequency: days.length || draft.weeklyFrequency || 1,
    equipmentTags: draft.equipmentTags || [],
    overview: draft.overview || '',
    generationSteps: draft.generationSteps || [],
    tips: draft.tips || [],
    nutrition: draft.nutrition || null,
    summary: draft.summary || `我的自定义计划 · ${days.length} 个训练日`,
    days
  };
}

function findRecoverableAiDraft(drafts, activePlan) {
  const activePlanTime = Number(String(activePlan.planId || '').replace('custom_plan_', '')) || Number(activePlan.startedAt || 0);
  const matchedByName = drafts.find((draft) => draft.name === activePlan.name);
  if (matchedByName) return matchedByName;

  return drafts.find((draft) => {
    const draftTime = Date.parse(draft.updatedAt || '') || Number(String(draft.id || '').replace('ai_draft_', '')) || 0;
    return activePlanTime && draftTime && Math.abs(draftTime - activePlanTime) < 10 * 60 * 1000;
  }) || null;
}

async function recoverCustomPlanFromAiDraft(activePlan) {
  if (!activePlan || activePlan.planType !== 'custom') return null;

  try {
    const { listAiPlanDrafts } = require('./aiPlanService');
    const drafts = listAiPlanDrafts();
    const matchedDraft = findRecoverableAiDraft(drafts, activePlan);
    if (!matchedDraft || !matchedDraft.days || !matchedDraft.days.length) return null;

    // AI 计划详情缺失时，优先用本地 AI 草稿恢复正式自定义计划，避免只剩启用状态。
    const recoveredPlan = buildCustomPlanFromAiDraft(matchedDraft, activePlan);
    await saveUserPlan(recoveredPlan);
    return recoveredPlan;
  } catch (error) {
    console.warn('从 AI 草稿恢复自定义计划失败', error);
    return null;
  }
}

async function listCloudQuery(buildQuery) {
  const all = [];
  const pageSize = 20;
  while (true) {
    const result = await buildQuery()
      .skip(all.length)
      .limit(pageSize)
      .get();
    const rows = result.data || [];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}

function listLocalOfficialPlans() {
  return plans.map((plan) => withPlanType(plan, 'official'));
}

async function listCloudOfficialPlans() {
  const templateCollection = getCollection('planTemplates');
  const dayCollection = getCollection('planDays');
  const exerciseCollection = getCollection('planDayExercises');
  if (!templateCollection || !dayCollection || !exerciseCollection) return [];

  const templates = await listCloudQuery(() => templateCollection
    .where({ status: 'published' })
    .orderBy('updated_at', 'desc'));

  if (!templates.length) return [];

  const plansWithChildren = await Promise.all(templates.map(async (template) => {
    const plan = normalizeTemplate(template);
    const version = template.current_version || template.version || 1;
    const [daysResult, exercisesResult] = await Promise.all([
      dayCollection
        .where({ plan_template_id: plan.id, plan_version: version })
        .orderBy('day_index', 'asc')
        .get(),
      exerciseCollection
        .where({ plan_template_id: plan.id, plan_version: version })
        .orderBy('order', 'asc')
        .get()
    ]);
    const exerciseMap = (exercisesResult.data || []).reduce((map, item) => {
      const planDayId = item.plan_day_id;
      if (!map[planDayId]) map[planDayId] = [];
      map[planDayId].push(normalizeDayExercise(item));
      return map;
    }, {});
    const planDays = (daysResult.data || []).map(normalizeDay).sort((a, b) => a.dayIndex - b.dayIndex);
    plan.days = planDays.map((day) => ({
      ...day,
      exercises: (exerciseMap[day.id] || []).sort((a, b) => a.order - b.order)
    }));
    return plan;
  }));

  return plansWithChildren;
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

    // 用户私有集合依赖云数据库权限按创建者自动隔离，禁止空结果后回退全量查询。
    const cloudCustomPlansRaw = await listCloudQuery(() => collection.orderBy('updated_at', 'desc'));
    let cloudCustomPlans = cloudCustomPlansRaw.map((item) => ({
      id: item._id,
      planType: 'custom',
      name: item.name,
      goal: item.goal_tags || ['自定义'],
      level: '自定义',
      durationWeeks: 4,
      weeklyFrequency: item.weekly_frequency || (item.days || []).length,
      summary: `我的自定义计划 · ${(item.days || []).length} 个训练日 · ${(item.days || []).reduce((sum, d) => sum + ((d.exercises || []).length), 0)} 个动作`,
      overview: item.overview || '',
      generationSteps: item.generation_steps || [],
      tips: item.tips || [],
      nutrition: item.nutrition || null,
      days: item.days || [],
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

    const activePlan = getActivePlan();
    if (activePlan && activePlan.planType === 'custom' && !allPlans.some((plan) => plan.id === activePlan.planId)) {
      const recoveredPlan = await recoverCustomPlanFromAiDraft(activePlan);
      if (recoveredPlan) allPlans.unshift(recoveredPlan);
    }

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

    // 用户私有集合由权限规则隔离当前用户，只保留业务条件。
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

    // 只更新当前用户权限可见的活跃计划，避免误改其他用户记录。
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

  let plan = activePlan ? await getPlanById(activePlan.planId, activePlan.planType) : null;
  if (activePlan && !plan) {
    plan = await recoverCustomPlanFromAiDraft(activePlan);
  }
  if (activePlan && !plan) {
    // 计划详情可能因云端权限、网络或本地缓存未恢复而暂时查不到，不能直接清除用户当前计划。
    console.warn('当前计划详情暂时不可用，已保留启用状态', activePlan);
    return {
      activePlan,
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
  
  let nutrition = plan.nutrition || null;
  if (nutrition && plan.planType !== 'custom') {
    try {
      // 动态 require 避免循环依赖
      const { getUserProfile } = require('./userService');
      const { getBodyWeights } = require('./workoutService');
      
      const profile = await getUserProfile();
      const weights = await getBodyWeights();
      const latestWeight = weights && weights[0] ? weights[0].weightKg : null;
      const currentWeight = (profile && profile.current_weight_kg) || latestWeight;
      
      if (currentWeight) {
        const weight = Number(currentWeight);
        const isBulking = plan.goal && plan.goal.some(g => g.includes('增肌') || g.includes('增重'));
        
        const protein = Math.round(weight * (isBulking ? 2.0 : 1.6));
        const dailyCalories = Math.round(weight * (isBulking ? 38 : 28));
        const fat = Math.round(weight * 0.9);
        const carbs = Math.round((dailyCalories - protein * 4 - fat * 9) / 4);
        
        nutrition = {
          ...nutrition,
          dailyCalories,
          protein,
          carbs,
          fat,
          isCustomizedByWeight: true,
          userWeight: weight
        };
      }
    } catch (e) {
      console.warn('动态估算官方计划饮食失败：', e);
    }
  }

  return {
    ...plan,
    days,
    nutrition
  };
}

async function enablePlan(plan) {
  const activePlan = setActivePlan(plan);

  if (isCloudEnabled()) {
    try {
      const collection = getCollection('userPlans');
      if (collection) {
        // 1. 将当前用户权限可见的活跃计划状态修改为 abandoned (已放弃)
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

    const now = new Date().toISOString();
    const dataToSave = {
      name: plan.name,
      goal_tags: plan.goal || ['自定义'],
      weekly_frequency: plan.weeklyFrequency,
      overview: plan.overview || '',
      generation_steps: plan.generationSteps || [],
      tips: plan.tips || [],
      nutrition: plan.nutrition || null,
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
      updated_at: now
    };

    // 自定义计划使用稳定 ID 保存；直接 set 可避免 update 不存在文档时静默 updated=0。
    await collection.doc(plan.id).set({
      data: {
        ...dataToSave,
        created_at: plan.createdAt || plan.created_at || now
      }
    });
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
        // 只推进当前用户权限可见的活跃计划。
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
        // 手动切换训练日时同样只更新当前用户权限可见的活跃计划。
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
