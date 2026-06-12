const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];

const scheduleTemplates = {
  1: [
    { weekday: 1, type: 'training', order: 0 },
    { weekday: 2, type: 'rest' },
    { weekday: 3, type: 'rest' },
    { weekday: 4, type: 'rest' },
    { weekday: 5, type: 'rest' },
    { weekday: 6, type: 'flex' },
    { weekday: 0, type: 'rest' }
  ],
  2: [
    { weekday: 1, type: 'training', order: 0 },
    { weekday: 2, type: 'rest' },
    { weekday: 3, type: 'rest' },
    { weekday: 4, type: 'training', order: 1 },
    { weekday: 5, type: 'rest' },
    { weekday: 6, type: 'flex' },
    { weekday: 0, type: 'rest' }
  ],
  3: [
    { weekday: 1, type: 'training', order: 0 },
    { weekday: 2, type: 'rest' },
    { weekday: 3, type: 'training', order: 1 },
    { weekday: 4, type: 'rest' },
    { weekday: 5, type: 'training', order: 2 },
    { weekday: 6, type: 'rest' },
    { weekday: 0, type: 'flex' }
  ],
  4: [
    { weekday: 1, type: 'training', order: 0 },
    { weekday: 2, type: 'training', order: 1 },
    { weekday: 3, type: 'rest' },
    { weekday: 4, type: 'training', order: 2 },
    { weekday: 5, type: 'training', order: 3 },
    { weekday: 6, type: 'rest' },
    { weekday: 0, type: 'flex' }
  ],
  5: [
    { weekday: 1, type: 'training', order: 0 },
    { weekday: 2, type: 'training', order: 1 },
    { weekday: 3, type: 'training', order: 2 },
    { weekday: 4, type: 'rest' },
    { weekday: 5, type: 'training', order: 3 },
    { weekday: 6, type: 'training', order: 4 },
    { weekday: 0, type: 'rest' }
  ],
  6: [
    { weekday: 1, type: 'training', order: 0 },
    { weekday: 2, type: 'training', order: 1 },
    { weekday: 3, type: 'training', order: 2 },
    { weekday: 4, type: 'training', order: 3 },
    { weekday: 5, type: 'training', order: 4 },
    { weekday: 6, type: 'training', order: 5 },
    { weekday: 0, type: 'rest' }
  ],
  7: [
    { weekday: 1, type: 'training', order: 0 },
    { weekday: 2, type: 'training', order: 1 },
    { weekday: 3, type: 'training', order: 2 },
    { weekday: 4, type: 'training', order: 3 },
    { weekday: 5, type: 'training', order: 4 },
    { weekday: 6, type: 'training', order: 5 },
    { weekday: 0, type: 'training', order: 6 }
  ]
};

function getWeeklyTargetDays(plan, activePlan) {
  const fromPlan = Number(plan && plan.weeklyFrequency);
  const fromActivePlan = Number(activePlan && activePlan.totalDays);
  const fromDays = Number(plan && plan.days && plan.days.length);
  const targetDays = fromPlan || fromActivePlan || fromDays || 4;
  return Math.max(1, Math.min(7, Math.round(targetDays)));
}

function getWeekStart(baseDate) {
  const current = new Date(baseDate);
  const day = current.getDay();
  const offset = day === 0 ? 6 : day - 1;
  return new Date(current.getFullYear(), current.getMonth(), current.getDate() - offset);
}

function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWeekWorkoutMap(history, baseDate) {
  const weekStart = getWeekStart(baseDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const workoutMap = {};
  const weekSessions = [];

  history.forEach((session) => {
    if (!session.completedAt) return;
    const completedAt = new Date(session.completedAt);
    if (completedAt < weekStart || completedAt >= weekEnd) return;
    const key = getDateKey(completedAt);
    workoutMap[key] = (workoutMap[key] || 0) + 1;
    weekSessions.push(session);
  });

  return {
    workoutMap,
    weekSessions,
    completedDays: Object.keys(workoutMap).length
  };
}

function normalizeScheduleOverrides(overrides) {
  if (!overrides) return {};
  if (Array.isArray(overrides)) {
    return overrides.reduce((map, item) => {
      if (item && item.weekday !== undefined && item.type) {
        map[item.weekday] = item.type;
      }
      return map;
    }, {});
  }
  return overrides;
}

function applyScheduleOverrides(template, overrides) {
  const overrideMap = normalizeScheduleOverrides(overrides);
  let trainingOrder = 0;
  return template.map((item) => {
    const overrideType = overrideMap[item.weekday];
    const type = ['training', 'rest', 'flex'].indexOf(overrideType) !== -1 ? overrideType : item.type;
    const nextItem = {
      weekday: item.weekday,
      type
    };
    if (type === 'training') {
      nextItem.order = trainingOrder;
      trainingOrder += 1;
    }
    return nextItem;
  });
}

function buildWeeklySchedule(plan, activePlan, history = [], baseDate = new Date(), overrides = null) {
  const targetDays = getWeeklyTargetDays(plan, activePlan);
  const template = applyScheduleOverrides(scheduleTemplates[targetDays] || scheduleTemplates[4], overrides);
  const days = plan && Array.isArray(plan.days) ? plan.days : [];
  const today = new Date(baseDate);
  const todayKey = getDateKey(today);
  const weekStart = getWeekStart(today);
  const { workoutMap } = getWeekWorkoutMap(history, today);

  return template.map((item, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const dateKey = getDateKey(date);
    const dayIndex = item.type === 'training' && days.length
      ? Number(item.order || 0) % days.length
      : null;
    const planDay = dayIndex !== null ? days[dayIndex] : null;
    const label = item.type === 'training'
      ? ((planDay && planDay.name) || `训练日 ${Number(item.order || 0) + 1}`)
      : (item.type === 'flex' ? '灵活' : '休息');

    return {
      weekday: item.weekday,
      weekdayLabel: weekdayLabels[item.weekday],
      type: item.type,
      dayIndex,
      label,
      dateKey,
      isToday: dateKey === todayKey,
      isCompleted: Boolean(workoutMap[dateKey])
    };
  });
}

function getHoursSinceLastWorkout(history, baseDate = new Date()) {
  if (!history.length || !history[0].completedAt) return null;
  const latest = new Date(history[0].completedAt);
  const now = new Date(baseDate);
  const hours = (now.getTime() - latest.getTime()) / (1000 * 60 * 60);
  return Math.max(0, Math.round(hours * 10) / 10);
}

function buildNutritionFocus(type) {
  if (type === 'training') {
    return {
      dayType: 'training',
      title: '训练日',
      text: '蛋白保持，碳水正常或略高；训练前后优先补充碳水和优质蛋白。'
    };
  }
  if (type === 'rest') {
    return {
      dayType: 'rest',
      title: '休息日',
      text: '蛋白不降，碳水略收；蔬菜、饮水和睡眠优先，帮助恢复。'
    };
  }
  return {
    dayType: 'optional',
    title: '灵活日',
    text: '如果训练按训练日吃；如果休息，晚餐碳水可适当减少，蛋白照常。'
  };
}

function buildTodayAdvice(options = {}) {
  const plan = options.plan;
  const activePlan = options.activePlan;
  const history = options.history || [];
  const baseDate = options.baseDate || new Date();
  const weeklySchedule = options.weeklySchedule || buildWeeklySchedule(plan, activePlan, history, baseDate, options.scheduleOverrides);
  const todayItem = weeklySchedule.find((item) => item.isToday) || null;
  const { completedDays } = getWeekWorkoutMap(history, baseDate);
  const targetDays = getWeeklyTargetDays(plan, activePlan);
  const remainingDays = Math.max(targetDays - completedDays, 0);
  const progressPercent = Math.min(100, Math.round((completedDays / targetDays) * 100));
  const hoursSinceLastWorkout = getHoursSinceLastWorkout(history, baseDate);
  const days = plan && Array.isArray(plan.days) ? plan.days : [];
  const currentDayIndex = Number(activePlan && activePlan.currentDayIndex || 0);
  const nextDay = days[currentDayIndex] || days[0] || null;
  let type = todayItem ? todayItem.type : 'training';
  let title = type === 'training' ? '建议训练' : (type === 'rest' ? '建议休息' : '可灵活安排');
  let reason = '按本周节奏安排今天的训练与恢复。';

  if (!history.length) {
    type = 'training';
    title = '建议训练';
    reason = '还没有训练记录，可以从第 1 天开始建立节奏。';
  } else if (hoursSinceLastWorkout !== null && hoursSinceLastWorkout < 20) {
    type = 'rest';
    title = '建议休息';
    reason = `距离上次训练约 ${hoursSinceLastWorkout} 小时，今天优先恢复。`;
  } else if (completedDays >= targetDays) {
    type = 'rest';
    title = '建议休息';
    reason = `本周已完成 ${completedDays}/${targetDays} 次，目标达成后优先恢复。`;
  } else if (todayItem && todayItem.type === 'training') {
    type = hoursSinceLastWorkout === null || hoursSinceLastWorkout >= 24 ? 'training' : 'optional';
    title = type === 'training' ? '建议训练' : '可灵活安排';
    reason = type === 'training'
      ? `本周已完成 ${completedDays}/${targetDays} 次，今天可以推进下一训练日。`
      : '恢复时间接近达标，如果状态好可以训练，否则明天补上。';
  } else if (todayItem && todayItem.type === 'rest') {
    type = completedDays < targetDays && hoursSinceLastWorkout >= 24 ? 'optional' : 'rest';
    title = type === 'optional' ? '可补练' : '建议休息';
    reason = type === 'optional'
      ? `今天原本是休息位，但本周还差 ${targetDays - completedDays} 次，可按状态补练。`
      : '今天是计划休息位，恢复质量会影响下一次训练表现。';
  } else {
    type = completedDays < targetDays ? 'optional' : 'rest';
    title = type === 'optional' ? '可灵活安排' : '建议休息';
    reason = type === 'optional'
      ? `本周还差 ${targetDays - completedDays} 次，今天可训练也可休息。`
      : `本周已完成 ${completedDays}/${targetDays} 次，今天恢复优先。`;
  }

  return {
    type,
    title,
    reason,
    targetDays,
    completedDays,
    remainingDays,
    progressPercent,
    nextDayName: nextDay ? nextDay.name : '',
    todayScheduleLabel: todayItem ? todayItem.label : '',
    hoursSinceLastWorkout,
    nutritionFocus: buildNutritionFocus(type)
  };
}

function buildExecutionInsight(options = {}) {
  const weeklySchedule = buildWeeklySchedule(
    options.plan,
    options.activePlan,
    options.history || [],
    options.baseDate || new Date(),
    options.scheduleOverrides || null
  );
  return {
    weeklySchedule,
    todayAdvice: buildTodayAdvice({
      ...options,
      weeklySchedule
    })
  };
}

module.exports = {
  applyScheduleOverrides,
  buildExecutionInsight,
  buildNutritionFocus,
  buildTodayAdvice,
  buildWeeklySchedule,
  getWeeklyTargetDays
};
