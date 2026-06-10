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
    "id": "barbell_bench_press",
    "name": "杠铃卧推",
    "primaryMuscles": [
      "胸大肌"
    ],
    "secondaryMuscles": [
      "三角肌前束",
      "肱三头肌"
    ],
    "equipment": [
      "杠铃",
      "卧推凳"
    ],
    "steps": [
      "仰卧在卧推凳上，双脚踩稳地面。",
      "握距略宽于肩，肩胛后缩下沉。",
      "控制杠铃下降到胸部附近。",
      "保持身体稳定，将杠铃推回起始位置。"
    ],
    "mistakes": [
      "肩膀前顶。",
      "臀部明显离凳。",
      "杠铃下降失控。"
    ]
  },
  {
    "id": "incline_dumbbell_press",
    "name": "哑铃上斜卧推",
    "primaryMuscles": [
      "胸大肌上束"
    ],
    "secondaryMuscles": [
      "三角肌前束",
      "肱三头肌"
    ],
    "equipment": [
      "哑铃",
      "上斜凳"
    ],
    "steps": [
      "将训练凳调到上斜角度。",
      "双手持哑铃，肩胛保持稳定。",
      "控制哑铃下降到胸上部两侧。",
      "向上推起哑铃，顶部不要猛烈碰撞。"
    ],
    "mistakes": [
      "凳子角度过高导致肩部代偿。",
      "手腕后折。",
      "下降过快。"
    ]
  },
  {
    "id": "parallel_bar_dip",
    "name": "双杠臂屈伸",
    "primaryMuscles": [
      "胸大肌",
      "肱三头肌"
    ],
    "secondaryMuscles": [
      "三角肌前束"
    ],
    "equipment": [
      "双杠",
      "自重"
    ],
    "steps": [
      "双手撑住双杠，身体保持稳定。",
      "控制身体下降，肘部自然弯曲。",
      "下降到肩部舒适范围内。",
      "推起身体回到起始位置。"
    ],
    "mistakes": [
      "下降过深导致肩部不适。",
      "身体晃动。",
      "耸肩完成动作。"
    ]
  },
  {
    "id": "lying_barbell_triceps_extension",
    "name": "仰卧杠铃臂屈伸",
    "primaryMuscles": [
      "肱三头肌"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "杠铃",
      "卧推凳"
    ],
    "steps": [
      "仰卧在训练凳上，双手握杠。",
      "上臂保持相对固定。",
      "屈肘让杠铃向额头或头后下降。",
      "收缩肱三头肌伸直手臂。"
    ],
    "mistakes": [
      "上臂大幅摆动。",
      "使用过大重量。",
      "手腕不稳。"
    ]
  },
  {
    "id": "y_raise_lateral_raise",
    "name": "Y 字侧平举",
    "primaryMuscles": [
      "三角肌中束"
    ],
    "secondaryMuscles": [
      "三角肌前束"
    ],
    "equipment": [
      "哑铃"
    ],
    "steps": [
      "双手持轻哑铃，身体保持稳定。",
      "手臂沿身体斜前方抬起形成 Y 字轨迹。",
      "抬到肩部舒适高度后短暂停顿。",
      "控制下放回起始位置。"
    ],
    "mistakes": [
      "耸肩借力。",
      "身体后仰甩动。",
      "重量过大导致轨迹变形。"
    ]
  },
  {
    "id": "single_arm_cable_pulldown",
    "name": "单手钢线下拉",
    "primaryMuscles": [
      "背阔肌"
    ],
    "secondaryMuscles": [
      "肱二头肌"
    ],
    "equipment": [
      "龙门架",
      "绳索"
    ],
    "steps": [
      "单手握住绳索把手。",
      "身体保持稳定，肩胛先下沉。",
      "将手肘向身体侧后方拉下。",
      "控制还原并保持背阔肌张力。"
    ],
    "mistakes": [
      "用手臂硬拉。",
      "耸肩。",
      "身体过度旋转。"
    ]
  },
  {
    "id": "neutral_grip_lat_pulldown",
    "name": "对握下拉",
    "primaryMuscles": [
      "背阔肌"
    ],
    "secondaryMuscles": [
      "肱二头肌",
      "中下斜方肌"
    ],
    "equipment": [
      "高位下拉器",
      "器械"
    ],
    "steps": [
      "坐稳并固定大腿。",
      "双手对握把手，肩胛下沉。",
      "将把手拉向上胸区域。",
      "控制回放到手臂伸展但不耸肩。"
    ],
    "mistakes": [
      "身体后仰过多。",
      "拉到腹部导致轨迹偏移。",
      "顶部完全放松耸肩。"
    ]
  },
  {
    "id": "single_arm_machine_row",
    "name": "单手器械划船",
    "primaryMuscles": [
      "背阔肌"
    ],
    "secondaryMuscles": [
      "中下斜方肌",
      "肱二头肌"
    ],
    "equipment": [
      "器械"
    ],
    "steps": [
      "调整座椅和胸垫位置。",
      "单手握住把手，躯干贴稳。",
      "手肘向后拉，感受背部收缩。",
      "控制回放，不让重量片猛烈碰撞。"
    ],
    "mistakes": [
      "身体离开胸垫借力。",
      "只用手臂拉。",
      "左右重量差异过大。"
    ]
  },
  {
    "id": "seated_elbow_out_row",
    "name": "坐姿开肘划船",
    "primaryMuscles": [
      "三角肌后束",
      "中下斜方肌",
      "菱形肌"
    ],
    "secondaryMuscles": [
      "背阔肌",
      "肱二头肌"
    ],
    "equipment": [
      "器械",
      "绳索"
    ],
    "steps": [
      "坐姿保持躯干稳定。",
      "手肘略打开，向后划动。",
      "终点感受肩胛后缩。",
      "控制还原，保持胸椎伸展。"
    ],
    "mistakes": [
      "耸肩。",
      "腰部后仰借力。",
      "手肘轨迹过低。"
    ]
  },
  {
    "id": "cable_curl",
    "name": "钢线弯举",
    "primaryMuscles": [
      "肱二头肌"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "龙门架",
      "绳索"
    ],
    "steps": [
      "站稳并握住绳索把手。",
      "上臂贴近身体两侧。",
      "屈肘将把手向上拉起。",
      "控制离心回到起始位置。"
    ],
    "mistakes": [
      "身体前后摆动。",
      "上臂大幅移动。",
      "下放过快。"
    ]
  },
  {
    "id": "single_leg_deadlift",
    "name": "单腿硬拉",
    "primaryMuscles": [
      "腘绳肌",
      "臀大肌"
    ],
    "secondaryMuscles": [
      "竖脊肌",
      "核心肌群"
    ],
    "equipment": [
      "哑铃",
      "自重"
    ],
    "steps": [
      "单脚站稳，手持哑铃或徒手。",
      "髋部向后折叠，躯干前倾。",
      "后侧腿自然向后伸保持平衡。",
      "收缩臀腿回到站立。"
    ],
    "mistakes": [
      "骨盆明显旋转。",
      "弓背。",
      "膝盖锁死。"
    ]
  },
  {
    "id": "bulgarian_split_squat",
    "name": "保加利亚蹲",
    "primaryMuscles": [
      "股四头肌",
      "臀大肌"
    ],
    "secondaryMuscles": [
      "腘绳肌",
      "核心肌群"
    ],
    "equipment": [
      "哑铃",
      "训练凳"
    ],
    "steps": [
      "后脚搭在训练凳上，前脚站稳。",
      "身体垂直下蹲，控制膝盖轨迹。",
      "下降到舒适深度。",
      "前脚发力站起。"
    ],
    "mistakes": [
      "前脚距离过近。",
      "膝盖内扣。",
      "身体晃动。"
    ]
  },
  {
    "id": "front_squat",
    "name": "颈前深蹲",
    "primaryMuscles": [
      "股四头肌"
    ],
    "secondaryMuscles": [
      "臀大肌",
      "核心肌群",
      "竖脊肌"
    ],
    "equipment": [
      "杠铃",
      "深蹲架"
    ],
    "steps": [
      "杠铃置于肩前侧，肘部抬高。",
      "双脚站距约与肩同宽。",
      "保持躯干稳定下蹲。",
      "脚掌均匀发力站起。"
    ],
    "mistakes": [
      "肘部下掉导致杠铃前滑。",
      "塌腰或弓背。",
      "膝盖内扣。"
    ]
  },
  {
    "id": "romanian_deadlift",
    "name": "罗马尼亚硬拉",
    "primaryMuscles": [
      "腘绳肌",
      "臀大肌"
    ],
    "secondaryMuscles": [
      "竖脊肌",
      "核心肌群"
    ],
    "equipment": [
      "杠铃",
      "哑铃"
    ],
    "steps": [
      "双脚站稳，双手持杠铃或哑铃。",
      "保持背部中立，髋部向后推。",
      "重量沿腿部附近下放。",
      "感受后侧链拉伸后伸髋站起。"
    ],
    "mistakes": [
      "弓背下放。",
      "膝盖弯曲过多变成深蹲。",
      "重量离身体太远。"
    ]
  },
  {
    "id": "back_extension",
    "name": "山羊挺身",
    "primaryMuscles": [
      "竖脊肌",
      "臀大肌"
    ],
    "secondaryMuscles": [
      "腘绳肌"
    ],
    "equipment": [
      "罗马椅",
      "自重"
    ],
    "steps": [
      "调整罗马椅高度，让髋部能自由活动。",
      "身体从髋部折叠下放。",
      "收缩臀部和下背部抬起身体。",
      "回到身体接近直线的位置即可。"
    ],
    "mistakes": [
      "顶部过度反弓。",
      "快速甩动。",
      "只用腰部发力。"
    ]
  },
  {
    "id": "dumbbell_bench_press",
    "name": "哑铃平板卧推",
    "primaryMuscles": [
      "胸大肌"
    ],
    "secondaryMuscles": [
      "三角肌前束",
      "肱三头肌"
    ],
    "equipment": [
      "哑铃",
      "卧推凳"
    ],
    "steps": [
      "仰卧在卧推凳上，双手持哑铃置于胸部两侧。",
      "肩胛骨向后收紧，双脚踩实地面。",
      "呼气时向上推起哑铃，双臂伸直，两哑铃微靠拢。",
      "吸气时缓慢控制哑铃下降到起始位置，感受胸肌拉伸。"
    ],
    "mistakes": [
      "哑铃推起时猛烈相撞。",
      "大臂与身体夹角过大（90度）压迫肩关节。",
      "耸肩。"
    ]
  },
  {
    "id": "incline_barbell_press",
    "name": "杠铃上斜卧推",
    "primaryMuscles": [
      "胸大肌上束"
    ],
    "secondaryMuscles": [
      "三角肌前束",
      "肱三头肌"
    ],
    "equipment": [
      "杠铃",
      "上斜凳"
    ],
    "steps": [
      "上斜凳调至30-45度，仰卧双脚踩实地面。",
      "双手略宽于肩，正握杠铃，肩胛收紧下沉。",
      "控制将杠铃垂直下放到锁骨至胸口上部位置。",
      "收缩胸肌向上推回，手肘保持微屈，不要完全锁死。"
    ],
    "mistakes": [
      "杠铃下放位置过低（碰到中下胸）。",
      "手肘外展过度，借力过多。",
      "起桥过度臀部悬空。"
    ]
  },
  {
    "id": "decline_dumbbell_press",
    "name": "哑铃下斜卧推",
    "primaryMuscles": [
      "胸大肌"
    ],
    "secondaryMuscles": [
      "三角肌前束",
      "肱三头肌"
    ],
    "equipment": [
      "哑铃",
      "下斜凳"
    ],
    "steps": [
      "固定双脚于下斜板上，仰卧在凳上。",
      "双手持哑铃置于下胸部两侧，手心朝前。",
      "向上推起哑铃至双臂伸直，呼气。",
      "缓慢下放哑铃至身体两侧，胸大肌充分拉伸，吸气。"
    ],
    "mistakes": [
      "哑铃下放轨迹离锁骨太近，压迫颈部。",
      "起落速度过快。",
      "腰椎反弓过大。"
    ]
  },
  {
    "id": "cable_crossover",
    "name": "龙门架夹胸",
    "primaryMuscles": [
      "胸大肌"
    ],
    "secondaryMuscles": [
      "三角肌前束"
    ],
    "equipment": [
      "龙门架",
      "拉索"
    ],
    "steps": [
      "将拉索滑轮调至高位或中位，双手握把手，身体前倾，弓步站立。",
      "手肘微屈保持角度，大臂打开呈大飞鸟状。",
      "胸大肌收缩，双手合拢向前方下侧画弧，双手合拢顶峰收缩。",
      "缓慢控制拉索离心恢复到大臂伸展，保持张力。"
    ],
    "mistakes": [
      "手肘过度屈伸，做成肘屈伸代偿。",
      "耸肩，或者利用腰椎前后晃动借力。",
      "还原时速度过快拉伤肩袖。"
    ]
  },
  {
    "id": "dumbbell_fly",
    "name": "哑铃飞鸟",
    "primaryMuscles": [
      "胸大肌"
    ],
    "secondaryMuscles": [
      "三角肌前束"
    ],
    "equipment": [
      "哑铃",
      "卧推凳"
    ],
    "steps": [
      "仰卧在平板凳上，双手正握哑铃，双臂在胸前上方伸直，掌心相对。",
      "手肘保持微屈固定，缓慢向身体两侧呈弧线下放哑铃，感受胸部拉伸。",
      "至手肘基本与凳面平行，不要过低。",
      "收缩胸大肌，将哑铃沿同样孤线拉回原位，顶峰挤压。"
    ],
    "mistakes": [
      "下放过低拉伤肩关节前侧。",
      "在顶点两只哑铃碰撞。",
      "动作中手肘弯曲角度不断变化。"
    ]
  },
  {
    "id": "pec_deck_fly",
    "name": "蝴蝶机夹胸",
    "primaryMuscles": [
      "胸大肌"
    ],
    "secondaryMuscles": [
      "三角肌前束"
    ],
    "equipment": [
      "器械"
    ],
    "steps": [
      "坐稳在器械座上，背部紧贴靠背，双手握把手，大臂平行地面，手肘微屈。",
      "吸气挺胸，呼气时收缩胸肌将双手拉杆向中间合拢。",
      "在中间位置顶峰收缩 1-2 秒，挤压胸大肌。",
      "缓慢控制拉杆返回，至大臂后摆到胸部拉伸极限，保持配重片不相撞。"
    ],
    "mistakes": [
      "圆肩弓背夹胸，胸肌无法发力。",
      "手肘完全伸直，压力集中在肘关节。",
      "耸肩，斜方肌代偿。"
    ]
  },
  {
    "id": "push_up",
    "name": "标准俯卧撑",
    "primaryMuscles": [
      "胸大肌"
    ],
    "secondaryMuscles": [
      "三角肌前束",
      "肱三头肌",
      "核心肌群"
    ],
    "equipment": [
      "自重"
    ],
    "steps": [
      "双手撑地，略宽于肩，脚尖着地，身体从头到脚呈一条直线。",
      "收紧腹部和臀部核心肌群，骨盆中立。",
      "控制身体匀速下降，手肘向侧后方折叠，至胸口接近地面。",
      "双手推地发力推起，保持躯干不塌腰不拱背，手肘微屈。"
    ],
    "mistakes": [
      "塌腰或拱屁股，核心松懈。",
      "手肘向两侧外展成90度（压迫肩膀）。",
      "脖子前伸“低头”俯卧撑。"
    ]
  },
  {
    "id": "smith_bench_press",
    "name": "史密斯卧推",
    "primaryMuscles": [
      "胸大肌"
    ],
    "secondaryMuscles": [
      "三角肌前束",
      "肱三头肌"
    ],
    "equipment": [
      "史密斯",
      "卧推凳"
    ],
    "steps": [
      "平躺在史密斯架内的卧推凳上，使杠铃轨迹垂直对准胸部中部。",
      "双手握杠，略宽于肩，旋转解锁杠铃安全挂钩。",
      "控制杠铃稳定下放，直到接近胸大肌，吸气。",
      "呼气推起杠铃至手臂伸直（肘微弯），专注于胸肌顶峰收缩。"
    ],
    "mistakes": [
      "躺的位置不对导致关节轨迹别扭。",
      "推起时耸肩，导致上背部不稳定。",
      "手肘锁死。"
    ]
  },
  {
    "id": "incline_dumbbell_fly",
    "name": "哑铃上斜飞鸟",
    "primaryMuscles": [
      "胸大肌上束"
    ],
    "secondaryMuscles": [
      "三角肌前束"
    ],
    "equipment": [
      "哑铃",
      "上斜凳"
    ],
    "steps": [
      "斜凳调整为30度，仰卧在凳上，双手合拢双手托哑铃于上胸正上方。",
      "手肘保持微屈锁定，缓慢将哑铃朝身体两侧呈弧形打开降下。",
      "至胸部上沿拉伸饱满时，手肘不低于肩膀面。",
      "收缩上胸肌群，沿弧线拉回哑铃至起点，避免碰撞。"
    ],
    "mistakes": [
      "大臂下放过低拉伤上胸附着点。",
      "在顶部撞击哑铃借力休息。",
      "手肘屈伸成了哑铃推举。"
    ]
  },
  {
    "id": "smith_incline_press",
    "name": "史密斯上斜卧推",
    "primaryMuscles": [
      "胸大肌上束"
    ],
    "secondaryMuscles": [
      "三角肌前束",
      "肱三头肌"
    ],
    "equipment": [
      "史密斯",
      "上斜凳"
    ],
    "steps": [
      "斜凳调整至30度并放置在史密斯架中心，平躺后杠铃应悬在胸肌上沿正上方。",
      "双手握距略宽于肩，转动杠铃解锁安全钩。",
      "吸气将杠铃缓慢下放到距离锁骨约2-3厘米处，手肘向斜下方打开。",
      "呼气推起杠铃，手腕保持中立。"
    ],
    "mistakes": [
      "杠铃滑降到喉部（太高）或中胸（太低）。",
      "动作中耸肩代偿。",
      "推起至顶点手肘外翻。"
    ]
  },
  {
    "id": "barbell_deadlift",
    "name": "杠铃硬拉",
    "primaryMuscles": [
      "竖脊肌",
      "臀大肌"
    ],
    "secondaryMuscles": [
      "腘绳肌",
      "核心肌群",
      "背阔肌"
    ],
    "equipment": [
      "杠铃"
    ],
    "steps": [
      "站立双脚同肩宽，杠铃杆贴近胫骨，俯身正握或正反握，背部拉直。",
      "髋部下沉，挺胸下沉肩膀，拉紧杠铃，全身紧绷张力拉满。",
      "脚掌蹬地发力，伸髋伸膝，将杠铃贴着腿部笔直拉起直到身体直立。",
      "锁死髋部，缓慢控制杠铃顺着腿部下放，直到片着地重新校准姿势。"
    ],
    "mistakes": [
      "弓背（圆背）拉起导致腰椎受压极大。",
      "杠铃离身体太远，增加腰椎剪切力。",
      "直立时腰椎过度反弓（向后猛拧腰）。"
    ]
  },
  {
    "id": "pull_up",
    "name": "引体向上",
    "primaryMuscles": [
      "背阔肌"
    ],
    "secondaryMuscles": [
      "中下斜方肌",
      "肱二头肌",
      "菱形肌"
    ],
    "equipment": [
      "自重"
    ],
    "steps": [
      "双手略宽于肩正手握悬挂于单杠上，身体完全舒展。",
      "吸气挺胸，肩胛下沉收紧，核心收紧。",
      "背阔肌收缩发力，肘部指向地面拉起身体，直到下巴超过单杠。",
      "呼气控制身体缓慢离心下降到初始位置，保持背部紧绷。"
    ],
    "mistakes": [
      "靠身体摇晃（Kipping）强行甩上去。",
      "耸肩用小臂和二头肌拉起。",
      "下放到最底部时完全悬挂关节放松，拉伤肩关节。"
    ]
  },
  {
    "id": "barbell_bent_over_row",
    "name": "杠铃俯身划船",
    "primaryMuscles": [
      "背阔肌",
      "中下斜方肌"
    ],
    "secondaryMuscles": [
      "菱形肌",
      "三角肌后束",
      "肱二头肌"
    ],
    "equipment": [
      "杠铃"
    ],
    "steps": [
      "双脚同肩宽站立，双手略宽于肩正握或反握杠铃拉起。",
      "微屈膝，髋部后推俯身约45度（或更低），背部挺直，杠铃悬垂于膝盖前。",
      "背部发力，将杠铃沿着大腿拉向小腹或肚脐，肘部收紧后摆。",
      "顶峰收缩后，控制下放杠铃直到手臂伸直，背阔肌完全拉伸。"
    ],
    "mistakes": [
      "弓背，或者站得太直变成了耸肩。",
      "借用膝盖弹动或身体站起的力量拉起杠铃。",
      "杠铃砸向胸部而不是小腹。"
    ]
  },
  {
    "id": "one_arm_dumbbell_row",
    "name": "哑铃单臂划船",
    "primaryMuscles": [
      "背阔肌"
    ],
    "secondaryMuscles": [
      "中下斜方肌",
      "菱形肌",
      "肱二头肌"
    ],
    "equipment": [
      "哑铃",
      "卧推凳"
    ],
    "steps": [
      "单膝与单手支撑在训练凳上，身体平行地面，另一脚踩实地面。",
      "外侧手握哑铃，大臂自然下垂放松，肩胛沉稳。",
      "后撤肘部将哑铃拉向髋骨方向，大臂贴近身体，吸气。",
      "顶峰收缩 1 秒，感受单侧背肌，缓慢送回下放，呼气。"
    ],
    "mistakes": [
      "肘部向上拉而不是向后拉（拉向胸口而非大腿根）。",
      "身体脊柱扭转借力。",
      "耸肩。"
    ]
  },
  {
    "id": "wide_grip_lat_pulldown",
    "name": "宽握高位下拉",
    "primaryMuscles": [
      "背阔肌"
    ],
    "secondaryMuscles": [
      "菱形肌",
      "中下斜方肌",
      "肱二头肌"
    ],
    "equipment": [
      "高位下拉器",
      "器械"
    ],
    "steps": [
      "坐在下拉机坐垫上，膝盖垫卡实，双手宽握正握横杠，身体微后仰。",
      "肩胛骨先做下沉，挺胸锁死肩关节。",
      "背阔肌收缩，手肘拉向肋骨两侧，将横杠拉至下巴或锁骨位置。",
      "控制离心，吸气缓慢恢复至杠铃杆回到最高点。"
    ],
    "mistakes": [
      "猛烈后仰身体用体重把杠拉下。",
      "杠铃杆拉到肚子下面导致小臂变形代偿。",
      "耸肩借力。"
    ]
  },
  {
    "id": "straight_arm_pulldown",
    "name": "直臂下拉",
    "primaryMuscles": [
      "背阔肌"
    ],
    "secondaryMuscles": [
      "肱三头肌",
      "核心肌群"
    ],
    "equipment": [
      "龙门架",
      "绳索"
    ],
    "steps": [
      "面对拉索滑轮站立，高位悬挂直杆或绳索，双手同肩宽正握，后退一两步，上身前倾约30度。",
      "双臂基本伸直，肘关节微屈并锁死。",
      "背阔肌发力，沿着弧线将直杆垂直拉向大腿前侧。",
      "在最下端顶峰收缩，控制拉索慢慢返回原位，双手举过头顶保持张力。"
    ],
    "mistakes": [
      "手肘弯曲，做成肱三头肌下压。",
      "腰椎摇晃借力。",
      "大臂没有压迫躯干。"
    ]
  },
  {
    "id": "seated_cable_row",
    "name": "坐姿绳索划船",
    "primaryMuscles": [
      "中下斜方肌",
      "菱形肌",
      "背阔肌"
    ],
    "secondaryMuscles": [
      "肱二头肌",
      "三角肌后束"
    ],
    "equipment": [
      "器械",
      "绳索"
    ],
    "steps": [
      "坐在划船机上，双脚踩稳踏板，微屈膝，双手握把手，挺直躯干。",
      "吸气挺胸，沉肩，后摆手肘将拉索拉至肚脐上方。",
      "肘部贴紧体侧，肩胛骨用力向中间靠拢挤压。",
      "缓慢控制拉索拉长背部肌肉，上身微前倾拉伸，不弓背。"
    ],
    "mistakes": [
      "拉索回放时耸肩弓背弯腰。",
      "拉起时身体过度后仰，利用惯性扯拉索。",
      "膝盖完全绷直。"
    ]
  },
  {
    "id": "t_bar_row",
    "name": "T 杠划船",
    "primaryMuscles": [
      "中下斜方肌",
      "背阔肌"
    ],
    "secondaryMuscles": [
      "菱形肌",
      "肱二头肌",
      "竖脊肌"
    ],
    "equipment": [
      "杠铃",
      "器械"
    ],
    "steps": [
      "双脚站在T杆平台两侧，微屈膝下蹲，背部拉直，双手握把手。",
      "呼气收缩背部大肌群，拉起重物至手肘超过躯干两侧。",
      "顶部用力挤压背部中间，大臂贴近大腿外侧。",
      "吸气有控制地将杠铃放回，背阔肌和斜方肌充分舒展，杠铃片不触地。"
    ],
    "mistakes": [
      "利用双腿弹动和腰部挺起把把手拽起来。",
      "弓背弯腰拉起。",
      "手肘张得太开导致耸肩。"
    ]
  },
  {
    "id": "smith_bent_over_row",
    "name": "史密斯划船",
    "primaryMuscles": [
      "背阔肌",
      "中下斜方肌"
    ],
    "secondaryMuscles": [
      "菱形肌",
      "肱二头肌"
    ],
    "equipment": [
      "史密斯"
    ],
    "steps": [
      "调整史密斯杠铃高度在小腿中部，解开挂钩，俯身45度背部拉直。",
      "双手略宽于肩握杠铃，肩胛沉稳锁死。",
      "手肘后带，将杠铃沿着大腿拉向小腹或肚脐，吸气。",
      "离心慢放杠铃至手臂完全伸直，背部拉满，呼气。"
    ],
    "mistakes": [
      "史密斯滑轨固定，站姿位置不当导致摩擦撞击手腕。",
      "借腿部弹动代偿借力。",
      "弓背。"
    ]
  },
  {
    "id": "chin_up",
    "name": "反手引体向上",
    "primaryMuscles": [
      "背阔肌",
      "肱二头肌"
    ],
    "secondaryMuscles": [
      "中下斜方肌",
      "菱形肌"
    ],
    "equipment": [
      "自重"
    ],
    "steps": [
      "双手与肩同宽反握（掌心朝向自己）单杠，身体悬挂，背部拉直。",
      "肩胛骨下沉收紧，吸气。",
      "肱二头肌和背阔肌合力拉起身体，至胸口接近单杠，下巴超过杠铃。",
      "呼气控制身体缓慢离心下降，保持肌肉全程受力，不完全卸力。"
    ],
    "mistakes": [
      "下放速度过快，关节猛烈承重撞击。",
      "摆动借力过猛。",
      "动作幅度不够（只拉一半）。"
    ]
  },
  {
    "id": "barbell_back_squat",
    "name": "杠铃颈后深蹲",
    "primaryMuscles": [
      "股四头肌",
      "臀大肌"
    ],
    "secondaryMuscles": [
      "腘绳肌",
      "竖脊肌",
      "核心肌群"
    ],
    "equipment": [
      "杠铃",
      "深蹲架"
    ],
    "steps": [
      "杠铃安全抗于斜方肌上沿，双脚略宽于肩站立，核心收紧，起杠后退一步。",
      "吸气憋住核心，髋部先向后微推，随后下蹲，膝盖沿着脚尖方向伸展。",
      "下蹲至大腿上表面平行于地面（或稍低于膝盖）。",
      "脚踩实地面起立，伸髋伸膝回到起点，呼气。"
    ],
    "mistakes": [
      "膝盖内扣（O型/X型），给侧向副韧带极大压力。",
      "深蹲时脚跟抬起，重量集中在脚尖。",
      "弓背或过度屁股眨眼（ pelvic wink）。"
    ]
  },
  {
    "id": "dumbbell_goblet_squat",
    "name": "哑铃高脚杯深蹲",
    "primaryMuscles": [
      "股四头肌"
    ],
    "secondaryMuscles": [
      "臀大肌",
      "核心肌群"
    ],
    "equipment": [
      "哑铃"
    ],
    "steps": [
      "双手托住一个哑铃一端置于胸前，贴近身体，双脚略宽于肩立正。",
      "吸气收紧腹部，背部拉直，髋部向后并下蹲。",
      "保持哑铃始终贴紧胸部，下蹲至手肘触及大腿内侧，大腿平行地面。",
      "大腿和臀部发力蹬地站起，呼气。"
    ],
    "mistakes": [
      "哑铃前倾离开身体，腰椎受力增大。",
      "蹲起时驼背。",
      "下蹲深度不够。"
    ]
  },
  {
    "id": "dumbbell_lunge",
    "name": "哑铃行走箭步蹲",
    "primaryMuscles": [
      "股四头肌",
      "臀大肌"
    ],
    "secondaryMuscles": [
      "腘绳肌",
      "核心肌群"
    ],
    "equipment": [
      "哑铃"
    ],
    "steps": [
      "双手持哑铃自然下垂垂于身体两侧，抬头挺胸，收紧核心。",
      "一脚向前跨出一大步，身体垂直下蹲，重心在两腿之间。",
      "前大腿平行地面，前膝不超过脚尖；后膝接近地面但不触地。",
      "前脚掌蹬地发力起立，可以原地起回或者顺势向前迈出下一步。"
    ],
    "mistakes": [
      "前腿跨得太短导致后跟抬起，前膝受压巨大。",
      "身体前倾倾斜，或者左右晃动失去平衡。",
      "后腿膝盖重重砸在木地板上。"
    ]
  },
  {
    "id": "leg_press",
    "name": "器械腿举",
    "primaryMuscles": [
      "股四头肌"
    ],
    "secondaryMuscles": [
      "臀大肌",
      "腘绳肌"
    ],
    "equipment": [
      "器械"
    ],
    "steps": [
      "斜躺在腿举机座椅上，背部和臀部紧贴靠背，双脚同肩宽踩稳踏板，解开安全锁。",
      "缓慢吸气下放重物，膝盖朝向肩膀折叠，直到大腿成约90度夹角。",
      "呼气时，脚掌均匀发力将踏板推起，注意膝盖不要完全锁死伸直。",
      "双手始终握住两侧扶手，保持臀部绝不离开靠垫。"
    ],
    "mistakes": [
      "下放过深导致尾骨离垫反转（屁股眨眼），给腰背极大剪切力。",
      "推起到顶点时膝关节猛烈锁死（极度危险关节反折）。",
      "双膝向内扣。"
    ]
  },
  {
    "id": "leg_extension",
    "name": "器械腿屈伸",
    "primaryMuscles": [
      "股四头肌"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "器械"
    ],
    "steps": [
      "坐在腿屈伸机上，背部紧贴靠背，膝关节对准器械转轴，滚轴压在脚踝前方。",
      "双手握紧体侧扶手以固定臀部，吸气准备。",
      "呼气收缩股四头肌将双腿伸直，大腿肌肉紧绷，顶峰收缩 1-2 秒。",
      "吸气缓慢控制离心还原，使小腿下垂至初始位置，片不碰撞。"
    ],
    "mistakes": [
      "大腿离开椅面，屁股抬起代偿。",
      "借助爆发力猛击甩腿。",
      "滚轴高度不对，卡在脚背或者小腿肚。"
    ]
  },
  {
    "id": "lying_leg_curl",
    "name": "俯卧腿弯举",
    "primaryMuscles": [
      "腘绳肌"
    ],
    "secondaryMuscles": [
      "臀大肌"
    ],
    "equipment": [
      "器械"
    ],
    "steps": [
      "俯卧在器械垫上，双膝对准器械转轴，滚轴垫于脚踝后侧上方。",
      "双手抓稳握把，吸气，骨盆贴紧垫面。",
      "呼气收缩大腿后侧腘绳肌，屈膝将滚轴拉向臀部，拉至极限后顶峰挤压。",
      "吸气控制离心慢速下放，双腿伸直还原，保持后侧肌群张力。"
    ],
    "mistakes": [
      "臀部拱起代偿（骨盆前倾借力）。",
      "动作离心极快自由落体，没有肌肉控制。",
      "手肘代偿发力。"
    ]
  },
  {
    "id": "barbell_hip_thrust",
    "name": "杠铃臀推",
    "primaryMuscles": [
      "臀大肌"
    ],
    "secondaryMuscles": [
      "腘绳肌",
      "核心肌群"
    ],
    "equipment": [
      "杠铃",
      "训练凳"
    ],
    "steps": [
      "将上背部斜靠在训练凳边缘，将负重杠铃滚至髋部（垫上软垫），双脚同肩宽踩地，小腿垂直地面。",
      "核心收紧，下巴微扣，视线直视前方。",
      "臀部收缩发力将髋部向上顶起，直到大腿与躯干呈一条直线，平行于地面。",
      "在最高点大脚趾踩实，臀大肌强力收缩，随后控制下放臀部直至接近地面。"
    ],
    "mistakes": [
      "靠腰椎过度反弓后伸顶起杠铃（腰酸）。",
      "大腿跨得太远导致大腿后侧抢力，跨得太近导致膝盖压力大。",
      "抬头看天花板导致颈部代偿。"
    ]
  },
  {
    "id": "stiff_leg_deadlift",
    "name": "直腿硬拉",
    "primaryMuscles": [
      "腘绳肌",
      "臀大肌"
    ],
    "secondaryMuscles": [
      "竖脊肌",
      "核心肌群"
    ],
    "equipment": [
      "杠铃",
      "哑铃"
    ],
    "steps": [
      "双脚比臀略窄站立，手正握杠铃，脊柱中立，直立起杠。",
      "膝关节保持微屈（约10-15度）并锁死角度，不要继续下蹲。",
      "做髋铰链，髋部往后推，躯干前倾，杠铃垂直贴着腿部前方下放。",
      "下放至大腿后侧有极强拉伸感（背不能弓），大腿和臀部发力拉回身体直立。"
    ],
    "mistakes": [
      "弓背下放杠铃。",
      "下放时膝盖弯曲变多成了传统硬拉。",
      "起立时靠后背往后拽。"
    ]
  },
  {
    "id": "machine_hip_adduction",
    "name": "器械大腿内收",
    "primaryMuscles": [
      "股四头肌"
    ],
    "secondaryMuscles": [
      "核心肌群"
    ],
    "equipment": [
      "器械"
    ],
    "steps": [
      "坐在内收训练机上，背部贴紧靠垫，大腿内侧抵住挡板，双脚踩实踏板。",
      "双手握住身旁拉手，吸气。",
      "呼气收缩大腿内收肌群，用力将双腿向内靠拢夹紧，在中间停留1秒。",
      "吸气控制离心，缓慢将双腿张开至大腿内侧拉伸感明显，配重片不触碰。"
    ],
    "mistakes": [
      "利用上半身向前倾歪斜借力。",
      "张开幅度过大拉伤内侧肌群。",
      "松开速度过快。"
    ]
  },
  {
    "id": "machine_hip_abduction",
    "name": "器械大腿外展",
    "primaryMuscles": [
      "臀大肌"
    ],
    "secondaryMuscles": [
      "核心肌群"
    ],
    "equipment": [
      "器械"
    ],
    "steps": [
      "坐在外展训练机上，双手握扶手，大腿外侧贴紧挡板。",
      "根据目标部位可微前倾（侧重臀中肌）或靠紧（侧重臀大肌）。",
      "呼气收缩臀部外侧肌群（臀中肌），将双腿用力向两侧推开推展。",
      "至最大角度顶峰收缩 1 秒，吸气控制缓慢向内收拢至大腿闭合。"
    ],
    "mistakes": [
      "大腿离开座垫，屁股悬空外展。",
      "动作太快无控制。",
      "利用大腿内侧反弹惯性。"
    ]
  },
  {
    "id": "seated_dumbbell_press",
    "name": "哑铃坐姿推举",
    "primaryMuscles": [
      "三角肌前束"
    ],
    "secondaryMuscles": [
      "三角肌中束",
      "肱三头肌"
    ],
    "equipment": [
      "哑铃",
      "直角凳"
    ],
    "steps": [
      "坐在直角背椅凳上，背部贴实靠垫，双手提哑铃置于双肩外侧，手肘微向下收拢。",
      "手腕保持中立挺直，呼气向上推起哑铃，双臂伸直，顶部两铃不碰撞。",
      "大臂伸展，手肘呈微弯曲状态，吸气。",
      "控制哑铃沿着耳朵两侧垂直下降，回到大臂略低于平行地面的位置。"
    ],
    "mistakes": [
      "推举时腰部严重反弓离开靠背，做成了斜板卧推。",
      "手肘向身体两侧完全平开（90度）压迫肩袖。",
      "推举到最高点时双肘锁死。"
    ]
  },
  {
    "id": "standing_barbell_press",
    "name": "杠铃站姿推举",
    "primaryMuscles": [
      "三角肌前束"
    ],
    "secondaryMuscles": [
      "三角肌中束",
      "肱三头肌",
      "核心肌群"
    ],
    "equipment": [
      "杠铃",
      "深蹲架"
    ],
    "steps": [
      "双脚同肩宽站立，杠铃双手握距略宽于肩，正握架于锁骨及肩前侧，手肘前收托住。",
      "全身核心收紧，臀部夹紧，骨盆中立，背拉直。",
      "呼气将杠铃从面前垂直向上推起，头部微后仰让过杠铃，推过头顶后头部前送锁定杠铃。",
      "吸气缓慢控制杠铃下降，头部微抬让过，原路落回上胸前。"
    ],
    "mistakes": [
      "向后仰身折腰（骨盆前倾折腰代偿）。",
      "大肘张开，从身体两侧推杠铃（极易受伤）。",
      "站姿晃动，缺乏下肢和核心支撑。"
    ]
  },
  {
    "id": "dumbbell_lateral_raise",
    "name": "哑铃侧平举",
    "primaryMuscles": [
      "三角肌中束"
    ],
    "secondaryMuscles": [
      "三角肌前束"
    ],
    "equipment": [
      "哑铃"
    ],
    "steps": [
      "站立双脚同肩宽，上身微前倾（约10度），双手持哑铃放于大腿前侧或两侧，手肘微屈。",
      "呼气收缩三角肌中束，将哑铃沿身体两侧向斜前方（肩胛面）抬起。",
      "抬到大臂与地面平行即可，手肘略高于手腕或齐平。",
      "吸气缓慢控制哑铃下放大腿侧，保持肩膀持续受力，不完全放松下坠。"
    ],
    "mistakes": [
      "推起时耸肩，斜方肌严重抢力。",
      "身体前后甩动，靠腰部惯性摆起哑铃。",
      "小臂高度高过肘关节（做成内旋折腕）。"
    ]
  },
  {
    "id": "dumbbell_front_raise",
    "name": "哑铃前平举",
    "primaryMuscles": [
      "三角肌前束"
    ],
    "secondaryMuscles": [
      "三角肌中束"
    ],
    "equipment": [
      "哑铃"
    ],
    "steps": [
      "双脚同胸同宽站直，双手握哑铃置于大腿前侧，掌心朝后。",
      "手肘微屈并锁定，呼气收缩三角肌前束，将哑铃向前平平抬起。",
      "抬至手臂平行于地面，眼睛高度平齐。",
      "吸气匀速控制下放哑铃至起始位置，大臂保持张力。"
    ],
    "mistakes": [
      "耸肩代偿。",
      "身体后仰借力甩起哑铃。",
      "手臂手肘晃动。"
    ]
  },
  {
    "id": "cable_face_pull",
    "name": "绳索面拉",
    "primaryMuscles": [
      "三角肌后束",
      "中下斜方肌",
      "菱形肌"
    ],
    "secondaryMuscles": [
      "肱二头肌"
    ],
    "equipment": [
      "龙门架",
      "绳索"
    ],
    "steps": [
      "将滑轮高度调至胸口至上眼高度，双手抓住双头绳索两端，掌心相对或朝下，后退几步拉直重物。",
      "微屈膝站立核心收紧，手肘抬高与肩膀平行。",
      "肩后束和上背发力将绳索朝脸部中线方向拉近，中间铁扣指向鼻子，双手拉开至脸部两侧。",
      "在拉至最深处时做一个“大臂外旋”（双手展成W字，拇指指向后方），控制下慢速放回。"
    ],
    "mistakes": [
      "手肘耷拉下垂，拉到了脖子甚至前胸（背阔肌代偿）。",
      "没有大臂外旋，退化成了普通划船。",
      "耸肩。"
    ]
  },
  {
    "id": "bent_over_dumbbell_fly",
    "name": "哑铃俯身飞鸟",
    "primaryMuscles": [
      "三角肌后束"
    ],
    "secondaryMuscles": [
      "菱形肌",
      "中下斜方肌"
    ],
    "equipment": [
      "哑铃"
    ],
    "steps": [
      "双脚同髋宽站立，双手持轻哑铃，膝微屈，髋向后推俯身直至躯干几乎平行地面。",
      "哑铃垂于双膝下方，手心相对，手肘微屈锁定。",
      "呼气，三角肌后束发力将哑铃沿身体两侧向斜上方展翅举起（弧线路径）。",
      "抬到手肘与肩膀齐平，停顿 1 秒，吸气控制哑铃缓慢垂回原位。"
    ],
    "mistakes": [
      "大臂内收夹背，肩胛骨过度拼拢（变成了中背划船）。",
      "做动作时身体剧烈起伏晃动。",
      "手肘完全伸直承受过多重力。"
    ]
  },
  {
    "id": "cable_lateral_raise",
    "name": "绳索单臂侧平举",
    "primaryMuscles": [
      "三角肌中束"
    ],
    "secondaryMuscles": [
      "三角肌前束"
    ],
    "equipment": [
      "龙门架",
      "拉索"
    ],
    "steps": [
      "站在滑轮旁边，将滑轮高度调至最低位。外侧手越过身体前侧，反握滑轮拉索把手。",
      "内侧手扶立柱以固定身体，双脚站稳，身体微向外侧倾斜。",
      "三角肌中束发力，将手肘向上及外侧推起，直到手臂与地面平行，手肘保持微屈。",
      "在最高点顶峰收缩，控制拉索慢慢送回大腿前，保持配重片不触底。"
    ],
    "mistakes": [
      "拉起时耸肩代偿。",
      "绳索偏离肩部平面，轨迹歪斜。",
      "使用手腕用力抠拉把手。"
    ]
  },
  {
    "id": "reverse_pec_deck_fly",
    "name": "蝴蝶机反向飞鸟",
    "primaryMuscles": [
      "三角肌后束"
    ],
    "secondaryMuscles": [
      "菱形肌",
      "中下斜方肌"
    ],
    "equipment": [
      "器械"
    ],
    "steps": [
      "面向蝴蝶机坐立，胸部贴紧前靠垫，双手握住前侧手柄，大臂平行地面，手肘微屈锁定。",
      "吸气准备，呼气收缩三角肌后束，将手臂呈圆弧形向身体两侧后方展开。",
      "大臂向后推直到大臂几乎与肩膀呈一字直线，感受肩后束强烈挤压。",
      "缓慢控制拉杆返回，至大臂前伸到初始位置，配重片不碰撞。"
    ],
    "mistakes": [
      "耸肩导致斜方肌严重借力。",
      "胸部离开前垫，用身体往后靠代偿。",
      "手肘角度伸缩，成了臂屈伸。"
    ]
  },
  {
    "id": "barbell_shrug",
    "name": "杠铃耸肩",
    "primaryMuscles": [
      "中下斜方肌"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "杠铃"
    ],
    "steps": [
      "双手略宽于肩，站姿正握杠铃置于大腿前方，身体直立，双肩放松下垂。",
      "呼气收缩上斜方肌，将双肩垂直向上提拉，尽量使肩膀接近耳朵位置。",
      "在最高点保持 1-2 秒，强力挤压斜方肌。",
      "吸气，缓慢控制杠铃下降到初始位置，使肌肉得到完全拉伸放松。"
    ],
    "mistakes": [
      "旋转肩膀（向前或向后转圈耸肩，容易造成肩袖拉伤）。",
      "手臂弯曲做成了二头肌提拉杠铃。",
      "头部过度前伸低头。"
    ]
  },
  {
    "id": "dumbbell_shrug",
    "name": "哑铃耸肩",
    "primaryMuscles": [
      "中下斜方肌"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "哑铃"
    ],
    "steps": [
      "站立双脚同肩宽，双手对握（掌心朝内）持哑铃于身体两侧，手臂下垂放松。",
      "斜方肌发力将双肩笔直向上提起，双臂保持伸直，吸气。",
      "顶部停留 1 秒，吸气慢慢控制哑铃下放，感受斜方肌伸展拉伸。"
    ],
    "mistakes": [
      "耸肩时伴随转肩动作。",
      "小臂借力弯曲屈肘。",
      "动作速度太快。"
    ]
  },
  {
    "id": "dumbbell_curl",
    "name": "哑铃弯举",
    "primaryMuscles": [
      "肱二头肌"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "哑铃"
    ],
    "steps": [
      "双脚同肩宽站立，双手正握哑铃（手心朝内）下垂于身体两侧，手肘微屈贴近腰部。",
      "收紧核心，大臂固定，呼气屈肘向上弯举哑铃，在弯举后段旋转手腕使掌心朝上。",
      "顶峰挤压肱二头肌 1 秒，呼气有控制地将哑铃下放原位，手腕转回侧向。"
    ],
    "mistakes": [
      "利用身体前后晃动甩哑铃借力。",
      "大臂前移借三角肌前束代偿。",
      "下放哑铃速度太快，自由落体。"
    ]
  },
  {
    "id": "dumbbell_hammer_curl",
    "name": "哑铃锤式弯举",
    "primaryMuscles": [
      "肱二头肌"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "哑铃"
    ],
    "steps": [
      "站姿或坐姿，双手对握（掌心相对，像握锤子一样）持哑铃放于体侧，大臂贴紧。",
      "手肘为轴，大臂不动，呼气收缩肱桡肌和二头肌将哑铃向上弯起。",
      "哑铃顶端指向肩前侧，不发生手腕旋转。",
      "吸气缓慢下放，拉长大臂前侧。"
    ],
    "mistakes": [
      "手腕在动作中折腕不举。",
      "身体摇晃。",
      "大臂张开离开身体。"
    ]
  },
  {
    "id": "barbell_preacher_curl",
    "name": "杠铃牧师凳弯举",
    "primaryMuscles": [
      "肱二头肌"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "杠铃",
      "斜托凳"
    ],
    "steps": [
      "坐在牧师凳上，将大臂后侧和腋窝卡紧在斜托板上，双手同肩宽反握杠铃（推荐EZ曲杠）。",
      "大臂贴实板子，吸气准备。",
      "呼气收缩二头肌，将杠铃沿着弧线向上拉起，直到手臂接近垂直板面，二头肌完全挤压。",
      "吸气控制重物平缓下降，直到手臂伸展接近伸直，保持肌肉持续张力。"
    ],
    "mistakes": [
      "下放到底部时手臂完全放直并锁死（极易拉伤二头肌肌腱）。",
      "臀部离开座位，利用身体往下压拉起杠铃。",
      "腋窝没有卡紧在板上沿。"
    ]
  },
  {
    "id": "cable_pushdown",
    "name": "龙门架绳索下压",
    "primaryMuscles": [
      "肱三头肌"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "龙门架",
      "绳索"
    ],
    "steps": [
      "站在龙门架把手前，面向滑轮，双手握绳索把手，大臂夹紧体侧，身体微前倾。",
      "手肘固定为轴，吸气准备。",
      "呼气收缩肱三头肌，将小臂向下压直，至顶点时双手往两侧拉开，手臂完全伸直，顶峰挤压。",
      "吸气控制离心慢速送回，至小臂略高于水平线，大臂保持不动。"
    ],
    "mistakes": [
      "大臂在动作中随之抬起和落下，三角肌代偿严重。",
      "身体向下弓背，用身体重力往下压绳索。",
      "耸肩。"
    ]
  },
  {
    "id": "overhead_dumbbell_triceps_extension",
    "name": "哑铃滑降颈后臂屈伸",
    "primaryMuscles": [
      "肱三头肌"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "哑铃",
      "卧推凳"
    ],
    "steps": [
      "坐在低靠背椅上，双手托住一个哑铃的一端，将其举过头顶，手臂伸直。",
      "双肘向内靠拢收紧，不要过度外张。",
      "吸气，手肘屈曲，控制哑铃降到头后颈部位置，专注于三头肌长头的拉伸感。",
      "呼气，收缩三头肌将哑铃举回原位，手臂在正上方伸直。"
    ],
    "mistakes": [
      "手肘张得太开，导致肩袖压力过大。",
      "哑铃向后下降太深打到颈椎。",
      "推起时腰椎弓起塌腰。"
    ]
  },
  {
    "id": "dumbbell_kickback",
    "name": "哑铃俯身臂屈伸",
    "primaryMuscles": [
      "肱三头肌"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "哑铃",
      "卧推凳"
    ],
    "steps": [
      "单手单膝撑在训练凳上，身体平行地面；另一手持哑铃，大臂夹紧在身侧，平行躯干。",
      "手肘固定呈90度弯曲，吸气准备。",
      "呼气收缩肱三头肌，小臂向后上方伸直，至手臂与大臂在一条直线上。",
      "顶点做 1 秒挤压，吸气慢慢原路放回，保持大臂高度不变。"
    ],
    "mistakes": [
      "利用甩手腕或者大臂向下晃动借力。",
      "身体转动，动作别扭。",
      "下放角度超过90度。"
    ]
  },
  {
    "id": "ez_bar_curl",
    "name": "EZ曲杠弯举",
    "primaryMuscles": [
      "肱二头肌"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "杠铃"
    ],
    "steps": [
      "双脚同肩宽站立，双手外侧斜边反握住EZ杠，大臂夹紧贴肋骨。",
      "保持身体直立，核心收紧，吸气准备。",
      "呼气，大臂保持夹紧，屈肘将曲杠向上弯起至胸前上方，感受二头肌高耸。",
      "吸气控制曲杠缓慢下放，直到手臂微伸直（不锁肘）。"
    ],
    "mistakes": [
      "弯举时身体前后大幅度摇晃借力。",
      "手肘前移借力三角肌前束。",
      "弯举到顶点时完全卸力放松。"
    ]
  },
  {
    "id": "single_arm_cable_pushdown",
    "name": "单臂绳索下压",
    "primaryMuscles": [
      "肱三头肌"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "龙门架",
      "绳索"
    ],
    "steps": [
      "面对滑轮，将拉索调到高位，单手反握或握马蹄形把手，大臂夹紧侧肋。",
      "身体微前倾，核心收紧，肘关节呈90度。",
      "呼气收缩三头肌，垂直下压把手至手臂完全伸直，顶峰停留1秒。",
      "吸气，控制配重片慢速回放。"
    ],
    "mistakes": [
      "大臂前后来回晃动。",
      "聳肩代偿。",
      "下压过程中腕关节弯曲。"
    ]
  },
  {
    "id": "bench_dip",
    "name": "凳上反屈伸",
    "primaryMuscles": [
      "肱三头肌"
    ],
    "secondaryMuscles": [
      "胸大肌",
      "三角肌前束"
    ],
    "equipment": [
      "训练凳",
      "自重"
    ],
    "steps": [
      "双手撑在后侧训练凳边缘，手指朝前，双脚平放在前侧地面或另一张凳上。",
      "臀部微滑出凳面，躯干挺直靠紧凳边。",
      "吸气弯曲手肘，控制身体下沉，直到大臂与地面平行，手肘约呈90度角。",
      "呼气收缩肱三头肌，双手用力推起身体回到起始高度，肘部不锁死。"
    ],
    "mistakes": [
      "身体滑得离后凳太远，给肩关节施加了极大的前移剪切力。",
      "下沉太深导致肩膀剧烈疼痛。",
      "圆肩拱背。"
    ]
  },
  {
    "id": "hanging_leg_raise",
    "name": "悬垂举腿",
    "primaryMuscles": [
      "核心肌群"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "双杠",
      "自重"
    ],
    "steps": [
      "双手正握悬挂在单杠上，或者双手肘支撑在举腿架上，双腿完全垂悬。",
      "吸气准备，收紧核心，减少身体晃动。",
      "呼气，骨盆后倾，腹肌发力带动大腿慢慢向前上方抬起，双腿尽量保持笔直。",
      "抬到双腿与躯干呈90度（或更高），骨盆卷起，慢放原路恢复，保持控制不摇晃。"
    ],
    "mistakes": [
      "利用身体前后晃动像秋千一样把腿甩上去。",
      "完全靠髋腰肌抬大腿，腹肌根本没有参与卷缩。",
      "手肘代偿。"
    ]
  },
  {
    "id": "crunch",
    "name": "仰卧卷腹",
    "primaryMuscles": [
      "核心肌群"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "自重"
    ],
    "steps": [
      "仰卧在瑜伽垫上，屈双膝，脚掌踩实地面，双手微扣托脑后或交叠于胸前。",
      "下巴微收，留一拳空间，下背部（腰椎）紧紧贴住地面。",
      "呼气腹直肌收紧，将肩胛骨抬离地面，肋骨向髋骨方向挤压。",
      "头部和颈部不主动发力，顶点挤压，吸气缓慢放下肩膀返回，腰不离开地面。"
    ],
    "mistakes": [
      "双手死死抱住脑袋往上拽，造成颈椎极度拉伤（典型的拉颈卷腹）。",
      "做成了仰卧起坐，整个腰椎都坐起来脱离地面（髋腰肌代偿）。",
      "动作极快。"
    ]
  },
  {
    "id": "plank",
    "name": "平板支撑",
    "primaryMuscles": [
      "核心肌群"
    ],
    "secondaryMuscles": [
      "竖脊肌"
    ],
    "equipment": [
      "自重"
    ],
    "steps": [
      "双肘支撑地面，位于肩膀正下方，小臂平行；双脚踩地，身体呈一直线。",
      "收紧腹部，夹紧臀部，头部、背部和脚跟在同一水平面。",
      "保持正常腹式呼吸，身体肌肉紧绷抗重力下掉。",
      "坚持到预定时间，保持骨盆中立不塌腰。"
    ],
    "mistakes": [
      "塌腰（肚子坠地），导致下背竖脊肌极酸（压迫腰椎）。",
      "屁股抬得特别高，逃避核心承重。",
      "耸肩低头，或者仰头压迫颈椎。"
    ]
  },
  {
    "id": "cable_crunch",
    "name": "绳索跪姿卷腹",
    "primaryMuscles": [
      "核心肌群"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "龙门架",
      "绳索"
    ],
    "steps": [
      "跪在龙门架前，将滑轮高度调至最高位。双手握紧绳索两端，将双手固定在头部两侧（像扣紧双耳）。",
      "下巴微扣，臀部向后微坐在脚跟上，锁死髋关节不让其继续移动。",
      "呼气收缩腹肌，胸椎屈曲，将额头拉向地面或双膝，腹肌强力卷缩。",
      "顶点稍停留，吸气控制重量慢慢向上拉长，至背部微拉直，保持负荷。"
    ],
    "mistakes": [
      "髋关节大幅度运动做成了叩首跪拜动作（髋腰肌借力）。",
      "双手死死拽绳索往下拉（手臂代偿）。",
      "背部笔直硬梆梆地弯下去，没有胸椎卷曲过程。"
    ]
  },
  {
    "id": "russian_twist",
    "name": "俄罗斯转体",
    "primaryMuscles": [
      "核心肌群"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "自重"
    ],
    "steps": [
      "坐在垫子上，屈双膝，脚掌微抬离地（或跟轻点地），上身向后倾斜约45度，背部伸直。",
      "双手可在胸前合拢（或抱药球等），收紧核心保持躯干稳定。",
      "呼气收缩腹内外斜肌，将胸椎转向一侧，使双手接近大腿外侧地面。",
      "呼气转回，再原路控制转向另一侧，注意脚和膝盖尽量不摇晃。"
    ],
    "mistakes": [
      "弯腰驼背转体，导致剪切力落在腰椎上。",
      "只动了双臂，而躯干胸椎完全没有扭转旋转。",
      "双腿在空中剧烈左右摇摆失去稳定平衡。"
    ]
  },
  {
    "id": "ab_roller_rollout",
    "name": "健腹轮推拉",
    "primaryMuscles": [
      "核心肌群"
    ],
    "secondaryMuscles": [
      "竖脊肌"
    ],
    "equipment": [
      "自重"
    ],
    "steps": [
      "双膝跪地（垫好垫子），双手握住健腹轮两侧把手，将其放在大腿前方地面。",
      "微卷腹，骨盆微后倾，全身核心高度收紧。",
      "推动健腹轮向前滚动，身体随之下降并向前拉直，手臂伸直，直到身体接近平行地面。",
      "在拉到能控制的极限后，核心和腹肌用力收缩拉回，健腹轮滚回膝盖前方。"
    ],
    "mistakes": [
      "推出去的时候塌腰，依靠腰椎反弓硬抗（会对下背造成致命损伤）。",
      "回拉时用屁股往后坐来拉回，腹肌没有发力做功。",
      "手臂过度代偿弯曲。"
    ]
  },
  {
    "id": "lying_leg_raise",
    "name": "仰卧抬腿",
    "primaryMuscles": [
      "核心肌群"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "自重"
    ],
    "steps": [
      "平躺在瑜伽垫上，双腿伸直并拢，双手掌心朝下垫于臀部下方以保护下背部。",
      "微收下巴，收缩核心，下背部压紧地面。",
      "呼气由腹直肌下部发力，将双腿笔直抬起，至大腿几乎垂直地面。",
      "吸气缓慢控制双腿下放，至脚跟距离地面约 10-15 厘米处停止，保持张力。"
    ],
    "mistakes": [
      "双腿下放时腰部拱起离开地面（下背承受巨大压力）。",
      "双腿完全直挺绷直锁死导致关节僵硬。",
      "小腿动作过快。"
    ]
  },
  {
    "id": "sit_up",
    "name": "仰卧起坐",
    "primaryMuscles": [
      "核心肌群"
    ],
    "secondaryMuscles": [],
    "equipment": [
      "自重"
    ],
    "steps": [
      "平躺在垫子上，双脚踩实地面，双手轻搭耳侧，核心收紧。",
      "呼气由核心发力卷起，将上半身完全坐起，直到手肘触碰到双膝。",
      "在坐起过程中保持腰椎受控微曲，吸气。",
      "缓慢控制离心，将身体平顺下放回原平躺姿态，配重或双脚不翘离地面。"
    ],
    "mistakes": [
      "双手死抱脑后用力向前拽（拉伤脖子颈椎）。",
      "起身过猛，后背死硬直立（髂腰肌严重代偿且摩擦尾骨）。",
      "起落缺乏控制速度。"
    ]
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
    nutrition: {
      dailyCalories: 2400,
      protein: 140,
      carbs: 280,
      fat: 80,
      tips: [
        '增肌期间，每日能量摄入建议比消耗过剩 200-300 大卡，主要来源于优质碳水与蛋白质。',
        '建议按每公斤体重 2.0 克摄入蛋白质，首选蛋类、牛肉、鸡胸肉和豆制品，不足部分可用蛋白粉补足。',
        '训练前 1.5 小时补充易消化碳水，训练后 30 分钟内及时补充碳水和快速吸收蛋白质以促进肌肉修复。'
      ]
    },
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
  },
  {
    id: 'plan_ppl_split_2026_v1',
    name: 'PPL力量与增肌循环计划',
    goal: ['增肌', '力量提升', '进阶分割'],
    level: '进阶',
    durationWeeks: 12,
    weeklyFrequency: 3,
    equipmentTags: ['杠铃', '哑铃', '龙门架', '器械', '罗马椅'],
    summary: '经典的推拉腿（PPL）训练循环，适合进阶训练者，合理安排推、拉和下肢的肌肉恢复周期。',
    nutrition: {
      dailyCalories: 2600,
      protein: 150,
      carbs: 310,
      fat: 80,
      tips: [
        '推拉腿训练消耗极大，请保证主食多摄入复合碳水（如燕麦、红薯、糙米），确保肌糖原充足。',
        '建议按每公斤体重 2.0 克摄入蛋白质，首选牛肉、鸡胸、鱼类等优质蛋白质来源。',
        '训练前 1-2 小时适当吃些中等GI碳水，维持训练期间血糖水平的平稳。'
      ]
    },
    days: [
      {
        id: 'day_ppl_push',
        name: '推部训练 (胸/肩前中束/三头)',
        focus: '胸大肌、三角肌前束/中束、肱三头肌',
        exercises: [
          prescribe({ exerciseId: 'barbell_bench_press', sets: 4, reps: '6-10', rpe: '8.5', restSeconds: 150 }, 'main'),
          prescribe({ exerciseId: 'incline_dumbbell_press', sets: 3, reps: '8-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'y_raise_lateral_raise', sets: 4, reps: '12-15', rpe: '8-9', restSeconds: 90 }, 'isolation'),
          prescribe({ exerciseId: 'lying_barbell_triceps_extension', sets: 3, reps: '10-12', rpe: '8-9', restSeconds: 90 }, 'isolation')
        ]
      },
      {
        id: 'day_ppl_pull',
        name: '拉部训练 (背/肩后束/二头)',
        focus: '背阔肌、斜方肌、三角肌后束、肱二头肌',
        exercises: [
          prescribe({ exerciseId: 'neutral_grip_lat_pulldown', sets: 4, reps: '8-12', rpe: '8', restSeconds: 120 }, 'main'),
          prescribe({ exerciseId: 'single_arm_machine_row', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'seated_elbow_out_row', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'cable_curl', sets: 3, reps: '12-15', rpe: '8-9', restSeconds: 90 }, 'isolation')
        ]
      },
      {
        id: 'day_ppl_legs',
        name: '腿部训练 (臀腿/后侧链)',
        focus: '股四头肌、臀大肌、腘绳肌、竖脊肌',
        exercises: [
          prescribe({ exerciseId: 'front_squat', sets: 4, reps: '6-8', rpe: '8.5', restSeconds: 150 }, 'main'),
          prescribe({ exerciseId: 'romanian_deadlift', sets: 4, reps: '8-10', rpe: '8', restSeconds: 150 }, 'main'),
          prescribe({ exerciseId: 'bulgarian_split_squat', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'back_extension', sets: 3, reps: '12-15', rpe: '8-9', restSeconds: 90 }, 'isolation')
        ]
      }
    ]
  },
  {
    id: 'plan_full_body_circuit_2026_v1',
    name: '全身高效循环抗阻训练',
    goal: ['减脂', '形体塑造', '心肺基础'],
    level: '新手',
    durationWeeks: 8,
    weeklyFrequency: 3,
    equipmentTags: ['杠铃', '哑铃', '自重', '器械', '罗马椅'],
    summary: '为新手或减脂塑形人群量身定制的全身循环抗阻训练，每次训练覆盖全身大肌群，高效率调动代谢。',
    nutrition: {
      dailyCalories: 2000,
      protein: 115,
      carbs: 220,
      fat: 65,
      tips: [
        '减脂期建议每天创造 300-500 大卡的热量赤字，主要通过适度控油和少喝含糖饮料来实现。',
        '每天保证每公斤体重摄入 1.6g 左右的蛋白质，这能帮助在减脂期间保留肌肉，维持身体代谢。',
        '多喝水（每天 2.5-3 升），可以提高饱腹感，同时促进代谢废物的排出。'
      ]
    },
    days: [
      {
        id: 'day_circuit_a',
        name: '全身循环 A (上肢推拉 & 臀腿辅助)',
        focus: '胸肌、背部大肌群、股四头肌/臀大肌单侧稳定性、三角肌中束',
        exercises: [
          prescribe({ exerciseId: 'barbell_bench_press', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'main'),
          prescribe({ exerciseId: 'neutral_grip_lat_pulldown', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'bulgarian_split_squat', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'y_raise_lateral_raise', sets: 3, reps: '12-15', rpe: '8', restSeconds: 90 }, 'isolation')
        ]
      },
      {
        id: 'day_circuit_b',
        name: '全身循环 B (臀腿主项 & 上肢辅助)',
        focus: '股四头肌、上背部/肩后束、胸背辅助、后侧链强化',
        exercises: [
          prescribe({ exerciseId: 'front_squat', sets: 3, reps: '8-10', rpe: '8', restSeconds: 150 }, 'main'),
          prescribe({ exerciseId: 'seated_elbow_out_row', sets: 3, reps: '8-10', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'romanian_deadlift', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'main'),
          prescribe({ exerciseId: 'parallel_bar_dip', sets: 3, reps: '8-12', rpe: '8', restSeconds: 120 }, 'assistance')
        ]
      },
      {
        id: 'day_circuit_c',
        name: '全身循环 C (多关节复合强化)',
        focus: '后侧链与单侧平衡、胸部上束、背阔肌深度刺激、下背与臀肌',
        exercises: [
          prescribe({ exerciseId: 'single_leg_deadlift', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'incline_dumbbell_press', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'single_arm_machine_row', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'back_extension', sets: 3, reps: '12-15', rpe: '8', restSeconds: 90 }, 'isolation')
        ]
      }
    ]
  },
  {
    id: 'plan_upper_lower_split_2026_v1',
    name: '上下肢分化力量与塑形计划',
    goal: ['力量提升', '增肌', '形体塑造'],
    level: '进阶',
    durationWeeks: 10,
    weeklyFrequency: 4,
    equipmentTags: ['杠铃', '哑铃', '龙门架', '器械', '罗马椅'],
    summary: '经典的上下肢 4 日分化训练，合理分割上肢和下肢，帮助你实现更快的力量突破与肌肉生长。',
    nutrition: {
      dailyCalories: 2500,
      protein: 145,
      carbs: 295,
      fat: 78,
      tips: [
        '力量训练期间，建议每日摄入热量在基础代谢+300大卡左右，保障肌肉生长能量。',
        '多吃升糖指数较低的复合碳水（如燕麦、糙米、红薯），它们能在训练期间提供平稳持久的动力。',
        '每天保证每公斤体重摄入 1.8g-2.0g 的蛋白质，首选肉、蛋、奶以及大豆蛋白。'
      ]
    },
    days: [
      {
        id: 'day_upper_a',
        name: '上肢训练 A (力量爆发型)',
        focus: '胸背复合推拉力量',
        exercises: [
          prescribe({ exerciseId: 'barbell_bench_press', sets: 4, reps: '6-8', rpe: '8.5', restSeconds: 150 }, 'main'),
          prescribe({ exerciseId: 'neutral_grip_lat_pulldown', sets: 4, reps: '8-10', rpe: '8', restSeconds: 120 }, 'main'),
          prescribe({ exerciseId: 'incline_dumbbell_press', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'seated_elbow_out_row', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance')
        ]
      },
      {
        id: 'day_lower_a',
        name: '下肢训练 A (双侧蹲推与后链)',
        focus: '双侧深蹲与后链拉伸',
        exercises: [
          prescribe({ exerciseId: 'front_squat', sets: 4, reps: '6-8', rpe: '8.5', restSeconds: 150 }, 'main'),
          prescribe({ exerciseId: 'romanian_deadlift', sets: 4, reps: '8-10', rpe: '8', restSeconds: 150 }, 'main'),
          prescribe({ exerciseId: 'bulgarian_split_squat', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'back_extension', sets: 3, reps: '12-15', rpe: '8', restSeconds: 90 }, 'isolation')
        ]
      },
      {
        id: 'day_upper_b',
        name: '上肢训练 B (容量塑形型)',
        focus: '肩臂与胸背孤立雕刻',
        exercises: [
          prescribe({ exerciseId: 'incline_dumbbell_press', sets: 4, reps: '8-12', rpe: '8', restSeconds: 120 }, 'main'),
          prescribe({ exerciseId: 'single_arm_machine_row', sets: 4, reps: '10-12', rpe: '8', restSeconds: 120 }, 'main'),
          prescribe({ exerciseId: 'y_raise_lateral_raise', sets: 4, reps: '12-15', rpe: '8', restSeconds: 90 }, 'isolation'),
          prescribe({ exerciseId: 'cable_curl', sets: 3, reps: '12-15', rpe: '8.5', restSeconds: 90 }, 'isolation')
        ]
      },
      {
        id: 'day_lower_b',
        name: '下肢训练 B (单侧稳定与后链强化)',
        focus: '单侧腿部控制与下背防护',
        exercises: [
          prescribe({ exerciseId: 'bulgarian_split_squat', sets: 4, reps: '8-10', rpe: '8.5', restSeconds: 120 }, 'main'),
          prescribe({ exerciseId: 'single_leg_deadlift', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'romanian_deadlift', sets: 3, reps: '10-12', rpe: '8', restSeconds: 120 }, 'assistance'),
          prescribe({ exerciseId: 'back_extension', sets: 3, reps: '12-15', rpe: '8.5', restSeconds: 90 }, 'isolation')
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
