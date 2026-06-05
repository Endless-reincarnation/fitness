const { getExercise } = require('../../data/mock');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    exercise: null,
    primaryText: '',
    secondaryText: '',
    equipmentText: '',
    theme: 'power-yellow'
  },

  onLoad(query) {
    const exercise = getExercise(query.id);
    if (!exercise) {
      wx.showToast({ title: '动作不存在', icon: 'none' });
      return;
    }

    this.setData({
      exercise,
      primaryText: exercise.primaryMuscles.join(' / '),
      secondaryText: exercise.secondaryMuscles.length ? exercise.secondaryMuscles.join(' / ') : '无',
      equipmentText: exercise.equipment.join(' / ')
    });
  },

  onShow() {
    applyTheme(this);
  }
});
