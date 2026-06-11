const fs = require('fs');
const path = require('path');
const cloudbase = require('@cloudbase/node-sdk');
const cloudConfig = require('../miniprogram/config/cloud');

const rootDir = path.join(__dirname, '..');

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
  const positional = [];
  const flags = {};

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) {
      positional.push(item);
      continue;
    }

    const raw = item.slice(2);
    const inlineIndex = raw.indexOf('=');
    if (inlineIndex >= 0) {
      flags[raw.slice(0, inlineIndex)] = raw.slice(inlineIndex + 1);
      continue;
    }

    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      flags[raw] = next;
      i += 1;
    } else {
      flags[raw] = true;
    }
  }

  return { positional, flags };
}

function resolveCollectionName(input) {
  if (!input) return '';
  return cloudConfig.collections[input] || input;
}

function printHelp() {
  console.log(`
微信云数据库本地直连调试工具

用法：
  npm run db -- collections
  npm run db -- count [collectionKey]
  npm run db -- list <collectionKey> [--limit 20]
  npm run db -- get <collectionKey> <docId>

示例：
  npm run db -- collections
  npm run db -- count
  npm run db -- count exercises
  npm run db -- list planTemplates --limit 5
  npm run db -- get exercises bench_press

环境变量：
  TCB_ENV_ID       云开发环境 ID，默认读取 miniprogram/config/cloud.js
  TCB_SECRET_ID    腾讯云 API SecretId
  TCB_SECRET_KEY   腾讯云 API SecretKey

也可以复制 .env.example 为 .env 后填写本机调试密钥。
`);
}

function createDb() {
  loadEnvFile();

  const env = process.env.TCB_ENV_ID || cloudConfig.envId;
  const secretId = process.env.TCB_SECRET_ID;
  const secretKey = process.env.TCB_SECRET_KEY;

  if (!env) {
    throw new Error('缺少 TCB_ENV_ID，且 miniprogram/config/cloud.js 未配置 envId');
  }
  if (!secretId || !secretKey) {
    throw new Error('缺少 TCB_SECRET_ID 或 TCB_SECRET_KEY，请先配置 .env 或终端环境变量');
  }

  // 本地直连只服务调试，生产链路仍通过小程序端或云函数访问数据库。
  const app = cloudbase.init({
    env,
    secretId,
    secretKey
  });

  return app.database();
}

async function countCollections(db, key) {
  if (key) {
    const collectionName = resolveCollectionName(key);
    const result = await db.collection(collectionName).count();
    console.log(JSON.stringify({ collection: collectionName, total: result.total }, null, 2));
    return;
  }

  const entries = Object.entries(cloudConfig.collections);
  const rows = [];
  for (const [collectionKey, collectionName] of entries) {
    try {
      const result = await db.collection(collectionName).count();
      rows.push({ key: collectionKey, collection: collectionName, total: result.total });
    } catch (error) {
      rows.push({ key: collectionKey, collection: collectionName, error: error.message });
    }
  }
  console.table(rows);
}

async function listCollection(db, key, flags) {
  const collectionName = resolveCollectionName(key);
  if (!collectionName) throw new Error('list 需要指定集合名或集合 key');

  const limit = Math.min(Number(flags.limit || 20), 100);
  const result = await db.collection(collectionName).limit(limit).get();
  console.log(JSON.stringify(result.data || [], null, 2));
}

async function getDocument(db, key, id) {
  const collectionName = resolveCollectionName(key);
  if (!collectionName || !id) throw new Error('get 需要指定集合名和文档 ID');

  const result = await db.collection(collectionName).doc(id).get();
  console.log(JSON.stringify(result.data || null, null, 2));
}

function printCollections() {
  const rows = Object.entries(cloudConfig.collections).map(([key, collection]) => ({
    key,
    collection
  }));
  console.table(rows);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const command = positional[0];

  if (!command || flags.help || command === 'help') {
    printHelp();
    return;
  }

  if (command === 'collections') {
    printCollections();
    return;
  }

  const db = createDb();

  if (command === 'count') {
    await countCollections(db, positional[1]);
    return;
  }
  if (command === 'list') {
    await listCollection(db, positional[1], flags);
    return;
  }
  if (command === 'get') {
    await getDocument(db, positional[1], positional[2]);
    return;
  }

  throw new Error(`未知命令：${command}`);
}

main().catch((error) => {
  console.error(`数据库调试失败：${error.message}`);
  process.exitCode = 1;
});
