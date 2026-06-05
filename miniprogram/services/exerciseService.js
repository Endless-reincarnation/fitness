const { exercises, getExercise } = require('../data/mock');
const { getCollection, isCloudEnabled } = require('./cloudService');

let cloudExercisesCache = null;
let cloudMusclesCache = null;

async function listCloudCollection(collectionKey) {
  const collection = getCollection(collectionKey);
  if (!collection) return [];

  const result = await collection.limit(100).get();
  return result.data || [];
}

async function getCloudMuscleNameMap() {
  if (cloudMusclesCache) return cloudMusclesCache;

  const muscles = await listCloudCollection('muscles');
  cloudMusclesCache = muscles.reduce((map, item) => {
    map[item._id || item.id] = item.name;
    return map;
  }, {});
  return cloudMusclesCache;
}

function formatExercise(exercise, muscleNameMap = {}) {
  if (!exercise) return null;

  const primaryMuscleIds = exercise.primary_muscles || exercise.primaryMuscles || [];
  const secondaryMuscleIds = exercise.secondary_muscles || exercise.secondaryMuscles || [];
  const primaryMuscles = primaryMuscleIds.map((id) => muscleNameMap[id] || id);
  const secondaryMuscles = secondaryMuscleIds.map((id) => muscleNameMap[id] || id);
  const equipment = exercise.equipment_tags || exercise.equipment || [];

  return {
    ...exercise,
    id: exercise.id || exercise._id,
    primaryMuscles,
    secondaryMuscles,
    equipment,
    steps: exercise.steps || [],
    mistakes: exercise.common_mistakes || exercise.mistakes || [],
    // 页面常用展示字段在服务层统一拼好，避免每个页面重复处理。
    primaryMusclesText: primaryMuscles.join(' / '),
    secondaryMusclesText: secondaryMuscles.length ? secondaryMuscles.join(' / ') : '无',
    equipmentText: equipment.join(' / ')
  };
}

function listLocalExercises() {
  return exercises.map((exercise) => formatExercise(exercise));
}

async function listExercises() {
  if (!isCloudEnabled()) return listLocalExercises();

  try {
    const [cloudExercises, muscleNameMap] = await Promise.all([
      listCloudCollection('exercises'),
      getCloudMuscleNameMap()
    ]);
    if (!cloudExercises.length) return listLocalExercises();
    cloudExercisesCache = cloudExercises;
    return cloudExercises.map((exercise) => formatExercise(exercise, muscleNameMap));
  } catch (error) {
    console.warn('读取云端动作库失败，已回落本地数据', error);
    return listLocalExercises();
  }
}

async function getExerciseById(exerciseId) {
  if (!isCloudEnabled()) return formatExercise(getExercise(exerciseId));

  try {
    const muscleNameMap = await getCloudMuscleNameMap();
    if (!cloudExercisesCache) {
      cloudExercisesCache = await listCloudCollection('exercises');
    }
    const cachedExercise = cloudExercisesCache.find((item) => (item._id || item.id) === exerciseId);
    if (cachedExercise) return formatExercise(cachedExercise, muscleNameMap);

    const collection = getCollection('exercises');
    const result = collection ? await collection.doc(exerciseId).get() : null;
    return formatExercise(result && result.data ? result.data : getExercise(exerciseId), muscleNameMap);
  } catch (error) {
    console.warn('读取云端动作详情失败，已回落本地数据', error);
    return formatExercise(getExercise(exerciseId));
  }
}

module.exports = {
  listExercises,
  getExerciseById,
  formatExercise
};
