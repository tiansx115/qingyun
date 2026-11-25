/* ============================================================================
 * 《沧溟界》三层同源混合世界引擎内核 (engine/world_core.js)
 * 零 DOM 耦合 · 创世 1200 年与主游戏游玩期共用同一套物理与多主体博弈内核
 * Layer 1: 5池能量绝对守恒 + 多势力影响力槽位(Holdings) + 3条守恒空间流(难民/商路/煞气)
 * Layer 2: 多主体自主博弈(基于局部视野 + 库存战力 + 8维人格 + 外交矩阵) + 黑天鹅异数
 * Layer 3: DeepSeek 创造性升华接口 + 实验室 v7.4 JSON 无缝导入器
 * ============================================================================ */
(function (root) {
  'use strict';

  const LEY_ENERGY_UNIT = 8.2;
  const TOTAL_ENERGY = 20000;

  const REALMS = [
    { idx: 0, name: '凡人', maxAge: 75,   lockE: 0,    power: 1 },
    { idx: 1, name: '炼气', maxAge: 100,  lockE: 3,    power: 8 },
    { idx: 2, name: '筑基', maxAge: 160,  lockE: 12,   power: 35 },
    { idx: 3, name: '金丹', maxAge: 280,  lockE: 45,   power: 140 },
    { idx: 4, name: '元婴', maxAge: 450,  lockE: 150,  power: 520 },
    { idx: 5, name: '化神', maxAge: 720,  lockE: 420,  power: 1600 },
    { idx: 6, name: '合道', maxAge: 1150, lockE: 1100, power: 4500 }
  ];

  // 24 块真·零起点自然板块（含 3 处陆路战略咽喉：E1↔C3 / S1↔C4 / N4↔C1；彼岸孤岛 Y1/Y2 隔极渊 O6）
  const RAW_PLATES = [
    ['E1','东陆·山地①','east','温润','wood',52,6000,false,['E2','E3','C3']],
    ['E2','东陆·河谷②','east','温润','wood',86,18000,false,['E1','E3','E4']],
    ['E3','东陆·密林③','east','温润','wood',38,2000,false,['E1','E2','E4']],
    ['E4','东陆·海岸④','east','温润','wood',74,16000,false,['E2','E3','O1']],

    ['S1','南陆·暖谷①','south','湿热','fire',68,8000,false,['S2','S3','C4']],
    ['S2','南陆·火山②','south','炽热','fire',18,1200,false,['S1','S3','S4']],
    ['S3','南陆·沃野③','south','湿热','earth',84,20000,false,['S1','S2','S4']],
    ['S4','南陆·南湾④','south','湿热','fire',66,15000,false,['S2','S3','O2']],

    ['N1','北陆·雪峰①','north','极寒','ice',16,1500,false,['N2','N3']],
    ['N2','北陆·冻原②','north','极寒','ice',24,3000,false,['N1','N3','N4']],
    ['N3','北陆·冰渊③','north','极寒','ice',12,800,false,['N1','N2','N4']],
    ['N4','北陆·寒原④','north','苦寒','ice',46,12000,false,['N2','N3','C1','O3']],

    ['C1','中陆·大平原①','central','温润','earth',92,42000,false,['C2','C3','C4','N4']],
    ['C2','中陆·河网②','central','温润','earth',88,36000,false,['C1','C3','C4']],
    ['C3','中陆·高岭③','central','温润','earth',52,9000,false,['C1','C2','C4','E1']],
    ['C4','中陆·矿丘④','central','干冷','earth',42,11000,false,['C1','C2','C3','S1','O1']],

    ['O1','沧溟·东浅海①','ocean','海风','ocean',48,8000,true,['E4','C4','O2','O4']],
    ['O2','沧溟·南暖海②','ocean','暖海','ocean',42,6000,true,['S4','O1','O5']],
    ['O3','沧溟·北寒海③','ocean','寒海','ocean',22,2000,true,['N4','O4','O5']],
    ['O4','沧溟·外海礁④','ocean','暴海','ocean',10,0,true,['O1','O3','O5','O6']],
    ['O5','沧溟·深海沟⑤','ocean','深海','ocean',4,0,true,['O2','O3','O4','O6']],
    ['O6','沧溟·极深渊⑥','ocean','极渊','ocean',2,0,true,['O4','O5','Y1']],

    ['Y1','彼岸·孤岛林①','yingzhou','温润','wood',70,3000,false,['O6','Y2']],
    ['Y2','彼岸·孤岛峰②','yingzhou','雷暴','earth',14,0,false,['Y1']]
  ];

  const SURNAMES = ['苏','叶','顾','裴','崔','卢','姬','萧','宁','楚','洛','沈','温','燕','谢','秦','林','姜','韩','陆'];
  const GIVEN_A = ['玄','清','云','寒','星','长','无','千','苍','惊','忘','明','孤','流','断','焚','归','太','紫','青'];
  const GIVEN_B = ['尘','歌','霜','舟','渊','河','涯','鸿','月','风','雪','鹤','松','竹','澜','冥','霄','离','微','玉'];

  const GEO_NAMING = {
    fire:  [['赤炎','焚天','地火','丹鼎','玄火','离明'], ['丹谷','火宗','炼体殿','赤霄宫']],
    ice:   [['凛冬','玄冰','北冥','寒霜','飞雪','太阴'], ['剑冢','寒宫','冰渊阁','雪原宗']],
    wood:  [['玄木','青冥','百草','苍梧','云梦','灵河'], ['剑宗','药阁','道门','青莲宗']],
    earth: [['玄黄','钧天','镇岳','太初','玉虚','天枢'], ['圣宗','道庭','剑阁','仙门']],
    ocean: [['沧溟','深渊','定海','东海','覆海','鲸澜'], ['妖国','龙庭','水府','沧海盟']],
    sha:   [['九幽','血煞','黄泉','森罗','冥渊','天魔'], ['魔宫','鬼宗','圣教','冥殿']]
  };

  function makeRng(seed) {
    let a = (Number(seed) || 88469) >>> 0;
    return {
      next() {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      },
      int(lo, hi) { return lo + Math.floor(this.next() * (hi - lo + 1)); },
      pick(arr) { return arr[Math.floor(this.next() * arr.length)]; },
      state() { return a >>> 0; }
    };
  }

  function genPersonality(rng) {
    const r = () => rng.int(-85, 85);
    return { yi: r(), kuang: r(), ren: r(), chi: r(), ao: r(), dao: r(), cheng: r(), pan: r() };
  }

  function describePers(p) {
    return [
      p.yi >= 25 ? '重义' : (p.yi <= -25 ? '功利' : '中庸'),
      p.kuang >= 25 ? '狂进' : (p.kuang <= -25 ? '苟道' : '稳健'),
      p.ren >= 25 ? '仁慈' : (p.ren <= -25 ? '狠辣' : '冷峻'),
      p.ao >= 25 ? '刚烈' : (p.ao <= -25 ? '隐忍' : '沉静'),
      p.cheng >= 25 ? '赤诚' : (p.cheng <= -25 ? '多疑' : '审慎')
    ].join('·');
  }

  function getNodeCap(nd) {
    if (nd.isSea && nd.arable < 15) return 0;
    const mul = nd.stage === 'immortal_city' ? 2.4 : (nd.stage === 'town' ? 1.35 : 1.0);
    return Math.max(5000, Math.round((nd.arable / 100) * 190000 * mul));
  }

  function calcConservation(w) {
    const locked = w.people.filter(c => c.alive).reduce((s, c) => s + (REALMS[c.realmIdx]?.lockE || 0), 0);
    const shaE = Math.round(w.nodes.reduce((s, n) => s + n.sha, 0) * 3.5);
    const surf = Math.round(w.nodes.reduce((s, n) => s + n.leyline, 0) * LEY_ENERGY_UNIT);
    const core = Math.max(0, Math.min(TOTAL_ENERGY, w.coreEnergy));
    const ambient = Math.max(0, TOTAL_ENERGY - core - surf - locked - shaE);
    return { total: TOTAL_ENERGY, core, ambient, surf, locked, shaE };
  }

  // 获取板块主导势力（持股最高者，支持多势力共存！）
  function getDominantFactionId(nd) {
    if (!nd.holdings || !nd.holdings.length) return null;
    let best = nd.holdings[0];
    for (let i = 1; i < nd.holdings.length; i++) {
      if (nd.holdings[i].share > best.share) best = nd.holdings[i];
    }
    return best.share >= 20 ? best.factionId : null;
  }

  function adjustHolding(nd, factionId, delta) {
    nd.holdings = nd.holdings || [];
    let h = nd.holdings.find(x => x.factionId === factionId);
    if (!h && delta > 0) {
      h = { factionId, share: 0 };
      nd.holdings.push(h);
    }
    if (!h) return;
    h.share = Math.max(0, Math.min(100, h.share + delta));
    nd.holdings = nd.holdings.filter(x => x.share >= 5);
    // 归一化总份额 <= 100
    const sum = nd.holdings.reduce((s, x) => s + x.share, 0);
    if (sum > 100) {
      const ratio = 100 / sum;
      nd.holdings.forEach(x => { x.share = Math.max(5, Math.floor(x.share * ratio)); });
    }
    nd.owner = getDominantFactionId(nd);
  }

  function createWorld(opts = {}) {
    const seed = Number(opts.seed) || 88469;
    const rng = makeRng(seed);
    const params = Object.assign({
      awakeYear: 51,
      surgePct: 70,
      entryBp: 8,
      consumeLv: 7,
      healLv: 3,
      yaoLv: 7,
      chaosLv: 6
    }, opts.params || {});

    const nodes = RAW_PLATES.map(b => ({
      id: b[0], rawName: b[1], name: b[1], named: false, region: b[2], climate: b[3], elem: b[4],
      leyline: 0, arable: b[5], mineral: 0, herb: 0, sha: 0,
      flora: b[7] ? '普通海藻' : '普通草木', fauna: b[7] ? '普通深海鱼群' : '普通山林野兽',
      pop: b[6], isSea: b[7], neighbors: b[8].slice(),
      stage: b[7] ? 'ocean_raw' : (b[6] > 0 ? 'village' : 'raw_nature'),
      holdings: [], // 多势力共存影响力份额！[{ factionId, share }]
      owner: null,
      priceIndex: { pill: 1.0, mineral: 1.0, grain: 1.0 },
      history: [`第1年：混元无灵原始板块（气候:${b[3]} · 水土${b[5]} · 凡人${b[6].toLocaleString()}）`]
    }));
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

    return {
      version: '8.5-core',
      seed, rngState: rng.state(),
      year: 1, month: 1,
      awakened: false, seaTechUnlocked: false,
      eraName: '第一纪·混元凡尘',
      params,
      totalEnergy: TOTAL_ENERGY, coreEnergy: TOTAL_ENERGY,
      nodes, nodeMap,
      factions: [],
      people: [],
      createdArts: [],
      ruins: [],
      institutions: [],
      chronicles: [{ year: 1, tag: '创世', text: '混元第1年：20,000 单位灵能封存于星核地底，24 块原始地貌无灵无宗门，三大陆路咽喉待争。' }],
      eraSnapshots: [],
      usedNames: [],
      seq: 1
    };
  }

  function genUniqueName(w, rng, elemKey) {
    const used = new Set(w.usedNames);
    const [preL, sufL] = GEO_NAMING[elemKey] || GEO_NAMING.earth;
    for (let i = 0; i < 40; i++) {
      const cand = rng.pick(preL) + rng.pick(sufL);
      if (!used.has(cand)) { w.usedNames.push(cand); return cand; }
    }
    const fallback = rng.pick(preL) + '新宗' + (w.seq++);
    w.usedNames.push(fallback);
    return fallback;
  }

  function genPersonName(rng) {
    return rng.pick(SURNAMES) + rng.pick(GIVEN_A) + (rng.next() < 0.78 ? rng.pick(GIVEN_B) : '');
  }

  function spawnPerson(w, rng, nd, opts = {}) {
    const species = opts.species || (nd.isSea ? '海族' : '人族');
    const rIdx = opts.realmIdx !== undefined ? opts.realmIdx : 1;
    const spMul = (species === '陆妖' || species === '海族') ? 1.6 : (species === '半妖异胎' ? 1.5 : 1.0);
    const p = opts.pers || genPersonality(rng);
    const name = opts.name || genPersonName(rng);
    const c = {
      id: 'p_' + (w.seq++),
      name, species,
      plateId: nd.id,
      factionId: opts.factionId || null,
      realmIdx: rIdx,
      realm: REALMS[rIdx].name,
      age: opts.age !== undefined ? opts.age : rng.int(18, 34),
      maxAge: Math.round(REALMS[rIdx].maxAge * spMul),
      iq: rng.int(45, 96),
      eq: rng.int(40, 92),
      daoWit: rng.int(45, 98),
      p, persLabel: describePers(p),
      memories: [opts.memory || `第${w.year}年：生于【${nd.name}】`],
      alive: true
    };
    w.people.push(c);
    return c;
  }

  function getDip(facA, facBId) {
    facA.diplomacy = facA.diplomacy || {};
    if (!facA.diplomacy[facBId]) {
      facA.diplomacy[facBId] = { stance: 'neutral', trust: 0, trade: false, grudge: 0 };
    }
    return facA.diplomacy[facBId];
  }

  // ===== LAYER 1: 确定性物理与三条守恒空间流 (支持任意时间步长 yearsStep) =====
  function stepWorldPhysics(w, rng, yearsStep, eventsOut) {
    const p = w.params;
    const spanMul = yearsStep / 10; // 基准为 10 年 = 1.0

    // 1. 地核破封自动物理铺灵（75% 落盘至 24 板块）
    if (!w.awakened && w.year >= p.awakeYear) {
      w.awakened = true;
      w.eraName = '第二纪·地核破封万物觉醒';
      const release = Math.min(w.coreEnergy, Math.round(TOTAL_ENERGY * p.surgePct / 100));
      w.coreEnergy -= release;
      const targetTotalLey = (release * 0.75) / LEY_ENERGY_UNIT;
      const weights = w.nodes.map(nd => 0.8 + (nd.arable / 120) + ((nd.elem === 'fire' || nd.elem === 'ice' || nd.id === 'O5' || nd.id === 'O6') ? 0.35 : 0));
      const wSum = weights.reduce((a, b) => a + b, 0);
      w.nodes.forEach((nd, i) => {
        nd.leyline = Math.max(22, Math.min(92, Math.round((weights[i] / wSum) * targetTotalLey)));
        nd.mineral = Math.max(28, Math.min(90, Math.round(nd.leyline * ((nd.elem === 'fire' || nd.elem === 'ice' || nd.elem === 'earth') ? 1.15 : 0.85))));
        nd.herb = nd.isSea && nd.arable < 15 ? Math.round(nd.leyline * 0.45) : Math.max(20, Math.min(90, Math.round(nd.arable * 0.7 + nd.leyline * 0.35)));
        nd.flora = nd.isSea ? '初生海灵藻' : '初生灵草灵木';
        nd.fauna = nd.isSea ? '感灵海兽群' : '感灵山林野兽';
      });
      const msg = `第${w.year}年：星核破封释放 ${release} 单位太古灵能，五洲七海万物感灵！`;
      w.chronicles.unshift({ year: w.year, tag: '灵气复苏', text: msg });
      if (eventsOut) eventsOut.push(msg);
    }

    // 2. 板块人口 Logistic 演化 + 空间流①：难民守恒迁徙流！
    const popTransfers = [];
    w.nodes.forEach(nd => {
      const cap = getNodeCap(nd);
      if (nd.pop > 0 && cap > 0) {
        if (nd.sha >= 55) {
          const flee = Math.round(nd.pop * Math.min(0.35, 0.06 * spanMul));
          const die = Math.round(nd.pop * Math.min(0.20, 0.03 * spanMul));
          nd.pop = Math.max(0, nd.pop - flee - die);
          // 寻找更安全的邻接陆地板块接收难民（总数严格守恒！）
          const safeNbs = nd.neighbors
            .map(id => w.nodeMap[id])
            .filter(nb => nb && !nb.isSea && nb.sha < nd.sha - 10 && getNodeCap(nb) > nb.pop);
          if (safeNbs.length && flee > 0) {
            const dst = rng.pick(safeNbs);
            popTransfers.push({ to: dst, amount: flee });
          }
        } else {
          const load = nd.pop / cap;
          const clim = (nd.climate === '极寒' || nd.climate === '炽热') ? 0.55 : 1.0;
          nd.pop = Math.min(cap, Math.max(0, Math.round(nd.pop * (1 + 0.065 * clim * (1 - load) * spanMul))));
        }
      }
      // 聚落自然升格
      if (!nd.isSea && nd.stage === 'village' && nd.pop >= 45000) nd.stage = 'town';
      if (!nd.isSea && nd.stage === 'town' && nd.pop >= 140000 && nd.arable >= 65) nd.stage = 'immortal_city';
    });
    popTransfers.forEach(t => {
      const cap = getNodeCap(t.to);
      t.to.pop = Math.min(cap, t.to.pop + t.amount);
    });

    if (!w.awakened) return;

    // 3. 空间流②：怨煞邻接外溢 + 自然生态负反馈恢复 + 动态物价指数更新
    const shaBleed = {};
    w.nodes.forEach(nd => {
      // 怨煞外溢：sha >= 65 向邻接板块渗透
      if (nd.sha >= 65) {
        const spill = Math.max(1, Math.round((nd.sha - 60) * 0.06 * spanMul));
        nd.neighbors.forEach(nbId => {
          shaBleed[nbId] = (shaBleed[nbId] || 0) + Math.ceil(spill / nd.neighbors.length);
        });
      }
      // 荒废/低冲突净煞还灵与矿药再生
      const activeShare = nd.holdings.reduce((s, h) => s + h.share, 0);
      if (nd.sha > 0) {
        const healRate = p.healLv * 0.004 * (activeShare === 0 ? 1.5 : 0.8) * spanMul;
        const purified = Math.max(0, Math.round(nd.sha * healRate));
        nd.sha = Math.max(0, nd.sha - purified);
        nd.leyline = Math.min(98, nd.leyline + Math.round(purified * 0.3));
      }
      if (nd.sha < 60) {
        nd.herb = Math.min(95, nd.herb + Math.round(p.healLv * 0.22 * spanMul));
      }
      if (activeShare < 30 || nd.mineral < 15) {
        nd.mineral = Math.min(95, nd.mineral + Math.round((11 - p.consumeLv) * 0.16 * spanMul));
      }
      // 实时计算板块动态物价指数（直接供主游戏市集使用！）
      nd.priceIndex = {
        pill: +(1.0 + (nd.sha / 50) + Math.max(0, (40 - nd.herb) / 40)).toFixed(2),
        mineral: +(1.0 + Math.max(0, (45 - nd.mineral) / 35)).toFixed(2),
        grain: +(1.0 + (nd.sha / 45) + (nd.pop / Math.max(1, getNodeCap(nd)) > 0.85 ? 0.35 : 0)).toFixed(2)
      };
    });
    Object.entries(shaBleed).forEach(([id, delta]) => {
      if (w.nodeMap[id]) w.nodeMap[id].sha = Math.min(98, w.nodeMap[id].sha + delta);
    });

    // 4. 空间流③：势力开采入库 + 跨板块商路贸易流（咽喉断供连锁！）
    const aliveFacs = w.factions.filter(f => f.alive);
    aliveFacs.forEach(fac => {
      let minIn = 0, herbIn = 0, mortalBase = 0;
      w.nodes.forEach(nd => {
        const h = nd.holdings.find(x => x.factionId === fac.id);
        if (!h) return;
        const frac = h.share / 100;
        const mDrain = Math.min(nd.mineral, Math.max(1, Math.round(p.consumeLv * 0.25 * frac * spanMul)));
        const hDrain = Math.min(nd.herb, Math.max(1, Math.round(p.consumeLv * 0.2 * frac * spanMul)));
        nd.mineral = Math.max(0, nd.mineral - mDrain);
        nd.herb = Math.max(0, nd.herb - hDrain);
        minIn += mDrain * 4;
        herbIn += hDrain * 4;
        mortalBase += Math.round(nd.pop * frac);
      });
      // 凡人—修士政治经济供应链：凡人越多，灵根苗子与税收越丰！
      const recruitGain = Math.round((mortalBase / 10000) * (p.entryBp / 10) * spanMul);
      fac.treasury.mineral = Math.min(999, fac.treasury.mineral + minIn - Math.round(fac.disciples * 0.04 * spanMul));
      fac.treasury.herb = Math.min(999, fac.treasury.herb + herbIn - Math.round(fac.disciples * 0.03 * spanMul));
      fac.disciples = Math.max(10, Math.min(5000, fac.disciples + recruitGain - Math.round(fac.disciples * 0.02 * spanMul)));

      // 商路贸易流：与通商盟友按余缺互补流动资源
      Object.entries(fac.diplomacy || {}).forEach(([otherId, dip]) => {
        if (!dip.trade) return;
        const other = aliveFacs.find(x => x.id === otherId);
        if (!other) return;
        if (fac.treasury.mineral > other.treasury.mineral + 30) {
          const flow = 12;
          fac.treasury.mineral -= flow; other.treasury.mineral += flow;
          fac.treasury.stones += flow * 5; other.treasury.stones = Math.max(0, other.treasury.stones - flow * 3);
        }
        if (fac.treasury.herb > other.treasury.herb + 30) {
          const flow = 12;
          fac.treasury.herb -= flow; other.treasury.herb += flow;
          fac.treasury.stones += flow * 5;
        }
      });

      // 枯竭硬崩解检测（库存见底且无矿可采）
      if (fac.treasury.mineral <= 0 && fac.treasury.herb <= 0) {
        fac.treasury.mineral = 0; fac.treasury.herb = 0;
        fac.dryEpochs = (fac.dryEpochs || 0) + spanMul;
        if (fac.dryEpochs >= 6) {
          fac.alive = false; fac.fallen = w.year;
          w.nodes.forEach(nd => {
            const had = nd.holdings.some(x => x.factionId === fac.id);
            if (had) {
              nd.holdings = nd.holdings.filter(x => x.factionId !== fac.id);
              nd.owner = getDominantFactionId(nd);
              if (!nd.owner && nd.stage === 'sect_peak') nd.stage = 'sect_ruin';
            }
          });
          const msg = `第${w.year}年：【${fac.name}】灵矿灵药库藏耗尽、道统崩解，原祖地化作古宗遗址！`;
          w.chronicles.unshift({ year: w.year, tag: '矿竭崩解', text: msg });
          if (root.Sociology) {
            root.Sociology.createProvenanceRuin(w, {
              plateId: fac.homePlate, originType: 'sect_ruin',
              name: `${fac.name}古宗遗址`, ownerName: fac.name, realmIdx: 3,
              vault: [`《${fac.name}镇宗残卷》`, '古宗藏经玉简', '封存灵石库']
            });
          }
          if (eventsOut) eventsOut.push(msg);
        }
      } else {
        fac.dryEpochs = Math.max(0, (fac.dryEpochs || 0) - 0.5);
      }
    });

    // 5. 人物自然老化、修炼破境与坐化更迭
    w.people.forEach(c => {
      if (!c.alive) return;
      c.age += yearsStep;
      const nd = w.nodeMap[c.plateId];
      // 自然破境概率（受灵脉、悟性与时间步长驱动，打破千年全筑基！）
      if (c.realmIdx < 6 && nd && nd.leyline >= 35) {
        const breakProb = (0.045 * (c.daoWit / 75) * (nd.leyline / 55) * spanMul) / Math.pow(1.65, c.realmIdx);
        if (rng.next() < breakProb) {
          c.realmIdx++;
          c.realm = REALMS[c.realmIdx].name;
          const spMul = (c.species === '陆妖' || c.species === '海族') ? 1.6 : (c.species === '半妖异胎' ? 1.5 : 1.0);
          c.maxAge = Math.round(REALMS[c.realmIdx].maxAge * spMul);
          c.memories.push(`第${w.year}年：于【${nd.name}】破境【${c.realm}】！`);
          if (c.realmIdx >= 3) {
            const msg = `第${w.year}年：【${c.name}】于【${nd.name}】渡劫破境，成就【${c.realm}】大能！`;
            w.chronicles.unshift({ year: w.year, tag: '破境', text: msg });
            if (eventsOut) eventsOut.push(msg);
          }
          // 诞生元婴大能解锁大航海！
          if (c.realmIdx >= 4 && !w.seaTechUnlocked && w.year >= p.awakeYear + 120) {
            w.seaTechUnlocked = true;
            w.eraName = '第三纪·元婴御海五洲连通';
            const msg = `第${w.year}年：【大航海解锁】元婴大能【${c.name}】御空横渡沧溟外海，跨洋灵舟航路自此大通！`;
            w.chronicles.unshift({ year: w.year, tag: '大航海', text: msg });
            if (eventsOut) eventsOut.push(msg);
          }
        }
      }
      if (c.age > c.maxAge) {
        c.alive = false;
        c.memories.push(`第${w.year}年：寿元耗尽(${Math.round(c.age)}/${c.maxAge}岁)，坐化于【${nd?.name || c.plateId}】。`);
        // 金丹及以上大能坐化，严格溯源生成未发现古洞府遗迹！
        if (c.realmIdx >= 3 && root.Sociology) {
          root.Sociology.createProvenanceRuin(w, {
            plateId: c.plateId, originType: 'master_tomb',
            name: `${c.name}(${c.realm})古洞府`, ownerName: c.name, realmIdx: c.realmIdx,
            vault: [`《${c.name}毕生道统残篇》`, `${c.realm}本命法宝残器`, '聚灵秘丹']
          });
        }
        // 自动推举同势力在世继任者
        const fac = w.factions.find(f => f.alive && f.leaderId === c.id);
        if (fac) {
          const homeNd = w.nodeMap[fac.homePlate] || nd;
          const succ = spawnPerson(w, rng, homeNd, {
            species: c.species, factionId: fac.id,
            realmIdx: Math.max(1, Math.min(4, c.realmIdx - (rng.next() < 0.45 ? 0 : 1))),
            age: rng.int(26, 55),
            memory: `第${w.year}年：前主【${c.name}】坐化后继任【${fac.name}】掌舵`
          });
          fac.leaderId = succ.id; fac.leader = succ.name; fac.pers = succ.p;
        }
      }
    });

    // 6. 严格 5 池能量守恒归一化校验
    const en = calcConservation(w);
    const maxSurf = Math.max(0, TOTAL_ENERGY - w.coreEnergy - en.locked - en.shaE);
    if (en.surf > maxSurf && en.surf > 0) {
      const ratio = maxSurf / en.surf;
      w.nodes.forEach(n => { n.leyline = Math.floor(n.leyline * ratio); });
    }
  }

  // ===== LAYER 2: 多主体自主博弈层 (每个势力按局部视野 + 8维人格 + 库藏战力独立决策) =====
  function stepFactionAgents(w, rng, yearsStep, eventsOut) {
    if (!w.awakened) return;
    const p = w.params;
    const spanMul = yearsStep / 10;

    // 1. 新势力自然涌现（严守滑块方向：妖海先发 vs 人族宗门大兴！）
    const aliveFacs = w.factions.filter(f => f.alive);
    if (aliveFacs.length < 12 && rng.next() < 0.32 * spanMul) {
      const humanBias = (p.yaoLv <= 4 && p.entryBp >= 15) ? 0.82 : (p.yaoLv >= 7 ? 0.35 : 0.58);
      const isHuman = rng.next() < humanBias;
      const cands = w.nodes.filter(nd => isHuman ? (!nd.isSea && nd.pop >= 5000) : (nd.leyline >= 30 && (nd.isSea || nd.arable < 70)));
      if (cands.length) {
        const home = rng.pick(cands);
        const kind = isHuman ? (rng.next() < 0.65 ? 'sect' : 'clan') : 'yao_court';
        const elemKey = home.sha >= 55 ? 'sha' : home.elem;
        const name = genUniqueName(w, rng, elemKey);
        const leader = spawnPerson(w, rng, home, {
          species: isHuman ? '人族' : (home.isSea ? '海族' : '陆妖'),
          realmIdx: w.year > p.awakeYear + 260 ? 3 : 2,
          memory: `第${w.year}年：于【${home.name}】开山立派，创【${name}】`
        });
        const fac = {
          id: 'f_' + (w.seq++), name, kind, homePlate: home.id, isSeaFac: home.isSea,
          leaderId: leader.id, leader: leader.name, pers: leader.p,
          born: w.year, fallen: null, alive: true,
          treasury: { mineral: 120, herb: 100, stones: 500 },
          disciples: rng.int(80, 260),
          diplomacy: {}, dryEpochs: 0
        };
        leader.factionId = fac.id;
        w.factions.push(fac);
        adjustHolding(home, fac.id, 45);
        if (!home.isSea && home.stage !== 'immortal_city') home.stage = 'sect_peak';
        const msg = `第${w.year}年：【${leader.name}】(${leader.realm}) 于【${home.name}】创立【${name}】(${kind})！`;
        w.chronicles.unshift({ year: w.year, tag: kind === 'yao_court' ? '妖庭' : '开宗', text: msg });
        if (eventsOut) eventsOut.push(msg);
      }
    }

    // 2. 各在世势力基于自身局部视野 + 库藏 + 8 维人格自主行动
    w.factions.filter(f => f.alive).forEach(fac => {
      const leader = w.people.find(c => c.id === fac.leaderId && c.alive);
      const pers = leader ? leader.p : fac.pers;
      const myPower = fac.disciples * 0.8 + (leader ? REALMS[leader.realmIdx].power : 20) + fac.treasury.mineral * 0.4;
      fac.power = Math.round(myPower);

      // 找出自己拥有影响力的所有板块及邻接板块
      const myNodes = w.nodes.filter(nd => nd.holdings.some(h => h.factionId === fac.id));
      if (!myNodes.length) return;
      const home = myNodes[0];
      const reachable = new Set();
      myNodes.forEach(nd => nd.neighbors.forEach(nbId => {
        const nb = w.nodeMap[nbId];
        if (!nb) return;
        // 陆海隔离红线（大航海前严禁借海偷渡！）
        if (!w.seaTechUnlocked) {
          if (!fac.isSeaFac && nb.isSea) return;
          if (fac.isSeaFac && !nb.isSea && !nb.neighbors.some(x => w.nodeMap[x]?.isSea)) return;
        }
        reachable.add(nb);
      }));
      const targets = Array.from(reachable);
      if (!targets.length) return;

      // 决策分支 A：血祭孤注一掷（狠辣且缺资源）
      if (pers.ren <= -35 && fac.treasury.mineral < 60 && rng.next() < 0.18 * spanMul) {
        home.sha = Math.min(98, home.sha + 14);
        home.pop = Math.max(0, Math.round(home.pop * 0.85));
        fac.treasury.mineral += 50;
        const msg = `第${w.year}年：【${fac.name}】${fac.leader}狠辣血祭【${home.name}】，煞气骤升至 ${home.sha}，周边正道震怒！`;
        w.chronicles.unshift({ year: w.year, tag: '煞变', text: msg });
        if (eventsOut) eventsOut.push(msg);
        return;
      }

      // 决策分支 B：仁德净煞养民（仁慈型掌舵）
      if (pers.ren >= 25 && (home.sha >= 15 || home.herb < 50) && rng.next() < 0.30 * spanMul) {
        home.sha = Math.max(0, home.sha - 8);
        home.herb = Math.min(95, home.herb + 6);
        return;
      }

      // 决策分支 C：通商结盟（务实/功利且邻接有其他势力）
      if (pers.kuang < 25 && rng.next() < 0.22 * spanMul) {
        const tNd = rng.pick(targets);
        if (tNd.owner && tNd.owner !== fac.id) {
          const other = w.factions.find(f => f.id === tNd.owner && f.alive);
          if (other) {
            const d1 = getDip(fac, other.id), d2 = getDip(other, fac.id);
            if (!d1.trade && d1.grudge < 30) {
              d1.trade = d2.trade = true; d1.trust += 15; d2.trust += 15;
              const msg = `第${w.year}年：【${fac.name}】与【${other.name}】签订通商灵契，矿药沿关隘/海路互通有无！`;
              w.chronicles.unshift({ year: w.year, tag: '通商', text: msg });
              if (eventsOut) eventsOut.push(msg);
              return;
            }
          }
        }
      }

      // 决策分支 D：扩土争咽喉矿脉（狂进或缺矿，客观战力裁定影响力增减！）
      if ((pers.kuang >= 15 || fac.treasury.mineral < 80) && rng.next() < (0.14 + p.chaosLv * 0.025) * spanMul) {
        const tgt = targets.sort((a, b) => b.mineral - a.mineral)[0];
        const defId = tgt.owner && tgt.owner !== fac.id ? tgt.owner : null;
        const defFac = defId ? w.factions.find(f => f.id === defId && f.alive) : null;
        const atkRoll = myPower * (0.8 + rng.next() * 0.45);
        const defRoll = (defFac ? (defFac.power || 120) : 95) * (0.8 + rng.next() * 0.45);
        tgt.sha = Math.min(98, tgt.sha + 7);
        if (atkRoll > defRoll) {
          adjustHolding(tgt, fac.id, 30);
          if (defFac) {
            adjustHolding(tgt, defFac.id, -22);
            const d = getDip(defFac, fac.id);
            d.grudge += 35; d.trade = false;
            getDip(fac, defFac.id).trade = false;
          }
          const msg = `第${w.year}年：【${fac.name}】挥师争夺【${tgt.name}】${defFac ? `，挫败【${defFac.name}】` : ''}，影响力大增！`;
          w.chronicles.unshift({ year: w.year, tag: '邻接征伐', text: msg });
          if (eventsOut) eventsOut.push(msg);
        } else if (defFac) {
          fac.disciples = Math.max(15, Math.round(fac.disciples * 0.88));
          getDip(fac, defFac.id).grudge += 20;
        }
      }
    });

    // 3. 黑天鹅异数骰子（陨星 / 0.5% 混血异胎 / 灵瘟）
    if (rng.next() < 0.08 * (p.chaosLv / 5) * spanMul) {
      const roll = rng.next();
      const land = w.nodes.filter(n => !n.isSea);
      const nd = rng.pick(land);
      if (roll < 0.35) {
        nd.mineral = Math.min(98, nd.mineral + 35);
        nd.sha = Math.min(98, nd.sha + 18);
        nd.pop = Math.round(nd.pop * 0.8);
        const msg = `第${w.year}年：【天外陨星】星辰坠落【${nd.name}】，砸出稀世高纯灵矿(+35)，引发四方觊觎！`;
        w.chronicles.unshift({ year: w.year, tag: '大劫', text: msg });
        if (root.Sociology) {
          root.Sociology.createProvenanceRuin(w, {
            plateId: nd.id, originType: 'meteor_crater',
            name: `${nd.name}天外陨坑`, ownerName: '天外星辰', realmIdx: 4, sealStrength: 38,
            vault: ['太古星核碎片', '稀世陨金灵矿']
          });
        }
        if (eventsOut) eventsOut.push(msg);
      } else if (roll < 0.65) {
        const hyb = spawnPerson(w, rng, nd, {
          species: '半妖异胎', realmIdx: 2,
          memory: `第${w.year}年：0.5%天道彩蛋，于【${nd.name}】诞下人妖混血异胎，悟性通天！`
        });
        hyb.daoWit = Math.min(100, hyb.daoWit + 18);
        const msg = `第${w.year}年：【混血异胎】于【${nd.name}】降生罕见半妖异胎【${hyb.name}】(悟:${hyb.daoWit})，两族震动！`;
        w.chronicles.unshift({ year: w.year, tag: '混血', text: msg });
        if (eventsOut) eventsOut.push(msg);
      } else {
        nd.sha = Math.min(98, nd.sha + 22);
        nd.pop = Math.round(nd.pop * 0.72);
        const msg = `第${w.year}年：【地脉灵瘟】【${nd.name}】突发灵瘟，凡人流离失所，疗伤丹价暴涨！`;
        w.chronicles.unshift({ year: w.year, tag: '大劫', text: msg });
        if (eventsOut) eventsOut.push(msg);
      }
    }
  }

  // ===== 创世模式：高速推进至目标年份（如 1200 年，<20ms） =====
  function runGenesis(w, targetYear = 1200) {
    const rng = makeRng(w.rngState || w.seed);
    while (w.year < targetYear) {
      const step = Math.min(10, targetYear - w.year);
      w.year += step;
      stepWorldPhysics(w, rng, step, null);
      stepFactionAgents(w, rng, step, null);
      if (root.Sociology) root.Sociology.stepSociology(w, rng, step);
      if (w.year % 200 === 1 || w.year === targetYear) {
        w.eraSnapshots.push({
          year: w.year, eraName: w.eraName, seaTechUnlocked: w.seaTechUnlocked,
          pop: w.nodes.reduce((s, n) => s + n.pop, 0),
          aliveFac: w.factions.filter(f => f.alive).map(f => f.name)
        });
      }
    }
    w.rngState = rng.state();
    return w;
  }

  // ===== 游玩模式：同源按月推进（玩家闭关 15 年 = 180 月，返回真实《尘世变迁录》！） =====
  function stepPlayMonths(w, months = 1) {
    const rng = makeRng(w.rngState || w.seed);
    const eventsOut = [];
    const totalMonths = Math.max(1, Math.round(months));
    const prevYear = w.year;
    w.month += totalMonths;
    while (w.month > 12) { w.month -= 12; w.year += 1; }
    const yearsDelta = totalMonths / 12;
    stepWorldPhysics(w, rng, yearsDelta, eventsOut);
    if (yearsDelta >= 0.5 || w.year > prevYear) {
      stepFactionAgents(w, rng, yearsDelta, eventsOut);
      if (root.Sociology) root.Sociology.stepSociology(w, rng, yearsDelta);
    }
    w.rngState = rng.state();
    return { year: w.year, month: w.month, worldEvents: eventsOut };
  }

  // ===== LAYER 3: 无缝导入实验室 v7.4 导出的世界 JSON =====
  function importLabWorldJson(lab) {
    if (!lab || !Array.isArray(lab.nodes)) throw new Error('无效的实验室世界 JSON 格式');
    const w = createWorld({ seed: lab.seed || 88469, params: lab.params || {} });
    w.year = lab.year || 1200;
    w.awakened = !!lab.awakened;
    w.seaTechUnlocked = !!lab.seaTechUnlocked;
    w.eraName = lab.eraName || '第二纪·沧溟乱世';
    w.coreEnergy = lab.coreEnergy !== undefined ? lab.coreEnergy : 6000;
    w.createdArts = Array.isArray(lab.createdArts) ? lab.createdArts.slice() : [];
    w.chronicles = Array.isArray(lab.chronicles) ? lab.chronicles.slice() : [];
    w.eraSnapshots = Array.isArray(lab.eraSnapshots) ? lab.eraSnapshots.slice() : [];

    // 导入势力并补全真实账本（库藏、弟子、外交）
    const facByName = {};
    (lab.factions || []).forEach(lf => {
      const f = {
        id: 'f_' + (w.seq++), name: lf.name, kind: lf.kind || 'sect',
        homePlate: lf.homePlate || 'C1', isSeaFac: false,
        leaderId: null, leader: lf.leader || '无名掌舵',
        pers: genPersonality(makeRng(w.seq * 97)),
        born: lf.born || 100, fallen: lf.fallen || null, alive: !!lf.alive,
        treasury: { mineral: 150, herb: 140, stones: 800 },
        disciples: lf.alive ? 320 : 0, diplomacy: {}, dryEpochs: 0
      };
      w.factions.push(f);
      facByName[f.name] = f;
    });

    // 导入 24 板块并转化为多势力 Holdings 结构
    lab.nodes.forEach(ln => {
      const nd = w.nodeMap[ln.id];
      if (!nd) return;
      Object.assign(nd, {
        name: ln.name, named: !!ln.named, leyline: ln.leyline || 0,
        mineral: ln.mineral || 0, herb: ln.herb || 0, sha: ln.sha || 0,
        flora: ln.flora || nd.flora, fauna: ln.fauna || nd.fauna,
        pop: ln.pop || 0, stage: ln.stage || nd.stage,
        history: Array.isArray(ln.history) ? ln.history.slice() : nd.history
      });
      nd.holdings = [];
      if (ln.owner && facByName[ln.owner] && facByName[ln.owner].alive) {
        adjustHolding(nd, facByName[ln.owner].id, 70);
      }
      nd.priceIndex = {
        pill: +(1.0 + (nd.sha / 50) + Math.max(0, (40 - nd.herb) / 40)).toFixed(2),
        mineral: +(1.0 + Math.max(0, (45 - nd.mineral) / 35)).toFixed(2),
        grain: +(1.0 + (nd.sha / 45)).toFixed(2)
      };
    });

    // 导入关键人物
    const rMap = Object.fromEntries(REALMS.map(r => [r.name, r.idx]));
    (lab.people || []).forEach(lp => {
      const rIdx = rMap[lp.realm] !== undefined ? rMap[lp.realm] : 2;
      const fac = facByName[lp.faction];
      const pObj = {
        id: 'p_' + (w.seq++), name: lp.name, species: lp.species || '人族',
        plateId: lp.plateId || 'C1', factionId: fac ? fac.id : null,
        realmIdx: rIdx, realm: REALMS[rIdx].name,
        age: lp.age || 60, maxAge: lp.maxAge || REALMS[rIdx].maxAge,
        iq: lp.iq || 75, eq: lp.eq || 70, daoWit: lp.daoWit || 75,
        p: genPersonality(makeRng(w.seq * 131)), persLabel: lp.persLabel || '审慎·稳健',
        memories: Array.isArray(lp.memories) ? lp.memories.slice() : [],
        alive: !!lp.alive
      };
      w.people.push(pObj);
      if (fac && fac.leader === pObj.name) fac.leaderId = pObj.id;
    });

    return w;
  }

  const WorldCore = {
    REALMS, RAW_PLATES,
    createWorld, runGenesis, stepPlayMonths,
    stepWorldPhysics, stepFactionAgents,
    calcConservation, getNodeCap, adjustHolding,
    describePers, importLabWorldJson
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = WorldCore;
  root.WorldCore = WorldCore;
})(typeof window !== 'undefined' ? window : globalThis);
