const { plans, getExercise } = require('../../data/mock');
const { getActivePlan, getCustomPlans, getWorkoutDraft, getWorkoutHistory, getBodyWeights, setActivePlanDay } = require('../../utils/workout');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    activePlan: null,
    todayDay: null,
    dayOptions: [],
    firstExercise: null,
    totalDays: 0,
    nextDayName: '',
    workoutDraft: null,
    recentWorkout: null,
    recentWeight: null,
    theme: 'power-yellow'
  },

  onShow() {
    applyTheme(this);
    this.refreshHome();
  },

  refreshHome() {
    // 首页聚合当前计划、今日训练和最近数据。
    const activePlan = getActivePlan();
    const sourcePlans = activePlan && activePlan.planType === 'custom' ? getCustomPlans() : plans;
    const plan = activePlan ? sourcePlans.find((item) => item.id === activePlan.planId) : null;
    const todayDay = plan ? this.buildDayView(plan.days[activePlan.currentDayIndex] || plan.days[0]) : null;
    const totalDays = plan ? plan.days.length : 0;
    const dayOptions = plan ? plan.days.map((day, index) => `第 ${index + 1} 天 · ${day.name}`) : [];
    const nextDayIndex = plan && totalDays ? (Number(activePlan.currentDayIndex || 0) + 1) % totalDays : 0;
    const nextDayName = plan && totalDays ? plan.days[nextDayIndex].name : '';
    const history = getWorkoutHistory();
    const workoutDraft = getWorkoutDraft();
    const weights = getBodyWeights();

    this.setData({
      activePlan,
      todayDay,
      dayOptions,
      firstExercise: todayDay ? todayDay.exercises[0] : null,
      totalDays,
      nextDayName,
      workoutDraft,
      recentWorkout: history[0] || null,
      recentWeight: weights[0] || null
    });
  },

  buildDayView(day) {
    return {
      ...day,
      exercises: day.exercises.map((item) => ({
        ...item,
        detail: getExercise(item.exerciseId)
      }))
    };
  },

  goPlans() {
    wx.switchTab({ url: '/pages/plans/index' });
  },

  startWorkout() {
    wx.navigateTo({ url: '/pages/workout/index' });
  },

  resumeWorkout() {
    wx.navigateTo({ url: '/pages/workout/index?resume=1' });
  },

  onDayChange(event) {
    setActivePlanDay(Number(event.detail.value));
    this.refreshHome();
  }
});
