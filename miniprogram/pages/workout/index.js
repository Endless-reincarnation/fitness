const { buildDayView, getActivePlanDetail } = require('../../services/planService');
const {
  advanceActivePlan,
  clearWorkoutDraft,
  getWorkoutDraft,
  saveWorkoutDraft,
  saveWorkoutSession
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
    theme: 'power-yellow'
  },

  timer: null,

  onLoad(query) {
    this.loadWorkout(query || {});
  },

  onShow() {
    applyTheme(this);
  },

  onUnload() {
    this.clearTimer();
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
      rpe: canRestoreDraft ? draft.rpe : '',
      lastSetRecord: canRestoreDraft ? draft.lastSetRecord : null
    });
    this.saveDraft();
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
      rpe: this.data.rpe,
      lastSetRecord: this.data.lastSetRecord
    });
  },

  finishSet() {
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
      rpe: setRecord.rpe ? String(setRecord.rpe) : ''
    });

    if (nextSetIndex < current.sets) {
      this.setData({ currentSetIndex: nextSetIndex });
      this.saveDraft();
      this.startRest(current.restSeconds);
      return;
    }

    if (currentExerciseIndex + 1 < day.exercises.length) {
      this.setData({
        currentExerciseIndex: currentExerciseIndex + 1,
        currentSetIndex: 0,
        currentExercise: day.exercises[currentExerciseIndex + 1],
        currentExerciseMusclesText: day.exercises[currentExerciseIndex + 1].detail.primaryMuscles.join(' / '),
        currentExerciseMinReps: String(this.getDefaultReps(day.exercises[currentExerciseIndex + 1].reps)),
        // 切换动作时清空输入，避免把上一个动作重量误带到新动作。
        weightKg: '',
        reps: '',
        rpe: ''
      });
      this.saveDraft();
      this.startRest(current.restSeconds);
      return;
    }

    this.finishWorkout(nextRecords);
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
      } else {
        this.setData({ restLeft: next });
      }
    }, 1000);
  },

  skipRest() {
    this.clearTimer();
    this.setData({ isResting: false, restLeft: 0 });
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  finishWorkout(records) {
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

    saveWorkoutSession(session);
    clearWorkoutDraft();
    const nextPlan = advanceActivePlan(this.data.plan.days.length);
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
  }
});
