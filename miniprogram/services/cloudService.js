const cloudConfig = require('../config/cloud');

function isCloudEnabled() {
  return Boolean(cloudConfig.enabled && cloudConfig.envId && wx.cloud);
}

function initCloud() {
  if (!isCloudEnabled()) return false;

  // 云环境只在 app 启动时初始化一次，后续服务层统一复用 wx.cloud.database。
  wx.cloud.init({
    env: cloudConfig.envId,
    traceUser: true
  });
  return true;
}

function getDb() {
  if (!isCloudEnabled()) return null;
  return wx.cloud.database();
}

function getCollection(name) {
  const db = getDb();
  const collectionName = cloudConfig.collections[name];
  if (!db || !collectionName) return null;
  return db.collection(collectionName);
}

async function countCollection(name) {
  const collection = getCollection(name);
  if (!collection) return null;

  const result = await collection.count();
  return result.total;
}

module.exports = {
  cloudConfig,
  countCollection,
  getCollection,
  getDb,
  initCloud,
  isCloudEnabled
};
