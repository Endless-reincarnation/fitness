const workoutStore = require('../utils/workout');
const { getCollection, isCloudEnabled } = require('./cloudService');

const syncQueueKey = 'cloudSyncQueue';

function toCloudSession(session) {
  return {
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

function getSyncQueue() {
  return wx.getStorageSync(syncQueueKey) || [];
}

function saveSyncQueue(queue) {
  wx.setStorageSync(syncQueueKey, queue);
}

function enqueueCloudWrite(job) {
  const queue = getSyncQueue();
  const nextQueue = queue.filter((item) => item.id !== job.id);
  nextQueue.push({
    ...job,
    retryCount: Number(job.retryCount || 0),
    updatedAt: Date.now()
  });
  saveSyncQueue(nextQueue);
}

function getPendingCloudWriteCount() {
  return getSyncQueue().length;
}

async function writeWorkoutSessionToCloud(session) {
  const sessionCollection = getCollection('workoutSessions');
  const setCollection = getCollection('workoutSets');
  await sessionCollection.doc(session.id).set({ data: toCloudSession(session) });
  await Promise.all((session.records || []).map((record, index) => (
    setCollection.doc(`${session.id}_${index + 1}`).set({
      data: toCloudSet(session, record)
    })
  )));
}

async function writeBodyWeightToCloud(record) {
  const collection = getCollection('bodyWeights');
  await collection.doc(record.id).set({ data: toCloudWeight(record) });
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
  workoutStore.saveWorkoutSession(session);

  if (!isCloudEnabled()) return session;

  try {
    await writeWorkoutSessionToCloud(session);
    return session;
  } catch (error) {
    console.warn('写入云端训练记录失败，已保留本地记录', error);
    enqueueCloudWrite({
      id: `workout_${session.id}`,
      type: 'workoutSession',
      payload: session
    });
    return session;
  }
}

async function getBodyWeights() {
  if (!isCloudEnabled()) return workoutStore.getBodyWeights();

  try {
    const collection = getCollection('bodyWeights');
    const all = [];
    const pageSize = 20;
    while (true) {
      // 小程序端按 20 条分页拉取，避免历史体重记录超过单页后显示不全。
      const result = await collection.orderBy('recorded_date', 'desc').skip(all.length).limit(pageSize).get();
      const rows = result.data || [];
      all.push(...rows);
      if (rows.length < pageSize) break;
    }
    if (!all.length) return workoutStore.getBodyWeights();
    return all.map(fromCloudWeight);
  } catch (error) {
    console.warn('读取云端体重记录失败，已回落本地数据', error);
    return workoutStore.getBodyWeights();
  }
}

async function saveBodyWeight(record) {
  workoutStore.saveBodyWeight(record);

  if (!isCloudEnabled()) return record;

  try {
    await writeBodyWeightToCloud(record);
    return record;
  } catch (error) {
    console.warn('写入云端体重记录失败，已保留本地记录', error);
    enqueueCloudWrite({
      id: `bodyWeight_${record.id}`,
      type: 'bodyWeight',
      payload: record
    });
    return record;
  }
}

async function syncPendingCloudWrites() {
  if (!isCloudEnabled()) return { total: 0, success: 0, failed: 0 };

  const queue = getSyncQueue();
  if (!queue.length) return { total: 0, success: 0, failed: 0 };

  const failedJobs = [];
  let success = 0;

  for (const job of queue) {
    try {
      if (job.type === 'workoutSession') {
        await writeWorkoutSessionToCloud(job.payload);
      } else if (job.type === 'bodyWeight') {
        await writeBodyWeightToCloud(job.payload);
      }
      success += 1;
    } catch (error) {
      failedJobs.push({
        ...job,
        retryCount: Number(job.retryCount || 0) + 1,
        updatedAt: Date.now()
      });
    }
  }

  saveSyncQueue(failedJobs);
  return {
    total: queue.length,
    success,
    failed: failedJobs.length
  };
}

/**
 * 获取某个特定动作的最近一次训练记录（重量、次数、休息时间）
 * 支持云端查询与本地缓存回落
 * @param {string} exerciseId 动作ID
 */
async function getLastWorkoutRecord(exerciseId) {
  if (!isCloudEnabled()) {
    const history = workoutStore.getWorkoutHistory();
    for (const session of history) {
      if (session.records && session.records.length) {
        const match = session.records.find((r) => r.exerciseId === exerciseId);
        if (match) return match;
      }
    }
    return null;
  }

  try {
    const collection = getCollection('workoutSets');
    if (!collection) return null;

    // 查询当前用户该动作在云端按时间倒序的第一组记录
    const res = await collection
      .where({ exercise_id: exerciseId })
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    if (res.data && res.data.length > 0) {
      const cloudSet = res.data[0];
      return {
        exerciseId: cloudSet.exercise_id,
        weightKg: cloudSet.weight_kg,
        reps: cloudSet.reps,
        rpe: cloudSet.rpe
      };
    }
  } catch (err) {
    console.warn('获取动作云端历史记录失败，回落本地查询：', err);
  }

  // 本地缓存回落
  const history = workoutStore.getWorkoutHistory();
  for (const session of history) {
    if (session.records && session.records.length) {
      const match = session.records.find((r) => r.exerciseId === exerciseId);
      if (match) return match;
    }
  }
  return null;
}

module.exports = {
  ...workoutStore,
  getWorkoutHistory,
  saveWorkoutSession,
  getBodyWeights,
  saveBodyWeight,
  getPendingCloudWriteCount,
  syncPendingCloudWrites,
  getLastWorkoutRecord
};
