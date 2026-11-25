/* ============================================================================
 * 《沧溟界》v10.9.0 活人语境对话 + 真实社会演化动态事件中枢 (engine/living_events.js)
 * ----------------------------------------------------------------------------
 * 1. generateNpcGreeting(npc, hero, world, rel):
 *    依据 NPC 真实境界差、8维人格、记忆、主角易容/伤势/通缉/4维关系，生成有血有肉的开场白
 * 2. rollLivingSocialEvent(hero, world):
 *    严格基于当前板块真实演化出的【杂役不公 / 暗森指数 / 真实在世大能 / 涌现制度】，
 *    触发绝不重样、充满人情世故与因果代价的江湖动态抉择事件
 * ============================================================================ */
(function (root) {
  'use strict';

  function generateNpcGreeting(npc, hero, world, rel) {
    if (!npc || !hero) return '“道友有礼。”';
    const hIdx = hero.realmIdx || 0;
    const nIdx = npc.realmIdx || 0;
    const diff = nIdx - hIdx;
    const pers = npc.persLabel || '淡泊';
    const fac = npc.factionId && world ? world.factions.find(f => f.id === npc.factionId) : null;
    const facTitle = fac ? `【${fac.name}】` : '散修一脉';

    if (rel && rel.trust >= 55) {
      return `“${hero.masked ? '哈哈，戴着鬼面我也认得你的气息！' : hero.name + '道友！'}久违了。近来${fac ? fac.name + '事务繁杂' : '四海风波不断'}，能在此地重逢实乃大幸。”`;
    }
    if (rel && rel.trust <= -30) {
      return `“哼，${hero.masked ? '藏头露尾的鼠辈' : hero.name}，你还敢出现在我面前？当日之账，今日不妨一并清算！”`;
    }
    if (hero.masked) {
      return `“阁下戴着【${hero.maskName}】行走坊市，气机晦暗难测……莫非是在哪家大宗惹了祸端？在下${npc.name}，隶属${facTitle}，不知阁下找我何事？”`;
    }
    if ((hero.hp || 100) < (hero.maxHp || 120) * 0.55) {
      return pers.includes('仁') || pers.includes('义')
        ? `“道友面色苍白、灵力溃散，可是刚与城外妖兽恶战脱身？若需丹药或护法，但说无妨。”`
        : `“啧啧，看道友身负重伤、气息虚浮……在这黑暗森林般的世道里，露了怯可是会招来豺狼的。”`;
    }
    if (diff >= 2) {
      return pers.includes('傲') || pers.includes('狂')
        ? `“区区${hero.realm}小辈，也敢直视本座（${npc.realm}）？念你尚有几分胆识，给你三息时间说明来意。”`
        : `“小友年纪轻轻便已踏入${hero.realm}，倒有几分昔年故人之姿。我乃${facTitle}${npc.name}，有何疑惑尽可讨教。”`;
    }
    if (diff <= -2) {
      return `“晚辈${npc.name}拜见前辈！前辈${hero.realm}威压如渊，不知驾临此地有何差遣，晚辈愿效犬马之劳！”`;
    }
    const mem = (npc.memories && npc.memories[0]) ? `想当年${npc.memories[0]}，转眼已是沧海桑田。` : '';
    return `“道友安好，在下${facTitle}${npc.name}（${npc.realm}）。${mem}不知今日找我，是欲论道、交易，还是另有所图？”`;
  }

  function rollLivingSocialEvent(hero, world) {
    if (!hero || !world) return null;
    const nd = (world.nodeMap && world.nodeMap[hero.locId]) || world.nodes[0];
    const mainFac = (nd.holdings && nd.holdings.length) ? world.factions.find(f => f.id === nd.holdings[0].factionId && f.alive) : null;
    const highMaster = (world.people || []).find(p => p.alive && (p.realmIdx || 0) >= 3);
    const localInst = (world.institutions || []).find(i => i.plateId === nd.id && i.status !== 'abolished');
    const pool = [];

    // 1. 杂役逃亡求庇（严格条件：本地主导宗门存在杂役剥削或高不公）
    if (mainFac && (mainFac.hasServantSystem || (mainFac.inequality || 0) >= 32)) {
      pool.push({
        id: 'ev_servant_flee',
        title: `⛓️ 【${mainFac.name}】杂役弟子血衣逃亡`,
        desc: `一名满身鞭伤的底层杂役冲进暗巷跪在你脚下：“前辈救命！${mainFac.name}执事克扣月俸、拿我们试药，我偷了半卷【二阶聚气丹方】逃出来，求前辈庇护！”`,
        choices: [
          {
            label: '仗义庇护并收下丹方（正道+12、得灵丹×2，但遭该宗通缉+14）',
            run: (h) => {
              h.life.reputation.righteous += 12; h.wanted = (h.wanted || 0) + 14;
              h.bag.push({ id: 'it_' + Date.now(), name: '二阶聚气灵丹', kind: '丹药', qty: 2, desc: '逃亡杂役赠予的宗门秘炼灵丹', effect: { exp: 85, toxin: 8 } });
              return `你护下杂役并收下两枚宗门秘炼灵丹，但【${mainFac.name}】执法堂已盯上你（通缉+14，黑市戴面具可避祸）！`;
            }
          },
          {
            label: '将其扭送回宗领赏（获 95 灵石，但魔道+10、心魔+10）',
            run: (h) => {
              h.stones += 95; h.life.reputation.demonic += 10; h.life.heartDemon = Math.min(100, h.life.heartDemon + 10);
              return `你将杂役押回【${mainFac.name}】山门换得 95 灵石赏金，但他临别绝望的眼神令你心魔暗生（+10）。`;
            }
          },
          {
            label: '赠他 25 灵石盘缠助其远走高飞（心魔-12、凡人功德+10）',
            run: (h) => {
              h.stones = Math.max(0, h.stones - 25); h.life.reputation.mortal += 10; h.life.heartDemon = Math.max(0, h.life.heartDemon - 12);
              return '你塞给他 25 灵石指点出城暗道，虽未图谋丹方，却觉道心通透（心魔-12）。';
            }
          }
        ]
      });
    }

    // 2. 在世高阶大能途经讲道（严格引用本世界真实活着的大能！）
    if (highMaster) {
      pool.push({
        id: 'ev_master_lecture',
        title: `✨ 本界大能【${highMaster.name}】(${highMaster.realm}) 路过此城`,
        desc: `天际剑光敛去，名震一方的【${highMaster.name}】竟降临【${nd.name}】茶楼小憩，随口点评天地灵潮，引得满城修士屏息聆听！`,
        choices: [
          {
            label: '屏息静悟大能真言（修为 +75、悟性 +2）',
            run: (h) => {
              h.exp = Math.min(h.maxExp || 100, (h.exp || 0) + 75);
              h.daoWit = Math.min(100, (h.daoWit || 80) + 2);
              return `你聆听【${highMaster.name}】三句大道真言，茅塞顿开：修为 +75、悟性 +2！`;
            }
          },
          {
            label: '奉上 55 灵石灵茶厚礼结缘（大幅提升与该大能信任度！）',
            run: (h, w) => {
              if (h.stones < 55) return '灵石不足 55，只得远远作揖目送大能御剑远去。';
              h.stones -= 55;
              if (root.LifeSim) {
                const rel = root.LifeSim.ensureRel(h, highMaster.id);
                rel.trust = Math.min(100, rel.trust + 28);
                rel.history.unshift(`第${w.year}年：你在【${nd.name}】敬献灵茶厚礼，大能颇为赏识。`);
              }
              return `【${highMaster.name}】接过灵茶微微颔首，对你大为赏识（信任度 +28，可在江湖面板进一步结交！）`;
            }
          }
        ]
      });
    }

    // 3. 暗森黑市真假残图（严格条件：本地暗森指数 >= 30）
    if ((nd.darkForestIdx || 0) >= 30) {
      pool.push({
        id: 'ev_dark_scam',
        title: `🌑 暗巷诡客兜售【${nd.name}】密藏残图`,
        desc: `一名浑身裹在黑袍中的散修压低声音：“道友，本地暗森指数已高达 ${nd.darkForestIdx}，我刚从一具金丹尸骸上摸出藏宝图，只要 50 灵石！”`,
        choices: [
          {
            label: `以智谋(IQ:${hero.iq})验看真伪（识破假货反手敲诈，真图则低价拿下）`,
            run: (h) => {
              if ((h.iq || 75) >= 80) {
                h.stones += 40;
                return '你一眼看穿墨迹尚新乃坊市伪造！冷笑一声亮出法器反手震慑，诡客吓得丢下 40 灵石落荒而逃！';
              }
              h.stones = Math.max(0, h.stones - 50);
              return '你未能识破破绽，花 50 灵石买下残图后才发现是一张废纸……江湖险恶！';
            }
          },
          {
            label: '豪赌 50 灵石买下（五成几率开出重宝或修为丹）',
            run: (h) => {
              if (h.stones < 50) return '灵石不足 50，只得作罢。';
              h.stones -= 50;
              if (Math.random() < 0.55) {
                h.stones += 135;
                return '竟是真图！你循迹在城外枯井挖出前人遗留的 135 灵石！';
              }
              return '循图寻去却见早已被人挖空，白白折损 50 灵石。';
            }
          },
          { label: '冷笑拒绝，转身离去', run: () => '你深谙黑暗森林法则，绝不轻信陌路横财，平安离去。' }
        ]
      });
    }

    // 4. 坊市灵宝异动（本地有涌现社会制度时触发）
    if (localInst) {
      pool.push({
        id: 'ev_market_surge',
        title: `⚖️ 【${localInst.name}】突发奇货争抢`,
        desc: `本地盛会【${localInst.name}】上突然流出一批急售灵材，物价剧烈震荡，数家商行正在低价抛售清心灵丹！`,
        choices: [
          {
            label: '趁乱 35 灵石抢购【清心祛毒散】×1',
            run: (h) => {
              if (h.stones < 35) return '灵石不足 35，眼睁睁看着灵丹被他人拍走。';
              h.stones -= 35;
              h.bag.push({ id: 'it_' + Date.now(), name: '清心祛毒散', kind: '丹药', qty: 1, desc: '清除丹毒-28、抚平心魔-15', effect: { detox: 28, calm: 15 } });
              return '你眼疾手快以 35 灵石抄底【清心祛毒散】×1，实乃大赚！';
            }
          },
          {
            label: '借机做局抬价抽佣（赚取 55 灵石，但魔道 +5）',
            run: (h) => {
              h.stones += 55; h.life.reputation.demonic += 5;
              return '你混入人群虚报高价引得两家冤大头互掐，事后从摊主处分得 55 灵石抽佣！';
            }
          }
        ]
      });
    }

    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ===== 让每个活着的 NPC 真正过自己的人生（自主游历迁徙、修炼破境、衰老坐化、NPC 彼此恩怨火拼） =====
  function stepLivingNpcs(world, months) {
    if (!world || !Array.isArray(world.people)) return [];
    const yrs = Math.max(0.08, (months || 1) / 12);
    const logs = [];
    const alive = world.people.filter(p => p.alive);
    const REALM_NAMES = ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '合道'];

    alive.forEach(p => {
      p.age = (p.age || 20) + yrs;
      // 1. 寿终自然坐化
      if (p.age >= (p.maxAge || 120)) {
        p.alive = false;
        const msg = `第${world.year}年：【${p.name}】(${p.realm})寿元耗尽，于【${(world.nodeMap[p.plateId] || {}).name || p.plateId}】安详坐化。`;
        world.chronicles.unshift({ year: world.year, tag: '坐化', text: msg });
        logs.push(msg);
        return;
      }
      // 2. 自主跨板块游历迁徙（优先前往高灵脉或有遗迹的邻接板块）
      if (Math.random() < Math.min(0.45, 0.08 * months)) {
        const cur = world.nodeMap && world.nodeMap[p.plateId];
        if (cur && cur.neighbors && cur.neighbors.length) {
          const cands = cur.neighbors.map(id => world.nodeMap[id]).filter(n => n && (!n.isSea || world.seaTechUnlocked));
          if (cands.length) {
            cands.sort((a, b) => (b.leyline || 0) - (a.leyline || 0));
            const dst = Math.random() < 0.65 ? cands[0] : cands[Math.floor(Math.random() * cands.length)];
            p.plateId = dst.id;
            p.memories = p.memories || [];
            p.memories.unshift(`第${world.year}年：云游迁居至【${dst.name}】`);
            if (p.memories.length > 8) p.memories.length = 8;
          }
        }
      }
      // 3. 自主修炼破境
      if ((p.realmIdx || 1) < 5 && Math.random() < 0.008 * months * ((p.daoWit || 70) / 70)) {
        p.realmIdx = (p.realmIdx || 1) + 1;
        p.realm = REALM_NAMES[p.realmIdx] || '金丹';
        p.maxAge = Math.round((p.maxAge || 120) * 1.45);
        const ndName = (world.nodeMap[p.plateId] || {}).name || p.plateId;
        const msg = `第${world.year}年：【${p.name}】于【${ndName}】闭关突破，正式晋升【${p.realm}】！`;
        p.memories.unshift(msg);
        world.chronicles.unshift({ year: world.year, tag: '破境', text: msg });
        logs.push(msg);
      }
    });

    // 4. 同城 NPC 彼此之间的真实江湖互动（结伴论道 / 坊市争宝火拼）
    const byPlate = {};
    world.people.filter(p => p.alive).forEach(p => {
      (byPlate[p.plateId] = byPlate[p.plateId] || []).push(p);
    });
    for (const pid in byPlate) {
      const grp = byPlate[pid];
      if (grp.length >= 2 && Math.random() < Math.min(0.4, 0.06 * months)) {
        const a = grp[0], b = grp[1];
        const ndName = (world.nodeMap[pid] || {}).name || pid;
        const clash = a.factionId !== b.factionId && Math.random() < 0.45;
        if (clash) {
          const msg = `第${world.year}年：【${a.name}】与【${b.name}】在【${ndName}】坊市因争夺灵材大打出手，引得满城围观！`;
          a.memories.unshift(`与【${b.name}】在${ndName}结下梁子`);
          b.memories.unshift(`与【${a.name}】在${ndName}结下梁子`);
          world.chronicles.unshift({ year: world.year, tag: '争锋', text: msg });
          logs.push(msg);
        } else {
          const msg = `第${world.year}年：【${a.name}】与【${b.name}】于【${ndName}】煮茶论道，互换修炼心得。`;
          a.memories.unshift(`与【${b.name}】在${ndName}论道结缘`);
          logs.push(msg);
        }
        break; // 每步最多 1 条鲜活头条，避免刷屏
      }
    }
    return logs;
  }

  const LivingEvents = { generateNpcGreeting, rollLivingSocialEvent, stepLivingNpcs };
  if (typeof module !== 'undefined' && module.exports) module.exports = LivingEvents;
  root.LivingEvents = LivingEvents;
})(typeof window !== 'undefined' ? window : globalThis);
