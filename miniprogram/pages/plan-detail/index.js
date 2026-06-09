const { buildPlanView, enablePlan, getPlanById, listOfficialPlans, deleteUserPlan } = require('../../services/planService');
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

  copyToCustomPlan() {
    const plan = this.data.plan;
    if (!plan) return;

    wx.navigateTo({
      url: `/pages/custom-plan/index?copyFrom=${plan.id}&type=${plan.planType || 'official'}`
    });
  },

  editCustomPlan() {
    const plan = this.data.plan;
    if (!plan) return;

    wx.navigateTo({
      url: `/pages/custom-plan/index?editId=${plan.id}`
    });
  },

  deletePlan() {
    wx.showModal({
      title: '删除计划',
      content: '确定要删除这个自定义计划吗？删除后将无法恢复。',
      confirmColor: '#ff5148',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '正在删除...' });
          await deleteUserPlan(this.data.plan.id);
          wx.hideLoading();
          wx.showToast({ title: '计划已删除', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 500);
        }
      }
    });
  },

  openExercise(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/exercise-detail/index?id=${id}` });
  }
});
