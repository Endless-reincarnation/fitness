const {
  buildCustomThemePalette,
  buildCustomThemeStyle,
  getCustomPrimaryColor,
  getCustomThemeIconSuffix
} = require('./customTheme');

function getTheme() {
  const app = getApp();
  return wx.getStorageSync('theme') || app.globalData.theme || 'power-yellow';
}

const tabBarStyles = {
  'power-yellow': {
    color: '#9A927D',
    selectedColor: '#FFD23F',
    backgroundColor: '#11110F',
    borderStyle: 'black',
    iconSuffix: ''
  },
  'tech-green': {
    color: '#8793A1',
    selectedColor: '#20F0A0',
    backgroundColor: '#11161B',
    borderStyle: 'black',
    iconSuffix: '-tech'
  },
  'death-pink': {
    color: '#A88A99',
    selectedColor: '#F05AA6',
    backgroundColor: '#171016',
    borderStyle: 'black',
    iconSuffix: '-pink'
  }
};

const tabBarItems = [
  { text: '首页', pagePath: 'pages/home/index', icon: 'home' },
  { text: '计划', pagePath: 'pages/plans/index', icon: 'plans' },
  { text: '数据', pagePath: 'pages/data/index', icon: 'data' },
  { text: '我的', pagePath: 'pages/profile/index', icon: 'profile' }
];

function syncTabBarTheme(theme) {
  // 原生 tabBar 不支持 CSS 变量，需要通过 API 同步主题色。
  const currentTheme = theme || getTheme();
  const customPalette = currentTheme === 'custom' ? buildCustomThemePalette(getCustomPrimaryColor()) : null;
  const style = customPalette
    ? {
      color: customPalette.muted,
      selectedColor: customPalette.primary,
      backgroundColor: customPalette.surface,
      borderStyle: 'black',
      iconSuffix: getCustomThemeIconSuffix()
    }
    : tabBarStyles[currentTheme] || tabBarStyles['power-yellow'];
  wx.setTabBarStyle({
    color: style.color,
    selectedColor: style.selectedColor,
    backgroundColor: style.backgroundColor,
    borderStyle: style.borderStyle
  });
  tabBarItems.forEach((item, index) => {
    // 皮肤切换时同步图标资源，否则只会改变文字颜色。
    wx.setTabBarItem({
      index,
      text: item.text,
      iconPath: `assets/tabbar/${item.icon}${style.iconSuffix}.png`,
      selectedIconPath: `assets/tabbar/${item.icon}${style.iconSuffix}-active.png`
    });
  });
}

function getThemePrimaryColor(theme) {
  const currentTheme = theme || getTheme();
  if (currentTheme === 'custom') {
    return buildCustomThemePalette(getCustomPrimaryColor()).primary;
  }
  const style = tabBarStyles[currentTheme] || tabBarStyles['power-yellow'];
  return style.selectedColor;
}

function applyTheme(page) {
  const theme = getTheme();
  const customThemeStyle = theme === 'custom' ? buildCustomThemeStyle(getCustomPrimaryColor()) : '';
  // 每个页面根节点使用 theme-* class 驱动主题变量，自定义主题额外注入变量。
  page.setData({ theme, customThemeStyle });
  syncTabBarTheme(theme);
  return theme;
}

module.exports = {
  getTheme,
  applyTheme,
  syncTabBarTheme,
  getThemePrimaryColor
};
