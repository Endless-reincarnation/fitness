const { listAllPlans } = require('../../services/planService');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    plans: [],
    customPlans: [],
    theme: 'power-yellow'
  },

  async onShow() {
    applyTheme(this);
    const { officialPlans, customPlans } = await listAllPlans();
    this.setData({
      plans: officialPlans,
      customPlans
    });
  },

  openPlan(event) {
    const { id, type } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/plan-detail/index?id=${id}&type=${type || 'official'}` });
  },

  createPlan() {
    wx.navigateTo({ url: '/pages/custom-plan/index' });
  }
});
