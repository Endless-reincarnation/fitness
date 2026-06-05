const muscles = [
  { id: 'pectoralis_major', name: '胸大肌' },
  { id: 'upper_pectoralis', name: '胸大肌上束' },
  { id: 'anterior_deltoid', name: '三角肌前束' },
  { id: 'middle_deltoid', name: '三角肌中束' },
  { id: 'posterior_deltoid', name: '三角肌后束' },
  { id: 'triceps_brachii', name: '肱三头肌' },
  { id: 'biceps_brachii', name: '肱二头肌' },
  { id: 'latissimus_dorsi', name: '背阔肌' },
  { id: 'middle_lower_trapezius', name: '中下斜方肌' },
  { id: 'rhomboids', name: '菱形肌' },
  { id: 'gluteus_maximus', name: '臀大肌' },
  { id: 'quadriceps', name: '股四头肌' },
  { id: 'hamstrings', name: '腘绳肌' },
  { id: 'erector_spinae', name: '竖脊肌' },
  { id: 'core', name: '核心肌群' }
];

const exercises = [
  {
    id: 'barbell_bench_press',
    name: '杠铃卧推',
    primaryMuscles: ['胸大肌'],
    secondaryMuscles: ['三角肌前束', '肱三头肌'],
    equipment: ['杠铃', '卧推凳'],
    steps: ['仰卧在卧推凳上，双脚踩稳地面。', '肩胛后缩下沉，控制杠铃下降。', '将杠铃推回起始位置。'],
    mistakes: ['肩膀前顶。', '臀部明显离凳。', '杠铃下降失控。']
  },
  {
    id: 'incline_dumbbell_press',
    name: '哑铃上斜卧推',
    primaryMuscles: ['胸大肌上束'],
    secondaryMuscles: ['三角肌前束', '肱三头肌'],
    equipment: ['哑铃', '上斜凳'],
    steps: ['训练凳调到上斜角度。', '控制哑铃下降到胸上部两侧。', '向上推起，顶部不要猛烈碰撞。'],
    mistakes: ['凳子角度过高。', '手腕后折。', '下降过快。']
  },
  {
    id: 'parallel_bar_dip',
    name: '双杠臂屈伸',
    primaryMuscles: ['胸大肌', '肱三头肌'],
    secondaryMuscles: ['三角肌前束'],
    equipment: ['双杠', '自重'],
    steps: ['双手撑住双杠。', '控制身体下降。', '推起身体回到起始位置。'],
    mistakes: ['下降过深。', '身体晃动。', '耸肩完成动作。']
  },
  {
    id: 'lying_barbell_triceps_extension',
    name: '仰卧杠铃臂屈伸',
    primaryMuscles: ['肱三头肌'],
    secondaryMuscles: [],
    equipment: ['杠铃', '卧推凳'],
    steps: ['仰卧在训练凳上。', '上臂保持相对固定。', '收缩肱三头肌伸直手臂。'],
    mistakes: ['上臂大幅摆动。', '重量过大。']
  },
  {
    id: 'y_raise_lateral_raise',
    name: 'Y 字侧平举',
    primaryMuscles: ['三角肌中束'],
    secondaryMuscles: ['三角肌前束'],
    equipment: ['哑铃'],
    steps: ['双手持轻哑铃。', '沿斜前方抬起形成 Y 字轨迹。', '控制下放。'],
    mistakes: ['耸肩借力。', '身体后仰甩动。']
  },
  {
    id: 'single_arm_cable_pulldown',
    name: '单手钢线下拉',
    primaryMuscles: ['背阔肌'],
    secondaryMuscles: ['肱二头肌'],
    equipment: ['龙门架', '绳索'],
    steps: ['单手握住绳索把手。', '肩胛先下沉。', '手肘向身体侧后方拉下。'],
    mistakes: ['用手臂硬拉。', '耸肩。']
  },
  {
    id: 'neutral_grip_lat_pulldown',
    name: '对握下拉',
    primaryMuscles: ['背阔肌'],
    secondaryMuscles: ['肱二头肌', '中下斜方肌'],
    equipment: ['高位下拉器'],
    steps: ['坐稳并固定大腿。', '肩胛下沉。', '将把手拉向上胸区域。'],
    mistakes: ['身体后仰过多。', '顶部完全放松耸肩。']
  },
  {
    id: 'single_arm_machine_row',
    name: '单手器械划船',
    primaryMuscles: ['背阔肌'],
    secondaryMuscles: ['中下斜方肌', '肱二头肌'],
    equipment: ['器械'],
    steps: ['调整座椅和胸垫。', '躯干贴稳。', '手肘向后拉。'],
    mistakes: ['身体离开胸垫借力。', '只用手臂拉。']
  },
  {
    id: 'seated_elbow_out_row',
    name: '坐姿开肘划船',
    primaryMuscles: ['三角肌后束', '中下斜方肌', '菱形肌'],
    secondaryMuscles: ['背阔肌', '肱二头肌'],
    equipment: ['器械', '绳索'],
    steps: ['坐姿保持躯干稳定。', '手肘略打开向后划动。', '终点感受肩胛后缩。'],
    mistakes: ['耸肩。', '腰部后仰借力。']
  },
  {
    id: 'cable_curl',
    name: '钢线弯举',
    primaryMuscles: ['肱二头肌'],
    secondaryMuscles: [],
    equipment: ['龙门架', '绳索'],
    steps: ['站稳并握住绳索把手。', '上臂贴近身体两侧。', '控制离心回到起始位置。'],
    mistakes: ['身体前后摆动。', '上臂大幅移动。']
  },
  {
    id: 'single_leg_deadlift',
    name: '单腿硬拉',
    primaryMuscles: ['腘绳肌', '臀大肌'],
    secondaryMuscles: ['竖脊肌', '核心肌群'],
    equipment: ['哑铃', '自重'],
    steps: ['单脚站稳。', '髋部向后折叠。', '收缩臀腿回到站立。'],
    mistakes: ['骨盆明显旋转。', '弓背。']
  },
  {
    id: 'bulgarian_split_squat',
    name: '保加利亚蹲',
    primaryMuscles: ['股四头肌', '臀大肌'],
    secondaryMuscles: ['腘绳肌', '核心肌群'],
    equipment: ['哑铃', '训练凳'],
    steps: ['后脚搭在训练凳上。', '身体垂直下蹲。', '前脚发力站起。'],
    mistakes: ['前脚距离过近。', '膝盖内扣。']
  },
  {
    id: 'front_squat',
    name: '颈前深蹲',
    primaryMuscles: ['股四头肌'],
    secondaryMuscles: ['臀大肌', '核心肌群', '竖脊肌'],
    equipment: ['杠铃', '深蹲架'],
    steps: ['杠铃置于肩前侧。', '保持躯干稳定下蹲。', '脚掌均匀发力站起。'],
    mistakes: ['肘部下掉。', '塌腰或弓背。']
  },
  {
    id: 'romanian_deadlift',
    name: '罗马尼亚硬拉',
    primaryMuscles: ['腘绳肌', '臀大肌'],
    secondaryMuscles: ['竖脊肌', '核心肌群'],
    equipment: ['杠铃', '哑铃'],
    steps: ['双脚站稳。', '髋部向后推。', '感受后侧链拉伸后站起。'],
    mistakes: ['弓背下放。', '重量离身体太远。']
  },
  {
    id: 'back_extension',
    name: '山羊挺身',
    primaryMuscles: ['竖脊肌', '臀大肌'],
    secondaryMuscles: ['腘绳肌'],
    equipment: ['罗马椅', '自重'],
    steps: ['调整罗马椅高度。', '身体从髋部折叠下放。', '回到身体接近直线的位置。'],
    mistakes: ['顶部过度反弓。', '快速甩动。']
  }
];

const trainingRules = {
  main: {
    label: '主项',
    weightRule: '选择能完成目标次数且保留约 2 次余量的重量，动作质量优先。',
    progressionRule: '如果所有组都达到次数上限且 RPE 不高于 8，下次小幅加重 2.5kg；否则维持重量。'
  },
  assistance: {
    label: '辅助项',
    weightRule: '选择中等重量，能稳定完成目标次数，不需要每组做到力竭。',
    progressionRule: '如果所有组都达到目标次数上限，下次可小幅加重或增加 1-2 次；动作变形则维持。'
  },
  isolation: {
    label: '孤立项',
    weightRule: '使用小重量控制动作轨迹，最后 1-2 组可以接近力竭。',
    progressionRule: '优先增加次数和控制感，连续稳定达到上限后再小幅加重。'
  }
};

function prescribe(item, role) {
  // 计划动作带上训练处方，页面可直接展示和生成递进建议。
  return {
    ...item,
    role,
    weightRule: trainingRules[role].weightRule,
    progressionRule: trainingRules[role].progressionRule,
    roleLabel: trainingRules[role].label
  };
}

const plans = [
  {
    id: 'plan_beginner_three_day_split_2026_v1',
    name: '新手三分化增肌计划',
    goal: ['增肌', '力量基础', '形体塑造'],
    level: '新手',
    durationWeeks: 12,
    weeklyFrequency: 3,
    equipmentTags: ['杠铃', '哑铃', '龙门架', '器械', '双杠'],
    summary: '面向新手的三分化训练计划，兼顾力量提升、形体塑造和动作质量。',
    days: [
      {
        id: 'day_chest_front_delt_triceps',
        name: '胸肩三头',
        focus: '胸部、三角肌前束、肱三头肌',
        exercises: [
          prescribe({ exerciseId: 'barbell_bench_press', sets: 4, reps: '8-12', rpe: '8', restSeconds: 150 }, 'main'),
          prescribe({ exerciseId: 'incline_dumbbell_press', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'parallel_bar_dip', sets: 3, reps: '8-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'lying_barbell_triceps_extension', sets: 3, reps: '10-15', rpe: '8-9', restSeconds: 90 }, 'isolation'),
          prescribe({ exerciseId: 'y_raise_lateral_raise', sets: 3, reps: '12-15', rpe: '8-9', restSeconds: 90 }, 'isolation')
        ]
      },
      {
        id: 'day_back_rear_delt_biceps',
        name: '背肩后二头',
        focus: '背部、三角肌后束、肱二头肌',
        exercises: [
          prescribe({ exerciseId: 'single_arm_cable_pulldown', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'neutral_grip_lat_pulldown', sets: 3, reps: '8-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'single_arm_machine_row', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'seated_elbow_out_row', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'cable_curl', sets: 3, reps: '12-15', rpe: '8-9', restSeconds: 90 }, 'isolation')
        ]
      },
      {
        id: 'day_lower_posterior_chain',
        name: '下肢后侧链',
        focus: '臀腿、腘绳肌、竖脊肌和髋关节能力',
        exercises: [
          prescribe({ exerciseId: 'single_leg_deadlift', sets: 3, reps: '8-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'bulgarian_split_squat', sets: 3, reps: '8-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'front_squat', sets: 4, reps: '6-10', rpe: '8', restSeconds: 150 }, 'main'),
          prescribe({ exerciseId: 'romanian_deadlift', sets: 4, reps: '8-10', rpe: '8', restSeconds: 150 }, 'main'),
          prescribe({ exerciseId: 'back_extension', sets: 3, reps: '12-15', rpe: '8-9', restSeconds: 90 }, 'isolation')
        ]
      }
    ]
  }
];

function getExercise(exerciseId) {
  // 本地 mock 阶段直接从数组查找，接云数据库后替换为集合查询。
  return exercises.find((item) => item.id === exerciseId);
}

module.exports = {
  muscles,
  exercises,
  plans,
  getExercise
};
