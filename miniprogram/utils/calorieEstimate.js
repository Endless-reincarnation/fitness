const CALORIE_FORMULA_VERSION = 'strength_met_density_v1';
const BASE_STRENGTH_MET = 4.5;
const MIN_CALORIE_DURATION_SECONDS = 3 * 60;
const MAX_CALORIE_DURATION_SECONDS = 4 * 60 * 60;

function toTimestamp(value, fallback) {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;

  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return parsed;

  return fallback;
}

function getDensityInfo(completedSetCount, durationSeconds) {
  const durationMinutes = Math.max(Number(durationSeconds || 0) / 60, 1);
  const setsPerMinute = Number(completedSetCount || 0) / durationMinutes;

  if (setsPerMinute < 0.15) {
    return {
      densityLevel: 'low',
      densityLabel: '低',
      densityFactor: 0.85,
      setsPerMinute
    };
  }

  if (setsPerMinute > 0.35) {
    return {
      densityLevel: 'high',
      densityLabel: '高',
      densityFactor: 1.15,
      setsPerMinute
    };
  }

  return {
    densityLevel: 'normal',
    densityLabel: '常规',
    densityFactor: 1,
    setsPerMinute
  };
}

function formatDuration(durationSeconds) {
  const safeSeconds = Math.max(Number(durationSeconds || 0), 0);
  const totalMinutes = Math.max(Math.round(safeSeconds / 60), 1);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours && minutes) return `${hours}小时${minutes}分钟`;
  if (hours) return `${hours}小时`;
  return `${minutes}分钟`;
}

function getLatestBodyWeightKg(weights) {
  const latest = (weights || []).find((item) => Number(item && item.weightKg) > 0);
  return latest ? Number(latest.weightKg) : null;
}

function buildCalorieTrend(history, limit = 7) {
  const calorieSessions = (history || [])
    .filter((session) => Number(session.estimatedCalories || 0) > 0)
    .slice(0, limit)
    .reverse();
  const maxCalories = calorieSessions.reduce((max, session) => (
    Math.max(max, Number(session.estimatedCalories || 0))
  ), 0);

  return calorieSessions.map((session) => {
    const date = new Date(session.completedAt);
    const dateText = Number.isNaN(date.getTime())
      ? ''
      : `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const calories = Math.round(Number(session.estimatedCalories || 0));
    const height = maxCalories ? Math.max(36, Math.round((calories / maxCalories) * 132)) : 36;

    return {
      id: session.id,
      dateText,
      calories,
      height
    };
  });
}

function buildWorkoutEstimate({ startedAt, endedAt, completedSetCount, bodyWeightKg }) {
  const fallbackEndTime = Date.now();
  const endTime = toTimestamp(endedAt, fallbackEndTime);
  const startTime = toTimestamp(startedAt, endTime);
  const durationSeconds = Math.max(Math.round((endTime - startTime) / 1000), 0);
  const cappedDurationSeconds = Math.min(durationSeconds, MAX_CALORIE_DURATION_SECONDS);
  const durationText = formatDuration(durationSeconds);
  const durationCapped = durationSeconds > MAX_CALORIE_DURATION_SECONDS;
  const density = getDensityInfo(completedSetCount, cappedDurationSeconds || durationSeconds);
  const weight = Number(bodyWeightKg || 0);

  // 热量估算不阻塞训练完成，缺体重或时长过短时只返回提示。
  if (!weight) {
    return {
      durationSeconds,
      durationText,
      completedSetCount: Number(completedSetCount || 0),
      bodyWeightKg: null,
      densityLevel: density.densityLevel,
      densityLabel: density.densityLabel,
      densityFactor: density.densityFactor,
      setsPerMinute: Number(density.setsPerMinute.toFixed(2)),
      estimatedCalories: null,
      calorieHint: '记录体重后可估算热量消耗',
      calorieFormulaVersion: CALORIE_FORMULA_VERSION,
      durationCapped
    };
  }

  if (durationSeconds < MIN_CALORIE_DURATION_SECONDS) {
    return {
      durationSeconds,
      durationText,
      completedSetCount: Number(completedSetCount || 0),
      bodyWeightKg: weight,
      densityLevel: density.densityLevel,
      densityLabel: density.densityLabel,
      densityFactor: density.densityFactor,
      setsPerMinute: Number(density.setsPerMinute.toFixed(2)),
      estimatedCalories: null,
      calorieHint: '训练时长较短，暂不估算热量',
      calorieFormulaVersion: CALORIE_FORMULA_VERSION,
      durationCapped
    };
  }

  const hours = cappedDurationSeconds / 3600;
  const estimatedCalories = Math.round(BASE_STRENGTH_MET * weight * hours * density.densityFactor);
  const calorieHint = durationCapped
    ? '训练时长偏长，热量按4小时封顶估算，仅供参考'
    : '基于体重、训练时长和训练密度估算，仅供参考';

  return {
    durationSeconds,
    durationText,
    completedSetCount: Number(completedSetCount || 0),
    bodyWeightKg: weight,
    densityLevel: density.densityLevel,
    densityLabel: density.densityLabel,
    densityFactor: density.densityFactor,
    setsPerMinute: Number(density.setsPerMinute.toFixed(2)),
    estimatedCalories,
    calorieHint,
    calorieFormulaVersion: CALORIE_FORMULA_VERSION,
    durationCapped
  };
}

module.exports = {
  CALORIE_FORMULA_VERSION,
  buildCalorieTrend,
  buildWorkoutEstimate,
  formatDuration,
  getLatestBodyWeightKg
};
