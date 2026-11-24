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
  xuanxu_sutra: { id:'xuanxu_sutra', name:'《玄虚剑经·残篇》', expBonus:0.35, atkBonus:10, desc:'古玉残魂所授上古剑经，修炼效率 +35%，剑诀威力 +10。' }
};

window.GAME_DATA.SKILLS = {
  basic_sword: { id:'basic_sword', name:'青云剑诀', cost:10, power:1.25, desc:'剑宗入门剑招，起手平稳，耗灵极低。' },
  evade_step: { id:'evade_step', name:'藏锋遁步', cost:14, power:0.9, shield:36, desc:'借步卸力凝出护体灵盾，攻守兼备。' },
  mind_strike: { id:'mind_strike', name:'诛心辩法', cost:18, power:0.65, talkScale:2.3, stun:true, desc:'以严密事理动摇对手道心，口才越高威力越强。' },
  grandpa_finger: { id:'grandpa_finger', name:'玄虚一指', cost:34, stoneCost:15, power:2.6, desc:'消耗 15 灵石温养古玉残魂，引动上古剑指重创强敌。' },
  sister_frost: { id:'sister_frost', name:'霜华剑阵', cost:24, power:1.9, desc:'引动寒霜剑气贯穿敌阵，附带迟滞威压。' }
};

window.GAME_DATA.ARTIFACTS = {
  jade_ring: { id:'jade_ring', name:'裂纹古玉戒', lv:1, baseDmg:22, shield:15, desc:'内藏玄虚残魂的古玉，祭出可释放护主剑气并附加微盾。' },
  frost_embryo: { id:'frost_embryo', name:'青霜剑胚', lv:1, baseDmg:38, shield:0, desc:'青云宗外门赐予的灵剑胚，随祭炼等级提升御剑斩击威力。' }
};

window.GAME_DATA.ITEMS = {
  heal_pill: { id:'heal_pill', name:'桂花回春丹', desc:'恢复 95 点气血，丹香微甜。', price:15, type:'consumable', hp:95 },
  qi_pill: { id:'qi_pill', name:'冰泉聚气散', desc:'恢复 75 点灵力，入口清冽。', price:15, type:'consumable', qi:75 },
  osmanthus_cake: { id:'osmanthus_cake', name:'云州桂花糕', desc:'寻常市井点心，赠予喜甜之人可大幅增进交情。', price:20, type:'gift' },
  mystery_box: { id:'mystery_box', name:'古修遗匣', desc:'鬼市未启封旧木匣，内中或藏灵石、心法残页。', price:30, type:'box' },
  lightning_plate: { id:'lightning_plate', name:'避雷引灵阵盘', desc:'渡劫时祭出可引走九霄天雷，稳妥破境。', price:80, type:'relic' }
};