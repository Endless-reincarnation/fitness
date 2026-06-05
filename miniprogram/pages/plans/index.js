const { plans } = require('../../data/mock');
const { getCustomPlans } = require('../../utils/workout');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    plans,
    customPlans: [],
    theme: 'power-yellow'
  },

  onShow() {
    applyTheme(this);
    this.setData({ customPlans: getCustomPlans() });
  },

  openPlan(event) {
    const { id, type } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/plan-detail/index?id=${id}&type=${type || 'official'}` });
  },

  createPlan() {
    wx.navigateTo({ url: '/pages/custom-plan/index' });
  }
});
