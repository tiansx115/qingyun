window.GAME_DATA = window.GAME_DATA || {};

window.GAME_DATA.REALMS = [
  { name: '炼气一层', exp: 90, maxHp: 120, maxQi: 80, ageBonus: 0 },
  { name: '炼气四层', exp: 180, maxHp: 190, maxQi: 135, ageBonus: 10 },
  { name: '炼气九层', exp: 300, maxHp: 280, maxQi: 210, ageBonus: 20 },
  { name: '筑基初期', exp: 520, maxHp: 460, maxQi: 360, ageBonus: 100, tribulation: true },
  { name: '金丹大道', exp: 900, maxHp: 820, maxQi: 640, ageBonus: 300, tribulation: true },
  { name: '元婴真君', exp: 9999, maxHp: 1450, maxQi: 1200, ageBonus: 800, tribulation: true }
];

window.GAME_DATA.HEART_ARTS = {
  qingyun_breath: { id:'qingyun_breath', name:'《青云吐纳诀》', expBonus:0.20, hpBonus:25, desc:'青云剑宗基础心法，修炼效率 +20%，气血上限 +25。' },
  turtle_breath: { id:'turtle_breath', name:'《太虚龟息功》', expBonus:0.15, defBonus:6, desc:'散修隐匿心法，受击减伤 +6，修炼效率 +15%。' },
  xuanxu_sutra: { id:'xuanxu_sutra', name:'《玄虚剑经·残篇》', expBonus:0.35, atkBonus:10, desc:'古玉残魂所授上古剑经，修炼效率 +35%，剑诀威力 +10。' },
  nether_sutra: { id:'nether_sutra', name:'《幽冥噬魂诀》', expBonus:0.42, atkBonus:16, hpBonus:-25, desc:'幽冥玄宗秘传魔功，修炼效率 +42%，攻势 +16，然煞气伤身气血上限 -25。' },
  wanbao_manual: { id:'wanbao_manual', name:'《万宝凝神录》', expBonus:0.25, defBonus:8, qiBonus:35, desc:'万宝楼高阶商修心法，修炼效率 +25%，防御 +8，灵力上限 +35。' }
};

window.GAME_DATA.SKILLS = {
  basic_sword: { id:'basic_sword', name:'青云剑诀', cost:10, power:1.25, desc:'剑宗入门剑招，起手平稳，耗灵极低。' },
  evade_step: { id:'evade_step', name:'藏锋遁步', cost:14, power:0.9, shield:36, desc:'借步卸力凝出护体灵盾，攻守兼备。' },
  mind_strike: { id:'mind_strike', name:'诛心辩法', cost:18, power:0.65, talkScale:2.3, stun:true, desc:'以严密事理动摇对手道心，口才越高威力越强。' },
  grandpa_finger: { id:'grandpa_finger', name:'玄虚一指', cost:34, stoneCost:15, power:2.6, desc:'消耗 15 灵石温养古玉残魂，引动上古剑指重创强敌。' },
  sister_frost: { id:'sister_frost', name:'霜华剑阵', cost:24, power:1.9, desc:'引动寒霜剑气贯穿敌阵，附带迟滞威压。' },
  nether_claw: { id:'nether_claw', name:'幽冥裂魂爪', cost:22, power:2.15, drainHp:18, desc:'幽冥玄宗狠辣攻伐之术，重创敌手并汲取 18 点气血。' }
};

window.GAME_DATA.ARTIFACTS = {
  jade_ring: { id:'jade_ring', name:'裂纹古玉戒', lv:1, baseDmg:22, shield:15, icon:'item_jade_ring', desc:'内藏玄虚残魂的古玉，祭出可释放护主剑气并附加微盾。' },
  frost_embryo: { id:'frost_embryo', name:'青霜剑胚', lv:1, baseDmg:38, shield:0, icon:'item_frost_sword', desc:'青云宗外门赐予的灵剑胚，随祭炼等级提升御剑斩击威力。' },
  nether_bell: { id:'nether_bell', name:'幽冥摄魂铃', lv:1, baseDmg:32, shield:10, stunChance:0.5, icon:'item_lightning_disk', desc:'幽冥玄宗镇魂法器，祭出震荡敌手心神，有几率令其失守一回合。' }
};

window.GAME_DATA.EQUIP_SLOTS = [
  { key:'weapon', label:'佩剑 / 兵器' },
  { key:'robe', label:'道袍 / 护甲' },
  { key:'artifact', label:'本命法宝' },
  { key:'pendant', label:'随身玉佩' },
  { key:'boots', label:'身法灵靴' },
  { key:'pouch', label:'丹药储物囊' }
];

window.GAME_DATA.ITEMS = {
  // ===== 丹药、礼赠与奇物 =====
  heal_pill: { id:'heal_pill', name:'桂花回春丹', icon:'item_elixir_pill', desc:'恢复 95 点气血，丹香微甜。', price:15, type:'consumable', hp:95 },
  qi_pill: { id:'qi_pill', name:'冰泉聚气散', icon:'item_elixir_pill', desc:'恢复 75 点灵力，入口清冽。', price:15, type:'consumable', qi:75 },
  osmanthus_cake: { id:'osmanthus_cake', name:'云州桂花糕', icon:'item_osmanthus_cake', desc:'寻常市井点心，赠予喜甜之人可大幅增进交情。', price:20, type:'gift' },
  mystery_box: { id:'mystery_box', name:'古修遗匣', icon:'item_spirit_stone', desc:'鬼市未启封旧木匣，内中或藏灵石、心法残页或古修器物。', price:30, type:'box' },
  lightning_plate: { id:'lightning_plate', name:'避雷引灵阵盘', icon:'item_lightning_disk', desc:'渡劫时祭出可引走九霄天雷，稳妥破境。', price:80, type:'relic' },

  // ===== 佩剑 / 兵器 (slot: weapon) =====
  eq_iron_sword: {
    id:'eq_iron_sword', name:'青钢长剑', slot:'weapon', tier:'凡品', icon:'item_frost_sword',
    price:25, type:'equip', stats:{ atk:8 },
    desc:'凡铁掺灵砂锻造的长剑，剑身沉稳，适合炼气初期修士防身。'
  },
  eq_qingyun_sword: {
    id:'eq_qingyun_sword', name:'青云制式剑', slot:'weapon', tier:'灵品', icon:'item_frost_sword',
    price:75, type:'equip', stats:{ atk:16, qiMax:20 },
    desc:'青云剑宗外门制式佩剑，剑脊铭刻聚灵阵纹，出剑迅捷。'
  },
  eq_frost_blade: {
    id:'eq_frost_blade', name:'寒霜灵剑', slot:'weapon', tier:'玄品', icon:'item_frost_sword',
    price:160, type:'equip', stats:{ atk:26, qiMax:35, crit:0.12 },
    desc:'采北冥寒铁铸成的玄品飞剑，剑锋自带凛冽霜意，极易击破敌手要害。'
  },
  eq_nether_blade: {
    id:'eq_nether_blade', name:'幽冥噬魂刃', slot:'weapon', tier:'玄品', icon:'item_frost_sword',
    price:150, type:'equip', stats:{ atk:33, hpMax:-20, crit:0.18 },
    desc:'幽冥玄宗祭炼的窄锋长刃，煞气逼人，攻伐极盛却略损气血。'
  },

  // ===== 道袍 / 护甲 (slot: robe) =====
  eq_cloth_robe: {
    id:'eq_cloth_robe', name:'玄青道袍', slot:'robe', tier:'凡品', icon:'item_spirit_stone',
    price:25, type:'equip', stats:{ hpMax:30, def:3 },
    desc:'粗灵麻织就的玄青长袍，可抵御寻常刀剑与山间寒露。'
  },
  eq_cloud_robe: {
    id:'eq_cloud_robe', name:'流云青衫', slot:'robe', tier:'灵品', icon:'item_spirit_stone',
    price:80, type:'equip', stats:{ hpMax:65, def:8 },
    desc:'以灵蚕丝混织的道袍，衣袂间隐有流云微光，护体稳妥。'
  },
  eq_xuan_armor: {
    id:'eq_xuan_armor', name:'玄铁内甲', slot:'robe', tier:'玄品', icon:'item_lightning_disk',
    price:155, type:'equip', stats:{ hpMax:115, def:15 },
    desc:'古修遗留的轻薄玄铁软甲，穿于道袍之内可极大化解剑气冲击。'
  },
  eq_blood_cloak: {
    id:'eq_blood_cloak', name:'血煞法袍', slot:'robe', tier:'玄品', icon:'item_spirit_stone',
    price:140, type:'equip', stats:{ hpMax:75, def:10, atk:10 },
    desc:'幽冥玄宗执事法袍，以阴煞灵纹护身，交手时反增几分肃杀威势。'
  },

  // ===== 随身玉佩 (slot: pendant) =====
  eq_clear_jade: {
    id:'eq_clear_jade', name:'清心玉佩', slot:'pendant', tier:'凡品', icon:'item_jade_ring',
    price:45, type:'equip', stats:{ qiMax:25, expRate:0.08 },
    desc:'温润古玉佩，佩戴静修可宁心聚气，修炼效率 +8%。'
  },
  eq_merchant_jade: {
    id:'eq_merchant_jade', name:'聚宝灵佩', slot:'pendant', tier:'灵品', icon:'item_jade_ring',
    price:95, type:'equip', stats:{ def:4, luck:4, talk:4 },
    desc:'万宝楼管事信物，佩之气度沉稳，在坊市议价与机缘感应上大有裨益。'
  },
  eq_ancient_pendant: {
    id:'eq_ancient_pendant', name:'古修剑心佩', slot:'pendant', tier:'玄品', icon:'item_jade_ring',
    price:180, type:'equip', stats:{ atk:12, qiMax:45, expRate:0.15 },
    desc:'古修洞府出土的剑意玉佩，蕴含一缕不灭剑意，攻修皆宜。'
  },

  // ===== 身法灵靴 (slot: boots) =====
  eq_straw_boots: {
    id:'eq_straw_boots', name:'踏云布靴', slot:'boots', tier:'凡品', icon:'item_spirit_stone',
    price:35, type:'equip', stats:{ def:3, dodge:0.06 },
    desc:'轻便行脚灵靴，步履轻盈，交手时偶可侧身避开锋芒。'
  },
  eq_wind_boots: {
    id:'eq_wind_boots', name:'疾风灵靴', slot:'boots', tier:'灵品', icon:'item_lightning_disk',
    price:95, type:'equip', stats:{ def:6, atk:4, dodge:0.14 },
    desc:'靴底刻有疾风灵纹，腾挪迅捷，闪避几率显著提升。'
  },
  eq_shadow_boots: {
    id:'eq_shadow_boots', name:'幽影步履', slot:'boots', tier:'玄品', icon:'item_lightning_disk',
    price:165, type:'equip', stats:{ def:8, dodge:0.22, crit:0.08 },
    desc:'步法玄奇的暗纹灵靴，进退如影，往往能于敌手旧力已尽时反击要害。'
  },

  // ===== 丹药储物囊 (slot: pouch) =====
  eq_cloth_pouch: {
    id:'eq_cloth_pouch', name:'寻常布囊', slot:'pouch', tier:'凡品', icon:'item_elixir_pill',
    price:20, type:'equip', stats:{ bagCap:15, hpMax:10 },
    desc:'寻常修士所用的随身布囊，可纳 15 格灵物丹药。'
  },
  eq_qiankun_pouch: {
    id:'eq_qiankun_pouch', name:'乾坤储物袋', slot:'pouch', tier:'灵品', icon:'item_elixir_pill',
    price:90, type:'equip', stats:{ bagCap:20, qiMax:25, healBonus:0.20 },
    desc:'内蕴须弥阵法的储物袋，行囊扩至 20 格，封存丹药药效提升 20%。'
  },
  eq_dan_gourd: {
    id:'eq_dan_gourd', name:'紫金丹葫', slot:'pouch', tier:'玄品', icon:'item_elixir_pill',
    price:165, type:'equip', stats:{ bagCap:25, hpMax:40, healBonus:0.35 },
    desc:'古丹修留下的温玉紫金葫，行囊扩至 25 格，服用丹药恢复效果提升 35%。'
  }
};
