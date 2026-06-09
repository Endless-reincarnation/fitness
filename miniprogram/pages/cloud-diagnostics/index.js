const { cloudConfig, countCollection, isCloudEnabled } = require('../../services/cloudService');
const { getUserProfile, isAdminProfile } = require('../../services/userService');
const { getPendingCloudWriteCount, syncPendingCloudWrites } = require('../../services/workoutService');
const { applyTheme } = require('../../utils/theme');

const checkItems = [
  ['muscles', '肌群'],
  ['exercises', '动作'],
  ['planTemplates', '计划模板'],
  ['planDays', '训练日'],
  ['planDayExercises', '训练编排'],
  ['workoutSessions', '训练记录'],
  ['workoutSets', '训练组'],
  ['bodyWeights', '体重'],
  ['feedbackMessages', '建议留言']
];

Page({
  data: {
    theme: 'power-yellow',
    enabled: false,
    envId: '',
    pendingCount: 0,
    checks: [],
    loading: false
  },

  async onShow() {
    applyTheme(this);
    const profile = await getUserProfile();
    if (!isAdminProfile(profile)) {
      wx.showToast({ title: '仅管理员可用', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 500);
      return;
    }
    this.refresh();
  },

  async refresh() {
    this.setData({
      loading: true,
      enabled: isCloudEnabled(),
      envId: cloudConfig.envId,
      pendingCount: getPendingCloudWriteCount()
    });

    const checks = await Promise.all(checkItems.map(async ([key, label]) => {
      try {
        const count = await countCollection(key);
        return {
          key,
          label,
          count: count === null ? '-' : count,
          status: count === null ? '未启用' : '正常'
        };
      } catch (error) {
        return {
          key,
          label,
          count: '-',
          status: '失败'
        };
      }
    }));

    this.setData({
      checks,
      pendingCount: getPendingCloudWriteCount(),
      loading: false
    });
  },

  async retrySync() {
    const result = await syncPendingCloudWrites();
    wx.showToast({
      title: `成功 ${result.success} 条`,
      icon: 'none'
    });
    this.refresh();
  }
});
