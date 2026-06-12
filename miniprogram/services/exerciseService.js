const { exercises, getExercise } = require('../data/mock');
const { getCollection, getDb, isCloudEnabled } = require('./cloudService');
const {
  buildExerciseSearchText,
  getExerciseBodyRegions,
  getExerciseEquipmentCategories
} = require('../utils/exerciseCategory');

let cloudExercisesCache = null;
let cloudMusclesCache = null;

function getCustomExercises() {
  return wx.getStorageSync('customExercises') || [];
}

function saveCustomExercise(exerciseName, primaryMuscles = ['自定义'], equipment = ['自定义']) {
  const name = String(exerciseName || '').trim();
  if (!name) return null;

  const customExercises = getCustomExercises();
  const existing = customExercises.find((item) => item.name === name);
  if (existing) return formatExercise(existing);

  // 自定义动作也保存为结构化对象，计划里只引用 ID，避免自由文本散落。
  const exercise = {
    id: `custom_exercise_${Date.now()}`,
    name,
    sourceType: 'custom',
    primaryMuscles: Array.isArray(primaryMuscles) ? primaryMuscles : [primaryMuscles],
    secondaryMuscles: [],
    equipment: Array.isArray(equipment) ? equipment : [equipment],
    steps: ['自定义动作暂无标准步骤，训练时按自己的动作习惯执行。'],
    mistakes: ['暂无常见错误记录。'],
    note: '用户自定义动作'
  };
  wx.setStorageSync('customExercises', customExercises.concat(exercise));
  return formatExercise(exercise);
}

async function listCloudCollection(collectionKey) {
  const collection = getCollection(collectionKey);
  if (!collection) return [];

  const all = [];
  // 小程序端数据库单页上限较低，固定按 20 条分页避免误判“已经取完”。
  const pageSize = 20;
  while (true) {
    const result = await collection.skip(all.length).limit(pageSize).get();
    const rows = result.data || [];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}

async function listPublishedCloudExercises() {
  const collection = getCollection('exercises');
  if (!collection) return [];

  const all = [];
  const pageSize = 20;
  while (true) {
    const result = await collection
      .where({ status: 'published' })
      .orderBy('updated_at', 'desc')
      .skip(all.length)
      .limit(pageSize)
      .get();
    const rows = result.data || [];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}

async function getCloudMuscleMetaMap() {
  if (cloudMusclesCache) return cloudMusclesCache;

  const collection = getCollection('muscles');
  const db = getDb();
  const _ = db && db.command;
  const bodyRegions = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
  const muscles = collection && _
    ? (await collection.where({ body_region: _.in(bodyRegions) }).orderBy('sort_order', 'asc').get()).data || []
    : await listCloudCollection('muscles');
  cloudMusclesCache = muscles.reduce((map, item) => {
    map[item._id || item.id] = item;
    return map;
  }, {});
  return cloudMusclesCache;
}

function getMuscleName(muscleMetaMap, id) {
  const meta = muscleMetaMap[id];
  return (meta && meta.name) || meta || id;
}

function getMuscleRegion(muscleMetaMap, id) {
  const meta = muscleMetaMap[id];
  return meta && meta.body_region ? meta.body_region : '';
}

function formatExercise(exercise, muscleMetaMap = {}) {
  if (!exercise) return null;

  const primaryMuscleIds = exercise.primary_muscles || exercise.primaryMuscles || [];
  const secondaryMuscleIds = exercise.secondary_muscles || exercise.secondaryMuscles || [];
  const primaryMuscles = primaryMuscleIds.map((id) => getMuscleName(muscleMetaMap, id));
  const secondaryMuscles = secondaryMuscleIds.map((id) => getMuscleName(muscleMetaMap, id));
  const primaryBodyRegionIds = primaryMuscleIds.map((id) => getMuscleRegion(muscleMetaMap, id)).filter(Boolean);
  const secondaryBodyRegionIds = secondaryMuscleIds.map((id) => getMuscleRegion(muscleMetaMap, id)).filter(Boolean);
  const bodyRegionIds = primaryBodyRegionIds.concat(secondaryBodyRegionIds);
  const equipment = exercise.equipment_tags || exercise.equipment || [];

  const formattedExercise = {
    ...exercise,
    id: exercise.id || exercise._id,
    primaryMuscleIds,
    secondaryMuscleIds,
    primaryBodyRegionIds,
    secondaryBodyRegionIds,
    bodyRegionIds,
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

  return {
    ...formattedExercise,
    bodyRegions: getExerciseBodyRegions(formattedExercise),
    equipmentCategories: getExerciseEquipmentCategories(formattedExercise),
    searchText: buildExerciseSearchText(formattedExercise)
  };
}

function listLocalExercises() {
  return exercises.map((exercise) => formatExercise(exercise)).concat(getCustomExercises().map((exercise) => formatExercise(exercise)));
}

async function listExercises() {
  if (!isCloudEnabled()) return listLocalExercises();

  try {
    const [cloudExercises, muscleMetaMap] = await Promise.all([
      listPublishedCloudExercises(),
      getCloudMuscleMetaMap()
    ]);
    if (!cloudExercises.length) return listLocalExercises();
    cloudExercisesCache = cloudExercises;
    return cloudExercises.map((exercise) => formatExercise(exercise, muscleMetaMap)).concat(getCustomExercises().map((exercise) => formatExercise(exercise)));
  } catch (error) {
    console.warn('读取云端动作库失败，已回落本地数据', error);
    return listLocalExercises();
  }
}

async function getExerciseById(exerciseId) {
  const customExercise = getCustomExercises().find((item) => item.id === exerciseId);
  if (customExercise) return formatExercise(customExercise);

  if (!isCloudEnabled()) return formatExercise(getExercise(exerciseId));

  try {
    const muscleMetaMap = await getCloudMuscleMetaMap();
    if (!cloudExercisesCache) {
      cloudExercisesCache = await listPublishedCloudExercises();
    }
    const cachedExercise = cloudExercisesCache.find((item) => (item._id || item.id) === exerciseId);
    if (cachedExercise) return formatExercise(cachedExercise, muscleMetaMap);

    const collection = getCollection('exercises');
    const result = collection ? await collection.doc(exerciseId).get() : null;
    return formatExercise(result && result.data ? result.data : getExercise(exerciseId), muscleMetaMap);
  } catch (error) {
    console.warn('读取云端动作详情失败，已回落本地数据', error);
    return formatExercise(getExercise(exerciseId));
  }
}

module.exports = {
  listExercises,
  getExerciseById,
  formatExercise,
  saveCustomExercise
};
