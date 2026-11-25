// v8.1 《沧溟界》全随机众生演化沙盒引擎：
// 1. 日(行路偶遇) · 候/5日(错峰分桶AI决策/破境/夺宝/随机秘境) · 季/90日(九大势力战争潮汐) 三级分频时间轮（算染分离，10年闭关<25ms零卡顿）
// 2. 少数经典宿命人物锚点 + 每局完全随机生成的天下修士池（随机姓名/道号/势力/性格/灵根/大道/随身背包，老辈陨落后自动诞生新一代随机天骄！）
// 3. 同场景实时偶遇在场修士（神识探查储物袋 / 论道交好 / 求购随身宝物 / 切磋印证 / 杀人夺宝结下血仇！）
// 4. 全随机限时天降秘境与悬赏奇遇（逾期会被其他赶到的随机修士抢先搬空！）

window.WORLD_SIM = (function () {
  const REALM_SPEED_LI = [25, 36, 52, 140, 560, 2400, 11000, 45000, 120000];
  const CN_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

  const NINE_POWERS = [
    { id: 'juntian', name: '钧天正道仙盟', zone: '东洲/中洲', desc: '执掌跨洲古传送阵（声望≥40享半价）与正统六道传承，严惩高业煞魔修。' },
    { id: 'daqian',  name: '大乾仙朝·千年世家', zone: '中洲皇都', desc: '皇朝龙气与崔/卢/姬千年世家；结下深厚世家恩义后，下世转生高概率投胎为世家嫡子！' },
    { id: 'danding', name: '隐世丹鼎神谷', zone: '南洲秘谷', desc: '超然中立的药王与天工圣谷，可求取延寿圣丹与重铸强化随身法器。' },
    { id: 'wanbao',  name: '四海万宝商盟', zone: '四海商港', desc: '垄断跨洋巨舰航线、年度大拍与四海天机情报网。' },
    { id: 'zhurong', name: '祝融古巫殿',   zone: '南赤瘴洲', desc: '执掌地肺真火、奇虫巫蛊与古炼体术，不看灵根高低，唯敬强者。' },
    { id: 'lindong', name: '凛冬剑冢',     zone: '北俱寒洲', desc: '镇守永冻冰川与陨仙古坑，极道杀伐剑阵圣地。' },
    { id: 'jiuyou',  name: '九幽魔道诸脉', zone: '暗坊/北渊', desc: '掌握燃寿速成魔功与夺魄秘术，修之涨【业煞】。' },
    { id: 'longting',name: '沧溟海族龙庭', zone: '七成深海', desc: '统御浩瀚沧海，滥捕海兽引动【兽潮封海】，交好可得【通海龙珠】直入深渊。' },
    { id: 'penglai', name: '碎星散修盟·瀛洲古族', zone: '群岛/彼岸', desc: '近海散修自由港与十万里黑水洋彼岸【先天道果母树】守护者。' }
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

  function genProceduralNpc(seq, realmTierHint, D) {
    const usedR = realmTierHint != null ? realmTierHint : (Math.random() < 0.42 ? randInt(0, 2) : (Math.random() < 0.72 ? randInt(3, 4) : randInt(4, 6)));
    const pwr = pick(NINE_POWERS);
    const pers = pick(PERSONALITIES);
    const dao = pick(DAO_KEYS);
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

    // 随机随身行囊宝物（1~3件，高阶修士有概率揣着延寿桃、悟道茶甚至古宝！）
    const bag = {};
    const itemPool = usedR >= 4 ? LOOT_POOL_HIGH : LOOT_POOL_LOW;
    const itemCnt = randInt(1, 3);
    for (let i = 0; i < itemCnt; i++) {
      const iid = pick(itemPool);
      bag[iid] = (bag[iid] || 0) + 1;
    }

    const factionTitles = {
      juntian: ['正道真传', '巡山剑修', '仙盟执事'],
      daqian:  ['世家贵胄', '仙朝供奉', '皇城靖夜司'],
      danding: ['游方丹师', '寻药客', '天工铸师'],
      wanbao:  ['四海行商', '鉴宝师', '护船客卿'],
      zhurong: ['南荒巫祝', '百战体修', '控火祭司'],
      lindong: ['苦寒剑客', '守冢人', '冰原阵师'],
      jiuyou:  ['九幽魔修', '暗巷邪修', '炼魂散魔'],
      longting:['化形海修', '沧溟巡使', '近海散妖'],
      penglai: ['海外散修', '孤岛奇人', '寻仙游侠']
    };
    const title = pick(factionTitles[pwr.id] || ['四海散修']);

    const realAge = Math.max(16, Math.min(maxAge - 8, baseAge));
    // 高龄/高阶修士有约 32% 概率服过驻颜丹或运转太素驻颜术伪装青年皮相（扮猪吃老虎！）
    let youthLock = null;
    if ((realAge >= 90 || usedR >= 3) && Math.random() < 0.32) {
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
      title: `${pwr.name.slice(0, 2)}·${title}`,
      faction: pwr.id,
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
      luck: randInt(25, 95),
      sense: 12 + usedR * 9 + randInt(0, 8),
      favor: 0, // 与主角交情 (-100 死仇 ~ +100 生死之交)
      stones: 25 + usedR * usedR * 35 + randInt(0, 60),
      bag
    };
  }

  function buildProceduralWorldRoster(D) {
    const list = [];
    // 生成 34 名完全随机的天下修士，覆盖炼气～化神各梯队！
    for (let i = 0; i < 34; i++) {
      const tier = i < 12 ? randInt(0, 2) : (i < 24 ? randInt(3, 4) : randInt(4, 6));
      list.push(genProceduralNpc(i + 1, tier, D));
    }
    return list;
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
    G._npcSeq = G._npcSeq || 40;
    G.factionRep = Object.assign({
      juntian: 0, daqian: 0, danding: 0, wanbao: 0, zhurong: 0, lindong: 0, jiuyou: 0, longting: 0, penglai: 0
    }, G.factionRep || {});
    G.worldState = Object.assign({
      priceMul: 1.0,
      seaBlockadeUntilDay: 0,
      warRegion: null,
      warDesc: '五洲七海众生竞渡，机缘暗涌',
      lastHeadline: '沧溟纪元开启，百舸争流各觅长生'
    }, G.worldState || {});
    if (!Array.isArray(G.simNpcs) || !G.simNpcs.length) {
      G.simNpcs = buildProceduralWorldRoster(D);
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

    // C) 众生新陈代谢：若在世修士少于 30 人，自动从五洲寒门/世家涌现新一代随机少年修士！
    if (bucket === 0 && aliveCount < 30 && D) {
      G._npcSeq = (G._npcSeq || 50) + 1;
      const fresh = genProceduralNpc(G._npcSeq, randInt(0, 2), D);
      G.simNpcs = G.simNpcs.filter(n => n.alive || (G.worldRelic?.npcId === n.id)).slice(-38);
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
    const r = Math.random();
    if (G.worldState.seaBlockadeUntilDay > 0 && G.totalDays >= G.worldState.seaBlockadeUntilDay) {
      G.worldState.seaBlockadeUntilDay = 0;
      G.worldState.priceMul = 1.0;
    }
    if (r < 0.22 || G.seaHostility >= 40) {
      G.seaHostility = Math.max(0, G.seaHostility - 25);
      G.worldState.seaBlockadeUntilDay = G.totalDays + 90;
      G.worldState.priceMul = 1.45;
      G.worldState.warDesc = '【沧溟兽潮】海族龙庭掀起兽潮围困近海，跨洋巨舰停航三月，丹药海珍涨价 45%！';
      pushNews(G, '兽潮', G.worldState.warDesc);
    } else if (r < 0.46) {
      G.worldState.priceMul = 1.25;
      G.worldState.warRegion = 'south';
      G.worldState.warDesc = '【南荒烽火】祝融古巫殿与大乾仙朝镇南军因赤炎火脉归属爆发激战！';
      pushNews(G, '争端', G.worldState.warDesc);
    } else if (r < 0.70) {
      G.worldState.priceMul = 0.88;
      G.worldState.warRegion = null;
      G.worldState.warDesc = '【丹鼎开炉】隐世丹鼎神谷开谷济世，五洲灵丹市价回落一成！';
      pushNews(G, '盛事', G.worldState.warDesc);
    } else {
      G.worldState.priceMul = 1.0;
      G.worldState.warRegion = 'north';
      G.worldState.warDesc = '【正魔对峙】九幽深渊魔气暴涨，钧天仙盟与凛冬剑冢联手布下北冥封魔线。';
      pushNews(G, '风云', G.worldState.warDesc);
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
    initWorldState,
    getCal,
    formatDate,
    pushNews,
    pushLetter,
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
