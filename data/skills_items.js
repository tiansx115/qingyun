window.GAME_DATA = window.GAME_DATA || {};

window.GAME_DATA.REALMS = [
  { name: '炼气一层', exp: 90,   maxHp: 130,  maxQi: 85,   ageBonus: 0 },
  { name: '炼气四层', exp: 180,  maxHp: 210,  maxQi: 140,  ageBonus: 12 },
  { name: '炼气圆满', exp: 300,  maxHp: 310,  maxQi: 215,  ageBonus: 25 },
  { name: '筑基初期', exp: 520,  maxHp: 520,  maxQi: 360,  ageBonus: 90,  tribulation: true },
  { name: '金丹大道', exp: 900,  maxHp: 900,  maxQi: 640,  ageBonus: 220, tribulation: true },
  { name: '元婴真君', exp: 1500, maxHp: 1560, maxQi: 1180, ageBonus: 420, tribulation: true },
  { name: '化神尊者', exp: 2400, maxHp: 2600, maxQi: 2000, ageBonus: 700, tribulation: true, reqDao60: 1 },
  { name: '合道圣君', exp: 3800, maxHp: 4200, maxQi: 3400, ageBonus: 1200,tribulation: true, reqDao100: 1 },
  { name: '万道仙帝', exp: 99999,maxHp: 8800, maxQi: 7200, ageBonus: 9999,tribulation: true, reqDao100: 6 }
];

// 六大仙道造诣（0~100 宗师度：单门神通圆满贡献 20~22 点，须兼修同道诸法方能达 100 化境）
window.GAME_DATA.SKILL_CATS = {
  sword: { id:'sword', name:'剑道', desc:'御剑飞仙、剑气分光、诛仙剑阵；满 60 增会心，满 100 御剑分化。' },
  spell: { id:'spell', name:'法道', desc:'混元法术、五行真法、九霄神雷；满 60 增相生，满 100 减耗破抗。' },
  body:  { id:'body',  name:'体道', desc:'纯阳锻体、古神法相、燃血魔功；满 60 增气血破定，满 100 血盾附伤。' },
  array: { id:'array', name:'符阵', desc:'护身灵罩、奇门困阵、乾坤反震；满 60 固盾，满 100 阵眼反制。' },
  soul:  { id:'soul',  name:'魂蛊', desc:'神识灭魂、奇虫万蛊、幽冥咒术；满 60 穿甲叠蛊，满 100 毒咒会心。' },
  pact:  { id:'pact',  name:'灵契', desc:'通灵御兽、青木回春、丹元渡厄；满 60 强灵兽，满 100 协同扑杀。' }
};

window.GAME_DATA.ELEM_NAMES = {
  none: '无属性·通用',
  gold: '金系',
  wood: '木系',
  water: '水系',
  fire: '火系',
  earth: '土系'
};

// 主修仙典（心法 · 装配 1 部，含无属性通用仙典与五行高阶仙典）
window.GAME_DATA.HEART_ARTS = {
  turtle_breath:  { id:'turtle_breath',  name:'《太虚混元功》', elem:'none',  style:'通用固本·护道', expBonus:0.16, defBonus:8, reflect:0.22, desc:'【无属性通用】不挑灵根，受击减伤 +8，灵盾存在时反震 22% 伤害。' },
  qingyun_breath: { id:'qingyun_breath', name:'《青云太白剑典》', elem:'gold', style:'庚金御剑·会心', expBonus:0.24, hpBonus:30, critBonus:0.12, desc:'【金系仙典】剑宗嫡传，会心率 +12%，气血 +30，金灵根越高进境越快。' },
  xuanxu_sutra:   { id:'xuanxu_sutra',   name:'《五气朝元真经》', elem:'none', style:'万法相生·通玄', expBonus:0.32, atkBonus:14, desc:'【无属性上古仙经】全神通基础威力 +14，五行相生增幅翻倍。' },
  nether_sutra:   { id:'nether_sutra',   name:'《焚血化魔真诀》', elem:'fire', style:'燃血煞体·搏命', expBonus:0.38, atkBonus:16, berserk:true, desc:'【火系魔典】气血越低集气与神通威力越盛（最高 +65%），附 12% 汲血。' },
  wanbao_manual:  { id:'wanbao_manual',  name:'《大衍神君录》',   elem:'water',style:'泥丸养神·御物', expBonus:0.26, qiBonus:45, petBonus:0.35, desc:'【水系神魂典】灵力 +45，体外法宝、灵兽与同行道友威力 +35%。' },
  venom_sutra:    { id:'venom_sutra',    name:'《碧璘万蛊经》',   elem:'wood', style:'奇虫万蛊·蚀魂', expBonus:0.25, poisonBonus:2, desc:'【木系蛊典】每次施展神通额外附着 2 层【噬心蛊】，蛊毒每跳伤害 +30%。' }
};

// 悟道秘印（规则质变器 · 最多装配 3 枚）
window.GAME_DATA.PASSIVES = {
  p_crit_edge:    { id:'p_crit_edge',    name:'剑心通明印', style:'会心回气', desc:'会心伤害由 150% 提至 185%，触发会心时立即返还 12 点集气。' },
  p_heavy_force:  { id:'p_heavy_force',  name:'重渊破禁印', style:'大神通破定', desc:'集气消耗 ≥ 70 的大神通威力额外 +28%，削减敌方架势 +40%。' },
  p_venom_mist:   { id:'p_venom_mist',   name:'毒火攻心印', style:'蛊火联动', desc:'神通命中附带 1 层【噬心蛊】；火系或魂蛊神通命中带蛊目标额外结算一次蛊伤。' },
  p_thorns_shell: { id:'p_thorns_shell', name:'乾坤反震印', style:'金身反制', desc:'施展护体化劲额外凝出 35 灵盾，受击时反震伤害提升 +30%。' },
  p_beast_bond:   { id:'p_beast_bond',   name:'通幽灵契印', style:'御兽协同', desc:'出战灵兽与道友集气速度 +25%，施展灵契神通时全队额外回血。' },
  p_blood_fury:   { id:'p_blood_fury',   name:'以血代灵印', style:'逆命燃血', desc:'气血低于 50% 时集气速率 +30%，每次施法汲取 10 点气血。' }
};

// 30 门仙道神通与通用法术（6 大仙道 × 5 门 = 30 门！）
// elem: 'none' 为市面上流通的【无属性通用法术】（不看灵根高低，1.0x 基准修行）；
// elem: 'gold'|'wood'|'water'|'fire'|'earth' 受 1~100 灵根资质显著影响修行快慢与灵耗！
window.GAME_DATA.SKILLS = {
  // ===== 1. 剑道 (5：2通用 + 金/水/火) =====
  basic_sword:    { id:'basic_sword',    name:'御剑术',       cat:'sword', elem:'none',  atbCost:35, qiCost:8,  power:0.95, poiseDmg:14, critBonus:0.08, price:20, desc:'【通用·35集气】修仙界最基础的驱剑法门，不挑灵根，出手迅捷。' },
  cloud_pierce:   { id:'cloud_pierce',   name:'太白分光剑',   cat:'sword', elem:'gold',  atbCost:48, qiCost:14, power:1.35, poiseDmg:20, critBonus:0.16, price:38, desc:'【金·48集气】庚金剑气一分为三疾刺死穴，会心率 +16%。' },
  sister_frost:   { id:'sister_frost',   name:'玄冥寒霜剑阵', cat:'sword', elem:'water', atbCost:70, qiCost:22, power:1.78, poiseDmg:28, slowEnemy:18,   price:48, desc:'【水·70集气】寒霜剑阵封锁气机，重创敌手并冻结击退 18 点集气。' },
  star_sword_rain:{ id:'star_sword_rain',name:'离火燎原剑气', cat:'sword', elem:'fire',  atbCost:85, qiCost:26, power:2.25, poiseDmg:36, critBonus:0.15, reqMastery:28, price:68, desc:'【火·85集气】赤炎附剑化作火雨倾泻，兼具高额爆发与破定。' },
  grandpa_finger: { id:'grandpa_finger', name:'太虚斩仙剑意', cat:'sword', elem:'none',  atbCost:96, qiCost:34, power:2.65, poiseDmg:44, critBonus:0.22, reqMastery:45, price:90, desc:'【通用绝学·96集气】纯粹神意化剑，不拘五行，斩破万法护体！' },

  // ===== 2. 法道 (5：1通用 + 火/水/土/金雷) =====
  swift_blade:      { id:'swift_blade',      name:'混元灵弹术',   cat:'spell', elem:'none',  atbCost:36, qiCost:9,  power:1.00, poiseDmg:16, price:20, desc:'【通用·36集气】散修人人皆会的无属性灵力飞弹，平顺省灵。' },
  flame_saber:      { id:'flame_saber',      name:'离火焚天诀',   cat:'spell', elem:'fire',  atbCost:56, qiCost:16, power:1.62, poiseDmg:24, price:38, desc:'【火·56集气】引地肺真火轰击敌阵，火灵根越高焚灭威力越盛。' },
  demon_parry_blade:{ id:'demon_parry_blade',name:'癸水重渊术',   cat:'spell', elem:'water', atbCost:68, qiCost:20, power:1.85, poiseDmg:30, slowEnemy:15, price:50, desc:'【水·68集气】一元重水压顶，重创气血并迟滞敌方 15 点集气。' },
  blood_cleave:     { id:'blood_cleave',     name:'戊土陨星坠',   cat:'spell', elem:'earth', atbCost:84, qiCost:26, power:2.20, poiseDmg:46, reqMastery:28, price:68, desc:'【土·84集气】召唤天外玄黄陨石砸落，巨额削减敌方护体架势。' },
  sky_rend_saber:   { id:'sky_rend_saber',   name:'九霄神雷正法', cat:'spell', elem:'gold',  atbCost:98, qiCost:35, power:2.85, poiseDmg:50, critBonus:0.18, reqMastery:45, price:95, desc:'【金雷绝学·98集气】煌煌天威引雷灭敌，法道至高攻伐神通。' },

  // ===== 3. 体道 (5：2通用 + 土/火/金) =====
  wind_rod:         { id:'wind_rod',         name:'纯阳气血冲',   cat:'body',  elem:'none',  atbCost:38, qiCost:8,  power:1.02, poiseDmg:22, drainHp:8, price:22, desc:'【通用·38集气】激荡肉身纯阳气血近身震击，汲回 8 点气血。' },
  sweep_staff:      { id:'sweep_staff',      name:'玄黄撼山印',   cat:'body',  elem:'earth', atbCost:56, qiCost:14, power:1.48, poiseDmg:36, shield:25, price:38, desc:'【土·56集气】肉身凝出玄黄重印硬撼强敌，大削架势并凝 25 灵盾。' },
  whirl_staff:      { id:'whirl_staff',      name:'燃血修罗相',   cat:'body',  elem:'fire',  atbCost:72, qiCost:18, power:1.95, poiseDmg:36, berserkScale:true, drainHp:18, price:52, desc:'【火·72集气】燃烧精血显化修罗法相，失血越多神通越狂暴并吸血。' },
  dragon_subdue_rod:{ id:'dragon_subdue_rod',name:'太白金刚体',   cat:'body',  elem:'gold',  atbCost:86, qiCost:24, power:2.35, poiseDmg:48, shield:45, reqMastery:28, price:70, desc:'【金·86集气】肉身化作庚金神铁撞碎敌阵，兼得厚盾与破防。' },
  sky_smash_staff:  { id:'sky_smash_staff',  name:'古神碎星撞',   cat:'body',  elem:'none',  atbCost:100,qiCost:28, power:2.95, poiseDmg:60, berserkScale:true, reqMastery:45, price:95, desc:'【通用体道绝学·100集气】上古体修舍身一击，无需灵根，一击碎定破甲！' },

  // ===== 4. 符阵 (5：2通用 + 土/水/金) =====
  silk_palm:   { id:'silk_palm',   name:'混元灵光罩',   cat:'array', elem:'none',  atbCost:35, qiCost:9,  power:0.75, poiseDmg:12, shield:38, price:20, desc:'【通用·35集气】坊市最实用的护身灵罩符法，任何灵根皆可瞬发叠盾。' },
  evade_step:  { id:'evade_step',  name:'戊土玄圭阵',   cat:'array', elem:'earth', atbCost:48, qiCost:13, power:0.90, poiseDmg:18, shield:56, price:35, desc:'【土·48集气】布下戊土厚重阵纹，凝出 56 点稳固护体灵盾。' },
  vajra_fist:  { id:'vajra_fist',  name:'弱水困仙禁',   cat:'array', elem:'water', atbCost:62, qiCost:18, power:1.25, poiseDmg:24, shield:48, slowEnemy:22, price:48, desc:'【水·62集气】奇门弱水阵困锁敌手，叠 48 盾并大幅倒退敌方集气。' },
  iron_counter:{ id:'iron_counter',name:'乾坤反震大阵', cat:'array', elem:'gold',  atbCost:76, qiCost:22, power:1.35, poiseDmg:30, shield:80, shieldDmg:0.68, reqMastery:28, price:68, desc:'【金·76集气】凝 80 巨盾，并将当前护盾 68% 化作阵纹反震真伤！' },
  taiji_seal:  { id:'taiji_seal',  name:'九宫天罡镇魔阵',cat:'array',elem:'none',  atbCost:92, qiCost:28, power:1.70, poiseDmg:42, shield:115, shieldDmg:0.92, reqMastery:45, price:90, desc:'【通用阵道绝学·92集气】不挑灵根的宗师杀阵，凝 115 盾并爆出 92% 护盾真伤！' },

  // ===== 5. 魂蛊 (5：2通用神识 + 木蛊/火咒) =====
  venom_dart:  { id:'venom_dart',  name:'惊神刺',       cat:'soul',  elem:'none',  atbCost:36, qiCost:10, power:0.92, poiseDmg:20, slowEnemy:12, price:24, desc:'【通用神识·36集气】凝聚神识无形刺入敌手识海，不看灵根，削定退气。' },
  corpse_mist: { id:'corpse_mist', name:'青木噬心蛊',   cat:'soul',  elem:'wood',  atbCost:46, qiCost:12, power:0.82, poiseDmg:12, poison:5, price:35, desc:'【木·46集气】放出奇虫蛊雾附着敌身，瞬间叠加 5 层无视防御【噬心蛊】。' },
  venom_miasma:{ id:'venom_miasma',name:'幽冥腐骨瘴',   cat:'soul',  elem:'wood',  atbCost:64, qiCost:18, power:1.05, poiseDmg:18, poison:7, slowEnemy:14, price:50, desc:'【木·64集气】阴瘴蚀魂，叠 7 层剧毒并令敌方神魂迟滞。' },
  soul_flame:  { id:'soul_flame',  name:'九幽焚魂咒',   cat:'soul',  elem:'fire',  atbCost:74, qiCost:22, power:1.55, poiseDmg:26, poison:3, drainHp:16, reqMastery:28, price:66, desc:'【火·74集气】魔焰灼烧元神，附蛊毒并汲取生机反哺自身。' },
  venom_burst: { id:'venom_burst', name:'万蛊蚀魂爆',   cat:'soul',  elem:'none',  atbCost:84, qiCost:26, power:1.25, poiseDmg:26, detonatePoison:true, reqMastery:42, price:88, desc:'【通用魂蛊绝学·84集气】以神识引爆敌身全部蛊毒层数，瞬间结算毁天灭地真伤！' },

  // ===== 6. 灵契 (5：2通用 + 木/水/土) =====
  spirit_call:   { id:'spirit_call',   name:'驱物通灵诀',   cat:'pact', elem:'none',  atbCost:38, qiCost:10, power:0.80, poiseDmg:14, healTeam:42, boostAllyAtb:25, price:22, desc:'【通用·38集气】沟通随身灵兽与道友气机，回血 +42 并助其集气 +25。' },
  mind_strike:   { id:'mind_strike',   name:'青木长生渡厄诀',cat:'pact', elem:'wood',  atbCost:54, qiCost:16, power:0.75, poiseDmg:14, healTeam:78, boostAllyAtb:35, price:38, desc:'【木·54集气】乙木生机流转全队，恢复 78 气血并令灵兽道友集气 +35！' },
  beast_frenzy:  { id:'beast_frenzy',  name:'狂兽血契印',   cat:'pact', elem:'fire',  atbCost:62, qiCost:18, power:1.20, poiseDmg:24, boostAllyAtb:50, price:48, desc:'【火·62集气】激发灵兽凶煞血脉，令灵兽与道友集气瞬间暴涨 +50！' },
  earth_nurture: { id:'earth_nurture', name:'厚土归元灵契', cat:'pact', elem:'earth', atbCost:72, qiCost:22, power:0.95, poiseDmg:20, healTeam:85, shield:50, reqMastery:28, price:65, desc:'【土·72集气】大地灵气反哺己身，回血 +85 并凝出 50 护盾。' },
  celestial_hymn:{ id:'celestial_hymn',name:'万灵仙契大阵', cat:'pact', elem:'none',  atbCost:85, qiCost:28, power:1.05, poiseDmg:22, healTeam:135, shield:60, boostAllyAtb:60, reqMastery:42, price:88, desc:'【通用灵契绝学·85集气】人与天地万灵共鸣，回血 +135、叠 60 盾，灵兽道友瞬间满势出击！' }
};

// 身上 9 格修士穿戴槽（本源法器/法衣/道冠/灵履/双护脉镯/双通灵佩/须弥储物戒）
window.GAME_DATA.EQUIP_SLOTS = [
  { key:'weapon',  label:'法器' },
  { key:'clothes', label:'法衣' },
  { key:'head',    label:'道冠' },
  { key:'boots',   label:'法履' },
  { key:'wristL',  label:'左法镯' },
  { key:'wristR',  label:'右法镯' },
  { key:'acc1',    label:'灵佩一' },
  { key:'acc2',    label:'灵佩二' },
  { key:'ring',    label:'须弥戒' }
];

// 宗门与古修套装效果（2件 / 4件）
window.GAME_DATA.SETS = {
  qingyun: { name:'青云太白套', b2:'2件：会心率 +10%，剑道威力 +12%', b4:'4件：触发会心时额外回复 15 点集气与 8 点灵力' },
  iron:    { name:'玄黄镇岳套', b2:'2件：护体防御 +12，气血 +80',     b4:'4件：灵盾反震伤害 +35%，护身化劲额外叠 45 灵盾' },
  venom:   { name:'幽冥万蛊套', b2:'2件：施法附加 +2 层噬心蛊',       b4:'4件：蛊毒跳伤 +45%，引爆蛊毒后保留一半层数' },
  blood:   { name:'焚血魔尊套', b2:'2件：生机汲取 +10%，遁速 +4',     b4:'4件：气血低于 50% 时全神通伤害 +35%' }
};

// 物品、9 格法器法衣、绝世古宝孤品、2格纯外物法宝 与 天地唯一【造化轮回盘】
window.GAME_DATA.ITEMS = {
  // ===== 天地唯一转生至宝（全世界强制锁定仅此 1 件！使用后破空飞走重藏随机秘处）=====
  reincarnation_disc: {
    id:'reincarnation_disc', name:'【唯一至宝】造化轮回盘', icon:'item_lightning_disk',
    price:999, type:'reincarnation', tier:'仙品', unique:true, worldUnique:true,
    desc:'天地间仅存一件的太古轮回至宝！寿尽洞府兵解可高额继承天赋、造诣并洗练灵根；战死瞬间亦可护住残魂仓促转生。触发后立即破空遁走，重藏世间未知处。'
  },

  // ===== 丹药、灵果、悟道仙珍 =====
  dao_tea:        { id:'dao_tea',        name:'悟道古茶树叶', icon:'item_osmanthus_cake', price:180, type:'dao_item', tier:'地品', daoPts:15, desc:'中州悟道神树所结奇叶，服之可任选一条仙道法则直接参悟 +15 点本源！' },
  longevity_peach:{ id:'longevity_peach',name:'千年延寿蟠桃', icon:'item_osmanthus_cake', price:220, type:'consumable', tier:'地品', addMaxAge:40, hp:300, desc:'海外仙岛灵桃，服下可逆天增补 40 载寿元上限！' },
  heal_pill:      { id:'heal_pill',      name:'百草回春丹',   icon:'item_elixir_pill',    price:15, type:'consumable', hp:105, desc:'恢复 105 点气血，药力温润绵长。' },
  qi_pill:        { id:'qi_pill',        name:'寒泉聚灵散',   icon:'item_elixir_pill',    price:15, type:'consumable', qi:80,  desc:'恢复 80 点灵力，清冽提神。' },
  condense_pill:  { id:'condense_pill',  name:'破境凝元丹',   icon:'item_elixir_pill',    price:55, type:'consumable', exp:85, fullRestore:true, desc:'修为 +85 且气血灵力瞬间圆满。' },
  marrow_pill:    { id:'marrow_pill',    name:'易经洗髓灵丹', icon:'item_elixir_pill',    price:95, type:'consumable', exp:130, marrow:true, desc:'修为 +130，五维随机 +2 且随机洗练提升一项五行灵根资质 +4！' },
  beast_fruit:    { id:'beast_fruit',    name:'赤灵朱果',     icon:'item_osmanthus_cake', price:25, type:'beast_food', desc:'天地灵根所结朱果，喂养灵兽可大幅提升血脉经验与亲密度。' },
  osmanthus_cake: { id:'osmanthus_cake', name:'云州灵桂糕',   icon:'item_osmanthus_cake', price:20, type:'gift', desc:'灵米佐桂花精制糕点，赠予道友可增进仙缘羁绊。' },
  mystery_box:    { id:'mystery_box',    name:'古修遗物囊',   icon:'item_spirit_stone',   price:30, type:'box',  desc:'残破储物袋，启封或可得灵石、法器乃至上古机缘。' },
  lightning_plate:{ id:'lightning_plate',name:'九宫避劫阵盘', icon:'item_lightning_disk', price:80, type:'relic',desc:'大境界渡劫时祭出，可替身引走九霄劫雷。' },

  // ===== 纯外物法宝（不加个人面板属性！神识达标方可驾驭 1~2 件）=====
  tr_flying_sword: {
    id:'tr_flying_sword', name:'青霜子母飞剑', type:'treasure', mode:'auto', tier:'玄品', icon:'item_frost_sword', price:140,
    cd: 3.4, dmg: 34, poiseDmg: 14,
    desc:'【悬浮自动御敌】纯外物不加属性；以神识操控，每 3.4 秒自动化光斩击敌手并削定。'
  },
  tr_poison_needle: {
    id:'tr_poison_needle', name:'幽冥透骨母针', type:'treasure', mode:'auto', tier:'灵品', icon:'item_lightning_disk', price:95,
    cd: 3.0, dmg: 16, poison: 3,
    desc:'【悬浮自动御敌】纯外物不加属性；每 3.0 秒无声激射毒芒，叠加 3 层噬心蛊。'
  },
  tr_soul_bell: {
    id:'tr_soul_bell', name:'太古摄魂金铃', type:'treasure', mode:'active', tier:'玄品', icon:'item_jade_ring', price:150,
    cd: 7.5, dmg: 28, poiseDmg: 45, knockAtb: 35,
    desc:'【主动祭出】纯外物不加属性；摇动金铃震荡元神，重创架势并击退 35 点集气。'
  },
  tr_spirit_banner: {
    id:'tr_spirit_banner', name:'混元护道灵幡', type:'treasure', mode:'active', tier:'灵品', icon:'item_spirit_stone', price:110,
    cd: 8.0, shield: 65, heal: 55, qi: 30,
    desc:'【主动祭出】纯外物不加属性；展幡垂下玄光，回复气血灵力并凝出 65 灵盾。'
  },

  // ===== 本源法器 (slot: weapon) =====
  eq_iron_sword:    { id:'eq_iron_sword',    name:'青竹灵剑',         slot:'weapon', tier:'凡品', icon:'item_frost_sword', price:25,  type:'equip', stats:{ atk:8 }, desc:'三年青灵竹炼制的入门飞剑。' },
  eq_qingyun_sword: { id:'eq_qingyun_sword', name:'太白分光剑器',     slot:'weapon', tier:'灵品', set:'qingyun', icon:'item_frost_sword', price:75, type:'equip', stats:{ atk:16, crit:0.06 }, desc:'【青云太白套】剑宗内门制式飞剑，灵动锋锐。' },
  eq_frost_blade:   { id:'eq_frost_blade',   name:'北冥寒魄剑',       slot:'weapon', tier:'玄品', set:'qingyun', icon:'item_frost_sword', price:165, type:'equip', stats:{ atk:28, crit:0.12, sense:3 }, desc:'【青云太白套】北冥寒髓凝铸，剑气刺魂。' },
  eq_iron_staff:    { id:'eq_iron_staff',    name:'玄黄翻天印',       slot:'weapon', tier:'玄品', set:'iron',    icon:'item_lightning_disk', price:160, type:'equip', stats:{ atk:32, body:4, def:6 }, desc:'【玄黄镇岳套】戊土灵山重石祭炼之法印，破定极强。' },
  eq_nether_blade:  { id:'eq_nether_blade',  name:'幽冥百鬼幡',       slot:'weapon', tier:'玄品', set:'blood',   icon:'item_frost_sword', price:165, type:'equip', stats:{ atk:35, crit:0.14, hpMax:-20 }, desc:'【焚血魔尊套】魔道凶器，煞气反噬但攻伐恐怖。' },
  eq_uniq_sky_rod:  { id:'eq_uniq_sky_rod',  name:'【古宝】乾坤量天尺', slot:'weapon', tier:'地品', unique:true, uniqueEffect:'heavy_poise', icon:'item_frost_sword', price:320, type:'equip', stats:{ atk:46, body:6 }, desc:'【绝世古宝】上古大能遗留道尺，大神通破定翻倍且无视 30% 防御。' },

  // ===== 法衣 (slot: clothes) =====
  eq_cloth_robe:    { id:'eq_cloth_robe',    name:'青麻避尘道袍',     slot:'clothes', tier:'凡品', icon:'item_spirit_stone', price:25,  type:'equip', stats:{ hpMax:35, def:4 }, desc:'铭刻基础避尘符文的散修道袍。' },
  eq_cloud_robe:    { id:'eq_cloud_robe',    name:'太乙流云法衣',     slot:'clothes', tier:'灵品', set:'qingyun', icon:'item_spirit_stone', price:85,  type:'equip', stats:{ hpMax:75, def:8, speed:2 }, desc:'【青云太白套】天蚕灵丝织就，御风轻灵。' },
  eq_xuan_armor:    { id:'eq_xuan_armor',    name:'戊土玄圭宝甲',     slot:'clothes', tier:'玄品', set:'iron',    icon:'item_lightning_disk', price:155, type:'equip', stats:{ hpMax:125, def:16 }, desc:'【玄黄镇岳套】灵龟甲片嵌合阵纹，不动如山。' },
  eq_blood_cloak:   { id:'eq_blood_cloak',   name:'修罗燃血魔衣',     slot:'clothes', tier:'玄品', set:'blood',   icon:'item_spirit_stone', price:150, type:'equip', stats:{ hpMax:85, def:10, atk:12 }, desc:'【焚血魔尊套】血煞护体，越战越凶。' },
  eq_uniq_undying:  { id:'eq_uniq_undying',  name:'【古宝】涅槃不灭衣', slot:'clothes', tier:'地品', unique:true, uniqueEffect:'cheat_death', icon:'item_spirit_stone', price:300, type:'equip', stats:{ hpMax:110, def:12, atk:14 }, desc:'【绝世古宝】每场斗法可替死涅槃一次，保留 20% 气血并瞬间满集气！' },

  // ===== 道冠 (slot: head) =====
  eq_wood_pin:      { id:'eq_wood_pin',      name:'养魂青木簪',   slot:'head', tier:'凡品', icon:'item_jade_ring', price:30, type:'equip', stats:{ qiMax:20, sense:2 }, desc:'温养泥丸宫的百年雷击木簪。' },
  eq_qingyun_crown: { id:'eq_qingyun_crown', name:'紫金太白道冠', slot:'head', tier:'灵品', set:'qingyun', icon:'item_jade_ring', price:90, type:'equip', stats:{ qiMax:35, crit:0.06, sense:3 }, desc:'【青云太白套】剑宗真传束发道冠，清心凝神。' },
  eq_venom_circlet: { id:'eq_venom_circlet', name:'万蛊辟邪冠',   slot:'head', tier:'玄品', set:'venom',   icon:'item_jade_ring', price:145, type:'equip', stats:{ sense:5, qiMax:40, atk:10 }, desc:'【幽冥万蛊套】神识外放如网，催动魂蛊更快。' },

  // ===== 法履 (slot: boots) =====
  eq_straw_boots:   { id:'eq_straw_boots',   name:'轻身御风履', slot:'boots', tier:'凡品', icon:'item_spirit_stone', price:35,  type:'equip', stats:{ def:3, speed:2, dodge:0.05 }, desc:'铭刻轻身符的云履。' },
  eq_wind_boots:    { id:'eq_wind_boots',    name:'缩地登云靴', slot:'boots', tier:'灵品', set:'qingyun', icon:'item_lightning_disk', price:95, type:'equip', stats:{ def:6, speed:5, dodge:0.12 }, desc:'【青云太白套】一步数丈，集气迅捷。' },
  eq_shadow_boots:  { id:'eq_shadow_boots',  name:'幽冥鬼影履', slot:'boots', tier:'玄品', set:'venom',   icon:'item_lightning_disk', price:165, type:'equip', stats:{ def:8, speed:8, dodge:0.18, crit:0.06 }, desc:'【幽冥万蛊套】身化虚影，遁速惊人。' },

  // ===== 左右护脉法镯 (slot: wrist) =====
  eq_leather_wrist: { id:'eq_leather_wrist', name:'聚灵护脉镯', slot:'wrist', tier:'凡品', icon:'item_jade_ring', price:35, type:'equip', stats:{ atk:5, def:3 }, desc:'稳固手少阳经脉的青玉法镯。' },
  eq_iron_wrist:    { id:'eq_iron_wrist',    name:'玄黄金刚镯', slot:'wrist', tier:'灵品', set:'iron',  icon:'item_lightning_disk', price:85, type:'equip', stats:{ def:8, hpMax:40 }, desc:'【玄黄镇岳套】沉重灵镯，护体灵光倍增。' },
  eq_blood_wrist:   { id:'eq_blood_wrist',   name:'焚血锁魂钏', slot:'wrist', tier:'玄品', set:'blood', icon:'item_jade_ring', price:130, type:'equip', stats:{ atk:14, speed:3, crit:0.07 }, desc:'【焚血魔尊套】催发经脉煞力，施法凌厉。' },

  // ===== 双通灵玉佩 (slot: acc) =====
  eq_clear_jade:    { id:'eq_clear_jade',    name:'宁心温玉佩',     slot:'acc', tier:'凡品', icon:'item_jade_ring', price:45,  type:'equip', stats:{ qiMax:25, expRate:0.08 }, desc:'吐纳灵气效率 +8%。' },
  eq_merchant_jade: { id:'eq_merchant_jade', name:'天机聚宝佩',     slot:'acc', tier:'灵品', icon:'item_jade_ring', price:95,  type:'equip', stats:{ luck:5, sense:4, def:4 }, desc:'万宝楼秘传灵佩，气运与神识双增。' },
  eq_venom_sachet:  { id:'eq_venom_sachet',  name:'百虫育蛊囊',     slot:'acc', tier:'玄品', set:'venom', icon:'item_osmanthus_cake', price:140, type:'equip', stats:{ atk:10, sense:4, luck:3 }, desc:'【幽冥万蛊套】随身温养奇虫毒瘴。' },
  eq_uniq_venom_eye:{ id:'eq_uniq_venom_eye',name:'【古宝】破妄妖瞳玉', slot:'acc', tier:'地品', unique:true, uniqueEffect:'poison_crit', icon:'item_jade_ring', price:280, type:'equip', stats:{ sense:6, luck:6, crit:0.10 }, desc:'【绝世古宝】令【噬心蛊】每跳伤害皆可触发会心暴击！' },

  // ===== 须弥储物戒 (slot: ring) =====
  eq_wood_ring:     { id:'eq_wood_ring',     name:'下品储物戒',       slot:'ring', tier:'凡品', icon:'item_jade_ring', price:20,  type:'equip', stats:{ bagCap:15 }, desc:'内辟丈许空间，可纳 15 格修仙资粮。' },
  eq_qiankun_ring:  { id:'eq_qiankun_ring',  name:'乾坤须弥戒',       slot:'ring', tier:'灵品', icon:'item_jade_ring', price:100, type:'equip', stats:{ bagCap:25, qiMax:25, healBonus:0.15 }, desc:'上品须弥空间（25 格），封存灵丹药效 +15%。' },
  eq_ancient_ring:  { id:'eq_ancient_ring',  name:'【古宝】太虚洞天戒', slot:'ring', tier:'地品', unique:true, icon:'item_jade_ring', price:260, type:'equip', stats:{ bagCap:35, expRate:0.15, sense:5, luck:4 }, desc:'【绝世古宝】内蕴一方小洞天（35 格），温养元神并提升 15% 吐纳速度。' }
};
