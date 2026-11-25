window.GAME_DATA = window.GAME_DATA || {};

window.GAME_DATA.TIMELINE = [
  { month: 4, loc: 'sect', title: '第1年·夏：青云剑宗外门试剑开启' },
  { month: 10, loc: 'market', title: '第1年·冬：鬼市岁末鉴宝大拍' },
  { month: 16, loc: 'forest', title: '第2年·夏：万妖古林秘境潮汐' },
  { month: 24, loc: 'sect', title: '第2年·冬：东洲宗门大比（筑基长线）' },
  { month: 36, loc: 'cliff', title: '第3年·冬：思过崖三年之约' },
  { month: 48, loc: 'forest', title: '第4年·冬：幽冥魔潮入侵（金丹长线）' },
  { month: 66, loc: 'altar', title: '第6年·夏：九霄太古秘境开启（元婴长线）' }
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
      { id: 'sect_grand_tourney', label: '东洲宗门大比' },
      { id: 'sect_library', label: '藏经阁习招' },
      { id: 'sect_alchemy', label: '丹房炼丹' }
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
      { id: 'forest_tame', label: '驯化收养灵兽' },
      { id: 'forest_ruin', label: '探索古修洞府' },
      { id: 'forest_demon_tide', label: '幽冥魔潮入侵' }
    ]
  },
  {
    id: 'cave', name: '云隐仙府', icon: 'home', x: 36, y: 26,
    sceneBg: 'bamboo',
    desc: '翠竹云海间的私人灵脉石窟，可布阵闭关、封存跨世遗产与从容兵解转生。',
    npcs: [],
    hotspots: [
      { id: 'cave_manage', label: '进入仙府 · 聚灵/藏宝/轮回台' }
    ]
  },
  {
    id: 'altar', name: '九霄渡劫台', icon: 'bolt', x: 54, y: 18,
    sceneBg: 'world_map',
    desc: '接引九霄神雷的古石高台，大境界破境必经之地。',
    npcs: [],
    hotspots: [
      { id: 'altar_break', label: '引雷破境渡劫' },
      { id: 'altar_ancient_realm', label: '九霄太古秘境' },
      { id: 'altar_ascend', label: '问道圆满 · 结局结算' }
    ]
  }
];

window.GAME_DATA.QUIZ = [
  {
    q: '初入青云界，你在破庙醒来，怀中揣着一枚裂开微光的古玉戒指。你首先会如何处置？',
    opts: [
      { t: '以一缕微弱神识探入古戒，看看其中是否藏有上古修士传承。', eff: { wit:2, sense:3, talent:'宿慧通明' } },
      { t: '先用布帛包好贴身藏起，财不露白，先摸清修仙界规矩再说。', eff: { body:2, speed:2, talent:'深藏不露' } },
      { t: '去散修坊市旁敲侧击打听行情，攒下第一笔灵石资粮。', eff: { luck:3, stone:35, talent:'福缘深厚' } }
    ]
  },
  {
    q: '青云宗测灵大殿上，手按测灵晶柱之时，晶柱内灵光剧烈摇曳。你心念微沉，体内灵气呈现出何种气象？',
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