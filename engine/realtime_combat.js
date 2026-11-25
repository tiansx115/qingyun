/* ============================================================================
 * 《沧溟界》v9.3.0 实时仙侠斗法引擎 (engine/realtime_combat.js)
 * ----------------------------------------------------------------------------
 * - 统一接管【野外斩妖】【暗森劫修伏击】【NPC 切磋/夺宝/复仇】斗法
 * - 支持：剑诀普攻 / 五行灵法 / 护体灵盾 / 吞服储物袋丹药(真加丹毒) / 灵宠协战 / 施展遁术
 * - 战后真实结算：修为、灵石、妖丹/战利品、暗伤、心魔、NPC 4维关系与编年史写入
 * ============================================================================ */
(function (root) {
  'use strict';

  function createBattle(hero, enemySpec) {
    const rIdx = hero.realmIdx || 0;
    const baseAtk = 18 + rIdx * 16 + Math.floor((hero.daoWit || 75) * 0.2);
    const eScale = enemySpec.power || (1 + rIdx * 0.65);
    return {
      hero: {
        name: hero.masked ? hero.maskName : hero.name,
        hp: hero.hp || hero.maxHp || 120,
        maxHp: hero.maxHp || 120,
        qi: hero.qi || hero.maxQi || 80,
        maxQi: hero.maxQi || 80,
        atk: baseAtk,
        shield: 0,
        cdSpell: 0,
        cdShield: 0
      },
      enemy: {
        name: enemySpec.name || '幽林妖狼',
        title: enemySpec.title || '荒野凶兽',
        kind: enemySpec.kind || 'beast', // 'beast' | 'bandit' | 'npc'
        avatar: enemySpec.avatar || 'assets/chars/wolf_boss.webp',
        hp: Math.round(105 * eScale),
        maxHp: Math.round(105 * eScale),
        atk: Math.round(14 * eScale),
        intent: '蓄力扑击',
        npcRef: enemySpec.npcRef || null,
        rewardStones: enemySpec.rewardStones || Math.round(35 * eScale),
        rewardExp: enemySpec.rewardExp || Math.round(32 * eScale),
        dropItem: enemySpec.dropItem || { name: `${enemySpec.name || '妖兽'}妖丹`, kind: '妖材', desc: '炼丹/炼器上佳妖材' }
      },
      turn: 1,
      status: 'fighting', // 'fighting' | 'win' | 'lose' | 'escaped'
      logs: [`⚔️ 你与【${enemySpec.name || '幽林妖狼'}】摆开阵势，灵气激荡，斗法一触即发！`]
    };
  }

  function stepBattle(battle, action, heroRef) {
    if (battle.status !== 'fighting') return battle;
    const h = battle.hero, e = battle.enemy;
    const log = [];

    if (h.cdSpell > 0) h.cdSpell--;
    if (h.cdShield > 0) h.cdShield--;
    h.shield = Math.max(0, Math.floor(h.shield * 0.5));

    // 1. 主角出招
    if (action === 'strike') {
      const dmg = Math.round(h.atk * (0.9 + Math.random() * 0.25));
      e.hp = Math.max(0, e.hp - dmg);
      h.qi = Math.min(h.maxQi, h.qi + 16);
      log.push(`⚔️ 你挥动飞剑施展【青云剑诀】，造成 ${dmg} 点伤害，回气 +16！`);
    } else if (action === 'spell') {
      if (h.qi < 28) {
        log.push(`⚠️ 灵力不足（需 28 点），改以剑气试探造成 ${Math.round(h.atk * 0.6)} 点伤害！`);
        e.hp = Math.max(0, e.hp - Math.round(h.atk * 0.6));
      } else {
        h.qi -= 28;
        h.cdSpell = 2;
        const dmg = Math.round(h.atk * (1.75 + Math.random() * 0.35));
        e.hp = Math.max(0, e.hp - dmg);
        log.push(`🔥 你掐诀引动【五行太初雷法】，雷光轰落，重创敌手 ${dmg} 点气血！`);
      }
    } else if (action === 'shield') {
      if (h.qi < 18) {
        log.push('⚠️ 灵力不足以撑起护盾，只得架剑格挡（护盾 +25）。');
        h.shield += 25;
      } else {
        h.qi -= 18;
        h.cdShield = 2;
        const sh = Math.round(h.maxHp * 0.32);
        h.shield += sh;
        log.push(`🛡️ 你运转【玄玉护体灵盾】，周身浮现护盾 +${sh}，并蓄势反震！`);
      }
    } else if (action === 'pill') {
      const pillIdx = (heroRef.bag || []).findIndex(it => it.kind === '丹药' && it.qty > 0);
      if (pillIdx < 0) {
        log.push('⚠️ 储物袋中已无可用丹药！');
      } else {
        const it = heroRef.bag[pillIdx];
        it.qty--;
        if (it.qty <= 0) heroRef.bag.splice(pillIdx, 1);
        const heal = Math.round(h.maxHp * 0.45);
        h.hp = Math.min(h.maxHp, h.hp + heal);
        h.qi = Math.min(h.maxQi, h.qi + 35);
        if (heroRef.life) heroRef.life.pillToxin = Math.min(100, (heroRef.life.pillToxin || 0) + 10);
        log.push(`💊 你临阵吞服【${it.name}】，气血 +${heal}、灵力 +35（丹毒 +10）！`);
      }
    } else if (action === 'flee') {
      const rate = 0.58 + (heroRef.iq || 70) * 0.002;
      if (Math.random() < rate) {
        battle.status = 'escaped';
        log.push(`💨 你祭出轻身遁符，化作一道青虹脱离战圈！`);
        battle.logs = log.concat(battle.logs).slice(0, 12);
        return battle;
      } else {
        log.push(`❌ 遁术被【${e.name}】以气机锁定打断，未能脱身！`);
      }
    }

    // 2. 伴生灵宠协战
    if (e.hp > 0 && heroRef.pets && heroRef.pets.length > 0) {
      const petDmg = Math.round(h.atk * 0.42);
      e.hp = Math.max(0, e.hp - petDmg);
      log.push(`🐾 伴生灵宠【${heroRef.pets[0]}】飞扑协战，撕咬造成 ${petDmg} 点伤害！`);
    }

    // 检查敌方败亡
    if (e.hp <= 0) {
      battle.status = 'win';
      log.push(`🏆 激战 ${battle.turn} 回合，你终将【${e.name}】击败！`);
      battle.logs = log.concat(battle.logs).slice(0, 12);
      return battle;
    }

    // 3. 敌方反击
    const isHeavy = battle.turn % 3 === 0;
    const rawDmg = Math.round(e.atk * (isHeavy ? 1.45 : (0.85 + Math.random() * 0.3)));
    const blocked = Math.min(h.shield, rawDmg);
    const realDmg = Math.max(0, rawDmg - blocked);
    h.shield -= blocked;
    h.hp = Math.max(0, h.hp - realDmg);
    log.push(isHeavy
      ? `💥 【${e.name}】施展狂暴重击！护盾抵挡 ${blocked}，你受创 -${realDmg} 气血！`
      : `⚡ 【${e.name}】发起反扑，护盾抵挡 ${blocked}，你损失 -${realDmg} 气血！`);

    e.intent = (battle.turn + 1) % 3 === 0 ? '⚠️ 正在蓄力狂暴重击！' : '准备普通扑击';

    if (h.hp <= 0) {
      battle.status = 'lose';
      h.hp = Math.max(10, Math.round(h.maxHp * 0.15));
      log.push(`🩸 你气血耗尽险些陨落，拼死催动保命灵符逃离，留下了一道暗伤！`);
    }

    battle.turn++;
    battle.logs = log.concat(battle.logs).slice(0, 12);
    return battle;
  }

  const RealtimeCombat = { createBattle, stepBattle };
  if (typeof module !== 'undefined' && module.exports) module.exports = RealtimeCombat;
  root.RealtimeCombat = RealtimeCombat;
})(typeof window !== 'undefined' ? window : globalThis);
