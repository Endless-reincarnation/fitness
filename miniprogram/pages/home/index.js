const { buildDayView, getActivePlanDetail, setActivePlanDay } = require('../../services/planService');
const { getBodyWeights, getWorkoutDraft, getWorkoutHistory, syncPendingCloudWrites } = require('../../services/workoutService');
const { buildExecutionInsight } = require('../../utils/executionInsight');
const { buildDayNutritionTarget } = require('../../utils/nutritionInsight');
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
    weeklySchedule: [],
    todayAdvice: null,
    nutritionPreviewItems: [],
    heroStatusTitle: '',
    heroStatusText: '',
    weeklyProgressText: '0 / 0',
    weeklyProgressPercent: 0,
    startButtonText: '开始训练',
    scheduleEditing: false,
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
    const scheduleOverrides = activePlan ? this.getScheduleOverrides(activePlan.planId) : null;
    const executionInsight = plan && activePlan
      ? buildExecutionInsight({ plan, activePlan, history, scheduleOverrides })
      : { weeklySchedule: [], todayAdvice: null };
    const rawWorkoutDraft = getWorkoutDraft();
    // 首页只展示当前计划、当前训练日的草稿，避免切换计划后误续旧训练。
    const workoutDraft = rawWorkoutDraft &&
      activePlan &&
      todayDay &&
      rawWorkoutDraft.planId === activePlan.planId &&
      rawWorkoutDraft.dayId === todayDay.id
      ? rawWorkoutDraft
      : null;
    const startButtonText = this.getStartButtonText(executionInsight.todayAdvice, workoutDraft);
    const heroStatus = this.getHeroStatus(executionInsight.todayAdvice, todayDay, activePlan, totalDays);
    const nutritionPreviewItems = this.buildNutritionPreview(plan && plan.nutrition, executionInsight.todayAdvice);
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
      recentWeight: weights[0] || null,
      weeklySchedule: executionInsight.weeklySchedule,
      todayAdvice: executionInsight.todayAdvice,
      nutritionPreviewItems,
      heroStatusTitle: heroStatus.title,
      heroStatusText: heroStatus.text,
      weeklyProgressText: executionInsight.todayAdvice
        ? `${executionInsight.todayAdvice.completedDays} / ${executionInsight.todayAdvice.targetDays}`
        : '0 / 0',
      weeklyProgressPercent: executionInsight.todayAdvice ? executionInsight.todayAdvice.progressPercent : 0,
      startButtonText
    });
  },

  getHeroStatus(todayAdvice, todayDay, activePlan, totalDays) {
    if (!todayAdvice || !todayDay || !activePlan) {
      return { title: todayDay ? todayDay.name : '', text: '' };
    }

    const currentDayText = `${activePlan.name} · 当前训练日：第 ${Number(activePlan.currentDayIndex || 0) + 1} / ${totalDays} 天 · ${todayDay.name}`;
    if (todayAdvice.type === 'rest') {
      return {
        title: '今天建议休息',
        text: `${currentDayText} · 本周已完成 ${todayAdvice.completedDays}/${todayAdvice.targetDays} 次`
      };
    }
    if (todayAdvice.type === 'optional') {
      return {
        title: '今天可灵活安排',
        text: `${currentDayText} · 本周还差 ${todayAdvice.remainingDays} 次`
      };
    }
    return {
      title: todayDay.name,
      text: `${activePlan.name} · 第 ${Number(activePlan.currentDayIndex || 0) + 1} / ${totalDays} 天 · 本周 ${todayAdvice.completedDays}/${todayAdvice.targetDays} 次`
    };
  },

  getStartButtonText(todayAdvice, workoutDraft) {
    if (workoutDraft) return '重新开始今日训练';
    if (todayAdvice && todayAdvice.type === 'rest') return '仍要训练';
    if (todayAdvice && todayAdvice.type === 'optional') return '灵活训练';
    return '开始训练';
  },

  buildNutritionPreview(nutrition, todayAdvice) {
    if (!nutrition || !todayAdvice) return [];
    // 首页只做饮食摘要，完整训练日/休息日切换放到营养页。
    const target = buildDayNutritionTarget(nutrition, todayAdvice.type);
    return [
      { label: '热量', value: target.dailyCalories, unit: '大卡' },
      { label: '蛋白质', value: target.protein, unit: '克', highlight: true },
      { label: '碳水', value: target.carbs, unit: '克' },
      { label: '脂肪', value: target.fat, unit: '克' }
    ];
  },

  getScheduleStorageKey(planId) {
    return `weeklyScheduleOverrides_${planId}`;
  },

  getScheduleOverrides(planId) {
    if (!planId) return null;
    return wx.getStorageSync(this.getScheduleStorageKey(planId)) || null;
  },

  saveScheduleOverrides(planId, overrides) {
    if (!planId) return;
    wx.setStorageSync(this.getScheduleStorageKey(planId), overrides);
  },

  toggleScheduleEditor() {
    this.setData({ scheduleEditing: !this.data.scheduleEditing });
  },

  changeScheduleDay(event) {
    const { weekday, type } = event.currentTarget.dataset;
    const activePlan = this.data.activePlan;
    if (!activePlan) return;

    const overrides = this.getScheduleOverrides(activePlan.planId) || {};
    overrides[weekday] = type;
    // 本周节奏先存本地，后续稳定后再同步 user_plans。
    this.saveScheduleOverrides(activePlan.planId, overrides);
    wx.vibrateShort({ type: 'light' });
    this.refreshHome();
  },

  resetSchedule() {
    const activePlan = this.data.activePlan;
    if (!activePlan) return;
    wx.removeStorageSync(this.getScheduleStorageKey(activePlan.planId));
    wx.vibrateShort({ type: 'light' });
    this.refreshHome();
  },

  goPlans() {
    wx.switchTab({ url: '/pages/plans/index' });
  },

  goNutrition() {
    wx.navigateTo({ url: '/pages/nutrition/index' });
  },

  startWorkout() {
    const advice = this.data.todayAdvice;
    if (advice && advice.type === 'rest' && !this.data.workoutDraft) {
      wx.showModal({
        title: '今天建议休息',
        content: `${advice.reason}\n仍要训练会按当前训练日开始，完成后推进到下一训练日。`,
        confirmText: '仍要训练',
        cancelText: '休息一下',
        success: (res) => {
          if (res.confirm) {
            this.navigateWorkout();
          }
        }
      });
      return;
    }
    this.navigateWorkout();
  },

  navigateWorkout() {
    const advice = this.data.todayAdvice;
    const entryAdvice = advice && advice.type ? advice.type : 'training';
    wx.vibrateShort({ type: 'medium' });
    wx.navigateTo({ url: `/pages/workout/index?entryAdvice=${entryAdvice}` });
  },

  resumeWorkout() {
    wx.vibrateShort({ type: 'medium' });
    wx.navigateTo({ url: '/pages/workout/index?resume=1' });
  },

  async onDayChange(event) {
    await setActivePlanDay(Number(event.detail.value));
    this.refreshHome();
  }
});
