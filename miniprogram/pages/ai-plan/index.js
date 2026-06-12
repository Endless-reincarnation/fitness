const { generateAiPlanDraft, saveAiPlanDraft } = require('../../services/aiPlanService');
const { getUserProfile } = require('../../services/userService');
const { getBodyWeights } = require('../../services/workoutService');
const { listEquipmentOptions } = require('../../services/dictionaryService');
const { standardEquipmentOptions, getEquipmentLabels } = require('../../data/dictionaries');
const { applyTheme } = require('../../utils/theme');

function buildEquipmentText(values, options = standardEquipmentOptions) {
  return getEquipmentLabels(values, options).join(', ');
}

function buildAiEquipmentOptions(selectedValues, options = standardEquipmentOptions) {
  const selected = selectedValues || [];
  return options.map((item) => ({
    ...item,
    selected: selected.indexOf(item.value) !== -1
  }));
}

const defaultEquipmentValues = ['bodyweight', 'dumbbell', 'barbell', 'machine'];

Page({
  data: {
    theme: 'power-yellow',
    planName: '',
    goal: '增肌',
    level: '新手',
    gender: 'unknown',
    age: '',
    heightCm: '',
    weightKg: '',
    weeklyFrequency: '3',
    durationWeeks: '4',
    selectedEquipmentValues: defaultEquipmentValues,
    equipment: buildEquipmentText(defaultEquipmentValues),
    rawEquipmentOptions: standardEquipmentOptions,
    equipmentOptions: buildAiEquipmentOptions(defaultEquipmentValues),
    limitation: '',
    generating: false,
    userProfile: null,
    generationStatus: '',
    generationPreview: '',
    generationSteps: [],
    goalOptions: ['增肌', '减脂', '力量提升', '体态改善'],
    levelOptions: ['新手', '进阶', '高级']
  },

  async onShow() {
    applyTheme(this);
    const [equipmentOptions, userProfile, weights] = await Promise.all([
      listEquipmentOptions(),
      getUserProfile(),
      getBodyWeights()
    ]);
    const latestWeight = weights && weights[0] ? weights[0].weightKg : null;
    const profile = userProfile || {};
    const currentWeight = profile.current_weight_kg || latestWeight || '';
    this.setData({
      rawEquipmentOptions: equipmentOptions,
      equipment: buildEquipmentText(this.data.selectedEquipmentValues, equipmentOptions),
      equipmentOptions: buildAiEquipmentOptions(this.data.selectedEquipmentValues, equipmentOptions),
      userProfile: userProfile ? {
        ...userProfile,
        current_weight_kg: currentWeight || null
      } : (currentWeight ? { current_weight_kg: currentWeight } : null),
      gender: profile.gender || 'unknown',
      age: profile.age || '',
      heightCm: profile.height_cm || '',
      weightKg: currentWeight
    });
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset;
    this.setData({ [field]: event.detail.value });
  },

  selectOption(event) {
    const { field, value } = event.currentTarget.dataset;
    this.setData({ [field]: value });
  },

  toggleEquipment(event) {
    const { value } = event.currentTarget.dataset;
    const selected = this.data.selectedEquipmentValues || [];
    const nextSelected = selected.indexOf(value) === -1
      ? selected.concat(value)
      : selected.filter((item) => item !== value);

    // AI 服务仍接收中文器械描述，页面内部用标准 value 保持选择稳定。
    this.setData({
      selectedEquipmentValues: nextSelected,
      equipment: buildEquipmentText(nextSelected, this.data.rawEquipmentOptions),
      equipmentOptions: buildAiEquipmentOptions(nextSelected, this.data.rawEquipmentOptions)
    });
  },

  async generatePlan() {
    if (this.data.generating) return;

    if (!this.data.weeklyFrequency) {
      wx.showToast({ title: '请填写每周训练次数', icon: 'none' });
      return;
    }

    if (!this.data.equipment) {
      wx.showToast({ title: '请选择可用器械', icon: 'none' });
      return;
    }

    this.setData({
      generating: true,
      generationStatus: '正在读取你的训练目标...',
      generationPreview: '',
      generationSteps: ['读取你的目标和限制', '实时生成计划说明', '匹配训练日和动作安排']
    });

    try {
      // 表单页只负责收集约束，生成后的结构化草稿交给编辑页继续校准。
      const draft = await generateAiPlanDraft({
        planName: this.data.planName,
        goal: this.data.goal,
        level: this.data.level,
        weeklyFrequency: this.data.weeklyFrequency,
        durationWeeks: this.data.durationWeeks,
        equipment: this.data.equipment,
        limitation: this.data.limitation,
        profile: {
          ...(this.data.userProfile || {}),
          gender: this.data.gender,
          age: this.data.age,
          height_cm: this.data.heightCm,
          current_weight_kg: this.data.weightKg
        }
      }, {
        onProgress: (progress) => {
          this.setData({
            generationStatus: progress.status || this.data.generationStatus,
            generationPreview: progress.preview || this.data.generationPreview
          });
        }
      });
      const savedDraft = saveAiPlanDraft(draft);
      wx.showToast({
        title: savedDraft.aiFallback ? '已生成本地草稿' : '生成成功',
        icon: 'success',
        duration: 800
      });
      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/custom-plan/index?draftId=${savedDraft.id}`
        });
      }, 800);
    } catch (error) {
      wx.showToast({ title: error.message || '生成失败', icon: 'none' });
    } finally {
      this.setData({ generating: false });
    }
  },

  buildDraftBrief(draft) {
    const overview = draft.overview || draft.summary || '计划已生成，可以进入编辑页继续微调。';
    const steps = (draft.generationSteps || []).slice(0, 3).map((item, index) => `${index + 1}. ${item}`).join('\n');
    const tips = (draft.tips || []).slice(0, 3).map((item) => `- ${item}`).join('\n');
    return [overview, steps ? `\n生成思路：\n${steps}` : '', tips ? `\n注意事项：\n${tips}` : ''].join('');
  }
});
