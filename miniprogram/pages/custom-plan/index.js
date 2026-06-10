const { listExercises, saveCustomExercise } = require('../../services/exerciseService');
const { getAiPlanDraft } = require('../../services/aiPlanService');
const { buildPlanView, enablePlan, getPlanById, saveUserPlan } = require('../../services/planService');
const { bodyRegionOptions, matchExerciseKeyword, matchExerciseRegion } = require('../../utils/exerciseCategory');
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
    pageTitle: '新建计划',
    showNutritionModal: false,
    nutritionModalTitle: '',
    nutritionModalContent: '',
    introText: '支持多个训练日。先选择训练日，再给当前训练日添加动作。',
    planName: '',
    planMeta: null,
    editingPlanId: '',
    currentDayIndex: 0,
    dayTabIntoView: 'day-tab-0',
    currentDayName: '训练日 1',
    days: [
      {
        name: '训练日 1',
        exercises: []
      }
    ],
    currentDayExercises: [],
    exerciseList: [],
    pickerExercises: [],
    bodyRegionOptions,
    selectedBodyRegion: 'all',
    showExercisePicker: false,
    selectedExercise: null,
    pickerKeyword: '',
    canCreateExercise: false,
    sets: '3',
    reps: '8-12',
    restSeconds: '120'
  },

  async onLoad(query) {
    const editId = query && (query.editId || query.id);
    if (editId) {
      await this.loadEditingPlan(editId);
    } else if (query && query.draftId) {
      this.loadDraftPlan(query.draftId);
    } else if (query && query.copyFrom) {
      await this.loadCopiedPlan(query.copyFrom, query.type || 'official');
    }
  },

  async onShow() {
    applyTheme(this);
    
    let exerciseList = this.data.exerciseList;
    if (!exerciseList.length) {
      exerciseList = await listExercises();
      this.setData({
        exerciseList,
        pickerExercises: exerciseList.slice(0, 8)
      });
    }

  },

  async loadCopiedPlan(planId, planType) {
    // 复制官方/自定义计划时只复制可编辑结构，不改动原计划。
    const sourcePlan = await getPlanById(planId, planType);
    const planView = sourcePlan ? await buildPlanView(sourcePlan) : null;
    if (!planView) {
      wx.showToast({ title: '原计划不存在', icon: 'none' });
      return;
    }

    const days = this.normalizePlanDays(planView);

    this.setData({
      pageTitle: '复制修改计划',
      introText: '已复制官方计划，可按自己的节奏调整训练日、动作、组数、次数和休息。',
      planName: `${planView.name} 副本`,
      planMeta: {
        sourcePlanId: planView.id,
        goal: planView.goal || ['自定义'],
        level: planView.level || '自定义',
        durationWeeks: planView.durationWeeks || 4,
        equipmentTags: planView.equipmentTags || [],
        nutrition: planView.nutrition || null
      },
      currentDayIndex: 0,
      dayTabIntoView: 'day-tab-0',
      currentDayName: days[0] ? days[0].name : '训练日 1',
      days: days.length ? days : this.data.days,
      currentDayExercises: days[0] ? days[0].exercises : []
    });
  },

  async loadEditingPlan(planId) {
    // 编辑模式复用同一个页面，保存时用原 ID 覆盖本地自定义计划。
    const sourcePlan = await getPlanById(planId, 'custom');
    const planView = sourcePlan ? await buildPlanView(sourcePlan) : null;
    if (!planView) {
      wx.showToast({ title: '自定义计划不存在', icon: 'none' });
      return;
    }

    const days = this.normalizePlanDays(planView);
    this.setData({
      pageTitle: '编辑计划',
      introText: '调整训练日、动作顺序、组数、次数和休息，保存后会覆盖当前计划。',
      editingPlanId: planView.id,
      planName: planView.name,
      planMeta: {
        sourcePlanId: planView.sourcePlanId || '',
        goal: planView.goal || ['自定义'],
        level: planView.level || '自定义',
        durationWeeks: planView.durationWeeks || 4,
        equipmentTags: planView.equipmentTags || [],
        nutrition: planView.nutrition || null
      },
      currentDayIndex: 0,
      dayTabIntoView: 'day-tab-0',
      currentDayName: days[0] ? days[0].name : '训练日 1',
      days: days.length ? days : this.data.days,
      currentDayExercises: days[0] ? days[0].exercises : []
    });
  },

  loadDraftPlan(draftId) {
    const draft = getAiPlanDraft(draftId);
    if (!draft) {
      wx.showToast({ title: 'AI 草稿不存在', icon: 'none' });
      return;
    }

    // AI 草稿进入同一套编辑器，用户确认后才保存成正式自定义计划。
    const days = this.normalizeDraftDays(draft);
    this.setData({
      pageTitle: '编辑 AI 草稿',
      introText: 'AI 已生成计划草稿，请检查训练日、动作、组数、次数和休息后再保存。',
      editingPlanId: '',
      planName: draft.name,
      planMeta: {
        sourcePlanId: draft.id,
        goal: draft.goal || ['自定义'],
        level: draft.level || '自定义',
        durationWeeks: draft.durationWeeks || 4,
        equipmentTags: draft.equipmentTags || [],
        overview: draft.overview || '',
        generationSteps: draft.generationSteps || [],
        tips: draft.tips || [],
        nutrition: draft.nutrition || null
      },
      currentDayIndex: 0,
      dayTabIntoView: 'day-tab-0',
      currentDayName: days[0] ? days[0].name : '训练日 1',
      days: days.length ? days : this.data.days,
      currentDayExercises: days[0] ? days[0].exercises : []
    });
  },

  normalizePlanDays(planView) {
    // 页面编辑态只保留计划编排需要的字段，动作详情仍通过 exerciseId 统一查询。
    return planView.days.map((day) => ({
      name: day.name,
      focus: day.focus || '自定义训练日',
      exercises: day.exercises.map((item) => ({
        exerciseId: item.exerciseId,
        exerciseName: item.detail ? item.detail.name : item.exerciseName,
        sets: item.sets,
        reps: item.reps,
        rpe: item.rpe || defaultRule.rpe,
        restSeconds: item.restSeconds,
        role: item.role || defaultRule.role,
        roleLabel: item.roleLabel || defaultRule.roleLabel,
        weightRule: item.weightRule || defaultRule.weightRule,
        progressionRule: item.progressionRule || defaultRule.progressionRule,
        notes: item.notes || ''
      }))
    }));
  },

  normalizeDraftDays(draft) {
    // 草稿已包含 exerciseName，不依赖动作详情预加载，保证 AI 生成后可立即进入编辑态。
    return (draft.days || []).map((day) => ({
      name: day.name,
      focus: day.focus || '自定义训练日',
      exercises: (day.exercises || []).map((item) => ({
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName,
        sets: item.sets,
        reps: item.reps,
        rpe: item.rpe || defaultRule.rpe,
        restSeconds: item.restSeconds,
        role: item.role || defaultRule.role,
        roleLabel: item.roleLabel || defaultRule.roleLabel,
        weightRule: item.weightRule || defaultRule.weightRule,
        progressionRule: item.progressionRule || defaultRule.progressionRule,
        notes: item.notes || ''
      }))
    }));
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
      focus: '自定义训练日',
      exercises: []
    });
    this.setData({
      days,
      currentDayIndex: days.length - 1,
      dayTabIntoView: `day-tab-${days.length - 1}`,
      currentDayName: days[days.length - 1].name,
      currentDayExercises: []
    });
  },

  switchDay(event) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({
      currentDayIndex: index,
      dayTabIntoView: `day-tab-${index}`,
      currentDayName: this.data.days[index].name,
      currentDayExercises: this.data.days[index].exercises
    });
  },

  refreshExercisePicker(keyword = this.data.pickerKeyword, region = this.data.selectedBodyRegion) {
    const text = String(keyword || '').trim();
    const pickerExercises = this.data.exerciseList.filter((item) => {
      const matchesKeyword = text ? matchExerciseKeyword(item, text) : true;
      const matchesRegion = text ? true : matchExerciseRegion(item, region);
      return matchesKeyword && matchesRegion;
    }).slice(0, 8);
    const hasSameName = this.data.exerciseList.some((item) => item.name === text);

    this.setData({
      pickerKeyword: keyword,
      selectedBodyRegion: region,
      pickerExercises,
      canCreateExercise: Boolean(text && !hasSameName)
    });
  },

  openExercisePicker() {
    this.setData({ showExercisePicker: true });
    this.refreshExercisePicker('', this.data.selectedBodyRegion);
  },

  closeExercisePicker() {
    this.setData({ showExercisePicker: false });
  },

  noop() {},

  removeCurrentDay() {
    if (this.data.days.length <= 1) {
      wx.showToast({ title: '至少保留 1 个训练日', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '删除训练日',
      content: '确定删除当前训练日和其中的全部动作吗？',
      confirmText: '删除',
      confirmColor: '#FFD43B',
      success: (res) => {
        if (!res.confirm) return;

        // 删除训练日会连带移除当天动作，必须二次确认后再更新本地计划。
        const days = this.data.days.slice();
        days.splice(this.data.currentDayIndex, 1);
        const nextIndex = Math.min(this.data.currentDayIndex, days.length - 1);
        this.setData({
          days,
          currentDayIndex: nextIndex,
          dayTabIntoView: `day-tab-${nextIndex}`,
          currentDayName: days[nextIndex].name,
          currentDayExercises: days[nextIndex].exercises
        });
      }
    });
  },

  onPickerSearchInput(event) {
    this.refreshExercisePicker(event.detail.value, this.data.selectedBodyRegion);
  },

  switchExerciseRegion(event) {
    const { region } = event.currentTarget.dataset;
    this.refreshExercisePicker('', region);
  },

  selectExercise(event) {
    const { id } = event.currentTarget.dataset;
    const selectedExercise = this.data.exerciseList.find((item) => item.id === id);
    if (!selectedExercise) return;

    this.setData({
      selectedExercise,
      showExercisePicker: false,
      pickerKeyword: '',
      pickerExercises: [],
      canCreateExercise: false
    });
  },

  createCustomExercise() {
    const exercise = saveCustomExercise(this.data.pickerKeyword);
    if (!exercise) {
      wx.showToast({ title: '请先输入动作名称', icon: 'none' });
      return;
    }

    const exerciseList = this.data.exerciseList.some((item) => item.id === exercise.id) ? this.data.exerciseList : this.data.exerciseList.concat(exercise);

    // 新建后立即写回动作列表，让下次搜索可以直接复用。
    this.setData({
      exerciseList,
      selectedExercise: exercise,
      showExercisePicker: false,
      pickerKeyword: '',
      pickerExercises: [],
      canCreateExercise: false
    });
  },

  addExercise() {
    const keyword = String(this.data.selectedExercise ? this.data.selectedExercise.name : '').trim();
    const matchedExercise = this.data.exerciseList.find((item) => item.name === keyword);
    const exercise = this.data.selectedExercise || matchedExercise || saveCustomExercise(keyword);
    const sets = Number(this.data.sets);
    const restSeconds = Number(this.data.restSeconds);

    if (!exercise) {
      wx.showToast({ title: '请选择或新建动作', icon: 'none' });
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
    const exerciseList = this.data.exerciseList.some((item) => item.id === exercise.id) ? this.data.exerciseList : this.data.exerciseList.concat(exercise);
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
      currentDayExercises: days[this.data.currentDayIndex].exercises,
      exerciseList,
      selectedExercise: null,
      pickerKeyword: '',
      pickerExercises: [],
      canCreateExercise: false
    });
  },

  removeExercise(event) {
    const { index } = event.currentTarget.dataset;
    const currentIndex = Number(index);
    const currentExercise = this.data.currentDayExercises[currentIndex];
    if (!currentExercise) return;

    wx.showModal({
      title: '删除动作',
      content: `确定删除「${currentExercise.exerciseName}」吗？`,
      confirmText: '删除',
      confirmColor: '#FFD43B',
      success: (res) => {
        if (!res.confirm) return;

        // 动作删除只影响当前训练日，确认后同步回 days 和页面列表。
        const days = this.data.days.slice();
        days[this.data.currentDayIndex].exercises.splice(currentIndex, 1);
        this.setData({
          days,
          currentDayExercises: days[this.data.currentDayIndex].exercises
        });
      }
    });
  },

  moveExercise(event) {
    const { index, direction } = event.currentTarget.dataset;
    const currentIndex = Number(index);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const days = this.data.days.slice();
    const exercises = days[this.data.currentDayIndex].exercises;

    if (targetIndex < 0 || targetIndex >= exercises.length) return;
    const temp = exercises[currentIndex];
    exercises[currentIndex] = exercises[targetIndex];
    exercises[targetIndex] = temp;

    this.setData({
      days,
      currentDayExercises: exercises
    });
  },

  onPlanExerciseInput(event) {
    const { index, field } = event.currentTarget.dataset;
    const days = this.data.days.slice();
    const exercise = days[this.data.currentDayIndex].exercises[Number(index)];
    if (!exercise) return;

    const value = field === 'sets' || field === 'restSeconds'
      ? Number(event.detail.value || 0)
      : event.detail.value;
    exercise[field] = value;

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
      focus: day.focus || '自定义训练日',
      exercises: day.exercises.map((item) => ({
        exerciseId: item.exerciseId,
        sets: item.sets,
        reps: item.reps,
        rpe: item.rpe,
        restSeconds: item.restSeconds,
        role: item.role,
        roleLabel: item.roleLabel,
        weightRule: item.weightRule,
        progressionRule: item.progressionRule,
        notes: item.notes || ''
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
    const meta = this.data.planMeta || {};
    const plan = {
      id: this.data.editingPlanId || `custom_plan_${Date.now()}`,
      planType: 'custom',
      name: this.data.planName,
      sourcePlanId: meta.sourcePlanId || '',
      goal: meta.goal || ['自定义'],
      level: meta.level || '自定义',
      durationWeeks: meta.durationWeeks || 4,
      weeklyFrequency: this.data.days.length,
      equipmentTags: meta.equipmentTags || [],
      overview: meta.overview || '',
      generationSteps: meta.generationSteps || [],
      tips: meta.tips || [],
      nutrition: meta.nutrition || null,
      summary: `我的自定义计划 · ${this.data.days.length} 个训练日 · ${totalExerciseCount} 个动作`,
      days: this.buildPlanDays(this.data.days)
    };

    const savedPlan = await saveUserPlan(plan);
    // 保存后直接询问是否启用，减少“保存后还要回列表再启用”的操作成本。
    wx.showModal({
      title: '已保存计划',
      content: '要立即启用这个计划吗？',
      confirmText: '立即启用',
      cancelText: '稍后',
      success: (res) => {
        if (res.confirm) {
          enablePlan(savedPlan);
          wx.switchTab({ url: '/pages/home/index' });
        } else {
          wx.switchTab({ url: '/pages/plans/index' });
        }
      }
    });
  },

  showNutritionDetail(event) {
    const { type } = event.currentTarget.dataset;
    const meta = this.data.planMeta || {};
    const nutrition = meta.nutrition;
    if (!nutrition) return;

    let title = '';
    let content = '';

    if (type === 'calories') {
      const kcal = nutrition.dailyCalories;
      title = `每日热量：${kcal} 大卡`;
      const beefRice = Math.round(kcal / 650 * 10) / 10;
      content = `每日推荐摄入总热量约为 ${kcal} 大卡。这相当于：\n\n· 约 ${beefRice} 碗常规牛肉饭/轻食餐的能量总和；\n· 或者是 3餐常规少油减脂餐 外加 1-2 个苹果或坚果补给的能量。\n\n增肌用户应保持热量微过剩（摄入 > 消耗），减脂用户应创造热量心律缺口（摄入 < 消耗）。`;
    } else if (type === 'protein') {
      const p = nutrition.protein;
      title = `蛋白质目标：${p} 克`;
      const breasts = Math.floor(p / 30);
      const remaining = p % 30;
      const eggs = Math.round(remaining / 6);
      content = `每日推荐摄入优质蛋白质为 ${p} 克。这相当于：\n\n· 约 ${breasts} 块 100g 熟鸡胸肉（含约 ${breasts * 30}g 蛋白质）\n· 外加约 ${eggs} 个全鸡蛋（含约 ${eggs * 6}g 蛋白质）的蛋白总量。\n\n首选蛋白质来源：牛肉、鸡胸肉、鱼虾、蛋类、豆制品和乳制品。`;
    } else if (type === 'carbs') {
      const c = nutrition.carbs;
      title = `碳水目标：${c} 克`;
      const riceBowls = Math.round(c / 50 * 10) / 10;
      content = `每日推荐摄入碳水化合物为 ${c} 克。这相当于：\n\n· 约 ${riceBowls} 碗 150g 熟米饭的碳水含量；\n· 或者是 3餐中等分量主食 外加 1 根香蕉和 2 片全麦面包的量。\n\n建议优先选择复合碳水（如燕麦、糙米、红薯）作为主食，少喝含糖饮料。`;
    } else if (type === 'fat') {
      const f = nutrition.fat;
      title = `脂肪目标：${f} 克`;
      content = `每日推荐摄入脂肪为 ${f} 克。\n\n日常膳食中的烹调油、肉类自带脂肪和蛋黄是主要来源。建议：\n\n· 优先摄入健康油脂（如橄榄油、牛油果或一小把坚果）；\n· 尽量少吃油炸食品及劣质外卖等反式脂肪酸含量高的食物。`;
    }

    this.setData({
      showNutritionModal: true,
      nutritionModalTitle: title,
      nutritionModalContent: content
    });
  },

  closeNutritionModal() {
    this.setData({ showNutritionModal: false });
  }
});
