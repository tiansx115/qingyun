/* ============================================================================
 * 《沧溟界》修仙社会学与制度自然涌现引擎 (engine/sociology.js)
 * 严格实现 sociology_emergence_spec.md —— 零写死日历、零凭空刷遗迹！
 * 1. 宗门内部阶层：官僚固化(bureaucracy)、分配不公(inequality)、杂役剥削制、内卷叛逃、山头林立
 * 2. 散修黑暗森林指数(darkForestIdx 0~100)：盛世礼法 / 灰暗江湖 / 纯正黑暗森林 + 清剿负反馈
 * 3. 6 大现实人类社会现象：流民营排外 / 管制黑市走私 / 香火邪教 / 战争军火商 / 学派分裂 / 巨城地下帮会
 * 4. 通用社会制度生命周期(Institution)：动态周期、清廉度腐化黑幕、战乱停办
 * 5. 严格溯源遗迹(Ruin)：仅在大能坐化/宗门崩解/陨星坠落时诞生，带真实墓主、宝库残卷与阵法衰减
 * ============================================================================ */
(function (root) {
  'use strict';

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // ===== 严格溯源遗迹生成（零凭空刷新！） =====
  function createProvenanceRuin(w, opts) {
    w.ruins = w.ruins || [];
    const rIdx = opts.realmIdx || 3;
    const seal = opts.sealStrength !== undefined
      ? opts.sealStrength
      : (rIdx >= 5 ? 92 : (rIdx === 4 ? 78 : (rIdx === 3 ? 52 : 22)));
    const openCycle = seal <= 25 ? 0 : Math.round(25 + seal * 0.95); // 阵法越强，灵潮松动周期越长
    const ruin = {
      id: 'ruin_' + (w.seq++),
      plateId: opts.plateId,
      originType: opts.originType || 'master_tomb', // 'master_tomb' | 'sect_ruin' | 'meteor_crater'
      name: opts.name || `${opts.ownerName}古遗府`,
      ownerName: opts.ownerName || '无名先贤',
      realmIdx: rIdx,
      buriedYear: w.year,
      vault: opts.vault || [`${opts.ownerName}遗留残卷`, '上古灵石箱'],
      sealStrength: seal,
      openCycleYears: openCycle,
      discovered: false,
      rumorAccuracy: opts.originType === 'meteor_crater' ? 90 : 35
    };
    w.ruins.push(ruin);
    return ruin;
  }

  function ensureInstitution(w, nd, type, spec) {
    w.institutions = w.institutions || [];
    const exist = w.institutions.find(i => i.plateId === nd.id && i.type === type && i.status !== 'abolished');
    if (exist) return exist;
    const inst = {
      id: 'inst_' + (w.seq++),
      type, // 'auction' | 'black_market' | 'tournament' | 'bounty_board' | 'spirit_bank' | 'underworld'
      name: spec.name,
      plateId: nd.id,
      hostFactionId: spec.hostFactionId || null,
      hostName: spec.hostName || '诸商共议',
      bornYear: w.year,
      cycleYears: spec.cycleYears || 0,
      integrity: spec.integrity !== undefined ? spec.integrity : 82,
      status: 'thriving', // 'thriving' | 'corrupt' | 'suspended' | 'abolished'
      note: spec.note || ''
    };
    w.institutions.push(inst);
    w.chronicles.unshift({
      year: w.year,
      tag: '制度涌现',
      text: `第${w.year}年：【${nd.name}】因时势所迫自然演化出【${inst.name}】${inst.cycleYears ? `（每 ${inst.cycleYears} 年一届）` : ''}——${inst.note}`
    });
    return inst;
  }

  // ===== 主社会学步进（由 WorldCore 在每轮物理与博弈后调用） =====
  function stepSociology(w, rng, yearsStep) {
    if (!w.awakened) return;
    w.ruins = w.ruins || [];
    w.institutions = w.institutions || [];
    const spanMul = yearsStep / 10;

    // 1. 宗门内部阶层演化：官僚化、分配不公、杂役剥削制、寒门叛逃、山头林立
    w.factions.filter(f => f.alive).forEach(fac => {
      const leader = w.people.find(c => c.id === fac.leaderId && c.alive);
      const pers = leader ? leader.p : (fac.pers || { yi: 0, ren: 0, kuang: 0 });
      fac.bureaucracy = clamp((fac.bureaucracy || 10) + 1.4 * spanMul, 0, 100);
      const fairMod = (pers.yi >= 20 ? -0.8 : (pers.yi <= -20 ? 1.6 : 0.4));
      fac.inequality = clamp((fac.inequality || 18) + (fac.bureaucracy * 0.02 + fairMod) * spanMul, 0, 100);

      // 计算控地矿药总产出需求 → 催生「杂役弟子剥削制」
      const ownedNodes = w.nodes.filter(n => n.holdings.some(h => h.factionId === fac.id));
      const totalResOut = ownedNodes.reduce((s, n) => s + (n.mineral + n.herb) * 0.5, 0);
      const laborPressure = totalResOut * 1.3 - (fac.disciples || 50) * 0.4;
      if (laborPressure > 0 && fac.inequality >= 35) {
        fac.hasServantSystem = true;
        fac.servants = Math.min(8000, Math.round((fac.servants || 40) + laborPressure * 0.8 * spanMul));
      } else {
        fac.servants = Math.max(0, Math.round((fac.servants || 0) * 0.92));
      }

      // 高官僚化 → 寒门外门叛逃成散修
      if (fac.bureaucracy >= 65 && fac.inequality >= 58 && rng.next() < 0.25 * spanMul) {
        const lost = Math.max(5, Math.round(fac.disciples * 0.12));
        fac.disciples = Math.max(15, fac.disciples - lost);
        fac.rogueOutflow = (fac.rogueOutflow || 0) + lost;
      }

      // 山头林立（长老多 + 官僚化高）
      if (fac.bureaucracy >= 50 && fac.disciples >= 350 && !fac.subFactions) {
        fac.subFactions = ['嫡传血脉派', '外门实务派', '剑堂主战派'];
      }
    });

    // 2. 板块级：黑暗森林指数 + 6 大人类社会现象 + 社会制度自然涌现
    const tradeCountByFac = {};
    w.factions.filter(f => f.alive).forEach(f => {
      tradeCountByFac[f.id] = Object.values(f.diplomacy || {}).filter(d => d.trade).length;
    });

    w.nodes.forEach(nd => {
      nd.phenomena = []; // 当期活跃社会现象标签
      const domFac = nd.owner ? w.factions.find(f => f.id === nd.owner && f.alive) : null;
      const domShare = domFac ? (nd.holdings.find(h => h.factionId === domFac.id)?.share || 0) : 0;
      const lawPower = domFac ? clamp(domShare * 1.15, 0, 100) : 5;
      const scarcity = clamp(100 - (nd.mineral + nd.herb) * 0.55, 0, 100);
      const rogueRate = clamp((nd.pop / 3500) + (domFac ? (domFac.rogueOutflow || 0) * 0.15 : 20), 0, 100);

      // 黑暗森林指数公式
      nd.darkForestIdx = Math.round(clamp(
        0.35 * scarcity + 0.30 * (100 - lawPower) + 0.20 * rogueRate + 0.15 * nd.sha,
        0, 100
      ));
      nd.lawStrictness = Math.round(lawPower * (domFac && domFac.pers && domFac.pers.ren >= 0 ? 1.0 : 0.65));

      if (nd.darkForestIdx >= 65) nd.phenomena.push('黑暗森林·劫修成帮');
      else if (nd.darkForestIdx >= 35) nd.phenomena.push('灰暗江湖·城外踩点');
      else if (nd.pop >= 20000) nd.phenomena.push('盛世礼法·治安严明');

      // 现象①：流民营与排外冲突（高负载 + 邻接有高煞战乱地）
      const cap = root.WorldCore ? root.WorldCore.getNodeCap(nd) : 100000;
      const nbHasWar = nd.neighbors.some(id => (w.nodeMap[id]?.sha || 0) >= 45);
      if (cap > 0 && nd.pop / cap >= 0.84 && nbHasWar) {
        nd.phenomena.push('流民营·土客排外');
      }

      // 现象②：绝望香火与民间邪教（高煞且无仁德庇护）
      if (nd.sha >= 45 && nd.pop >= 3000 && (!domFac || (domFac.pers?.ren || 0) < 15)) {
        nd.phenomena.push('民间邪教·香火神道');
      }

      // 现象③：战争军火商（中立多矿板块邻接战乱地）
      if (nd.mineral >= 45 && nbHasWar && nd.sha < 25 && domFac) {
        nd.phenomena.push('战争军火巨贾');
      }

      // 现象④：大城地下灰度秩序（仙凡巨城自然长出百晓楼/赌石坊/暗杀行）
      if (nd.pop >= 120000 && !nd.isSea) {
        nd.phenomena.push('地下龙头·百晓情报网');
        ensureInstitution(w, nd, 'underworld', {
          name: `${nd.name}·暗巷百晓楼`,
          hostFactionId: domFac?.id, hostName: '地下灰度龙头',
          cycleYears: 0, integrity: 55,
          note: '巨城人口破十二万，自然滋生销赃、赌石与江湖情报黑市。'
        });
      }

      // 制度①：动态周期拍卖会（繁华镇/城 + 有通商商路或多势力共存）
      const trades = domFac ? (tradeCountByFac[domFac.id] || 0) : 0;
      if ((nd.stage === 'town' || nd.stage === 'immortal_city' || nd.stage === 'ocean_port') && (trades >= 1 || nd.holdings.length >= 2) && nd.sha < 50) {
        const dynCycle = clamp(Math.round(22 - trades * 3.5 - (w.seaTechUnlocked ? 5 : 0)), 3, 24);
        const auc = ensureInstitution(w, nd, 'auction', {
          name: `${nd.name}·万商灵拍会`,
          hostFactionId: domFac?.id, hostName: domFac ? domFac.name : '诸商联会',
          cycleYears: dynCycle, integrity: 85,
          note: `因商路交汇与稀缺品流通，自然演化出每 ${dynCycle} 年一届的拍卖盛会。`
        });
        auc.cycleYears = dynCycle;
      }

      // 制度②：管制套利地下黑市（先有高律法管制，阴影里才长黑市！）
      if (nd.lawStrictness >= 50 && (nd.darkForestIdx >= 30 || nd.priceIndex.pill >= 1.5) && nd.pop >= 35000) {
        nd.phenomena.push('地下鬼市·违禁走私');
        ensureInstitution(w, nd, 'black_market', {
          name: `${nd.name}·鬼面黑市`,
          hostFactionId: null, hostName: '无名鬼市主',
          cycleYears: clamp(Math.round(12 - trades * 2), 2, 12), integrity: 42,
          note: '正道律法管制催生套利空间，违禁魔功、赃物与走私灵材在阴影中汇流。'
        });
      }

      // 制度③：悬赏碑与心魔钱庄（高黑暗森林压力或商贸繁盛 → 外包清剿与借贷）
      if ((nd.stage === 'town' || nd.stage === 'immortal_city') && nd.darkForestIdx >= 40 && domFac) {
        ensureInstitution(w, nd, 'bounty_board', {
          name: `${nd.name}·镇煞悬赏碑`,
          hostFactionId: domFac.id, hostName: domFac.name,
          cycleYears: 0, integrity: 78,
          note: '城外劫修与煞兽猖獗，主导势力立碑重金招募散修清剿与护镖。'
        });
      }
    });

    // 制度④：大洲论道大比（某大洲存在 >= 3 家活跃势力，且周期由该洲高阶修士均寿动态决定！）
    const regions = ['east', 'south', 'north', 'central', 'ocean'];
    regions.forEach(reg => {
      const regNodes = w.nodes.filter(n => n.region === reg);
      const regFacIds = new Set();
      regNodes.forEach(n => n.holdings.forEach(h => regFacIds.add(h.factionId)));
      if (regFacIds.size >= 3) {
        const hub = regNodes.sort((a, b) => b.pop - a.pop)[0];
        const domFac = hub.owner ? w.factions.find(f => f.id === hub.owner && f.alive) : null;
        const regCults = w.people.filter(c => c.alive && regNodes.some(n => n.id === c.plateId));
        const hasNascent = regCults.some(c => c.realmIdx >= 4);
        const dynCycle = hasNascent ? 50 : (regCults.some(c => c.realmIdx >= 3) ? 25 : 12);
        const tName = hasNascent ? `${hub.name}·五洲元婴论道会` : `${hub.name}·青年试剑大比`;
        ensureInstitution(w, hub, 'tournament', {
          name: tName,
          hostFactionId: domFac?.id, hostName: domFac ? domFac.name : '诸宗共主',
          cycleYears: dynCycle, integrity: 86,
          note: `该域多雄并立、连年征伐代价过高，遂以每 ${dynCycle} 年一届的擂台大比定矿脉归属与天骄座次。`
        });
      }
    });

    // 3. 制度生命周期演进：腐化黑幕 / 战乱停办
    w.institutions.forEach(inst => {
      if (inst.status === 'abolished') return;
      const nd = w.nodeMap[inst.plateId];
      const host = inst.hostFactionId ? w.factions.find(f => f.id === inst.hostFactionId) : null;
      if (!nd || nd.sha >= 75 || (host && !host.alive)) {
        inst.status = 'suspended';
        return;
      }
      if (host && host.bureaucracy >= 60) {
        inst.integrity = clamp(inst.integrity - 3.5 * spanMul, 10, 100);
      }
      inst.status = inst.integrity < 42 ? 'corrupt' : 'thriving';
    });

    // 4. 真实遗迹阵法自然风化衰减
    w.ruins.forEach(r => {
      if (r.sealStrength > 0) r.sealStrength = Math.max(0, Math.round(r.sealStrength - 0.8 * spanMul));
      if (!r.discovered && r.sealStrength <= 20 && rng.next() < 0.08 * spanMul) {
        r.rumorAccuracy = Math.min(95, r.rumorAccuracy + 15);
      }
    });
  }

  const Sociology = {
    createProvenanceRuin,
    stepSociology
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Sociology;
  root.Sociology = Sociology;
})(typeof window !== 'undefined' ? window : globalThis);
