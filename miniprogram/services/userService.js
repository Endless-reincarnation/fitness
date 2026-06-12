const { cloudConfig, getCollection, isCloudEnabled } = require('./cloudService');

function isAdminProfile(profile) {
  if (!profile) return false;

  const openid = profile.openid || profile._openid;
  const adminOpenids = cloudConfig.adminOpenids || [];

  // 支持 users 表标记和本地白名单两种方式，方便开发期快速授权。
  return Boolean(profile.is_admin || profile.isAdmin || (openid && adminOpenids.indexOf(openid) !== -1));
}

/**
 * 获取当前用户的云端个人资料
 * 如果云端没有，则返回 null，由页面层处理默认展示
 */
async function getUserProfile() {
  if (!isCloudEnabled()) return null;

  try {
    const collection = getCollection('users');
    if (!collection) return null;

    // 用户资料集合依赖云数据库权限按创建者自动隔离，不回退读取其他用户资料。
    const res = await collection.limit(1).get();
    if (res.data && res.data.length > 0) {
      return res.data[0];
    }
  } catch (err) {
    console.error('获取云端用户资料失败：', err);
  }
  return null;
}

/**
 * 保存/更新当前用户的云端个人资料
 * @param {Object} profile 用户资料对象
 */
async function saveUserProfile(profile) {
  if (!isCloudEnabled()) return null;

  const collection = getCollection('users');
  if (!collection) return null;

  const now = new Date().toISOString();
  const dataToSave = {
    nickname: profile.nickname || '',
    avatar_url: profile.avatar_url || '',
    gender: profile.gender || 'unknown',
    height_cm: Number(profile.height_cm) || null,
    current_weight_kg: Number(profile.current_weight_kg) || null,
    target_weight_kg: Number(profile.target_weight_kg) || null,
    training_goal: profile.training_goal || '',
    experience_level: profile.experience_level || '',
    weekly_frequency: Number(profile.weekly_frequency) || null,
    equipment_tags: profile.equipment_tags || [],
    updated_at: now
  };

  if (profile._id) {
    // 更新已有记录
    const id = profile._id;
    await collection.doc(id).update({
      data: dataToSave
    });
    return { _id: id, ...dataToSave, created_at: profile.created_at };
  } else {
    // 创建新记录
    dataToSave.created_at = now;
    const res = await collection.add({
      data: dataToSave
    });
    return { _id: res._id, ...dataToSave };
  }
}

/**
 * 上传头像临时文件到微信云存储
 * @param {string} tempFilePath 小程序本地头像临时路径
 */
async function uploadAvatar(tempFilePath) {
  if (!isCloudEnabled()) {
    throw new Error('云开发未启用，无法上传头像');
  }

  // 提取文件后缀名，默认 png
  const suffix = tempFilePath.split('.').pop() || 'png';
  // 规划云存储中的路径：avatars/时间戳_随机数.后缀
  const randomStr = Math.random().toString(36).substr(2, 6);
  const cloudPath = `avatars/${Date.now()}_${randomStr}.${suffix}`;

  try {
    const res = await wx.cloud.uploadFile({
      cloudPath,
      filePath: tempFilePath
    });
    // 返回云存储文件唯一标识 FileID (格式如 cloud://xxx/avatars/xxx.png)
    return res.fileID;
  } catch (err) {
    console.error('上传头像至云存储失败：', err);
    throw err;
  }
}

module.exports = {
  getUserProfile,
  isAdminProfile,
  saveUserProfile,
  uploadAvatar
};
