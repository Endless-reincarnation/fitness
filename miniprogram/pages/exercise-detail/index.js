const { getExerciseById } = require('../../services/exerciseService');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    exercise: null,
    primaryText: '',
    secondaryText: '',
    equipmentText: '',
    theme: 'power-yellow'
  },

  async onLoad(query) {
    const exercise = await getExerciseById(query.id);
    if (!exercise) {
      wx.showToast({ title: '动作不存在', icon: 'none' });
      return;
    }

    this.setData({
      exercise,
      primaryText: exercise.primaryMusclesText,
      secondaryText: exercise.secondaryMusclesText,
      equipmentText: exercise.equipmentText
    });
  },

  onShow() {
    applyTheme(this);
  }
});
