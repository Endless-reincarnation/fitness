const { plans, getExercise } = require('../../data/mock');
const { getCustomPlans, setActivePlan } = require('../../utils/workout');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    plan: null,
    theme: 'power-yellow'
  },

  onLoad(query) {
    const sourcePlans = query.type === 'custom' ? getCustomPlans() : plans;
    const plan = sourcePlans.find((item) => item.id === query.id) || sourcePlans[0] || plans[0];
    this.setData({ plan: this.buildPlanView(plan) });
  },

  onShow() {
    applyTheme(this);
  },

  buildPlanView(plan) {
    // 页面展示时补齐动作详情，计划模板本身仍只保存动作 ID。
    return {
      ...plan,
      days: plan.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((item) => ({
          ...item,
          detail: getExercise(item.exerciseId)
        }))
      }))
    };
  },

  enablePlan() {
    setActivePlan(this.data.plan);
    wx.showToast({ title: '已启用计划', icon: 'success' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/home/index' });
    }, 500);
  },

  openExercise(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/exercise-detail/index?id=${id}` });
  }
});
