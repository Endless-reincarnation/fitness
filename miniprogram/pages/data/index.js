const { getBodyWeights, getWorkoutHistory, saveBodyWeight, syncPendingCloudWrites } = require('../../services/workoutService');
const { getUserProfile } = require('../../services/userService');
const { listExercises } = require('../../services/exerciseService');
const { getActivePlanDetail } = require('../../services/planService');
const { applyTheme } = require('../../utils/theme');
const { buildCalorieTrend, formatDuration } = require('../../utils/calorieEstimate');
const { buildExerciseProgressList, buildWeeklyInsight } = require('../../utils/trainingInsight');

Page({
  data: {
    history: [],
    weights: [],
    weightKg: '',
    latestSession: null,
    latestSetCount: 0,
    latestTotalVolume: 0,
    latestDurationText: '',
    latestCaloriesText: '--',
    latestDensityLabel: '',
    latestCalorieHint: '',
    nextExerciseName: '',
    nextAdviceText: '',
    latestSuggestions: [],
    weeklyInsight: null,
    calorieTrend: [],
    exerciseProgressList: [],
    theme: 'power-yellow',

    // BMI 与动态柱状图状态
    chartWeights: [],
    heightCm: 0,
    bmi: '',
    bmiText: '',
    bmiCategory: '',
    latestWeightRecord: null,

    // 训练打卡日历状态
    calendarMode: 'week', // 默认周视图，可选 'week' 或 'month'
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    calendarGrid: [],
    selectedDateStr: ''
  },

  onShow() {
    applyTheme(this);
    this.refreshData();
  },

  async refreshData() {
    await syncPendingCloudWrites();
    const history = await getWorkoutHistory();
    const latestSession = history[0] || null;
    const weights = await getBodyWeights();
    const activePlanDetail = await getActivePlanDetail();
    const weeklyTargetDays = this.getWeeklyTargetDays(activePlanDetail);

    // 1. 获取身高 (云端优先，本地缓存 fallback)
    let heightCm = 0;
    try {
      const profile = await getUserProfile();
      if (profile && profile.height_cm) {
        heightCm = profile.height_cm;
        wx.setStorageSync('userProfile', profile);
      } else {
        const cached = wx.getStorageSync('userProfile');
        if (cached && cached.height_cm) {
          heightCm = cached.height_cm;
        }
      }
    } catch (e) {
      console.warn('获取身高数据失败', e);
      const cached = wx.getStorageSync('userProfile');
      if (cached && cached.height_cm) {
        heightCm = cached.height_cm;
      }
    }

    // 2. 构造最近 7 次的体重动态图表数据 (从左至右由远及近，reverse)
    const recentWeights = weights.slice(0, 7).reverse();
    let minWeight = Infinity;
    let maxWeight = -Infinity;
    recentWeights.forEach((item) => {
      if (item.weightKg < minWeight) minWeight = item.weightKg;
      if (item.weightKg > maxWeight) maxWeight = item.weightKg;
    });

    const range = maxWeight - minWeight;
    const chartWeights = recentWeights.map((item) => {
      const dateParts = item.date.split('-');
      const displayDate = dateParts.length >= 3 ? `${dateParts[1]}-${dateParts[2]}` : item.date;
      let height = 80; // 若体重无波动，使用默认高度 80rpx
      if (range > 0) {
        height = 40 + ((item.weightKg - minWeight) / range) * 80;
      }
      return {
        ...item,
        displayDate,
        height: Math.round(height)
      };
    });

    // 3. 计算 BMI
    const latestWeightRecord = weights[0] || null;
    let bmi = '';
    let bmiText = '';
    let bmiCategory = '';

    if (latestWeightRecord && heightCm > 0) {
      const weight = latestWeightRecord.weightKg;
      const heightM = heightCm / 100;
      const bmiVal = weight / (heightM * heightM);
      bmi = bmiVal.toFixed(1);

      if (bmiVal < 18.5) {
        bmiText = '体重偏轻';
        bmiCategory = 'bmi-underweight';
      } else if (bmiVal < 24) {
        bmiText = '正常体重';
        bmiCategory = 'bmi-normal';
      } else if (bmiVal < 28) {
        bmiText = '体重超重';
        bmiCategory = 'bmi-overweight';
      } else {
        bmiText = '肥胖';
        bmiCategory = 'bmi-obese';
      }
    }

    // 4. 初始化默认选中的日期（若当前没有选中日期且有最新训练记录，则默认选中该记录的日期）
    let selectedDateStr = this.data.selectedDateStr;
    let displaySession = null;

    if (!selectedDateStr && latestSession) {
      const d = new Date(latestSession.completedAt);
      selectedDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // 在周视图下，若未选中日期，则自动关联最新一条记录的日期，且将 currentYear 与 currentMonth 动态对齐到该选中日期所在的年月
    let currentYear = this.data.currentYear;
    let currentMonth = this.data.currentMonth;
    
    let activeDateStr = selectedDateStr;
    if (!activeDateStr) {
      const today = new Date();
      activeDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    if (this.data.calendarMode === 'week') {
      const parts = activeDateStr.split('-');
      currentYear = Number(parts[0]);
      currentMonth = Number(parts[1]) - 1;
    }

    if (selectedDateStr) {
      // 检查当前选中的日期对应的训练记录
      const matched = history.find(session => {
        const d = new Date(session.completedAt);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dateKey === selectedDateStr;
      });
      displaySession = matched || null;
    } else {
      displaySession = latestSession;
    }

    // 5. 生成日历网格数据 (传入当前折叠模式)
    const calendarGrid = this.generateCalendar(currentYear, currentMonth, history, selectedDateStr, this.data.calendarMode);
    const displaySuggestions = displaySession && displaySession.suggestions ? displaySession.suggestions : [];
    const weeklyInsight = buildWeeklyInsight(history, weeklyTargetDays);
    const calorieTrend = buildCalorieTrend(history);
    const exerciseProgressList = buildExerciseProgressList(history);

    // 计算肌群刺激得分百分比
    let muscleStimulation = [];
    if (displaySession && displaySession.records && displaySession.records.length > 0) {
      try {
        const exercises = await listExercises();
        const exerciseMap = exercises.reduce((map, ex) => {
          map[ex.id] = ex;
          return map;
        }, {});

        const muscleScores = {};
        displaySession.records.forEach((record) => {
          const ex = exerciseMap[record.exerciseId];
          if (ex) {
            const primary = ex.primaryMuscles || [];
            const secondary = ex.secondaryMuscles || [];
            primary.forEach((m) => {
              if (m && m !== '自定义') {
                muscleScores[m] = (muscleScores[m] || 0) + 1.0;
              }
            });
            secondary.forEach((m) => {
              if (m && m !== '自定义') {
                muscleScores[m] = (muscleScores[m] || 0) + 0.5;
              }
            });
          }
        });

        const totalScore = Object.values(muscleScores).reduce((sum, s) => sum + s, 0);
        if (totalScore > 0) {
          muscleStimulation = Object.keys(muscleScores).map((name) => {
            const score = muscleScores[name];
            const percentage = Math.round((score / totalScore) * 100);
            return {
              name,
              percentage,
              color: getMuscleColor(name)
            };
          }).sort((a, b) => b.percentage - a.percentage).slice(0, 4);
        }
      } catch (err) {
        console.warn('计算肌群刺激数据失败', err);
      }
    }

    this.setData({
      history,
      weights,
      latestSession: displaySession,
      latestSetCount: displaySession ? displaySession.setCount : 0,
      latestTotalVolume: displaySession ? displaySession.totalVolume : 0,
      latestDurationText: displaySession && displaySession.durationSeconds ? formatDuration(displaySession.durationSeconds) : '--',
      latestCaloriesText: displaySession && displaySession.estimatedCalories ? String(displaySession.estimatedCalories) : '--',
      latestDensityLabel: displaySession ? displaySession.densityLabel || '' : '',
      latestCalorieHint: displaySession ? displaySession.calorieHint || '' : '',
      nextExerciseName: displaySession && displaySuggestions[0] ? displaySuggestions[0].exerciseName : '',
      nextAdviceText: displaySession && displaySuggestions[0] ? displaySuggestions[0].advice : '',
      latestSuggestions: displaySuggestions,
      weeklyInsight,
      calorieTrend,
      exerciseProgressList,
      muscleStimulation,
      heightCm,
      chartWeights,
      bmi,
      bmiText,
      bmiCategory,
      latestWeightRecord,
      calendarGrid,
      selectedDateStr,
      currentYear,
      currentMonth
    });
  },

  getWeeklyTargetDays(activePlanDetail) {
    const plan = activePlanDetail && activePlanDetail.plan;
    const activePlan = activePlanDetail && activePlanDetail.activePlan;
    const fromPlan = Number(plan && plan.weeklyFrequency);
    const fromActivePlan = Number(activePlan && activePlan.totalDays);
    const fromDays = Number(plan && plan.days && plan.days.length);

    // 优先使用计划频率；缺失时用训练日数量兜底，避免周进度长期固定为 4 天。
    const targetDays = fromPlan || fromActivePlan || fromDays || 4;
    return Math.max(1, Math.min(7, Math.round(targetDays)));
  },

  generateCalendar(year, month, history, selectedDateStr, calendarMode) {
    // 按日期将训练记录分类映射，支持在本地时间下完成比对
    const workoutDates = {};
    history.forEach((session) => {
      if (session.completedAt) {
        const d = new Date(session.completedAt);
        const yStr = d.getFullYear();
        const mStr = String(d.getMonth() + 1).padStart(2, '0');
        const dStr = String(d.getDate()).padStart(2, '0');
        const dateKey = `${yStr}-${mStr}-${dStr}`;
        if (!workoutDates[dateKey]) {
          workoutDates[dateKey] = [];
        }
        workoutDates[dateKey].push(session);
      }
    });

    const grid = [];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (calendarMode === 'week') {
      // 周视图：以选中日期（或今天）所在的周一为起点生成连续 7 天，不留空白
      let targetDateStr = selectedDateStr;
      if (!targetDateStr) {
        targetDateStr = todayStr;
      }
      const parts = targetDateStr.split('-');
      const targetDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayOfWeek = targetDate.getDay(); // 0 是周日，1-6 是周一到周六
      const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 转换为以周一为首天（偏移 0-6）
      
      const monday = new Date(targetDate);
      monday.setDate(targetDate.getDate() - offset);

      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + i);
        
        const yStr = dayDate.getFullYear();
        const mStr = String(dayDate.getMonth() + 1).padStart(2, '0');
        const dStr = String(dayDate.getDate()).padStart(2, '0');
        const dateKey = `${yStr}-${mStr}-${dStr}`;
        
        const sessions = workoutDates[dateKey] || [];
        const hasWorkout = sessions.length > 0;
        
        grid.push({
          type: 'day',
          day: dayDate.getDate(),
          dateStr: dateKey,
          hasWorkout,
          isToday: dateKey === todayStr,
          isSelected: dateKey === selectedDateStr,
          sessions
        });
      }
    } else {
      // 月视图：原有的空白填充及整月网格生成逻辑
      const firstDayOfWeek = new Date(year, month, 1).getDay();
      const blankCount = (firstDayOfWeek === 0 ? 7 : firstDayOfWeek) - 1;
      const totalDays = new Date(year, month + 1, 0).getDate();
      
      for (let i = 0; i < blankCount; i++) {
        grid.push({ type: 'blank', id: `blank-${i}` });
      }

      for (let day = 1; day <= totalDays; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const sessions = workoutDates[dateKey] || [];
        const hasWorkout = sessions.length > 0;
        
        grid.push({
          type: 'day',
          day,
          dateStr: dateKey,
          hasWorkout,
          isToday: dateKey === todayStr,
          isSelected: dateKey === selectedDateStr,
          sessions
        });
      }
    }

    return grid;
  },

  toggleCalendarMode() {
    wx.vibrateShort({ type: 'light' });
    const newMode = this.data.calendarMode === 'week' ? 'month' : 'week';
    this.setData({
      calendarMode: newMode
    }, () => {
      this.refreshData();
    });
  },

  prevPeriod() {
    wx.vibrateShort({ type: 'light' });
    if (this.data.calendarMode === 'week') {
      // 周模式：选中日期向前推 7 天
      let selectedDateStr = this.data.selectedDateStr;
      if (!selectedDateStr) {
        const today = new Date();
        selectedDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
      const parts = selectedDateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() - 7);
      
      const newSelectedDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      this.setData({
        selectedDateStr: newSelectedDateStr,
        currentYear: d.getFullYear(),
        currentMonth: d.getMonth()
      }, () => {
        this.refreshData();
      });
    } else {
      // 月模式：月份减一
      let { currentYear, currentMonth } = this.data;
      currentMonth -= 1;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear -= 1;
      }
      this.setData({
        currentYear,
        currentMonth
      }, () => {
        this.refreshData();
      });
    }
  },

  nextPeriod() {
    wx.vibrateShort({ type: 'light' });
    if (this.data.calendarMode === 'week') {
      // 周模式：选中日期向后推 7 天
      let selectedDateStr = this.data.selectedDateStr;
      if (!selectedDateStr) {
        const today = new Date();
        selectedDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
      const parts = selectedDateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + 7);
      
      const newSelectedDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      this.setData({
        selectedDateStr: newSelectedDateStr,
        currentYear: d.getFullYear(),
        currentMonth: d.getMonth()
      }, () => {
        this.refreshData();
      });
    } else {
      // 月模式：月份加一
      let { currentYear, currentMonth } = this.data;
      currentMonth += 1;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
      }
      this.setData({
        currentYear,
        currentMonth
      }, () => {
        this.refreshData();
      });
    }
  },

  selectDate(event) {
    const { date } = event.currentTarget.dataset;
    if (!date) return;
    
    wx.vibrateShort({ type: 'light' });
    
    // 更新选中日期并同步修改 currentYear / currentMonth 保证月度状态同步
    const parts = date.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;

    this.setData({
      selectedDateStr: date,
      currentYear: year,
      currentMonth: month
    }, () => {
      this.refreshData();
    });
  },

  goProfile() {
    wx.switchTab({
      url: '/pages/profile/index'
    });
  },

  onWeightInput(event) {
    this.setData({ weightKg: event.detail.value });
  },

  saveWeight() {
    const weightKg = Number(this.data.weightKg);
    if (!weightKg) {
      wx.showToast({ title: '请输入体重', icon: 'none' });
      return;
    }

    const doSave = async () => {
      const today = new Date().toISOString().slice(0, 10);
      await saveBodyWeight({
        id: `weight_${today}`,
        date: today,
        weightKg
      });
      this.setData({ weightKg: '' });
      this.refreshData();
      wx.showToast({ title: '已记录', icon: 'success' });
    };

    // 异常体重需要二次确认，避免误输入污染趋势。
    if (weightKg < 20 || weightKg > 300) {
      wx.showModal({
        title: '确认体重',
        content: '这个体重数值较异常，确认保存吗？',
        success: (res) => {
          if (res.confirm) doSave();
        }
      });
      return;
    }

    doSave();
  }
});

function getMuscleColor(name) {
  const colors = {
    '胸大肌': 'var(--primary)',
    '胸部': 'var(--primary)',
    '背阔肌': '#3b82f6',
    '背部': '#3b82f6',
    '股四头肌': '#ef4444',
    '腿部': '#ef4444',
    '臀大肌': '#f97316',
    '三角肌': '#10b981',
    '三角肌前束': '#10b981',
    '三角肌中束': '#059669',
    '三角肌后束': '#047857',
    '肱二头肌': '#8b5cf6',
    '肱三头肌': '#a78bfa',
    '核心肌群': '#ec4899',
    '腹部': '#ec4899'
  };
  return colors[name] || 'var(--primary)';
}
