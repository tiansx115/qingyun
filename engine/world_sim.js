// v8.1 《沧溟界》全随机众生演化沙盒引擎：
// 1. 日(行路偶遇) · 候/5日(错峰分桶AI决策/破境/夺宝/随机秘境) · 季/90日(九大势力战争潮汐) 三级分频时间轮（算染分离，10年闭关<25ms零卡顿）
// 2. 少数经典宿命人物锚点 + 每局完全随机生成的天下修士池（随机姓名/道号/势力/性格/灵根/大道/随身背包，老辈陨落后自动诞生新一代随机天骄！）
// 3. 同场景实时偶遇在场修士（神识探查储物袋 / 论道交好 / 求购随身宝物 / 切磋印证 / 杀人夺宝结下血仇！）
// 4. 全随机限时天降秘境与悬赏奇遇（逾期会被其他赶到的随机修士抢先搬空！）

window.WORLD_SIM = (function () {
  const REALM_SPEED_LI = [25, 36, 52, 140, 560, 2400, 11000, 45000, 120000];
  const CN_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

  const NINE_POWERS = [
    { id: 'juntian', archetype: 'sword',   fixed: false, zone: '东洲/中洲', monopoly: '跨洲古传送阵与正统道统', desc: '执掌跨洲古传送阵（声望≥40享半价），表面标榜秩序，暗中凭传送阵税敛财。' },
    { id: 'daqian',  archetype: 'dynasty', fixed: false, zone: '中洲皇都',  monopoly: '十亿凡俗龙气与世家血脉', desc: '仙朝龙气与千年世家门阀；结下世家恩义后，下世转生高概率投胎为世家嫡子！' },
    { id: 'danding', archetype: 'alchemy', fixed: false, zone: '南洲秘谷',  monopoly: '延寿圣丹、返春丹与古宝重铸', desc: '超然中立的药王与天工圣地，全界老祖皆有求于它，谁动它便遭天下共诛。' },
    { id: 'hehuan',  archetype: 'hehuan',  fixed: false, zone: '东洲/中洲', monopoly: '阴阳双修秘法与高层情丝情报网', desc: '风流情丝大宗！明面遭名门口诛笔伐，暗地里无数老祖与世家公子重金求缘联姻。' },
    { id: 'wanbao',  archetype: 'trade',   fixed: true,  fixedName: '四海万宝商盟', zone: '四海商港', monopoly: '跨洋灵舟造船术与年度鉴宝大拍', desc: '黑白通吃的超级商业巨鳄，连魔脉与海族皆与之交易。' },
    { id: 'zhurong', archetype: 'body',    fixed: false, zone: '南赤瘴洲',  monopoly: '地肺真火淬体与奇虫巫蛊', desc: '不看灵根高低、唯敬强者的南荒古脉，废灵根逆袭圣地。' },
    { id: 'lindong', archetype: 'frost',   fixed: false, zone: '北俱寒洲',  monopoly: '永冻极道剑意与北渊妖魔猎场', desc: '民风彪悍的极北武疯子剑修，常年与北渊异族及魔脉血战。' },
    { id: 'jiuyou',  archetype: 'nether',  fixed: false, zone: '暗坊/北渊', monopoly: '燃寿速成秘法与地下悬赏暗市', desc: '崇尚弱肉强食的激进修仙流派，讲求等价交换，庇护无根狠人。' },
    { id: 'longting',archetype: 'ocean',   fixed: true,  fixedName: '沧溟海族龙庭', zone: '七成深海', monopoly: '72% 深海仙矿与归墟海眼', desc: '海洋原住民霸权，滥捕海兽必引兽潮封海，交好可得【通海龙珠】自由潜渊。' },
    { id: 'penglai', archetype: 'ancient', fixed: true,  fixedName: '瀛洲太古遗族', zone: '黑水洋彼岸', monopoly: '先天道果母树与太初雷池', desc: '孤悬十万里绝灵黑水洋外的太古遗民，不涉四洲争端，唯敬满道强者。' }
  ];

  // 宗门命名定律词库（绝不乱拼，按流派特征严格组合！）
  const SECT_NAME_LAWS = {
    sword:   { pre: ['太白', '青冥', '天枢', '玄霄', '凌云', '紫阳', '苍梧', '玉虚'], suf: ['剑宗', '道门', '剑阁', '玄宗', '圣宗'] },
    dynasty: { pre: ['大乾', '大虞', '大胤', '大昭', '大景', '大周'], suf: ['崔氏世家', '卢氏世家', '姬氏世家', '萧氏世家', '谢氏世家'] },
    alchemy: { pre: ['丹鼎', '药王', '神农', '百草', '灵炉', '玄火'], suf: ['神谷', '丹宗', '药阁', '圣山'] },
    hehuan:  { pre: ['云梦', '霓裳', '红尘', '醉月', '青鸾', '瑶池'], suf: ['合欢宗', '情丝宫', '妙音坊', '胭脂阁'] },
    body:    { pre: ['祝融', '九黎', '赤焰', '蛮神', '撼岳', '镇荒'], suf: ['古巫殿', '炼体宗', '战神宫', '蛊王窟'] },
    frost:   { pre: ['凛冬', '玄冰', '北冥', '寒霜', '太阴', '飞雪'], suf: ['剑冢', '寒宫', '冰渊阁', '雪原宗'] },
    nether:  { pre: ['九幽', '血煞', '冥渊', '天魔', '黄泉', '森罗'], suf: ['魔宫', '圣教', '鬼宗', '冥殿'] }
  };

  const POLICIES = [
    { id: 'expand', name: '强硬扩土', desc: '四处争夺灵矿地盘，对外强硬易起战火' },
    { id: 'trade',  name: '务实通商', desc: '广结商缘、以利为先，缓和各方矛盾' },
    { id: 'turtle', name: '韬光养晦', desc: '闭山苦修、不惹是非，暗中积蓄底蕴' },
    { id: 'charm',  name: '纵情合纵', desc: '借联姻与密使拉拢强援、挑拨强敌' },
    { id: 'purge',  name: '铁血肃清', desc: '整顿内部、严打异己，对宿敌绝不姑息' }
  ];

  const TIANJIAO_ARCHETYPES = [
    { tag: '退婚逆袭·燃火少年', dao: 'spell', pers: 'zealot',   desc: '曾遭世家退婚羞辱，身怀古戒残火隐忍崛起' },
    { tag: '苟道老六·稳健长生', dao: 'array', pers: 'cautious', desc: '从不露锋芒，储物袋塞满保命丹与阵盘，十成把握才出手' },
    { tag: '天生剑骨·孤绝剑子', dao: 'sword', pers: 'upright',  desc: '视权势如浮云，唯求极道一剑，最喜四海寻强敌论剑' },
    { tag: '合欢圣女·红尘情丝', dao: 'soul',  pers: 'greedy',   desc: '游走各大仙朝世家与宗门之间，手握密闻与双修机缘', forceFac: 'hehuan' },
    { tag: '世家嫡子·气运皇胄', dao: 'sword', pers: 'ruthless', desc: '出身仙朝顶级门阀，资源丰厚、自带护道重宝', forceFac: 'daqian' },
    { tag: '寒门狠人·独行夺宝', dao: 'body',  pers: 'ruthless', desc: '无门无派全凭厮杀搏命，以狠辣老辣闻名五洲' },
    { tag: '丹道妖孽·少年药王', dao: 'pact',  pers: 'upright',  desc: '一眼辨识灵药年份，各大老祖争相重金拉拢', forceFac: 'danding' }
  ];

  const WORLD_TIDES = [
    { id: 'surge',  name: '灵潮勃发', expMul: 1.20, priceMul: 0.95, desc: '归墟海眼喷吐太古灵机，全界修炼效率 +20%，限时秘境频现！' },
    { id: 'normal', name: '寻常年景', expMul: 1.00, priceMul: 1.00, desc: '五洲七海灵脉平和，各方势力暗流涌动。' },
    { id: 'winter', name: '末法寒冬', expMul: 0.85, priceMul: 1.25, desc: '灵气暂时枯竭（修炼 -15%），各派因争抢灵矿频发摩擦，丹药涨价。' },
    { id: 'demon',  name: '归墟魔潮', expMul: 1.05, priceMul: 1.15, desc: '海眼与北渊煞气倒灌，妖魔狂暴但战利丰厚，各方发布高额悬赏！' }
  ];

  // 随机姓名、道号、性格与随机秘境词库
  const SURNAMES = ['苏', '叶', '顾', '裴', '崔', '卢', '姬', '萧', '宁', '楚', '洛', '沈', '温', '燕', '钟离', '司空', '澹台', '拓跋', '独孤', '公孙', '闻人', '慕容', '敖', '赤'];
  const GIVEN_A = ['玄', '清', '云', '寒', '星', '长', '无', '千', '苍', '惊', '忘', '知', '见', '明', '孤', '若', '流', '断', '焚', '归'];
  const GIVEN_B = ['尘', '歌', '霜', '舟', '渊', '河', '涯', '鸿', '月', '风', '雪', '鹤', '松', '竹', '澜', '冥', '霄', '离', '微', '寂'];
  const PERSONALITIES = [
    { id: 'upright',  name: '清正君子', tradeMul: 1.05, aggro: 0.05, desc: '重诺轻利，嫉恶如仇' },
    { id: 'greedy',   name: '唯利是图', tradeMul: 1.45, aggro: 0.15, desc: '认钱不认人，奇货可居' },
    { id: 'cautious', name: '苟道稳健', tradeMul: 1.20, aggro: 0.02, desc: '深居简出，见势不妙立遁' },
    { id: 'zealot',   name: '悟道狂痴', tradeMul: 1.15, aggro: 0.10, desc: '嗜武成痴，喜与同辈论道切磋' },
    { id: 'ruthless', name: '狠辣枭雄', tradeMul: 1.60, aggro: 0.35, desc: '杀人夺宝，睚眦必报' }
  ];
  const DAO_KEYS = ['sword', 'spell', 'body', 'array', 'soul', 'pact'];
  const LOOT_POOL_LOW = ['heal_pill', 'qi_pill', 'condense_pill', 'beast_fruit', 'zhuyan_pill', 'eq_qingyun_sword', 'eq_cloud_robe', 'eq_iron_wrist', 'tr_poison_needle', 'tr_spirit_banner'];
  const LOOT_POOL_HIGH = ['marrow_pill', 'lightning_plate', 'zhuyan_pill', 'bingji_pill', 'manual_zhuyan_art', 'eq_frost_blade', 'eq_iron_staff', 'eq_xuan_armor', 'eq_qiankun_ring', 'tr_flying_sword', 'tr_soul_bell', 'longevity_peach', 'dao_tea'];

  const RIFT_PREFIX = ['太古青莲', '紫霄雷陨', '玄冥沉船', '赤帝遗蜕', '九曲星河', '无垢丹圣', '太初剑墟', '万古鲲鹏'];
  const RIFT_SUFFIX = ['浮空秘岛', '地脉裂谷', '海底仙坟', '古修士洞天', '幻境残阵'];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  function buildDynamicWorldPowers() {
    return NINE_POWERS.map(p => {
      let name = p.fixedName || p.id;
      if (!p.fixed) {
        const law = SECT_NAME_LAWS[p.archetype];
        if (p.archetype === 'dynasty') {
          name = `${pick(law.pre)}仙朝·${pick(law.suf)}`;
        } else if (law) {
          const pre = pick(law.pre);
          const goodSuf = law.suf.filter(s => ![...pre].some(ch => s.includes(ch)));
          name = pre + pick(goodSuf.length ? goodSuf : law.suf);
        }
      }
      const pol = pick(POLICIES);
      return {
        id: p.id,
        archetype: p.archetype,
        fixed: !!p.fixed,
        name,
        zone: p.zone,
        monopoly: p.monopoly,
        desc: p.desc,
        policyId: pol.id,
        policyName: pol.name,
        leaderNpcId: null,
        leaderName: '待选新主',
        genCount: 1
      };
    });
  }

  function buildMinorOrgs() {
    const pre = ['青竹', '听雨', '血衣', '黑水', '百花', '碎星', '飞鹰', '长乐', '千机', '孤舟'];
    const suf = [
      { t: '散修互助会', role: '底层散修抱团求生' },
      { t: '情报暗楼',   role: '兜售各派掌门秘闻与黑料' },
      { t: '黑水走私帮', role: '绕过商盟封海偷渡海域' },
      { t: '采药互助盟', role: '深入绝地采摘百年灵草' },
      { t: '赏金暗坊',   role: '承接私下仇杀与截镖悬赏' },
      { t: '百花茶社',   role: '牵线搭桥与风流雅聚' }
    ];
    const zones = ['东栖霞洲', '南赤瘴洲', '北俱寒洲', '中钧天洲', '近海群岛'];
    const used = new Set();
    const out = [];
    for (let i = 0; i < 6; i++) {
      let pn = pick(pre);
      while (used.has(pn)) pn = pick(pre);
      used.add(pn);
      const sf = suf[i % suf.length];
      out.push({
        id: 'minor_' + (i + 1),
        name: pn + sf.t,
        role: sf.role,
        zone: pick(zones),
        leaderName: pick(SURNAMES) + pick(GIVEN_A) + pick(GIVEN_B),
        power: randInt(15, 45),
        alive: true,
        allyPlayer: false
      });
    }
    return out;
  }

  function getDipKey(a, b) { return a < b ? `${a}|${b}` : `${b}|${a}`; }

  function initDiplomacy(factions) {
    const dip = {};
    for (let i = 0; i < factions.length; i++) {
      for (let j = i + 1; j < factions.length; j++) {
        const a = factions[i], b = factions[j];
        let val = randInt(-35, 35);
        if (a.archetype === 'alchemy' || b.archetype === 'alchemy' || a.archetype === 'trade' || b.archetype === 'trade') {
          val = randInt(5, 45); // 丹谷与商盟靠命脉天然吃香
        }
        if (a.archetype === 'hehuan' || b.archetype === 'hehuan') {
          val = randInt(-25, 40); // 合欢宗爱恨交织、暗通款曲
        }
        dip[getDipKey(a.id, b.id)] = val;
      }
    }
    return dip;
  }

  function getDiplomacy(G, aId, bId) {
    if (!G || !G.diplomacy || aId === bId) return 0;
    return G.diplomacy[getDipKey(aId, bId)] || 0;
  }

  function shiftDiplomacy(G, aId, bId, delta) {
    if (!G || !aId || !bId || aId === bId) return 0;
    G.diplomacy = G.diplomacy || {};
    const k = getDipKey(aId, bId);
    G.diplomacy[k] = Math.max(-100, Math.min(100, (G.diplomacy[k] || 0) + delta));
    return G.diplomacy[k];
  }

  function genProceduralNpc(seq, realmTierHint, D, factionsDyn, opts = {}) {
    const facs = (factionsDyn && factionsDyn.length) ? factionsDyn : NINE_POWERS;
    const usedR = realmTierHint != null ? realmTierHint : (Math.random() < 0.42 ? randInt(0, 2) : (Math.random() < 0.72 ? randInt(3, 4) : randInt(4, 6)));
    const pwr = opts.forceFacId ? (facs.find(f => f.id === opts.forceFacId) || pick(facs)) : pick(facs);
    const pers = opts.forcePers ? (PERSONALITIES.find(p => p.id === opts.forcePers) || pick(PERSONALITIES)) : pick(PERSONALITIES);
    const dao = opts.forceDao || pick(DAO_KEYS);
    const sname = pick(SURNAMES);
    const gname = pick(GIVEN_A) + (Math.random() < 0.72 ? pick(GIVEN_B) : '');
    const name = sname + gname;

    const realmAges = [18, 24, 34, 58, 110, 220, 420];
    const realmMaxAges = [100, 112, 137, 227, 447, 867, 1567];
    const baseAge = (realmAges[usedR] || 20) + randInt(-4, 35);
    const maxAge = (realmMaxAges[usedR] || 100) + randInt(-5, 30);

    const locs = (D && D.LOCATIONS) || [{ id: 'sect', seaZone: 0 }];
    const validLocs = locs.filter(l => (l.seaZone || 0) <= Math.max(0, usedR - 2));
    const startLoc = (pick(validLocs.length ? validLocs : locs) || locs[0]).id;

    const bag = {};
    const itemPool = usedR >= 4 ? LOOT_POOL_HIGH : LOOT_POOL_LOW;
    const itemCnt = randInt(1, 3);
    for (let i = 0; i < itemCnt; i++) {
      const iid = pick(itemPool);
      bag[iid] = (bag[iid] || 0) + 1;
    }

    const factionTitles = {
      juntian: ['真传剑修', '巡山执事', '传法长老'],
      daqian:  ['世家贵胄', '仙朝供奉', '皇城靖夜司'],
      danding: ['游方丹师', '寻药客', '天工铸师'],
      hehuan:  ['霓裳真传', '情丝使者', '红尘客卿'],
      wanbao:  ['四海行商', '鉴宝师', '护船客卿'],
      zhurong: ['南荒巫祝', '百战体修', '控火祭司'],
      lindong: ['苦寒剑客', '守冢人', '冰原阵师'],
      jiuyou:  ['幽冥暗使', '炼魂客', '地下悬赏客'],
      longting:['化形海修', '沧溟巡使', '深海龙裔'],
      penglai: ['瀛洲遗民', '古岛行者', '太古守道人']
    };
    const roleTitle = opts.isLeader ? '现任掌门' : pick(factionTitles[pwr.id] || ['四海散修']);
    const facShort = (pwr.name || '散修').slice(0, 4);

    const realAge = Math.max(16, Math.min(maxAge - 8, baseAge));
    let youthLock = null;
    if ((realAge >= 90 || usedR >= 3 || pwr.id === 'hehuan') && Math.random() < (pwr.id === 'hehuan' ? 0.65 : 0.32)) {
      const useArt = Math.random() < 0.55;
      youthLock = {
        type: useArt ? 'art' : 'pill',
        name: useArt ? '太素驻颜术' : '驻颜定容丹',
        lockedVisualAge: randInt(20, 26),
        expireDay: randInt(12, 55) * 360,
        mpSealPct: useArt ? 0.05 : 0
      };
    }

    return {
      id: 'pnpc_' + seq + '_' + randInt(100, 999),
      name,
      title: `${facShort}·${roleTitle}`,
      faction: pwr.id,
      isLeader: !!opts.isLeader,
      isTianjiao: !!opts.isTianjiao,
      tianjiaoTag: opts.tianjiaoTag || null,
      tianjiaoDesc: opts.tianjiaoDesc || null,
      persId: pers.id,
      persName: pers.name,
      dao,
      realmIdx: usedR,
      exp: randInt(10, 120),
      age: realAge,
      maxAge,
      youthLock,
      loc: startLoc,
      destLoc: null,
      travelDaysLeft: 0,
      stayDaysLeft: randInt(4, 14),
      alive: true,
      luck: opts.isTianjiao ? randInt(78, 99) : randInt(25, 95),
      sense: 12 + usedR * 9 + randInt(0, 8),
      favor: 0,
      stones: 25 + usedR * usedR * 35 + randInt(0, 60),
      bag
    };
  }

  function buildProceduralWorldRoster(D, factionsDyn) {
    const list = [];
    let seq = 1;
    // 1. 为每个大势力生成 1 名真实存活的「现任掌门」（有寿元会老死/渡劫失败/被杀，死后新天骄继位变政！）
    (factionsDyn || []).forEach(fac => {
      const leader = genProceduralNpc(seq++, randInt(4, 6), D, factionsDyn, { forceFacId: fac.id, isLeader: true });
      fac.leaderNpcId = leader.id;
      fac.leaderName = leader.name;
      list.push(leader);
    });
    // 2. 生成 7 名各具修仙小说经典命格的「天骄」
    TIANJIAO_ARCHETYPES.forEach(tj => {
      const n = genProceduralNpc(seq++, randInt(1, 4), D, factionsDyn, {
        forceFacId: tj.forceFac || null,
        forceDao: tj.dao,
        forcePers: tj.pers,
        isTianjiao: true,
        tianjiaoTag: tj.tag,
        tianjiaoDesc: tj.desc
      });
      list.push(n);
    });
    // 3. 再生成 20 名五洲四海随机游历修士
    for (let i = 0; i < 20; i++) {
      const tier = i < 9 ? randInt(0, 2) : (i < 16 ? randInt(3, 4) : randInt(4, 5));
      list.push(genProceduralNpc(seq++, tier, D, factionsDyn));
    }
    return list;
  }

  // 掌门陨落 → 该宗修为最高的新天骄/长老继位，并根据新掌门性格彻底转向对外政策与外交关系！
  function handleLeaderSuccession(G, deadLeader, D) {
    if (!deadLeader || !deadLeader.isLeader) return;
    const fac = (G.factionsDyn || []).find(f => f.id === deadLeader.faction);
    if (!fac) return;
    let candidates = (G.simNpcs || []).filter(n => n.alive && n.faction === fac.id && n.id !== deadLeader.id);
    candidates.sort((a, b) => (b.realmIdx - a.realmIdx) || ((b.isTianjiao ? 1 : 0) - (a.isTianjiao ? 1 : 0)) || (b.luck - a.luck));
    let nextLeader = candidates[0];
    if (!nextLeader) {
      G._npcSeq = (G._npcSeq || 60) + 1;
      nextLeader = genProceduralNpc(G._npcSeq, Math.max(3, deadLeader.realmIdx - 1), D, G.factionsDyn, { forceFacId: fac.id, isLeader: true });
      G.simNpcs.push(nextLeader);
    }
    nextLeader.isLeader = true;
    nextLeader.title = `${fac.name.slice(0, 4)}·新任掌门`;
    fac.leaderNpcId = nextLeader.id;
    fac.leaderName = nextLeader.name;
    fac.genCount = (fac.genCount || 1) + 1;

    // 根据新掌门性格转向宗门大政！
    const polMap = { ruthless: 'expand', greedy: 'trade', cautious: 'turtle', zealot: 'purge', upright: 'charm' };
    const newPol = POLICIES.find(p => p.id === polMap[nextLeader.persId]) || pick(POLICIES);
    fac.policyId = newPol.id;
    fac.policyName = newPol.name;

    // 随机牵动 2 个其他大势力的外交风云！
    const others = (G.factionsDyn || []).filter(f => f.id !== fac.id);
    const f1 = pick(others);
    const f2 = pick(others.filter(f => f.id !== f1?.id));
    let dipNote = '';
    if (f1) {
      const d1 = newPol.id === 'expand' || newPol.id === 'purge' ? -randInt(25, 45) : randInt(20, 40);
      shiftDiplomacy(G, fac.id, f1.id, d1);
      dipNote = d1 < 0 ? `并立刻对【${f1.name}】采取强硬封锁` : `随即向【${f1.name}】抛出橄榄枝示好`;
    }
    if (f2) {
      shiftDiplomacy(G, fac.id, f2.id, randInt(-25, 25));
    }
    pushNews(G, '易主', `【掌门更替】${fac.name}原主【${deadLeader.name}】陨落，${nextLeader.isTianjiao ? `天骄【${nextLeader.name}】(${nextLeader.tianjiaoTag})` : `强修【${nextLeader.name}】`}登位第 ${fac.genCount} 代掌门，改行「${newPol.name}」国策，${dipNote}！`);
  }

  // 五洲地脉与天地灵潮修炼加成
  function getRegionBonus(G, D) {
    initWorldState(G);
    const tide = WORLD_TIDES.find(t => t.id === (G.worldTide?.id || 'normal')) || WORLD_TIDES[1];
    const locObj = (D && D.LOCATIONS || []).find(l => l.id === G.loc) || { region: 'east' };
    const reg = locObj.region || 'east';
    const ha = (D && D.HEART_ARTS && D.HEART_ARTS[G.heartArt]) || { elem: 'none' };
    let regMul = 1.0;
    let regNote = '东栖霞洲(平和)';
    if (reg === 'south') {
      regMul = (ha.elem === 'fire' || ha.elem === 'earth') ? 1.25 : 1.05;
      regNote = ha.elem === 'fire' || ha.elem === 'earth' ? '南赤瘴洲(火土+25%)' : '南赤瘴洲(+5%)';
    } else if (reg === 'north') {
      regMul = (ha.elem === 'gold' || ha.elem === 'water') ? 1.25 : 1.05;
      regNote = ha.elem === 'gold' || ha.elem === 'water' ? '北俱寒洲(金水+25%)' : '北俱寒洲(+5%)';
    } else if (reg === 'central') {
      regMul = 1.20; regNote = '中钧天洲(祖脉+20%)';
    } else if (reg === 'ocean') {
      regMul = ha.elem === 'water' ? 1.20 : 1.05; regNote = '沧溟大洋';
    } else if (reg === 'yingzhou') {
      regMul = 1.35; regNote = '东极瀛洲(太古+35%)';
    }
    return {
      mul: +(tide.expMul * regMul).toFixed(2),
      tide,
      regNote
    };
  }

  function initWorldState(G) {
    const D = window.GAME_DATA;
    if (typeof G.totalDays !== 'number' || isNaN(G.totalDays)) {
      G.totalDays = Math.max(1, ((G.month || 1) - 1) * 30 + 1);
    }
    if (typeof G.birthDay !== 'number' || isNaN(G.birthDay)) {
      G.birthDay = G.totalDays - Math.max(0, ((G.age || 16) - 16) * 360);
    }
    G.month = Math.floor((G.totalDays - 1) / 30) + 1;
    G.age = 16 + Math.max(0, Math.floor((G.totalDays - G.birthDay) / 360));
    G.travelRemDays = G.travelRemDays || 0;
    G.karma = G.karma || 0;
    G.seaHostility = G.seaHostility || 0;
    G.nobleClanBond = G.nobleClanBond || 0;
    G._npcSeq = G._npcSeq || 45;
    if (!Array.isArray(G.factionsDyn) || !G.factionsDyn.length) {
      G.factionsDyn = buildDynamicWorldPowers();
    }
    if (!Array.isArray(G.minorOrgs) || !G.minorOrgs.length) {
      G.minorOrgs = buildMinorOrgs();
    }
    if (!G.diplomacy || !Object.keys(G.diplomacy).length) {
      G.diplomacy = initDiplomacy(G.factionsDyn);
    }
    if (!G.worldTide) {
      G.worldTide = { id: 'normal', name: '寻常年景', nextChangeDay: G.totalDays + randInt(900, 1500) };
    }
    G.factionRep = Object.assign({
      juntian: 0, daqian: 0, danding: 0, hehuan: 0, wanbao: 0, zhurong: 0, lindong: 0, jiuyou: 0, longting: 0, penglai: 0
    }, G.factionRep || {});
    G.worldState = Object.assign({
      priceMul: 1.0,
      seaBlockadeUntilDay: 0,
      warRegion: null,
      warDesc: '本纪元宗门与江湖小势力皆随机衍化，诸雄竞逐灵脉、无绝对正邪',
      lastHeadline: '沧溟纪元开启，百舸争流各觅长生'
    }, G.worldState || {});
    if (!Array.isArray(G.simNpcs) || !G.simNpcs.length) {
      G.simNpcs = buildProceduralWorldRoster(D, G.factionsDyn);
    }
    // 兼容旧存档 NPC 补充行程字段
    G.simNpcs.forEach(n => {
      if (!n.bag) n.bag = { heal_pill: 1, condense_pill: 1 };
      if (typeof n.stones !== 'number') n.stones = 60 + (n.realmIdx || 1) * 40;
      if (typeof n.favor !== 'number') n.favor = 0;
      if (!n.persName) { n.persId = 'upright'; n.persName = '寻常修士'; }
      if (!n.dao) n.dao = 'sword';
      if (typeof n.stayDaysLeft !== 'number') n.stayDaysLeft = randInt(3, 12);
      if (typeof n.travelDaysLeft !== 'number') n.travelDaysLeft = 0;
    });
    if (!Array.isArray(G.randomRifts)) G.randomRifts = [];
    if (!Array.isArray(G.worldNews)) G.worldNews = [{ day: G.totalDays, dateStr: '纪元初开', tag: '天机', text: '本纪元众生谱已随机衍化生成，唯一【造化轮回盘】隐匿于五洲七海之间。' }];
    if (!Array.isArray(G.letters)) G.letters = [];
  }

  function getCal(totalDays) {
    const td = Math.max(1, Math.floor(totalDays || 1));
    const year = Math.floor((td - 1) / 360) + 1;
    const mIdx = Math.floor(((td - 1) % 360) / 30);
    const day = ((td - 1) % 30) + 1;
    const season = ['春', '春', '春', '夏', '夏', '夏', '秋', '秋', '秋', '冬', '冬', '冬'][mIdx];
    return { year, monthNum: mIdx + 1, monthCn: CN_MONTHS[mIdx], day, season };
  }

  function formatDate(G) {
    initWorldState(G);
    const c = getCal(G.totalDays);
    return `第${c.year}年·${c.monthCn}月·${c.day}日`;
  }

  function pushNews(G, tag, text) {
    G.worldNews = G.worldNews || [];
    G.worldNews.unshift({ day: G.totalDays, dateStr: formatDate(G), tag, text });
    if (G.worldNews.length > 50) G.worldNews.length = 50;
    if (G.worldState) G.worldState.lastHeadline = text;
  }

  function pushLetter(G, title, text, locId, expireDays) {
    G.letters = G.letters || [];
    G.letters.unshift({
      id: 'lt_' + G.totalDays + '_' + randInt(100, 999),
      day: G.totalDays,
      dateStr: formatDate(G),
      title,
      text,
      locId: locId || null,
      expireDay: expireDays ? G.totalDays + expireDays : null,
      read: false
    });
    if (G.letters.length > 20) G.letters.length = 20;
  }

  function getPlayerSpeedLi(G, eqStats) {
    const base = REALM_SPEED_LI[Math.min(REALM_SPEED_LI.length - 1, G.realmIdx || 0)] || 25;
    const spdStat = (G.speed || 10) + ((eqStats && eqStats.speed) || 0);
    const beastMul = G.activeBeast === 'crane' ? 1.35 : 1.0;
    return Math.round(base * (1 + spdStat * 0.025) * beastMul);
  }

  function calcDistanceLi(locA, locB) {
    if (!locA || !locB || locA.id === locB.id) return 0;
    const dx = (locA.gx || 20000) - (locB.gx || 20000);
    const dy = (locA.gy || 30000) - (locB.gy || 30000);
    return Math.max(120, Math.round(Math.sqrt(dx * dx + dy * dy)));
  }

  // ===== 三级分频时间轮（算染分离：纯内存极速推演，零 DOM 操作，10年闭关 < 25ms！）=====
  function advanceDays(ctx, rawDays, opts = {}) {
    const { G, D, showToast } = ctx;
    initWorldState(G);
    let wholeDays = Math.floor(rawDays);
    const frac = rawDays - wholeDays;
    if (frac > 0) {
      G.travelRemDays = (G.travelRemDays || 0) + frac;
      if (G.travelRemDays >= 1) {
        const carry = Math.floor(G.travelRemDays);
        wholeDays += carry;
        G.travelRemDays -= carry;
      }
    }
    if (wholeDays <= 0) return { elapsed: 0, interrupted: false, reason: '' };

    const locs = (D && D.LOCATIONS) || [];
    const locById = {};
    locs.forEach(l => { locById[l.id] = l; });

    let elapsed = 0;
    let interrupted = false;
    let reason = '';

    for (let i = 0; i < wholeDays; i++) {
      const prevYearIdx = Math.floor((G.totalDays - 1) / 360);
      const prevQuarterIdx = Math.floor((G.totalDays - 1) / 90);
      G.totalDays += 1;
      elapsed += 1;
      G.month = Math.floor((G.totalDays - 1) / 30) + 1;
      G.age = 16 + Math.max(0, Math.floor((G.totalDays - G.birthDay) / 360));

      // 主角寿元耗尽判定
      if (G.age >= G.maxAge && window.REINCARNATION) {
        if (window.REINCARNATION.hasRelic(G)) {
          window.REINCARNATION.executeReincarnation(ctx, 'calm', null);
        } else {
          window.REINCARNATION.triggerTrueDeath(ctx, '大限已至，寿元耗尽坐化');
        }
        return { elapsed, interrupted: true, reason: '大限已至' };
      }

      // 主角驻颜丹 / 太素驻颜术到期反噬检查
      if (G.youthLock && window.APPEARANCE) {
        const expRes = window.APPEARANCE.checkExpiration(G, G.totalDays);
        if (expRes) {
          if (ctx.recalcDerivedStats) ctx.recalcDerivedStats(false);
          const msg = expRes.dramatic
            ? `【驻颜散尽·岁月反噬】${expRes.expiredName}药力耗尽，青丝寸寸化雪，容颜瞬间沧桑回 ${expRes.naturalAge} 岁真容（${expRes.stage.name}）！`
            : `【驻颜到期】${expRes.expiredName}效用已尽，容貌归真（约 ${expRes.naturalAge} 岁·${expRes.stage.name}）。`;
          if (showToast) showToast(msg);
          if (opts.seclusion && expRes.dramatic && i < wholeDays - 1) {
            interrupted = true;
            reason = msg;
            break;
          }
        }
      }

      // 【第1级 · 每日微脉冲】NPC 在途天数倒计时、抵达与启程 + 错峰分桶（每天仅算 1/5 NPC 的机缘决策！）
      const bucket = G.totalDays % 5;
      const urgentMsg = runDailyBucketedSim(G, D, locs, locById, bucket, G.totalDays > prevYearIdx * 360 + 360);

      // 每 25 日概率刷出全随机限时秘境/异象奇遇！
      if (G.totalDays % 25 === 0) {
        tickRandomRifts(G, locs);
      }

      // 【第3级 · 季度宏脉冲（每 90 日）】九大势力战争、兽潮封海与物价潮汐
      const newQuarterIdx = Math.floor((G.totalDays - 1) / 90);
      if (newQuarterIdx > prevQuarterIdx) {
        runQuarterlyFactionPulse(ctx);
      }

      // 闭关智能唤醒判定
      if (opts.seclusion && i < wholeDays - 1) {
        if (G.maxAge - G.age <= 2) {
          interrupted = true;
          reason = `寿元仅余 ${G.maxAge - G.age} 载，元神警兆自动破关唤醒！`;
          break;
        }
        if (urgentMsg && opts.wakeOnUrgent !== false) {
          interrupted = true;
          reason = urgentMsg;
          break;
        }
      }
    }

    if (interrupted && reason && showToast) showToast(reason);
    return { elapsed, interrupted, reason };
  }

  // 每日在途移动 + 1/5 错峰分桶决策（每名NPC每5天做一次实质修炼/寻宝/夺秘境/破境决策！）
  function runDailyBucketedSim(G, D, locs, locById, bucket, isNewYearDay) {
    let urgentWake = '';
    const npcs = G.simNpcs || [];
    let aliveCount = 0;

    for (let idx = 0; idx < npcs.length; idx++) {
      const npc = npcs[idx];
      if (!npc.alive) continue;
      aliveCount++;

      if (isNewYearDay) npc.age += 1;

      // A) 每日真实脚程移动（非瞬移！按该NPC自身境界遁速计算在途天数！）
      if (npc.travelDaysLeft > 0) {
        npc.travelDaysLeft -= 1;
        if (npc.travelDaysLeft <= 0 && npc.destLoc) {
          npc.loc = npc.destLoc;
          npc.destLoc = null;
          npc.stayDaysLeft = randInt(5, 16);
          if (G.worldRelic && G.worldRelic.holder === 'npc' && G.worldRelic.npcId === npc.id) {
            G.worldRelic.loc = npc.loc;
          }
        }
        continue; // 赶路途中不闭关
      } else {
        npc.stayDaysLeft = (npc.stayDaysLeft || 5) - 1;
        if (npc.stayDaysLeft <= 0 && locs.length > 1) {
          // 选下一处可达目的地动身！优先奔赴出世的随机秘境！
          const maxSea = Math.max(0, npc.realmIdx - 2);
          const openRift = (G.randomRifts || []).find(rf => (locById[rf.loc]?.seaZone || 0) <= maxSea);
          let nextLocObj = openRift && Math.random() < 0.45 ? locById[openRift.loc] : null;
          if (!nextLocObj) {
            const reach = locs.filter(l => l.id !== npc.loc && (l.seaZone || 0) <= maxSea);
            if (reach.length) nextLocObj = pick(reach);
          }
          if (nextLocObj && nextLocObj.id !== npc.loc) {
            const curLocObj = locById[npc.loc] || locs[0];
            const dist = calcDistanceLi(curLocObj, nextLocObj);
            const spd = REALM_SPEED_LI[Math.min(REALM_SPEED_LI.length - 1, npc.realmIdx)] || 35;
            npc.destLoc = nextLocObj.id;
            npc.travelDaysLeft = Math.max(1, Math.min(45, Math.ceil(dist / spd)));
          } else {
            npc.stayDaysLeft = randInt(6, 15);
          }
        }
      }

      // B) 错峰分桶：仅当 idx % 5 === bucket 时执行五日一度的深度行为推演！
      if (idx % 5 !== bucket) continue;

      // 1. 寿元大限检查
      if (npc.age >= npc.maxAge) {
        if (npc.bag && npc.bag.longevity_peach > 0) {
          npc.bag.longevity_peach--;
          npc.maxAge += 40;
          pushNews(G, '延寿', `${npc.title}【${npc.name}】大限将至之际服下千年延寿蟠桃，逆天续命四十载！`);
        } else if (G.worldRelic && G.worldRelic.holder === 'npc' && G.worldRelic.npcId === npc.id) {
          npc.age = 16; npc.realmIdx = 0; npc.exp = 0;
          const rLoc = pick(locs) || locs[0];
          G.worldRelic = { holder: 'world', loc: rLoc.id, placeName: rLoc.name, rumor: `【${rLoc.name}】上空曾有轮回紫光坠落` };
          pushNews(G, '轮回', `${npc.title}【${npc.name}】寿尽兵解催动【造化轮回盘】转世重修，至宝再次破空飞遁！`);
          urgentWake = `【天机急讯】${npc.name} 已兵解转世，造化轮回盘重归天地无主之态！`;
        } else {
          npc.alive = false;
          pushNews(G, '坐化', `${npc.title}【${npc.name}】寿元耗尽坐化于【${locById[npc.loc]?.name || '荒野'}】（享寿 ${npc.age} 岁）。`);
          if (npc.isLeader) handleLeaderSuccession(G, npc, D);
        }
        continue;
      }

      // 1.5 NPC 驻颜到期反噬
      if (npc.youthLock && window.APPEARANCE) {
        const nExp = window.APPEARANCE.checkExpiration(npc, G.totalDays);
        if (nExp && nExp.dramatic) {
          pushNews(G, '奇闻', `${npc.title}【${npc.name}】体表【${nExp.expiredName}】效用散尽，当众青丝成雪，露出 ${nExp.naturalAge} 岁老怪真容！`);
        }
      }

      // 2. 修为精进与渡劫生死
      npc.exp = (npc.exp || 0) + 4 + Math.floor((npc.luck || 50) * 0.06);
      const curR = D.REALMS && D.REALMS[npc.realmIdx];
      const nextR = D.REALMS && D.REALMS[npc.realmIdx + 1];
      if (curR && nextR && npc.exp >= curR.exp && npc.realmIdx < 6) {
        npc.exp = 0;
        if (Math.random() < Math.min(0.84, 0.46 + (npc.luck || 50) * 0.004)) {
          const prevMax = npc.maxAge;
          npc.realmIdx += 1;
          npc.maxAge += nextR.ageBonus || 90;
          npc.stones += 120;
          const rejuv = window.APPEARANCE && window.APPEARANCE.checkBreakthroughRejuv(npc, prevMax);
          if (npc.realmIdx >= 3) {
            const rejuvStr = rejuv ? `，洗髓返春由 ${rejuv.oldAge} 岁鹤发重化 ${rejuv.newAge} 岁青丝` : '';
            pushNews(G, '破境', `${npc.title}【${npc.name}】于【${locById[npc.loc]?.name || '灵山'}】成功渡劫，晋升【${nextR.name}】${rejuvStr}！`);
          }
        } else if (Math.random() < 0.30) {
          npc.alive = false;
          if (G.worldRelic && G.worldRelic.holder === 'npc' && G.worldRelic.npcId === npc.id) {
            G.worldRelic = { holder: 'world', loc: npc.loc, placeName: locById[npc.loc]?.name || '秘境', rumor: `【${npc.name}】渡劫灰飞烟灭之地似遗落造化轮回盘` };
            urgentWake = `【天机急讯】持有造化轮回盘的 ${npc.name} 渡劫身死，至宝遗落于【${locById[npc.loc]?.name || '原处'}】！`;
          }
          pushNews(G, '劫灭', `${npc.title}【${npc.name}】强冲【${nextR.name}】雷劫失败，不幸身死道消！`);
          if (npc.isLeader) handleLeaderSuccession(G, npc, D);
          continue;
        }
      }

      // 3. NPC 抢先探索搬空随机秘境！
      const riftIdx = (G.randomRifts || []).findIndex(rf => rf.loc === npc.loc);
      if (riftIdx >= 0 && Math.random() < 0.18) {
        const rf = G.randomRifts[riftIdx];
        G.randomRifts.splice(riftIdx, 1);
        npc.bag[rf.rewardItem] = (npc.bag[rf.rewardItem] || 0) + 1;
        pushNews(G, '夺宝', `${npc.title}【${npc.name}】捷足先登闯入【${rf.name}】，夺走了秘宝【${D.ITEMS[rf.rewardItem]?.name || '古宝'}】！`);
      }

      // 4. NPC 偶遇夺取天地唯一【造化轮回盘】！
      if (G.worldRelic && G.worldRelic.holder === 'world' && G.worldRelic.loc === npc.loc && npc.realmIdx >= 3 && Math.random() < 0.015) {
        G.worldRelic = {
          holder: 'npc',
          npcId: npc.id,
          npcName: npc.name,
          loc: npc.loc,
          rumor: `天机感应显示，【造化轮回盘】已被${npc.title}【${npc.name}】收入囊中！`
        };
        pushNews(G, '至宝', `秘境异动！${npc.title}【${npc.name}】在【${locById[npc.loc]?.name || '险地'}】寻获一件太古轮回异宝！`);
        urgentWake = `【天机急讯】天地唯一【造化轮回盘】被 ${npc.name} 抢先夺得！`;
      }

      // 5. 若与主角结下深仇(favor <= -60)，概率派飞剑战书或伏击警告
      if (npc.favor <= -60 && Math.random() < 0.02) {
        pushLetter(G, `【血仇战书】${npc.name}`, `“夺宝结怨之仇不共戴天，他日五洲狭路相逢，必取尔性命！”`, npc.loc, 180);
      }
    }

    // C) 众生新陈代谢：若在世修士少于 32 人，自动从五洲寒门/世家涌现新一代随机少年修士！
    if (bucket === 0 && aliveCount < 32 && D) {
      G._npcSeq = (G._npcSeq || 50) + 1;
      const fresh = genProceduralNpc(G._npcSeq, randInt(0, 2), D, G.factionsDyn);
      G.simNpcs = G.simNpcs.filter(n => n.alive || (G.worldRelic?.npcId === n.id)).slice(-42);
      G.simNpcs.push(fresh);
      if (fresh.luck >= 85) {
        pushNews(G, '新秀', `五洲涌现后起之秀：【${fresh.name}】(${fresh.title})初入仙途便显露惊人天资！`);
      }
    }

    return urgentWake;
  }

  // ===== 全随机限时天降秘境 / 异宝奇遇生成器 =====
  function tickRandomRifts(G, locs) {
    G.randomRifts = (G.randomRifts || []).filter(rf => rf.expireDay > G.totalDays);
    if (G.randomRifts.length < 3 && locs.length && Math.random() < 0.42) {
      const targetLoc = pick(locs);
      const rName = pick(RIFT_PREFIX) + pick(RIFT_SUFFIX);
      const rewardItem = pick(targetLoc.seaZone >= 2 ? LOOT_POOL_HIGH : LOOT_POOL_LOW.concat(['marrow_pill', 'longevity_peach', 'dao_tea']));
      const dur = randInt(75, 180);
      G.randomRifts.push({
        id: 'rift_' + G.totalDays + '_' + randInt(10, 99),
        name: rName,
        loc: targetLoc.id,
        locName: targetLoc.name,
        dangerLv: Math.max(1, (targetLoc.seaZone || 0) + randInt(1, 3)),
        rewardItem,
        expireDay: G.totalDays + dur
      });
      pushNews(G, '秘境', `天地异象！【${targetLoc.name}】附近忽现限时秘境「${rName}」（存世约 ${dur} 日），各方修士正闻风赶往！`);
    }
  }

  // 获取当前驻留在此地（且不在赶路途中）的所有存活修士
  function getLocalNpcs(G, locId) {
    initWorldState(G);
    return (G.simNpcs || []).filter(n => n.alive && n.loc === locId && (n.travelDaysLeft || 0) <= 0);
  }

  // ===== 同场景在场随机修士深度交互弹窗（神识探查背包 / 论道交好 / 交易求购 / 切磋 / 杀人夺宝！）=====
  function openLocalNpcsModal(ctx, locId, specificNpcId) {
    const { G, D, ASSETS, SFX, setDialogue, startBattle, addItem, gainExp, getCatMastery, showToast, saveGame, renderAll } = ctx;
    const locals = getLocalNpcs(G, locId);
    if (!locals.length) {
      showToast('此处眼下暂无其他游历修士驻足。');
      return;
    }

    if (!specificNpcId) {
      const choices = locals.slice(0, 6).map(n => {
        const rName = D.REALMS[n.realmIdx]?.name || '炼气';
        const holdsRelic = G.worldRelic?.holder === 'npc' && G.worldRelic?.npcId === n.id;
        const prof = window.APPEARANCE ? window.APPEARANCE.getProfile(n, G.totalDays) : null;
        const appTag = prof ? ` · 观之约${prof.displayAge}岁(${prof.stage.short})` : '';
        return {
          text: `上前搭话【${n.name}】（${n.title} · ${rName}${appTag}）${holdsRelic ? '【怀揣轮回盘!】' : ''}`,
          hint: `交情 ${n.favor || 0}`,
          action: () => openLocalNpcsModal(ctx, locId, n.id)
        };
      });
      choices.push({ text: '收回目光', action: () => { setDialogue(null); renderAll(); } });
      setDialogue({
        speaker: '同地驻留修士一览', asset: ASSETS.elder,
        text: `此地当前共有 ${locals.length} 位四海游历修士驻足歇脚（随每日行程实时来去更替）：`,
        choices
      });
      renderAll();
      return;
    }

    const npc = locals.find(n => n.id === specificNpcId);
    if (!npc) return openLocalNpcsModal(ctx, locId, null);

    const rDef = D.REALMS[npc.realmIdx] || D.REALMS[0];
    const pObj = PERSONALITIES.find(p => p.id === npc.persId) || PERSONALITIES[0];
    const canSenseBag = (G.sense || 10) >= (npc.sense || 15) || npc.favor >= 30;
    const bagEntries = Object.entries(npc.bag || {}).filter(([, c]) => c > 0 && D.ITEMS);
    const bagDesc = canSenseBag
      ? (bagEntries.map(([id, c]) => `${D.ITEMS[id]?.name || id}×${c}`).join('、') || '空空如也') + `（灵石 ${npc.stones}）`
      : '【对方神识高于你，无法窥探其储物袋虚实（交情≥30或提升神识可见）】';
    const holdsRelic = G.worldRelic?.holder === 'npc' && G.worldRelic?.npcId === npc.id;

    const choices = [
      {
        text: `品茗论道一番（耗 2 日 · 印证【${D.SKILL_CATS[npc.dao]?.name || '剑道'}】）`,
        hint: '交情+15 · 修为精进',
        action: () => {
          advanceDays(ctx, 2, { seclusion: false });
          npc.favor = Math.min(100, (npc.favor || 0) + 15);
          const g = gainExp(26 + npc.realmIdx * 12);
          if (Math.random() < 0.45 && G.daoBase) {
            G.daoBase[npc.dao] = Math.min(100, Math.max(G.daoBase[npc.dao] || 0, getCatMastery(npc.dao)) + 2);
          }
          showToast(`与【${npc.name}】坐论【${D.SKILL_CATS[npc.dao]?.name || '大道'}】两日，交情 +15，修为 +${g}！`);
          saveGame('auto', true); openLocalNpcsModal(ctx, locId, npc.id);
        }
      }
    ];

    // 求购其储物袋中的宝物！
    if (canSenseBag && bagEntries.length > 0) {
      const [firstId] = bagEntries[0];
      const it = D.ITEMS[firstId];
      if (it) {
        const askPrice = Math.max(15, Math.round((it.price || 50) * pObj.tradeMul * (npc.favor >= 40 ? 0.8 : 1.0)));
        choices.push({
          text: `求购其随身【${it.name}】（性格：${npc.persName}）`,
          hint: `${askPrice} 灵石`,
          action: () => {
            if (G.stone < askPrice) return showToast(`灵石不足 ${askPrice} 枚。`);
            G.stone -= askPrice;
            npc.stones += askPrice;
            npc.bag[firstId]--;
            if (npc.bag[firstId] <= 0) delete npc.bag[firstId];
            addItem(firstId, 1);
            npc.favor = Math.min(100, (npc.favor || 0) + 8);
            showToast(`以 ${askPrice} 灵石从【${npc.name}】手中购得【${it.name}】！`);
            saveGame('auto', true); openLocalNpcsModal(ctx, locId, npc.id);
          }
        });
      }
    }

    // 点到为止切磋
    const hp = Math.round(rDef.maxHp * 1.15);
    const atk = 18 + npc.realmIdx * 13;
    choices.push({
      text: `邀【${npc.name}】演法切磋（点到为止 · 不伤和气）`,
      hint: `${rDef.name} · HP ${hp}`,
      action: () => {
        advanceDays(ctx, 1, { seclusion: false });
        startBattle({
          name: `${npc.name}（切磋）`, asset: ASSETS.elder, bg: 'sect_plaza', enemyType: 'cultivator', npcRef: npc,
          hp, maxHp: hp, atk, expReward: 65 + npc.realmIdx * 40, stoneReward: 20,
          onWin: () => {
            npc.favor = Math.min(100, (npc.favor || 0) + 10);
            showToast(`切磋小胜！【${npc.name}】拱手钦佩，交情 +10！`);
          }
        });
      }
    });

    // 悍然杀人越货（夺取其全部储物袋、灵石乃至造化轮回盘！）
    const killHp = Math.round(rDef.maxHp * 1.4);
    const killAtk = 22 + npc.realmIdx * 15;
    choices.push({
      text: `凶光毕露 · 悍然截杀【${npc.name}】杀人夺宝！${holdsRelic ? '（夺取造化轮回盘!）' : ''}`,
      hint: `生死战 · 业煞+25`,
      action: () => {
        npc.favor = -100;
        startBattle({
          name: `${npc.title}·${npc.name}`, asset: ASSETS.elder, bg: 'world_map', enemyType: 'cultivator', npcRef: npc,
          hp: killHp, maxHp: killHp, atk: killAtk, expReward: 140 + npc.realmIdx * 75, stoneReward: 0,
          onWin: () => {
            npc.alive = false;
            G.karma = (G.karma || 0) + (npc.faction === 'jiuyou' ? 5 : 28);
            G.factionRep[npc.faction] = (G.factionRep[npc.faction] || 0) - 35;
            let gotTypes = 0;
            Object.entries(npc.bag || {}).forEach(([id, c]) => {
              if (c > 0) { addItem(id, c); gotTypes++; }
            });
            G.stone += (npc.stones || 0);
            let relicTxt = '';
            if (holdsRelic) {
              G.bag.reincarnation_disc = 1;
              if (window.REINCARNATION) window.REINCARNATION.ensureWorldRelic(G);
              relicTxt = ' 并搜出天地唯一至宝【造化轮回盘】！';
            }
            pushNews(G, '血案', `${npc.title}【${npc.name}】在【${D.LOCATIONS.find(l=>l.id===locId)?.name||'外域'}】遭神秘狠人截杀灭口，随身储物袋被洗劫一空！`);
            if (npc.isLeader) handleLeaderSuccession(G, npc, D);
            showToast(`击杀【${npc.name}】，搜刮 ${gotTypes} 种宝物与 ${npc.stones} 灵石！${relicTxt}`);
            saveGame('auto', true);
          }
        });
      }
    });

    choices.push({ text: '← 返回在场修士列表', action: () => openLocalNpcsModal(ctx, locId, null) });

    const nProf = window.APPEARANCE ? window.APPEARANCE.getProfile(npc, G.totalDays) : null;
    let ageLine = `寿元 ${npc.age}/${npc.maxAge} 岁`;
    if (nProf) {
      if (nProf.locked) {
        ageLine = canSenseBag
          ? `外显容貌：约 ${nProf.displayAge} 岁（${nProf.stage.name}）· 【神识看破】系【${nProf.lockName}】驻颜伪装，真实骨龄已逾 ${npc.age}/${npc.maxAge} 载（本相约 ${nProf.naturalAge} 岁）！`
          : `外显容貌：约 ${nProf.displayAge} 岁（${nProf.stage.name} · ${nProf.stage.hair}）· 神识尚浅，难辨其真实骨龄深浅`;
      } else {
        ageLine = `外显容貌：约 ${nProf.displayAge} 岁（${nProf.stage.name} · ${nProf.stage.hair}）· 寿元 ${npc.age}/${npc.maxAge} 岁${nProf.fiveDecay ? '【天人五衰】' : ''}`;
      }
    }

    setDialogue({
      speaker: `${npc.name}（${npc.title} · ${rDef.name}）`, asset: ASSETS.elder,
      text: `性情：【${npc.persName}】（${pObj.desc}）· 预计在此再驻留 ${npc.stayDaysLeft || 3} 日。\n${ageLine}\n神识探查储物袋：${bagDesc}${holdsRelic ? '\n【惊天异象】其怀中正藏着天地唯一【造化轮回盘】！' : ''}`,
      choices
    });
    renderAll();
  }

  // ===== 闯入本地限时随机秘境 =====
  function enterLocalRandomRift(ctx, locId) {
    const { G, D, ASSETS, setDialogue, startBattle, addItem, showToast, saveGame, renderAll } = ctx;
    const idx = (G.randomRifts || []).findIndex(rf => rf.loc === locId && rf.expireDay > G.totalDays);
    if (idx < 0) return showToast('该限时秘境已消散或已被他人捷足先登！');
    const rf = G.randomRifts[idx];
    const leftDays = rf.expireDay - G.totalDays;
    const bossHp = 260 + rf.dangerLv * 240;
    const bossAtk = 22 + rf.dangerLv * 12;
    const rewardName = D.ITEMS[rf.rewardItem]?.name || '古修重宝';

    setDialogue({
      speaker: `天降随机秘境 · ${rf.name}`, asset: ASSETS.wolf_boss,
      text: `虚空裂隙中灵光喷涌（秘境将于 ${leftDays} 日后崩塌，且随时可能被赶来的其他修士抢先夺走！内蕴核心机缘：【${rewardName}】）。`,
      choices: [
        {
          text: `抢在众修之前闯入【${rf.name}】夺宝！（耗 6 日）`,
          hint: `守宝灵兽 HP ${bossHp}`,
          action: () => {
            advanceDays(ctx, 6, { seclusion: false });
            startBattle({
              name: `${rf.name}·护宝古兽`, asset: ASSETS.wolf_boss, bg: 'forest', enemyType: 'beast',
              hp: bossHp, maxHp: bossHp, atk: bossAtk, expReward: 160 + rf.dangerLv * 65, stoneReward: 95 + rf.dangerLv * 35,
              onWin: () => {
                const curIdx = (G.randomRifts || []).findIndex(x => x.id === rf.id);
                if (curIdx >= 0) G.randomRifts.splice(curIdx, 1);
                addItem(rf.rewardItem, 1);
                pushNews(G, '秘境', `天降秘境「${rf.name}」被人强势破开，核心异宝【${rewardName}】已有归属，秘境随即湮灭！`);
                showToast(`破开随机秘境【${rf.name}】，夺得核心异宝【${rewardName}】！`);
                saveGame('auto', true);
              }
            });
          }
        },
        { text: '暂不涉险', action: () => { setDialogue(null); renderAll(); } }
      ]
    });
    renderAll();
  }

  function runQuarterlyFactionPulse(ctx) {
    const { G } = ctx;
    const facs = G.factionsDyn || [];
    if (G.worldState.seaBlockadeUntilDay > 0 && G.totalDays >= G.worldState.seaBlockadeUntilDay) {
      G.worldState.seaBlockadeUntilDay = 0;
      G.worldState.priceMul = 1.0;
    }

    // 1. 天地灵气潮汐轮转（每 3~5 年自动切换！）
    if (G.worldTide && G.totalDays >= (G.worldTide.nextChangeDay || 0)) {
      const nextTide = pick(WORLD_TIDES.filter(t => t.id !== G.worldTide.id)) || WORLD_TIDES[0];
      G.worldTide = { id: nextTide.id, name: nextTide.name, nextChangeDay: G.totalDays + randInt(1080, 1800) };
      G.worldState.priceMul = nextTide.priceMul;
      pushNews(G, '天象', `【灵潮更迭】沧溟界步入「${nextTide.name}」纪年：${nextTide.desc}`);
    }

    // 2. 动态宗门外交竞合、互黑流言与资源争端（全部使用本纪元随机生成的宗门名！）
    const r = Math.random();
    const fA = facs.length ? pick(facs) : { id: 'juntian', name: '太白剑宗', leaderName: '玄明', policyName: '强硬扩土' };
    const fB = facs.length > 1 ? pick(facs.filter(x => x.id !== fA.id)) : fA;
    const hehuan = facs.find(f => f.archetype === 'hehuan') || fA;
    const alc = facs.find(f => f.archetype === 'alchemy') || fB;

    if (r < 0.18 || G.seaHostility >= 40) {
      G.seaHostility = Math.max(0, G.seaHostility - 25);
      G.worldState.seaBlockadeUntilDay = G.totalDays + 90;
      G.worldState.priceMul = 1.45;
      G.worldState.warDesc = '【沧溟兽潮】海族龙庭掀起兽潮围困近海，跨洋巨舰停航三月，丹药海珍涨价 45%！';
      pushNews(G, '兽潮', G.worldState.warDesc);
    } else if (r < 0.42 && fA.id !== fB.id) {
      shiftDiplomacy(G, fA.id, fB.id, -randInt(18, 32));
      G.worldState.priceMul = 1.22;
      G.worldState.warDesc = `【灵矿摩擦】${fA.name}（掌门${fA.leaderName}·${fA.policyName}）与${fB.name}因灵脉分润谈崩爆发冲突，双方互相指责对方背信弃义！`;
      pushNews(G, '争端', G.worldState.warDesc);
    } else if (r < 0.64 && fA.id !== fB.id) {
      shiftDiplomacy(G, fA.id, fB.id, randInt(16, 30));
      G.worldState.priceMul = 0.94;
      G.worldState.warDesc = `【合纵暗盟】${fA.name}与${fB.name}私下达成灵材互市与联姻秘约，外人虽议论纷纷却无人敢轻动！`;
      pushNews(G, '盟约', G.worldState.warDesc);
    } else if (r < 0.82) {
      G.worldState.priceMul = 0.88;
      G.worldState.warDesc = `【丹道盛会】${alc.name}开山放丹，${hehuan.name}趁机广发红尘请帖，五洲名宿暗流涌动！`;
      pushNews(G, '盛事', G.worldState.warDesc);
    } else {
      // 小组织起伏兴衰
      const m = (G.minorOrgs || []).length ? pick(G.minorOrgs) : null;
      if (m) {
        m.power = Math.max(5, Math.min(99, (m.power || 20) + randInt(-10, 18)));
        G.worldState.warDesc = `【江湖暗流】小组织「${m.name}」在${m.zone}暗中扩张势力（声势 ${m.power}），竟引得${fA.name}外门执事私下招安！`;
        pushNews(G, '暗流', G.worldState.warDesc);
      }
    }
  }

  function openTravelModal(ctx, targetLocId, onArrive) {
    const { G, D, ASSETS, SFX, setDialogue, getEquipStats, startBattle, gainExp, showToast, saveGame, renderAll } = ctx;
    initWorldState(G);
    const toLoc = D.LOCATIONS.find(l => l.id === targetLocId);
    if (!toLoc) return;
    const fromLoc = D.LOCATIONS.find(l => l.id === (G.loc === 'map' ? 'sect' : G.loc)) || D.LOCATIONS[0];

    if (fromLoc.id === toLoc.id) {
      onArrive(toLoc.id);
      return;
    }

    const distLi = calcDistanceLi(fromLoc, toLoc);
    const eq = getEquipStats ? getEquipStats() : {};
    const speedLi = getPlayerSpeedLi(G, eq);
    const maxSea = Math.max(fromLoc.seaZone || 0, toLoc.seaZone || 0);
    const seaMultiplier = maxSea >= 4 ? 1.45 : (maxSea >= 2 ? 1.2 : 1.0);
    const rawFlightDays = (distLi * seaMultiplier) / Math.max(10, speedLi);
    const dispDays = rawFlightDays < 1 ? `不足1日(${Math.max(1, Math.round(rawFlightDays * 12))}时辰)` : `约 ${Math.ceil(rawFlightDays)} 日`;

    let canSelfFly = true;
    let blockReason = '';
    if (maxSea === 1 && G.realmIdx < 3) {
      canSelfFly = false; blockReason = '炼气期无法肉身横渡近海风浪（需筑基御器，或去港口乘万宝灵舟）';
    } else if (maxSea === 2 && G.realmIdx < 4) {
      canSelfFly = false; blockReason = '外海雷暴狂猛，未结金丹不可孤身飞渡（需乘跨洋巨舰或古传送阵）';
    } else if (maxSea === 3 && G.realmIdx < 5 && !G.flags?.hasDragonPearl) {
      canSelfFly = false; blockReason = '深海重水万钧，需元婴修为或持有海族【通海龙珠】方可潜入';
    } else if (maxSea >= 4 && G.realmIdx < 5) {
      canSelfFly = false; blockReason = '十万里绝灵黑水洋无法汲取灵气，未至元婴强渡必灵枯坠海而亡！';
    }

    const choices = [];
    if (canSelfFly) {
      choices.push({
        text: `自行赶路前往【${toLoc.name}】（预计耗时：${dispDays}）`,
        hint: `${speedLi}里/日`,
        action: () => {
          setDialogue(null);
          const res = advanceDays(ctx, rawFlightDays, { seclusion: false });
          G.loc = toLoc.id;
          if (res.elapsed >= 8 && Math.random() < 0.28) {
            if (maxSea >= 1 && Math.random() < 0.55) {
              startBattle({
                name: maxSea >= 3 ? '深海巡海夜叉' : '沧溟拦路海蛟',
                asset: ASSETS.wolf_boss, bg: 'world_map', enemyType: 'beast',
                hp: 240 + maxSea * 260, maxHp: 240 + maxSea * 260, atk: 24 + maxSea * 14,
                expReward: 120 + maxSea * 60, stoneReward: 65 + maxSea * 35,
                onWin: () => {
                  G.seaHostility = (G.seaHostility || 0) + 8;
                  onArrive(toLoc.id);
                  showToast(`斩杀拦路海兽顺利抵达【${toLoc.name}】（耗时 ${res.elapsed} 日）！`);
                }
              });
              return;
            } else {
              const bonusExp = gainExp(35 + res.elapsed * 2);
              showToast(`跋涉 ${distLi} 里（耗 ${res.elapsed} 日），途中观山海云卷有所顿悟，修为 +${bonusExp}！`);
            }
          } else if (res.elapsed > 0) {
            showToast(`行路 ${distLi} 里，历时 ${res.elapsed} 日抵达【${toLoc.name}】。`);
          }
          onArrive(toLoc.id);
          saveGame('auto', true); renderAll();
        }
      });
    } else {
      choices.push({
        text: `无法自行飞渡：${blockReason}`,
        hint: '境界受限',
        action: () => showToast(blockReason)
      });
    }

    if ((fromLoc.isPort || toLoc.isPort || (maxSea >= 1 && maxSea <= 2)) && maxSea <= 2) {
      const blockaded = G.worldState.seaBlockadeUntilDay > G.totalDays;
      const shipDays = Math.max(3, Math.ceil(distLi / 650));
      const fare = Math.max(35, Math.round((distLi / 220) * (G.factionRep.wanbao >= 30 ? 0.75 : 1)));
      choices.push({
        text: blockaded ? '【停航】外海兽潮肆虐，万宝跨洋巨舰暂封航路' : `搭乘万宝跨洋灵舟前往（船票 ${fare} 灵石 · 航程 ${shipDays} 日）`,
        hint: blockaded ? '兽潮封海' : '阵法庇护安全渡海',
        action: () => {
          if (blockaded) return showToast('当前外海兽潮封港，灵舟停航！');
          if (G.stone < fare) return showToast(`船资不足 ${fare} 枚灵石。`);
          G.stone -= fare;
          setDialogue(null);
          advanceDays(ctx, shipDays, { seclusion: false });
          G.loc = toLoc.id;
          onArrive(toLoc.id);
          showToast(`乘万宝巨舰航行 ${shipDays} 日，平安抵达【${toLoc.name}】。`);
          saveGame('auto', true); renderAll();
        }
      });
    }

    if (toLoc.hasTeleport) {
      const halfOff = (G.factionRep.juntian >= 40 || G.factionRep.daqian >= 40 || G.sect === '青云剑宗');
      const tpFee = Math.max(120, Math.round((distLi / 180) * (halfOff ? 0.55 : 1.0)));
      choices.push({
        text: `借用跨洲古传送阵瞬移至【${toLoc.name}】（耗 1 日）`,
        hint: `${tpFee} 灵石${halfOff ? '(仙盟/皇朝优待)' : ''}`,
        action: () => {
          if (G.stone < tpFee) return showToast(`启动古传送阵需 ${tpFee} 枚上品灵石折算资费。`);
          if ((G.karma || 0) >= 50 && (toLoc.id === 'central_capital' || toLoc.id === 'central_city')) {
            return showToast('你周身魔道【业煞】过重，钧天护城大阵拒绝为你开启传送！');
          }
          G.stone -= tpFee;
          setDialogue(null);
          advanceDays(ctx, 1, { seclusion: false });
          G.loc = toLoc.id;
          onArrive(toLoc.id);
          if (SFX) SFX.play('levelup');
          showToast(`虚空阵纹亮起，转瞬跨越 ${distLi} 里抵达【${toLoc.name}】！`);
          saveGame('auto', true); renderAll();
        }
      });
    }

    choices.push({ text: '暂不动身', action: () => { setDialogue(null); renderAll(); } });
    setDialogue({
      speaker: `山海行路推演 · ${fromLoc.name} → ${toLoc.name}`, asset: ASSETS.hero,
      text: `两地相距约 ${distLi.toLocaleString()} 里（目标地貌：${['内陆灵域','近海群岛','外海风暴洋','万丈深海','十万里黑水洋彼岸'][maxSea]}）。你当前境界日行速度为 ${speedLi.toLocaleString()} 里/日。请选择动身方式：`,
      choices
    });
    renderAll();
  }

  function openSeclusionModal(ctx, monthlyBaseExp, placeTitle) {
    const { G, ASSETS, setDialogue, gainExp, recalcDerivedStats, showToast, saveGame, renderAll } = ctx;
    const opts = [
      { label: '调息吐纳一旬（10 日）', days: 10, mul: 0.34 },
      { label: '静室闭关一月（30 日）', days: 30, mul: 1.0 },
      { label: '深度闭关一季（90 日）', days: 90, mul: 3.1 },
      { label: '枯坐闭关一载（360 日 · 遇急讯自动唤醒）', days: 360, mul: 12.8 },
      { label: '冲境苦修三载（1080 日 · 遇大限/急讯唤醒）', days: 1080, mul: 39.0 }
    ];
    const choices = opts.map(o => ({
      text: o.label,
      hint: `寿元余 ${G.maxAge - G.age} 载`,
      action: () => {
        setDialogue(null);
        const res = advanceDays(ctx, o.days, { seclusion: true, wakeOnUrgent: true });
        if (res.elapsed > 0) {
          recalcDerivedStats(true);
          const ratio = res.elapsed / o.days;
          const expGain = gainExp(Math.max(4, Math.round(monthlyBaseExp * o.mul * ratio)));
          showToast(`${res.interrupted ? '【提前破关】' : ''}闭关 ${res.elapsed} 日，修为精进 +${expGain}！${res.reason ? ' ' + res.reason : ''}`);
        }
        saveGame('auto', true); renderAll();
      }
    }));
    choices.push({ text: '取消闭关', action: () => { setDialogue(null); renderAll(); } });
    setDialogue({
      speaker: `${placeTitle} · 闭关择期`, asset: ASSETS.hero,
      text: `当前为 ${formatDate(G)}，寿元 ${G.age}/${G.maxAge} 岁。闭关期间沧溟界众生将每日同步游历、夺宝与破境，若遇寿元大限或重大传书将自动唤醒。`,
      choices
    });
    renderAll();
  }

  return {
    NINE_POWERS,
    WORLD_TIDES,
    initWorldState,
    getCal,
    formatDate,
    pushNews,
    pushLetter,
    getDiplomacy,
    shiftDiplomacy,
    getRegionBonus,
    getPlayerSpeedLi,
    calcDistanceLi,
    advanceDays,
    getLocalNpcs,
    openLocalNpcsModal,
    enterLocalRandomRift,
    openTravelModal,
    openSeclusionModal
  };
})();
