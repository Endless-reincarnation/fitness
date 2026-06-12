const { standardEquipmentOptions, normalizeEquipmentOptions } = require('../data/dictionaries');
const { getCollection } = require('./cloudService');

async function listEquipmentOptions() {
  const collection = getCollection('dictionaries');
  if (!collection) return standardEquipmentOptions;

  try {
    const result = await collection.doc('equipment').get();
    const options = normalizeEquipmentOptions(result.data && result.data.items);
    return options.length ? options : standardEquipmentOptions;
  } catch (error) {
    console.warn('读取云端器械字典失败，使用本地默认字典', error);
    return standardEquipmentOptions;
  }
}

module.exports = {
  listEquipmentOptions
};
