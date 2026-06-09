const { getCollection, isCloudEnabled } = require('./cloudService');

function getLocalFeedbackMessages() {
  return wx.getStorageSync('feedbackMessages') || [];
}

function saveLocalFeedbackMessage(message) {
  const messages = getLocalFeedbackMessages();
  wx.setStorageSync('feedbackMessages', messages.concat(message));
  return message;
}

async function saveFeedbackMessage(payload) {
  const content = String(payload.content || '').trim();
  const contact = String(payload.contact || '').trim();

  if (!content) {
    throw new Error('请先填写建议内容');
  }

  const now = new Date().toISOString();
  const message = {
    content,
    contact,
    source: 'miniprogram',
    status: 'new',
    user_snapshot: payload.userSnapshot || null,
    created_at: now,
    updated_at: now
  };

  if (!isCloudEnabled()) {
    // 云开发不可用时先保存在本地，后续可做统一同步。
    return saveLocalFeedbackMessage({
      id: `feedback_${Date.now()}`,
      ...message,
      sync_status: 'local'
    });
  }

  try {
    const collection = getCollection('feedbackMessages');
    if (!collection) throw new Error('反馈集合未配置');

    const result = await collection.add({ data: message });
    return {
      id: result._id,
      ...message,
      sync_status: 'cloud'
    };
  } catch (error) {
    console.warn('提交建议到云端失败，已保存到本地', error);
    return saveLocalFeedbackMessage({
      id: `feedback_${Date.now()}`,
      ...message,
      sync_status: 'local'
    });
  }
}

module.exports = {
  getLocalFeedbackMessages,
  saveFeedbackMessage
};
