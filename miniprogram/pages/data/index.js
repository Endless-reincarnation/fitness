const { getBodyWeights, getWorkoutHistory, saveBodyWeight } = require('../../services/workoutService');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    history: [],
    weights: [],
    weightKg: '',
    latestSession: null,
    latestSetCount: 15,
    latestTotalVolume: 5820,
    nextExerciseName: '卧推',
    latestSuggestions: [],
    theme: 'power-yellow'
  },

  onShow() {
    applyTheme(this);
    this.refreshData();
  },

  async refreshData() {
    const history = await getWorkoutHistory();
    const latestSession = history[0] || null;
    const latestSuggestions = latestSession && latestSession.suggestions ? latestSession.suggestions : [];
    this.setData({
      history,
      weights: await getBodyWeights(),
      latestSession,
      latestSetCount: latestSession ? latestSession.setCount : 15,
      latestTotalVolume: latestSession ? latestSession.totalVolume : 5820,
      nextExerciseName: latestSuggestions[0] ? latestSuggestions[0].exerciseName : '卧推',
      latestSuggestions
    });
  },

  onWeightInput(event) {
    this.setData({ weightKg: event.detail.value });
  },

  saveWeight() {
    const weightKg = Number(this.data.weightKg);
    if (!weightKg) {
      wx.showToast({ title: '请输入体重', icon: 'none' });
      return;
    }

    const doSave = async () => {
      const today = new Date().toISOString().slice(0, 10);
      await saveBodyWeight({
        id: `weight_${today}`,
        date: today,
        weightKg
      });
      this.setData({ weightKg: '' });
      this.refreshData();
      wx.showToast({ title: '已记录', icon: 'success' });
    };

    // 异常体重需要二次确认，避免误输入污染趋势。
    if (weightKg < 20 || weightKg > 300) {
      wx.showModal({
        title: '确认体重',
        content: '这个体重数值较异常，确认保存吗？',
        success: (res) => {
          if (res.confirm) doSave();
        }
      });
      return;
    }

    doSave();
  }
});
