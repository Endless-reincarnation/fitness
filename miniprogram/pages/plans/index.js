const { listAllPlans } = require('../../services/planService');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    plans: [],
    customPlans: [],
    theme: 'power-yellow'
  },

  onShow() {
    applyTheme(this);
    const { officialPlans, customPlans } = listAllPlans();
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
