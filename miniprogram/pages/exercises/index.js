const { listExercises } = require('../../services/exerciseService');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    exercises: [],
    theme: 'power-yellow'
  },

  async onShow() {
    applyTheme(this);
    this.setData({ exercises: await listExercises() });
  },

  openExercise(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/exercise-detail/index?id=${id}` });
  }
});
