window.GAME_DATA = window.GAME_DATA || {};

window.GAME_DATA.REALMS = [
  { name: '炼气一层', exp: 90, maxHp: 130, maxQi: 85, ageBonus: 0 },
  { name: '炼气四层', exp: 180, maxHp: 210, maxQi: 140, ageBonus: 10 },
  { name: '炼气九层', exp: 300, maxHp: 310, maxQi: 215, ageBonus: 20 },
  { name: '筑基初期', exp: 520, maxHp: 500, maxQi: 360, ageBonus: 100, tribulation: true },
  { name: '金丹大道', exp: 900, maxHp: 880, maxQi: 640, ageBonus: 300, tribulation: true },
  { name: '元婴真君', exp: 9999, maxHp: 1520, maxQi: 1200, ageBonus: 800, tribulation: true }
];

// 招式五大门类（《金庸3》式门类总造诣 0~100：单招练满最多贡献 22 点，须博采众长方能堆至 100）
window.GAME_DATA.SKILL_CATS = {
  sword: { id:'sword', name:'剑法', desc:'灵动迅捷，擅暴击与连绵剑气。' },
  blade: { id:'blade', name:'刀法', desc:'霸道刚猛，擅破防与狂战斩杀。' },
  staff: { id:'staff', name:'棍法', desc:'大开大合，纯数值重伤与巨额削定力。' },
  fist:  { id:'fist',  name:'掌拳', desc:'近身化劲，擅叠甲反震与快招压制。' },
  spell: { id:'spell', name:'术法毒功', desc:'五行术法、蚀骨叠毒与全队辅助续航。' }
};

// 主修心法（装配 1 门）
window.GAME_DATA.HEART_ARTS = {
  turtle_breath:  { id:'turtle_breath',  name:'《太虚龟息功》', style:'叠甲反伤', expBonus:0.15, defBonus:8, reflect:0.25, desc:'受击减伤 +8，护盾存在时反震 25% 伤害，修炼 +15%。' },
  qingyun_breath: { id:'qingyun_breath', name:'《青云吐纳诀》', style:'暴击剑修', expBonus:0.22, hpBonus:30, critBonus:0.10, desc:'青云剑宗心法，暴击率 +10%，气血 +30，修炼 +22%。' },
  xuanxu_sutra:   { id:'xuanxu_sutra',   name:'《玄虚剑经·残篇》', style:'纯数值重伤', expBonus:0.32, atkBonus:14, desc:'上古剑经，全招式基础威力 +14，修炼 +32%。' },
  nether_sutra:   { id:'nether_sutra',   name:'《幽冥血煞诀》', style:'狂战卖血', expBonus:0.38, atkBonus:16, berserk:true, desc:'血量越低攻速与伤害越高（最高 +65%），附带 12% 吸血。' },
  wanbao_manual:  { id:'wanbao_manual',  name:'《万宝凝神录》', style:'辅助召唤', expBonus:0.25, qiBonus:40, petBonus:0.35, desc:'灵力上限 +40，出战灵兽与同行道友伤害/治疗 +35%。' },
  venom_sutra:    { id:'venom_sutra',    name:'《碧鳞万毒经》', style:'叠毒折磨', expBonus:0.24, poisonBonus:2, desc:'每次施展招式额外附加 2 层【蚀骨毒】，毒素每跳伤害 +30%。' }
};

// 辅修流派被动（最多装配 3 门）
window.GAME_DATA.PASSIVES = {
  p_crit_edge:    { id:'p_crit_edge',    name:'剑心通明', style:'暴击', desc:'暴击伤害由 150% 提升至 185%，暴击时返还 12 点集气。' },
  p_heavy_force:  { id:'p_heavy_force',  name:'一力降十会', style:'重伤', desc:'消耗集气 ≥ 70 的重招威力额外 +28%，削定力 +40%。' },
  p_venom_mist:   { id:'p_venom_mist',   name:'蚀骨毒雾', style:'叠毒', desc:'攻击命中附带 1 层【蚀骨毒】，敌方中毒时集气速度 -15%。' },
  p_thorns_shell: { id:'p_thorns_shell', name:'玄铁反震', style:'反伤', desc:'开启化劲架招额外获得 35 灵盾，受击反震伤害 +30%。' },
  p_beast_bond:   { id:'p_beast_bond',   name:'御兽灵契', style:'辅助', desc:'出战灵兽与道友集气速度 +25%，主角释放辅助招时全队回血。' },
  p_blood_fury:   { id:'p_blood_fury',   name:'血怒不屈', style:'狂战', desc:'气血低于 50% 时遁速集气 +30%，每次出手额外汲取 10 点气血。' }
};

// 招式库（不同招式消耗不同集气量 atbCost：快招35、中招55~65、重招/绝学85~100）
window.GAME_DATA.SKILLS = {
  // 剑法
  basic_sword:    { id:'basic_sword',    name:'青云快剑', cat:'sword', elem:'gold',  atbCost:35, qiCost:8,  power:0.95, poiseDmg:14, critBonus:0.08, desc:'【快招·35集气】出剑极快，起手压制与续连招。' },
  sister_frost:   { id:'sister_frost',   name:'霜华剑阵', cat:'sword', elem:'water', atbCost:70, qiCost:22, power:1.75, poiseDmg:28, slowEnemy:18,   desc:'【中招·70集气】寒霜剑气贯穿敌阵，击退敌方 18 点集气。' },
  grandpa_finger: { id:'grandpa_finger', name:'玄虚剑指', cat:'sword', elem:'gold',  atbCost:95, qiCost:32, power:2.55, poiseDmg:42, critBonus:0.20, desc:'【绝学·95集气】蓄力凝聚上古剑意，极高暴击与破防爆发。' },
  // 刀法
  swift_blade:    { id:'swift_blade',    name:'断风快刀', cat:'blade', elem:'fire',  atbCost:40, qiCost:10, power:1.05, poiseDmg:18, drainHp:8,      desc:'【快招·40集气】狠辣快斩并汲取 8 点气血。' },
  blood_cleave:   { id:'blood_cleave',   name:'血煞裂空斩', cat:'blade', elem:'fire', atbCost:85, qiCost:24, power:2.15, poiseDmg:36, berserkScale:true, drainHp:22, desc:'【重招·85集气】狂战核心，自身失血越多威力越恐怖并强力吸血。' },
  // 棍法
  sweep_staff:    { id:'sweep_staff',    name:'横扫千军棍', cat:'staff', elem:'earth', atbCost:55, qiCost:14, power:1.45, poiseDmg:34, desc:'【中招·55集气】棍势沉雄，大幅削减敌方护体定力。' },
  sky_smash_staff:{ id:'sky_smash_staff',name:'镇岳崩山棍', cat:'staff', elem:'earth', atbCost:100,qiCost:30, power:2.85, poiseDmg:55, desc:'【绝学·100集气】极致纯数值重伤，一棍破定碎甲。' },
  // 掌拳
  evade_step:     { id:'evade_step',     name:'藏锋护体掌', cat:'fist',  elem:'earth', atbCost:45, qiCost:12, power:0.85, poiseDmg:16, shield:48, desc:'【快招·45集气】出掌卸力并凝出 48 点护体灵盾。' },
  iron_counter:   { id:'iron_counter',   name:'玄铁震岳印', cat:'fist',  elem:'gold',  atbCost:75, qiCost:20, power:1.35, poiseDmg:30, shield:75, shieldDmg:0.65, desc:'【中招·75集气】叠厚盾并附加当前护盾 65% 的真实反震伤害。' },
  // 术法毒功
  venom_dart:     { id:'venom_dart',     name:'碧鳞毒砂',   cat:'spell', elem:'wood',  atbCost:38, qiCost:10, power:0.75, poiseDmg:10, poison:4, desc:'【快招·38集气】高频施加 4 层【蚀骨毒】，无视防御持续跳血。' },
  venom_burst:    { id:'venom_burst',    name:'万毒蚀心爆', cat:'spell', elem:'wood',  atbCost:80, qiCost:26, power:1.20, poiseDmg:22, detonatePoison:true, desc:'【重招·80集气】引爆敌方身上全部毒层，造成巨额结算爆发！' },
  mind_strike:    { id:'mind_strike',    name:'灵犀助阵诀', cat:'spell', elem:'water', atbCost:55, qiCost:18, power:0.70, poiseDmg:14, healTeam:65, boostAllyAtb:35, desc:'【辅助·55集气】回复气血 +65，令出战灵兽与道友集气暴涨 +35！' }
};

// 身上 9 格穿戴装备槽（武器/衣服/头饰/靴子/双护腕/双饰品/1戒指）
window.GAME_DATA.EQUIP_SLOTS = [
  { key:'weapon',  label:'武器' },
  { key:'clothes', label:'衣服' },
  { key:'head',    label:'头饰' },
  { key:'boots',   label:'靴子' },
  { key:'wristL',  label:'左护腕' },
  { key:'wristR',  label:'右护腕' },
  { key:'acc1',    label:'饰品一' },
  { key:'acc2',    label:'饰品二' },
  { key:'ring',    label:'储物戒' }
];

// 宗门与流派套装效果（2件 / 4件）
window.GAME_DATA.SETS = {
  qingyun: { name:'青云剑宗套', b2:'2件：暴击率 +10%，剑法威力 +12%', b4:'4件：暴击时额外回复 15 点集气与 8 点灵力' },
  iron:    { name:'玄铁反震套', b2:'2件：防御 +12，气血 +80',           b4:'4件：受击反伤 +35%，化劲架招额外叠 45 灵盾' },
  venom:   { name:'万毒幽冥套', b2:'2件：攻击附加 +2 层蚀骨毒',         b4:'4件：毒素跳血伤害 +45%，引爆后保留一半毒层' },
  blood:   { name:'血煞狂战套', b2:'2件：吸血 +10%，遁速 +4',           b4:'4件：血量低于 50% 时全伤害 +35% 且免疫打断' }
};

// 物品、9 格装备、绝世孤品 与 纯外物法宝（type: 'treasure'，不加人物基础属性）
window.GAME_DATA.ITEMS = {
  // ===== 丹药、礼赠、奇物 =====
  heal_pill:      { id:'heal_pill',      name:'桂花回春丹',   icon:'item_elixir_pill',    price:15, type:'consumable', hp:105, desc:'恢复 105 点气血，丹香微甜。' },
  qi_pill:        { id:'qi_pill',        name:'冰泉聚气散',   icon:'item_elixir_pill',    price:15, type:'consumable', qi:80,  desc:'恢复 80 点灵力，入口清冽。' },
  condense_pill:  { id:'condense_pill',  name:'破境凝元丹',   icon:'item_elixir_pill',    price:55, type:'consumable', exp:85, fullRestore:true, desc:'修为 +85 且气血灵力全满。' },
  marrow_pill:    { id:'marrow_pill',    name:'筑基洗髓丹',   icon:'item_elixir_pill',    price:95, type:'consumable', exp:130, marrow:true, desc:'修为 +130，五维随机精进 +2。' },
  beast_fruit:    { id:'beast_fruit',    name:'赤灵妖果',     icon:'item_osmanthus_cake', price:25, type:'beast_food', desc:'灵兽最爱灵果，喂养可大幅提升灵兽经验与亲密度。' },
  osmanthus_cake: { id:'osmanthus_cake', name:'云州桂花糕',   icon:'item_osmanthus_cake', price:20, type:'gift', desc:'市井点心，赠予喜甜道友大幅增进羁绊。' },
  mystery_box:    { id:'mystery_box',    name:'古修遗匣',     icon:'item_spirit_stone',   price:30, type:'box',  desc:'鬼市未启封旧匣，可能开出灵石、装备或孤品。' },
  lightning_plate:{ id:'lightning_plate',name:'避雷引灵阵盘', icon:'item_lightning_disk', price:80, type:'relic',desc:'渡劫破境时祭出可引走九霄天雷。' },

  // ===== 纯外物法宝（不加人物基础属性！可装配到 2 格独立外物法宝栏）=====
  tr_flying_sword: {
    id:'tr_flying_sword', name:'悬浮青霜飞剑', type:'treasure', mode:'auto', tier:'玄品', icon:'item_frost_sword', price:140,
    cd: 3.4, dmg: 34, poiseDmg: 14,
    desc:'【悬浮自动出击】不加个人属性；战中每 3.4 秒自动御剑斩击敌手，兼顾破定。'
  },
  tr_poison_needle: {
    id:'tr_poison_needle', name:'碧磷透骨针', type:'treasure', mode:'auto', tier:'灵品', icon:'item_lightning_disk', price:95,
    cd: 3.0, dmg: 16, poison: 3,
    desc:'【悬浮自动出击】不加个人属性；战中每 3.0 秒自动射出毒针，叠加 3 层蚀骨毒。'
  },
  tr_soul_bell: {
    id:'tr_soul_bell', name:'幽冥摄魂铃', type:'treasure', mode:'active', tier:'玄品', icon:'item_jade_ring', price:150,
    cd: 7.5, dmg: 28, poiseDmg: 45, knockAtb: 35,
    desc:'【主动祭出】不加个人属性；震荡敌手神魂，重创定力并击退 35 点集气。'
  },
  tr_spirit_banner: {
    id:'tr_spirit_banner', name:'聚灵护道幡', type:'treasure', mode:'active', tier:'灵品', icon:'item_spirit_stone', price:110,
    cd: 8.0, shield: 65, heal: 55, qi: 30,
    desc:'【主动祭出】不加个人属性；展开灵幡为自身回复气血灵力并附加 65 灵盾。'
  },

  // ===== 武器 (slot: weapon) =====
  eq_iron_sword:    { id:'eq_iron_sword',    name:'青钢长剑',     slot:'weapon', tier:'凡品', icon:'item_frost_sword', price:25,  type:'equip', stats:{ atk:8 }, desc:'寻常灵铁长剑，剑身沉稳。' },
  eq_qingyun_sword: { id:'eq_qingyun_sword', name:'青云制式剑',   slot:'weapon', tier:'灵品', set:'qingyun', icon:'item_frost_sword', price:75, type:'equip', stats:{ atk:16, crit:0.06 }, desc:'【青云剑宗套】外门制式剑，出剑轻灵。' },
  eq_frost_blade:   { id:'eq_frost_blade',   name:'寒霜灵剑',     slot:'weapon', tier:'玄品', set:'qingyun', icon:'item_frost_sword', price:165, type:'equip', stats:{ atk:28, crit:0.12, sense:3 }, desc:'【青云剑宗套】北冥寒铁所铸，剑锋凛冽。' },
  eq_iron_staff:    { id:'eq_iron_staff',    name:'玄铁镇岳棍',   slot:'weapon', tier:'玄品', set:'iron',    icon:'item_frost_sword', price:160, type:'equip', stats:{ atk:32, body:4, def:6 }, desc:'【玄铁反震套】沉重无比，重击破定极强。' },
  eq_nether_blade:  { id:'eq_nether_blade',  name:'幽冥噬魂刃',   slot:'weapon', tier:'玄品', set:'blood',   icon:'item_frost_sword', price:165, type:'equip', stats:{ atk:35, crit:0.14, hpMax:-20 }, desc:'【血煞狂战套】煞气逼人，攻伐极盛。' },
  eq_uniq_sky_rod:  { id:'eq_uniq_sky_rod',  name:'【孤品】太古混元棍', slot:'weapon', tier:'地品', unique:true, uniqueEffect:'heavy_poise', icon:'item_frost_sword', price:320, type:'equip', stats:{ atk:46, body:6 }, desc:'【绝世孤品】无套装羁绊，重招破定翻倍且无视敌方 30% 防御。' },

  // ===== 衣服 (slot: clothes) =====
  eq_cloth_robe:    { id:'eq_cloth_robe',    name:'玄青道袍',     slot:'clothes', tier:'凡品', icon:'item_spirit_stone', price:25,  type:'equip', stats:{ hpMax:35, def:4 }, desc:'寻常粗灵麻道袍。' },
  eq_cloud_robe:    { id:'eq_cloud_robe',    name:'流云青衫',     slot:'clothes', tier:'灵品', set:'qingyun', icon:'item_spirit_stone', price:85,  type:'equip', stats:{ hpMax:75, def:8, speed:2 }, desc:'【青云剑宗套】灵蚕丝织就，轻盈护体。' },
  eq_xuan_armor:    { id:'eq_xuan_armor',    name:'玄铁内甲',     slot:'clothes', tier:'玄品', set:'iron',    icon:'item_lightning_disk', price:155, type:'equip', stats:{ hpMax:125, def:16 }, desc:'【玄铁反震套】重甲护身，大幅化解冲击。' },
  eq_blood_cloak:   { id:'eq_blood_cloak',   name:'血煞战袍',     slot:'clothes', tier:'玄品', set:'blood',   icon:'item_spirit_stone', price:150, type:'equip', stats:{ hpMax:85, def:10, atk:12 }, desc:'【血煞狂战套】阴煞护身，越战越勇。' },
  eq_uniq_undying:  { id:'eq_uniq_undying',  name:'【孤品】不灭血衣', slot:'clothes', tier:'地品', unique:true, uniqueEffect:'cheat_death', icon:'item_spirit_stone', price:300, type:'equip', stats:{ hpMax:110, def:12, atk:14 }, desc:'【绝世孤品】每场战斗免疫一次致命伤，保留 20% 气血并瞬间满集气！' },

  // ===== 头饰 (slot: head) =====
  eq_wood_pin:      { id:'eq_wood_pin',      name:'青木玉簪',     slot:'head', tier:'凡品', icon:'item_jade_ring', price:30, type:'equip', stats:{ qiMax:20, sense:2 }, desc:'温润木簪，凝神静气。' },
  eq_qingyun_crown: { id:'eq_qingyun_crown', name:'青云剑冠',     slot:'head', tier:'灵品', set:'qingyun', icon:'item_jade_ring', price:90, type:'equip', stats:{ qiMax:35, crit:0.06, sense:3 }, desc:'【青云剑宗套】剑宗内门束发玉冠。' },
  eq_venom_circlet: { id:'eq_venom_circlet', name:'碧鳞毒冠',     slot:'head', tier:'玄品', set:'venom',   icon:'item_jade_ring', price:145, type:'equip', stats:{ sense:5, qiMax:40, atk:10 }, desc:'【万毒幽冥套】百毒不侵，催动毒功更快。' },

  // ===== 靴子 (slot: boots) =====
  eq_straw_boots:   { id:'eq_straw_boots',   name:'踏云布靴',     slot:'boots', tier:'凡品', icon:'item_spirit_stone', price:35,  type:'equip', stats:{ def:3, speed:2, dodge:0.05 }, desc:'轻便行脚布靴。' },
  eq_wind_boots:    { id:'eq_wind_boots',    name:'疾风灵靴',     slot:'boots', tier:'灵品', set:'qingyun', icon:'item_lightning_disk', price:95, type:'equip', stats:{ def:6, speed:5, dodge:0.12 }, desc:'【青云剑宗套】靴底铭刻疾风纹，集气迅捷。' },
  eq_shadow_boots:  { id:'eq_shadow_boots',  name:'幽影步履',     slot:'boots', tier:'玄品', set:'venom',   icon:'item_lightning_disk', price:165, type:'equip', stats:{ def:8, speed:8, dodge:0.18, crit:0.06 }, desc:'【万毒幽冥套】身法如鬼魅，闪避极高。' },

  // ===== 双护腕 (slot: wrist，可装左护腕 wristL 或右护腕 wristR) =====
  eq_leather_wrist: { id:'eq_leather_wrist', name:'灵犀护腕',     slot:'wrist', tier:'凡品', icon:'item_jade_ring', price:35, type:'equip', stats:{ atk:5, def:3 }, desc:'贴合手腕的柔韧护具。' },
  eq_iron_wrist:    { id:'eq_iron_wrist',    name:'玄铁震腕',     slot:'wrist', tier:'灵品', set:'iron',  icon:'item_lightning_disk', price:85, type:'equip', stats:{ def:8, hpMax:40 }, desc:'【玄铁反震套】厚重护腕，架招稳如泰山。' },
  eq_blood_wrist:   { id:'eq_blood_wrist',   name:'嗜血魔腕',     slot:'wrist', tier:'玄品', set:'blood', icon:'item_jade_ring', price:130, type:'equip', stats:{ atk:14, speed:3, crit:0.07 }, desc:'【血煞狂战套】激发脉门杀意，出手如电。' },

  // ===== 双饰品 (slot: acc，可装饰品一 acc1 或饰品二 acc2) =====
  eq_clear_jade:    { id:'eq_clear_jade',    name:'清心玉佩',     slot:'acc', tier:'凡品', icon:'item_jade_ring', price:45,  type:'equip', stats:{ qiMax:25, expRate:0.08 }, desc:'宁心聚气，修炼效率 +8%。' },
  eq_merchant_jade: { id:'eq_merchant_jade', name:'聚宝灵佩',     slot:'acc', tier:'灵品', icon:'item_jade_ring', price:95,  type:'equip', stats:{ luck:5, sense:4, def:4 }, desc:'万宝楼管事信物，气运神识双增。' },
  eq_venom_sachet:  { id:'eq_venom_sachet',  name:'五毒香囊',     slot:'acc', tier:'玄品', set:'venom', icon:'item_osmanthus_cake', price:140, type:'equip', stats:{ atk:10, sense:4, luck:3 }, desc:'【万毒幽冥套】暗藏百虫毒瘴，叠毒奇效。' },
  eq_uniq_venom_eye:{ id:'eq_uniq_venom_eye',name:'【孤品】蚀骨妖瞳', slot:'acc', tier:'地品', unique:true, uniqueEffect:'poison_crit', icon:'item_jade_ring', price:280, type:'equip', stats:{ sense:6, luck:6, crit:0.10 }, desc:'【绝世孤品】令【蚀骨毒】每跳伤害均可触发暴击！' },

  // ===== 戒指 (slot: ring，主要决定行囊容量，高阶附带稀有属性) =====
  eq_wood_ring:     { id:'eq_wood_ring',     name:'寻常储物戒',   slot:'ring', tier:'凡品', icon:'item_jade_ring', price:20,  type:'equip', stats:{ bagCap:15 }, desc:'寻常空间戒，可纳 15 格灵物。' },
  eq_qiankun_ring:  { id:'eq_qiankun_ring',  name:'乾坤须弥戒',   slot:'ring', tier:'灵品', icon:'item_jade_ring', price:100, type:'equip', stats:{ bagCap:25, qiMax:25, healBonus:0.15 }, desc:'高阶须弥戒，行囊扩至 25 格，丹药保鲜增效 +15%。' },
  eq_ancient_ring:  { id:'eq_ancient_ring',  name:'【孤品】太虚古玉戒', slot:'ring', tier:'地品', unique:true, icon:'item_jade_ring', price:260, type:'equip', stats:{ bagCap:35, expRate:0.15, sense:5, luck:4 }, desc:'【绝世孤品】内蕴一方须弥空间（35 格），温养神识并提升 15% 修炼速度。' }
};
