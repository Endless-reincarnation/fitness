const { buildDayView, getActivePlanDetail, advanceActivePlan } = require('../../services/planService');
const {
  clearWorkoutDraft,
  getWorkoutDraft,
  saveWorkoutDraft,
  saveWorkoutSession,
  getLastWorkoutRecord
} = require('../../services/workoutService');
const { applyTheme } = require('../../utils/theme');
const { buildProgressionSuggestions } = require('../../utils/trainingInsight');

Page({
  data: {
    plan: null,
    day: null,
    currentExercise: null,
    currentExerciseMusclesText: '',
    currentExerciseMinReps: '',
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    weightKg: '',
    reps: '',
    currentRestSeconds: 120,
    records: [],
    isResting: false,
    restLeft: 0,
    restTotal: 0,
    activeBarsCount: 10,
    lastSetRecord: null,
    lastWorkoutRecord: null,
    completionSummary: null,
    entryAdviceType: 'training',
    theme: 'power-yellow'
  },

  timer: null,

  onLoad(query) {
    this.loadWorkout(query || {});
  },

  onShow() {
    applyTheme(this);
    wx.setKeepScreenOn({
      keepScreenOn: true,
      success: () => console.log('屏幕常亮已开启'),
      fail: (err) => console.warn('开启屏幕常亮失败', err)
    });
  },

  onHide() {
    wx.setKeepScreenOn({ keepScreenOn: false });
  },

  onUnload() {
    this.clearTimer();
    wx.setKeepScreenOn({ keepScreenOn: false });
  },

  async loadWorkout(query) {
    // 当前由计划服务生成今日训练，后续服务内部可替换为 user_plans 查询。
    const { activePlan, plan } = await getActivePlanDetail();
    if (!activePlan) {
      wx.showToast({ title: '请先启用计划', icon: 'none' });
      return;
    }

    if (!plan) {
      wx.showToast({ title: '计划不存在，请重新启用', icon: 'none' });
      return;
    }
    const day = plan.days[activePlan.currentDayIndex] || plan.days[0];
    const dayView = await buildDayView(day);
    const draft = getWorkoutDraft();
    const canRestoreDraft = draft &&
      query.resume === '1' &&
      draft.planId === activePlan.planId &&
      draft.dayId === dayView.id;
    // 记录训练入口类型，后续复盘可区分计划内训练、灵活训练和休息日仍训练。
    const entryAdviceType = canRestoreDraft
      ? this.normalizeEntryAdvice(draft.entryAdviceType)
      : this.normalizeEntryAdvice(query.entryAdvice);
    const currentExerciseIndex = canRestoreDraft ? draft.currentExerciseIndex : 0;
    const currentSetIndex = canRestoreDraft ? draft.currentSetIndex : 0;
    const currentExercise = dayView.exercises[currentExerciseIndex] || dayView.exercises[0];

    this.setData({
      plan,
      day: dayView,
      currentExerciseIndex,
      currentSetIndex,
      currentExercise,
      currentExerciseMusclesText: currentExercise.detail.primaryMuscles.join(' / '),
      currentExerciseMinReps: String(this.getDefaultReps(currentExercise.reps)),
      records: canRestoreDraft ? draft.records : [],
      weightKg: canRestoreDraft ? draft.weightKg : '',
      reps: canRestoreDraft ? draft.reps : '',
      currentRestSeconds: canRestoreDraft ? draft.currentRestSeconds || currentExercise.restSeconds : currentExercise.restSeconds,
      lastSetRecord: canRestoreDraft ? draft.lastSetRecord : null,
      entryAdviceType
    });
    this.saveDraft();
    this.loadLastRecord(currentExercise.exerciseId, !canRestoreDraft);
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset;
    this.setData({ [field]: event.detail.value });
    this.saveDraft();
  },

  saveDraft() {
    if (!this.data.plan || !this.data.day || !this.data.currentExercise) return;

    saveWorkoutDraft({
      planId: this.data.plan.id,
      planType: this.data.plan.planType || 'official',
      planName: this.data.plan.name,
      dayId: this.data.day.id,
      dayName: this.data.day.name,
      currentExerciseIndex: this.data.currentExerciseIndex,
      currentSetIndex: this.data.currentSetIndex,
      currentExerciseName: this.data.currentExercise.detail.name,
      records: this.data.records,
      weightKg: this.data.weightKg,
      reps: this.data.reps,
      currentRestSeconds: this.data.currentRestSeconds,
      lastSetRecord: this.data.lastSetRecord,
      entryAdviceType: this.data.entryAdviceType
    });
  },

  normalizeEntryAdvice(value) {
    return ['training', 'rest', 'optional'].indexOf(value) !== -1 ? value : 'training';
  },

  getTrainingContextLabel(entryAdviceType) {
    if (entryAdviceType === 'rest') return '休息日仍训练';
    if (entryAdviceType === 'optional') return '灵活训练';
    return '计划训练';
  },

  async loadLastRecord(exerciseId, shouldBackfill = true) {
    this.setData({ lastWorkoutRecord: null });
    try {
      const lastRecord = await getLastWorkoutRecord(exerciseId);
      if (lastRecord) {
        this.setData({ lastWorkoutRecord: lastRecord });
        if (shouldBackfill && this.data.currentSetIndex === 0) {
          this.setData({
            weightKg: lastRecord.weightKg ? String(lastRecord.weightKg) : '',
            reps: lastRecord.reps ? String(lastRecord.reps) : ''
          });
          this.saveDraft();
        }
      }
    } catch (e) {
      console.error('加载上次训练记录失败', e);
    }
  },

  finishSet() {
    wx.vibrateShort({ type: 'medium' });
    // 训练中减少录入负担，未填次数时默认使用目标次数范围的下限。
    const finalReps = Number(this.data.reps || this.getDefaultReps(this.data.currentExercise.reps));
    const finalWeightKg = Number(this.data.weightKg || 0);

    this.commitSet({
      weightKg: finalWeightKg,
      reps: finalReps,
      rpe: null,
      restSeconds: Number(this.data.currentRestSeconds || this.data.currentExercise.restSeconds)
    });
  },

  commitSet(setRecord) {
    const { day, currentExercise, currentExerciseIndex, currentSetIndex, records } = this.data;
    const current = currentExercise;

    const nextRecords = records.concat({
      exerciseId: current.exerciseId,
      exerciseName: current.detail.name,
      setIndex: currentSetIndex + 1,
      weightKg: setRecord.weightKg,
      reps: setRecord.reps,
      rpe: setRecord.rpe,
      restSeconds: setRecord.restSeconds,
      targetReps: current.reps,
      plannedSets: current.sets,
      role: current.role,
      progressionRule: current.progressionRule
    });

    const nextSetIndex = currentSetIndex + 1;
    this.setData({
      records: nextRecords,
      lastSetRecord: {
        exerciseId: current.exerciseId,
        weightKg: setRecord.weightKg,
        reps: setRecord.reps,
        rpe: setRecord.rpe,
        restSeconds: setRecord.restSeconds
      },
      // 同一动作的下一组默认沿用刚填写的数据，用户只需要改变化的项。
      weightKg: setRecord.weightKg ? String(setRecord.weightKg) : '',
      reps: String(setRecord.reps),
      currentRestSeconds: setRecord.restSeconds
    });

    if (nextSetIndex < current.sets) {
      this.setData({ currentSetIndex: nextSetIndex });
      this.saveDraft();
      this.startRest(setRecord.restSeconds);
      return;
    }

    if (currentExerciseIndex + 1 < day.exercises.length) {
      const nextExercise = day.exercises[currentExerciseIndex + 1];
      this.setData({
        currentExerciseIndex: currentExerciseIndex + 1,
        currentSetIndex: 0,
        currentExercise: nextExercise,
        currentExerciseMusclesText: nextExercise.detail.primaryMuscles.join(' / '),
        currentExerciseMinReps: String(this.getDefaultReps(nextExercise.reps)),
        // 切换动作时清空输入，避免把上一个动作重量误带到新动作。
        weightKg: '',
        reps: '',
        currentRestSeconds: nextExercise.restSeconds,
        lastSetRecord: null
      });
      this.saveDraft();
      this.loadLastRecord(nextExercise.exerciseId, true);
      this.startRest(setRecord.restSeconds);
      return;
    }

    this.finishWorkout(nextRecords);
  },

  adjustValue(event) {
    const { field, delta } = event.currentTarget.dataset;
    const change = Number(delta);
    let currentValue = Number(this.data[field] || 0);

    if (field === 'reps' && !this.data.reps) {
      currentValue = this.getDefaultReps(this.data.currentExercise.reps);
    }

    if (field === 'currentRestSeconds' && !this.data.currentRestSeconds) {
      currentValue = Number(this.data.currentExercise.restSeconds || 90);
    }

    let newValue = currentValue + change;

    if (field === 'weightKg') {
      newValue = Math.max(0, Math.round(newValue * 100) / 100);
    } else if (field === 'reps') {
      newValue = Math.max(1, Math.round(newValue));
    } else if (field === 'currentRestSeconds') {
      newValue = Math.max(15, Math.round(newValue));
    }

    this.setData({
      [field]: String(newValue)
    });
    this.saveDraft();
  },

  getDefaultReps(repsText) {
    const match = String(repsText || '').match(/\d+/);
    return match ? Number(match[0]) : 10;
  },

  useLastSet() {
    wx.vibrateShort({ type: 'medium' });
    const { currentExercise, lastSetRecord } = this.data;
    if (!lastSetRecord) {
      wx.showToast({ title: '还没有上一组', icon: 'none' });
      return;
    }

    if (lastSetRecord.exerciseId !== currentExercise.exerciseId) {
      wx.showToast({ title: '当前动作还没有上一组', icon: 'none' });
      return;
    }

    // 沿用上一组并直接完成当前组，避免输入框刷新不稳定。
    this.commitSet({
      weightKg: lastSetRecord.weightKg,
      reps: lastSetRecord.reps,
      rpe: lastSetRecord.rpe,
      restSeconds: Number(this.data.currentRestSeconds || lastSetRecord.restSeconds || currentExercise.restSeconds)
    });
  },

  startRest(seconds) {
    this.clearTimer();
    const restTotal = seconds || 120;
    this.setData({
      isResting: true,
      restLeft: seconds,
      restTotal,
      activeBarsCount: 10
    });
    this.timer = setInterval(() => {
      const next = this.data.restLeft - 1;
      if (next <= 0) {
        this.clearTimer();
        this.setData({ isResting: false, restLeft: 0, activeBarsCount: 0 });
        wx.vibrateLong(); // 休息结束，触发长震动提醒
      } else {
        const activeBarsCount = Math.ceil((next / restTotal) * 10);
        this.setData({
          restLeft: next,
          activeBarsCount
        });
      }
    }, 1000);
  },

  skipRest() {
    wx.vibrateShort({ type: 'medium' });
    this.clearTimer();
    this.setData({ isResting: false, restLeft: 0, activeBarsCount: 0 });
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  async finishWorkout(records) {
    const totalVolume = records.reduce((sum, item) => sum + item.weightKg * item.reps, 0);
    const suggestions = buildProgressionSuggestions(records);
    const session = {
      id: `session_${Date.now()}`,
      planName: this.data.plan.name,
      dayName: this.data.day.name,
      planDayIndex: this.data.plan.days.findIndex((item) => item.id === this.data.day.id),
      completedAt: new Date().toISOString(),
      setCount: records.length,
      totalVolume,
      suggestions,
      entryAdviceType: this.data.entryAdviceType,
      trainingContextLabel: this.getTrainingContextLabel(this.data.entryAdviceType),
      isRestDayTraining: this.data.entryAdviceType === 'rest',
      records
    };

    await saveWorkoutSession(session);
    clearWorkoutDraft();
    const nextPlan = await advanceActivePlan(this.data.plan.days.length);
    const nextDayName = nextPlan ? this.data.plan.days[nextPlan.currentDayIndex].name : '';
    const summary = this.buildCompletionSummary(records, totalVolume, nextDayName, suggestions);
    this.clearTimer();
    this.setData({
      isResting: false,
      completionSummary: summary
    });
  },

  buildCompletionSummary(records, totalVolume, nextDayName, suggestions) {
    const exerciseMap = {};
    records.forEach((record) => {
      if (!exerciseMap[record.exerciseId]) {
        exerciseMap[record.exerciseId] = {
          exerciseId: record.exerciseId,
          exerciseName: record.exerciseName,
          sets: 0,
          volume: 0,
          bestWeight: 0,
          bestReps: 0
        };
      }
      const item = exerciseMap[record.exerciseId];
      item.sets += 1;
      item.volume += record.weightKg * record.reps;
      item.bestWeight = Math.max(item.bestWeight, Number(record.weightKg || 0));
      item.bestReps = Math.max(item.bestReps, Number(record.reps || 0));
    });

    const exerciseStats = Object.keys(exerciseMap)
      .map((key) => exerciseMap[key])
      .sort((a, b) => b.volume - a.volume);
    const highlight = exerciseStats[0] || null;

    // 完成页只展示高信号内容，避免训练结束后被明细列表淹没。
    return {
      planName: this.data.plan.name,
      dayName: this.data.day.name,
      trainingContextLabel: this.getTrainingContextLabel(this.data.entryAdviceType),
      setCount: records.length,
      exerciseCount: exerciseStats.length,
      totalVolume,
      nextDayName,
      highlight,
      suggestions: suggestions.slice(0, 3)
    };
  },

  goDataPage() {
    wx.switchTab({ url: '/pages/data/index' });
  }
});
