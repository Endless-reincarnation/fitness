const cloudConfig = {
  // 第一版默认关闭云端，避免没有云环境时影响本地预览。
  enabled: false,
  envId: '',
  collections: {
    users: 'users',
    exercises: 'exercises',
    muscles: 'muscles',
    planTemplates: 'plan_templates',
    planDays: 'plan_days',
    planDayExercises: 'plan_day_exercises',
    userPlans: 'user_plans',
    workoutSessions: 'workout_sessions',
    workoutSets: 'workout_sets',
    bodyWeights: 'body_weights',
    adminLogs: 'admin_logs'
  }
};

module.exports = cloudConfig;
