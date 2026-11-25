/* ============================================================================
 * 《沧溟界》v10.2.0 代际传承 · 道侣双修 · 家族血脉系统 (engine/lineage.js)
 * ----------------------------------------------------------------------------
 * - 缔结道侣契约 + 双修共参大道（增修为、抚心魔、解孤寂）
 * - 孕育血脉子嗣 / 收徒亲传弟子（继承双亲悟性/智谋，随年月成长）
 * - 坐化传功 / 代际衣钵继承：写入本世界真实编年史碑文，由下一代继承洞府、遗物、
 *   功法与宗门掌门之位，在同一个演化沧溟界中延续百年仙族史！
 * ============================================================================ */
(function (root) {
  'use strict';

  const HEIR_GIVEN = ['清玄', '明月', '凌云', '无咎', '昭华', '知微', '青崖', '慕白', '素心', '问天'];

  function ensureLineage(hero) {
    if (!hero) return null;
    if (!hero.lineage) {
      hero.lineage = { generation: 1, companion: null, heirs: [], ancestors: [] };
    }
    return hero.lineage;
  }

  function bondCompanion(hero, npc) {
    const lin = ensureLineage(hero);
    if (!npc) return { ok: false, msg: '未指定道侣对象' };
    lin.companion = { id: npc.id, name: npc.name, realm: npc.realm || '炼气圆满', intimacy: 60 };
    if (hero.life) hero.life.loneliness = Math.max(0, (hero.life.loneliness || 0) - 35);
    return { ok: true, msg: `💞 你与【${npc.name}】在天道见证下缔结道侣契约，从此携手问仙！` };
  }

  function dualCultivate(hero, world) {
    const lin = ensureLineage(hero);
    if (!lin.companion) return { ok: false, msg: '你尚未结识道侣（可在【江湖】面板或下方结缘）' };
    const gain = Math.round(55 + (hero.daoWit || 80) * 0.45 + lin.companion.intimacy * 0.3);
    hero.exp = Math.min(hero.maxExp || 100, (hero.exp || 0) + gain);
    lin.companion.intimacy = Math.min(100, lin.companion.intimacy + 8);
    if (hero.life) {
      hero.life.heartDemon = Math.max(0, (hero.life.heartDemon || 0) - 18);
      hero.life.loneliness = Math.max(0, (hero.life.loneliness || 0) - 25);
    }
    if (root.LifeSim && world) root.LifeSim.advanceLifeMonths(hero, world, 1, 'mortal_life');
    return { ok: true, msg: `✨ 你与道侣【${lin.companion.name}】双修共参大道一月：修为 +${gain}、心魔 -18、情谊升至 ${lin.companion.intimacy}！` };
  }

  function adoptOrBirthHeir(hero, world, kind) {
    const lin = ensureLineage(hero);
    if (lin.heirs.length >= 4) return { ok: false, msg: '膝下/门下传人已满 4 位，贵精不贵多' };
    if (kind === 'child' && !lin.companion) return { ok: false, msg: '需先缔结道侣方可孕育血脉子嗣（或选择收徒【亲传弟子】）' };
    const surname = (hero.name || '青').slice(0, 1);
    const given = HEIR_GIVEN[(world.year + lin.heirs.length * 3) % HEIR_GIVEN.length];
    const heir = {
      id: 'heir_' + Date.now() + '_' + lin.heirs.length,
      name: kind === 'child' ? (surname + given) : ('陆' + given),
      kind: kind === 'child' ? '血脉子嗣' : '亲传弟子',
      bornYear: world ? world.year : 1200,
      daoWit: Math.min(99, Math.round((hero.daoWit || 80) * 0.85 + 8 + Math.random() * 14)),
      iq: Math.min(99, Math.round((hero.iq || 80) * 0.85 + 8 + Math.random() * 14)),
      eq: Math.min(99, Math.round((hero.eq || 75) * 0.85 + 10 + Math.random() * 12))
    };
    lin.heirs.push(heir);
    return { ok: true, msg: `🌱 你迎来${heir.kind}【${heir.name}】（悟性 ${heir.daoWit} · 智谋 ${heir.iq}），假以时日必成大器！` };
  }

  function passTorchToHeir(hero, world, heirId) {
    const lin = ensureLineage(hero);
    const idx = lin.heirs.findIndex(h => h.id === heirId);
    if (idx < 0) return { ok: false, msg: '未找到指定继承人' };
    const heir = lin.heirs.splice(idx, 1)[0];
    const epitaph = `第 ${lin.generation} 代【${hero.name}】享寿 ${hero.age} 岁，止步【${hero.realm}】，于第 ${world.year} 年坐化传功，衣钵由${heir.kind}【${heir.name}】承继。`;
    lin.ancestors.unshift({ gen: lin.generation, name: hero.name, realm: hero.realm, age: hero.age, year: world.year, epitaph });
    if (world && world.chronicles) {
      world.chronicles.unshift({ year: world.year, tag: '传承', text: `第${world.year}年：${epitaph}` });
    }
    // 下一代主角正式登台！继承洞府、遗物、宗门与六成灵石
    lin.generation += 1;
    lin.companion = null;
    hero.name = heir.name;
    hero.age = 18;
    hero.realmIdx = Math.max(0, Math.min(2, Math.floor((hero.realmIdx || 0) / 2)));
    hero.exp = 30;
    hero.daoWit = heir.daoWit;
    hero.iq = heir.iq;
    hero.eq = heir.eq;
    hero.stones = Math.round((hero.stones || 100) * 0.7);
    hero.bag.push({ id: 'it_anc_' + Date.now(), name: `先祖【${lin.ancestors[0].name}】道袍遗玉`, kind: '遗物', qty: 1, desc: '先祖坐化所留衣钵信物' });
    if (hero.life) {
      hero.life.pillToxin = 0;
      hero.life.heartDemon = 0;
      hero.life.injuries = [];
      hero.life.loneliness = 10;
    }
    if (hero.myFactionId && world) {
      const fac = world.factions.find(f => f.id === hero.myFactionId);
      if (fac) fac.leader = hero.name;
    }
    return { ok: true, msg: `🔥 薪火相传！第 ${lin.generation} 代掌门/传人【${hero.name}】正式接掌洞府、遗物与道统，续写沧溟仙族传奇！` };
  }

  const Lineage = { ensureLineage, bondCompanion, dualCultivate, adoptOrBirthHeir, passTorchToHeir };
  if (typeof module !== 'undefined' && module.exports) module.exports = Lineage;
  root.Lineage = Lineage;
})(typeof window !== 'undefined' ? window : globalThis);
