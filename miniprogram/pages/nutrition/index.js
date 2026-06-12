const { buildPlanView, getActivePlanDetail } = require('../../services/planService');
const { getWorkoutHistory } = require('../../services/workoutService');
const { buildExecutionInsight } = require('../../utils/executionInsight');
const { buildDayNutritionTarget } = require('../../utils/nutritionInsight');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    activePlan: null,
    plan: null,
    nutrition: null,
    displayedNutrition: null,
    todayAdvice: null,
    selectedDayType: 'training',
    dayTypeOptions: [],
    macroItems: [],
    foodExamples: [],
    theme: 'power-yellow'
  },

  onShow() {
    applyTheme(this);
    this.loadNutrition();
  },

  async loadNutrition() {
    const { activePlan, plan } = await getActivePlanDetail();
    if (!activePlan || !plan) {
      this.setData({ activePlan: null, plan: null, nutrition: null });
      return;
    }

    const planView = await buildPlanView(plan);
    const history = await getWorkoutHistory();
    const executionInsight = buildExecutionInsight({ plan, activePlan, history });
    const nutrition = planView && planView.nutrition ? planView.nutrition : null;
    const selectedDayType = executionInsight.todayAdvice ? executionInsight.todayAdvice.type : 'training';
    const displayedNutrition = buildDayNutritionTarget(nutrition, selectedDayType);

    this.setData({
      activePlan,
      plan: planView,
      nutrition,
      displayedNutrition,
      todayAdvice: executionInsight.todayAdvice,
      selectedDayType,
      dayTypeOptions: this.buildDayTypeOptions(selectedDayType),
      macroItems: this.buildMacroItems(displayedNutrition),
      foodExamples: this.buildFoodExamples(displayedNutrition)
    });
  },

  buildDayTypeOptions(selectedDayType) {
    return [
      { type: 'training', label: '训练日', active: selectedDayType === 'training' },
      { type: 'rest', label: '休息日', active: selectedDayType === 'rest' },
      { type: 'optional', label: '灵活日', active: selectedDayType === 'optional' }
    ];
  },

  changeDayType(event) {
    const { type } = event.currentTarget.dataset;
    const selectedDayType = ['training', 'rest', 'optional'].indexOf(type) !== -1 ? type : 'training';
    const displayedNutrition = buildDayNutritionTarget(this.data.nutrition, selectedDayType);
    this.setData({
      selectedDayType,
      displayedNutrition,
      dayTypeOptions: this.buildDayTypeOptions(selectedDayType),
      macroItems: this.buildMacroItems(displayedNutrition),
      foodExamples: this.buildFoodExamples(displayedNutrition)
    });
  },

  buildMacroItems(nutrition) {
    if (!nutrition) return [];
    return [
      { label: '热量', value: nutrition.dailyCalories, unit: 'kcal', highlight: true },
      { label: '蛋白质', value: nutrition.protein, unit: 'g', highlight: true },
      { label: '碳水', value: nutrition.carbs, unit: 'g' },
      { label: '脂肪', value: nutrition.fat, unit: 'g' }
    ];
  },

  buildFoodExamples(nutrition) {
    if (!nutrition) return [];
    const protein = Number(nutrition.protein || 0);
    const carbs = Number(nutrition.carbs || 0);
    const fat = Number(nutrition.fat || 0);

    // 食物换算只做直观参考，后续记录摄入时再接入更完整的食物库。
    return [
      {
        label: '蛋白质',
        text: `约等于 ${Math.max(Math.round(protein / 30), 1)} 份 100g 熟鸡胸肉的蛋白量`
      },
      {
        label: '主食',
        text: `约等于 ${Math.max(Math.round(carbs / 50), 1)} 碗 150g 熟米饭的碳水量`
      },
      {
        label: '脂肪',
        text: `约等于 ${Math.max(Math.round(fat / 10), 1)} 汤匙烹调油或坚果脂肪量`
      }
    ];
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/index' });
  }
});
