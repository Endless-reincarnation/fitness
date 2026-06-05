const { exercises, getExercise } = require('../data/mock');

function formatExercise(exercise) {
  if (!exercise) return null;

  return {
    ...exercise,
    // 页面常用展示字段在服务层统一拼好，避免每个页面重复处理。
    primaryMusclesText: exercise.primaryMuscles.join(' / '),
    secondaryMusclesText: exercise.secondaryMuscles.length ? exercise.secondaryMuscles.join(' / ') : '无',
    equipmentText: exercise.equipment.join(' / ')
  };
}

function listExercises() {
  return exercises.map(formatExercise);
}

function getExerciseById(exerciseId) {
  return formatExercise(getExercise(exerciseId));
}

module.exports = {
  listExercises,
  getExerciseById,
  formatExercise
};
