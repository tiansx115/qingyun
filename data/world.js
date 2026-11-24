window.GAME_DATA = window.GAME_DATA || {};

window.GAME_DATA.TIMELINE = [
  { month: 4, loc: 'sect', title: '第1年·夏：青云剑宗外门试剑开启' },
  { month: 10, loc: 'market', title: '第1年·冬：鬼市岁末鉴宝大拍' },
  { month: 16, loc: 'forest', title: '第2年·夏：万妖古林秘境潮汐' },
  { month: 36, loc: 'cliff', title: '第3年·冬：思过崖三年之约' }
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
  ui3a_ico_save: 'assets/ui3a/ico_save.png'
};

// 离线古风 BGM 槽位映射：后续放入 assets/audio/*.mp3 即可自动淡入淡出播放，缺文件时静默降级
window.GAME_DATA.AUDIO_MAP = {
  world_map: 'assets/audio/bgm_world.mp3',
  sect:      'assets/audio/bgm_sect.mp3',
  inn:       'assets/audio/bgm_inn.mp3',
  market:    'assets/audio/bgm_market.mp3',
  forest:    'assets/audio/bgm_forest.mp3',
  bamboo:    'assets/audio/bgm_bamboo.mp3',
  combat:    'assets/audio/bgm_combat.mp3'
};

window.GAME_DATA.LOCATIONS = [
  {
    id: 'sect', name: '青云剑宗', icon: 'sword', x: 25, y: 36,
    sceneBg: 'sect_plaza',
    desc: '云海之上的千年剑宗，演武广场与藏经阁巍然矗立。',
    npcs: [
      { id: 'sister', name: '林清霜', title: '青云大师姐', char: 'sister', left: '66%' }
    ],
    hotspots: [
      { id: 'sect_trial', label: '外门试剑 / 宗门事务' },
      { id: 'sect_library', label: '藏经阁研读' },
      { id: 'sect_alchemy', label: '丹房炼丹' },
      { id: 'sect_forge', label: '祭炼本命法宝' }
    ]
  },
  {
    id: 'cliff', name: '后山思过崖', icon: 'scroll', x: 16, y: 68,
    sceneBg: 'world_map',
    desc: '云雾缭绕的悬崖石坪，常有江湖恩怨在此了断。',
    npcs: [
      { id: 'elder', name: '玄虚子', title: '古玉残魂', char: 'elder', left: '68%' }
    ],
    hotspots: [
      { id: 'cliff_event', label: '查探崖坪石桌' }
    ]
  },
  {
    id: 'inn', name: '天机阁茶肆', icon: 'ally', x: 48, y: 56,
    sceneBg: 'inn',
    desc: '灯火温暖的两层古木茶楼，四方修士在此交换情报。',
    npcs: [
      { id: 'innkeeper', name: '天机掌柜', title: '江湖百晓生', char: 'elder', left: '64%' }
    ],
    hotspots: [
      { id: 'inn_tea', label: '品茶歇息 (10灵石回满)' },
      { id: 'inn_rumor', label: '打听东洲传闻' }
    ]
  },
  {
    id: 'market', name: '鬼市黑坊', icon: 'stone', x: 70, y: 68,
    sceneBg: 'market',
    desc: '幽暗石窟中的地下黑市，真假珍宝与古修遗物混杂其间。',
    npcs: [
      { id: 'merchant', name: '黑坊掌柜', title: '鬼市行商', char: 'elder', left: '67%' }
    ],
    hotspots: [
      { id: 'market_shop', label: '丹药奇物摊' },
      { id: 'market_equip', label: '鬼市装备坊' },
      { id: 'market_auction', label: '鬼市拍卖会' },
      { id: 'market_faction', label: '万宝楼 · 鉴宝大拍' },
      { id: 'nether_path', label: '暗巷幽影' },
      { id: 'market_trade', label: '鉴宝议价赚灵石' }
    ]
  },
  {
    id: 'forest', name: '万妖古林', icon: 'map', x: 82, y: 34,
    sceneBg: 'forest',
    desc: '古松参天、灵雾翻涌的险地，深处隐现古修洞府石门。',
    npcs: [
      { id: 'wolf', name: '赤瞳妖狼', title: '护洞妖兽', char: 'wolf_boss', left: '66%' }
    ],
    hotspots: [
      { id: 'forest_stall', label: '谷口设摊售药' },
      { id: 'forest_ruin', label: '探索古修洞府' }
    ]
  },
  {
    id: 'altar', name: '九霄渡劫台', icon: 'bolt', x: 52, y: 20,
    sceneBg: 'world_map',
    desc: '接引九霄神雷的古石高台，大境界破境必经之地。',
    npcs: [],
    hotspots: [
      { id: 'altar_break', label: '引雷破境渡劫' },
      { id: 'altar_ascend', label: '问道圆满 · 结局结算' }
    ]
  }
];

window.GAME_DATA.QUIZ = [
  {
    q: '初入青云界，你在破庙醒来，怀中揣着一枚裂开微光的古玉戒指。你首先会如何处置？',
    opts: [
      { t: '以一缕微弱灵识探入戒指，看看其中是否藏有前人传承。', eff: { wit:2, talk:2, talent:'残魂相伴' } },
      { t: '先用布帛包好贴身藏起，财不露白，先摸清周围环境再说。', eff: { body:2, mind:2, talent:'深藏不露' } },
      { t: '拿到村口杂货铺估个价，看看能换多少盘缠与干粮。', eff: { luck:2, stone:30, talent:'市井精明' } }
    ]
  },
  {
    q: '青云宗测灵大殿上，测灵玉柱久久未亮，台下已有几名世家弟子窃窃私语。你神色如常，心里盘算的是：',
    opts: [
      { t: '“莫欺少年穷，今日之辱，他日必以手中之剑讨回。”', eff: { mind:3, body:1, root:'隐性变异灵根' } },
      { t: '“资质平庸未必是坏事，至少不会惹来魔修与天骄的惦记。”', eff: { luck:3, wit:1, root:'五行均衡灵根' } },
      { t: '“测灵柱或许灵气不足？不如试试把浑身灵力集中到一指点上去。”', eff: { wit:3, talk:2, root:'驳杂灵根' } }
    ]
  },
  {
    q: '坊市旧书摊上摆着一本残破的《青莲剑典》，摊主开口要价五十灵石，你细看之下发现纸页墨迹尚新：',
    opts: [
      { t: '不动声色指出纸墨破绽，反手十灵石买下摊角那块真·古铜残片。', eff: { talk:3, luck:2, stone:20 } },
      { t: '懒得拆穿，但记下摊主的话术，日后自己摆摊倒货时兴许用得上。', eff: { talk:4, wit:1 } },
      { t: '虽知书是假的，却从那几笔歪斜剑图里看出了几分卸力法门。', eff: { body:2, mind:2, skill:'mind_strike' } }
    ]
  }
];