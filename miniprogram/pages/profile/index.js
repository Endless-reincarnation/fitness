const { getActivePlan, getBodyWeights, getWorkoutHistory, syncPendingCloudWrites } = require('../../services/workoutService');
const { applyTheme, syncTabBarTheme } = require('../../utils/theme');

Page({
  data: {
    activePlan: null,
    workoutCount: 0,
    weightCount: 0,
    theme: 'power-yellow',
    themeOptions: [
      { value: 'power-yellow', label: '黑黄力量' },
      { value: 'tech-green', label: '黑绿科技' }
    ]
  },

  async onShow() {
    applyTheme(this);
    await syncPendingCloudWrites();
    const history = await getWorkoutHistory();
    const weights = await getBodyWeights();
    this.setData({
      activePlan: getActivePlan(),
      workoutCount: history.length,
      weightCount: weights.length
    });
  },

  switchTheme(event) {
    const { theme } = event.currentTarget.dataset;
    const app = getApp();
    // 皮肤先存本地，接云后同步到 users.theme。
    wx.setStorageSync('theme', theme);
    app.globalData.theme = theme;
    syncTabBarTheme(theme);
    this.setData({ theme });
  },

  openExercises() {
    wx.navigateTo({ url: '/pages/exercises/index' });
  }
});
