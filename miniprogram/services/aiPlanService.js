const DRAFT_STORAGE_KEY = 'aiPlanDrafts';
const AI_PROVIDER = 'hunyuan-v3';
const AI_MODEL = 'hy3-preview';

const defaultRule = {
  role: 'assistance',
  roleLabel: '辅助项',
  rpe: '8',
  weightRule: '选择能稳定完成目标次数的重量，优先保证动作质量。',
  progressionRule: '全部组达到目标次数上限后，下次可小幅加重或增加次数。'
};

const mockExerciseGroups = [
  [
    { exerciseId: 'barbell_bench_press', exerciseName: '杠铃卧推', sets: 4, reps: '8-10', restSeconds: 150, role: 'main', roleLabel: '主项' },
    { exerciseId: 'incline_dumbbell_press', exerciseName: '哑铃上斜卧推', sets: 3, reps: '10-12', restSeconds: 120 },
    { exerciseId: 'lying_barbell_triceps_extension', exerciseName: '仰卧杠铃臂屈伸', sets: 3, reps: '10-15', restSeconds: 90 }
  ],
  [
    { exerciseId: 'neutral_grip_lat_pulldown', exerciseName: '对握下拉', sets: 4, reps: '8-12', restSeconds: 120, role: 'main', roleLabel: '主项' },
    { exerciseId: 'single_arm_machine_row', exerciseName: '单手器械划船', sets: 3, reps: '10-12', restSeconds: 120 },
    { exerciseId: 'cable_curl', exerciseName: '钢线弯举', sets: 3, reps: '12-15', restSeconds: 90 }
  ],
  [
    { exerciseId: 'front_squat', exerciseName: '颈前深蹲', sets: 4, reps: '6-10', restSeconds: 150, role: 'main', roleLabel: '主项' },
    { exerciseId: 'romanian_deadlift', exerciseName: '罗马尼亚硬拉', sets: 3, reps: '8-10', restSeconds: 150 },
    { exerciseId: 'bulgarian_split_squat', exerciseName: '保加利亚蹲', sets: 3, reps: '8-12', restSeconds: 120 }
  ],
  [
    { exerciseId: 'parallel_bar_dip', exerciseName: '双杠臂屈伸', sets: 3, reps: '8-12', restSeconds: 120 },
    { exerciseId: 'y_raise_lateral_raise', exerciseName: 'Y 字侧平举', sets: 3, reps: '12-15', restSeconds: 90 },
    { exerciseId: 'back_extension', exerciseName: '山羊挺身', sets: 3, reps: '12-15', restSeconds: 90 }
  ]
];

const exerciseCandidates = [
  { exerciseId: 'barbell_bench_press', exerciseName: '杠铃卧推', muscles: '胸部/三头', equipment: '杠铃/卧推凳' },
  { exerciseId: 'incline_dumbbell_press', exerciseName: '哑铃上斜卧推', muscles: '胸上部/肩前束', equipment: '哑铃/上斜凳' },
  { exerciseId: 'parallel_bar_dip', exerciseName: '双杠臂屈伸', muscles: '胸部/三头', equipment: '双杠/自重' },
  { exerciseId: 'lying_barbell_triceps_extension', exerciseName: '仰卧杠铃臂屈伸', muscles: '肱三头肌', equipment: '杠铃/卧推凳' },
  { exerciseId: 'y_raise_lateral_raise', exerciseName: 'Y 字侧平举', muscles: '三角肌中束', equipment: '哑铃' },
  { exerciseId: 'single_arm_cable_pulldown', exerciseName: '单手钢线下拉', muscles: '背阔肌', equipment: '龙门架/绳索' },
  { exerciseId: 'neutral_grip_lat_pulldown', exerciseName: '对握下拉', muscles: '背阔肌/二头', equipment: '高位下拉器' },
  { exerciseId: 'single_arm_machine_row', exerciseName: '单手器械划船', muscles: '背阔肌/中背', equipment: '器械' },
  { exerciseId: 'seated_elbow_out_row', exerciseName: '坐姿开肘划船', muscles: '后束/中背', equipment: '器械/绳索' },
  { exerciseId: 'cable_curl', exerciseName: '钢线弯举', muscles: '肱二头肌', equipment: '龙门架/绳索' },
  { exerciseId: 'single_leg_deadlift', exerciseName: '单腿硬拉', muscles: '臀腿后侧', equipment: '哑铃/自重' },
  { exerciseId: 'bulgarian_split_squat', exerciseName: '保加利亚蹲', muscles: '股四头肌/臀部', equipment: '哑铃/训练凳' },
  { exerciseId: 'front_squat', exerciseName: '颈前深蹲', muscles: '股四头肌', equipment: '杠铃/深蹲架' },
  { exerciseId: 'romanian_deadlift', exerciseName: '罗马尼亚硬拉', muscles: '腘绳肌/臀部', equipment: '杠铃/哑铃' },
  { exerciseId: 'back_extension', exerciseName: '山羊挺身', muscles: '竖脊肌/臀部', equipment: '罗马椅/自重' }
];

function readDrafts() {
  return wx.getStorageSync(DRAFT_STORAGE_KEY) || [];
}

function writeDrafts(drafts) {
  wx.setStorageSync(DRAFT_STORAGE_KEY, drafts);
}

function normalizeNumber(value, fallback, min = 1, max = 6) {
  const number = Number(value);
  if (!number || number < min) return fallback;
  return Math.min(number, max);
}

function buildLocalMockDraft(form) {
  const weeklyFrequency = normalizeNumber(form.weeklyFrequency, 3);
  const durationWeeks = normalizeNumber(form.durationWeeks, 4, 1, 24);
  const goal = form.goal || '增肌';
  const level = form.level || '新手';
  const days = Array.from({ length: weeklyFrequency }).map((_, index) => ({
    id: `ai_day_${Date.now()}_${index}`,
    name: `训练日 ${index + 1}`,
    focus: ['胸肩三头', '背部二头', '下肢后侧链', '综合补强'][index % 4],
    exercises: mockExerciseGroups[index % mockExerciseGroups.length].map((item) => ({
      ...defaultRule,
      ...item,
      weightRule: item.weightRule || defaultRule.weightRule,
      progressionRule: item.progressionRule || defaultRule.progressionRule
    }))
  }));

  const weight = normalizeNumber(form.profile && form.profile.current_weight_kg, 70, 30, 200);
  const protein = Math.round(weight * (goal === '增肌' ? 2.0 : 1.6));
  const dailyCalories = Math.round(weight * (goal === '增肌' ? 38 : 28));
  const fat = Math.round(weight * 0.9);
  const carbs = Math.round((dailyCalories - protein * 4 - fat * 9) / 4);

  const nutrition = {
    dailyCalories,
    protein,
    carbs,
    fat,
    tips: [
      `建议每日补充热量约 ${dailyCalories} 大卡，其中蛋白质目标为 ${protein} 克以支持肌肉恢复与生长。`,
      goal === '增肌' ? '建议练后 30 分钟内补充碳水化合物加乳清蛋白，保证体内正能量平衡。' : '建议适当控制高油脂外卖，每餐保证有绿叶蔬菜和足量的优质蛋白质。',
      '每天饮水至少 2-3 升，保证训练时体液平衡，促进代谢与体能恢复。'
    ]
  };

  // MVP 阶段只生成可编辑草稿，后续真实模型接入后仍沿用同一数据结构。
  return {
    id: `ai_draft_${Date.now()}`,
    name: form.planName || `AI ${goal}计划`,
    goal: [goal],
    level,
    durationWeeks,
    weeklyFrequency,
    equipmentTags: form.equipment ? form.equipment.split(/[，,\s]+/).filter(Boolean) : [],
    summary: `AI 草稿 · ${weeklyFrequency} 个训练日 · ${durationWeeks} 周`,
    overview: `这是一套偏稳妥的 ${goal} 草稿，先保证每个训练日都有清晰主线，再用辅助动作补足训练量。`,
    generationSteps: ['先按目标和训练频率确定训练日数量。', '再把推、拉、下肢和补强内容分配到不同训练日。', '最后控制组数、次数和休息时间，方便你直接进入编辑页微调。'],
    tips: ['第一次执行时不要急着加重量，先确认动作稳定。', '如果某个动作不适合当前器械，可以在编辑页替换。', '训练中有明显不适时，优先降低强度或停止该动作。'],
    nutrition,
    days
  };
}

function buildPrompt(form) {
  const weeklyFrequency = normalizeNumber(form.weeklyFrequency, 3);
  const durationWeeks = normalizeNumber(form.durationWeeks, 4, 1, 24);
  const goal = form.goal || '增肌';
  const level = form.level || '新手';
  const profile = form.profile || {};
  const genderText = { male: '男', female: '女', unknown: '未说明' }[profile.gender] || '未说明';

  return [
    '你是健身计划编排助手。请基于用户约束生成一个可执行训练计划草稿。',
    '只允许使用给定动作库里的 exerciseId，不要自创动作。',
    '只返回 JSON，不要 Markdown，不要解释。',
    `用户目标：${goal}`,
    `训练水平：${level}`,
    `用户性别：${genderText}`,
    `用户年龄：${profile.age ? profile.age + '岁' : '未填写'}`,
    `用户身高：${profile.height_cm ? profile.height_cm + 'cm' : '未填写'}`,
    `当前体重：${profile.current_weight_kg ? profile.current_weight_kg + 'kg' : '未填写'}`,
    `目标体重：${profile.target_weight_kg ? profile.target_weight_kg + 'kg' : '未填写'}`,
    `每周训练次数：${weeklyFrequency}`,
    `周期周数：${durationWeeks}`,
    `可用器械：${form.equipment || '不限'}`,
    `限制或偏好：${form.limitation || '无'}`,
    `计划名称：${form.planName || `AI ${goal}计划`}`,
    `动作库：${JSON.stringify(exerciseCandidates)}`,
    'JSON 字段顺序必须为：name, goal, level, durationWeeks, weeklyFrequency, equipmentTags, summary, overview, generationSteps, tips, nutrition, days。',
    'JSON 结构必须为：{"name":"","goal":[""],"level":"","durationWeeks":4,"weeklyFrequency":3,"equipmentTags":[],"summary":"","overview":"","generationSteps":[""],"tips":[""],"nutrition":{"dailyCalories":2300,"protein":140,"carbs":260,"fat":75,"tips":[""]},"days":[{"name":"","focus":"","exercises":[{"exerciseId":"","sets":3,"reps":"8-12","rpe":"8","restSeconds":120,"role":"main|assistance|isolation","roleLabel":"主项|辅助项|孤立项","weightRule":"","progressionRule":"","notes":""}]}]}',
    'overview 用亲和、简洁的中文说明这套计划为什么这样安排。',
    '如果用户提供了性别、年龄、身高、体重或目标体重，请自然代入 overview、tips 以及 nutrition.tips 中，不要机械罗列。',
    'nutrition 包含基于用户基本代谢和训练目标估算的每日摄入建议：dailyCalories 为每日推荐总热量（大卡，数字），protein 为蛋白质（克，数字），carbs 为碳水（克，数字），fat 为脂肪（克，数字），tips 为 2-3 条针对该用户和目标的饮食实操小建议。',
    'generationSteps 写给用户看的生成过程，不要写模型内部推理，使用“我先看了...然后...”这种自然表达。',
    'tips 给 3-5 条训练注意事项，语气温和，不制造焦虑。',
    '每个训练日至少 3 个动作；sets 必须是数字；restSeconds 必须是数字；reps 用中文页面可读的范围字符串。'
  ].join('\n');
}

function parseJsonText(text) {
  const trimmed = String(text || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < start) {
    throw new Error('模型未返回 JSON');
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function normalizeExercise(item) {
  const candidate = exerciseCandidates.find((exercise) => exercise.exerciseId === item.exerciseId);
  if (!candidate) return null;

  return {
    ...defaultRule,
    exerciseId: candidate.exerciseId,
    exerciseName: candidate.exerciseName,
    sets: normalizeNumber(item.sets, 3, 1, 8),
    reps: item.reps || '8-12',
    rpe: item.rpe || defaultRule.rpe,
    restSeconds: normalizeNumber(item.restSeconds, 120, 30, 300),
    role: item.role || defaultRule.role,
    roleLabel: item.roleLabel || defaultRule.roleLabel,
    weightRule: item.weightRule || defaultRule.weightRule,
    progressionRule: item.progressionRule || defaultRule.progressionRule,
    notes: item.notes || ''
  };
}

function normalizeAiDraft(rawDraft, form) {
  const weeklyFrequency = normalizeNumber(rawDraft.weeklyFrequency || form.weeklyFrequency, 3);
  const durationWeeks = normalizeNumber(rawDraft.durationWeeks || form.durationWeeks, 4, 1, 24);
  const days = (rawDraft.days || []).slice(0, weeklyFrequency).map((day, index) => ({
    id: `ai_day_${Date.now()}_${index}`,
    name: day.name || `训练日 ${index + 1}`,
    focus: day.focus || '综合训练',
    exercises: (day.exercises || []).map(normalizeExercise).filter(Boolean)
  })).filter((day) => day.exercises.length);

  if (!days.length) {
    throw new Error('模型返回的训练日为空');
  }

  // Parse and normalize nutrition recommendation
  const rawNutrition = rawDraft.nutrition || {};
  const nutrition = {
    dailyCalories: Number(rawNutrition.dailyCalories || rawNutrition.daily_calories || 0),
    protein: Number(rawNutrition.protein || 0),
    carbs: Number(rawNutrition.carbs || 0),
    fat: Number(rawNutrition.fat || 0),
    tips: Array.isArray(rawNutrition.tips) ? rawNutrition.tips : []
  };

  // Fallback formula in case AI returns 0 or invalid nutrition values
  if (!nutrition.dailyCalories || !nutrition.protein) {
    const goal = form.goal || '增肌';
    const weight = normalizeNumber(form.profile && form.profile.current_weight_kg, 70, 30, 200);
    nutrition.protein = nutrition.protein || Math.round(weight * (goal === '增肌' ? 2.0 : 1.6));
    nutrition.dailyCalories = nutrition.dailyCalories || Math.round(weight * (goal === '增肌' ? 38 : 28));
    nutrition.fat = nutrition.fat || Math.round(weight * 0.9);
    nutrition.carbs = nutrition.carbs || Math.round((nutrition.dailyCalories - nutrition.protein * 4 - nutrition.fat * 9) / 4);
    if (!nutrition.tips.length) {
      nutrition.tips = [
        `建议每日补充热量约 ${nutrition.dailyCalories} 大卡，其中蛋白质目标为 ${nutrition.protein} 克。`,
        goal === '增肌' ? '建议练后30分钟内补充碳水加乳清蛋白，保证正能量平衡。' : '建议适当控制高油脂外卖，每餐保证有绿叶蔬菜和足量蛋白质。',
        '每天饮水至少 2-3 升，保证训练时体液平衡与代谢畅通。'
      ];
    }
  }

  return {
    id: `ai_draft_${Date.now()}`,
    name: rawDraft.name || form.planName || `AI ${form.goal || '训练'}计划`,
    goal: Array.isArray(rawDraft.goal) && rawDraft.goal.length ? rawDraft.goal : [form.goal || '增肌'],
    level: rawDraft.level || form.level || '新手',
    durationWeeks,
    weeklyFrequency: days.length,
    equipmentTags: Array.isArray(rawDraft.equipmentTags)
      ? rawDraft.equipmentTags
      : (form.equipment ? String(form.equipment).split(/[，,\s]+/).filter(Boolean) : []),
    summary: rawDraft.summary || `AI 计划 · ${days.length} 个训练日 · ${durationWeeks} 周`,
    overview: rawDraft.overview || `这套计划会围绕 ${form.goal || '训练目标'} 安排训练日，你可以先看整体结构，再进入编辑页微调动作。`,
    generationSteps: Array.isArray(rawDraft.generationSteps) && rawDraft.generationSteps.length
      ? rawDraft.generationSteps
      : ['先确认目标、水平和每周训练次数。', '再选择动作库中匹配器械和肌群的动作。', '最后整理成可以编辑的训练日草稿。'],
    tips: Array.isArray(rawDraft.tips) && rawDraft.tips.length
      ? rawDraft.tips
      : ['先用保守重量熟悉动作。', '如果某个动作不舒服，可以在编辑页替换。', '训练记录会帮助后续逐步递进。'],
    nutrition,
    days
  };
}

function formatStreamPreview(text) {
  return String(text || '')
    .replace(/```json|```/g, '')
    .replace(/[{}[\]",]/g, ' ')
    .replace(/\\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(-220);
}

async function collectStreamText(res, onProgress) {
  let fullText = '';
  for await (const text of res.textStream) {
    fullText += text;
    onProgress && onProgress({
      status: 'AI 正在边生成边整理计划...',
      preview: formatStreamPreview(fullText)
    });
  }
  return fullText;
}

async function callMiniProgramAi(form, options = {}) {
  if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
    throw new Error('当前微信基础库不支持 CloudBase AI');
  }

  // 个人版云函数容易 3 秒超时，前端直连 CloudBase AI 作为真实模型通道。
  const onProgress = options.onProgress;
  const model = wx.cloud.extend.AI.createModel(AI_PROVIDER);
  const messages = [
    { role: 'system', content: '你只输出严格 JSON，所有字段必须适合微信小程序健身计划编辑器直接使用。' },
    { role: 'user', content: buildPrompt(form) }
  ];

  if (model.streamText) {
    onProgress && onProgress({ status: '正在根据目标和器械生成计划...' });
    const streamResult = await model.streamText({
      data: {
        model: AI_MODEL,
        messages
      }
    });
    return normalizeAiDraft(parseJsonText(await collectStreamText(streamResult, onProgress)), form);
  }

  onProgress && onProgress({ status: '正在生成计划草稿...' });
  const result = await model.generateText({
    model: AI_MODEL,
    messages
  });
  const text = result && result.choices && result.choices[0] && result.choices[0].message
    ? result.choices[0].message.content
    : '';
  return normalizeAiDraft(parseJsonText(text), form);
}

async function generateAiPlanDraft(form, options = {}) {
  try {
    return await callMiniProgramAi(form, options);
  } catch (error) {
    console.warn('小程序端 AI 生成失败，已回落本地 mock', error);
    return {
      ...buildLocalMockDraft(form),
      aiFallback: true,
      aiFallbackMessage: error.message || '真实 AI 暂不可用'
    };
  }
}

function saveAiPlanDraft(draft) {
  const id = draft.id || `ai_draft_${Date.now()}`;
  const nextDraft = {
    ...draft,
    id,
    updatedAt: new Date().toISOString()
  };
  const drafts = readDrafts().filter((item) => item.id !== id);
  writeDrafts([nextDraft].concat(drafts).slice(0, 10));
  return nextDraft;
}

function getAiPlanDraft(draftId) {
  return readDrafts().find((item) => item.id === draftId) || null;
}

module.exports = {
  generateAiPlanDraft,
  getAiPlanDraft,
  saveAiPlanDraft
};
