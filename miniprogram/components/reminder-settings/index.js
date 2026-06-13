const { getThemePrimaryColor } = require('../../utils/theme');
const { getReminderSettings, saveReminderSettings } = require('../../utils/reminderSettings');
const {
  createReminderAudio,
  playReminderAudio,
  vibrateReminder
} = require('../../utils/reminderPlayer');

Component({
  options: {
    styleIsolation: 'apply-shared'
  },

  properties: {
    theme: {
      type: String,
      value: 'power-yellow'
    },
    customPrimaryColor: {
      type: String,
      value: ''
    }
  },

  data: {
    reminderSwitchColor: '',
    reminderSettings: {
      soundEnabled: true,
      vibrationEnabled: true,
      countdownEnabled: true,
      intensity: 'standard'
    },
    reminderIntensityOptions: [
      { value: 'light', label: '轻' },
      { value: 'standard', label: '标准' },
      { value: 'strong', label: '强' }
    ]
  },

  observers: {
    theme(theme) {
      this.setData({ reminderSwitchColor: getThemePrimaryColor(theme) });
    },
    customPrimaryColor() {
      this.setData({ reminderSwitchColor: getThemePrimaryColor(this.properties.theme) });
    }
  },

  lifetimes: {
    attached() {
      this.refreshReminderSettings();
    }
  },

  pageLifetimes: {
    show() {
      this.refreshReminderSettings();
    }
  },

  methods: {
    refreshReminderSettings() {
      this.setData({
        reminderSettings: getReminderSettings(),
        reminderSwitchColor: getThemePrimaryColor(this.properties.theme)
      });
    },

    toggleReminderSetting(event) {
      const { field } = event.currentTarget.dataset;
      if (!field) return;

      // 训练提醒设置只保存在本地，避免每次训练前依赖云端读取。
      const reminderSettings = saveReminderSettings({
        [field]: Boolean(event.detail.value)
      });
      this.setData({ reminderSettings });
    },

    switchReminderIntensity(event) {
      const { intensity } = event.currentTarget.dataset;
      if (!intensity) return;

      // 提醒强度影响到点铃声次数和震动兜底次数。
      const reminderSettings = saveReminderSettings({ intensity });
      this.setData({ reminderSettings });
    },

    testReminder() {
      const reminderSettings = getReminderSettings();

      if (!reminderSettings.soundEnabled && !reminderSettings.vibrationEnabled) {
        wx.showToast({ title: '请先打开提醒开关', icon: 'none' });
        return;
      }

      if (reminderSettings.vibrationEnabled) {
        vibrateReminder(reminderSettings);
      }

      if (!reminderSettings.soundEnabled) return;

      const audio = createReminderAudio({
        onError: (err) => {
          console.warn('测试提醒铃声播放失败', err);
          wx.showToast({ title: '铃声播放失败', icon: 'none' });
        }
      });
      if (!audio) return;

      // 测试提醒复用训练页同一套播放器，确保体感一致。
      playReminderAudio(audio, reminderSettings, {
        destroyOnEnded: true,
        onError: (err) => {
          console.warn('触发测试提醒铃声失败', err);
          wx.showToast({ title: '铃声播放失败', icon: 'none' });
        }
      });
    }
  }
});
