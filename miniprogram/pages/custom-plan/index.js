const { listExercises } = require('../../services/exerciseService');
const { saveUserPlan, getPlanById } = require('../../services/planService');
const { applyTheme } = require('../../utils/theme');

const defaultRule = {
  role: 'assistance',
  roleLabel: '辅助项',
  rpe: '8',
  weightRule: '选择能稳定完成目标次数的重量，优先保证动作质量。',
  progressionRule: '全部组达到目标次数上限后，下次可小幅加重或增加次数。'
};

Page({
  data: {
    theme: 'power-yellow',
    planId: '',
    isEdit: false,
    planLoaded: false,
    planName: '',
    currentDayIndex: 0,
    currentDayName: '训练日 1',
    days: [
      {
        name: '训练日 1',
        exercises: []
      }
    ],
    currentDayExercises: [],
    exerciseOptions: [],
    exerciseList: [],
    selectedExerciseIndex: 0,
    sets: '3',
    reps: '8-12',
    restSeconds: '120'
  },

  onLoad(query) {
    if (query.id) {
      this.setData({
        planId: query.id,
        isEdit: true
      });
      wx.setNavigationBarTitle({ title: '编辑计划' });
    }
  },

  async onShow() {
    applyTheme(this);
    
    let exerciseList = this.data.exerciseList;
    if (!exerciseList.length) {
      exerciseList = await listExercises();
      this.setData({
        exerciseOptions: exerciseList.map((item) => item.name),
        exerciseList
      });
    }

    if (this.data.isEdit && !this.data.planLoaded) {
      const plan = await getPlanById(this.data.planId, 'custom');
      if (plan) {
        const days = plan.days.map((day) => ({
          id: day.id,
          name: day.name,
          exercises: day.exercises.map((item) => {
            const exercise = exerciseList.find((e) => e.id === item.exerciseId);
            return {
              exerciseId: item.exerciseId,
              exerciseName: exercise ? exercise.name : '未知动作',
              sets: item.sets,
              reps: item.reps,
              restSeconds: item.restSeconds,
              role: item.role || defaultRule.role,
              roleLabel: item.roleLabel || defaultRule.roleLabel,
              rpe: item.rpe || defaultRule.rpe,
              weightRule: item.weightRule || defaultRule.weightRule,
              progressionRule: item.progressionRule || defaultRule.progressionRule
            };
          })
        }));

        this.setData({
          planName: plan.name,
          days,
          currentDayIndex: 0,
          currentDayName: days[0] ? days[0].name : '训练日 1',
          currentDayExercises: days[0] ? days[0].exercises : [],
          planLoaded: true
        });
      } else {
        wx.showToast({ title: '未找到该计划', icon: 'none' });
      }
    }
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset;
    this.setData({ [field]: event.detail.value });
  },

  onDayNameInput(event) {
    const days = this.data.days.slice();
    days[this.data.currentDayIndex].name = event.detail.value;
    this.setData({
      days,
      currentDayName: event.detail.value
    });
  },

  addDay() {
    const days = this.data.days.concat({
      name: `训练日 ${this.data.days.length + 1}`,
      exercises: []
    });
    this.setData({
      days,
      currentDayIndex: days.length - 1,
      currentDayName: days[days.length - 1].name,
      currentDayExercises: []
    });
  },

  switchDay(event) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({
      currentDayIndex: index,
      currentDayName: this.data.days[index].name,
      currentDayExercises: this.data.days[index].exercises
    });
  },

  onExerciseChange(event) {
    this.setData({ selectedExerciseIndex: Number(event.detail.value) });
  },

  addExercise() {
    const exercise = this.data.exerciseList[this.data.selectedExerciseIndex];
    const sets = Number(this.data.sets);
    const restSeconds = Number(this.data.restSeconds);

    if (!exercise) {
      wx.showToast({ title: '动作库加载中', icon: 'none' });
      return;
    }

    if (!sets || sets <= 0) {
      wx.showToast({ title: '请填写有效组数', icon: 'none' });
      return;
    }

    if (!this.data.reps) {
      wx.showToast({ title: '请填写次数范围', icon: 'none' });
      return;
    }

    const days = this.data.days.slice();
    days[this.data.currentDayIndex].exercises = days[this.data.currentDayIndex].exercises.concat({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets,
      reps: this.data.reps,
      restSeconds: restSeconds || 90,
      ...defaultRule
    });

    this.setData({
      days,
      currentDayExercises: days[this.data.currentDayIndex].exercises
    });
  },

  removeExercise(event) {
    const { index } = event.currentTarget.dataset;
    const days = this.data.days.slice();
    days[this.data.currentDayIndex].exercises.splice(Number(index), 1);
    this.setData({
      days,
      currentDayExercises: days[this.data.currentDayIndex].exercises
    });
  },

  getTotalExerciseCount(days) {
    return days.reduce((sum, day) => sum + day.exercises.length, 0);
  },

  hasEmptyDay(days) {
    return days.some((day) => !day.exercises.length);
  },

  buildPlanDays(days) {
    return days.map((day, index) => ({
      id: day.id || `custom_day_${Date.now()}_${index}`,
      name: day.name || `训练日 ${index + 1}`,
      focus: '自定义训练日',
      exercises: day.exercises.map((item) => ({
        exerciseId: item.exerciseId,
        sets: item.sets,
        reps: item.reps,
        rpe: item.rpe,
        restSeconds: item.restSeconds,
        role: item.role,
        roleLabel: item.roleLabel,
        weightRule: item.weightRule,
        progressionRule: item.progressionRule
      }))
    }));
  },

  async savePlan() {
    if (!this.data.planName) {
      wx.showToast({ title: '请填写计划名称', icon: 'none' });
      return;
    }

    if (!this.getTotalExerciseCount(this.data.days)) {
      wx.showToast({ title: '请至少添加一个动作', icon: 'none' });
      return;
    }

    if (this.hasEmptyDay(this.data.days)) {
      wx.showToast({ title: '每个训练日至少 1 个动作', icon: 'none' });
      return;
    }

    const totalExerciseCount = this.getTotalExerciseCount(this.data.days);
    const planId = this.data.planId || `custom_plan_${Date.now()}`;
    const plan = {
      id: planId,
      planType: 'custom',
      name: this.data.planName,
      goal: ['自定义'],
      level: '自定义',
      durationWeeks: 4,
      weeklyFrequency: this.data.days.length,
      equipmentTags: [],
      summary: `我的自定义计划 · ${this.data.days.length} 个训练日 · ${totalExerciseCount} 个动作`,
      days: this.buildPlanDays(this.data.days)
    };

    await saveUserPlan(plan);
    wx.showToast({ title: '已保存计划', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 500);
  }
});
