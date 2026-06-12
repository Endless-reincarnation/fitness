function estimateOneRepMax(weightKg, reps) {
  const weight = Number(weightKg || 0);
  const repCount = Math.min(Number(reps || 0), 12);
  if (!weight || !repCount) return 0;
  return weight * (1 + repCount / 30);
}

function roundTrainingWeight(weightKg) {
  const weight = Math.max(0, Number(weightKg || 0));
  return Math.round(weight * 2) / 2;
}

function getSuggestedNextWeight(weightKg, role) {
  const weight = Number(weightKg || 0);
  if (!weight) return 0;
  const rate = role === 'main' ? 0.035 : 0.025;
  return roundTrainingWeight(weight * (1 + rate));
}

function getRepRange(repsText) {
  const matches = String(repsText || '').match(/\d+/g) || [];
  const min = Number(matches[0] || 0);
  const max = Number(matches[matches.length - 1] || min || 0);
  return { min, max };
}

function buildExerciseSetStats(exerciseRecords, range) {
  const plannedSets = Number(exerciseRecords[0].plannedSets || exerciseRecords.length || 1);
  const repsList = exerciseRecords.map((item) => Number(item.reps || 0));
  const weightedRecords = exerciseRecords.filter((item) => Number(item.weightKg || 0) > 0);
  const bestRecord = weightedRecords
    .slice()
    .sort((a, b) => estimateOneRepMax(b.weightKg, b.reps) - estimateOneRepMax(a.weightKg, a.reps))[0] || null;
  const bestWeight = bestRecord ? Number(bestRecord.weightKg || 0) : 0;
  const avgReps = repsList.length
    ? repsList.reduce((sum, reps) => sum + reps, 0) / repsList.length
    : 0;
  const minTarget = range.min || range.max || 1;
  const maxTarget = range.max || range.min || 1;

  // 双进阶：先完成次数区间，再递进重量；低于下限时优先恢复动作质量。
  return {
    hasWeight: weightedRecords.length > 0,
    bestWeight,
    avgReps,
    avgRepsText: avgReps ? avgReps.toFixed(1) : '0',
    minTarget,
    maxTarget,
    setCompletionRate: Math.min(1, exerciseRecords.length / plannedSets),
    completionPercent: Math.round(Math.min(1, exerciseRecords.length / plannedSets) * 100),
    allHitTopReps: maxTarget > 0 && repsList.length > 0 && repsList.every((reps) => reps >= maxTarget),
    lowRepSetCount: repsList.filter((reps) => reps < minTarget).length
  };
}

function buildProgressionSuggestions(records) {
  const groups = {};
  records.forEach((record) => {
    if (!groups[record.exerciseId]) {
      groups[record.exerciseId] = [];
    }
    groups[record.exerciseId].push(record);
  });

  return Object.keys(groups).map((exerciseId) => {
    const exerciseRecords = groups[exerciseId];
    const first = exerciseRecords[0];
    const range = getRepRange(first.targetReps);
    const stats = buildExerciseSetStats(exerciseRecords, range);
    const nextWeight = getSuggestedNextWeight(stats.bestWeight, first.role);
    let advice = `${first.exerciseName}：下次维持 ${stats.bestWeight || 0}kg，目标先把各组稳定推进到 ${stats.maxTarget} 次。`;
    let action = 'hold';
    let actionLabel = '维持重量';
    let reason = `平均 ${stats.avgRepsText} 次，尚未稳定达到 ${stats.maxTarget} 次上限。`;
    let targetText = `${stats.bestWeight || 0}kg · 每组 ${stats.minTarget}-${stats.maxTarget} 次`;

    if (!stats.hasWeight) {
      action = 'track_weight';
      actionLabel = '先稳次数';
      reason = '本次没有外部重量记录，暂不适合判断加重。';
      targetText = `每组 ${stats.minTarget}-${stats.maxTarget} 次`;
      advice = `${first.exerciseName}：本次没有外部重量记录，下次先把每组做到 ${stats.minTarget}-${stats.maxTarget} 次；若是可负重动作，再记录重量便于判断递进。`;
    } else if (stats.allHitTopReps && stats.setCompletionRate >= 0.9) {
      action = 'increase';
      actionLabel = '小幅加重';
      reason = `全部有效组达到 ${stats.maxTarget} 次上限，完成度 ${stats.completionPercent}%。`;
      targetText = `${nextWeight}kg · 先守住 ${stats.minTarget} 次下限`;
      advice = `${first.exerciseName}：所有有效组都达到 ${stats.maxTarget} 次上限，下次可尝试 ${nextWeight}kg；如果首组低于 ${stats.minTarget} 次，立即回到本次重量。`;
    } else if (stats.setCompletionRate >= 0.9 && stats.avgReps >= stats.maxTarget - 1 && stats.lowRepSetCount === 0) {
      action = 'add_reps';
      actionLabel = '先加次数';
      reason = `已接近次数上限，但还没有全组达到 ${stats.maxTarget} 次。`;
      targetText = `${stats.bestWeight}kg · 每组多 1 次`;
      advice = `${first.exerciseName}：先不急加重，下次维持 ${stats.bestWeight}kg，争取每组再多 1 次，全部到 ${stats.maxTarget} 次后再加重。`;
    } else if (stats.lowRepSetCount > 0 || stats.setCompletionRate < 0.75) {
      const reducedWeight = roundTrainingWeight(stats.bestWeight * 0.95);
      action = 'reduce';
      actionLabel = '恢复下限';
      reason = stats.lowRepSetCount > 0
        ? `${stats.lowRepSetCount} 组低于 ${stats.minTarget} 次下限。`
        : `完成组数只有计划的 ${stats.completionPercent}%。`;
      targetText = `${reducedWeight}kg 左右 · 先回到 ${stats.minTarget} 次以上`;
      advice = `${first.exerciseName}：有组数低于 ${stats.minTarget} 次，下次建议降到约 ${reducedWeight}kg 或延长休息，先把动作质量和目标下限找回来。`;
    }

    return {
      exerciseId,
      exerciseName: first.exerciseName,
      action,
      actionLabel,
      reason,
      targetText,
      nextWeightKg: action === 'increase' ? nextWeight : stats.bestWeight,
      advice
    };
  });
}

function buildWeeklyInsight(history, targetDays = 4) {
  const now = new Date();
  const day = now.getDay();
  const offset = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const weekSessions = history.filter((session) => {
    const completedAt = new Date(session.completedAt);
    return completedAt >= weekStart && completedAt < weekEnd;
  });
  const totalSets = weekSessions.reduce((sum, session) => sum + Number(session.setCount || 0), 0);
  const totalVolume = weekSessions.reduce((sum, session) => sum + Number(session.totalVolume || 0), 0);
  const activeDays = {};
  weekSessions.forEach((session) => {
    const d = new Date(session.completedAt);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    activeDays[key] = true;
  });
  const completedDays = Object.keys(activeDays).length;
  let insightText = '本周还没有训练记录，完成一次训练后这里会出现周进度。';
  if (completedDays >= targetDays) {
    insightText = '本周训练频率很稳，注意睡眠和恢复质量。';
  } else if (completedDays >= Math.max(2, targetDays - 1)) {
    insightText = '本周节奏不错，再完成一次会更接近计划闭环。';
  } else if (completedDays === 1) {
    insightText = '本周已经开始，下一次训练会让计划连续性更强。';
  }

  return {
    completedDays,
    targetDays,
    progressPercent: Math.min(100, Math.round((completedDays / targetDays) * 100)),
    totalSets,
    totalVolume,
    insightText
  };
}

function buildExerciseProgressList(history) {
  const sessionsByExercise = {};
  history.forEach((session) => {
    const sessionExerciseMap = {};
    (session.records || []).forEach((record) => {
      const score = Number(record.weightKg || 0) * Number(record.reps || 0);
      const current = sessionExerciseMap[record.exerciseId];
      if (!current || score > current.score) {
        sessionExerciseMap[record.exerciseId] = {
          exerciseId: record.exerciseId,
          exerciseName: record.exerciseName,
          weightKg: Number(record.weightKg || 0),
          reps: Number(record.reps || 0),
          score
        };
      }
    });

    Object.keys(sessionExerciseMap).forEach((exerciseId) => {
      if (!sessionsByExercise[exerciseId]) {
        sessionsByExercise[exerciseId] = [];
      }
      sessionsByExercise[exerciseId].push({
        ...sessionExerciseMap[exerciseId],
        completedAt: session.completedAt
      });
    });
  });

  return Object.keys(sessionsByExercise).map((exerciseId) => {
    const records = sessionsByExercise[exerciseId]
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    const latest = records[0];
    const previous = records[1] || null;
    const delta = previous ? latest.score - previous.score : latest.score;
    let trendText = previous ? '保持观察' : '首次记录';
    if (previous && delta > 0) trendText = `单组表现 +${delta}kg`;
    if (previous && delta < 0) trendText = `单组表现 ${delta}kg`;

    return {
      exerciseId,
      exerciseName: latest.exerciseName,
      latestText: `${latest.weightKg || 0}kg × ${latest.reps || 0} 次`,
      previousText: previous ? `${previous.weightKg || 0}kg × ${previous.reps || 0} 次` : '暂无上次',
      delta,
      trendText,
      isUp: delta > 0,
      isDown: delta < 0
    };
  })
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);
}

function formatDate(dateText) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildExercisePerformance(exerciseId, history) {
  const matchedSessions = [];
  history.forEach((session) => {
    const records = (session.records || []).filter((record) => record.exerciseId === exerciseId);
    if (!records.length) return;
    const bestSet = records
      .slice()
      .sort((a, b) => estimateOneRepMax(b.weightKg, b.reps) - estimateOneRepMax(a.weightKg, a.reps))[0];
    matchedSessions.push({
      completedAt: session.completedAt,
      planName: session.planName,
      dayName: session.dayName,
      bestSet,
      setCount: records.length,
      volume: records.reduce((sum, record) => sum + Number(record.weightKg || 0) * Number(record.reps || 0), 0),
      suggestion: (session.suggestions || []).find((item) => item.exerciseId === exerciseId) || null
    });
  });

  if (!matchedSessions.length) return null;

  const sortedSessions = matchedSessions.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  const latest = sortedSessions[0];
  const allSets = matchedSessions.reduce((list, session) => list.concat(session.bestSet), []);
  const bestWeight = Math.max(...allSets.map((set) => Number(set.weightKg || 0)));
  const bestReps = Math.max(...allSets.map((set) => Number(set.reps || 0)));
  const bestStrengthSet = allSets
    .slice()
    .sort((a, b) => estimateOneRepMax(b.weightKg, b.reps) - estimateOneRepMax(a.weightKg, a.reps))[0];

  // 动作详情只展示用户容易理解的摘要，不展开每组明细。
  return {
    sessionCount: matchedSessions.length,
    latestDate: formatDate(latest.completedAt),
    latestText: `${latest.bestSet.weightKg || 0}kg × ${latest.bestSet.reps || 0} 次`,
    latestVolume: latest.volume,
    bestWeight,
    bestReps,
    estimatedMax: Math.round(estimateOneRepMax(bestStrengthSet.weightKg, bestStrengthSet.reps) * 10) / 10,
    suggestion: latest.suggestion
  };
}

module.exports = {
  buildExercisePerformance,
  buildExerciseProgressList,
  buildProgressionSuggestions,
  buildWeeklyInsight,
  estimateOneRepMax,
  getSuggestedNextWeight,
  roundTrainingWeight
};
