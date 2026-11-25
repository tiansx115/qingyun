// v8.0 《沧溟界》精确「日」时钟、五洲七海真实里程遁速、九大势力博弈 与 具名NPC自主生老病死/抢夺轮回盘演化引擎
window.WORLD_SIM = (function () {
  // 9阶境界基础日行速度（单位：里/日）
  const REALM_SPEED_LI = [25, 36, 52, 140, 560, 2400, 11000, 45000, 120000];
  const CN_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

  // 九大原创势力定义
  const NINE_POWERS = [
    { id: 'juntian', name: '钧天正道仙盟', zone: '东洲/中洲', desc: '执掌跨洲古传送阵（声望≥40享半价）与正统六道传承，严惩高业煞魔修。' },
    { id: 'daqian',  name: '大乾仙朝·千年世家', zone: '中洲皇都', desc: '皇朝龙气与崔/卢/姬千年世家；结下深厚世家恩义后，下世转生高概率投胎为世家嫡子！' },
    { id: 'danding', name: '隐世丹鼎神谷', zone: '南洲秘谷', desc: '超然中立的药王与天工圣谷，可求取延寿圣丹与重铸强化随身法器。' },
    { id: 'wanbao',  name: '四海万宝商盟', zone: '四海商港', desc: '垄断跨洋巨舰航线、年度大拍与四海天机情报网。' },
    { id: 'zhurong', name: '祝融古巫殿',   zone: '南赤瘴洲', desc: '执掌地肺真火、奇虫巫蛊与古炼体术，不看灵根高低，唯敬强者。' },
    { id: 'lindong', name: '凛冬剑冢',     zone: '北俱寒洲', desc: '镇守永冻冰川与陨仙古坑，极道杀伐剑阵圣地。' },
    { id: 'jiuyou',  name: '九幽魔道诸脉', zone: '暗坊/北渊', desc: '掌握燃寿速成魔功与夺魄秘术，修之涨【业煞】。' },
    { id: 'longting',name: '沧溟海族龙庭', zone: '七成深海', desc: '统御浩瀚沧海，滥捕海兽会引动【兽潮封海】，交好可得【通海龙珠】直入深渊。' },
    { id: 'penglai', name: '碎星散修盟·瀛洲古族', zone: '群岛/彼岸', desc: '近海散修自由港与十万里黑水洋彼岸【先天道果母树】守护者。' }
  ];

  // 初始世界活跃具名修士名录（各自独立修炼、跨洲游历、渡劫生死、甚至抢夺造化轮回盘！）
  function createInitialSimNpcs() {
    return [
      { id:'npc_cui',   name:'崔玄度', title:'清河崔氏嫡长', faction:'daqian',  realmIdx:3, exp:260, age:28, maxAge:190, loc:'central_capital', alive:true, luck:65 },
      { id:'npc_ye',    name:'叶孤寒', title:'凛冬剑冢首徒', faction:'lindong', realmIdx:4, exp:420, age:64, maxAge:360, loc:'north_ice',       alive:true, luck:78 },
      { id:'npc_chi',   name:'赤炎烈', title:'祝融大巫祝',   faction:'zhurong', realmIdx:4, exp:510, age:82, maxAge:350, loc:'south_fire',      alive:true, luck:55 },
      { id:'npc_su',    name:'苏药灵', title:'丹鼎神谷少主', faction:'danding', realmIdx:3, exp:310, age:32, maxAge:210, loc:'south_danding',   alive:true, luck:72 },
      { id:'npc_li',    name:'厉无咎', title:'九幽血魔子',   faction:'jiuyou',  realmIdx:4, exp:600, age:95, maxAge:340, loc:'north_demon',     alive:true, luck:68 },
      { id:'npc_ao',    name:'敖清漪', title:'沧溟龙庭三公主',faction:'longting',realmIdx:5, exp:700, age:160,maxAge:800, loc:'sea_dragon',      alive:true, luck:82 },
      { id:'npc_feng',  name:'风不羁', title:'碎星散仙',     faction:'penglai', realmIdx:3, exp:410, age:75, maxAge:185, loc:'sea_star_isle',   alive:true, luck:85 },
      { id:'npc_ji',    name:'姬太初', title:'大乾皇室老祖', faction:'daqian',  realmIdx:5, exp:1280,age:490,maxAge:530, loc:'central_city',    alive:true, luck:74 },
      { id:'npc_gu',    name:'顾惊鸿', title:'太微真传剑子', faction:'juntian', realmIdx:2, exp:240, age:22, maxAge:125, loc:'sect',            alive:true, luck:62 },
      { id:'npc_hei',   name:'乌冥老人',title:'外海散魔',    faction:'jiuyou',  realmIdx:3, exp:480, age:168,maxAge:182, loc:'sea_wreck',       alive:true, luck:48 }
    ];
  }

  function initWorldState(G) {
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
    G.factionRep = Object.assign({
      juntian: 0, daqian: 0, danding: 0, wanbao: 0, zhurong: 0, lindong: 0, jiuyou: 0, longting: 0, penglai: 0
    }, G.factionRep || {});
    G.worldState = Object.assign({
      priceMul: 1.0,
      seaBlockadeUntilDay: 0,
      warRegion: null,
      warDesc: '五洲四海局势暂稳，暗流潜涌',
      lastHeadline: '沧溟初开，五洲修士各争长生机缘'
    }, G.worldState || {});
    if (!Array.isArray(G.simNpcs) || !G.simNpcs.length) G.simNpcs = createInitialSimNpcs();
    if (!Array.isArray(G.worldNews)) G.worldNews = [{ day: G.totalDays, tag: '天机', text: '沧溟历启，天地唯一至宝【造化轮回盘】隐匿于五洲七海之间。' }];
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
    if (G.worldNews.length > 45) G.worldNews.length = 45;
    if (G.worldState) G.worldState.lastHeadline = text;
  }

  function pushLetter(G, title, text, locId, expireDays) {
    G.letters = G.letters || [];
    G.letters.unshift({
      id: 'lt_' + G.totalDays + '_' + Math.floor(Math.random() * 999),
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

  // ===== 真实遁速与两地里程计算 =====
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

  // ===== 核心：按日推进时钟 + 自动触发月度/季度全界演化脉冲 =====
  function advanceDays(ctx, rawDays, opts = {}) {
    const { G, showToast } = ctx;
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

    let elapsed = 0;
    let interrupted = false;
    let reason = '';

    for (let i = 0; i < wholeDays; i++) {
      const prevMonthIdx = Math.floor((G.totalDays - 1) / 30);
      const prevQuarterIdx = Math.floor((G.totalDays - 1) / 90);
      G.totalDays += 1;
      elapsed += 1;
      G.month = Math.floor((G.totalDays - 1) / 30) + 1;
      G.age = 16 + Math.max(0, Math.floor((G.totalDays - G.birthDay) / 360));

      // 寿元耗尽判定
      if (G.age >= G.maxAge && window.REINCARNATION) {
        if (window.REINCARNATION.hasRelic(G)) {
          window.REINCARNATION.executeReincarnation(ctx, 'calm', null);
        } else {
          window.REINCARNATION.triggerTrueDeath(ctx, '大限已至，寿元耗尽坐化');
        }
        return { elapsed, interrupted: true, reason: '大限已至' };
      }

      const newMonthIdx = Math.floor((G.totalDays - 1) / 30);
      if (newMonthIdx > prevMonthIdx) {
        const urgentMsg = runMonthlyWorldPulse(ctx);
        const newQuarterIdx = Math.floor((G.totalDays - 1) / 90);
        if (newQuarterIdx > prevQuarterIdx) {
          runQuarterlyFactionPulse(ctx);
        }
        // 深度闭关期间智能唤醒判定！
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
    }

    if (interrupted && reason && showToast) showToast(reason);
    return { elapsed, interrupted, reason };
  }

  // ===== 月度全界 NPC 演化（修炼、游历、渡劫生死、抢夺造化轮回盘、飞剑求援！）=====
  function runMonthlyWorldPulse(ctx) {
    const { G, D } = ctx;
    let urgentWake = '';
    const cal = getCal(G.totalDays);
    const locs = D.LOCATIONS || [];

    // 每年十月初一年度大拍提醒
    if (cal.monthNum === 10) {
      pushNews(G, '商盟', '四海万宝商盟年度鉴宝大拍于东洲鬼坊与近海碎星岛同步启幕！');
    }

    // 解除过期的兽潮封海
    if (G.worldState.seaBlockadeUntilDay > 0 && G.totalDays >= G.worldState.seaBlockadeUntilDay) {
      G.worldState.seaBlockadeUntilDay = 0;
      G.worldState.priceMul = 1.0;
      pushNews(G, '沧海', '外海兽潮退回苍渊深处，万宝跨洋巨舰恢复通航。');
    }

    // 遍历全界活跃具名修士 NPC
    (G.simNpcs || []).forEach(npc => {
      if (!npc.alive) return;
      // 每年正月长1岁
      if (cal.monthNum === 1) npc.age += 1;

      // 1) 寿尽判定（若该NPC恰好握有唯一造化轮回盘，他会催动轮回盘转生，轮回盘重新飞走！）
      if (npc.age >= npc.maxAge) {
        if (G.worldRelic && G.worldRelic.holder === 'npc' && G.worldRelic.npcId === npc.id) {
          npc.age = 16; npc.realmIdx = 0; npc.exp = 0;
          if (window.REINCARNATION) window.REINCARNATION.ensureWorldRelic(G);
          G.worldRelic.holder = 'world';
          const rLoc = locs[Math.floor(Math.random() * locs.length)] || locs[0];
          G.worldRelic.loc = rLoc.id;
          G.worldRelic.rumor = `【${rLoc.name}】上空曾有轮回紫光坠落`;
          pushNews(G, '轮回', `震惊五洲！【${npc.name}】寿尽之际竟催动【造化轮回盘】兵解转世，至宝再次破空飞遁不知所踪！`);
          urgentWake = `【天机急讯】持有造化轮回盘的${npc.name}已兵解转世，轮回盘重归天地无主之态！`;
        } else {
          npc.alive = false;
          pushNews(G, '陨落', `${npc.title}【${npc.name}】求取延寿丹未果，于 ${npc.age} 岁寿尽坐化，一生遗物散入坊市。`);
        }
        return;
      }

      // 2) NPC 自主修炼与渡劫突破（有真死淘汰率！）
      const gain = 14 + Math.floor((npc.luck || 50) * 0.22);
      npc.exp = (npc.exp || 0) + gain;
      const curR = D.REALMS[npc.realmIdx];
      const nextR = D.REALMS[npc.realmIdx + 1];
      if (curR && nextR && npc.exp >= curR.exp && npc.realmIdx < 6) {
        npc.exp = 0;
        const passChance = Math.min(0.85, 0.48 + (npc.luck || 50) * 0.004);
        if (Math.random() < passChance) {
          npc.realmIdx += 1;
          npc.maxAge += nextR.ageBonus || 100;
          pushNews(G, '破境', `${npc.title}【${npc.name}】引动天地异象，成功渡劫踏入【${nextR.name}】！`);
        } else if (Math.random() < 0.35) {
          // 渡劫身死！若其持有造化轮回盘则掉落回该地点！
          npc.alive = false;
          if (G.worldRelic && G.worldRelic.holder === 'npc' && G.worldRelic.npcId === npc.id) {
            G.worldRelic = { holder: 'world', loc: npc.loc, placeName: npc.loc, rumor: `【${npc.name}】渡劫陨落之地似遗落造化轮回盘` };
            urgentWake = `【天机急讯】持有造化轮回盘的${npc.name}渡劫身死，至宝遗落于其陨落之地！`;
          }
          pushNews(G, '劫灭', `惜哉！${npc.title}【${npc.name}】冲击【${nextR.name}】雷劫失败，身死道消！`);
          return;
        }
      }

      // 3) NPC 按自身境界在五洲七海游历移动
      if (Math.random() < 0.28) {
        const reachable = locs.filter(l => (l.seaZone || 0) <= Math.max(0, npc.realmIdx - 2));
        if (reachable.length) {
          const pick = reachable[Math.floor(Math.random() * reachable.length)];
          npc.loc = pick.id;
        }
      }

      // 4) NPC 抢先寻获天地唯一【造化轮回盘】判定！
      if (G.worldRelic && G.worldRelic.holder === 'world' && G.worldRelic.loc === npc.loc && npc.realmIdx >= 3) {
        if (Math.random() < 0.045) {
          const locObj = locs.find(l => l.id === npc.loc);
          G.worldRelic = {
            holder: 'npc',
            npcId: npc.id,
            npcName: npc.name,
            loc: npc.loc,
            rumor: `天机感应显示，【造化轮回盘】已被${npc.title}【${npc.name}】捷足先登收入囊中！`
          };
          pushNews(G, '至宝', `秘境异动！传闻${npc.title}【${npc.name}】在${locObj ? locObj.name : '秘境'}偶得一件太古轮回异宝！`);
          pushLetter(G, `【天机密报】轮回盘易主`, `天机阁探得：天地唯一至宝【造化轮回盘】已被【${npc.name}】夺得，可追踪其行踪设法谋夺！`, npc.loc, 360);
          urgentWake = `【天机急讯】天地唯一【造化轮回盘】竟被 ${npc.name} 抢先夺走！`;
        }
      }
    });

    // 若轮回盘在某 NPC 手中，实时同步其最新游历坐标
    if (G.worldRelic && G.worldRelic.holder === 'npc') {
      const holderNpc = (G.simNpcs || []).find(n => n.id === G.worldRelic.npcId && n.alive);
      if (holderNpc) G.worldRelic.loc = holderNpc.loc;
    }

    // 5) 低概率生成已结交道友的【万里飞剑传书】秘境求援/机缘共探
    if (Math.random() < 0.06) {
      const bondedIds = Object.keys(G.allies || {}).filter(k => G.allies[k].unlocked && G.allies[k].bond >= 40);
      if (bondedIds.length) {
        const aid = bondedIds[Math.floor(Math.random() * bondedIds.length)];
        const adef = D.ALLY_DEFS[aid];
        const targetLoc = locs[Math.floor(Math.random() * Math.min(8, locs.length))];
        if (adef && targetLoc) {
          pushLetter(G, `【飞剑传书】${adef.name}来讯`, `“道友亲启：我近日在【${targetLoc.name}】探寻古修遗泽时偶遇强敌禁制，若道友顺路可来一叙共分机缘。”`, targetLoc.id, 120);
          if (!urgentWake) urgentWake = `收到故人【${adef.name}】发来的万里飞剑传书！`;
        }
      }
    }

    return urgentWake;
  }

  // ===== 季度九大势力地缘争端、兽潮封海与物价潮汐 =====
  function runQuarterlyFactionPulse(ctx) {
    const { G } = ctx;
    const r = Math.random();
    if (r < 0.22 || G.seaHostility >= 40) {
      G.seaHostility = Math.max(0, G.seaHostility - 25);
      G.worldState.seaBlockadeUntilDay = G.totalDays + 90;
      G.worldState.priceMul = 1.45;
      G.worldState.warDesc = '【沧溟兽潮】海族龙庭掀起滔天兽潮围困近海，跨洋巨舰停航三月，丹药海珍涨价 45%！';
      pushNews(G, '兽潮', G.worldState.warDesc);
    } else if (r < 0.45) {
      G.worldState.priceMul = 1.25;
      G.worldState.warRegion = 'south';
      G.worldState.warDesc = '【南荒烽火】祝融古巫殿与大乾仙朝镇南军因赤炎火脉归属爆发激战！';
      pushNews(G, '争端', G.worldState.warDesc);
    } else if (r < 0.68) {
      G.worldState.priceMul = 0.88;
      G.worldState.warRegion = null;
      G.worldState.warDesc = '【丹鼎开炉】隐世丹鼎神谷三年一度开谷济世，五洲灵丹市价回落一成！';
      pushNews(G, '盛事', G.worldState.warDesc);
    } else {
      G.worldState.priceMul = 1.0;
      G.worldState.warRegion = 'north';
      G.worldState.warDesc = '【正魔对峙】九幽深渊魔气暴涨，钧天仙盟与凛冬剑冢联手布下北冥封魔线。';
      pushNews(G, '风云', G.worldState.warDesc);
    }
  }

  // ===== 跨洲跨海真实行路弹窗（计算里数、天数、海陆准入、跨海船票与古传送阵！）=====
  function openTravelModal(ctx, targetLocId, onArrive) {
    const { G, D, ASSETS, setDialogue, getEquipStats, startBattle, gainExp, addItem, showToast, saveGame, renderAll } = ctx;
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

    // 判定自行飞渡海域门槛
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

    // 方式 1：自行赶路 / 御空横渡
    if (canSelfFly) {
      choices.push({
        text: `自行赶路前往【${toLoc.name}】（预计耗时：${dispDays}）`,
        hint: `${speedLi}里/日`,
        action: () => {
          setDialogue(null);
          const res = advanceDays(ctx, rawFlightDays, { seclusion: false });
          G.loc = toLoc.id;
          // 远途跋涉(>=8日)概率触发山海旅途奇遇！
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

    // 方式 2：万宝商盟跨洋巨舰（两地含港口或近外海岛屿，且未封海）
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

    // 方式 3：仙盟跨洲古传送大阵（目标或起点设有传送阵，或中洲/东洲互通）
    if (toLoc.hasTeleport) {
      const halfOff = (G.factionRep.juntian >= 40 || G.factionRep.daqian >= 40 || G.sect === '青云剑宗');
      const tpFee = Math.max(120, Math.round((distLi / 180) * (halfOff ? 0.55 : 1.0)));
      choices.push({
        text: `借用跨洲古传送阵瞬移至【${toLoc.name}】（耗 1 日）`,
        hint: `${tpFee} 灵石${halfOff ? '(仙盟/皇朝优待)' : ''}`,
        action: () => {
          if (G.stone < tpFee) return showToast(`启动古传送阵需 ${tpFee} 枚上品灵石折算资费。`);
          // 高业煞魔修入仙盟/皇都传送阵会被盘查！
          if ((G.karma || 0) >= 50 && (toLoc.id === 'central_capital' || toLoc.id === 'central_city')) {
            return showToast('你周身魔道【业煞】过重，钧天护城大阵拒绝为你开启传送！');
          }
          G.stone -= tpFee;
          setDialogue(null);
          advanceDays(ctx, 1, { seclusion: false });
          G.loc = toLoc.id;
          onArrive(toLoc.id);
          SFX.play('levelup');
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

  // ===== 弹性闭关弹窗（10日 / 1月 / 3月 / 1年 / 3年深度闭关 + 智能唤醒）=====
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
      text: `当前为 ${formatDate(G)}，寿元 ${G.age}/${G.maxAge} 岁。闭关期间沧溟界万宗与诸位修士将同步演化，若遇寿元大限或重大传书将自动唤醒。`,
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
    openTravelModal,
    openSeclusionModal
  };
})();
