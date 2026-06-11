const fs = require('fs');
const path = require('path');
const cloudbase = require('@cloudbase/node-sdk');
const cloudConfig = require('../miniprogram/config/cloud');

const rootDir = path.join(__dirname, '..');
const seedDir = path.join(rootDir, 'seed', 'cloud-import');
const seedCollections = [
  'muscles',
  'exercises',
  'plan_templates',
  'plan_template_versions',
  'plan_days',
  'plan_day_exercises',
  'exercise_alternatives'
];
const deleteOrder = [...seedCollections].reverse();

function loadEnvFile() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex < 0) continue;

    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  return {
    confirm: argv.includes('--confirm'),
    dryRun: argv.includes('--dry-run') || !argv.includes('--confirm')
  };
}

function createDb() {
  loadEnvFile();

  const env = process.env.TCB_ENV_ID || cloudConfig.envId;
  const secretId = process.env.TCB_SECRET_ID;
  const secretKey = process.env.TCB_SECRET_KEY;

  if (!env) throw new Error('缺少 TCB_ENV_ID，且 miniprogram/config/cloud.js 未配置 envId');
  if (!secretId || !secretKey) throw new Error('缺少 TCB_SECRET_ID 或 TCB_SECRET_KEY');

  // 仅用于本地初始化数据重置，业务运行仍走小程序和云函数链路。
  return cloudbase.init({ env, secretId, secretKey }).database();
}

function readJsonLines(collectionName) {
  const filePath = path.join(seedDir, `${collectionName}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`缺少种子文件：${filePath}`);

  const content = fs.readFileSync(filePath, 'utf8').trim();
  if (!content) return [];

  return content.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function stripId(record) {
  const { _id, ...data } = record;
  if (!_id) throw new Error(`种子记录缺少 _id：${JSON.stringify(record).slice(0, 120)}`);
  return { id: _id, data };
}

async function listIds(db, collectionName) {
  const ids = [];
  const collection = db.collection(collectionName);

  while (true) {
    const result = await collection.skip(ids.length).limit(100).get();
    const rows = result.data || [];
    ids.push(...rows.map((item) => item._id));
    if (rows.length < 100) break;
  }

  return ids;
}

async function removeCollectionDocs(db, collectionName) {
  const ids = await listIds(db, collectionName);
  for (const id of ids) {
    await db.collection(collectionName).doc(id).remove();
  }
  return ids.length;
}

async function importCollection(db, collectionName, records) {
  let written = 0;
  for (const record of records) {
    const { id, data } = stripId(record);
    await db.collection(collectionName).doc(id).set(data);
    written += 1;
  }
  return written;
}

async function summarizeCloud(db) {
  const rows = [];
  for (const collectionName of seedCollections) {
    const total = await db.collection(collectionName).count();
    rows.push({ collection: collectionName, cloud: total.total });
  }
  return rows;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const db = createDb();
  const seeds = Object.fromEntries(seedCollections.map((name) => [name, readJsonLines(name)]));
  const before = await summarizeCloud(db);

  console.log('目标集合当前数量：');
  console.table(before.map((row) => ({
    ...row,
    seed: seeds[row.collection].length
  })));

  if (args.dryRun) {
    console.log('当前是 dry-run，未修改云数据库。执行真实重置请加 --confirm。');
    return;
  }

  console.log('开始删除官方初始化数据集合...');
  const deleted = [];
  for (const collectionName of deleteOrder) {
    deleted.push({ collection: collectionName, deleted: await removeCollectionDocs(db, collectionName) });
  }
  console.table(deleted);

  console.log('开始按种子文件重新导入...');
  const imported = [];
  for (const collectionName of seedCollections) {
    imported.push({ collection: collectionName, imported: await importCollection(db, collectionName, seeds[collectionName]) });
  }
  console.table(imported);

  console.log('重置后数量：');
  console.table(await summarizeCloud(db));
}

main().catch((error) => {
  console.error(`初始化数据重置失败：${error.message}`);
  process.exitCode = 1;
});
