const { initCloud } = require('./services/cloudService');

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
    wx.setTabBarStyle({
      color: theme === 'tech-green' ? '#8793A1' : '#9A927D',
      selectedColor: theme === 'tech-green' ? '#20F0A0' : '#FFD23F',
      backgroundColor: theme === 'tech-green' ? '#11161B' : '#11110F',
      borderStyle: 'black'
    });
  }
});
