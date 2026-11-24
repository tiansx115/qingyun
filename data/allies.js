window.GAME_DATA = window.GAME_DATA || {};

// 情绪状态机标准五态：常态 / 浅笑 / 凌厉 / 微羞 / 战损
// 后续 RTX 5080 批量出图后，只需按 asset 键名放入 assets/chars/ 并在 ASSETS_MAP 注册即可自动生效；
// 未放入新图前自动无缝回退到 fallback 已有立绘，确保零裂图。
window.GAME_DATA.ALLY_DEFS = {
  sister: {
    id: 'sister', name: '林清霜', seal: '青云首徒', title: '青云剑宗大师姐',
    unlockedByDefault: true, baseBond: 30, power: 26,
    weaponName: '寒霜剑', weaponIcon: 'item_frost_sword',
    favGift: 'osmanthus_cake',
    elements: { gold: 85, wood: 40, water: 92, fire: 25, earth: 48 },
    exprs: [
      { key: 'normal',  label: '全身', asset: 'sister_full',    fallback: 'sister_full' },
      { key: 'smile',   label: '浅笑', asset: 'sister_smile',   fallback: 'sister_smile' },
      { key: 'fierce',  label: '凌厉', asset: 'sister_fierce',  fallback: 'sister_fierce' },
      { key: 'shy',     label: '微羞', asset: 'sister_shy',     fallback: 'sister_smile' },
      { key: 'injured', label: '战损', asset: 'sister_injured', fallback: 'sister_fierce' }
    ],
    desc: '青云剑宗首徒，外冷内热，剑法极稳。交情达 45 可邀同行，达 60 可开启专属剑心支线。',
    quest: {
      reqBond: 60, flag: 'ally_quest_sister',
      title: '寒霜剑心 · 暮林听雪',
      text: '暮色竹林间微雪初落，林清霜收剑入鞘，难得卸下大师姐的持重：“入山十年，宗门上下皆视我为剑宗表率，唯有在你面前，倒不必时刻端着架子。今日不妨与我合演一遍《霜华剑阵》？”',
      choices: [
        { text: '与师姐共演双剑合璧，印证剑道', hint: '羁绊+20 修为+90 悟性+2', eff: { bond: 20, exp: 90, wit: 2, expr: 'shy', toast: '双剑合鸣，林清霜耳尖微红，羁绊 +20，悟性 +2。' } },
        { text: '借机请教青云内门剑意诀窍', hint: '羁绊+12 攻击+根骨+2', eff: { bond: 12, exp: 70, body: 2, expr: 'smile', toast: '剑道切磋颇有所得，根骨 +2，羁绊 +12。' } }
      ]
    }
  },
  elder: {
    id: 'elder', name: '玄虚子', seal: '古玉残魂', title: '上古剑修残魂',
    unlockedByDefault: true, baseBond: 35, power: 32,
    weaponName: '玄虚古玉', weaponIcon: 'item_jade_ring',
    favGift: 'qi_pill',
    elements: { gold: 95, wood: 55, water: 62, fire: 78, earth: 70 },
    exprs: [
      { key: 'normal',  label: '淡然', asset: 'elder',          fallback: 'elder' },
      { key: 'smile',   label: '欣慰', asset: 'elder_smile',    fallback: 'elder' },
      { key: 'fierce',  label: '肃杀', asset: 'elder_fierce',   fallback: 'elder' },
      { key: 'shy',     label: '追忆', asset: 'elder_shy',      fallback: 'elder' },
      { key: 'injured', label: '残虚', asset: 'elder_injured',  fallback: 'elder' }
    ],
    desc: '蛰伏古玉的上古剑修残魂，阅历深不可测。交情达 45 可战中助阵，达 60 可开启古玉往事支线。',
    quest: {
      reqBond: 60, flag: 'ally_quest_elder',
      title: '玄虚旧梦 · 残魂补全',
      text: '古玉戒泛起温润清光，玄虚子虚影凝实几分：“老夫当年陨落于域外雷劫，一缕残魂沉睡千年。小友一路稳扎稳打，颇合老夫心意。这门上古凝神剑诀残意，便传于你罢。”',
      choices: [
        { text: '诚心受教，领悟上古剑意', hint: '羁绊+20 修为+120 道心+3', eff: { bond: 20, exp: 120, mind: 3, expr: 'smile', toast: '得玄虚子真传，修为 +120，道心 +3，羁绊 +20。' } },
        { text: '询问古玉戒是否还藏有上古秘库坐标', hint: '灵石+120 气运+2', eff: { bond: 12, stone: 120, luck: 2, expr: 'normal', toast: '玄虚子失笑指点一处旧藏，获 120 灵石，气运 +2。' } }
      ]
    }
  },
  shen: {
    id: 'shen', name: '沈云舒', seal: '万宝掌柜', title: '鬼市万宝楼管事',
    unlockedByDefault: false, baseBond: 25, power: 24,
    weaponName: '聚宝灵佩', weaponIcon: 'item_jade_ring',
    favGift: 'osmanthus_cake',
    elements: { gold: 88, wood: 62, water: 74, fire: 45, earth: 80 },
    exprs: [
      { key: 'normal',  label: '从容', asset: 'shen_full',      fallback: 'sister_full' },
      { key: 'smile',   label: '浅笑', asset: 'shen_smile',     fallback: 'sister_smile' },
      { key: 'fierce',  label: '冷峻', asset: 'shen_fierce',    fallback: 'sister_fierce' },
      { key: 'shy',     label: '微羞', asset: 'shen_shy',       fallback: 'sister_smile' },
      { key: 'injured', label: '战损', asset: 'shen_injured',   fallback: 'sister_fierce' }
    ],
    desc: '万宝楼东洲分号女掌柜，精于鉴宝与商路布局。推进万宝楼线即可结交，交情达 45 可邀同行。',
    quest: {
      reqBond: 60, flag: 'ally_quest_shen',
      title: '万宝暗账 · 东洲商契',
      text: '鬼市雅间内檀香袅袅，沈云舒将一本玄黑密账推到你面前：“东洲几家世家暗中联手压价，欲吞万宝楼丹药商路。你脑子活络，可愿与我联名签下这份东洲商契，共分三成暗股？”',
      choices: [
        { text: '落笔签契，与沈云舒共掌东洲丹药商路', hint: '羁绊+22 灵石+180 口才+3', eff: { bond: 22, stone: 180, talk: 3, expr: 'smile', toast: '商契落定，获分红 180 灵石，口才 +3，羁绊 +22。' } },
        { text: '提醒她暗账中尚有两处世家破绽，先手反制', hint: '羁绊+18 声望+25 悟性+2', eff: { bond: 18, fame: 25, wit: 2, expr: 'shy', toast: '沈云舒眸光一亮赞你心思缜密，声望 +25，羁绊 +18。' } }
      ]
    }
  },
  liu: {
    id: 'liu', name: '柳若云', seal: '玄天内门', title: '玄天宗世家女修',
    unlockedByDefault: false, baseBond: 15, power: 30,
    weaponName: '流云剑', weaponIcon: 'item_frost_sword',
    favGift: 'osmanthus_cake',
    elements: { gold: 76, wood: 68, water: 84, fire: 40, earth: 55 },
    exprs: [
      { key: 'normal',  label: '清冷', asset: 'liu_full',       fallback: 'sister_full' },
      { key: 'smile',   label: '释然', asset: 'liu_smile',      fallback: 'sister_smile' },
      { key: 'fierce',  label: '持剑', asset: 'liu_fierce',     fallback: 'sister_fierce' },
      { key: 'shy',     label: '微窘', asset: 'liu_shy',        fallback: 'sister_smile' },
      { key: 'injured', label: '战损', asset: 'liu_injured',    fallback: 'sister_fierce' }
    ],
    desc: '曾登思过崖退婚的玄天宗内门女修。思过崖旧事之后方可往来，若化干戈为玉帛亦可结为道友。',
    quest: {
      reqBond: 60, flag: 'ally_quest_liu',
      title: '思过崖雪 · 冰释前嫌',
      text: '再逢于竹林石亭，柳若云垂眸片刻，轻叹一声：“昔年退婚之事，实乃族中长老施压，我亦年少轻狂。如今见你凭自身本事走到这一步，方知当日狭隘。”',
      choices: [
        { text: '“过往云烟不必再提，日后东洲论剑便是。”', hint: '羁绊+25 道心+3 修为+90', eff: { bond: 25, mind: 3, exp: 90, expr: 'shy', toast: '旧怨尽释，柳若云神色柔和许多，羁绊 +25，道心 +3。' } },
        { text: '顺势交换玄天宗与东洲修行心得', hint: '羁绊+15 悟性+3', eff: { bond: 15, wit: 3, exp: 75, expr: 'smile', toast: '两派心得互参，悟性 +3，羁绊 +15。' } }
      ]
    }
  },
  moli: {
    id: 'moli', name: '墨离', seal: '幽冥暗使', title: '幽冥玄宗接引使',
    unlockedByDefault: false, baseBond: 25, power: 34,
    weaponName: '幽冥噬魂刃', weaponIcon: 'item_lightning_disk',
    favGift: 'qi_pill',
    elements: { gold: 70, wood: 30, water: 65, fire: 90, earth: 60 },
    exprs: [
      { key: 'normal',  label: '冷漠', asset: 'moli_full',      fallback: 'elder' },
      { key: 'smile',   label: '冷笑', asset: 'moli_smile',     fallback: 'elder' },
      { key: 'fierce',  label: '煞气', asset: 'moli_fierce',    fallback: 'elder' },
      { key: 'shy',     label: '罕见', asset: 'moli_shy',       fallback: 'elder' },
      { key: 'injured', label: '战损', asset: 'moli_injured',   fallback: 'elder' }
    ],
    desc: '幽冥玄宗行事狠辣的暗使，只服强者。开启幽冥暗线即可结交，战中合击威力冠绝众人。',
    quest: {
      reqBond: 60, flag: 'ally_quest_moli',
      title: '幽冥秘誓 · 煞海同舟',
      text: '暗巷深处幽火摇曳，墨离抛来一枚暗金令牌：“幽冥玄宗历来弱肉强食，能让我托付后背的同道寥寥无几。你既有胆色走这条路，这份魔宗淬体秘录便与你共享。”',
      choices: [
        { text: '接过淬体秘录，共研幽冥攻伐之术', hint: '羁绊+22 根骨+3 修为+110', eff: { bond: 22, body: 3, exp: 110, expr: 'smile', toast: '煞气淬体大成，根骨 +3，修为 +110，羁绊 +22。' } },
        { text: '与墨离约定利益均分、互不掣肘', hint: '羁绊+15 灵石+140', eff: { bond: 15, stone: 140, expr: 'normal', toast: '墨离嗤笑一声爽快应下，分予 140 灵石。' } }
      ]
    }
  }
};

// 炼丹炉配方表
window.GAME_DATA.ALCHEMY_RECIPES = [
  { id: 'heal_pill',     name: '桂花回春丹', cost: 12, targetMin: 35, targetMax: 65, speed: 1.5, desc: '气血 +95，温火易成。' },
  { id: 'qi_pill',       name: '冰泉聚气散', cost: 12, targetMin: 38, targetMax: 66, speed: 1.6, desc: '灵力 +75，火候平稳。' },
  { id: 'condense_pill', name: '破境凝元丹', cost: 42, targetMin: 42, targetMax: 62, speed: 2.1, desc: '服之修为 +85 且气血灵力全满，火候区间较窄。' },
  { id: 'marrow_pill',   name: '筑基洗髓丹', cost: 80, targetMin: 45, targetMax: 60, speed: 2.6, desc: '服之根骨/悟性/道心随机 +2 且修为 +130，极考验控火。' }
];

// 鬼市拍卖会动态拍品池（含绝世孤品、套装重器与玄品外物法宝）
window.GAME_DATA.AUCTION_LOTS = [
  { itemId: 'eq_frost_blade',    startPrice: 95,  marketPrice: 165, rivalMax: 160 },
  { itemId: 'eq_xuan_armor',     startPrice: 90,  marketPrice: 155, rivalMax: 150 },
  { itemId: 'eq_shadow_boots',   startPrice: 100, marketPrice: 165, rivalMax: 160 },
  { itemId: 'eq_uniq_sky_rod',   startPrice: 190, marketPrice: 320, rivalMax: 300 },
  { itemId: 'eq_uniq_undying',   startPrice: 180, marketPrice: 300, rivalMax: 285 },
  { itemId: 'eq_uniq_venom_eye', startPrice: 170, marketPrice: 280, rivalMax: 265 },
  { itemId: 'eq_ancient_ring',   startPrice: 155, marketPrice: 260, rivalMax: 245 },
  { itemId: 'tr_flying_sword',   startPrice: 85,  marketPrice: 140, rivalMax: 135 },
  { itemId: 'tr_soul_bell',      startPrice: 90,  marketPrice: 150, rivalMax: 145 }
];

// 多结局定义与二周目传承点数
window.GAME_DATA.ENDINGS = [
  {
    id: 'sword_ascend', title: '剑道飞升 · 青云真君', points: 3,
    check: G => G.realmIdx >= 5 && (G.factions?.qingyun || 0) >= 3,
    desc: '你以青云内门真传之身渡过九霄天劫，证道元婴真君，御剑云海之上，名传东洲千年。'
  },
  {
    id: 'merchant_lord', title: '富甲东洲 · 万宝大掌柜', points: 3,
    check: G => (G.factions?.wanbao || 0) >= 3 && G.stone >= 500,
    desc: '你执掌东洲丹药与法宝命脉，灵石堆积如山，三大宗门皆须礼敬三分，走出一条前无古人的商道长生路。'
  },
  {
    id: 'nether_sovereign', title: '幽冥魔尊 · 独断万古', points: 3,
    check: G => (G.factions?.nether || 0) >= 3 && G.realmIdx >= 3,
    desc: '你以幽冥亲传之姿横压东洲正魔两道，魔功大成无人敢拂其锋，令幽冥玄宗重临东洲之巅。'
  },
  {
    id: 'bamboo_companion', title: '逍遥仙侣 · 隐世竹林', points: 2,
    check: G => Object.values(G.allies || {}).some(a => (a.bond || 0) >= 85),
    desc: '你厌倦宗门纷争，与肝胆相照的知己道友归隐暮色竹林，朝观云海、暮煮灵茶，逍遥自在。'
  },
  {
    id: 'mortal_dream', title: '红尘问道 · 东洲行纪', points: 1,
    check: () => true,
    desc: '光阴荏苒，你游历东洲山河、历尽尘世冷暖。虽未踏破虚空，然此生快意恩仇，亦算无憾。'
  }
];
