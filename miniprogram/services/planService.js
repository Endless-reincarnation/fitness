const { plans } = require('../data/mock');
const {
  advanceActivePlan,
  getActivePlan,
  getCustomPlans,
  saveCustomPlan,
  setActivePlan,
  setActivePlanDay
} = require('../utils/workout');
const { getExerciseById } = require('./exerciseService');

function withPlanType(plan, planType) {
  return {
    ...plan,
    planType: plan.planType || planType
  };
}

function listOfficialPlans() {
  return plans.map((plan) => withPlanType(plan, 'official'));
}

function listCustomPlans() {
  return getCustomPlans().map((plan) => withPlanType(plan, 'custom'));
}

function listAllPlans() {
  return {
    officialPlans: listOfficialPlans(),
    customPlans: listCustomPlans()
  };
}

function getPlanById(planId, planType) {
  const sourcePlans = planType === 'custom' ? listCustomPlans() : listOfficialPlans();
  return sourcePlans.find((plan) => plan.id === planId) || null;
}

function getActivePlanDetail() {
  const activePlan = getActivePlan();
  const plan = activePlan ? getPlanById(activePlan.planId, activePlan.planType) : null;

  return {
    activePlan,
    plan
  };
}

function buildDayView(day) {
  if (!day) return null;

  return {
    ...day,
    exercises: day.exercises.map((item) => ({
      ...item,
      detail: getExerciseById(item.exerciseId)
    }))
  };
}

function buildPlanView(plan) {
  if (!plan) return null;

  return {
    ...plan,
    days: plan.days.map(buildDayView)
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
