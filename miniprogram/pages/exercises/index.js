const { exercises } = require('../../data/mock');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    exercises: exercises.map((item) => ({
      ...item,
      primaryMusclesText: item.primaryMuscles.join(' / '),
      equipmentText: item.equipment.join(' / ')
    })),
    theme: 'power-yellow'
  },

  onShow() {
    applyTheme(this);
  },

  openExercise(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/exercise-detail/index?id=${id}` });
  }
});
