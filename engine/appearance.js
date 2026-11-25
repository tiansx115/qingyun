// ===== 寿元骨龄容貌映射、破境返老还童、驻颜丹与太素驻颜术系统 (v8.2.0) =====
window.APPEARANCE = (function() {
  const STAGES = [
    { id: 1, min: 0,  max: 19, name: '少年意气', short: '少年', hair: '乌发束冠', desc: '眉目清澈，意气风发', css: 'age-stage-1' },
    { id: 2, min: 20, max: 32, name: '青年鼎盛', short: '青年', hair: '青丝如墨', desc: '气血充盈，风华正茂', css: 'age-stage-2' },
    { id: 3, min: 33, max: 49, name: '壮年沉稳', short: '壮年', hair: '墨发如漆', desc: '轮廓深邃，宗师气度', css: 'age-stage-3' },
    { id: 4, min: 50, max: 69, name: '两鬓微霜', short: '霜鬓', hair: '两鬓斑白', desc: '鬓角染霜，道韵沧桑', css: 'age-stage-4' },
    { id: 5, min: 70, max: 999, name: '鹤发垂暮', short: '暮年', hair: '满头霜雪', desc: '鹤发鸡皮，暮气渐生', css: 'age-stage-5' }
  ];

  // 18岁成年锚点 · 两段式寿命百分比折算公式（彻底杜绝低龄破境退化成婴儿的漏洞！）
  // 18岁前按自然骨龄；18岁后按 ((age-18)/(maxAge-18))^1.28 映射至凡人 18~95 岁
  // 验算：1000岁寿元800岁 -> 76岁(暮年鹤发)；破境至3000岁寿元仍800岁 -> 32岁(青年鼎盛·白发转青丝！)
  function calcNaturalVisualAge(age, maxAge) {
    const a = Math.max(12, Number(age) || 16);
    const m = Math.max(a + 1, Number(maxAge) || 100);
    if (a <= 18) return Math.round(a);
    const ratio = Math.max(0, Math.min(1, (a - 18) / Math.max(12, m - 18)));
    const curved = Math.pow(ratio, 1.28);
    return Math.round(18 + curved * 77);
  }

  function getStageByVisualAge(vAge) {
    for (let i = 0; i < STAGES.length; i++) {
      if (vAge >= STAGES[i].min && vAge <= STAGES[i].max) return STAGES[i];
    }
    return STAGES[STAGES.length - 1];
  }

  function getProfile(entity, totalDays) {
    const age = Number(entity?.age) || 16;
    const maxAge = Math.max(age + 1, Number(entity?.maxAge) || 100);
    const lifeRatio = Math.min(1, age / maxAge);
    const fiveDecay = lifeRatio >= 0.92;
    const naturalAge = calcNaturalVisualAge(age, maxAge);
    const nowDay = typeof totalDays === 'number' ? totalDays : (entity?.totalDays || 1);

    let locked = false;
    let lockInfo = null;
    let displayAge = naturalAge;
    if (entity && entity.youthLock && entity.youthLock.expireDay > nowDay) {
      locked = true;
      lockInfo = entity.youthLock;
      displayAge = Math.max(16, Math.min(95, Number(entity.youthLock.lockedVisualAge) || naturalAge));
    }

    const stage = getStageByVisualAge(displayAge);
    const naturalStage = getStageByVisualAge(naturalAge);
    const remainYears = locked ? Math.max(0.1, +((lockInfo.expireDay - nowDay) / 360).toFixed(1)) : 0;

    return {
      age,
      maxAge,
      lifePct: Math.round(lifeRatio * 100),
      naturalAge,
      displayAge,
      stage,
      naturalStage,
      fiveDecay,
      locked,
      lockType: locked ? lockInfo.type : null,
      lockName: locked ? lockInfo.name : null,
      remainYears,
      mpSealPct: (locked && lockInfo.type === 'art') ? (lockInfo.mpSealPct || 0.05) : 0,
      cssClasses: `${stage.css}${fiveDecay ? ' five-decay' : ''}${locked ? ' youth-locked' : ''}`
    };
  }

  // 服用驻颜丹 / 冰肌返春仙丹
  function applyYouthPill(G, pillDef) {
    const nowDay = G.totalDays || 1;
    const natAge = calcNaturalVisualAge(G.age, G.maxAge);
    const targetAge = pillDef.rejuvAge ? Math.min(natAge, pillDef.rejuvAge) : natAge;
    const durYears = pillDef.youthYears || 40;
    G.youthLock = {
      type: 'pill',
      name: pillDef.name,
      lockedVisualAge: Math.max(16, targetAge),
      expireDay: nowDay + durYears * 360,
      mpSealPct: 0
    };
    const st = getStageByVisualAge(G.youthLock.lockedVisualAge);
    return {
      lockedAge: G.youthLock.lockedVisualAge,
      stageName: st.name,
      durYears,
      rejuvenated: natAge - G.youthLock.lockedVisualAge >= 5
    };
  }

  // 开启 / 散去【太素驻颜术】（常驻封印 5% 法力上限，每次施展维持 20 载，战斗濒死 HP<15% 破功！）
  function toggleYouthArt(ctx) {
    const { G, SFX, recalcDerivedStats, showToast, saveGame, renderAll } = ctx;
    if (!G.hasYouthArt) {
      showToast('尚未习得【太素驻颜诀】，可于藏经阁、鬼市或隐世丹鼎神谷寻觅秘籍。');
      return;
    }
    const nowDay = G.totalDays || 1;
    if (G.youthLock && G.youthLock.type === 'art' && G.youthLock.expireDay > nowDay) {
      const oldAge = G.youthLock.lockedVisualAge;
      delete G.youthLock;
      recalcDerivedStats(false);
      const natAge = calcNaturalVisualAge(G.age, G.maxAge);
      SFX && SFX.play('click');
      showToast(`已散去【太素驻颜术】，解除 5% 法力封印，容貌归真（约 ${natAge} 岁${natAge - oldAge >= 12 ? '，青丝渐生霜意' : ''}）。`);
      saveGame && saveGame('auto', true);
      renderAll && renderAll();
      return;
    }
    const natAge = calcNaturalVisualAge(G.age, G.maxAge);
    const lockAge = Math.max(18, Math.min(natAge, 24));
    G.youthLock = {
      type: 'art',
      name: '太素驻颜术',
      lockedVisualAge: lockAge,
      expireDay: nowDay + 20 * 360,
      mpSealPct: 0.05
    };
    recalcDerivedStats(false);
    SFX && SFX.play('levelup');
    showToast(`运转【太素驻颜术】！封印 5% 法力上限，外显容貌定格于 ${lockAge} 岁（持续 20 载，重伤濒死时将破功）。`);
    saveGame && saveGame('auto', true);
    renderAll && renderAll();
  }

  // 每日时间推进检查驻颜到期反噬（玩家 & NPC 通用）
  function checkExpiration(entity, totalDays) {
    if (!entity || !entity.youthLock) return null;
    if (totalDays < entity.youthLock.expireDay) return null;
    const oldLock = entity.youthLock;
    delete entity.youthLock;
    const natAge = calcNaturalVisualAge(entity.age, entity.maxAge);
    const jump = natAge - (oldLock.lockedVisualAge || natAge);
    const stage = getStageByVisualAge(natAge);
    return {
      expiredName: oldLock.name,
      oldAge: oldLock.lockedVisualAge,
      naturalAge: natAge,
      jump,
      stage,
      dramatic: jump >= 15
    };
  }

  // 斗法重伤破功判定（HP < 15% 时【太素驻颜术】护体真元溃散，当场显露苍老真容！）
  function checkCombatShatter(entity, hpRatio, totalDays) {
    if (!entity || !entity.youthLock) return null;
    if (entity.youthLock.type !== 'art') return null;
    if (hpRatio >= 0.15) return null;
    const oldAge = entity.youthLock.lockedVisualAge;
    delete entity.youthLock;
    const natAge = calcNaturalVisualAge(entity.age, entity.maxAge);
    const stage = getStageByVisualAge(natAge);
    return {
      shattered: true,
      oldAge,
      naturalAge: natAge,
      stage,
      dramatic: natAge - oldAge >= 12
    };
  }

  // 破境洗髓返老还童检测
  function checkBreakthroughRejuv(G, prevMaxAge) {
    const oldAge = calcNaturalVisualAge(G.age, prevMaxAge);
    const newAge = calcNaturalVisualAge(G.age, G.maxAge);
    const oldStage = getStageByVisualAge(oldAge);
    const newStage = getStageByVisualAge(newAge);
    const drop = oldAge - newAge;
    if (drop >= 6 || newStage.id < oldStage.id) {
      return {
        rejuvenated: true,
        oldAge,
        newAge,
        oldStage,
        newStage,
        drop
      };
    }
    return null;
  }

  // 预留本地 RTX 5080 同脸五阶立绘槽位：若未来加入 hero_stage_1..5 图片则无缝切换，否则沿用底图+五阶气血滤镜
  function getHeroPortrait(G, ASSETS, preferFull) {
    const prof = getProfile(G, G?.totalDays || 1);
    const stKey = preferFull ? `hero_full_stage_${prof.stage.id}` : `hero_stage_${prof.stage.id}`;
    const src = (ASSETS && ASSETS[stKey]) || (preferFull ? ASSETS.hero_full : ASSETS.hero);
    return { src, prof };
  }

  return {
    STAGES,
    calcNaturalVisualAge,
    getStageByVisualAge,
    getProfile,
    applyYouthPill,
    toggleYouthArt,
    checkExpiration,
    checkCombatShatter,
    checkBreakthroughRejuv,
    getHeroPortrait
  };
})();
