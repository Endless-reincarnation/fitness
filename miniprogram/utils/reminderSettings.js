const REMINDER_SETTINGS_KEY = 'workoutReminderSettings';

const DEFAULT_REMINDER_SETTINGS = {
  soundEnabled: true,
  vibrationEnabled: true,
  countdownEnabled: true,
  intensity: 'standard'
};

const REMINDER_INTENSITIES = ['light', 'standard', 'strong'];

function getReminderSettings() {
  const saved = wx.getStorageSync(REMINDER_SETTINGS_KEY) || {};
  // 统一入口读取提醒设置，避免训练页和“我的”页默认值不一致。
  return {
    ...DEFAULT_REMINDER_SETTINGS,
    ...saved,
    intensity: REMINDER_INTENSITIES.indexOf(saved.intensity) !== -1 ? saved.intensity : DEFAULT_REMINDER_SETTINGS.intensity
  };
}

function saveReminderSettings(settings) {
  const nextSettings = {
    ...getReminderSettings(),
    ...settings
  };
  wx.setStorageSync(REMINDER_SETTINGS_KEY, nextSettings);
  return nextSettings;
}

module.exports = {
  getReminderSettings,
  saveReminderSettings,
  REMINDER_INTENSITIES
};
