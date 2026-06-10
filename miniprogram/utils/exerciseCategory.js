const bodyRegionOptions = [
  { value: 'all', label: '全部' },
  { value: 'recent', label: '最近' },
  { value: 'chest', label: '胸' },
  { value: 'back', label: '背' },
  { value: 'legs', label: '腿' },
  { value: 'shoulders', label: '肩' },
  { value: 'arms', label: '手臂' },
  { value: 'core', label: '核心' },
  { value: 'custom', label: '自定义' }
];

const equipmentOptions = [
  { value: 'all', label: '全部器械' },
  { value: 'bodyweight', label: '自重' },
  { value: 'dumbbell', label: '哑铃' },
  { value: 'barbell', label: '杠铃' },
  { value: 'cable', label: '拉索' },
  { value: 'machine', label: '器械' },
  { value: 'smith', label: '史密斯' }
];

const muscleRegionMap = {
  // 中文对照
  胸大肌: 'chest',
  胸大肌上束: 'chest',
  三角肌前束: 'shoulders',
  三角肌中束: 'shoulders',
  三角肌后束: 'shoulders',
  肱三头肌: 'arms',
  肱二头肌: 'arms',
  背阔肌: 'back',
  中下斜方肌: 'back',
  菱形肌: 'back',
  竖脊肌: 'back',
  臀大肌: 'legs',
  股四头肌: 'legs',
  腘绳肌: 'legs',
  核心肌群: 'core',
  自定义: 'custom',

  // 英文 ID 对照，防止云数据异步映射异常或 fallback 时无法分类
  pectoralis_major: 'chest',
  upper_pectoralis: 'chest',
  anterior_deltoid: 'shoulders',
  middle_deltoid: 'shoulders',
  posterior_deltoid: 'shoulders',
  triceps_brachii: 'arms',
  biceps_brachii: 'arms',
  latissimus_dorsi: 'back',
  middle_lower_trapezius: 'back',
  rhomboids: 'back',
  gluteus_maximus: 'legs',
  quadriceps: 'legs',
  hamstrings: 'legs',
  erector_spinae: 'back',
  core: 'core',
  custom: 'custom'
};

const equipmentKeywordMap = {
  bodyweight: ['自重', '徒手', 'bodyweight'],
  dumbbell: ['哑铃', 'dumbbell'],
  barbell: ['杠铃', '易弯杠', 'barbell'],
  cable: ['拉索', '绳索', '龙门架', '钢线', 'cable'],
  machine: ['器械', '高位下拉器', '罗马椅', 'machine'],
  smith: ['史密斯', 'smith']
};

const pinyinInitialMap = {
  杠: 'g',
  铃: 'l',
  卧: 'w',
  推: 't',
  哑: 'y',
  上: 's',
  斜: 'x',
  双: 's',
  臂: 'b',
  屈: 'q',
  伸: 's',
  仰: 'y',
  侧: 'c',
  平: 'p',
  举: 'j',
  单: 'd',
  手: 's',
  钢: 'g',
  线: 'x',
  下: 'x',
  拉: 'l',
  对: 'd',
  握: 'w',
  器: 'q',
  械: 'x',
  划: 'h',
  船: 'c',
  坐: 'z',
  姿: 'z',
  开: 'k',
  肘: 'z',
  弯: 'w',
  腿: 't',
  硬: 'y',
  保: 'b',
  加: 'j',
  利: 'l',
  亚: 'y',
  蹲: 'd',
  颈: 'j',
  前: 'q',
  深: 's',
  罗: 'l',
  马: 'm',
  尼: 'n',
  山: 's',
  羊: 'y',
  挺: 't',
  身: 's',
  字: 'z'
};

function getPinyinInitials(text) {
  return String(text || '').split('').map((char) => pinyinInitialMap[char] || '').join('');
}

function getExerciseBodyRegions(exercise) {
  const muscles = exercise.primaryMuscles || [];
  const regions = muscles.map((name) => muscleRegionMap[name]).filter(Boolean);
  return Array.from(new Set(regions.length ? regions : ['custom']));
}

function getExerciseEquipmentCategories(exercise) {
  const equipment = exercise.equipment || [];
  return equipmentOptions
    .filter((option) => option.value !== 'all')
    .filter((option) => {
      const keywords = equipmentKeywordMap[option.value] || [];
      return equipment.some((item) => keywords.some((keyword) => String(item).indexOf(keyword) !== -1));
    })
    .map((option) => option.value);
}

function buildExerciseSearchText(exercise) {
  const name = exercise.name || '';
  const aliases = exercise.aliases || [];
  const fields = [
    name,
    getPinyinInitials(name),
    aliases.join(' '),
    aliases.map(getPinyinInitials).join(' '),
    (exercise.primaryMuscles || []).join(' '),
    (exercise.secondaryMuscles || []).join(' '),
    (exercise.equipment || []).join(' ')
  ];

  // 搜索索引集中在服务层生成，页面只做 includes 匹配。
  return fields.filter(Boolean).join(' ').toLowerCase();
}

function matchExerciseRegion(exercise, region) {
  if (!region || region === 'all') return true;
  if (region === 'recent') return false;
  return (exercise.bodyRegions || []).indexOf(region) !== -1;
}

function matchExerciseKeyword(exercise, keyword) {
  const text = String(keyword || '').trim().toLowerCase();
  if (!text) return true;
  return String(exercise.searchText || '').indexOf(text) !== -1;
}

module.exports = {
  bodyRegionOptions,
  equipmentOptions,
  buildExerciseSearchText,
  getExerciseBodyRegions,
  getExerciseEquipmentCategories,
  matchExerciseKeyword,
  matchExerciseRegion
};
