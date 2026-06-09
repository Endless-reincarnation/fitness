const cloudConfig = {
  // 已接入开发环境，数据服务仍会逐步从本地切到云端。
  enabled: true,
  envId: 'dev-d1getmtzq8dd4414c',
  // 管理员 openid 白名单；正式使用前把管理员 openid 填到这里，或在 users 表设置 is_admin=true。
  adminOpenids: [],
  collections: {
    users: 'users',
    exercises: 'exercises',
    muscles: 'muscles',
    exerciseAlternatives: 'exercise_alternatives',
    planTemplates: 'plan_templates',
    planTemplateVersions: 'plan_template_versions',
    planDays: 'plan_days',
    planDayExercises: 'plan_day_exercises',
    userPlans: 'user_plans',
    customPlans: 'custom_plans',
    workoutSessions: 'workout_sessions',
    workoutSets: 'workout_sets',
    bodyWeights: 'body_weights',
    feedbackMessages: 'feedback_messages',
    adminLogs: 'admin_logs'
  }
};

module.exports = cloudConfig;
