const REMINDER_SOUND_SRC = '/assets/audio/rest-finish.wav';

function getReminderIntensityConfig(reminderSettings) {
  const intensity = reminderSettings && reminderSettings.intensity;
  if (intensity === 'light') return { audioPlays: 1, fallbackVibrations: 1 };
  if (intensity === 'strong') return { audioPlays: 3, fallbackVibrations: 3 };
  return { audioPlays: 2, fallbackVibrations: 2 };
}

function setupInnerAudioOption() {
  if (!wx.setInnerAudioOption) return;
  wx.setInnerAudioOption({
    mixWithOther: true,
    obeyMuteSwitch: false
  });
}

function createReminderAudio({ onError } = {}) {
  if (!wx.createInnerAudioContext) return null;

  setupInnerAudioOption();
  const audio = wx.createInnerAudioContext();
  // 提醒铃声统一使用本地短音频，避免网络加载导致提醒丢失。
  audio.src = REMINDER_SOUND_SRC;
  audio.volume = 1;
  audio.obeyMuteSwitch = false;
  audio.onError((err) => {
    if (onError) onError(err);
  });
  return audio;
}

function destroyReminderAudio(audio) {
  if (!audio) return;
  audio.destroy();
}

function playReminderAudio(audio, reminderSettings, { onError, destroyOnEnded = false } = {}) {
  if (!audio) return;

  const config = getReminderIntensityConfig(reminderSettings);
  let playedCount = 0;

  const playOnce = () => {
    if (playedCount >= config.audioPlays) return;
    playedCount += 1;
    try {
      audio.stop();
      audio.play();
    } catch (err) {
      if (onError) onError(err);
    }
  };

  if (audio.offEnded) {
    audio.offEnded();
  }
  audio.onEnded(() => {
    if (playedCount < config.audioPlays) {
      playOnce();
      return;
    }
    if (destroyOnEnded) {
      destroyReminderAudio(audio);
    }
  });

  playOnce();
}

function playReminderFallbackVibration(reminderSettings) {
  if (!reminderSettings || !reminderSettings.vibrationEnabled) return;
  const config = getReminderIntensityConfig(reminderSettings);

  // 铃声失败时按提醒强度短震兜底，降低用户错过休息结束的概率。
  for (let i = 0; i < config.fallbackVibrations; i += 1) {
    setTimeout(() => {
      wx.vibrateShort({ type: 'heavy' });
    }, i * 180);
  }
}

function vibrateReminder(reminderSettings) {
  if (!reminderSettings || !reminderSettings.vibrationEnabled) return;
  const intensity = reminderSettings.intensity;

  if (intensity === 'light') {
    wx.vibrateShort({ type: 'medium' });
    return;
  }

  wx.vibrateLong();
  if (intensity !== 'strong') return;

  // 强档在长震后追加短震，适合嘈杂环境。
  [360, 540].forEach((delay) => {
    setTimeout(() => {
      wx.vibrateShort({ type: 'heavy' });
    }, delay);
  });
}

module.exports = {
  createReminderAudio,
  destroyReminderAudio,
  getReminderIntensityConfig,
  playReminderAudio,
  playReminderFallbackVibration,
  vibrateReminder
};
