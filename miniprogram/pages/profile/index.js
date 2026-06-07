const { getActivePlan, getBodyWeights, getWorkoutHistory, syncPendingCloudWrites } = require('../../services/workoutService');
const { getUserProfile, saveUserProfile, uploadAvatar } = require('../../services/userService');
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
    ],

    // 用户登录资料状态
    userProfile: null,
    avatarFallback: '训',
    showEditModal: false,
    isSaving: false,

    // 编辑表单临时变量
    tempAvatarUrl: '',
    tempNickname: '',
    tempGender: 'unknown',
    tempHeight: '',
    tempGoal: '',

    // 选项字典
    genderOptions: [
      { value: 'unknown', label: '保密' },
      { value: 'male', label: '男' },
      { value: 'female', label: '女' }
    ],
    goalOptions: [
      { value: '', label: '未设置' },
      { value: 'muscle_gain', label: '增肌' },
      { value: 'fat_loss', label: '减脂' },
      { value: 'body_shape', label: '塑形' },
      { value: 'strength', label: '力量' }
    ],
    selectedGenderLabel: '保密',
    selectedGoalLabel: '未设置'
  },

  async onShow() {
    applyTheme(this);
    await syncPendingCloudWrites();

    // 1. 读取基础训练数据
    const history = await getWorkoutHistory();
    const weights = await getBodyWeights();
    this.setData({
      activePlan: getActivePlan(),
      workoutCount: history.length,
      weightCount: weights.length
    });

    // 2. 静默拉取云端用户登录资料
    const profile = await getUserProfile();
    if (profile) {
      const fallbackChar = profile.nickname ? profile.nickname.charAt(0).toUpperCase() : '训';
      this.setData({
        userProfile: profile,
        avatarFallback: fallbackChar
      });
    }
  },

  // 展开编辑弹窗，载入现有用户配置到临时表单
  openEditModal() {
    const profile = this.data.userProfile || {};
    const gender = profile.gender || 'unknown';
    const goal = profile.training_goal || '';

    const matchedGender = this.data.genderOptions.find(o => o.value === gender);
    const matchedGoal = this.data.goalOptions.find(o => o.value === goal);

    this.setData({
      showEditModal: true,
      tempAvatarUrl: profile.avatar_url || '',
      tempNickname: profile.nickname || '',
      tempHeight: profile.height_cm || '',
      tempGender: gender,
      tempGoal: goal,
      selectedGenderLabel: matchedGender ? matchedGender.label : '保密',
      selectedGoalLabel: matchedGoal ? matchedGoal.label : '未设置'
    });
  },

  closeEditModal() {
    this.setData({ showEditModal: false });
  },

  // 空操作函数，用于阻止事件冒泡
  noop() {},

  // 头像授权选择回调
  onChooseAvatar(event) {
    const { avatarUrl } = event.detail;
    // 此时拿到的是小程序本地临时路径（wxfile:// 或 http://tmp/...），在点击保存时才上传到云存储
    this.setData({
      tempAvatarUrl: avatarUrl
    });
  },

  // 昵称输入/联想选择失去焦点
  onNicknameBlur(event) {
    this.setData({
      tempNickname: event.detail.value
    });
  },

  // 昵称实时输入
  onNicknameInput(event) {
    this.setData({
      tempNickname: event.detail.value
    });
  },

  onGenderChange(event) {
    const index = event.detail.value;
    const option = this.data.genderOptions[index];
    this.setData({
      tempGender: option.value,
      selectedGenderLabel: option.label
    });
  },

  onHeightInput(event) {
    this.setData({
      tempHeight: event.detail.value
    });
  },

  onGoalChange(event) {
    const index = event.detail.value;
    const option = this.data.goalOptions[index];
    this.setData({
      tempGoal: option.value,
      selectedGoalLabel: option.label
    });
  },

  // 收集表单数据，并保存同步到云端
  async saveProfile() {
    this.setData({ isSaving: true });
    let finalAvatarUrl = this.data.tempAvatarUrl;

    try {
      // 1. 判断头像是否是新选择的临时路径。如果是，则上传至云存储中转
      const isTempFile = finalAvatarUrl && (
        finalAvatarUrl.startsWith('wxfile://') || 
        finalAvatarUrl.startsWith('http://tmp/') || 
        finalAvatarUrl.includes('tmp') ||
        finalAvatarUrl.startsWith('http://usr/')
      );

      if (isTempFile) {
        wx.showLoading({ title: '正在上传头像...' });
        finalAvatarUrl = await uploadAvatar(finalAvatarUrl);
        wx.hideLoading();
      }

      // 2. 封装云端保存的 Profile 数据
      const profilePayload = {
        ...(this.data.userProfile || {}),
        nickname: this.data.tempNickname.trim(),
        avatar_url: finalAvatarUrl,
        gender: this.data.tempGender,
        height_cm: this.data.tempHeight ? Number(this.data.tempHeight) : null,
        training_goal: this.data.tempGoal
      };

      wx.showLoading({ title: '正在同步资料...' });
      const savedProfile = await saveUserProfile(profilePayload);
      wx.hideLoading();

      if (savedProfile) {
        const fallbackChar = savedProfile.nickname ? savedProfile.nickname.charAt(0).toUpperCase() : '训';
        this.setData({
          userProfile: savedProfile,
          avatarFallback: fallbackChar,
          showEditModal: false
        });
        
        wx.showToast({
          title: '资料同步成功',
          icon: 'success'
        });
      } else {
        throw new Error('未返回保存后的数据');
      }

    } catch (err) {
      wx.hideLoading();
      console.error('保存用户资料失败：', err);
      wx.showModal({
        title: '保存失败',
        content: err.message || '网络繁忙，请稍后重试',
        showCancel: false
      });
    } finally {
      this.setData({ isSaving: false });
    }
  },

  switchTheme(event) {
    const { theme } = event.currentTarget.dataset;
    const app = getApp();
    wx.setStorageSync('theme', theme);
    app.globalData.theme = theme;
    syncTabBarTheme(theme);
    this.setData({ theme });
  },

  openExercises() {
    wx.navigateTo({ url: '/pages/exercises/index' });
  },

  openCloudDiagnostics() {
    wx.navigateTo({ url: '/pages/cloud-diagnostics/index' });
  }
});
