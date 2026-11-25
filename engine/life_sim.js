/* ============================================================================
 * 《沧溟界》真实修仙模拟人生核心 (engine/life_sim.js)
 * 零 DOM 耦合 · 与 WorldCore 深度联动
 * 1. 废除单一好感度 → 4 维关系网 (trust信任 / dread敬畏 / hook人情把柄 / dao道念共鸣)
 * 2. 6 大类 18 种江湖交互动作（严格受 NPC 8维人格 + IQ/EQ/悟性 + 记忆分叉）
 * 3. NPC 主动 AI（设局、背刺、讨人情、雪中送炭、渡劫偷袭）
 * 4. 凡人父母/发小羁绊 + 肉身暗伤/丹毒/心魔 + 闭关《尘世变迁录》
 * ============================================================================ */
(function (root) {
  'use strict';

  // 6 大类 18 种江湖交互动作清单
  const SOCIAL_ACTIONS = [
    // ① 谋略算计
    { id: 'scheme_probe',    cat: '谋略算计', name: '设局套话',   desc: '借酒局或闲谈试探其秘宝/遗址坐标（比拼 IQ/EQ 与多疑度）' },
    { id: 'scheme_rumor',    cat: '谋略算计', name: '造谣离间',   desc: '散布流言挑拨其与宗门或盟友反目（高多疑极易中招）' },
    { id: 'scheme_extort',   cat: '谋略算计', name: '把柄勒索',   desc: '动用你握有的把柄/恩情(Hook)，强迫其交出功法或放行' },
    { id: 'scheme_false_ally', cat: '谋略算计', name: '借刀杀人', desc: '假意结盟引其与你的仇敌火并（高 IQ 者可能反手给你下套）' },
    // ② 组队与分赃
    { id: 'coop_ruin',       cat: '组队分赃', name: '签契探遗址', desc: '约定分赃比例合探古宗遗址（途中双方皆可能黑吃黑！）' },
    { id: 'coop_trade',      cat: '组队分赃', name: '倒卖紧缺货', desc: '利用跨洲物价差合伙倒卖灵矿/疗伤丹' },
    { id: 'coop_escort',     cat: '组队分赃', name: '雇佣护道',   desc: '花灵石或动用人情请其为你护法渡劫/远行' },
    // ③ 道途与传承
    { id: 'dao_debate',      cat: '道途传承', name: '论道印证',   desc: '切磋道韵（高悟性/低EQ 苦修痴人最爱，送礼反而掉敬重）' },
    { id: 'dao_swap_art',    cat: '道途传承', name: '残篇互换',   desc: '交换各自收藏的失传功法残卷，共同补全' },
    { id: 'dao_mentor',      cat: '道途传承', name: '拜师/收徒',  desc: '缔结师徒传承（受重义与道念共鸣主导）' },
    { id: 'dao_companion',   cat: '道途传承', name: '立道侣契',   desc: '结为双修道侣，共抗长生孤寂与寿元大劫' },
    // ④ 侠义与恩怨
    { id: 'honor_rescue',    cat: '侠义恩怨', name: '雪中送炭',   desc: '趁其重伤或窘迫时出手相助，直接结下生死人情(Hook+40)' },
    { id: 'honor_avenge',    cat: '侠义恩怨', name: '提仇首相见', desc: '带其仇敌信物/首级来见，瞬间赢得极高信任与道念共鸣' },
    { id: 'honor_duel',      cat: '侠义恩怨', name: '当众下战书', desc: '约战立威（刚烈者欣然应战，隐忍者表面认栽暗记死仇）' },
    // ⑤ 暗黑与魔道
    { id: 'dark_poison',     cat: '暗黑魔道', name: '暗中下毒/种煞', desc: '酒茶中暗下煞毒削其战力（被识破立刻结死仇+遭通缉）' },
    { id: 'dark_soulsearch', cat: '暗黑魔道', name: '搜魂夺忆',   desc: '击败后强行搜魂掠夺功法与秘境坐标（剧增心魔+正道通缉！）' },
    { id: 'dark_corrupt',    cat: '暗黑魔道', name: '诱其堕魔',   desc: '趁其道心失衡时传授血煞邪功，将其拉入魔道同盟' },
    // ⑥ 自由谈判
    { id: 'ai_free_talk',    cat: '自由谈判', name: 'DeepSeek 自由交涉', desc: '自由打字画大饼、讲利害、威胁或求情，由其 8 维人格现场裁定' }
  ];

  function ensureRel(hero, npcId) {
    hero.relations = hero.relations || {};
    if (!hero.relations[npcId]) {
      hero.relations[npcId] = {
        trust: 0,         // -100 ~ 100 信任
        dread: 0,         // 0 ~ 100 敬畏/恐惧
        hook: 0,          // -100 ~ 100 正=你握着他的把柄/恩情，负=他握着你的把柄
        daoResonance: 0,  // -100 ~ 100 道念共鸣
        history: []
      };
    }
    return hero.relations[npcId];
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function initHeroLife(hero, world) {
    const startPlate = (world && world.nodes && world.nodes.find(n => !n.isSea && n.pop > 0)) || { id: 'C1', name: '中陆·大平原①' };
    hero.life = {
      origin: hero.origin || '寒门村落',
      homePlateId: startPlate.id,
      homePlateName: startPlate.name,
      injuries: [],      // 永久暗伤，如 { name:'经脉暗裂', penalty:'修炼-15%' }
      pillToxin: 0,      // 0~100 丹毒积累（>60 污染灵根降低突破率）
      heartDemon: 0,     // 0~100 心魔值（违背道心/搜魂/血祭剧增，渡劫爆发）
      loneliness: 0,     // 0~100 闭关孤寂度（红尘炼心/访友清零）
      reputation: { mortal: 10, righteous: 0, demonic: 0, yao: 0 },
      obsessions: [
        { id: 'obs_1', text: `让故乡【${startPlate.name}】的凡人父母安享晚年`, done: false },
        { id: 'obs_2', text: '踏入筑基长生路，亲眼看看五洲七海', done: false }
      ],
      family: [
        { id: 'fam_father', role: '凡人父亲', name: (hero.name ? hero.name[0] : '林') + '远山', age: 44, maxAge: 68, alive: true, bond: 85 },
        { id: 'fam_mother', role: '凡人母亲', name: '温氏', age: 41, maxAge: 71, alive: true, bond: 90 },
        { id: 'fam_friend', role: '青梅竹马', name: '阿禾', age: 18, maxAge: 70, alive: true, bond: 78 }
      ],
      diary: [`第${world ? world.year : 1}年：你辞别【${startPlate.name}】的凡人父母，怀揣第一缕灵气踏上漫漫仙途。`]
    };
    hero.relations = hero.relations || {};
    return hero.life;
  }

  // ===== 执行 18 种江湖交互动作（严格受 8 维人格 + IQ/EQ/悟性 + 4 维关系分叉） =====
  function executeSocialAction(hero, npc, actionId, opts = {}) {
    const rel = ensureRel(hero, npc.id || npc.name);
    const p = npc.p || { yi: 0, kuang: 0, ren: 0, chi: 0, ao: 0, dao: 0, cheng: 0, pan: 0 };
    const hIQ = hero.iq || 70, hEQ = hero.eq || 65, hWit = hero.daoWit || 75;
    const nIQ = npc.iq || 70, nEQ = npc.eq || 65, nWit = npc.daoWit || 70;
    const life = hero.life || initHeroLife(hero, null);
    let outcome = '', success = true;

    switch (actionId) {
      case 'scheme_probe': {
        const edge = (hIQ + hEQ * 0.6) - (nIQ + (p.cheng < 0 ? -p.cheng * 0.5 : 0));
        if (edge > 5) {
          rel.hook = clamp(rel.hook + 18, -100, 100);
          outcome = `你不动声色借酒套话，成功从【${npc.name}】口中套出了一处隐秘灵脉/遗址线索（把柄/情报 +18）！`;
        } else {
          success = false;
          rel.trust = clamp(rel.trust - 22, -100, 100);
          outcome = `【${npc.name}】(IQ:${nIQ}·${npc.persLabel}) 一眼识破你在套话，反手留了个假消息并暗生戒心（信任 -22）！`;
        }
        break;
      }
      case 'scheme_rumor': {
        if (p.cheng <= -15 || hIQ > nIQ + 8) {
          rel.hook = clamp(rel.hook + 12, -100, 100);
          outcome = `流言精准戳中【${npc.name}】多疑软肋，他与原本的同门/盟友爆发猜忌，你坐收渔利！`;
        } else {
          success = false;
          rel.trust = clamp(rel.trust - 30, -100, 100);
          outcome = `【${npc.name}】赤诚笃信同道，查清流言源自于你，当场翻脸结仇（信任 -30）！`;
        }
        break;
      }
      case 'scheme_extort': {
        if (rel.hook >= 25 || rel.dread >= 45) {
          rel.hook = clamp(rel.hook - 25, -100, 100);
          rel.trust = clamp(rel.trust - 28, -100, 100);
          life.heartDemon = clamp(life.heartDemon + 6, 0, 100);
          outcome = `尽管【${npc.name}】对你恨得牙痒（信任 -28），但忌惮你握着的把柄/威势，被迫交出灵石与秘闻！`;
        } else if (p.ao >= 25) {
          success = false;
          rel.trust = clamp(rel.trust - 45, -100, 100);
          outcome = `【${npc.name}】生性刚烈，宁死不受胁迫，当场拔剑与你结下死仇（信任 -45）！`;
        } else {
          success = false;
          outcome = `你尚未握有【${npc.name}】足够分量的把柄（当前 Hook:${rel.hook}），敲诈失败。`;
        }
        break;
      }
      case 'dao_debate': {
        const witBonus = nWit >= 75 ? 24 : 12;
        rel.daoResonance = clamp(rel.daoResonance + witBonus, -100, 100);
        rel.trust = clamp(rel.trust + (nEQ < 55 ? 18 : 8), -100, 100);
        life.loneliness = Math.max(0, life.loneliness - 25);
        outcome = `你与【${npc.name}】烹茶论道三日，${nEQ < 55 ? '这位不善人情却痴迷大道的苦修引你为难得知己' : '彼此印证颇多'}（道念共鸣 +${witBonus}，孤寂大减）！`;
        break;
      }
      case 'honor_rescue': {
        rel.hook = clamp(rel.hook + 40, -100, 100);
        rel.trust = clamp(rel.trust + (p.yi >= 15 ? 35 : 15), -100, 100);
        life.reputation.righteous += 12;
        life.heartDemon = Math.max(0, life.heartDemon - 8);
        outcome = `你在危难之际向【${npc.name}】雪中送炭！${p.yi >= 15 ? '其重义铭记生死之恩' : '即便功利之徒也不得不欠下天大人情'}（人情Hook +40，信任大幅提升）！`;
        break;
      }
      case 'coop_ruin': {
        const betrayRisk = (p.yi <= -25 && p.ren <= -15 && rel.trust < 30 && rel.dread < 40);
        if (betrayRisk) {
          success = false;
          rel.trust = clamp(rel.trust - 60, -100, 100);
          life.injuries.push({ name: '遗址背刺旧创', penalty: '气血上限 -10%' });
          outcome = `【黑吃黑反转！】刚打开古宗密库，功利狠辣的【${npc.name}】竟反手关阵抢宝！你拼死突围留下暗伤，与他结下血海深仇！`;
        } else {
          rel.trust = clamp(rel.trust + 18, -100, 100);
          rel.daoResonance = clamp(rel.daoResonance + 10, -100, 100);
          outcome = `你与【${npc.name}】按灵契联手破开古宗禁制，平分宝藏，历经生死后信任倍增（信任 +18）！`;
        }
        break;
      }
      case 'dark_soulsearch': {
        rel.trust = -100; rel.dread = 100;
        life.heartDemon = clamp(life.heartDemon + 24, 0, 100);
        life.reputation.demonic += 25;
        life.reputation.righteous -= 30;
        outcome = `你对【${npc.name}】强行搜魂夺忆，掠走其毕生功法与秘境坐标——但凄厉惨叫化作浓烈心魔缠身（心魔 +24，正道声望 -30）！`;
        break;
      }
      case 'honor_duel': {
        rel.dread = clamp(rel.dread + 22, 0, 100);
        if (p.ao >= 20) {
          rel.daoResonance = clamp(rel.daoResonance + 15, -100, 100);
          outcome = `【${npc.name}】生性刚烈，酣战一场后反倒生出惺惺相惜之意（敬畏 +22，道念共鸣 +15）！`;
        } else {
          rel.trust = clamp(rel.trust - 25, -100, 100);
          outcome = `【${npc.name}】表面拱手认栽，暗地里却记下这笔羞辱，日后恐伺机报复（敬畏 +22，信任 -25）！`;
        }
        break;
      }
      default: {
        rel.trust = clamp(rel.trust + 6, -100, 100);
        outcome = `你与【${npc.name}】完成了江湖交互【${actionId}】，双方关系悄然生变。`;
      }
    }

    rel.history.unshift(outcome);
    if (rel.history.length > 8) rel.history.length = 8;
    if (npc.memories) npc.memories.push(outcome.slice(0, 60));
    life.diary.unshift(outcome);
    return { success, outcome, relation: Object.assign({}, rel) };
  }

  // ===== NPC 主动 AI：不站桩，按 8 维人格 + 4 维关系主动向玩家出招！ =====
  function rollProactiveNpcEvent(hero, npcs, rngNext) {
    const rand = rngNext || Math.random;
    const alive = (npcs || []).filter(n => n.alive);
    if (!alive.length) return null;
    const npc = alive[Math.floor(rand() * alive.length)];
    const rel = ensureRel(hero, npc.id || npc.name);
    const p = npc.p || { yi: 0, kuang: 0, ren: 0, ao: 0, cheng: 0 };

    // 1. 隐忍记仇者趁虚背刺
    if (rel.trust <= -35 && p.ao <= -10 && rand() < 0.45) {
      return {
        type: 'ambush', npcId: npc.id, npcName: npc.name,
        title: `【仇敌暗算】${npc.name} 隐忍多年后出手！`,
        desc: `当年与你结怨的【${npc.name}】(${npc.persLabel}) 暗中尾随多时，趁你闭关/独行之际突然布阵截杀！`
      };
    }
    // 2. 功利狠辣高智商者笑脸设局
    if (p.yi <= -25 && p.ren <= -15 && (npc.iq || 70) >= 75 && rand() < 0.35) {
      return {
        type: 'trap_invite', npcId: npc.id, npcName: npc.name,
        title: `【笑里藏刀】${npc.name} 主动邀你共探秘境`,
        desc: `【${npc.name}】笑脸相迎，声称发现一座未开的古宗遗府愿与你平分——但以他功利狠辣的心性，极可能是请你当探路炮灰！`
      };
    }
    // 3. 重义受恩者主动报恩/送情报
    if ((rel.hook >= 30 || rel.trust >= 45) && p.yi >= 15 && rand() < 0.45) {
      return {
        type: 'repay_favor', npcId: npc.id, npcName: npc.name,
        title: `【故人报恩】${npc.name} 千里传音送来急报`,
        desc: `铭记你昔日恩情的【${npc.name}】冒着风险传来密信：告知你某咽喉关隘即将开战，并附赠一份保命灵药！`
      };
    }
    return null;
  }

  // ===== 真实模拟人生时间推进：日常托管 + 同步推进世界 + 《闭关尘世变迁录》 =====
  function advanceLifeMonths(hero, world, months = 12, focusMode = 'seclude') {
    const life = hero.life || initHeroLife(hero, world);
    const changes = [];
    const yearsDelta = months / 12;

    // 1. 同步推进同源世界内核（闭关 15 年，外面的世界真的过了 15 年！）
    let worldRes = { worldEvents: [] };
    if (world && root.WorldCore && typeof root.WorldCore.stepPlayMonths === 'function') {
      worldRes = root.WorldCore.stepPlayMonths(world, months);
      if (worldRes.worldEvents.length) {
        changes.push(...worldRes.worldEvents.slice(0, 6));
      }
    }

    // 2. 主角生理、孤寂度与丹毒/心魔演化
    hero.age = +((hero.age || 18) + yearsDelta).toFixed(1);
    if (focusMode === 'seclude') {
      life.loneliness = clamp(life.loneliness + Math.round(yearsDelta * 12), 0, 100);
      if (life.loneliness >= 70) {
        life.heartDemon = clamp(life.heartDemon + 8, 0, 100);
        changes.push(`长年闭关不问世事，孤寂入骨，道心滋生心魔（心魔 ${life.heartDemon}）！`);
      }
    } else if (focusMode === 'mortal_life') {
      life.loneliness = Math.max(0, life.loneliness - 35);
      life.heartDemon = Math.max(0, life.heartDemon - 10);
      life.pillToxin = Math.max(0, life.pillToxin - 8);
      changes.push(`你入世红尘炼心，逛坊市、访故旧、观凡人悲欢，孤寂与丹毒悄然化解。`);
    } else if (focusMode === 'livelihood') {
      life.loneliness = Math.max(0, life.loneliness - 15);
      const earned = Math.round(months * 6);
      hero.stones = (hero.stones || 0) + earned;
      changes.push(`你在仙城画符采药谋生 ${months} 月，攒下 ${earned} 块灵石以维持洞府开销。`);
    }

    // 3. 凡人父母与发小自然衰老（长生者最戳心的“仙凡永隔”体验！）
    life.family.forEach(fm => {
      if (!fm.alive) return;
      fm.age = +(fm.age + yearsDelta).toFixed(1);
      if (fm.age >= fm.maxAge) {
        fm.alive = false;
        const msg = focusMode === 'seclude'
          ? `【仙凡永隔】你闭关未出之际，你的${fm.role}【${fm.name}】在故乡【${life.homePlateName}】油尽灯枯（享年 ${Math.round(fm.age)} 岁），临终托人留下一枚旧玉佩，你终究错过了最后一面……`
          : `【送终辞别】你的${fm.role}【${fm.name}】安详离世（享年 ${Math.round(fm.age)} 岁），你亲手为其立碑安葬，道心既痛且明。`;
        changes.push(msg);
        life.diary.unshift(msg);
        if (focusMode === 'seclude') life.heartDemon = clamp(life.heartDemon + 12, 0, 100);
      } else if (fm.age >= fm.maxAge - 4 && !fm.warned) {
        fm.warned = true;
        changes.push(`【家书急报】故乡传来家书：你的${fm.role}【${fm.name}】年事已高（${Math.round(fm.age)}岁），常在村口远望仙山，盼你归家一叙。`);
      }
    });

    return {
      heroAge: hero.age,
      worldYear: world ? world.year : 1,
      changes,
      proactiveEvent: world ? rollProactiveNpcEvent(hero, world.people) : null
    };
  }

  const LifeSim = {
    SOCIAL_ACTIONS,
    initHeroLife,
    ensureRel,
    executeSocialAction,
    rollProactiveNpcEvent,
    advanceLifeMonths
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = LifeSim;
  root.LifeSim = LifeSim;
})(typeof window !== 'undefined' ? window : globalThis);
