const { generateAiPlanDraft, saveAiPlanDraft } = require('../../services/aiPlanService');
const { getUserProfile } = require('../../services/userService');
const { getBodyWeights } = require('../../services/workoutService');
const { applyTheme } = require('../../utils/theme');

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
    equipment: '杠铃, 哑铃, 器械',
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
    const [userProfile, weights] = await Promise.all([
      getUserProfile(),
      getBodyWeights()
    ]);
    const latestWeight = weights && weights[0] ? weights[0].weightKg : null;
    const profile = userProfile || {};
    const currentWeight = profile.current_weight_kg || latestWeight || '';
    this.setData({
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

  async generatePlan() {
    if (this.data.generating) return;

    if (!this.data.weeklyFrequency) {
      wx.showToast({ title: '请填写每周训练次数', icon: 'none' });
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
      const goEdit = () => wx.navigateTo({ url: `/pages/custom-plan/index?draftId=${savedDraft.id}` });

      if (savedDraft.aiFallback) {
        wx.showModal({
          title: '已使用本地草稿',
          content: `真实 AI 暂不可用，已生成一版本地示例草稿，可继续编辑。${savedDraft.aiFallbackMessage ? '\n原因：' + savedDraft.aiFallbackMessage : ''}`,
          showCancel: false,
          confirmText: '去编辑',
          success: goEdit
        });
      } else {
        wx.showModal({
          title: '计划草稿已生成',
          content: this.buildDraftBrief(savedDraft),
          showCancel: false,
          confirmText: '去编辑',
          success: goEdit
        });
      }
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
