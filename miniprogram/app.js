const { initCloud } = require('./services/cloudService');
const { syncTabBarTheme } = require('./utils/theme');

App({
  globalData: {
    currentUser: null,
    theme: 'power-yellow'
  },

  onLaunch() {
    initCloud();

    // 第一版先使用本地缓存模拟用户状态，后续替换为微信登录和云数据库。
    const currentUser = wx.getStorageSync('currentUser');
    const theme = wx.getStorageSync('theme') || 'power-yellow';
    if (currentUser) {
      this.globalData.currentUser = currentUser;
    }
    this.globalData.theme = theme;
    syncTabBarTheme(theme);
  }
});
