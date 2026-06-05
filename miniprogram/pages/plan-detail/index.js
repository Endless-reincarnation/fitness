const { buildPlanView, enablePlan, getPlanById, listOfficialPlans } = require('../../services/planService');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    plan: null,
    theme: 'power-yellow'
  },

  async onLoad(query) {
    const plan = await getPlanById(query.id, query.type) || (await listOfficialPlans())[0];
    this.setData({ plan: await buildPlanView(plan) });
  },

  onShow() {
    applyTheme(this);
  },

  enablePlan() {
    enablePlan(this.data.plan);
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
