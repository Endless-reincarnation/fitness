<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import draggable from 'vuedraggable';

// ==================== 1. 基础状态变量 ====================
const isAuthenticated = ref(false);
const loginTokenInput = ref('');
const loginError = ref('');
const loading = ref(false);
const isSaving = ref(false);
const currentTab = ref('dashboard'); // dashboard, exercises, plans, feedback

// 云数据库拉取的数据缓存
const stats = ref({ users: 0, exercises: 0, plans: 0, workouts: 0, feedback: 0 });
const musclesList = ref([]);
const exercisesList = ref([]);
const plansList = ref([]);
const planDaysList = ref([]);
const planDayExercisesList = ref([]);
const feedbackList = ref([]);

// 批量选择状态
const selectedExerciseIds = ref([]);
const selectedPlanIds = ref([]);
const selectedFeedbackIds = ref([]);

// 预设选项字典
const bodyRegions = {
  chest: '胸部',
  back: '背部',
  legs: '腿部',
  shoulders: '肩部',
  arms: '手臂',
  core: '核心'
};

const difficulties = {
  beginner: '新手',
  intermediate: '初中级',
  advanced: '进阶'
};

const equipmentOptions = [
  '自重', '徒手', '哑铃', '杠铃', '拉索', '器械', '史密斯机', '易弯杠'
];

const goalOptions = [
  { value: 'muscle_gain', label: '增肌' },
  { value: 'fat_loss', label: '减脂' },
  { value: 'body_shape', label: '塑形' },
  { value: 'strength', label: '力量' }
];

const feedbackStatusText = {
  new: '新留言',
  processing: '处理中',
  done: '已处理'
};

// ==================== 2. 云开发 SDK 联调 ====================
let c1 = null;
const initCloud = async () => {
  if (c1) return c1;
  c1 = new window.cloud.Cloud({
    identityless: true,
    resourceEnv: 'dev-d1getmtzq8dd4414c',
    resourceAppid: 'wx57d64efa2223d77f'
  });
  await c1.init();
  return c1;
};

const callCloudApi = async (action, payload = {}) => {
  const token = localStorage.getItem('admin_token') || '';
  const c = await initCloud();
  const res = await c.callFunction({
    name: 'admin_api',
    data: { token, action, payload }
  });
  
  if (res.result && res.result.code === 200) {
    return res.result.data || res.result.message || {};
  } else {
    throw new Error((res.result && res.result.message) || '请求失败');
  }
};

// ==================== 3. 业务初始化 ====================
const checkLoginState = () => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    isAuthenticated.value = true;
    fetchData();
  }
};

const handleLogin = async () => {
  if (!loginTokenInput.value) {
    loginError.value = '请输入管理员访问口令！';
    return;
  }
  loading.value = true;
  loginError.value = '';
  try {
    localStorage.setItem('admin_token', loginTokenInput.value);
    // 尝试调用 get_stats 校验 token 是否正确
    await callCloudApi('get_stats');
    isAuthenticated.value = true;
    fetchData();
  } catch (err) {
    localStorage.removeItem('admin_token');
    loginError.value = '口令验证失败，请重新输入！';
  } finally {
    loading.value = false;
  }
};

const handleLogout = () => {
  localStorage.removeItem('admin_token');
  isAuthenticated.value = false;
  stats.value = { users: 0, exercises: 0, plans: 0, workouts: 0, feedback: 0 };
};

const fetchData = async () => {
  loading.value = true;
  selectedExerciseIds.value = [];
  selectedPlanIds.value = [];
  selectedFeedbackIds.value = [];
  try {
    // 1. 获取统计数据
    const statsData = await callCloudApi('get_stats');
    stats.value = statsData;

    // 2. 获取肌群列表
    const musclesData = await callCloudApi('get_muscles');
    musclesList.value = musclesData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    // 3. 获取动作库列表
    const exercisesData = await callCloudApi('get_exercises');
    exercisesList.value = exercisesData;

    // 4. 获取计划数据
    const plansData = await callCloudApi('get_plans');
    plansList.value = plansData.plans;
    planDaysList.value = plansData.days;
    planDayExercisesList.value = plansData.dayExercises;

    // 5. 获取用户建议留言
    const feedbackData = await callCloudApi('get_feedback_messages');
    feedbackList.value = feedbackData;
    stats.value.feedback = feedbackData.filter(item => item.status !== 'done').length;
  } catch (err) {
    console.error('拉取云端数据失败：', err);
    alert('同步云端数据出错: ' + err.message);
  } finally {
    loading.value = false;
  }
};

const updateFeedbackStatus = async (item, status) => {
  if (item.status === status) return;

  try {
    await callCloudApi('update_feedback_status', { id: item._id, status });
    item.status = status;
    item.updated_at = new Date().toISOString();
    stats.value.feedback = feedbackList.value.filter(entry => entry.status !== 'done').length;
  } catch (err) {
    alert('更新留言状态失败: ' + err.message);
  }
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
};

// ==================== 4. 动作管理模块逻辑 ====================
const searchExerciseQuery = ref('');
const filterExerciseMuscle = ref('');
const filterExerciseDifficulty = ref('');

const filteredExercises = computed(() => {
  return exercisesList.value.filter(ex => {
    const matchesSearch = searchExerciseQuery.value
      ? (ex.name && ex.name.toLowerCase().includes(searchExerciseQuery.value.toLowerCase())) || 
        (ex.aliases && ex.aliases.some(a => a && a.toLowerCase().includes(searchExerciseQuery.value.toLowerCase())))
      : true;
    const matchesMuscle = filterExerciseMuscle.value
      ? (ex.primary_muscles && ex.primary_muscles.includes(filterExerciseMuscle.value)) || (ex.secondary_muscles && ex.secondary_muscles.includes(filterExerciseMuscle.value))
      : true;
    const matchesDifficulty = filterExerciseDifficulty.value
      ? ex.difficulty === filterExerciseDifficulty.value
      : true;
    return matchesSearch && matchesMuscle && matchesDifficulty && ex.status !== 'disabled';
  });
});

// 对标准动作列表按主肌群分类分组
const groupedExercises = computed(() => {
  const groups = {};
  
  // 初始化所有已知的肌群
  musclesList.value.forEach(m => {
    groups[m._id] = {
      name: m.name,
      exercises: []
    };
  });
  
  // 保留一个未匹配肌群的“其他”组
  groups['other'] = {
    name: '其他动作',
    exercises: []
  };

  exercisesList.value.forEach(ex => {
    const primaryId = ex.primary_muscles && ex.primary_muscles[0];
    if (primaryId && groups[primaryId]) {
      groups[primaryId].exercises.push(ex);
    } else {
      groups['other'].exercises.push(ex);
    }
  });

  return Object.keys(groups)
    .map(key => ({
      id: key,
      name: groups[key].name,
      exercises: groups[key].exercises
    }))
    .filter(g => g.exercises.length > 0);
});

// 快速创建动作关联的计划动作行目标缓存
const quickAddTargetRow = ref(null);

const quickCreateExercise = (day, row) => {
  quickAddTargetRow.value = row;
  openNewExerciseModal();
  // 智能联调：若当前训练日已设定了目标肌群，默认将新建动作的主肌群设为该训练日的首个目标肌群
  if (day.target_muscles && day.target_muscles.length > 0) {
    exerciseForm.primary_muscles = [day.target_muscles[0]];
  }
};

// 动作表单编辑弹窗
const showExerciseModal = ref(false);
const editingExercise = ref(null);
const exerciseForm = reactive({
  _id: '',
  name: '',
  aliasesString: '',
  primary_muscles: [],
  secondary_muscles: [],
  equipment_tags: [],
  difficulty: 'beginner',
  movement_pattern: 'push',
  steps: [''],
  common_mistakes: [''],
  safety_tips: [''],
  status: 'published'
});

const openNewExerciseModal = () => {
  editingExercise.value = null;
  quickAddTargetRow.value = null; // 重置快速新增的绑定行引用
  Object.assign(exerciseForm, {
    _id: '',
    name: '',
    aliasesString: '',
    primary_muscles: [],
    secondary_muscles: [],
    equipment_tags: [],
    difficulty: 'beginner',
    movement_pattern: 'push',
    steps: [''],
    common_mistakes: [''],
    safety_tips: [''],
    status: 'published'
  });
  showExerciseModal.value = true;
};

const openEditExerciseModal = (ex) => {
  editingExercise.value = ex;
  Object.assign(exerciseForm, {
    _id: ex._id,
    name: ex.name,
    aliasesString: ex.aliases ? ex.aliases.join(', ') : '',
    primary_muscles: [...(ex.primary_muscles || [])],
    secondary_muscles: [...(ex.secondary_muscles || [])],
    equipment_tags: [...(ex.equipment_tags || [])],
    difficulty: ex.difficulty || 'beginner',
    movement_pattern: ex.movement_pattern || 'push',
    steps: ex.steps && ex.steps.length ? [...ex.steps] : [''],
    common_mistakes: ex.common_mistakes && ex.common_mistakes.length ? [...ex.common_mistakes] : [''],
    safety_tips: ex.safety_tips && ex.safety_tips.length ? [...ex.safety_tips] : [''],
    status: ex.status || 'published'
  });
  showExerciseModal.value = true;
};

const addFormField = (type) => {
  exerciseForm[type].push('');
};

const removeFormField = (type, index) => {
  if (exerciseForm[type].length > 1) {
    exerciseForm[type].splice(index, 1);
  } else {
    exerciseForm[type][0] = '';
  }
};

const saveExercise = async () => {
  if (!exerciseForm.name) {
    alert('请输入动作名称！');
    return;
  }
  if (!exerciseForm.primary_muscles.length) {
    alert('请至少选择一个主肌群！');
    return;
  }
  
  isSaving.value = true;
  try {
    // 整理表单数据
    const payload = {
      name: exerciseForm.name,
      aliases: exerciseForm.aliasesString.split(',').map(s => s.trim()).filter(Boolean),
      primary_muscles: exerciseForm.primary_muscles,
      secondary_muscles: exerciseForm.secondary_muscles,
      equipment_tags: exerciseForm.equipment_tags,
      difficulty: exerciseForm.difficulty,
      movement_pattern: exerciseForm.movement_pattern,
      steps: exerciseForm.steps.map(s => s.trim()).filter(Boolean),
      common_mistakes: exerciseForm.common_mistakes.map(s => s.trim()).filter(Boolean),
      safety_tips: exerciseForm.safety_tips.map(s => s.trim()).filter(Boolean),
      status: exerciseForm.status
    };
    if (exerciseForm._id) {
      payload._id = exerciseForm._id;
    }

    const savedEx = await callCloudApi('save_exercise', payload);
    
    // 更新本地缓存列表
    if (exerciseForm._id) {
      const idx = exercisesList.value.findIndex(e => e._id === exerciseForm._id);
      if (idx !== -1) exercisesList.value[idx] = savedEx;
    } else {
      exercisesList.value.unshift(savedEx);
      stats.value.exercises += 1;
      
      // 若处于快速新增动作的上下文，自动将该行动作绑定为新动作ID
      if (quickAddTargetRow.value) {
        quickAddTargetRow.value.exercise_id = savedEx._id;
        quickAddTargetRow.value = null;
      }
    }

    showExerciseModal.value = false;
    alert('动作保存成功！');
  } catch (err) {
    alert('动作保存失败: ' + err.message);
  } finally {
    isSaving.value = false;
  }
};

const toggleSelectAllExercises = () => {
  if (selectedExerciseIds.value.length === filteredExercises.value.length) {
    selectedExerciseIds.value = [];
  } else {
    selectedExerciseIds.value = filteredExercises.value.map(ex => ex._id);
  }
};

const deleteSelectedExercises = async () => {
  if (!selectedExerciseIds.value.length) return;
  if (!confirm(`确定要批量下架选中的 ${selectedExerciseIds.value.length} 个动作吗？`)) return;
  
  loading.value = true;
  try {
    const promises = selectedExerciseIds.value.map(id => callCloudApi('delete_exercise', { id }));
    await Promise.all(promises);
    
    // 更新本地列表，过滤掉已下架的动作
    exercisesList.value = exercisesList.value.filter(e => {
      if (selectedExerciseIds.value.includes(e._id)) {
        e.status = 'disabled';
        stats.value.exercises -= 1;
        return false;
      }
      return true;
    });
    
    selectedExerciseIds.value = [];
    alert('批量下架动作成功！');
  } catch (e) {
    console.error(e);
    alert('批量下架动作失败：' + e.message);
  } finally {
    loading.value = false;
  }
};

const toggleSelectAllPlans = () => {
  const activePlans = plansList.value.filter(p => p.status !== 'archived');
  if (selectedPlanIds.value.length === activePlans.length) {
    selectedPlanIds.value = [];
  } else {
    selectedPlanIds.value = activePlans.map(p => p._id);
  }
};

const deleteSelectedPlans = async () => {
  if (!selectedPlanIds.value.length) return;
  if (!confirm(`确定要批量下架并归档选中的 ${selectedPlanIds.value.length} 个计划吗？`)) return;
  
  loading.value = true;
  try {
    const promises = selectedPlanIds.value.map(id => callCloudApi('delete_plan', { id }));
    await Promise.all(promises);
    
    // 更新本地列表状态为已下架
    plansList.value.forEach(p => {
      if (selectedPlanIds.value.includes(p._id)) {
        p.status = 'archived';
      }
    });
    
    selectedPlanIds.value = [];
    alert('批量下架归档计划成功！');
    await fetchData();
  } catch (e) {
    console.error(e);
    alert('批量下架计划失败：' + e.message);
  } finally {
    loading.value = false;
  }
};

const toggleSelectAllFeedback = () => {
  if (selectedFeedbackIds.value.length === feedbackList.value.length) {
    selectedFeedbackIds.value = [];
  } else {
    selectedFeedbackIds.value = feedbackList.value.map(f => f._id);
  }
};

const batchUpdateFeedbackStatus = async (status) => {
  if (!selectedFeedbackIds.value.length) return;
  const label = status === 'done' ? '已处理完成' : '处理中';
  if (!confirm(`确定要把选中的 ${selectedFeedbackIds.value.length} 条留言标记为“${label}”吗？`)) return;
  
  loading.value = true;
  try {
    const promises = selectedFeedbackIds.value.map(id => callCloudApi('update_feedback_status', { id, status }));
    await Promise.all(promises);
    
    // 更新本地状态
    feedbackList.value.forEach(f => {
      if (selectedFeedbackIds.value.includes(f._id)) {
        f.status = status;
      }
    });
    
    stats.value.feedback = feedbackList.value.filter(entry => entry.status !== 'done').length;
    selectedFeedbackIds.value = [];
    alert('批量更新留言状态成功！');
  } catch (e) {
    console.error(e);
    alert('批量处理留言失败：' + e.message);
  } finally {
    loading.value = false;
  }
};

const deleteExercise = async (ex) => {
  if (!confirm(`确认要将动作“${ex.name}”下架停用吗？下架后，已发布的计划中仍会保留它的历史数据，但新计划将无法选择。`)) {
    return;
  }
  try {
    await callCloudApi('delete_exercise', { id: ex._id });
    ex.status = 'disabled';
    exercisesList.value = exercisesList.value.filter(e => e._id !== ex._id);
    stats.value.exercises -= 1;
    alert('动作下架成功！');
  } catch (err) {
    alert('动作下架失败: ' + err.message);
  }
};

// ==================== 5. 计划管理模块逻辑 ====================
const showPlanModal = ref(false);
const editingPlan = ref(null);

// 计划表单的响应式状态
const planForm = reactive({
  _id: '',
  name: '',
  source_type: 'self_curated',
  goal_tags: [],
  level: 'beginner',
  duration_weeks: 6,
  weekly_frequency: 3,
  equipment_tags: [],
  target_users: [''],
  summary: '',
  notes: [''],
  status: 'draft',
  nutrition: {
    dailyCalories: 2000,
    protein: 120,
    carbs: 240,
    fat: 60,
    tips: ['']
  }
});

// 编辑计划时的训练日（内部嵌套包含动作编排列表）响应式数组
const planDaysForm = ref([]);

// 动态增删列表行函数
const addPlanFormField = (type) => {
  if (!planForm[type]) {
    planForm[type] = [];
  }
  planForm[type].push('');
};

const removePlanFormField = (type, index) => {
  if (planForm[type] && planForm[type].length > 1) {
    planForm[type].splice(index, 1);
  } else if (planForm[type]) {
    planForm[type][0] = '';
  }
};

const addNutritionTip = () => {
  if (!planForm.nutrition) {
    planForm.nutrition = {
      dailyCalories: 2000,
      protein: 120,
      carbs: 240,
      fat: 60,
      tips: ['']
    };
  }
  if (!planForm.nutrition.tips) {
    planForm.nutrition.tips = [];
  }
  planForm.nutrition.tips.push('');
};

const removeNutritionTip = (index) => {
  if (planForm.nutrition && planForm.nutrition.tips) {
    if (planForm.nutrition.tips.length > 1) {
      planForm.nutrition.tips.splice(index, 1);
    } else {
      planForm.nutrition.tips[0] = '';
    }
  }
};

const openNewPlanModal = () => {
  editingPlan.value = null;
  Object.assign(planForm, {
    _id: '',
    name: '',
    source_type: 'self_curated',
    goal_tags: [],
    level: 'beginner',
    duration_weeks: 6,
    weekly_frequency: 3,
    equipment_tags: [],
    target_users: [''],
    summary: '',
    notes: [''],
    status: 'draft',
    nutrition: {
      dailyCalories: 2400,
      protein: 140,
      carbs: 280,
      fat: 80,
      tips: ['']
    }
  });
  
  planDaysForm.value = [];
  
  // 根据默认频次初始化训练日列表
  adjustPlanDays();
  
  showPlanModal.value = true;
};

const openEditPlanModal = (plan) => {
  editingPlan.value = plan;
  Object.assign(planForm, {
    _id: plan._id,
    name: plan.name,
    source_type: plan.source_type || 'self_curated',
    goal_tags: [...(plan.goal_tags || [])],
    level: plan.level || 'beginner',
    duration_weeks: plan.duration_weeks || 4,
    weekly_frequency: plan.weekly_frequency || 3,
    equipment_tags: [...(plan.equipment_tags || [])],
    target_users: plan.target_users && plan.target_users.length ? [...plan.target_users] : [''],
    summary: plan.summary || '',
    notes: plan.notes && plan.notes.length ? [...plan.notes] : [''],
    status: plan.status || 'draft',
    nutrition: plan.nutrition ? {
      dailyCalories: plan.nutrition.dailyCalories || 2000,
      protein: plan.nutrition.protein || 120,
      carbs: plan.nutrition.carbs || 240,
      fat: plan.nutrition.fat || 60,
      tips: plan.nutrition.tips && plan.nutrition.tips.length ? [...plan.nutrition.tips] : ['']
    } : {
      dailyCalories: 2000,
      protein: 120,
      carbs: 240,
      fat: 60,
      tips: ['']
    }
  });

  const version = plan.current_version || 1;

  // 过滤出该计划且版本对应的训练日
  const matchedDays = planDaysList.value
    .filter(d => d.plan_template_id === plan._id && d.plan_version === version)
    .sort((a, b) => a.day_index - b.day_index);

  planDaysForm.value = matchedDays.map(d => {
    const exercises = planDayExercisesList.value
      .filter(e => e.plan_day_id === d._id)
      .sort((a, b) => a.order - b.order)
      .map(e => {
        const stdEx = exercisesList.value.find(s => s._id === e.exercise_id);
        return {
          ...e,
          temp_muscle_id: stdEx && stdEx.primary_muscles && stdEx.primary_muscles.length ? stdEx.primary_muscles[0] : ''
        };
      });
    return {
      ...d,
      exercises: JSON.parse(JSON.stringify(exercises))
    };
  });

  showPlanModal.value = true;
};

// 切换选择目标肌群
const toggleMuscleSelection = (day, muscleId) => {
  if (!day.target_muscles || !Array.isArray(day.target_muscles)) {
    day.target_muscles = [];
  }
  const idx = day.target_muscles.indexOf(muscleId);
  if (idx > -1) {
    day.target_muscles.splice(idx, 1);
  } else {
    day.target_muscles.push(muscleId);
  }
};

// 动态调整训练日天数
const adjustPlanDays = () => {
  const targetCount = parseInt(planForm.weekly_frequency) || 1;
  const currentCount = planDaysForm.value.length;
  
  if (currentCount < targetCount) {
    // 增加天数
    for (let i = currentCount; i < targetCount; i++) {
      const tempDayId = `temp_day_${Date.now()}_${i}`;
      planDaysForm.value.push({
        _id: tempDayId,
        day_index: i + 1,
        name: `训练日 ${i + 1}`,
        focus: '',
        target_muscles: [],
        exercises: []
      });
    }
  } else if (currentCount > targetCount) {
    // 减少天数 (从尾部移除)
    planDaysForm.value = planDaysForm.value.slice(0, targetCount);
  }
};

// 添加编排动作
const addExerciseToDay = (dayId) => {
  const day = planDaysForm.value.find(d => d._id === dayId);
  if (!day) return;
  
  const maxOrder = day.exercises.reduce((max, e) => e.order > max ? e.order : max, 0);
  const defaultMuscle = day.target_muscles && day.target_muscles.length ? day.target_muscles[0] : '';
  
  day.exercises.push({
    _id: `temp_ex_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    plan_day_id: dayId,
    exercise_id: '',
    order: maxOrder + 1,
    role: 'assistance',
    sets: 3,
    reps: '8-12',
    rpe: '8',
    rest_seconds: 90,
    weight_rule: '',
    progression_rule: '',
    notes: '',
    temp_muscle_id: defaultMuscle
  });
};

// 移除编排动作
const removeExerciseFromDay = (day, exId) => {
  day.exercises = day.exercises.filter(e => e._id !== exId);
  resortExercises(day);
};

// 重新排序
const resortExercises = (day) => {
  day.exercises.forEach((e, idx) => {
    e.order = idx + 1;
  });
};

const moveExercise = (day, exIdx, direction) => {
  const arr = day.exercises;
  if (direction === 'up' && exIdx > 0) {
    const temp = arr[exIdx];
    arr[exIdx] = arr[exIdx - 1];
    arr[exIdx - 1] = temp;
  } else if (direction === 'down' && exIdx < arr.length - 1) {
    const temp = arr[exIdx];
    arr[exIdx] = arr[exIdx + 1];
    arr[exIdx + 1] = temp;
  }
  resortExercises(day);
};

const savePlan = async () => {
  if (!planForm.name) {
    alert('请输入计划名称！');
    return;
  }
  
  // 基础数据校验
  for (const day of planDaysForm.value) {
    if (!day.name) {
      alert(`请输入 训练日 ${day.day_index} 的名称！`);
      return;
    }
    if (!day.exercises.length) {
      alert(`训练日“${day.name}”至少需要配置一个训练动作！`);
      return;
    }
    for (const ex of day.exercises) {
      if (!ex.exercise_id) {
        alert(`请在“${day.name}”中选择对应的动作，不能留空！`);
        return;
      }
      if (!ex.sets || ex.sets <= 0) {
        alert(`“${day.name}”中动作的组数配置不正确，必须大于 0！`);
        return;
      }
    }
  }

  isSaving.value = true;
  try {
    // 整理表单数据
    const planPayload = {
      name: planForm.name,
      source_type: planForm.source_type,
      goal_tags: planForm.goal_tags,
      level: planForm.level,
      duration_weeks: parseInt(planForm.duration_weeks) || 4,
      weekly_frequency: parseInt(planForm.weekly_frequency) || 3,
      equipment_tags: planForm.equipment_tags,
      target_users: planForm.target_users.map(u => u.trim()).filter(Boolean),
      summary: planForm.summary,
      notes: planForm.notes.map(n => n.trim()).filter(Boolean),
      status: planForm.status,
      nutrition: {
        dailyCalories: parseInt(planForm.nutrition.dailyCalories) || 2000,
        protein: parseInt(planForm.nutrition.protein) || 120,
        carbs: parseInt(planForm.nutrition.carbs) || 240,
        fat: parseInt(planForm.nutrition.fat) || 60,
        tips: planForm.nutrition.tips.map(t => t.trim()).filter(Boolean)
      }
    };
    if (planForm._id) {
      planPayload._id = planForm._id;
    }

    // 扁平化数据以匹配云数据库关系架构，并填补动作名称快照
    const plan_days = planDaysForm.value.map(day => {
      const d = { ...day };
      delete d.exercises; // 移除辅助前端使用的嵌套数据
      return d;
    });

    const plan_day_exercises = planDaysForm.value.flatMap(day => {
      return day.exercises.map(ex => {
        const matchObj = exercisesList.value.find(e => e._id === ex.exercise_id);
        return {
          ...ex,
          plan_day_id: day._id, // 保证天ID绑定同步
          exercise_name: matchObj ? matchObj.name : ''
        };
      });
    });

    const payload = {
      plan_template: planPayload,
      plan_days,
      plan_day_exercises
    };

    const res = await callCloudApi('save_plan', payload);
    
    // 重新拉取一次数据以刷新关系与版本缓存
    await fetchData();

    showPlanModal.value = false;
    alert('计划模板保存成功！');
  } catch (err) {
    alert('计划模板保存失败: ' + err.message);
  } finally {
    isSaving.value = false;
  }
};

const deletePlan = async (plan) => {
  if (!confirm(`确认要将计划“${plan.name}”下架并归档吗？下架后，正在执行此计划的用户仍可照常训练，但新用户将无法检索到该计划。`)) {
    return;
  }
  try {
    await callCloudApi('delete_plan', { id: plan._id });
    alert('计划下架成功！');
    await fetchData();
  } catch (err) {
    alert('计划下架失败: ' + err.message);
  }
};

const publishNewVersion = async (plan) => {
  if (!confirm(`您正准备为已发布计划“${plan.name}”发布全新版本（版本号将增加，如 v${plan.current_version} -> v${plan.current_version + 1}）。发布新版本后，新用户启用的计划将使用新版结构，历史用户的旧训练数据快照将不受影响。确定执行吗？`)) {
    return;
  }
  loading.value = true;
  try {
    const res = await callCloudApi('publish_plan_new_version', { id: plan._id });
    alert(`新版本 v${res.new_version} 发布成功！`);
    await fetchData();
  } catch (err) {
    alert('版本发布失败: ' + err.message);
  } finally {
    loading.value = false;
  }
};

// 级联动作面板状态与交互
const activeCascaderRowId = ref(null);

const toggleCascader = (rowId) => {
  if (activeCascaderRowId.value === rowId) {
    activeCascaderRowId.value = null;
  } else {
    activeCascaderRowId.value = rowId;
  }
};

const selectExerciseCascade = (row, exId) => {
  row.exercise_id = exId;
  // 同时同步级联对应的 temp_muscle_id
  const stdEx = exercisesList.value.find(s => s._id === exId);
  if (stdEx && stdEx.primary_muscles && stdEx.primary_muscles.length) {
    row.temp_muscle_id = stdEx.primary_muscles[0];
  }
  activeCascaderRowId.value = null; // 选择后自动收起
};

const getExerciseName = (exId) => {
  const ex = exercisesList.value.find(e => e._id === exId);
  return ex ? ex.name : '';
};

// ==================== 生命周期挂载 ====================
onMounted(() => {
  checkLoginState();
  
  // 点击外部时关闭级联动作面板
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-cascader')) {
      activeCascaderRowId.value = null;
    }
  });
});
</script>

<template>
  <!-- 登录校验界面 -->
  <div v-if="!isAuthenticated" class="login-overlay">
    <div class="login-card">
      <div class="logo-section login-logo">
        <div class="logo-icon">G</div>
        <div class="logo-text">FITNESS ASSISTANT</div>
      </div>
      <h3 class="login-title">管理后台登录</h3>
      <p class="login-subtitle">请输入云环境安全访问口令以进行数据授权</p>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>访问口令 (Token)</label>
          <input 
            type="password" 
            v-model="loginTokenInput" 
            class="form-input" 
            placeholder="请输入管理员口令"
            required
          />
        </div>
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '口令验证中...' : '安全登录' }}
        </button>
      </form>
      
      <p v-if="loginError" class="login-error">{{ loginError }}</p>
    </div>
  </div>

  <!-- 主应用容器 -->
  <div v-else class="app-container">
    
    <!-- 侧边导航栏 -->
    <aside class="sidebar">
      <div class="logo-section">
        <div class="logo-icon">G</div>
        <div class="logo-text">健身计划助手</div>
      </div>
      
      <nav class="nav-menu">
        <li 
          class="nav-item" 
          :class="{ active: currentTab === 'dashboard' }"
          @click="currentTab = 'dashboard'"
        >
          <span class="icon">📊</span> 运营看板
        </li>
        <li 
          class="nav-item" 
          :class="{ active: currentTab === 'exercises' }"
          @click="currentTab = 'exercises'"
        >
          <span class="icon">🏋️</span> 标准动作库
        </li>
        <li 
          class="nav-item" 
          :class="{ active: currentTab === 'plans' }"
          @click="currentTab = 'plans'"
        >
          <span class="icon">📅</span> 官方计划库
        </li>
        <li 
          class="nav-item" 
          :class="{ active: currentTab === 'feedback' }"
          @click="currentTab = 'feedback'"
        >
          <span class="icon">💬</span> 建议留言
        </li>
      </nav>
      
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">退出管理系统</button>
      </div>
    </aside>

    <!-- 主工作区 -->
    <main class="main-content">
      
      <!-- 渲染1：运营看板 -->
      <section v-if="currentTab === 'dashboard'">
        <div class="page-header">
          <div>
            <h2 class="page-title">系统大盘统计</h2>
            <p class="page-subtitle">WeChat Fitness Assistant Dashboard</p>
          </div>
          <button class="btn btn-secondary" @click="fetchData" :disabled="loading">
            🔄 刷新数据
          </button>
        </div>

        <div class="stats-grid">
          <div class="card stat-card">
            <div class="stat-info">
              <span class="stat-label">小程序注册用户</span>
              <span class="stat-value">{{ stats.users }}</span>
            </div>
            <div class="stat-icon">👤</div>
          </div>
          <div class="card stat-card">
            <div class="stat-info">
              <span class="stat-label">标准动作数量</span>
              <span class="stat-value">{{ stats.exercises }}</span>
            </div>
            <div class="stat-icon">💪</div>
          </div>
          <div class="card stat-card">
            <div class="stat-info">
              <span class="stat-label">官方计划模板</span>
              <span class="stat-value">{{ stats.plans }}</span>
            </div>
            <div class="stat-icon">📋</div>
          </div>
          <div class="card stat-card">
            <div class="stat-info">
              <span class="stat-label">用户累计训练组数</span>
              <span class="stat-value">{{ stats.workouts }}</span>
            </div>
            <div class="stat-icon">🔥</div>
          </div>
          <div class="card stat-card">
            <div class="stat-info">
              <span class="stat-label">未处理建议留言</span>
              <span class="stat-value">{{ stats.feedback }}</span>
            </div>
            <div class="stat-icon">💬</div>
          </div>
        </div>

        <div class="card mt-4">
          <h3 class="mb-4">云端数据库状态诊断</h3>
          <p class="mb-4" style="color: var(--text-muted); font-size: 0.95rem;">
            数据库各项集合读写正常。当前版本由本地管理端通过安全云函数 <code>admin_api</code> 执行增删改查动作，具有全套操作快照记录与日志回溯保障。
          </p>
          <div class="badge badge-success">云服务已联调成功</div>
        </div>
      </section>

      <!-- 渲染2：标准动作库管理 -->
      <section v-else-if="currentTab === 'exercises'">
        <div class="page-header">
          <div>
            <h2 class="page-title">标准动作库</h2>
            <p class="page-subtitle">动作将被编排入计划，展示主辅肌群和安全步骤</p>
          </div>
          <button class="btn btn-primary" @click="openNewExerciseModal">
            ➕ 新增标准动作
          </button>
        </div>

        <!-- 过滤器 -->
        <div class="filter-bar">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              v-model="searchExerciseQuery" 
              class="search-input" 
              placeholder="搜索动作名称或别名..."
            />
          </div>
          
          <select v-model="filterExerciseMuscle" class="select-filter">
            <option value="">全部肌群</option>
            <option v-for="m in musclesList" :key="m._id" :value="m._id">
              {{ m.name }}
            </option>
          </select>

          <select v-model="filterExerciseDifficulty" class="select-filter">
            <option value="">全部难度</option>
            <option value="beginner">新手</option>
            <option value="intermediate">初中级</option>
            <option value="advanced">进阶</option>
          </select>

          <button v-if="selectedExerciseIds.length" class="btn btn-danger btn-batch" style="margin-left: auto;" @click="deleteSelectedExercises">
            🗑️ 批量下架 ({{ selectedExerciseIds.length }})
          </button>
        </div>

        <!-- 动作数据表格 -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">
                  <input type="checkbox" :checked="selectedExerciseIds.length === filteredExercises.length && filteredExercises.length > 0" @change="toggleSelectAllExercises" />
                </th>
                <th>动作 ID</th>
                <th>动作名称</th>
                <th>主要肌群</th>
                <th>辅助肌群</th>
                <th>使用器械</th>
                <th>难度</th>
                <th>状态</th>
                <th class="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ex in filteredExercises" :key="ex._id">
                <td style="text-align: center;">
                  <input type="checkbox" :value="ex._id" v-model="selectedExerciseIds" />
                </td>
                <td style="font-family: monospace; font-size: 0.8rem;">{{ ex._id }}</td>
                <td style="font-weight: 600;">{{ ex.name }}</td>
                <td>
                  <span v-for="mId in ex.primary_muscles" :key="mId" class="badge badge-primary mr-2">
                    {{ musclesList.find(m => m._id === mId)?.name || mId }}
                  </span>
                </td>
                <td>
                  <span v-for="mId in ex.secondary_muscles" :key="mId" class="muscle-tag">
                    {{ musclesList.find(m => m._id === mId)?.name || mId }}
                  </span>
                  <span v-if="!ex.secondary_muscles || !ex.secondary_muscles.length" style="color: var(--text-muted); font-size: 0.8rem;">-</span>
                </td>
                <td>
                  <span v-for="eq in ex.equipment_tags" :key="eq" class="muscle-tag">{{ eq }}</span>
                </td>
                <td>
                  <span class="badge" :class="ex.difficulty === 'advanced' ? 'badge-danger' : ex.difficulty === 'intermediate' ? 'badge-primary' : 'badge-success'">
                    {{ difficulties[ex.difficulty] }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="ex.status === 'published' ? 'badge-success' : 'badge-muted'">
                    {{ ex.status === 'published' ? '已发布' : '草稿' }}
                  </span>
                </td>
                <td class="text-right">
                  <button class="btn btn-secondary mr-2" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" @click="openEditExerciseModal(ex)">
                    编辑
                  </button>
                  <button class="btn btn-danger" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" @click="deleteExercise(ex)">
                    下架
                  </button>
                </td>
              </tr>
              <tr v-if="!filteredExercises.length">
                <td colspan="9" class="text-center" style="padding: 3rem; color: var(--text-muted);">
                  没有找到符合条件的动作数据。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 渲染3：官方计划库管理 -->
      <section v-else-if="currentTab === 'plans'">
        <div class="page-header">
          <div>
            <h2 class="page-title">官方计划库</h2>
            <p class="page-subtitle">配置训练计划，用户启用后生成个人训练日和动作流程</p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button v-if="selectedPlanIds.length" class="btn btn-danger" @click="deleteSelectedPlans">
              🗑️ 批量下架 ({{ selectedPlanIds.length }})
            </button>
            <button class="btn btn-primary" @click="openNewPlanModal">
              ➕ 创建新计划模板
            </button>
          </div>
        </div>

        <!-- 计划列表 -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">
                  <input type="checkbox" :checked="selectedPlanIds.length === plansList.filter(p => p.status !== 'archived').length && plansList.filter(p => p.status !== 'archived').length > 0" @change="toggleSelectAllPlans" />
                </th>
                <th>计划名称</th>
                <th>难度</th>
                <th>训练频次</th>
                <th>周期</th>
                <th>状态</th>
                <th>当前版本</th>
                <th class="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="plan in plansList.filter(p => p.status !== 'archived')" :key="plan._id">
                <td style="text-align: center;">
                  <input type="checkbox" :value="plan._id" v-model="selectedPlanIds" />
                </td>
                <td style="font-weight: 600; font-size: 0.95rem;">{{ plan.name }}</td>
                <td>
                  <span class="badge" :class="plan.level === 'advanced' ? 'badge-danger' : plan.level === 'intermediate' ? 'badge-primary' : 'badge-success'">
                    {{ difficulties[plan.level] }}
                  </span>
                </td>
                <td>每周 {{ plan.weekly_frequency }} 练</td>
                <td>{{ plan.duration_weeks }} 周</td>
                <td>
                  <span class="badge" :class="plan.status === 'published' ? 'badge-success' : 'badge-muted'">
                    {{ plan.status === 'published' ? '已发布' : '草稿' }}
                  </span>
                </td>
                <td style="font-weight: 700; font-family: monospace;">v{{ plan.current_version }}</td>
                <td class="text-right">
                  <button class="btn btn-secondary mr-2" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" @click="openEditPlanModal(plan)">
                    编排与修改
                  </button>
                  <button v-if="plan.status === 'published'" class="btn btn-primary mr-2" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" @click="publishNewVersion(plan)">
                    发布新版本
                  </button>
                  <button class="btn btn-danger" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" @click="deletePlan(plan)">
                    归档下架
                  </button>
                </td>
              </tr>
              <tr v-if="!plansList.filter(p => p.status !== 'archived').length">
                <td colspan="8" class="text-center" style="padding: 3rem; color: var(--text-muted);">
                  暂无已保存的官方计划模板。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 渲染4：建议留言管理 -->
      <section v-else-if="currentTab === 'feedback'">
        <div class="page-header">
          <div>
            <h2 class="page-title">建议留言</h2>
            <p class="page-subtitle">查看小程序用户提交的问题反馈和功能建议</p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button v-if="selectedFeedbackIds.length" class="btn btn-primary" @click="batchUpdateFeedbackStatus('done')">
              ✅ 批量已处理 ({{ selectedFeedbackIds.length }})
            </button>
            <button v-if="selectedFeedbackIds.length" class="btn btn-secondary" @click="batchUpdateFeedbackStatus('processing')">
              ⚙️ 批量处理中 ({{ selectedFeedbackIds.length }})
            </button>
            <button class="btn btn-secondary" @click="fetchData" :disabled="loading">
              🔄 刷新留言
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">
                  <input type="checkbox" :checked="selectedFeedbackIds.length === feedbackList.length && feedbackList.length > 0" @change="toggleSelectAllFeedback" />
                </th>
                <th>提交时间</th>
                <th>状态</th>
                <th>建议内容</th>
                <th>联系方式</th>
                <th>用户</th>
                <th class="text-right">处理</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in feedbackList" :key="item._id">
                <td style="text-align: center;">
                  <input type="checkbox" :value="item._id" v-model="selectedFeedbackIds" />
                </td>
                <td style="white-space: nowrap;">{{ formatDateTime(item.created_at) }}</td>
                <td>
                  <span class="badge" :class="item.status === 'done' ? 'badge-success' : item.status === 'processing' ? 'badge-primary' : 'badge-danger'">
                    {{ feedbackStatusText[item.status] || item.status }}
                  </span>
                </td>
                <td class="feedback-content">{{ item.content }}</td>
                <td>{{ item.contact || '-' }}</td>
                <td>{{ item.user_snapshot && item.user_snapshot.nickname ? item.user_snapshot.nickname : '-' }}</td>
                <td class="text-right">
                  <button class="btn btn-secondary mr-2" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" @click="updateFeedbackStatus(item, 'processing')">
                    处理中
                  </button>
                  <button class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" @click="updateFeedbackStatus(item, 'done')">
                    已处理
                  </button>
                </td>
              </tr>
              <tr v-if="!feedbackList.length">
                <td colspan="7" class="text-center" style="padding: 3rem; color: var(--text-muted);">
                  暂无用户建议留言。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </main>

    <!-- ==================== 动作编辑弹窗 ==================== -->
    <div v-if="showExerciseModal" class="modal-backdrop">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingExercise ? '修改标准动作' : '新增标准动作' }}</h3>
          <button class="close-btn" @click="showExerciseModal = false">×</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveExercise">
            <div class="form-grid">
              
              <div class="form-group">
                <label>动作唯一 ID (英文字符，如 dumbbell_shoulder_press)</label>
                <input 
                  type="text" 
                  v-model="exerciseForm._id" 
                  class="form-input" 
                  placeholder="留空则由数据库随机生成"
                  :disabled="!!editingExercise"
                />
              </div>

              <div class="form-group">
                <label>动作名称</label>
                <input 
                  type="text" 
                  v-model="exerciseForm.name" 
                  class="form-input" 
                  placeholder="如: 哑铃上斜卧推"
                  required
                />
              </div>

              <div class="form-group full-width">
                <label>别名 (别名可以帮助用户在录入匹配时更精准，多个用逗号隔开)</label>
                <input 
                  type="text" 
                  v-model="exerciseForm.aliasesString" 
                  class="form-input" 
                  placeholder="如: 上斜哑铃卧推, 哑铃斜推"
                />
              </div>

              <div class="form-group">
                <label>主要肌群 (必选)</label>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; background: rgba(255,255,255,0.015); padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px;">
                  <label v-for="m in musclesList" :key="'p_'+m._id" style="font-weight: normal; font-size: 0.85rem; display: flex; align-items: center; gap: 0.25rem;">
                    <input type="checkbox" :value="m._id" v-model="exerciseForm.primary_muscles"> {{ m.name }}
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label>辅助肌群</label>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; background: rgba(255,255,255,0.015); padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px;">
                  <label v-for="m in musclesList" :key="'s_'+m._id" style="font-weight: normal; font-size: 0.85rem; display: flex; align-items: center; gap: 0.25rem;">
                    <input type="checkbox" :value="m._id" v-model="exerciseForm.secondary_muscles"> {{ m.name }}
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label>困难程度</label>
                <select v-model="exerciseForm.difficulty" class="form-input">
                  <option value="beginner">新手 (Beginner)</option>
                  <option value="intermediate">初中级 (Intermediate)</option>
                  <option value="advanced">进阶 (Advanced)</option>
                </select>
              </div>

              <div class="form-group">
                <label>动作模式分类</label>
                <select v-model="exerciseForm.movement_pattern" class="form-input">
                  <option value="push">推 (Push)</option>
                  <option value="pull">拉 (Pull)</option>
                  <option value="squat">蹲 (Squat)</option>
                  <option value="hinge">铰链 (Hinge)</option>
                  <option value="other">其它 (Other)</option>
                </select>
              </div>

              <div class="form-group full-width">
                <label>使用器械需求 (支持复选)</label>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                  <label v-for="eq in equipmentOptions" :key="eq" style="font-weight: normal; font-size: 0.9rem; display: flex; align-items: center; gap: 0.25rem;">
                    <input type="checkbox" :value="eq" v-model="exerciseForm.equipment_tags"> {{ eq }}
                  </label>
                </div>
              </div>

              <!-- 步骤动态行 -->
              <div class="form-group full-width">
                <label>动作执行步骤</label>
                <div v-for="(step, sIdx) in exerciseForm.steps" :key="'step_'+sIdx" class="list-item-edit">
                  <span style="font-size: 0.85rem; color: var(--text-muted); width: 30px;">#{{ sIdx + 1 }}</span>
                  <input type="text" v-model="exerciseForm.steps[sIdx]" class="form-input" style="flex-grow: 1; margin: 0 0.5rem;" placeholder="如: 坐在斜板凳上，双手推起哑铃到正上方" />
                  <button type="button" class="btn btn-danger" style="padding: 0.35rem; font-size: 0.75rem;" @click="removeFormField('steps', sIdx)">删除</button>
                </div>
                <button type="button" class="btn btn-secondary mt-4" style="font-size: 0.8rem;" @click="addFormField('steps')">
                  ➕ 添加操作步骤
                </button>
              </div>

              <!-- 常见错误动态行 -->
              <div class="form-group full-width">
                <label>常见错误细节</label>
                <div v-for="(err, eIdx) in exerciseForm.common_mistakes" :key="'err_'+eIdx" class="list-item-edit">
                  <input type="text" v-model="exerciseForm.common_mistakes[eIdx]" class="form-input" style="flex-grow: 1; margin-right: 0.5rem;" placeholder="如: 哑铃下降过低导致肩关节张力过大" />
                  <button type="button" class="btn btn-danger" style="padding: 0.35rem; font-size: 0.75rem;" @click="removeFormField('common_mistakes', eIdx)">删除</button>
                </div>
                <button type="button" class="btn btn-secondary mt-4" style="font-size: 0.8rem;" @click="addFormField('common_mistakes')">
                  ➕ 添加常见错误说明
                </button>
              </div>

              <!-- 安全提示动态行 -->
              <div class="form-group full-width">
                <label>安全防护建议</label>
                <div v-for="(tips, tIdx) in exerciseForm.safety_tips" :key="'tips_'+tIdx" class="list-item-edit">
                  <input type="text" v-model="exerciseForm.safety_tips[tIdx]" class="form-input" style="flex-grow: 1; margin-right: 0.5rem;" placeholder="如: 手肘不要过度向外锁死" />
                  <button type="button" class="btn btn-danger" style="padding: 0.35rem; font-size: 0.75rem;" @click="removeFormField('safety_tips', tIdx)">删除</button>
                </div>
                <button type="button" class="btn btn-secondary mt-4" style="font-size: 0.8rem;" @click="addFormField('safety_tips')">
                  ➕ 添加安全警告
                </button>
              </div>

              <div class="form-group">
                <label>发布状态</label>
                <select v-model="exerciseForm.status" class="form-input">
                  <option value="published">立即发布 (Published)</option>
                  <option value="draft">暂存草稿 (Draft)</option>
                </select>
              </div>

            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showExerciseModal = false">取消</button>
          <button class="btn btn-primary" @click="saveExercise" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 计划编排弹窗 (侧滑抽屉样式) ==================== -->
    <div v-if="showPlanModal" class="drawer-backdrop" @click.self="showPlanModal = false">
      <div class="drawer-content large">
        <div class="modal-header">
          <h3>{{ editingPlan ? `编排计划: ${planForm.name} (当前 v${editingPlan.current_version})` : '创建新计划模板' }}</h3>
          <button class="close-btn" @click="showPlanModal = false">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            
            <div class="form-group">
              <label>计划 ID (如 beginner_3day_split, 建议英文字符)</label>
              <input 
                type="text" 
                v-model="planForm._id" 
                class="form-input" 
                placeholder="创建后不可修改"
                :disabled="!!editingPlan"
              />
            </div>

            <div class="form-group">
              <label>计划名称</label>
              <input 
                type="text" 
                v-model="planForm.name" 
                class="form-input" 
                placeholder="如: 新手三分化增肌计划"
                required
              />
            </div>

            <div class="form-group">
              <label>难度阶段</label>
              <select v-model="planForm.level" class="form-input">
                <option value="beginner">新手入门</option>
                <option value="intermediate">初中级强化</option>
                <option value="advanced">进阶突破</option>
              </select>
            </div>

            <div class="form-group">
              <label>计划来源类型</label>
              <select v-model="planForm.source_type" class="form-input">
                <option value="self_curated">官方原创 (Self-Curated)</option>
                <option value="licensed">授权分发 (Licensed)</option>
              </select>
            </div>

            <div class="form-group">
              <label>建议周期 (周)</label>
              <input 
                type="number" 
                v-model="planForm.duration_weeks" 
                class="form-input" 
                min="1"
              />
            </div>

            <div class="form-group">
              <label>每周训练频次 (天/每周)</label>
              <input 
                type="number" 
                v-model="planForm.weekly_frequency" 
                class="form-input" 
                min="1" 
                max="7"
                @change="adjustPlanDays"
              />
            </div>

            <div class="form-group full-width">
              <label>训练核心目标 (支持复选)</label>
              <div style="display: flex; gap: 1.5rem;">
                <label v-for="g in goalOptions" :key="g.value" style="font-weight: normal; font-size: 0.9rem; display: flex; align-items: center; gap: 0.25rem;">
                  <input type="checkbox" :value="g.value" v-model="planForm.goal_tags"> {{ g.label }}
                </label>
              </div>
            </div>

            <div class="form-group full-width">
              <label>计划摘要介绍</label>
              <textarea v-model="planForm.summary" class="form-input" style="height: 80px;" placeholder="简述该计划的目标和受众..."></textarea>
            </div>

            <div class="form-group full-width">
              <label>计划状态</label>
              <select v-model="planForm.status" class="form-input" style="width: 200px;">
                <option value="draft">存为草稿 (用户不可见)</option>
                <option value="published">直接发布 (小程序端同步上架)</option>
              </select>
            </div>

            <!-- 适合人群动态行 -->
            <div class="form-group full-width" style="border-top: 1px dashed var(--border-color); padding-top: 1rem; margin-top: 0.5rem;">
              <label>适合人群列表</label>
              <div v-for="(user, uIdx) in planForm.target_users" :key="'user_'+uIdx" style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                <input type="text" v-model="planForm.target_users[uIdx]" class="form-input" style="flex-grow: 1; margin-right: 0.5rem;" placeholder="如: 新手、有一定器械条件的用户" />
                <button type="button" class="btn btn-danger" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" @click="removePlanFormField('target_users', uIdx)">删除</button>
              </div>
              <button type="button" class="btn btn-secondary" style="font-size: 0.8rem;" @click="addPlanFormField('target_users')">
                ➕ 添加适合人群
              </button>
            </div>

            <!-- 执行说明动态行 -->
            <div class="form-group full-width">
              <label>计划执行说明 / 注意事项</label>
              <div v-for="(note, nIdx) in planForm.notes" :key="'note_'+nIdx" style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                <input type="text" v-model="planForm.notes[nIdx]" class="form-input" style="flex-grow: 1; margin-right: 0.5rem;" placeholder="如: 主项建议保留约 2 次余量，控制在 RPE 8 左右" />
                <button type="button" class="btn btn-danger" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" @click="removePlanFormField('notes', nIdx)">删除</button>
              </div>
              <button type="button" class="btn btn-secondary" style="font-size: 0.8rem;" @click="addPlanFormField('notes')">
                ➕ 添加执行说明
              </button>
            </div>

            <!-- 膳食营养建议配置 -->
            <div class="form-group full-width" style="border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: 1rem;">
              <h3 class="mb-4">🥗 膳食营养建议配置</h3>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label>每日建议热量 (kcal)</label>
                  <input type="number" v-model="planForm.nutrition.dailyCalories" class="form-input" min="0" placeholder="如: 2400" />
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>蛋白质目标 (g)</label>
                  <input type="number" v-model="planForm.nutrition.protein" class="form-input" min="0" placeholder="如: 140" />
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>碳水目标 (g)</label>
                  <input type="number" v-model="planForm.nutrition.carbs" class="form-input" min="0" placeholder="如: 280" />
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>脂肪目标 (g)</label>
                  <input type="number" v-model="planForm.nutrition.fat" class="form-input" min="0" placeholder="如: 80" />
                </div>
              </div>

              <label>膳食与补剂指南 tips</label>
              <div v-for="(tip, tIdx) in planForm.nutrition.tips" :key="'tip_'+tIdx" style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                <input type="text" v-model="planForm.nutrition.tips[tIdx]" class="form-input" style="flex-grow: 1; margin-right: 0.5rem;" placeholder="如: 建议按每公斤体重 2.0 克摄入蛋白质，首选蛋类、牛肉等" />
                <button type="button" class="btn btn-danger" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" @click="removeNutritionTip(tIdx)">删除</button>
              </div>
              <button type="button" class="btn btn-secondary" style="font-size: 0.8rem; margin-bottom: 1.5rem;" @click="addNutritionTip">
                ➕ 添加膳食指南建议
              </button>
            </div>

            <!-- ==================== 训练日动作编排区 ==================== -->
            <div class="form-group full-width mt-4" style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
              <h3 class="mb-4">📅 训练日编排 & 动作流配置</h3>
              
              <div v-for="(day, dIdx) in planDaysForm" :key="day._id" class="day-builder-card">
                <div class="day-builder-header">
                  <div style="display: flex; gap: 1rem; align-items: center; flex-grow: 1;">
                    <span class="badge badge-primary">DAY {{ day.day_index }}</span>
                    <input 
                      type="text" 
                      v-model="day.name" 
                      class="form-input" 
                      style="width: 200px; font-weight: 700; height: 35px; padding: 0.25rem 0.5rem;"
                      placeholder="如: 胸肩三头训练日"
                    />
                    <input 
                      type="text" 
                      v-model="day.focus" 
                      class="form-input" 
                      style="width: 150px; font-size: 0.85rem; height: 35px; padding: 0.25rem 0.5rem;"
                      placeholder="训练侧重点(如: 推力容量)"
                    />
                  </div>
                </div>

                <!-- 目标肌群选择器 (改造成可多选的药丸标签) -->
                <div class="day-muscles-selector">
                  <span class="label-text">目标肌群 (可多选):</span>
                  <div class="muscle-pills-list">
                    <span 
                      v-for="m in musclesList" 
                      :key="m._id" 
                      class="muscle-pill"
                      :class="{ active: (day.target_muscles || []).includes(m._id) }"
                      @click="toggleMuscleSelection(day, m._id)"
                    >
                      {{ m.name }}
                    </span>
                  </div>
                </div>

                <!-- 编排的动作列表 (支持拖拽排序) -->
                <div class="day-exercises-list">
                  <draggable 
                    v-model="day.exercises" 
                    item-key="_id" 
                    handle=".drag-handle" 
                    @end="resortExercises(day)"
                    ghost-class="ghost-drag-item"
                  >
                    <template #item="{ element: ex, index: exIdx }">
                      <div class="day-exercise-row">
                        <!-- 拖拽手柄 -->
                        <div class="drag-handle" title="按住拖拽排序">☰</div>
                        
                        <div class="day-exercise-order">{{ exIdx + 1 }}</div>
                        
                        <!-- 级联动作选择器 (抽屉式面板) + 快速创建 -->
                        <div class="day-exercise-select-wrapper">
                          <div class="custom-cascader" :class="{ active: activeCascaderRowId === ex._id }">
                            <!-- 触发器：显示当前选中的动作名称 -->
                            <div class="cascader-trigger" @click.stop="toggleCascader(ex._id)">
                              <span class="cascader-value" :class="{ empty: !ex.exercise_id }">
                                {{ getExerciseName(ex.exercise_id) || '-- 选择动作 --' }}
                              </span>
                              <span class="cascader-arrow">▼</span>
                            </div>

                            <!-- 级联下拉面板 -->
                            <div v-if="activeCascaderRowId === ex._id" class="cascader-panel">
                              <!-- 左列：肌群列表 -->
                              <div class="cascader-menu">
                                <div 
                                  class="cascader-item" 
                                  :class="{ active: ex.temp_muscle_id === '' }"
                                  @click.stop="ex.temp_muscle_id = '';"
                                  @mouseenter="ex.temp_muscle_id = ''"
                                >
                                  全部肌群
                                </div>
                                <div 
                                  v-for="m in musclesList" 
                                  :key="m._id"
                                  class="cascader-item"
                                  :class="{ active: ex.temp_muscle_id === m._id }"
                                  @click.stop="ex.temp_muscle_id = m._id"
                                  @mouseenter="ex.temp_muscle_id = m._id"
                                >
                                  {{ m.name }}
                                </div>
                              </div>

                              <!-- 右列：动作列表 -->
                              <div class="cascader-menu exercises-menu">
                                <div 
                                  v-for="stdEx in exercisesList.filter(s => !ex.temp_muscle_id || (s.primary_muscles && s.primary_muscles.includes(ex.temp_muscle_id)))"
                                  :key="stdEx._id"
                                  class="cascader-item"
                                  :class="{ selected: ex.exercise_id === stdEx._id }"
                                  @click.stop="selectExerciseCascade(ex, stdEx._id)"
                                >
                                  <span class="ex-name">{{ stdEx.name }}</span>
                                  <span class="ex-difficulty" :class="stdEx.difficulty">
                                    {{ stdEx.difficulty === 'advanced' ? '难' : stdEx.difficulty === 'intermediate' ? '中' : '易' }}
                                  </span>
                                </div>
                                <div v-if="!exercisesList.filter(s => !ex.temp_muscle_id || (s.primary_muscles && s.primary_muscles.includes(ex.temp_muscle_id))).length" class="cascader-empty">
                                  ⚠️ 暂无动作
                                </div>
                              </div>
                            </div>
                          </div>

                          <button 
                            type="button" 
                            class="btn btn-secondary quick-add-ex-btn" 
                            title="快速新增标准动作"
                            @click="quickCreateExercise(day, ex)"
                          >
                            ➕
                          </button>
                        </div>

                        <!-- 角色设定 -->
                        <select v-model="ex.role" class="form-input" style="width: 90px; height: 38px; padding: 0.25rem 0.5rem;">
                          <option value="main">主项</option>
                          <option value="assistance">辅助项</option>
                          <option value="isolation">孤立项</option>
                        </select>

                        <!-- 组数 -->
                        <div style="display: flex; align-items: center; gap: 0.25rem;">
                          <input type="number" v-model.number="ex.sets" class="form-input day-exercise-input-small" style="height: 38px;" min="1" placeholder="组数" />
                          <span style="font-size: 0.8rem; color: var(--text-muted);">组</span>
                        </div>

                        <!-- 次数范围 -->
                        <div style="display: flex; align-items: center; gap: 0.25rem;">
                          <input type="text" v-model="ex.reps" class="form-input day-exercise-input-medium" style="height: 38px;" placeholder="次数范围 (如 8-12)" />
                          <span style="font-size: 0.8rem; color: var(--text-muted);">次</span>
                        </div>

                        <!-- 建议 RPE -->
                        <div style="display: flex; align-items: center; gap: 0.25rem;">
                          <input type="text" v-model="ex.rpe" class="form-input day-exercise-input-small" style="height: 38px;" placeholder="RPE" />
                          <span style="font-size: 0.8rem; color: var(--text-muted);">RPE</span>
                        </div>

                        <!-- 休息秒数 -->
                        <div style="display: flex; align-items: center; gap: 0.25rem;">
                          <input type="number" v-model.number="ex.rest_seconds" class="form-input day-exercise-input-medium" style="height: 38px;" min="0" placeholder="休息(秒)" />
                          <span style="font-size: 0.8rem; color: var(--text-muted);">秒</span>
                        </div>

                        <!-- 操作：上移，下移，移除 -->
                        <div class="day-exercise-actions">
                          <button type="button" class="btn btn-secondary" style="padding: 0.25rem 0.5rem;" @click="moveExercise(day, exIdx, 'up')" :disabled="exIdx === 0">▲</button>
                          <button type="button" class="btn btn-secondary" style="padding: 0.25rem 0.5rem;" @click="moveExercise(day, exIdx, 'down')" :disabled="exIdx === day.exercises.length - 1">▼</button>
                          <button type="button" class="btn btn-danger" style="padding: 0.25rem 0.5rem;" @click="removeExerciseFromDay(day, ex._id)">✕</button>
                        </div>
                      </div>
                    </template>
                  </draggable>

                  <div v-if="!day.exercises || !day.exercises.length" style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                    ⚠️ 该训练日暂无动作，请点击下方添加动作！
                  </div>
                </div>

                <button type="button" class="btn btn-secondary mt-2" style="font-size: 0.8rem; width: 100%; border-style: dashed;" @click="addExerciseToDay(day._id)">
                  ➕ 为当天添加动作编排
                </button>
              </div>
            </div>

          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showPlanModal = false">取消</button>
          <button class="btn btn-primary" @click="savePlan" :disabled="isSaving">
            {{ isSaving ? '计划保存中...' : '保存计划模板' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* 可以在此编写少量 App 组件专属的细微微调 */
</style>
