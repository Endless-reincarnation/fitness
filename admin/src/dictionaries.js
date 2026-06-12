// 后台默认器械字典作为云端字典读取失败时的兜底，顺序与小程序侧保持一致。
export const standardEquipmentOptions = [
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

export const equipmentLabels = standardEquipmentOptions.map((item) => item.label);

export function normalizeEquipmentOptions(options) {
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
