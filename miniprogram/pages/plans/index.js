const { getActivePlanDetail, listAllPlans } = require('../../services/planService');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    plans: [],
    customPlans: [],
    activePlan: null,
    activeTab: '',
    theme: 'power-yellow'
  },

  async onShow() {
    applyTheme(this);
    const previousCustomCount = this.data.customPlans.length;
    const [{ officialPlans, customPlans }, { activePlan }] = await Promise.all([
      listAllPlans(),
      getActivePlanDetail()
    ]);
    // 没有我的计划时默认给用户看官方模板；创建出第一套自定义计划后再回到我的计划。
    let activeTab = this.data.activeTab || (customPlans.length ? 'custom' : 'official');
    if (!customPlans.length && activeTab === 'custom') {
      activeTab = 'official';
    } else if (!previousCustomCount && customPlans.length) {
      activeTab = 'custom';
    }

    this.setData({
      plans: officialPlans,
      customPlans,
      activePlan,
      activeTab
    });
  },

  openPlan(event) {
    const { id, type } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/plan-detail/index?id=${id}&type=${type || 'official'}` });
  },

  editPlan(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/custom-plan/index?editId=${id}` });
  },

  createPlan() {
    wx.navigateTo({ url: '/pages/custom-plan/index' });
  },

  createAiPlan() {
    wx.navigateTo({ url: '/pages/ai-plan/index' });
  },

  switchTab(event) {
    const { tab } = event.currentTarget.dataset;
    this.setData({ activeTab: tab });
  }
});
