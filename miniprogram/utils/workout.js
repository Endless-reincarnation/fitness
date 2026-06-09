function getActivePlan() {
  // 当前使用本地缓存模拟用户启用计划。
  return wx.getStorageSync('activePlan') || null;
}

function setActivePlan(plan) {
  const activePlan = {
    planId: plan.id,
    planType: plan.planType || 'official',
    name: plan.name,
    currentDayIndex: 0,
    totalDays: plan.days ? plan.days.length : 1,
    completedSessions: 0,
    startedAt: Date.now()
  };
  wx.setStorageSync('activePlan', activePlan);
  return activePlan;
}

function advanceActivePlan(totalDays) {
  const activePlan = getActivePlan();
  if (!activePlan) return null;

  const safeTotalDays = Math.max(Number(totalDays || activePlan.totalDays || 1), 1);
  const nextPlan = {
    ...activePlan,
    totalDays: safeTotalDays,
    currentDayIndex: (Number(activePlan.currentDayIndex || 0) + 1) % safeTotalDays,
    completedSessions: Number(activePlan.completedSessions || 0) + 1,
    updatedAt: Date.now()
  };

  wx.setStorageSync('activePlan', nextPlan);
  return nextPlan;
}

function setActivePlanDay(dayIndex) {
  const activePlan = getActivePlan();
  if (!activePlan) return null;

  const safeTotalDays = Math.max(Number(activePlan.totalDays || 1), 1);
  const safeDayIndex = Math.min(Math.max(Number(dayIndex || 0), 0), safeTotalDays - 1);
  const nextPlan = {
    ...activePlan,
    currentDayIndex: safeDayIndex,
    updatedAt: Date.now()
  };

  wx.setStorageSync('activePlan', nextPlan);
  return nextPlan;
}

function getCustomPlans() {
  return wx.getStorageSync('customPlans') || [];
}

function saveCustomPlan(plan) {
  const plans = getCustomPlans();
  const nextPlan = {
    ...plan,
    planType: 'custom',
    updatedAt: Date.now()
  };
  const existingIndex = plans.findIndex((item) => item.id === nextPlan.id);
  if (existingIndex >= 0) {
    plans[existingIndex] = nextPlan;
  } else {
    plans.unshift(nextPlan);
  }
  wx.setStorageSync('customPlans', plans);
  return nextPlan;
}

function getWorkoutHistory() {
  return wx.getStorageSync('workoutHistory') || [];
}

function getWorkoutDraft() {
  return wx.getStorageSync('workoutDraft') || null;
}

function saveWorkoutDraft(draft) {
  const nextDraft = {
    ...draft,
    updatedAt: Date.now()
  };
  wx.setStorageSync('workoutDraft', nextDraft);
  return nextDraft;
}

function clearWorkoutDraft() {
  wx.removeStorageSync('workoutDraft');
}

function saveWorkoutSession(session) {
  const history = getWorkoutHistory();
  history.unshift(session);
  wx.setStorageSync('workoutHistory', history);
}

function getBodyWeights() {
  return wx.getStorageSync('bodyWeights') || [];
}

function saveBodyWeight(record) {
  const records = getBodyWeights();
  const sameDayIndex = records.findIndex((item) => item.date === record.date);
  if (sameDayIndex >= 0) {
    records[sameDayIndex] = record;
  } else {
    records.unshift(record);
  }
  wx.setStorageSync('bodyWeights', records);
}

module.exports = {
  getActivePlan,
  setActivePlan,
  advanceActivePlan,
  setActivePlanDay,
  getCustomPlans,
  saveCustomPlan,
  getWorkoutHistory,
  getWorkoutDraft,
  saveWorkoutDraft,
  clearWorkoutDraft,
  saveWorkoutSession,
  getBodyWeights,
  saveBodyWeight
};
