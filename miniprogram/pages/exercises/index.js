const { listExercises, saveCustomExercise } = require('../../services/exerciseService');
const { standardEquipmentOptions, customEquipmentOption } = require('../../data/dictionaries');
const { bodyRegionOptions, equipmentOptions, getExerciseRegionRank, matchExerciseKeyword, matchExerciseRegion } = require('../../utils/exerciseCategory');
const { applyTheme } = require('../../utils/theme');
const pageSize = 12;

Page({
  data: {
    theme: 'power-yellow',
    matchedExercises: [],
    visibleCount: pageSize,
    includeSecondaryMuscles: false,
    exercises: [],           // 完整的原始动作列表
    filteredExercises: [],   // 经过筛选后的动作列表
    keyword: '',             // 搜索关键字
    selectedRegion: 'all',   // 当前选中的肌群部位
    selectedEquipment: 'all',// 当前选中的器械类别

    // 横滑过滤器选项
    regionOptions: bodyRegionOptions,
    equipmentOptions: equipmentOptions,

    // 创建自定义动作弹窗相关状态
    showCreateModal: false,
    newExerciseName: '',
    newExerciseRegion: '胸大肌',
    newExerciseEquipment: '哑铃',

    // 新建自定义动作的选择项定义
    formRegionOptions: [
      { value: '胸大肌', label: '胸' },
      { value: '背阔肌', label: '背' },
      { value: '股四头肌', label: '腿' },
      { value: '三角肌中束', label: '肩' },
      { value: '肱二头肌', label: '手臂' },
      { value: '核心肌群', label: '核心' },
      { value: '自定义', label: '自定义' }
    ],
    formEquipmentOptions: standardEquipmentOptions.map((item) => ({
      value: item.label,
      label: item.label
    })).concat(customEquipmentOption)
  },

  async onShow() {
    applyTheme(this);
    await this.loadExercises();
  },

  /**
   * 加载完整动作数据并执行初次过滤
   */
  async loadExercises() {
    wx.showLoading({ title: '加载动作中...', mask: true });
    try {
      const list = await listExercises();
      this.setData({ exercises: list }, () => {
        this.filterExercises();
      });
    } catch (err) {
      console.error('加载动作库失败', err);
      wx.showToast({ title: '加载动作失败', icon: 'error' });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 执行综合过滤逻辑（关键字、肌群部位、器械类型）
   */
  filterExercises() {
    const { exercises, keyword, selectedRegion, selectedEquipment, includeSecondaryMuscles } = this.data;
    
    const matched = exercises.filter((item) => {
      // 1. 关键字（支持名称、拼音首字母、别名等匹配）
      const matchesKeyword = matchExerciseKeyword(item, keyword);

      // 2. 身体部位肌群过滤
      const matchesRegion = matchExerciseRegion(item, selectedRegion, includeSecondaryMuscles);

      // 3. 器械类型分类过滤
      const matchesEquipment = selectedEquipment === 'all' || 
        (item.equipmentCategories && item.equipmentCategories.indexOf(selectedEquipment) !== -1);

      return matchesKeyword && matchesRegion && matchesEquipment;
    }).sort((a, b) => getExerciseRegionRank(a, selectedRegion) - getExerciseRegionRank(b, selectedRegion));

    this.setData({
      matchedExercises: matched,
      visibleCount: pageSize,
      filteredExercises: matched.slice(0, pageSize)
    });
  },

  resetExercisePageScroll() {
    // 切换筛选条件后回到列表顶部，避免停留在旧结果的底部位置。
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0
    });
  },

  refreshFilteredExercises() {
    this.filterExercises();
    this.resetExercisePageScroll();
  },

  loadMoreExercises() {
    const nextCount = this.data.visibleCount + pageSize;
    this.setData({
      visibleCount: nextCount,
      filteredExercises: this.data.matchedExercises.slice(0, nextCount)
    });
  },

  onReachBottom() {
    if (this.data.filteredExercises.length < this.data.matchedExercises.length) {
      this.loadMoreExercises();
    }
  },

  toggleSecondaryMuscles() {
    this.setData({
      includeSecondaryMuscles: !this.data.includeSecondaryMuscles
    }, () => {
      this.refreshFilteredExercises();
    });
  },

  /**
   * 搜索输入触发
   */
  onSearchInput(event) {
    const val = event.detail.value;
    this.setData({ keyword: val }, () => {
      this.refreshFilteredExercises();
    });
  },

  /**
   * 清空搜索内容
   */
  clearSearch() {
    this.setData({ keyword: '' }, () => {
      this.refreshFilteredExercises();
    });
  },

  /**
   * 切换身体部位分类
   */
  switchRegion(event) {
    const { value } = event.currentTarget.dataset;
    this.setData({ selectedRegion: value }, () => {
      this.refreshFilteredExercises();
    });
  },

  /**
   * 切换器械分类
   */
  switchEquipment(event) {
    const { value } = event.currentTarget.dataset;
    this.setData({ selectedEquipment: value }, () => {
      this.refreshFilteredExercises();
    });
  },

  /**
   * 查看动作详情
   */
  openExercise(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/exercise-detail/index?id=${id}` });
  },

  /**
   * 打开新建自定义动作弹窗
   */
  openCreateModal() {
    this.setData({
      showCreateModal: true,
      newExerciseName: '',
      newExerciseRegion: '胸大肌',
      newExerciseEquipment: '哑铃'
    });
  },

  /**
   * 关闭新建自定义动作弹窗
   */
  closeCreateModal() {
    this.setData({ showCreateModal: false });
  },

  /**
   * 新动作输入绑定
   */
  onNewNameInput(event) {
    this.setData({ newExerciseName: event.detail.value });
  },

  /**
   * 弹窗选择主肌群
   */
  selectFormRegion(event) {
    const { value } = event.currentTarget.dataset;
    this.setData({ newExerciseRegion: value });
  },

  /**
   * 弹窗选择器械
   */
  selectFormEquipment(event) {
    const { value } = event.currentTarget.dataset;
    this.setData({ newExerciseEquipment: value });
  },

  /**
   * 提交创建自定义动作
   */
  async submitCreate() {
    const { newExerciseName, newExerciseRegion, newExerciseEquipment, exercises } = this.data;
    const name = String(newExerciseName || '').trim();

    if (!name) {
      wx.showToast({ title: '请输入动作名称', icon: 'none' });
      return;
    }

    // 查重：避免重名导致动作覆盖或混淆
    const isDuplicate = exercises.some(item => item.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
      wx.showModal({
        title: '提示',
        content: `动作库中已存在名为“${name}”的动作，请换个名字。`,
        showCancel: false,
        confirmColor: '#ffd23f'
      });
      return;
    }

    wx.showLoading({ title: '创建中...', mask: true });
    try {
      const saved = saveCustomExercise(name, [newExerciseRegion], [newExerciseEquipment]);
      if (saved) {
        wx.showToast({ title: '创建动作成功', icon: 'success' });
        this.setData({ showCreateModal: false });
        
        // 重新加载动作列表刷新数据并高亮显示刚加的动作
        await this.loadExercises();
      } else {
        wx.showToast({ title: '保存失败', icon: 'error' });
      }
    } catch (err) {
      console.error('创建自定义动作失败', err);
      wx.showToast({ title: '创建失败', icon: 'error' });
    } finally {
      wx.hideLoading();
    }
  },

  noop() {}
});
