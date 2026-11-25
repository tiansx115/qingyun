// ===== v8.4.0 沧溟界 · 正向三百年创世推演 & 百年山河/势力/秘宝动力学引擎 =====
// 核心理念：从沧溟第1年正向推演300年至第301年玩家降生，且玩家入世后的百年演化复用完全相同的底层规则！
// 杜绝倒推假历史与设定冲突：每一座古宗遗址、每一件绝世秘宝、每一段宗门血仇，皆有真实可查的编年史来源！

window.GENESIS = (function () {
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  const SURNAMES = ['苏', '叶', '顾', '裴', '崔', '卢', '姬', '萧', '宁', '楚', '洛', '沈', '温', '燕', '钟离', '司空', '澹台', '独孤', '公孙', '慕容', '敖'];
  const NAMES_A  = ['玄', '清', '云', '寒', '星', '长', '无', '千', '苍', '惊', '忘', '明', '孤', '流', '断', '焚', '归', '太', '紫'];
  const NAMES_B  = ['尘', '歌', '霜', '舟', '渊', '河', '涯', '鸿', '月', '风', '雪', '鹤', '松', '竹', '澜', '冥', '霄', '离', '微'];
  function genAncientName() { return pick(SURNAMES) + pick(NAMES_A) + (Math.random() < 0.78 ? pick(NAMES_B) : ''); }

  const STAGE_NAMES = {
    village:       '凡人村落',
    town:          '修仙坊镇',
    immortal_city: '百万仙凡巨城',
    sect_peak:     '大宗灵脉祖山',
    sect_ruin:     '古宗断壁遗址',
    beast_lair:    '万妖凶林绝域',
    wasteland:     '大能雷坑焦土',
    secret_realm:  '空间裂隙秘地',
    ocean_port:    '跨洋商港群岛',
    ancient_isle:  '太古遗族圣土'
  };

  // 为 23 处地标赋初始【第1年地格六元属性种子】（灵脉/五行/水土/灵矿/煞气/凡人人口/交通）
  function seedNodeStats(loc) {
    const reg = loc.region || 'east';
    const isSea = (loc.seaZone || 0) > 0;
    const base = {
      id: loc.id,
      name: loc.name,
      region: reg,
      leyline: randInt(48, 86),
      elem: reg === 'south' ? 'fire' : (reg === 'north' ? 'water' : (reg === 'east' ? 'wood' : (reg === 'central' ? 'earth' : 'gold'))),
      arable: isSea ? randInt(15, 40) : (reg === 'north' ? randInt(15, 38) : randInt(48, 88)),
      mineral: randInt(45, 92),
      miasma: (loc.id.includes('demon') || loc.id.includes('venom') || loc.id.includes('abyss')) ? randInt(68, 88) : (loc.id.includes('forest') || loc.id.includes('fire') ? randInt(48, 70) : randInt(6, 26)),
      mortalPop: isSea ? randInt(2000, 18000) : (loc.id.includes('capital') || loc.id.includes('city') ? randInt(120000, 320000) : (loc.id.includes('inn') || loc.id.includes('market') ? randInt(25000, 80000) : randInt(3000, 28000))),
      traffic: (loc.hasTeleport || loc.isPort) ? randInt(72, 95) : randInt(18, 62),
      stage: isSea ? (reg === 'yingzhou' ? 'ancient_isle' : 'ocean_port') : (loc.id.includes('capital') || loc.id.includes('city') ? 'immortal_city' : (loc.id.includes('forest') || loc.id.includes('beast') ? 'beast_lair' : (loc.id.includes('sect') || loc.id.includes('ice') || loc.id.includes('danding') ? 'sect_peak' : 'town'))),
      ownerFaction: null,
      history: []
    };
    if (loc.id === 'cave') { base.mortalPop = 0; base.miasma = 5; base.leyline = 72; base.stage = 'secret_realm'; }
    if (loc.id === 'altar' || loc.id === 'yingzhou_tree') { base.leyline = 96; base.mortalPop = 1200; base.stage = 'ancient_isle'; }
    if (loc.id === 'sea_dragon') { base.leyline = 90; base.mortalPop = 0; base.miasma = 60; base.stage = 'beast_lair'; }
    return base;
  }

  function addNodeHistory(node, year, text) {
    if (!node) return;
    node.history = node.history || [];
    node.history.push(`第${year}年：${text}`);
    if (node.history.length > 18) node.history.shift();
  }

  function addGenesisLog(G, year, tag, text) {
    G.genesisChronicles = G.genesisChronicles || [];
    G.genesisChronicles.unshift({ year, tag, text });
    if (G.genesisChronicles.length > 60) G.genesisChronicles.length = 60;
  }

  // 核心单步世界演化法则（正向创世 1~300年 与 玩家入世后 301~1000年 共用同一套底层碰撞引擎！）
  function evolveWorldDecade(G, D, year, isGenesis) {
    const nodes = G.worldNodes || {};
    const nodeList = Object.values(nodes);
    const facs = G.factionsDyn || [];
    if (!nodeList.length || !facs.length) return;

    const pushLog = (tag, text) => {
      if (isGenesis) addGenesisLog(G, year, tag, text);
      else if (window.WORLD_SIM) window.WORLD_SIM.pushNews(G, tag, `【百年变局】${text}`);
    };

    // 规则 1：凡人繁衍 × 聚落升格（arable高、miasma低 → 凡人增长 → 村镇升格为百万仙凡巨城！）
    nodeList.forEach(nd => {
      if (nd.arable >= 50 && nd.miasma < 30 && nd.mortalPop > 0) {
        const growth = Math.round(nd.mortalPop * (0.06 + nd.arable * 0.0012));
        nd.mortalPop = Math.min(1800000, nd.mortalPop + growth);
        if (nd.stage === 'village' && nd.mortalPop >= 35000) {
          nd.stage = 'town';
          addNodeHistory(nd, year, `水土丰美、凡人繁衍逾三万，灵根新苗辈出，自发升格为【修仙坊镇】。`);
        } else if (nd.stage === 'town' && nd.mortalPop >= 180000) {
          nd.stage = 'immortal_city';
          nd.traffic = Math.min(98, nd.traffic + 12);
          addNodeHistory(nd, year, `百年太平盛世，凡俗人口破十八万，各方商旅云集，晋升为【百万仙凡巨城】！`);
          pushLog('兴盛', `【${nd.name}】百年休养生息，人口破十八万，正式升格为五洲仙凡巨城！`);
        }
      }
      // 灵潮期间灵矿缓慢再生，有势力盘踞则持续开采消耗
      if (nd.ownerFaction) {
        nd.mineral = Math.max(0, nd.mineral - randInt(4, 9));
      } else {
        nd.mineral = Math.min(95, nd.mineral + randInt(2, 5));
      }
    });

    // 规则 2：过度开采枯竭碰撞 → 灵矿枯竭触发抢矿宗门战争！
    const depletedNode = nodeList.find(nd => nd.ownerFaction && nd.mineral <= 14 && Math.random() < 0.55);
    if (depletedNode) {
      const attacker = facs.find(f => f.id === depletedNode.ownerFaction);
      const richTarget = pick(nodeList.filter(nd => nd.id !== depletedNode.id && nd.id !== 'cave' && nd.mineral >= 55 && nd.ownerFaction !== depletedNode.ownerFaction));
      if (attacker && richTarget) {
        const defender = facs.find(f => f.id === richTarget.ownerFaction);
        const atkWin = Math.random() < 0.52;
        if (defender && window.WORLD_SIM) window.WORLD_SIM.shiftDiplomacy(G, attacker.id, defender.id, -randInt(25, 45));
        if (atkWin) {
          richTarget.ownerFaction = attacker.id;
          richTarget.miasma = Math.min(95, richTarget.miasma + 12);
          richTarget.mortalPop = Math.max(0, Math.round(richTarget.mortalPop * 0.85));
          addNodeHistory(depletedNode, year, `灵矿开采枯竭，【${attacker.name}】被迫向外发动抢矿远征。`);
          addNodeHistory(richTarget, year, `遭【${attacker.name}】大军攻占灵矿${defender ? `，击退【${defender.name}】守军` : ''}，山河微染战煞。`);
          pushLog('矿战', `因【${depletedNode.name}】灵矿枯竭，【${attacker.name}】远征夺下富矿之地【${richTarget.name}】${defender ? `，与【${defender.name}】结下血仇` : ''}！`);
        } else if (defender) {
          addNodeHistory(richTarget, year, `【${defender.name}】死守灵脉，成功击溃【${attacker.name}】抢矿大军！`);
        }
        depletedNode.mineral = randInt(22, 38); // 休采后残留微矿
      }
    }

    // 规则 3：大能死战 / 渡劫雷劫改貌 + 绝世秘宝真实诞生与遗落史！
    if (Math.random() < 0.58) {
      const battleNode = pick(nodeList.filter(nd => nd.id !== 'cave' && nd.id !== 'sect'));
      const facA = pick(facs);
      const heroName = genAncientName();
      if (battleNode && facA) {
        const r = Math.random();
        if (r < 0.45) {
          // 大能死战/雷劫震裂地脉改貌！
          battleNode.arable = Math.max(5, battleNode.arable - randInt(15, 30));
          battleNode.miasma = Math.min(96, battleNode.miasma + randInt(18, 32));
          battleNode.mortalPop = Math.max(0, Math.round(battleNode.mortalPop * 0.65));
          if (battleNode.miasma >= 72 && battleNode.stage !== 'ancient_isle') {
            battleNode.stage = 'wasteland';
          }
          addNodeHistory(battleNode, year, `【${facA.name}】化神大能【${heroName}】在此引动九霄雷劫并遭强敌截杀，地脉震裂、煞气冲霄！`);
          pushLog('大劫', `【${facA.name}】大能【${heroName}】在【${battleNode.name}】渡劫遭袭陨落，余威将方圆万里化作雷坑煞地！`);
        } else {
          // 秘宝真实铸造与传世录！
          const relicPool = [
            { id: 'eq_uniq_sky_rod',   name: '【古宝】乾坤量天尺' },
            { id: 'eq_uniq_undying',   name: '【古宝】涅槃不灭衣' },
            { id: 'eq_uniq_venom_eye', name: '【古宝】破妄妖瞳玉' },
            { id: 'eq_ancient_ring',   name: '【古宝】太虚洞天戒' },
            { id: 'bingji_pill',       name: '冰肌返春仙丹' },
            { id: 'dao_tea',           name: '悟道古茶树叶' }
          ];
          const unused = relicPool.filter(rp => !(G.relicChronicles || []).some(rc => rc.itemId === rp.id));
          if (unused.length) {
            const rp = pick(unused);
            const story = `沧溟第${year}年，【${facA.name}】老祖【${heroName}】耗尽百年心血炼得（或寻获）${rp.name}；后于【${battleNode.name}】一战身死道消，此宝随之隐没于该地地脉秘境之中！`;
            G.relicChronicles = G.relicChronicles || [];
            G.relicChronicles.push({
              year, itemId: rp.id, itemName: rp.name,
              creator: heroName, factionName: facA.name,
              locId: battleNode.id, locName: battleNode.name, story
            });
            addNodeHistory(battleNode, year, `传闻【${facA.name}】老祖【${heroName}】携绝世秘宝${rp.name}陨落于此，至今仍有灵光偶现。`);
            pushLog('秘宝', story);
          }
        }
      }
    }

    // 规则 4：旧宗断代化墟 / 宗门分裂 / 草根小组织逆袭开宗
    if (Math.random() < 0.34) {
      const targetFac = pick(facs.filter(f => !f.fixed));
      const homeNode = nodeList.find(nd => nd.ownerFaction === targetFac?.id);
      if (targetFac && homeNode) {
        const sub = Math.random();
        if (sub < 0.45 && homeNode.mineral <= 35) {
          // 祖山衰败化作古宗遗址，宗门迁徙重立！
          homeNode.stage = 'sect_ruin';
          homeNode.ownerFaction = null;
          addNodeHistory(homeNode, year, `【${targetFac.name}】因老祖断代与灵矿枯竭被迫弃山迁徙，昔日仙宫沦为【古宗断壁遗址】！`);
          pushLog('兴衰', `【${targetFac.name}】在【${homeNode.name}】气运耗尽被迫举宗迁徙，原祖山彻底沦为古宗遗址！`);
        } else {
          // 某代掌门内斗分裂或草根天骄崛起！
          const rebel = genAncientName();
          const newMinorName = pick(['断剑', '青莲', '天涯', '赤霞', '寒霜', '无极']) + pick(['散修盟', '暗堂', '遗脉', '剑社']);
          G.minorOrgs = G.minorOrgs || [];
          if (G.minorOrgs.length < 10) {
            G.minorOrgs.push({
              id: 'minor_ev_' + year + '_' + randInt(10, 99),
              name: newMinorName,
              role: `原【${targetFac.name}】分裂遗脉，专营暗市与复仇悬赏`,
              zone: targetFac.zone,
              leaderName: rebel,
              power: randInt(32, 65),
              alive: true,
              allyPlayer: false
            });
            addNodeHistory(homeNode, year, `【${targetFac.name}】掌门之争爆发内讧，长老【${rebel}】率三成弟子出走另立「${newMinorName}」！`);
            pushLog('分裂', `【${targetFac.name}】高层内讧，【${rebel}】带众叛出另立江湖组织「${newMinorName}」！`);
          }
        }
      }
    }

    // 规则 5：荒林妖兽百年称皇 / 轮回盘流转史
    if (Math.random() < 0.30) {
      const wildNode = pick(nodeList.filter(nd => nd.miasma >= 55 && nd.stage !== 'ancient_isle'));
      if (wildNode) {
        wildNode.stage = 'beast_lair';
        wildNode.miasma = Math.min(98, wildNode.miasma + 10);
        addNodeHistory(wildNode, year, `百年无人清剿，深谷妖王借灵潮化形称皇，此地彻底演变为【万妖凶林绝域】！`);
      }
    }

    if (isGenesis && (year === 80 || year === 190 || year === 270)) {
      const rFac = pick(facs);
      const rNode = pick(nodeList);
      const rHero = genAncientName();
      if (rFac && rNode) {
        const line = year === 270
          ? `沧溟第${year}年，天地唯一【造化轮回盘】于【${rNode.name}】上空划破长空后彻底隐匿，此后三十载杳无音讯，静待有缘人！`
          : `沧溟第${year}年，【${rFac.name}】老祖【${rHero}】大限将至之际于【${rNode.name}】寻获唯一至宝【造化轮回盘】并成功兵解转世，至宝随即破空飞遁！`;
        addNodeHistory(rNode, year, line);
        addGenesisLog(G, year, '轮回盘', line);
      }
    }
  }

  // 开档一次性正向推演 300 年（第 1 年 → 第 300 年，耗时 < 15ms！）
  function runForwardGenesis(G, D) {
    if (G._genesisDone && G.worldNodes && Object.keys(G.worldNodes).length) return;
    const locs = (D && D.LOCATIONS) || [];
    const facs = G.factionsDyn || [];
    G.worldNodes = {};
    G.genesisChronicles = [];
    G.relicChronicles = [];

    // 1. 第 1 年：初始化全界 23 处地格六元属性
    locs.forEach(loc => {
      const nd = seedNodeStats(loc);
      addNodeHistory(nd, 1, `太古断界初定，形成${STAGE_NAMES[nd.stage] || '原始地貌'}（灵脉 ${nd.leyline} · 灵矿 ${nd.mineral}）。`);
      G.worldNodes[loc.id] = nd;
    });
    addGenesisLog(G, 1, '创世', '太古天柱崩摧，化作千万里《沧溟界》——七分沧溟大洋、四大主洲与黑水洋彼岸孤洲【东极瀛洲】。');

    // 2. 第 10~20 年：本纪元随机大宗依地格灵脉自然选址开山！
    const nodeList = Object.values(G.worldNodes);
    const claimed = new Set();
    facs.forEach(fac => {
      const preferReg = fac.zone.includes('南') ? 'south' : (fac.zone.includes('北') ? 'north' : (fac.zone.includes('中') ? 'central' : (fac.zone.includes('海') ? 'ocean' : (fac.zone.includes('彼岸') ? 'yingzhou' : 'east'))));
      let cands = nodeList.filter(nd => nd.region === preferReg && !claimed.has(nd.id) && nd.id !== 'cave');
      if (!cands.length) cands = nodeList.filter(nd => !claimed.has(nd.id) && nd.id !== 'cave');
      cands.sort((a, b) => b.leyline - a.leyline);
      const best = cands[0];
      if (best) {
        claimed.add(best.id);
        best.ownerFaction = fac.id;
        const founder = genAncientName();
        addNodeHistory(best, randInt(10, 22), `初代老祖【${founder}】勘定此地灵脉（浓度${best.leyline}），开山创立【${fac.name}】！`);
        addGenesisLog(G, randInt(10, 22), '开宗', `初代老祖【${founder}】择址【${best.name}】开山立派，创立【${fac.name}】！`);
      }
    });

    // 3. 第 30 年 → 第 300 年：正向运行 27 个十年大世演化步！
    for (let yr = 30; yr <= 300; yr += 10) {
      evolveWorldDecade(G, D, yr, true);
    }

    G.genesisYearOffset = 300; // 玩家降生于沧溟第 301 年！
    G._genesisDone = true;
  }

  function getStageName(stage) {
    return STAGE_NAMES[stage] || '修仙地界';
  }

  // 地点【地脉沧桑碑】弹窗：查看此地六元属性 + 归属势力 + 从第1年至今的真实历史碑文 + 秘宝传闻！
  function openNodeChronicleModal(ctx, locId) {
    const { G, D, ASSETS, setDialogue, renderAll } = ctx;
    if (!G.worldNodes || !G.worldNodes[locId]) runForwardGenesis(G, D);
    const nd = G.worldNodes[locId];
    if (!nd) return;
    const owner = (G.factionsDyn || []).find(f => f.id === nd.ownerFaction);
    const relicsHere = (G.relicChronicles || []).filter(rc => rc.locId === locId);
    const histLines = (nd.history || []).slice(-8).reverse().map(h => `· ${h}`).join('\n');
    const relicLine = relicsHere.length
      ? `\n\n【地脉秘宝传闻】\n` + relicsHere.map(rc => `★ ${rc.itemName}：${rc.story}`).join('\n')
      : '';
    setDialogue({
      speaker: `${nd.name} · 地脉沧桑碑（${getStageName(nd.stage)}）`,
      asset: ASSETS.elder,
      text: `【地格六元】灵脉 ${nd.leyline} · 灵矿 ${nd.mineral} · 水土 ${nd.arable} · 妖煞 ${nd.miasma} · 凡人 ${nd.mortalPop.toLocaleString()} · 归属：${owner ? owner.name : '无主散地'}\n\n【沧溟创世至今变迁史】\n${histLines}${relicLine}`,
      choices: [{ text: '合上碑志', action: () => { setDialogue(null); renderAll(); } }]
    });
    renderAll();
  }

  return {
    STAGE_NAMES,
    getStageName,
    runForwardGenesis,
    evolveWorldDecade,
    openNodeChronicleModal
  };
})();
