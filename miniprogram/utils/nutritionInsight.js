function normalizeBodyWeight(value, fallback = 70) {
  const weight = Number(value);
  if (!weight || weight < 30) return fallback;
  return Math.min(weight, 200);
}

function isMuscleGainGoal(goal) {
  if (Array.isArray(goal)) {
    return goal.some((item) => isMuscleGainGoal(item));
  }
  const text = String(goal || '');
  return text.includes('增肌') || text.includes('增重');
}

function buildNutritionEstimate(options = {}) {
  const goal = options.goal || '增肌';
  const weight = normalizeBodyWeight(options.weightKg, 70);
  const isBulking = isMuscleGainGoal(goal);
  const protein = Math.round(weight * (isBulking ? 2.0 : 1.6));
  const dailyCalories = Math.round(weight * (isBulking ? 38 : 28));
  const fat = Math.round(weight * 0.9);
  const carbs = Math.round((dailyCalories - protein * 4 - fat * 9) / 4);

  // 第一版营养估算只服务训练计划参考，不作为医学或个体化营养处方。
  return {
    dailyCalories,
    protein,
    carbs,
    fat,
    tips: [
      `建议每日补充热量约 ${dailyCalories} 大卡，其中蛋白质目标为 ${protein} 克。`,
      isBulking ? '建议练后 30 分钟内补充碳水化合物和优质蛋白，帮助训练恢复。' : '建议控制高油脂外卖，每餐保证有蔬菜和优质蛋白质。',
      '每天饮水至少 2-3 升，保证训练时体液平衡与代谢畅通。'
    ]
  };
}

function mergeNutritionFallback(rawNutrition = {}, options = {}) {
  const estimate = buildNutritionEstimate(options);
  const tips = Array.isArray(rawNutrition.tips) && rawNutrition.tips.length
    ? rawNutrition.tips
    : estimate.tips;

  return {
    dailyCalories: Number(rawNutrition.dailyCalories || rawNutrition.daily_calories || 0) || estimate.dailyCalories,
    protein: Number(rawNutrition.protein || 0) || estimate.protein,
    carbs: Number(rawNutrition.carbs || 0) || estimate.carbs,
    fat: Number(rawNutrition.fat || 0) || estimate.fat,
    tips
  };
}

function buildDayNutritionTarget(nutrition = {}, dayType = 'training') {
  const base = {
    dailyCalories: Number(nutrition.dailyCalories || 0),
    protein: Number(nutrition.protein || 0),
    carbs: Number(nutrition.carbs || 0),
    fat: Number(nutrition.fat || 0)
  };
  const type = ['training', 'rest', 'optional'].indexOf(dayType) !== -1 ? dayType : 'training';
  const carbFactor = type === 'rest' ? 0.85 : 1;
  const carbs = Math.round(base.carbs * carbFactor);
  const dailyCalories = type === 'rest'
    ? Math.round(base.protein * 4 + carbs * 4 + base.fat * 9)
    : base.dailyCalories;

  // 碳水周期第一版只区分训练/休息，蛋白保持不变，避免建议过度复杂。
  return {
    ...nutrition,
    dayType: type,
    dailyCalories,
    protein: base.protein,
    carbs,
    fat: base.fat,
    adjustmentText: type === 'rest'
      ? '休息日蛋白保持，碳水下调约 15%，总热量随之略收。'
      : '训练日按完整目标摄入，训练前后优先安排碳水和优质蛋白。'
  };
}

module.exports = {
  buildDayNutritionTarget,
  buildNutritionEstimate,
  isMuscleGainGoal,
  mergeNutritionFallback,
  normalizeBodyWeight
};
