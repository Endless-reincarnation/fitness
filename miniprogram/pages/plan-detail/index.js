const { buildPlanView, enablePlan, getActivePlanDetail, getPlanById, listOfficialPlans, deleteUserPlan } = require('../../services/planService');
const { applyTheme } = require('../../utils/theme');

Page({
  data: {
    plan: null,
    theme: 'power-yellow',
    showNutritionModal: false,
    nutritionModalTitle: '',
    nutritionModalContent: ''
  },

  async onLoad(query) {
    const plan = await getPlanById(query.id, query.type);
    if (!plan && query.type === 'custom') {
      wx.showToast({ title: '自定义计划不存在', icon: 'none' });
      return;
    }
    const nextPlan = plan || (await listOfficialPlans())[0];
    this.setData({ plan: await buildPlanView(nextPlan) });
  },

  onShow() {
    applyTheme(this);
  },

  enablePlan() {
    enablePlan(this.data.plan);
    wx.showToast({ title: '已启用计划', icon: 'success' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/home/index' });
    }, 500);
  },

  copyToCustomPlan() {
    const plan = this.data.plan;
    if (!plan) return;

    wx.navigateTo({
      url: `/pages/custom-plan/index?copyFrom=${plan.id}&type=${plan.planType || 'official'}`
    });
  },

  editCustomPlan() {
    const plan = this.data.plan;
    if (!plan) return;

    wx.navigateTo({
      url: `/pages/custom-plan/index?editId=${plan.id}`
    });
  },

  async deletePlan() {
    const { activePlan } = await getActivePlanDetail();
    const isActivePlan = activePlan && this.data.plan && activePlan.planId === this.data.plan.id;

    // 删除当前启用计划会连带清理启用状态和训练草稿，弹窗里提前说明影响范围。
    wx.showModal({
      title: '删除计划',
      content: isActivePlan
        ? '这个计划正在使用，删除后会清除当前启用状态和未完成训练草稿。确定删除吗？'
        : '确定要删除这个自定义计划吗？删除后将无法恢复。',
      confirmColor: '#ff5148',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '正在删除...' });
          await deleteUserPlan(this.data.plan.id);
          wx.hideLoading();
          wx.showToast({ title: '计划已删除', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 500);
        }
      }
    });
  },

  openExercise(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/exercise-detail/index?id=${id}` });
  },

  showNutritionDetail(event) {
    const { type } = event.currentTarget.dataset;
    const nutrition = this.data.plan && this.data.plan.nutrition;
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
  },

  noop() {}
});
