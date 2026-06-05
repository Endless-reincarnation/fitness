const workoutStore = require('../utils/workout');
const { getCollection, isCloudEnabled } = require('./cloudService');

function toCloudSession(session) {
  return {
    _id: session.id,
    plan_name: session.planName,
    day_name: session.dayName,
    plan_day_index: session.planDayIndex,
    completed_at: session.completedAt,
    set_count: session.setCount,
    total_volume: session.totalVolume,
    suggestions: session.suggestions || [],
    status: 'completed',
    created_at: session.completedAt,
    updated_at: new Date().toISOString()
  };
}

function toCloudSet(session, record) {
  return {
    session_id: session.id,
    exercise_id: record.exerciseId,
    exercise_snapshot: {
      name: record.exerciseName,
      role: record.role,
      target_reps: record.targetReps,
      progression_rule: record.progressionRule
    },
    set_index: record.setIndex,
    target_reps: record.targetReps,
    weight_kg: record.weightKg,
    reps: record.reps,
    rpe: record.rpe,
    rest_seconds: record.restSeconds,
    is_completed: true,
    created_at: session.completedAt,
    updated_at: new Date().toISOString()
  };
}

function fromCloudSession(record) {
  return {
    id: record._id,
    planName: record.plan_name,
    dayName: record.day_name,
    planDayIndex: record.plan_day_index,
    completedAt: record.completed_at,
    setCount: record.set_count,
    totalVolume: record.total_volume,
    suggestions: record.suggestions || [],
    records: record.records || []
  };
}

function toCloudWeight(record) {
  return {
    recorded_date: record.date,
    weight_kg: record.weightKg,
    note: record.note || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function fromCloudWeight(record) {
  return {
    id: record._id,
    date: record.recorded_date,
    weightKg: record.weight_kg,
    note: record.note || ''
  };
}

async function getWorkoutHistory() {
  if (!isCloudEnabled()) return workoutStore.getWorkoutHistory();

  try {
    const collection = getCollection('workoutSessions');
    const result = await collection.orderBy('completed_at', 'desc').limit(50).get();
    if (!result.data.length) return workoutStore.getWorkoutHistory();
    return result.data.map(fromCloudSession);
  } catch (error) {
    console.warn('读取云端训练历史失败，已回落本地数据', error);
    return workoutStore.getWorkoutHistory();
  }
}

async function saveWorkoutSession(session) {
  // 训练完成先落本地，避免网络异常导致用户刚练完的数据丢失。
  workoutStore.saveWorkoutSession(session);

  if (!isCloudEnabled()) return session;

  try {
    const sessionCollection = getCollection('workoutSessions');
    const setCollection = getCollection('workoutSets');
    await sessionCollection.add({ data: toCloudSession(session) });
    await Promise.all((session.records || []).map((record) => (
      setCollection.add({ data: toCloudSet(session, record) })
    )));
    return session;
  } catch (error) {
    console.warn('写入云端训练记录失败，已保留本地记录', error);
    return session;
  }
}

async function getBodyWeights() {
  if (!isCloudEnabled()) return workoutStore.getBodyWeights();

  try {
    const collection = getCollection('bodyWeights');
    const result = await collection.orderBy('recorded_date', 'desc').limit(100).get();
    if (!result.data.length) return workoutStore.getBodyWeights();
    return result.data.map(fromCloudWeight);
  } catch (error) {
    console.warn('读取云端体重记录失败，已回落本地数据', error);
    return workoutStore.getBodyWeights();
  }
}

async function saveBodyWeight(record) {
  workoutStore.saveBodyWeight(record);

  if (!isCloudEnabled()) return record;

  try {
    const collection = getCollection('bodyWeights');
    await collection.doc(record.id).set({ data: toCloudWeight(record) });
    return record;
  } catch (error) {
    console.warn('写入云端体重记录失败，已保留本地记录', error);
    return record;
  }
}

module.exports = {
  ...workoutStore,
  getWorkoutHistory,
  saveWorkoutSession,
  getBodyWeights,
  saveBodyWeight
};
