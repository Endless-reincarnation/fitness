// 本地默认器械字典作为云端字典读取失败时的兜底，顺序保持常用项靠前。
const standardEquipmentOptions = [
  { value: 'bodyweight', label: '自重' },
  { value: 'dumbbell', label: '哑铃' },
  { value: 'barbell', label: '杠铃' },
  { value: 'cable', label: '绳索/龙门架' },
  { value: 'machine', label: '固定器械' },
  { value: 'smith', label: '史密斯机' },
  { value: 'bench', label: '训练凳' },
  { value: 'parallel_bars', label: '双杠' },
  { value: 'roman_chair', label: '罗马椅' }
];

const equipmentFilterOptions = [
  { value: 'all', label: '全部器械' },
  ...standardEquipmentOptions
];

const customEquipmentOption = { value: '自定义', label: '自定义' };

const equipmentKeywordMap = {
  bodyweight: ['自重', '徒手', 'bodyweight'],
  dumbbell: ['哑铃', 'dumbbell'],
  barbell: ['杠铃', '易弯杠', 'barbell'],
  cable: ['拉索', '绳索', '龙门架', '钢线', 'cable'],
  machine: ['器械', '固定器械', '高位下拉器', 'machine'],
  smith: ['史密斯', 'smith'],
  bench: ['卧推凳', '上斜凳', '训练凳', 'bench'],
  parallel_bars: ['双杠'],
  roman_chair: ['罗马椅']
};

function normalizeEquipmentOptions(options) {
  return (options || [])
    .filter((item) => item && item.enabled !== false && item.value && item.label)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((item) => ({
      value: item.value,
      label: item.label,
      sort_order: item.sort_order || 0,
      enabled: item.enabled !== false
    }));
}

function getEquipmentLabels(values, options = standardEquipmentOptions) {
  const labelMap = options.reduce((map, item) => {
    map[item.value] = item.label;
    return map;
  }, {});
  return (values || []).map((value) => labelMap[value] || value).filter(Boolean);
}

module.exports = {
  standardEquipmentOptions,
  equipmentFilterOptions,
  customEquipmentOption,
  equipmentKeywordMap,
  getEquipmentLabels,
  normalizeEquipmentOptions
};
