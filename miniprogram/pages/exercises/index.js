const { listExercises } = require('../../services/exerciseService');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    exercises: listExercises(),
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
