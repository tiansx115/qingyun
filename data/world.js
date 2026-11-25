window.GAME_DATA = window.GAME_DATA || {};

window.GAME_DATA.TIMELINE = [
  { month: 4,  loc: 'sect',   title: '第1年·夏：青云剑宗外门试剑开启' },
  { month: 10, loc: 'market', title: '第1年·十月：四海万宝楼岁末鉴宝大拍' },
  { month: 16, loc: 'forest', title: '第2年·夏：苍莽妖林古洞府潮汐' },
  { month: 24, loc: 'sect',   title: '第2年·冬：栖霞洲宗门论剑大比' },
  { month: 36, loc: 'cliff',  title: '第3年·冬：思过断崖三年之约' },
  { month: 48, loc: 'forest', title: '第4年·冬：九幽魔潮入侵东洲' },
  { month: 66, loc: 'altar',  title: '第6年·夏：太初雷池太古秘境开启' }
];

window.GAME_DATA.ASSETS_MAP = {
  world_map: 'assets/scenes/world_map.webp',
  sect_plaza: 'assets/scenes/sect_plaza.webp',
  inn: 'assets/scenes/inn.webp',
  market: 'assets/scenes/market.webp',
  forest: 'assets/scenes/forest.webp',
  bamboo: 'assets/scenes/bamboo.webp',
  hero: 'assets/chars/hero.webp',
  hero_full: 'assets/chars/hero_full.webp',
  sister: 'assets/chars/sister.webp',
  sister_full: 'assets/chars/sister_full.webp',
  sister_smile: 'assets/chars/sister_smile.webp',
  sister_fierce: 'assets/chars/sister_fierce.webp',
  elder: 'assets/chars/elder.webp',
  wolf_boss: 'assets/chars/wolf_boss.webp',
  item_spirit_stone: 'assets/items/spirit_stone.webp',
  item_elixir_pill: 'assets/items/elixir_pill.webp',
  item_jade_ring: 'assets/items/jade_ring.webp',
  item_frost_sword: 'assets/items/frost_sword.webp',
  item_lightning_disk: 'assets/items/lightning_disk.webp',
  item_osmanthus_cake: 'assets/items/osmanthus_cake.webp',
  ui3a_title_bg: 'assets/ui3a/title_bg.jpg',
  ui3a_logo: 'assets/ui3a/logo_calligraphy.png',
  ui3a_plaque: 'assets/ui3a/plaque_vert.png',
  ui3a_avatar_ring: 'assets/ui3a/avatar_ring.png',
  ui3a_choice: 'assets/ui3a/choice_bar.png',
  ui3a_dialogue: 'assets/ui3a/dialogue_frame.png',
  ui3a_ico_map: 'assets/ui3a/ico_map.png',
  ui3a_ico_char: 'assets/ui3a/ico_char.png',
  ui3a_ico_skill: 'assets/ui3a/ico_skill.png',
  ui3a_ico_bag: 'assets/ui3a/ico_bag.png',
  ui3a_ico_ally: 'assets/ui3a/ico_ally.png',
  ui3a_ico_save: 'assets/ui3a/ico_save.png',
  ui3a_panel: 'assets/ui3a/panel_frame.png',
  ui3a_btn: 'assets/ui3a/btn_small.png',
  ui3a_hud_pill: 'assets/ui3a/hud_pill.png',
  ui3a_talisman: 'assets/ui3a/talisman_card.png',
  ui3a_beacon: 'assets/ui3a/map_beacon.png',
  ui3a_combat_hdr: 'assets/ui3a/combat_header.png'
};

window.GAME_DATA.AUDIO_MAP = {
  world_map: 'assets/audio/bgm_world.mp3',
  sect:      'assets/audio/bgm_sect.mp3',
  inn:       'assets/audio/bgm_inn.mp3',
  market:    'assets/audio/bgm_market.mp3',
  forest:    'assets/audio/bgm_forest.mp3',
  bamboo:    'assets/audio/bgm_bamboo.mp3',
  combat:    'assets/audio/bgm_combat.mp3'
};

// ===== 沧溟界 · 七分沧海五座大洲版图（全图东西横跨 120,000 里，海洋占 72% 面积）=====
window.GAME_DATA.REGIONS = [
  { id: 'east',    name: '东栖霞洲',     sub: '炼气～金丹 · 灵秀始源陆洲（距中洲约1.4万里）', pairs: [['sect','cave'], ['sect','inn'], ['sect','cliff'], ['cliff','market'], ['inn','market'], ['market','forest']] },
  { id: 'south',   name: '南赤瘴洲',     sub: '筑基～金丹 · 火山巫殿与隐世丹鼎神谷',           pairs: [['south_danding','south_fire'], ['south_fire','south_venom'], ['south_fire','south_beast']] },
  { id: 'north',   name: '北俱寒洲',     sub: '金丹～元婴 · 永冻冰川、凛冬剑冢与陨仙古坑',     pairs: [['north_ice','north_battle'], ['north_battle','north_demon']] },
  { id: 'central', name: '中钧天洲',     sub: '元婴～化神 · 大乾仙都、千年世家与钧天道碑',     pairs: [['central_capital','central_city'], ['central_city','central_stele']] },
  { id: 'ocean',   name: '沧溟大洋(72%)',sub: '近海群岛 → 外海沉船 → 深海龙庭 → 归墟海眼',   pairs: [['sea_star_isle','sea_pearl_isle'], ['sea_star_isle','sea_wreck'], ['sea_wreck','sea_dragon'], ['sea_dragon','sea_abyss']] },
  { id: 'yingzhou',name: '东极瀛洲(孤洲)',sub: '十万里绝灵黑水洋彼岸 · 古神遗族与太初雷池',     pairs: [['yingzhou_tree','altar']] }
];

// gx, gy 为沧溟界真实平面里数坐标 (0 ~ 120000 里)；seaZone: 0陆地, 1近海(需筑基/乘船), 2外海(需金丹/乘船), 3深海(需元婴/避水令), 4黑水洋彼岸(需元婴御空/化神裂空)
// hasTeleport: 设有仙盟跨洲古传送阵；isPort: 设有万宝商盟跨洋灵舟码头
window.GAME_DATA.LOCATIONS = [
  // ===== 1. 东栖霞洲 (gx: 18,000 ~ 23,000 里) =====
  {
    id: 'sect', region: 'east', name: '青云剑宗', icon: 'sword', x: 24, y: 38, gx: 19200, gy: 31000, seaZone: 0, hasTeleport: true,
    sceneBg: 'sect_plaza',
    desc: '栖霞灵脉主峰之上的正道剑宗，设有跨洲古传送阵与藏经阁。',
    npcs: [{ id: 'sister', name: '林清霜', title: '青云首徒', char: 'sister', left: '66%' }],
    hotspots: [
      { id: 'sect_trial', label: '宗门事务 / 钧天仙盟俸禄' },
      { id: 'sect_grand_tourney', label: '栖霞论剑大比' },
      { id: 'sect_library', label: '藏经阁参悟' },
      { id: 'sect_alchemy', label: '丹房炼丹' }
    ]
  },
  {
    id: 'cave', region: 'east', name: '栖云洞府', icon: 'home', x: 38, y: 26, gx: 19650, gy: 30400, seaZone: 0,
    sceneBg: 'bamboo',
    desc: '翠竹云海间的私人灵脉洞府，可深度闭关、封存跨世遗产与从容兵解转生。',
    npcs: [],
    hotspots: [{ id: 'cave_manage', label: '进入洞府 · 闭关/藏宝/轮回台' }]
  },
  {
    id: 'cliff', region: 'east', name: '思过断崖', icon: 'scroll', x: 16, y: 68, gx: 18750, gy: 31600, seaZone: 0,
    sceneBg: 'world_map',
    desc: '云雾翻涌的绝壁石坪，常有仙途旧怨在此了断。',
    npcs: [{ id: 'elder', name: '玄虚子', title: '古戒残魂', char: 'elder', left: '68%' }],
    hotspots: [{ id: 'cliff_event', label: '查探断崖石桌' }]
  },
  {
    id: 'inn', region: 'east', name: '天机茶肆', icon: 'ally', x: 50, y: 54, gx: 19800, gy: 31450, seaZone: 0, isPort: true,
    sceneBg: 'inn',
    desc: '东洲沿海仙城茶楼，毗邻出海灵舟港，四海修士在此打探轮回盘与天下邸报。',
    npcs: [{ id: 'innkeeper', name: '天机掌柜', title: '四海百晓生', char: 'elder', left: '64%' }],
    hotspots: [
      { id: 'inn_tea', label: '品茗调息 (耗2日·10灵石回满)' },
      { id: 'inn_rumor', label: '推演轮回盘与死敌行踪' }
    ]
  },
  {
    id: 'market', region: 'east', name: '幽暗鬼坊', icon: 'stone', x: 70, y: 68, gx: 20550, gy: 32100, seaZone: 0,
    sceneBg: 'market',
    desc: '地下溶洞中的黑市暗坊，万宝商盟分号与九幽暗桩混杂其间。',
    npcs: [{ id: 'merchant', name: '黑坊大掌柜', title: '万宝暗司', char: 'elder', left: '67%' }],
    hotspots: [
      { id: 'market_shop', label: '丹药奇物摊' },
      { id: 'market_equip', label: '鬼市法器坊' },
      { id: 'market_auction', label: '万宝岁末大拍' },
      { id: 'market_faction', label: '万宝商盟 · 鉴宝晋升' },
      { id: 'nether_path', label: '九幽暗巷（魔道机缘）' },
      { id: 'market_trade', label: '神识鉴宝赚灵石 (耗5日)' }
    ]
  },
  {
    id: 'forest', region: 'east', name: '苍莽妖林', icon: 'map', x: 82, y: 36, gx: 21400, gy: 30900, seaZone: 0,
    sceneBg: 'forest',
    desc: '古木遮天的东洲险地，深处藏有古修遗府与灵兽栖息谷。',
    npcs: [{ id: 'wolf', name: '赤瞳妖狼', title: '护谷妖兽', char: 'wolf_boss', left: '66%' }],
    hotspots: [
      { id: 'forest_stall', label: '谷口设摊售药 (耗10日)' },
      { id: 'forest_tame', label: '收养驯化灵兽' },
      { id: 'forest_ruin', label: '探索古修遗府' },
      { id: 'forest_demon_tide', label: '九幽魔潮防线' }
    ]
  },

  // ===== 2. 南赤瘴洲 (gx: 14,000 ~ 22,000 里, gy: 46,000 ~ 55,000 里) =====
  {
    id: 'south_danding', region: 'south', name: '隐世丹鼎神谷', icon: 'stone', x: 22, y: 34, gx: 18200, gy: 44500, seaZone: 0, hasTeleport: true,
    sceneBg: 'bamboo',
    desc: '超然中立的药王与天工圣谷，天下老怪皆登门求取延寿圣丹与古宝重铸。',
    npcs: [],
    hotspots: [
      { id: 'faction_danding', label: '丹鼎神谷 · 求取延寿丹 / 重铸法器' },
      { id: 'sect_alchemy', label: '借地火神炉炼丹' }
    ]
  },
  {
    id: 'south_fire', region: 'south', name: '赤炎火山脉', icon: 'bolt', x: 52, y: 46, gx: 16800, gy: 49200, seaZone: 0,
    sceneBg: 'world_map',
    desc: '祝融古巫殿祖地，十万火山喷薄地肺真炎，低灵根与体修淬体圣地。',
    npcs: [],
    hotspots: [
      { id: 'south_dao_body', label: '祝融巫殿 · 地火淬炼【体道/法道】' },
      { id: 'south_fire_lotus', label: '深入熔岩猎炎蛟夺洗髓莲' }
    ]
  },
  {
    id: 'south_venom', region: 'south', name: '千瘴巫蛊谷', icon: 'scroll', x: 30, y: 70, gx: 14900, gy: 52600, seaZone: 0,
    sceneBg: 'forest',
    desc: '毒雾终年不散的巫祝深谷，矗立太古【魂蛊大道】巫碑。',
    npcs: [],
    hotspots: [
      { id: 'south_dao_soul', label: '参悟【魂蛊大道】巫碑' },
      { id: 'south_trial_gu', label: '闯千瘴窟斩金蚕王' }
    ]
  },
  {
    id: 'south_beast', region: 'south', name: '万灵栖兽岭', icon: 'ally', x: 78, y: 62, gx: 20600, gy: 51400, seaZone: 0, isPort: true,
    sceneBg: 'bamboo',
    desc: '濒临南海的万兽灵山，盛产赤灵朱果并传承上古【灵契大道】。',
    npcs: [],
    hotspots: [
      { id: 'south_dao_pact', label: '参悟【灵契大道】兽图腾' },
      { id: 'south_beast_hunt', label: '秘岭采朱果历练' },
      { id: 'forest_tame', label: '缔结南荒异兽契' }
    ]
  },

  // ===== 3. 北俱寒洲 (gx: 12,000 ~ 21,000 里, gy: 8,000 ~ 16,000 里) =====
  {
    id: 'north_ice', region: 'north', name: '凛冬剑冢', icon: 'sword', x: 26, y: 38, gx: 14500, gy: 11200, seaZone: 0, hasTeleport: true,
    sceneBg: 'sect_plaza',
    desc: '万载玄冰封存亿万残剑的极道圣地，冰壁铭刻【剑道】与【符阵】至理。',
    npcs: [],
    hotspots: [
      { id: 'north_dao_sword_array', label: '观摩剑冢冰壁参悟【剑道/符阵】' },
      { id: 'north_ice_trial', label: '试剑凛冬护冢剑卫' }
    ]
  },
  {
    id: 'north_battle', region: 'north', name: '太古陨仙坑', icon: 'map', x: 54, y: 54, gx: 17800, gy: 13600, seaZone: 0, isPort: true,
    sceneBg: 'world_map',
    desc: '纪元大战坠落的星辰巨坑，遍地古宝残片与不灭战魂。',
    npcs: [],
    hotspots: [
      { id: 'north_scavenge', label: '神识搜寻陨坑古宝' },
      { id: 'north_war_soul', label: '激战太古破军战魂 (元婴级)' }
    ]
  },
  {
    id: 'north_demon', region: 'north', name: '九幽深渊总坛', icon: 'bolt', x: 78, y: 68, gx: 20800, gy: 9800, seaZone: 0,
    sceneBg: 'forest',
    desc: '盘踞北洲冰渊之底的九幽魔脉大本营，化神老魔坐镇其中。',
    npcs: [],
    hotspots: [
      { id: 'north_raid_demon', label: '独闯魔渊 · 讨伐九幽老祖 (化神Boss)' }
    ]
  },

  // ===== 4. 中钧天洲 (gx: 6,000 ~ 12,000 里, gy: 26,000 ~ 34,000 里) =====
  {
    id: 'central_capital', region: 'central', name: '大乾仙都·世家城', icon: 'home', x: 24, y: 62, gx: 7200, gy: 31800, seaZone: 0, hasTeleport: true,
    sceneBg: 'inn',
    desc: '大乾仙朝龙气汇聚之皇都，姬、崔、卢千年修仙世家盘踞于此。',
    npcs: [],
    hotspots: [
      { id: 'faction_daqian', label: '大乾仙朝 · 供奉支俸 / 世家血脉结契 / 悬赏死敌' }
    ]
  },
  {
    id: 'central_city', region: 'central', name: '钧天万仙城', icon: 'ally', x: 52, y: 46, gx: 9800, gy: 29500, seaZone: 0, hasTeleport: true,
    sceneBg: 'sect_plaza',
    desc: '钧天正道仙盟总枢，九州天骄齐聚论道，诸天仙典浩如烟海。',
    npcs: [],
    hotspots: [
      { id: 'central_arena', label: '登钧天骄子榜论道' },
      { id: 'sect_library', label: '万仙圣阁参悟诸天法门' }
    ]
  },
  {
    id: 'central_stele', region: 'central', name: '钧天悟道神碑', icon: 'scroll', x: 78, y: 34, gx: 11600, gy: 27200, seaZone: 0,
    sceneBg: 'sect_plaza',
    desc: '自太古矗立于中洲之巅的无字天碑，可参悟六大仙道直指 100 圆满！',
    npcs: [],
    hotspots: [
      { id: 'central_comprehend_dao', label: '坐忘神碑 · 专精参悟六大仙道本源' }
    ]
  },

  // ===== 5. 沧溟大洋 · 占世界 72% 面积 (gx: 28,000 ~ 82,000 里) =====
  {
    id: 'sea_star_isle', region: 'ocean', name: '近海·碎星散修岛', icon: 'stone', x: 18, y: 52, gx: 28500, gy: 33000, seaZone: 1, isPort: true, hasTeleport: true,
    sceneBg: 'market',
    desc: '距东洲七千里的近海最大散修自由港，万宝跨洋巨舰母港与散修盟驻地。',
    npcs: [],
    hotspots: [
      { id: 'sea_free_port', label: '碎星散修盟 · 跨海悬赏 / 远航仙珍市' },
      { id: 'north_sea_shop', label: '四海万宝跨洋舶市 (延寿桃/悟道茶)' }
    ]
  },
  {
    id: 'sea_pearl_isle', region: 'ocean', name: '近海·丹霞灵鳌岛', icon: 'ally', x: 30, y: 28, gx: 33200, gy: 26500, seaZone: 1, isPort: true,
    sceneBg: 'bamboo',
    desc: '珊瑚环绕的翡翠灵岛，栖息着万年玄鳌与海灵草。',
    npcs: [],
    hotspots: [
      { id: 'sea_hunt_turtle', label: '出海猎取海兽内丹 / 放生灵鳌结善缘' }
    ]
  },
  {
    id: 'sea_wreck', region: 'ocean', name: '外海·雷鸣沉船墓', icon: 'map', x: 48, y: 64, gx: 46000, gy: 38500, seaZone: 2, isPort: true,
    sceneBg: 'forest',
    desc: '狂暴雷云笼罩的外海古航道，海底沉没着无数上古跨海飞舟遗骸。',
    npcs: [],
    hotspots: [
      { id: 'sea_explore_wreck', label: '潜入海底古修沉船寻宝 (金丹海域)' }
    ]
  },
  {
    id: 'sea_dragon', region: 'ocean', name: '深海·苍渊海族龙庭', icon: 'home', x: 68, y: 40, gx: 64000, gy: 31000, seaZone: 3,
    sceneBg: 'sect_plaza',
    desc: '统御七成沧海的水晶妖庭，垄断万年延寿海心草与通海龙珠。',
    npcs: [],
    hotspots: [
      { id: 'faction_longting', label: '苍渊龙庭 · 海族朝觐 / 强闯水晶宝库' }
    ]
  },
  {
    id: 'sea_abyss', region: 'ocean', name: '极渊·归墟无底海眼', icon: 'bolt', x: 86, y: 58, gx: 82000, gy: 35000, seaZone: 3,
    sceneBg: 'world_map',
    desc: '亿万海水倒灌虚空的沧溟尽头，再往东便是隔绝万古的十万里绝灵黑水洋！',
    npcs: [],
    hotspots: [
      { id: 'sea_abyss_gaze', label: '凝视归墟海眼参悟天地法则 (元婴险地)' }
    ]
  },

  // ===== 6. 第五独立大洲 · 东极瀛洲 (gx: 112,000 ~ 118,000 里 · 隔绝十万里黑水洋！) =====
  {
    id: 'yingzhou_tree', region: 'yingzhou', name: '瀛洲·先天道果母树', icon: 'scroll', x: 38, y: 54, gx: 112500, gy: 33000, seaZone: 4,
    sceneBg: 'bamboo',
    desc: '彼岸孤洲古神遗族守护的太古神树，一片道叶即可洞穿大道本源！',
    npcs: [],
    hotspots: [
      { id: 'yingzhou_ancient_clan', label: '拜会古神遗族 · 树下参悟六大道果' }
    ]
  },
  {
    id: 'altar', region: 'yingzhou', name: '瀛洲·太初混沌雷池', icon: 'bolt', x: 72, y: 32, gx: 117000, gy: 29000, seaZone: 4, hasTeleport: true,
    sceneBg: 'world_map',
    desc: '沧溟界最接近天道本源的太初雷池，亦可自各洲借九霄引雷阵遥感渡劫，更是【满大道·万道仙帝】飞升之地！',
    npcs: [],
    hotspots: [
      { id: 'altar_break', label: '引雷破境渡劫（筑基～合道～万道仙帝）' },
      { id: 'altar_ancient_realm', label: '太初混沌秘境' },
      { id: 'altar_ascend', label: '问道飞升 · 结算不朽结局' }
    ]
  }
];

window.GAME_DATA.QUIZ = [
  {
    q: '初入沧溟界，你在海滨破庙醒来，怀中揣着一枚裂开微光的古玉戒指。你首先会如何处置？',
    opts: [
      { t: '以一缕微弱神识探入古戒，看看其中是否藏有上古修士传承。', eff: { wit:2, sense:3, talent:'宿慧通明' } },
      { t: '先用布帛包好贴身藏起，财不露白，先摸清修仙界规矩再说。', eff: { body:2, speed:2, talent:'深藏不露' } },
      { t: '去散修坊市旁敲侧击打听行情，攒下第一笔灵石资粮。', eff: { luck:3, stone:35, talent:'福缘深厚' } }
    ]
  },
  {
    q: '测灵大殿上，手按测灵晶柱之时，晶柱内灵光剧烈摇曳。你心念微沉，体内灵气呈现出何种气象？',
    opts: [
      { t: '一道赤红离火直冲柱顶，其余四色微不可察——偏科极致的火系天灵根！', eff: { body:2, sense:2, root:'离火天灵根', rootPreset:'sky_fire' } },
      { t: '庚金与玄水双光交织流转，其余三系暗淡——攻守相生的金水真灵根！', eff: { wit:2, speed:2, root:'金水双灵根', rootPreset:'dual_gold_water' } },
      { t: '五色微光平平无奇却生生不息——起步虽慢、万法皆可涉猎的五行杂灵根。', eff: { luck:3, wit:2, root:'五行均衡灵根', rootPreset:'five_balanced' } }
    ]
  },
  {
    q: '散修旧书摊上摆着几卷虫蛀玉简，摊主开口要价五十灵石，你细辨禁制纹路后如何抉择？',
    opts: [
      { t: '一眼识破表层伪禁，十枚灵石淘走摊角那块蕴含神魂秘术的古玉片。', eff: { sense:3, luck:2, stone:25, skill:'venom_dart' } },
      { t: '挑走两卷不挑灵根的【无属性通用法术】玉简，先求护道立足。', eff: { wit:3, skill:'silk_palm' } },
      { t: '买下那卷记载纯阳气血运转的古体修残篇，肉身强横方能保命。', eff: { speed:2, body:3, skill:'wind_rod' } }
    ]
  }
];
