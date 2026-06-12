const { getExerciseById } = require('../../services/exerciseService');
const { getWorkoutHistory } = require('../../services/workoutService');
const { applyTheme } = require('../../utils/theme');
const { buildExercisePerformance } = require('../../utils/trainingInsight');

Page({
  data: {
    exercise: null,
    primaryText: '',
    secondaryText: '',
    equipmentText: '',
    performance: null,
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
    this.loadPerformance(exercise.id);
  },

  onShow() {
    applyTheme(this);
    if (this.data.exercise) {
      this.loadPerformance(this.data.exercise.id);
    }
  },

  async loadPerformance(exerciseId) {
    try {
      const history = await getWorkoutHistory();
      const performance = buildExercisePerformance(exerciseId, history);
      this.setData({ performance });
    } catch (error) {
      console.warn('加载动作训练表现失败', error);
    }
  }
});
