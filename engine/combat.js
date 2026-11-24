// 《青云问道录》v6.0 纯实时集气（ATB）+ 护体定力破防 + 灵兽/道友/悬浮法宝同屏战斗引擎
window.COMBAT = {
  state: null,
  _timer: null,
  _ctx: null,

  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this.state = null;
  },

  start(enemy, ctx) {
    this.stop();
    this._ctx = ctx;
    const { G, D } = ctx;
    const eq = ctx.getEquipStats();
    const eMaxPoise = enemy.maxPoise || Math.max(60, Math.round(enemy.maxHp * 0.45));
    const unlockedTr = ctx.getUnlockedTreasureSlots ? ctx.getUnlockedTreasureSlots() : 0;
    const treasures = (G.treasures || [null, null]).map((tid, idx) => {
      if (idx >= unlockedTr) return null;
      const it = tid && D.ITEMS[tid];
      return it ? { id: tid, def: it, cdLeft: it.mode === 'auto' ? it.cd * 0.6 : 0 } : null;
    });
    const beastObj = G.activeBeast && G.beasts && G.beasts[G.activeBeast] ? G.beasts[G.activeBeast] : null;
    const beastDef = beastObj ? D.BEAST_DEFS[beastObj.id] : null;

    this.state = {
      enemy: {
        ...enemy,
        poise: eMaxPoise, maxPoise: eMaxPoise,
        speed: enemy.speed || (11 + Math.floor((enemy.atk || 16) * 0.25)),
        atb: 15, poison: 0, brokenTimer: 0
      },
      heroAtb: 45,
      allyAtb: 25,
      beastAtb: 30,
      shield: 0,
      counterTimer: 0,
      poisonTickAcc: 0,
      cheatDeathUsed: false,
      treasures,
      beastObj, beastDef,
      ticker: `迎战【${enemy.name}】！实时集气中，择机出招！`
    };
    ctx.onBattleStart();
    this._mountUi();
    this._timer = setInterval(() => this._tick(0.08), 80);
  },

  _getEffectiveSpeed() {
    const { G, D } = this._ctx;
    const eq = this._ctx.getEquipStats();
    const ha = D.HEART_ARTS[G.heartArt] || {};
    const sets = this._ctx.getActiveSets();
    let spd = (G.speed || 10) + (eq.speed || 0) + (sets.blood >= 2 ? 4 : 0);
    const hpRatio = G.hp / Math.max(1, G.maxHp);
    if (ha.berserk) spd *= (1 + (1 - hpRatio) * 0.55);
    if ((G.passives || []).includes('p_blood_fury') && hpRatio < 0.5) spd *= 1.30;
    return Math.max(6, spd);
  },

  _tick(dt) {
    const S = this.state;
    if (!S) return;
    const { G, D } = this._ctx;
    const e = S.enemy;
    const ha = D.HEART_ARTS[G.heartArt] || {};
    const passives = G.passives || [];
    const sets = this._ctx.getActiveSets();

    // 1. Hero ATB & Qi regen
    const heroRate = 10 + this._getEffectiveSpeed() * 1.15;
    S.heroAtb = Math.min(100, S.heroAtb + heroRate * dt);
    G.qi = Math.min(G.maxQi, G.qi + (2.4 + (G.sense || 10) * 0.12) * dt);
    if (S.counterTimer > 0) S.counterTimer = Math.max(0, S.counterTimer - dt);

    // 2. Enemy ATB & Broken state (No enemy intent preview!)
    if (e.brokenTimer > 0) {
      e.brokenTimer = Math.max(0, e.brokenTimer - dt);
      if (e.brokenTimer === 0) e.poise = e.maxPoise;
    } else {
      let eRate = 8.5 + e.speed * 1.05;
      if (e.poison > 0 && passives.includes('p_venom_mist')) eRate *= 0.85;
      e.atb += eRate * dt;
      if (e.atb >= 100) {
        e.atb -= 100;
        this._enemyAttack();
        if (!this.state) return;
      }
    }

    // 3. Poison ticking every 2.0s
    if (e.poison > 0) {
      S.poisonTickAcc += dt;
      if (S.poisonTickAcc >= 2.0) {
        S.poisonTickAcc = 0;
        const eq = this._ctx.getEquipStats();
        let pDmg = Math.max(4, Math.round(e.poison * 5.2 * (ha.poisonBonus ? 1.3 : 1) * (sets.venom >= 4 ? 1.45 : 1)));
        let pCrit = false;
        if (eq.uniqueEffects.includes('poison_crit') && Math.random() < (0.12 + (G.luck || 10) * 0.012 + (eq.crit || 0))) {
          pDmg = Math.round(pDmg * 1.6); pCrit = true;
        }
        e.hp = Math.max(0, e.hp - pDmg);
        this._spawnFloat('.c-actor.enemy', `${pCrit ? '毒暴 ' : '毒 '}-${pDmg}`, '#70d6ab');
        if (e.hp <= 0) { this._handleWin(); return; }
      }
    }

    // 4. Companion ATB
    if (G.activeAlly) {
      const aRate = (11 + (G.speed || 10) * 0.45) * (passives.includes('p_beast_bond') ? 1.25 : 1);
      S.allyAtb += aRate * dt;
      if (S.allyAtb >= 100) {
        S.allyAtb = 0;
        const allyDef = this._ctx.getAllyDef(G.activeAlly);
        const allySt = G.allies[G.activeAlly];
        let dmg = Math.round((allySt?.power || allyDef.power) * (1 + (ha.petBonus || 0)) * (0.9 + Math.random() * 0.25));
        if (e.brokenTimer > 0) dmg = Math.round(dmg * 1.4);
        e.hp = Math.max(0, e.hp - dmg);
        e.poise = Math.max(0, e.poise - 10);
        FX.slash('#82d2ff', 0.72, 0.44);
        this._spawnFloat('.c-actor.enemy', `-${dmg}`, '#82d2ff');
        S.ticker = `道友【${allyDef.name}】随行出手，造成 ${dmg} 点伤害！`;
        if (e.hp <= 0) { this._handleWin(); return; }
      }
    }

    // 5. Spirit Beast ATB
    if (S.beastObj && S.beastDef) {
      const bRate = (10 + S.beastDef.baseSpeed * 0.9 + S.beastObj.lv * 0.4) * (passives.includes('p_beast_bond') ? 1.25 : 1);
      S.beastAtb += bRate * dt;
      if (S.beastAtb >= 100) {
        S.beastAtb = 0;
        this._beastAct();
        if (!this.state) return;
      }
    }

    // 6. External Treasures (2 slots: auto-floating & active cooldowns)
    S.treasures.forEach((tr, idx) => {
      if (!tr) return;
      if (tr.cdLeft > 0) tr.cdLeft = Math.max(0, tr.cdLeft - dt);
      if (tr.def.mode === 'auto' && tr.cdLeft <= 0) {
        tr.cdLeft = tr.def.cd;
        const senseMul = 1 + (G.sense || 10) * 0.025;
        let tdmg = Math.round((tr.def.dmg || 0) * senseMul);
        if (e.brokenTimer > 0) tdmg = Math.round(tdmg * 1.4);
        if (tdmg > 0) {
          e.hp = Math.max(0, e.hp - tdmg);
          this._spawnFloat('.c-actor.enemy', `法宝 -${tdmg}`, '#ebd29b');
        }
        if (tr.def.poiseDmg) this._damageEnemyPoise(tr.def.poiseDmg);
        if (tr.def.poison) e.poison += tr.def.poison;
        FX.burst('235,210,155', 14, 0.72, 0.46);
        S.ticker = `悬浮法宝【${tr.def.name}】自动飞出，击中 ${e.name}${tdmg ? ` (-${tdmg})` : ''}${tr.def.poison ? ` 叠毒+${tr.def.poison}` : ''}！`;
        if (e.hp <= 0) { this._handleWin(); return; }
      }
    });

    this._syncBars();
  },

  _damageEnemyPoise(amt) {
    const e = this.state?.enemy;
    if (!e || e.brokenTimer > 0) return;
    e.poise = Math.max(0, e.poise - amt);
    if (e.poise <= 0) {
      e.brokenTimer = 4.5;
      e.atb = Math.max(0, e.atb - 35);
      SFX.play('thunder');
      triggerShake();
      this.state.ticker = `【破防失守】击碎 ${e.name} 护体定力！4.5秒内承伤 +40%！`;
    }
  },

  _beastAct() {
    const S = this.state, { G, D } = this._ctx, e = S.enemy;
    const ha = D.HEART_ARTS[G.heartArt] || {};
    const b = S.beastObj, def = S.beastDef;
    const mul = (1 + (b.lv - 1) * 0.18 + (b.stage || 0) * 0.35) * (1 + (ha.petBonus || 0));
    const ef = def.skillEffect || {};
    let dmg = Math.round(def.baseAtk * mul);
    if (ef.critBonus && Math.random() < (0.15 + ef.critBonus)) dmg = Math.round(dmg * 1.55);
    if (e.brokenTimer > 0) dmg = Math.round(dmg * 1.4);

    if (ef.heal) {
      const h = Math.round(ef.heal * mul);
      G.hp = Math.min(G.maxHp, G.hp + h);
      if (ef.boostHeroAtb) S.heroAtb = Math.min(100, S.heroAtb + ef.boostHeroAtb);
      this._spawnFloat('.c-actor.hero', `+${h}`, '#70d6ab');
      S.ticker = `灵兽【${def.name}】施展${def.skillName}，疗伤 +${h} 并加速集气！`;
    } else if (ef.shield) {
      const sh = Math.round(ef.shield * mul);
      S.shield += sh;
      e.hp = Math.max(0, e.hp - dmg);
      this._spawnFloat('.c-actor.enemy', `-${dmg}`, '#ebd29b');
      S.ticker = `灵兽【${def.name}】施展${def.skillName}，护盾 +${sh}，反撞 -${dmg}！`;
    } else {
      e.hp = Math.max(0, e.hp - dmg);
      if (ef.poison) e.poison += ef.poison;
      if (ef.poiseDmg) this._damageEnemyPoise(ef.poiseDmg);
      this._spawnFloat('.c-actor.enemy', `灵兽 -${dmg}`, '#ffcf86');
      S.ticker = `灵兽【${def.name}】扑击施展${def.skillName}，造成 ${dmg} 点伤害${ef.poison ? `，叠毒+${ef.poison}` : ''}！`;
    }
    FX.burst('240,200,130', 14, 0.7, 0.5);
    if (e.hp <= 0) this._handleWin();
  },

  useSkill(skillId) {
    const S = this.state;
    if (!S) return;
    const { G, D } = this._ctx;
    const sk = D.SKILLS[skillId];
    if (!sk) return;
    if (S.heroAtb < sk.atbCost) return showToast(`集气不足（需 ${sk.atbCost}，当前 ${Math.floor(S.heroAtb)}）。`);
    if (G.qi < sk.qiCost) return showToast(`灵力不足 ${sk.qiCost}。`);

    S.heroAtb = Math.max(0, S.heroAtb - sk.atbCost);
    G.qi = Math.max(0, G.qi - sk.qiCost);

    const e = S.enemy;
    const eq = this._ctx.getEquipStats();
    const ha = D.HEART_ARTS[G.heartArt] || {};
    const passives = G.passives || [];
    const sets = this._ctx.getActiveSets();

    // Mastery multipliers: single-skill level (1~4) + category total mastery (0~100)
    const prof = this._ctx.gainSkillProf(skillId, 18);
    const catTotal = this._ctx.getCatMastery(sk.cat);
    const elemVal = (G.elements && G.elements[sk.elem]) || 50;
    const masteryMul = (1 + (prof.lv - 1) * 0.14) * (1 + catTotal * 0.008) * (0.85 + elemVal * 0.004);

    let baseAtk = (G.body || 10) * 1.9 + (G.sense || 10) * 1.2 + (ha.atkBonus || 0) + (eq.atk || 0);
    let dmg = Math.round(baseAtk * sk.power * masteryMul);

    // Build modifiers
    if (sets.qingyun >= 2 && sk.cat === 'sword') dmg = Math.round(dmg * 1.12);
    if (passives.includes('p_heavy_force') && sk.atbCost >= 70) dmg = Math.round(dmg * 1.28);
    const hpRatio = G.hp / Math.max(1, G.maxHp);
    if (ha.berserk || sk.berserkScale) dmg = Math.round(dmg * (1 + (1 - hpRatio) * 0.65));
    if (sets.blood >= 4 && hpRatio < 0.5) dmg = Math.round(dmg * 1.35);
    if (sk.shieldDmg && S.shield > 0) dmg += Math.round(S.shield * sk.shieldDmg);

    // Poison detonation
    if (sk.detonatePoison && e.poison > 0) {
      const detDmg = Math.round(e.poison * 18 * (sets.venom >= 4 ? 1.45 : 1));
      dmg += detDmg;
      e.poison = sets.venom >= 4 ? Math.ceil(e.poison * 0.5) : 0;
    }

    // Crit check
    const critChance = Math.min(0.85, 0.08 + (G.luck || 10) * 0.01 + (eq.crit || 0) + (ha.critBonus || 0) + (sk.critBonus || 0) + (sets.qingyun >= 2 ? 0.10 : 0));
    let isCrit = false;
    if (dmg > 0 && Math.random() < critChance) {
      isCrit = true;
      dmg = Math.round(dmg * (passives.includes('p_crit_edge') ? 1.85 : 1.5));
      if (passives.includes('p_crit_edge')) S.heroAtb = Math.min(100, S.heroAtb + 12);
      if (sets.qingyun >= 4) { S.heroAtb = Math.min(100, S.heroAtb + 15); G.qi = Math.min(G.maxQi, G.qi + 8); }
    }

    if (e.brokenTimer > 0) dmg = Math.round(dmg * 1.4);
    if (eq.uniqueEffects.includes('heavy_poise') && sk.atbCost >= 70) dmg = Math.round(dmg * 1.25);

    // Apply skill secondary effects
    if (sk.shield) S.shield += sk.shield;
    if (sk.slowEnemy) e.atb = Math.max(0, e.atb - sk.slowEnemy);
    if (sk.healTeam) {
      G.hp = Math.min(G.maxHp, G.hp + sk.healTeam);
      this._spawnFloat('.c-actor.hero', `+${sk.healTeam}`, '#70d6ab');
    }
    if (sk.boostAllyAtb) {
      S.allyAtb = Math.min(100, S.allyAtb + sk.boostAllyAtb);
      S.beastAtb = Math.min(100, S.beastAtb + sk.boostAllyAtb);
    }

    // Drain HP / Lifesteal
    let healAmt = (sk.drainHp || 0) + (passives.includes('p_blood_fury') && hpRatio < 0.5 ? 10 : 0);
    if (ha.berserk) healAmt += Math.round(dmg * 0.12);
    if (sets.blood >= 2) healAmt += Math.round(dmg * 0.10);
    if (healAmt > 0) G.hp = Math.min(G.maxHp, G.hp + healAmt);

    // Poison stacking
    let addPois = (sk.poison || 0) + (ha.poisonBonus || 0) + (passives.includes('p_venom_mist') ? 1 : 0) + (sets.venom >= 2 ? 2 : 0);
    if (addPois > 0) e.poison += addPois;

    // Apply damage & poise
    e.hp = Math.max(0, e.hp - dmg);
    let poiseDmg = (sk.poiseDmg || 12) * (passives.includes('p_heavy_force') && sk.atbCost >= 70 ? 1.4 : 1);
    if (eq.uniqueEffects.includes('heavy_poise') && sk.atbCost >= 70) poiseDmg *= 2;
    this._damageEnemyPoise(Math.round(poiseDmg));

    SFX.play(sk.atbCost >= 85 ? 'thunder' : 'sword');
    FX.slash(sk.elem === 'water' ? '#82d2ff' : (sk.elem === 'wood' ? '#70d6ab' : '#ebd29b'), 0.72, 0.45);
    FX.burst(isCrit ? '255,220,130' : '220,195,140', isCrit ? 30 : 18, 0.72, 0.45);
    triggerShake();
    this._spawnFloat('.c-actor.enemy', `${isCrit ? '暴击 ' : ''}-${dmg}`, isCrit ? '#ffe49c' : '#fff');
    S.ticker = `${isCrit ? '【会心暴击】' : ''}施展【${sk.name}】造成 ${dmg} 点伤害${addPois ? `（叠毒+${addPois}）` : ''}！`;

    if (e.hp <= 0) { this._handleWin(); return; }
    this._syncBars();
  },

  useCounter() {
    const S = this.state;
    if (!S) return;
    const { G } = this._ctx;
    if (S.heroAtb < 30) return showToast('化劲架招需 30 集气。');
    if (G.qi < 8) return showToast('灵力不足 8。');
    S.heroAtb -= 30; G.qi -= 8;
    const passives = G.passives || [];
    const sets = this._ctx.getActiveSets();
    const sh = 32 + (passives.includes('p_thorns_shell') ? 35 : 0) + (sets.iron >= 4 ? 45 : 0);
    S.shield += sh;
    S.counterTimer = 2.8;
    SFX.play('click');
    S.ticker = `摆出【化劲架招】姿态！获 ${sh} 灵盾，2.8秒内受击大幅减伤并立即反震！`;
    this._syncBars();
  },

  useTreasure(slotIdx) {
    const S = this.state;
    if (!S) return;
    const tr = S.treasures[slotIdx];
    if (!tr || tr.def.mode !== 'active') return;
    if (tr.cdLeft > 0) return showToast(`法宝冷却中（余 ${tr.cdLeft.toFixed(1)} 秒）。`);
    const { G } = this._ctx, e = S.enemy;
    tr.cdLeft = tr.def.cd;
    const senseMul = 1 + (G.sense || 10) * 0.025;
    if (tr.def.shield) S.shield += Math.round(tr.def.shield * senseMul);
    if (tr.def.heal) {
      const h = Math.round(tr.def.heal * senseMul);
      G.hp = Math.min(G.maxHp, G.hp + h);
      this._spawnFloat('.c-actor.hero', `+${h}`, '#70d6ab');
    }
    if (tr.def.qi) G.qi = Math.min(G.maxQi, G.qi + tr.def.qi);
    if (tr.def.dmg) {
      const d = Math.round(tr.def.dmg * senseMul);
      e.hp = Math.max(0, e.hp - d);
      this._spawnFloat('.c-actor.enemy', `法宝 -${d}`, '#ebd29b');
    }
    if (tr.def.poiseDmg) this._damageEnemyPoise(tr.def.poiseDmg);
    if (tr.def.knockAtb) e.atb = Math.max(0, e.atb - tr.def.knockAtb);
    SFX.play('thunder'); FX.burst('130,210,255', 26, 0.68, 0.45); triggerShake();
    S.ticker = `祭出外物法宝【${tr.def.name}】！`;
    if (e.hp <= 0) { this._handleWin(); return; }
    this._syncBars();
  },

  _enemyAttack() {
    const S = this.state, { G, D } = this._ctx, e = S.enemy;
    const eq = this._ctx.getEquipStats();
    const ha = D.HEART_ARTS[G.heartArt] || {};
    const passives = G.passives || [];
    const sets = this._ctx.getActiveSets();

    const dodgeChance = Math.min(0.55, (eq.dodge || 0) + Math.max(0, ((G.speed || 10) - 10) * 0.008));
    if (S.counterTimer <= 0 && Math.random() < dodgeChance) {
      S.heroAtb = Math.min(100, S.heroAtb + 22);
      this._spawnFloat('.c-actor.hero', '身法闪避', '#82d2ff');
      S.ticker = `凭高超遁速闪避了 ${e.name} 的攻势，返还 +22 集气！`;
      this._syncBars();
      return;
    }

    let raw = Math.max(6, e.atk - Math.floor((G.body || 10) * 0.35) - (ha.defBonus || 0) - (eq.def || 0) - (sets.iron >= 2 ? 12 : 0) + Math.floor(Math.random() * 6));
    let counterMsg = '';
    if (S.counterTimer > 0) {
      raw = Math.max(3, Math.round(raw * 0.42));
      const cDmg = Math.round(raw * 1.4 + S.shield * 0.35);
      e.hp = Math.max(0, e.hp - cDmg);
      this._damageEnemyPoise(22);
      this._spawnFloat('.c-actor.enemy', `化劲反击 -${cDmg}`, '#ebd29b');
      counterMsg = `（化劲卸力反击 -${cDmg}！）`;
    }

    // Reflect damage if shield / reflect build
    const refRate = (ha.reflect || 0) + (passives.includes('p_thorns_shell') ? 0.30 : 0) + (sets.iron >= 4 ? 0.35 : 0);
    if (refRate > 0 && S.shield > 0) {
      const rDmg = Math.max(5, Math.round(raw * refRate + S.shield * 0.15));
      e.hp = Math.max(0, e.hp - rDmg);
      this._spawnFloat('.c-actor.enemy', `反伤 -${rDmg}`, '#e89668');
    }

    let dmg = raw;
    if (S.shield > 0) {
      const ab = Math.min(S.shield, dmg); S.shield -= ab; dmg -= ab;
    }
    G.hp = Math.max(0, G.hp - dmg);
    if (dmg > 0) this._spawnFloat('.c-actor.hero', `-${dmg}`, '#ff8080');
    S.ticker = `${e.name} 攻势袭来造成 ${dmg} 点伤害${counterMsg}。`;

    // Cheat death unique item!
    if (G.hp <= 0 && !S.cheatDeathUsed && eq.uniqueEffects.includes('cheat_death')) {
      S.cheatDeathUsed = true;
      G.hp = Math.max(20, Math.round(G.maxHp * 0.2));
      S.heroAtb = 100;
      SFX.play('levelup');
      this._spawnFloat('.c-actor.hero', '不灭血衣·免死!', '#ffe49c');
      S.ticker = '【绝世孤品·不灭血衣】触发！免疫致命伤并瞬间满集气！';
      this._syncBars();
      return;
    }

    if (e.hp <= 0) { this._handleWin(); return; }
    if (G.hp <= 0) {
      if (G.activeAlly) this._ctx.setAllyExpr(G.activeAlly, 'injured');
      G.hp = Math.floor(G.maxHp * 0.5); G.qi = Math.floor(G.maxQi * 0.5);
      this.stop();
      showToast('力竭败退，幸得脱身休整。');
      this._ctx.onBattleEnd();
      return;
    }
    this._syncBars();
  },

  _handleWin() {
    const e = this.state.enemy;
    const wonTrib = e.isTribulation;
    const onWin = e.onWin;
    const expReward = e.expReward || 0;
    const stoneReward = e.stoneReward || 0;
    const beastObj = this.state.beastObj;
    this.stop();
    const { G } = this._ctx;
    const expG = expReward ? this._ctx.gainExp(expReward) : 0;
    G.stone += stoneReward; G.fame += 5;
    if (beastObj) {
      beastObj.exp = (beastObj.exp || 0) + 30;
      if (beastObj.exp >= beastObj.lv * 40) { beastObj.exp -= beastObj.lv * 40; beastObj.lv++; }
    }
    if (wonTrib) this._ctx.tryRealmUp(true);
    else {
      SFX.play('levelup');
      if (onWin) onWin();
      else showToast(`得胜！修为 +${expG}，灵石 +${stoneReward}。`);
    }
    this._ctx.saveGame('auto', true);
    this._ctx.onBattleEnd();
  },

  _spawnFloat(sel, text, color = '#ffe49c') {
    const slot = document.querySelector(sel);
    if (!slot) return;
    const el = document.createElement('div');
    el.className = 'dmg-float';
    el.style.color = color;
    el.textContent = text;
    slot.appendChild(el);
    setTimeout(() => el.remove(), 880);
  },

  _mountUi() {
    const cl = document.getElementById('combat-root');
    cl.innerHTML = '';
    const S = this.state, { G, D, ASSETS } = this._ctx, e = S.enemy;
    const allyHtml = G.activeAlly ? `<div class="c-actor ally"><img src="${this._ctx.getAllyAsset(G.activeAlly, 'fierce')}" /></div>` : '';
    const beastHtml = S.beastDef ? `<div class="c-actor beast"><img src="${ASSETS[S.beastDef.asset]}" /><span class="actor-tag">${S.beastDef.name}</span></div>` : '';
    const floatBadges = S.treasures.filter(t => t && t.def.mode === 'auto')
      .map(t => `<span class="float-tr-pill">悬浮 · ${t.def.name}</span>`).join('');

    const cb = document.createElement('div');
    cb.className = 'combat-layer';
    cb.innerHTML = `
      <div class="combat-top">
        <div class="c-side">
          <div class="c-head">
            <span>${G.name}${G.activeAlly ? ' · ' + this._ctx.getAllyDef(G.activeAlly).name : ''}</span>
            <span id="cb-hero-meta" style="font-size:10.5px;color:var(--jade);"></span>
          </div>
          <div class="c-track"><div class="c-fill-hp hero" id="cb-hero-hp" style="width:100%"></div></div>
          <div class="c-track qi"><div class="c-fill-qi" id="cb-hero-qi" style="width:100%"></div></div>
          <div class="c-track atb"><div class="c-fill-atb" id="cb-hero-atb" style="width:45%"></div></div>
        </div>
        <div class="c-vs">斗法</div>
        <div class="c-side">
          <div class="c-head">
            <span style="color:#ff9494;">${e.name}</span>
            <span id="cb-enemy-meta" style="font-size:10.5px;color:var(--muted);"></span>
          </div>
          <div class="c-track"><div class="c-fill-hp" id="cb-enemy-hp" style="width:100%"></div></div>
          <div class="c-track poise"><div class="c-fill-poise" id="cb-enemy-poise" style="width:100%"></div></div>
          <div class="c-track atb"><div class="c-fill-atb enemy" id="cb-enemy-atb" style="width:15%"></div></div>
        </div>
      </div>
      <div class="combat-stage">
        <div class="c-party">
          <div class="c-actor hero"><img src="${ASSETS.hero}" /></div>
          ${allyHtml}
          ${beastHtml}
          <div class="float-tr-wrap">${floatBadges}</div>
        </div>
        <div class="c-actor enemy"><img src="${e.asset || ASSETS.wolf_boss}" /></div>
      </div>
      <div class="combat-bottom">
        <div class="combat-ticker" id="cb-ticker">${S.ticker}</div>
        <div class="talisman-bar v6" id="talisman-bar"></div>
      </div>
    `;
    const tb = cb.querySelector('#talisman-bar');

    // 4 Active Battle Skills (each with its own ATB cost!)
    G.skills.slice(0, 4).forEach(sid => {
      const sk = D.SKILLS[sid];
      if (!sk) return;
      const b = document.createElement('button');
      b.className = 'talisman-btn';
      b.dataset.skId = sid;
      b.innerHTML = `<span class="t-name">${sk.name}</span><span class="t-sub">集气 ${sk.atbCost} · 灵 ${sk.qiCost}</span>`;
      b.onclick = () => this.useSkill(sid);
      tb.appendChild(b);
    });

    // Counter / Parry button
    const ctr = document.createElement('button');
    ctr.className = 'talisman-btn counter';
    ctr.id = 'cb-btn-counter';
    ctr.innerHTML = `<span class="t-name">化劲架招</span><span class="t-sub">集气 30 · 叠盾反击</span>`;
    ctr.onclick = () => this.useCounter();
    tb.appendChild(ctr);

    // Active External Treasures (up to 2)
    S.treasures.forEach((tr, idx) => {
      if (!tr || tr.def.mode !== 'active') return;
      const ab = document.createElement('button');
      ab.className = 'talisman-btn artifact';
      ab.dataset.trIdx = String(idx);
      ab.innerHTML = `<span class="t-name">${tr.def.name.slice(0, 5)}</span><span class="t-sub" id="cb-tr-sub-${idx}">就绪</span>`;
      ab.onclick = () => this.useTreasure(idx);
      tb.appendChild(ab);
    });

    // Retreat
    const fb = document.createElement('button');
    fb.className = 'talisman-btn ghost';
    fb.innerHTML = `<span class="t-name">遁走</span><span class="t-sub">暂避锋芒</span>`;
    fb.onclick = () => { this.stop(); showToast('借地形遁走脱身。'); this._ctx.onBattleEnd(); };
    tb.appendChild(fb);

    cl.appendChild(cb);
    this._syncBars();
  },

  _syncBars() {
    const S = this.state;
    if (!S) return;
    const { G, D } = this._ctx, e = S.enemy;
    const setW = (id, pct) => { const el = document.getElementById(id); if (el) el.style.width = Math.max(0, Math.min(100, pct)) + '%'; };
    setW('cb-hero-hp', (G.hp / Math.max(1, G.maxHp)) * 100);
    setW('cb-hero-qi', (G.qi / Math.max(1, G.maxQi)) * 100);
    setW('cb-hero-atb', S.heroAtb);
    setW('cb-enemy-hp', (e.hp / Math.max(1, e.maxHp)) * 100);
    setW('cb-enemy-poise', (e.poise / Math.max(1, e.maxPoise)) * 100);
    setW('cb-enemy-atb', e.atb);

    const hm = document.getElementById('cb-hero-meta');
    if (hm) hm.textContent = `${G.hp}/${G.maxHp} · 盾${S.shield}${S.counterTimer > 0 ? ' · 架招中' : ''} · 集气${Math.floor(S.heroAtb)}`;
    const em = document.getElementById('cb-enemy-meta');
    if (em) em.textContent = `${e.hp}/${e.maxHp}${e.poison > 0 ? ` · 毒${e.poison}层` : ''}${e.brokenTimer > 0 ? ' · 破防!' : ''}`;
    const tk = document.getElementById('cb-ticker');
    if (tk) tk.textContent = S.ticker;

    // Update skill button readiness in real time
    document.querySelectorAll('#talisman-bar [data-sk-id]').forEach(btn => {
      const sk = D.SKILLS[btn.dataset.skId];
      const ready = sk && S.heroAtb >= sk.atbCost && G.qi >= sk.qiCost;
      btn.classList.toggle('ready', ready);
      btn.classList.toggle('disabled', !ready);
    });
    const cBtn = document.getElementById('cb-btn-counter');
    if (cBtn) {
      const cReady = S.heroAtb >= 30 && G.qi >= 8;
      cBtn.classList.toggle('ready', cReady);
      cBtn.classList.toggle('disabled', !cReady);
    }
    S.treasures.forEach((tr, idx) => {
      if (!tr || tr.def.mode !== 'active') return;
      const sub = document.getElementById(`cb-tr-sub-${idx}`);
      if (sub) sub.textContent = tr.cdLeft > 0 ? `冷却 ${tr.cdLeft.toFixed(1)}s` : '外物就绪';
      const btn = document.querySelector(`#talisman-bar [data-tr-idx="${idx}"]`);
      if (btn) btn.classList.toggle('disabled', tr.cdLeft > 0);
    });
  }
};
