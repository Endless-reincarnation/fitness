const { buildDayView, getActivePlanDetail, setActivePlanDay } = require('../../services/planService');
const { getBodyWeights, getWorkoutDraft, getWorkoutHistory, syncPendingCloudWrites } = require('../../services/workoutService');
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

  async refreshHome() {
    await syncPendingCloudWrites();
    // 首页只消费计划服务，不直接关心官方计划或自定义计划来自哪里。
    // 首页聚合当前计划、今日训练和最近数据。
    const planDetail = await getActivePlanDetail();
    const activePlan = planDetail.activePlan;
    const plan = planDetail.plan;
    const todayDay = plan ? await buildDayView(plan.days[activePlan.currentDayIndex] || plan.days[0]) : null;
    const totalDays = plan ? plan.days.length : 0;
    const dayOptions = plan ? plan.days.map((day, index) => `第 ${index + 1} 天 · ${day.name}`) : [];
    const nextDayIndex = plan && totalDays ? (Number(activePlan.currentDayIndex || 0) + 1) % totalDays : 0;
    const nextDayName = plan && totalDays ? plan.days[nextDayIndex].name : '';
    const history = await getWorkoutHistory();
    const workoutDraft = getWorkoutDraft();
    const weights = await getBodyWeights();

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

  goPlans() {
    wx.switchTab({ url: '/pages/plans/index' });
  },

  startWorkout() {
    wx.vibrateShort({ type: 'medium' });
    wx.navigateTo({ url: '/pages/workout/index' });
  },

  resumeWorkout() {
    wx.vibrateShort({ type: 'medium' });
    wx.navigateTo({ url: '/pages/workout/index?resume=1' });
  },

  onDayChange(event) {
    setActivePlanDay(Number(event.detail.value));
    this.refreshHome();
  }
});
