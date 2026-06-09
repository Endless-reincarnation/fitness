const { buildDayView, getActivePlanDetail, advanceActivePlan } = require('../../services/planService');
const {
  clearWorkoutDraft,
  getWorkoutDraft,
  saveWorkoutDraft,
  saveWorkoutSession,
  getLastWorkoutRecord
} = require('../../services/workoutService');
const { applyTheme } = require('../../utils/theme');

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
    rpe: '',
    records: [],
    isResting: false,
    restLeft: 0,
    lastSetRecord: null,
    lastWorkoutRecord: null,
    rpeDesc: '',
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
    const currentExerciseIndex = canRestoreDraft ? draft.currentExerciseIndex : 0;
    const currentSetIndex = canRestoreDraft ? draft.currentSetIndex : 0;
    const currentExercise = dayView.exercises[currentExerciseIndex] || dayView.exercises[0];

    const rpeVal = canRestoreDraft ? draft.rpe : '';
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
      rpe: rpeVal,
      rpeDesc: this.getRpeDesc(rpeVal),
      lastSetRecord: canRestoreDraft ? draft.lastSetRecord : null
    });
    this.saveDraft();
    this.loadLastRecord(currentExercise.exerciseId, !canRestoreDraft);
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset;
    this.setData({ [field]: event.detail.value });
    if (field === 'rpe') {
      this.setData({ rpeDesc: this.getRpeDesc(event.detail.value) });
    }
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
      rpe: this.data.rpe,
      lastSetRecord: this.data.lastSetRecord
    });
  },

  async loadLastRecord(exerciseId, shouldBackfill = true) {
    this.setData({ lastWorkoutRecord: null });
    try {
      const lastRecord = await getLastWorkoutRecord(exerciseId);
      if (lastRecord) {
        this.setData({ lastWorkoutRecord: lastRecord });
        if (shouldBackfill && this.data.currentSetIndex === 0) {
          const rpeVal = lastRecord.rpe ? String(lastRecord.rpe) : '';
          this.setData({
            weightKg: lastRecord.weightKg ? String(lastRecord.weightKg) : '',
            reps: lastRecord.reps ? String(lastRecord.reps) : '',
            rpe: rpeVal,
            rpeDesc: this.getRpeDesc(rpeVal)
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
    const finalRpe = this.data.rpe ? Number(this.data.rpe) : null;

    this.commitSet({
      weightKg: finalWeightKg,
      reps: finalReps,
      rpe: finalRpe
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
      restSeconds: current.restSeconds,
      targetReps: current.reps,
      role: current.role,
      progressionRule: current.progressionRule
    });

    const nextSetIndex = currentSetIndex + 1;
    const rpeVal = setRecord.rpe ? String(setRecord.rpe) : '';
    this.setData({
      records: nextRecords,
      lastSetRecord: {
        exerciseId: current.exerciseId,
        weightKg: setRecord.weightKg,
        reps: setRecord.reps,
        rpe: setRecord.rpe
      },
      // 同一动作的下一组默认沿用刚填写的数据，用户只需要改变化的项。
      weightKg: setRecord.weightKg ? String(setRecord.weightKg) : '',
      reps: String(setRecord.reps),
      rpe: rpeVal,
      rpeDesc: this.getRpeDesc(rpeVal)
    });

    if (nextSetIndex < current.sets) {
      this.setData({ currentSetIndex: nextSetIndex });
      this.saveDraft();
      this.startRest(current.restSeconds);
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
        rpe: '',
        rpeDesc: '',
        lastSetRecord: null
      });
      this.saveDraft();
      this.loadLastRecord(nextExercise.exerciseId, true);
      this.startRest(current.restSeconds);
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

    if (field === 'rpe' && !this.data.rpe) {
      currentValue = Number(this.data.currentExercise.rpe || 8);
    }

    let newValue = currentValue + change;

    if (field === 'weightKg') {
      newValue = Math.max(0, Math.round(newValue * 100) / 100);
    } else if (field === 'reps') {
      newValue = Math.max(1, Math.round(newValue));
    } else if (field === 'rpe') {
      newValue = Math.max(1, Math.min(10, Math.round(newValue * 2) / 2));
    }

    this.setData({
      [field]: String(newValue)
    });
    if (field === 'rpe') {
      this.setData({ rpeDesc: this.getRpeDesc(newValue) });
    }
    this.saveDraft();
  },

  getDefaultReps(repsText) {
    const match = String(repsText || '').match(/\d+/);
    return match ? Number(match[0]) : 10;
  },

  getRepRange(repsText) {
    const matches = String(repsText || '').match(/\d+/g) || [];
    const min = Number(matches[0] || 0);
    const max = Number(matches[matches.length - 1] || min || 0);
    return { min, max };
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
      rpe: lastSetRecord.rpe
    });
  },

  startRest(seconds) {
    this.clearTimer();
    this.setData({ isResting: true, restLeft: seconds });
    this.timer = setInterval(() => {
      const next = this.data.restLeft - 1;
      if (next <= 0) {
        this.clearTimer();
        this.setData({ isResting: false, restLeft: 0 });
        wx.vibrateLong(); // 休息结束，触发长震动提醒
      } else {
        this.setData({ restLeft: next });
      }
    }, 1000);
  },

  skipRest() {
    wx.vibrateShort({ type: 'medium' });
    this.clearTimer();
    this.setData({ isResting: false, restLeft: 0 });
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  async finishWorkout(records) {
    const totalVolume = records.reduce((sum, item) => sum + item.weightKg * item.reps, 0);
    const suggestions = this.buildProgressionSuggestions(records);
    const session = {
      id: `session_${Date.now()}`,
      planName: this.data.plan.name,
      dayName: this.data.day.name,
      planDayIndex: this.data.plan.days.findIndex((item) => item.id === this.data.day.id),
      completedAt: new Date().toISOString(),
      setCount: records.length,
      totalVolume,
      suggestions,
      records
    };

    await saveWorkoutSession(session);
    clearWorkoutDraft();
    const nextPlan = await advanceActivePlan(this.data.plan.days.length);
    const nextDayName = nextPlan ? this.data.plan.days[nextPlan.currentDayIndex].name : '';
    wx.showModal({
      title: '训练完成',
      content: `完成 ${records.length} 组，总容量 ${totalVolume}kg。${nextDayName ? '\n下次训练：' + nextDayName : ''}${suggestions[0] ? '\n' + suggestions[0].advice : ''}`,
      showCancel: false,
      success: () => wx.switchTab({ url: '/pages/data/index' })
    });
  },

  buildProgressionSuggestions(records) {
    const groups = {};
    records.forEach((record) => {
      if (!groups[record.exerciseId]) {
        groups[record.exerciseId] = [];
      }
      groups[record.exerciseId].push(record);
    });

    return Object.keys(groups).map((exerciseId) => {
      const exerciseRecords = groups[exerciseId];
      const first = exerciseRecords[0];
      const range = this.getRepRange(first.targetReps);
      const allHitTopReps = range.max > 0 && exerciseRecords.every((item) => item.reps >= range.max);
      const hasHighRpe = exerciseRecords.some((item) => item.rpe && item.rpe >= 9);
      const hasWeight = exerciseRecords.some((item) => item.weightKg > 0);
      let advice = `${first.exerciseName}：下次维持重量，继续保证动作质量。`;

      if (allHitTopReps && !hasHighRpe && hasWeight) {
        advice = `${first.exerciseName}：本次达到次数上限，下次可小幅加重。`;
      } else if (hasHighRpe) {
        advice = `${first.exerciseName}：RPE 偏高，下次先维持重量或延长休息。`;
      } else if (!hasWeight) {
        advice = `${first.exerciseName}：本次未记录重量，下次可记录重量方便递进。`;
      }

      return {
        exerciseId,
        exerciseName: first.exerciseName,
        advice
      };
    });
  },

  getRpeDesc(rpe) {
    if (!rpe) return '';
    const val = Number(rpe);
    if (isNaN(val) || val <= 0) return '';
    if (val >= 10) return '力竭（无法再做一次）';
    if (val >= 9.5) return '力竭边缘（不确定能否多做）';
    if (val >= 9) return '保留 1 次余量 (1 RIR)';
    if (val >= 8.5) return '保留 1-2 次余量';
    if (val >= 8) return '保留 2 次余量 (2 RIR)';
    if (val >= 7.5) return '保留 2-3 次余量';
    if (val >= 7) return '保留 3 次余量 (3 RIR)';
    if (val >= 6.5) return '保留 3-4 次余量';
    if (val >= 6) return '热身/较轻爆发力';
    return '非常轻松';
  }
});
