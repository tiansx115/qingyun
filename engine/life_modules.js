/* ============================================================================
 * 《沧溟界》v9.4.0 深度人生模块 (engine/life_modules.js)
 * ----------------------------------------------------------------------------
 * 1. 0–18 岁童年少年开局手记（4 幕抉择真实塑造 8 维人格、IQ/EQ/悟性、遗物与家境）
 * 2. 洞府聚灵阵升级 & 真实炼丹/炼器炉（消耗野外采药与妖丹产出丹药/法宝）
 * 3. 开宗立派后的宗门经营引擎（杂役待遇、招募散修、创办真实社会制度、派弟子探遗迹）
 * ============================================================================ */
(function (root) {
  'use strict';

  const BIRTH_CHAPTERS = [
    {
      age: '0岁 · 家世出身',
      prompt: '你降生于沧溟界乱世灵潮之后，你最早的记忆来自何处？',
      choices: [
        { label: '凡人山村农户（双亲淳朴，家境清贫）', fx: { stones: 90, eq: 6, relic: { name: '亡母旧玉佩', kind: '遗物', desc: '临行信物，可抚平心魔' }, pers: { ren: 15, yi: 10 } } },
        { label: '落魄修仙世家（祖上曾出筑基，留有残卷）', fx: { stones: 210, iq: 8, daoWit: 6, art: '《家传残缺灵诀》', pers: { ao: 12, dao: 10 } } },
        { label: '坊市街头孤儿（吃百家饭长大，深谙人心诡谲）', fx: { stones: 130, iq: 10, eq: 10, masked: true, pers: { chi: 10, pan: 12 } } },
        { label: '大宗杂役后代（自幼扫山劈柴，见惯宗门倾轧）', fx: { stones: 110, daoWit: 8, eq: 4, pers: { cheng: 12, kuang: 8 } } }
      ]
    },
    {
      age: '8岁 · 启蒙见闻',
      prompt: '八岁那年，一名御剑修士从村头上空掠过，剑光撕裂云层。你当时心中所想是？',
      choices: [
        { label: '“长生逍遥，我亦要踏破虚空！”', fx: { daoWit: 8, pers: { dao: 18, kuang: 8 } } },
        { label: '“若无实力，凡人如蝼蚁，我要护住身边人。”', fx: { eq: 6, pers: { yi: 18, ren: 12 } } },
        { label: '“他腰间那枚储物袋，定藏着无数灵石与机缘……”', fx: { iq: 8, stones: 40, pers: { chi: 15, pan: 10 } } }
      ]
    },
    {
      age: '14岁 · 少年风波',
      prompt: '十四岁时，村外妖狼夜袭或坊市恶霸欺压，你如何应对？',
      choices: [
        { label: '提柴刀正面相抗，血战击退凶敌', fx: { exp: 35, pers: { kuang: 16, yi: 10 } } },
        { label: '暗中设下陷坑毒饵，借刀杀人坐收渔利', fx: { iq: 8, stones: 55, pers: { pan: 14, chi: 10 } } },
        { label: '散尽家财贿赂巡山散修，化干戈为玉帛', fx: { eq: 10, stones: -20, pers: { cheng: 15, ren: 10 } } }
      ]
    },
    {
      age: '18岁 · 踏入仙途',
      prompt: '十八岁成人礼毕，你辞别故土踏上修仙路。你立下的第一道心誓是？',
      choices: [
        { label: '宁折不弯，以手中剑问鼎大道', fx: { daoWit: 6, exp: 30, pers: { dao: 15, ao: 12 } } },
        { label: '广结善缘，开宗立派庇佑一方', fx: { eq: 8, stones: 60, pers: { yi: 15, ren: 10 } } },
        { label: '苟道长存，隐姓埋名笑看风云', fx: { iq: 8, masked: true, pers: { cheng: 18, pan: 8 } } }
      ]
    }
  ];

  function applyBirthChoices(hero, pickedIndices) {
    if (!hero) return;
    hero.birthSummary = [];
    pickedIndices.forEach((cIdx, step) => {
      const ch = BIRTH_CHAPTERS[step];
      if (!ch) return;
      const opt = ch.choices[cIdx] || ch.choices[0];
      const fx = opt.fx || {};
      if (fx.stones) hero.stones = Math.max(20, (hero.stones || 120) + fx.stones);
      if (fx.iq) hero.iq = Math.min(100, (hero.iq || 75) + fx.iq);
      if (fx.eq) hero.eq = Math.min(100, (hero.eq || 70) + fx.eq);
      if (fx.daoWit) hero.daoWit = Math.min(100, (hero.daoWit || 75) + fx.daoWit);
      if (fx.exp) hero.exp = (hero.exp || 0) + fx.exp;
      if (fx.masked) hero.masked = true;
      if (fx.art && !(hero.arts || []).includes(fx.art)) hero.arts.push(fx.art);
      if (fx.relic && !(hero.bag || []).some(i => i.name === fx.relic.name)) {
        hero.bag.push({ id: 'it_birth_' + step, name: fx.relic.name, kind: fx.relic.kind, qty: 1, desc: fx.relic.desc });
      }
      hero.birthSummary.push(`${ch.age}：${opt.label}`);
    });
    hero.birthDone = true;
  }

  // ===== 洞府炼丹与炼器配方 =====
  const RECIPES = [
    {
      id: 'rec_pill_qi', name: '二阶聚气灵丹', kind: '丹药',
      needHerb: 2, needCore: 0, needStones: 20,
      desc: '服用增修为 +85，丹毒 +8（由野生聚灵草炼制）',
      effect: { exp: 85, toxin: 8 }
    },
    {
      id: 'rec_pill_detox', name: '清心祛毒散', kind: '丹药',
      needHerb: 1, needCore: 0, needStones: 25,
      desc: '服用清除丹毒 -28、抚平心魔 -15',
      effect: { detox: 28, calm: 15 }
    },
    {
      id: 'rec_pill_break', name: '筑基护心丹', kind: '丹药',
      needHerb: 2, needCore: 1, needStones: 50,
      desc: '服用增修为 +130 并抚平心魔 -18（需妖丹）',
      effect: { exp: 130, calm: 18, toxin: 6 }
    },
    {
      id: 'rec_sword_up', name: '炼制【赤霄飞剑胚胎】', kind: '法宝',
      needHerb: 0, needCore: 1, needStones: 60,
      desc: '以妖丹融灵石锻造本命飞剑，永久提升斗法攻势！',
      effect: { atkBonus: 12 }
    }
  ];

  function countItemKind(hero, matcher) {
    return (hero.bag || []).filter(matcher).reduce((s, i) => s + (i.qty || 1), 0);
  }

  function consumeItems(hero, matcher, qty) {
    let left = qty;
    for (let i = hero.bag.length - 1; i >= 0 && left > 0; i--) {
      if (matcher(hero.bag[i])) {
        const take = Math.min(left, hero.bag[i].qty || 1);
        hero.bag[i].qty -= take;
        left -= take;
        if (hero.bag[i].qty <= 0) hero.bag.splice(i, 1);
      }
    }
  }

  function craftRecipe(hero, recipeId) {
    const rec = RECIPES.find(r => r.id === recipeId);
    if (!rec) return { ok: false, msg: '未知丹方' };
    const isHerb = it => it.name.includes('草') || it.kind === '灵材';
    const isCore = it => it.name.includes('妖丹') || it.kind === '妖材';
    if ((hero.stones || 0) < rec.needStones) return { ok: false, msg: `灵石不足（需 ${rec.needStones}）` };
    if (rec.needHerb > 0 && countItemKind(hero, isHerb) < rec.needHerb) return { ok: false, msg: `灵草不足（需 ${rec.needHerb} 份，可去城外灵脉采集）` };
    if (rec.needCore > 0 && countItemKind(hero, isCore) < rec.needCore) return { ok: false, msg: `妖材/妖丹不足（需 ${rec.needCore} 份，可去城外斩妖获取）` };

    hero.stones -= rec.needStones;
    if (rec.needHerb > 0) consumeItems(hero, isHerb, rec.needHerb);
    if (rec.needCore > 0) consumeItems(hero, isCore, rec.needCore);

    if (rec.kind === '法宝') {
      hero.bonusAtk = (hero.bonusAtk || 0) + (rec.effect.atkBonus || 10);
      hero.bag.push({ id: 'it_' + Date.now(), name: rec.name.replace('炼制', ''), kind: '法宝', qty: 1, desc: rec.desc });
      return { ok: true, msg: `🔥 丹火淬炼成功！你成功炼成【${rec.name}】，本命战力永久提升 +${rec.effect.atkBonus}！` };
    }
    const ex = hero.bag.find(i => i.name === rec.name);
    if (ex) ex.qty += 1;
    else hero.bag.push({ id: 'it_' + Date.now(), name: rec.name, kind: '丹药', qty: 1, desc: rec.desc, effect: rec.effect });
    return { ok: true, msg: `🔥 炉火纯青！你在洞府成功炼成【${rec.name}】×1！` };
  }

  function upgradeCave(hero) {
    hero.caveLv = hero.caveLv || 1;
    if (hero.caveLv >= 5) return { ok: false, msg: '洞府聚灵阵已达五阶极品！' };
    const cost = hero.caveLv * 110;
    if ((hero.stones || 0) < cost) return { ok: false, msg: `升级 ${hero.caveLv + 1} 阶聚灵阵需 ${cost} 灵石` };
    hero.stones -= cost;
    hero.caveLv++;
    return { ok: true, msg: `✨ 洞府聚灵阵晋升至【${hero.caveLv} 阶】！此后打坐吐纳与闭关效率大幅提升！` };
  }

  // ===== 宗门经营引擎（真实写入 WorldCore 势力与社会制度） =====
  function manageSect(hero, world, op) {
    const fac = hero.myFactionId ? world.factions.find(f => f.id === hero.myFactionId && f.alive) : null;
    if (!fac) return { ok: false, msg: '你尚未开宗立派，请先在板块主殿创立宗门！' };
    const nd = world.nodeMap[fac.homePlate] || world.nodeMap[hero.locId];

    if (op === 'exploit_servants') {
      fac.hasServantSystem = true;
      fac.servants = (fac.servants || 30) + 15;
      fac.inequality = Math.min(100, (fac.inequality || 25) + 16);
      fac.bureaucracy = Math.min(100, (fac.bureaucracy || 20) + 8);
      hero.stones += 90;
      hero.wanted = (hero.wanted || 0) + 12;
      return { ok: true, msg: `你收紧【${fac.name}】杂役月俸，账房入账 +90 灵石，但宗门不公升至 ${Math.round(fac.inequality)}（小心杂役叛逃！）` };
    }
    if (op === 'treat_well') {
      if (hero.stones < 45) return { ok: false, msg: '灵石不足 45，难以加发弟子津贴' };
      hero.stones -= 45;
      fac.inequality = Math.max(0, (fac.inequality || 25) - 18);
      fac.disciples = (fac.disciples || 60) + 14;
      if (window.WorldCore && nd) window.WorldCore.adjustHolding(nd, fac.id, 5);
      return { ok: true, msg: `你厚待【${fac.name}】门下杂役与外门弟子，民心大振！门徒增至 ${fac.disciples} 人，本地掌控度 +5%！` };
    }
    if (op === 'recruit') {
      if (hero.stones < 55) return { ok: false, msg: '招募散修需 55 灵石安家费' };
      hero.stones -= 55;
      fac.disciples = (fac.disciples || 60) + 20;
      if (window.WorldCore && nd) window.WorldCore.adjustHolding(nd, fac.id, 7);
      return { ok: true, msg: `你广发英雄帖招揽散修，【${fac.name}】门徒增至 ${fac.disciples} 人，本地掌控度 +7%！` };
    }
    if (op === 'host_inst') {
      if (hero.stones < 100) return { ok: false, msg: '创办坊市/大比盛会需 100 灵石筹备金' };
      hero.stones -= 100;
      world.institutions = world.institutions || [];
      const inst = {
        id: 'inst_hero_' + Date.now(),
        type: 'auction',
        name: `${fac.name}·灵宝交易盛会`,
        plateId: nd.id,
        hostId: fac.id,
        hostName: fac.name,
        foundedYear: world.year,
        cycleYears: 10,
        status: 'thriving',
        integrity: 88,
        reputation: 72
      };
      world.institutions.unshift(inst);
      world.chronicles.unshift({ year: world.year, tag: '盛会', text: `第${world.year}年：【${fac.name}】于【${nd.name}】正式创办【${inst.name}】，八方修士云集！` });
      return { ok: true, msg: `⚖️ 你成功创办了【${inst.name}】并写入世界制度库！此后每 10 年将在本地举行！` };
    }
    if (op === 'expedition') {
      if (hero.stones < 40) return { ok: false, msg: '派遣探宝队需 40 灵石补给' };
      hero.stones -= 40;
      const gain = 65 + Math.floor(Math.random() * 65);
      hero.stones += gain;
      const ex = hero.bag.find(i => i.name === '野生聚灵草');
      if (ex) ex.qty += 2; else hero.bag.push({ id: 'it_herb', name: '野生聚灵草', kind: '灵材', qty: 2, desc: '弟子外出探寻带回的灵草' });
      return { ok: true, msg: `🧭 你派出门下精英探查周边灵脉，满载而归：带回灵石 +${gain}、野生聚灵草 ×2！` };
    }
    return { ok: false, msg: '未知宗门指令' };
  }

  const LifeModules = { BIRTH_CHAPTERS, applyBirthChoices, RECIPES, craftRecipe, upgradeCave, manageSect };
  if (typeof module !== 'undefined' && module.exports) module.exports = LifeModules;
  root.LifeModules = LifeModules;
})(typeof window !== 'undefined' ? window : globalThis);
