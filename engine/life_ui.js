/* ============================================================================
 * 《沧溟界》v8.6.0 完整六维框架 · 真实修仙模拟人生 & 社会涌现控制台 (engine/life_ui.js)
 * 统一资产占位槽位 (data-asset-slot)，零冗余生图，先完整跑通全部玩法与 UI 框架！
 * ============================================================================ */
(function () {
  'use strict';

  const LS_KEY = 'qingyun_v86_world_life_v1';
  let WORLD = null;
  let HERO = null;
  let activeTab = 'life';
  let selectedPlateId = 'E2';
  let selectedNpcId = null;
  let lastLog = [];

  function ensureInit() {
    if (WORLD && HERO) return;
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.world && parsed.hero) {
          WORLD = parsed.world;
          WORLD.nodeMap = Object.fromEntries(WORLD.nodes.map(n => [n.id, n]));
          HERO = parsed.hero;
          selectedPlateId = HERO.locId || 'E2';
          return;
        }
      }
    } catch {}
    freshWorld(88469);
  }

  function freshWorld(seed) {
    WORLD = window.WorldCore.createWorld({
      seed,
      params: { awakeYear: 51, surgePct: 70, entryBp: 22, consumeLv: 6, healLv: 4, yaoLv: 4, chaosLv: 6 }
    });
    window.WorldCore.runGenesis(WORLD, 1200);
    const startPlate = WORLD.nodes.find(n => !n.isSea && n.pop > 20000) || WORLD.nodes[0];
    HERO = {
      name: '青云道友', maskName: '青铜鬼面', masked: false,
      age: 18, realm: '炼气一层', locId: startPlate.id,
      iq: 82, eq: 74, daoWit: 86, stones: 90,
      bag: [
        { id: 'it_pill1', name: '一阶聚气丹', kind: '丹药', qty: 2, desc: '加快吐纳进境，但会积累丹毒(+12)' },
        { id: 'it_jade', name: '亡母旧玉佩', kind: '遗物', qty: 1, desc: '故乡临行信物，可微幅抚平心魔' },
        { id: 'it_map', name: '残缺古图', kind: '情报', qty: 1, desc: '可用来探寻未发现遗迹，或高价卖给仇家设局' }
      ],
      arts: ['《吐纳引气基础篇》'],
      pets: []
    };
    window.LifeSim.initHeroLife(HERO, WORLD);
    selectedPlateId = HERO.locId;
    saveState();
  }

  function saveState() {
    try {
      const slimWorld = Object.assign({}, WORLD, { nodeMap: undefined });
      localStorage.setItem(LS_KEY, JSON.stringify({ world: slimWorld, hero: HERO }));
    } catch {}
  }

  function injectStyles() {
    if (document.getElementById('life-ui-style')) return;
    const st = document.createElement('style');
    st.id = 'life-ui-style';
    st.textContent = `
      #btn-open-life-sim {
        position:fixed; right:14px; bottom:54px; z-index:900;
        background:linear-gradient(180deg, rgba(44,82,138,0.94), rgba(22,42,78,0.97));
        border:1px solid #d4b87a; color:#f2daa0; padding:7px 13px; border-radius:4px;
        font-family:"Songti SC","Noto Serif SC",serif; font-size:12px; font-weight:700;
        letter-spacing:1px; cursor:pointer; box-shadow:0 4px 18px rgba(0,0,0,0.6);
      }
      #btn-open-life-sim:hover { background:rgba(66,112,178,0.98); color:#fff; }
      #life-sim-modal {
        position:fixed; inset:0; z-index:999; background:rgba(5,8,12,0.85);
        backdrop-filter:blur(6px); display:none; align-items:center; justify-content:center; padding:12px;
        font-family:"Songti SC","Noto Serif SC",serif; color:#e6dfd3;
      }
      #life-sim-modal.open { display:flex; }
      .ls-box {
        width:min(1140px, 97vw); height:min(720px, 94vh); background:#0c1017;
        border:1px solid rgba(212,184,122,0.48); border-radius:6px; display:flex; flex-direction:column; overflow:hidden;
      }
      .ls-head {
        display:flex; justify-content:space-between; align-items:center; padding:9px 14px;
        background:#080b10; border-bottom:1px solid rgba(212,184,122,0.28);
      }
      .ls-head h2 { font-size:14.5px; color:#f2daa0; margin:0; letter-spacing:1.2px; }
      .ls-tabs { display:flex; gap:5px; padding:7px 14px; background:#0a0d13; border-bottom:1px solid rgba(212,184,122,0.18); flex-wrap:wrap; }
      .ls-tab {
        padding:5px 11px; font-size:11.5px; border:1px solid rgba(212,184,122,0.28); border-radius:3px;
        background:rgba(212,184,122,0.06); color:#9d9586; cursor:pointer;
      }
      .ls-tab.active { background:rgba(212,184,122,0.24); color:#f2daa0; border-color:#f2daa0; font-weight:700; }
      .ls-body { flex:1; overflow-y:auto; padding:11px 14px; display:flex; flex-direction:column; gap:10px; }
      .ls-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      .ls-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
      .ls-card { background:rgba(18,24,34,0.92); border:1px solid rgba(212,184,122,0.22); border-radius:4px; padding:9px 11px; font-size:11.5px; line-height:1.55; }
      .ls-card h3 { font-size:12.5px; color:#f2daa0; margin:0 0 6px; border-bottom:1px solid rgba(212,184,122,0.15); padding-bottom:4px; display:flex; justify-content:space-between; }
      .ls-btn {
        background:rgba(212,184,122,0.12); border:1px solid rgba(212,184,122,0.38); color:#f2daa0;
        padding:5px 9px; border-radius:3px; font-size:11px; cursor:pointer; font-family:inherit;
      }
      .ls-btn:hover { background:rgba(212,184,122,0.28); }
      .ls-btn.jade { border-color:#6fd3a8; color:#6fd3a8; background:rgba(111,211,168,0.12); }
      .ls-btn.red { border-color:#e06258; color:#ffaaa3; background:rgba(224,98,88,0.14); }
      .ls-btn.blue { border-color:#70b8f0; color:#a8d4ff; background:rgba(112,184,240,0.14); }
      .ls-pill { display:inline-block; font-size:9.5px; padding:1px 6px; border-radius:3px; background:rgba(255,255,255,0.08); margin:1px 3px 1px 0; }
      .ls-pill.warn { background:rgba(224,98,88,0.25); color:#ffaaa3; }
      .ls-pill.jade { background:rgba(111,211,168,0.22); color:#9ff2cf; }
      .ls-log { background:rgba(6,9,13,0.94); border:1px solid rgba(111,211,168,0.3); padding:8px 10px; border-radius:4px; font-size:11px; line-height:1.6; max-height:165px; overflow-y:auto; }
      .ls-slot-box {
        width:64px; height:64px; border:1px dashed rgba(212,184,122,0.5); border-radius:4px;
        background:rgba(8,12,18,0.9); display:flex; flex-direction:column; align-items:center; justify-content:center;
        overflow:hidden; flex-shrink:0; font-size:9px; color:#938c7e; text-align:center;
      }
      .ls-slot-box img { width:100%; height:100%; object-fit:cover; }
      .ls-plate { cursor:pointer; padding:6px 8px; border-radius:3px; background:rgba(14,19,27,0.95); border:1px solid rgba(212,184,122,0.18); font-size:10px; }
      .ls-plate:hover, .ls-plate.sel { border-color:#f2daa0; background:rgba(212,184,122,0.14); }
    `;
    document.head.appendChild(st);
  }

  function pushLog(msg) {
    lastLog.unshift(msg);
    if (lastLog.length > 14) lastLog.length = 14;
    HERO.life.diary.unshift(`第${WORLD.year}年：${msg}`);
  }

  function renderModal() {
    ensureInit();
    const body = document.getElementById('ls-body');
    const title = document.getElementById('ls-title');
    const curPlate = WORLD.nodeMap[HERO.locId] || WORLD.nodes[0];
    title.textContent = `沧溟修仙模拟人生 v8.6 · 第 ${WORLD.year} 年 ${WORLD.month} 月 · 身在【${curPlate.name}】 · ${HERO.masked ? `马甲:${HERO.maskName}` : HERO.name}`;

    document.querySelectorAll('.ls-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === activeTab);
    });

    if (activeTab === 'life') {
      const life = HERO.life;
      body.innerHTML = `
        <div class="ls-card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <div class="ls-slot-box" data-asset-slot="hero_portrait" title="立绘占位槽：hero_portrait">
            <img src="assets/chars/hero.webp" alt="主角立绘" />
          </div>
          <div style="flex:1;min-width:260px;">
            <div style="font-size:13px;">
              <b style="color:#f2daa0;">${HERO.masked ? `${HERO.maskName} (易容马甲)` : HERO.name}</b> ·
              <span class="ls-pill jade">${HERO.realm}</span> · 寿 <b>${HERO.age}</b> 岁 · 灵石 <b>${HERO.stones}</b> ·
              IQ:<b>${HERO.iq}</b> EQ:<b>${HERO.eq}</b> 悟:<b>${HERO.daoWit}</b>
            </div>
            <div style="margin-top:4px;font-size:11px;">
              心魔 <b style="color:${life.heartDemon>=50?'#ff9d95':'#6fd3a8'}">${life.heartDemon}/100</b> ｜
              丹毒 <b>${life.pillToxin}/100</b> ｜ 孤寂 <b>${life.loneliness}/100</b> ｜
              所在板块黑暗森林指数 <b style="color:${(curPlate.darkForestIdx||0)>=65?'#ff9d95':'#70b8f0'}">${curPlate.darkForestIdx||0}/100</b>
            </div>
            <div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap;">
              <button class="ls-btn jade" data-act="seclude1">闭关 1 年</button>
              <button class="ls-btn jade" data-act="seclude10">闭关 10 年（看尘世变迁）</button>
              <button class="ls-btn" data-act="mortal">红尘炼心 (1年)</button>
              <button class="ls-btn" data-act="work">仙城画符谋生 (1年)</button>
              <button class="ls-btn blue" data-act="court">入世当王府供奉 (1年)</button>
              <button class="ls-btn ${HERO.masked?'red':''}" data-act="mask">${HERO.masked ? '🎭 摘下易容马甲' : '🎭 戴上易容马甲'}</button>
            </div>
          </div>
        </div>
        ${lastLog.length ? `<div class="ls-log"><b style="color:#6fd3a8;">【最新尘世变迁与人生记录】</b><br/>${lastLog.map(x => `• ${x}`).join('<br/>')}</div>` : ''}
        <div class="ls-grid-2">
          <div class="ls-card">
            <h3><span>凡人亲情与故旧羁绊</span><span style="font-size:10px;color:#938c7e;">故乡:${life.homePlateName}</span></h3>
            ${life.family.map(f => `
              <div style="padding:4px 0;border-bottom:1px dashed rgba(212,184,122,0.12);opacity:${f.alive?1:0.5}">
                <b>${f.name}</b>（${f.role}）· ${f.alive ? `在世 ${Math.round(f.age)}/${f.maxAge} 岁` : `<span style="color:#ff9d95;">已故（享年 ${Math.round(f.age)} 岁）</span>`} · 羁绊 ${f.bond}
              </div>
            `).join('')}
            <div style="margin-top:7px;color:#938c7e;font-size:10.5px;">
              多面江湖名声：凡人(${life.reputation.mortal}) · 正道(${life.reputation.righteous}) · 魔道(${life.reputation.demonic}) · 妖海(${life.reputation.yao})
            </div>
          </div>
          <div class="ls-card">
            <h3><span>人生执念 · 暗伤 · 个人手记</span></h3>
            <div><b>执念：</b>${life.obsessions.map(o => `${o.done ? '✔' : '○'} ${o.text}`).join(' ｜ ')}</div>
            <div style="margin-top:4px;"><b>永久暗伤：</b>${life.injuries.length ? life.injuries.map(i => `<span style="color:#ff9d95;">${i.name}(${i.penalty})</span>`).join('、') : '体魄完好'}</div>
            <div style="margin-top:6px;max-height:135px;overflow-y:auto;color:#bfb7a8;font-size:10.5px;">
              ${life.diary.slice(0, 14).map(d => `<div>• ${d}</div>`).join('')}
            </div>
          </div>
        </div>
      `;
      body.querySelectorAll('[data-act]').forEach(btn => {
        btn.onclick = () => {
          const a = btn.dataset.act;
          if (a === 'mask') {
            HERO.masked = !HERO.masked;
            pushLog(HERO.masked ? `你运转敛息术戴上【${HERO.maskName}】，以江湖黑户马甲行走尘世！` : `你摘下马甲，恢复【${HERO.name}】真容。`);
            saveState(); renderModal(); return;
          }
          if (a === 'court') {
            const res = window.LifeSim.advanceLifeMonths(HERO, WORLD, 12, 'livelihood');
            HERO.stones += 45; HERO.life.reputation.mortal += 8;
            lastLog = [`你在【${curPlate.name}】世俗王府担任仙师供奉 1 年，额外获赠 45 灵石与凡俗敬仰！`, ...res.changes];
            saveState(); renderModal(); return;
          }
          const res = a === 'seclude1' ? window.LifeSim.advanceLifeMonths(HERO, WORLD, 12, 'seclude')
            : a === 'seclude10' ? window.LifeSim.advanceLifeMonths(HERO, WORLD, 120, 'seclude')
            : a === 'mortal' ? window.LifeSim.advanceLifeMonths(HERO, WORLD, 12, 'mortal_life')
            : window.LifeSim.advanceLifeMonths(HERO, WORLD, 12, 'livelihood');
          lastLog = res.changes.slice();
          if (res.proactiveEvent) lastLog.unshift(`${res.proactiveEvent.title}：${res.proactiveEvent.desc}`);
          saveState(); renderModal();
        };
      });
    } else if (activeTab === 'map') {
      const sp = WORLD.nodeMap[selectedPlateId] || curPlate;
      const localInsts = (WORLD.institutions || []).filter(i => i.plateId === sp.id);
      const localRuins = (WORLD.ruins || []).filter(r => r.plateId === sp.id);
      body.innerHTML = `
        <div class="ls-grid-4">
          ${WORLD.nodes.map(nd => {
            const holds = (nd.holdings || []).map(h => {
              const f = WORLD.factions.find(x => x.id === h.factionId);
              return f ? `${f.name}${h.share}%` : '';
            }).filter(Boolean).slice(0, 2).join('·') || '无主';
            return `<div class="ls-plate ${selectedPlateId===nd.id?'sel':''}" data-pid="${nd.id}">
              <div style="display:flex;justify-content:space-between;"><b style="color:#f2daa0;">${HERO.locId===nd.id?'📍':''}${nd.id} ${nd.name}</b><span style="color:${(nd.darkForestIdx||0)>=65?'#ff9d95':'#6fd3a8'}">暗${nd.darkForestIdx||0}</span></div>
              <div style="color:#70b8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${holds}</div>
              <div style="color:#938c7e;font-size:9px;">脉${nd.leyline} 矿${nd.mineral} 药${nd.herb} 煞${nd.sha}</div>
            </div>`;
          }).join('')}
        </div>
        <div class="ls-card">
          <h3><span>${sp.name}（${sp.climate}/${sp.elem} · 邻接:[${sp.neighbors.join(',')}]）</span><span>物价：丹×${sp.priceIndex.pill} 矿×${sp.priceIndex.mineral} 粮×${sp.priceIndex.grain}</span></h3>
          <div style="margin-bottom:6px;">
            ${(sp.phenomena || []).map(x => `<span class="ls-pill ${x.includes('黑暗')||x.includes('邪教')?'warn':'jade'}">${x}</span>`).join('') || '<span class="ls-pill">自然荒野</span>'}
          </div>
          <div style="font-size:11px;color:#bfb7a8;">
            <b>本地涌现制度：</b>${localInsts.length ? localInsts.map(i => `【${i.name}】(${i.cycleYears?`每${i.cycleYears}年`:'常设'}·${i.status==='corrupt'?'黑幕腐化':(i.status==='suspended'?'战乱停办':'繁荣')})`).join(' ｜ ') : '尚无成型社会制度'}<br/>
            <b>本地溯源遗迹：</b>${localRuins.length ? localRuins.map(r => `【${r.name}】(${r.discovered?'已探明':'传闻未现'}·阵法${r.sealStrength})`).join(' ｜ ') : '无大能遗迹'}
          </div>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
            ${HERO.locId !== sp.id ? `<button class="ls-btn jade" id="btn-travel-plate">🧭 前往【${sp.name}】</button>` : '<span class="ls-pill jade">📍 你当前正身处此地</span>'}
            <button class="ls-btn" id="btn-teahouse">🍵 逛茶馆听书（听本世界真实史话）</button>
            ${localRuins.length ? `<button class="ls-btn blue" id="btn-explore-ruin">🗝️ 探寻本地古遗迹</button>` : ''}
            ${localInsts.length ? `<button class="ls-btn" id="btn-visit-inst">⚖️ 参与本地拍卖/黑市/大比</button>` : ''}
          </div>
        </div>
      `;
      body.querySelectorAll('[data-pid]').forEach(el => { el.onclick = () => { selectedPlateId = el.dataset.pid; renderModal(); }; });
      const tv = document.getElementById('btn-travel-plate');
      if (tv) tv.onclick = () => {
        HERO.locId = sp.id;
        window.LifeSim.advanceLifeMonths(HERO, WORLD, 2, 'mortal_life');
        pushLog(`你跋涉两月抵达【${sp.name}】（黑暗森林指数 ${sp.darkForestIdx||0}）。`);
        saveState(); renderModal();
      };
      const th = document.getElementById('btn-teahouse');
      if (th) th.onclick = () => {
        const hist = WORLD.chronicles[Math.floor(Math.random() * Math.min(18, WORLD.chronicles.length))];
        HERO.life.loneliness = Math.max(0, HERO.life.loneliness - 15);
        pushLog(`你在【${sp.name}】茶馆点了一壶灵茶，评书先生拍案讲起往事：“${hist ? hist.text : '太古灵潮初开之时……'}”`);
        saveState(); activeTab = 'life'; renderModal();
      };
      const er = document.getElementById('btn-explore-ruin');
      if (er) er.onclick = () => {
        const r = localRuins[0];
        r.discovered = true;
        const loot = r.vault[0] || '上古灵石箱';
        HERO.bag.push({ id: 'it_' + Date.now(), name: loot, kind: '遗迹秘宝', qty: 1, desc: `出土于【${r.name}】(${r.ownerName}遗留)` });
        if (loot.includes('残') || loot.includes('经')) HERO.arts.push(loot);
        pushLog(`你深入【${r.name}】破开残阵，成功夺得【${loot}】！`);
        saveState(); activeTab = 'bag'; renderModal();
      };
      const vi = document.getElementById('btn-visit-inst');
      if (vi) vi.onclick = () => {
        const inst = localInsts[0];
        const msg = inst.status === 'corrupt'
          ? `你踏入【${inst.name}】，发现此处早已官僚腐化（公正度${Math.round(inst.integrity)}），托儿满场抬价，幸亏你 IQ:${HERO.iq} 识破假货反手捡漏赚了 35 灵石！`
          : `你参与【${inst.name}】（每${inst.cycleYears||1}年一届），结识各路修士并购得稀缺消息，获益匪浅！`;
        HERO.stones += 35;
        pushLog(msg);
        saveState(); activeTab = 'life'; renderModal();
      };
    } else if (activeTab === 'social') {
      const aliveNpcs = WORLD.people.filter(c => c.alive).slice(0, 22);
      if (!selectedNpcId && aliveNpcs.length) selectedNpcId = aliveNpcs[0].id;
      const curNpc = aliveNpcs.find(c => c.id === selectedNpcId) || aliveNpcs[0];
      const rel = curNpc ? window.LifeSim.ensureRel(HERO, curNpc.id) : null;
      body.innerHTML = `
        <div class="ls-grid-2" style="grid-template-columns:280px 1fr;">
          <div class="ls-card" style="max-height:520px;overflow-y:auto;">
            <h3>在世修士名录（点击博弈）</h3>
            ${aliveNpcs.map(c => {
              const r = window.LifeSim.ensureRel(HERO, c.id);
              return `<div data-npc="${c.id}" style="padding:6px;margin-bottom:5px;border-radius:3px;cursor:pointer;border:1px solid ${curNpc&&curNpc.id===c.id?'#f2daa0':'rgba(212,184,122,0.16)'};background:${curNpc&&curNpc.id===c.id?'rgba(212,184,122,0.14)':'transparent'}">
                <b>${c.name}</b> <span style="color:#6fd3a8;font-size:10px;">[${c.species}·${c.realm}]</span>
                <div style="font-size:10px;color:#938c7e;">${c.persLabel} · IQ:${c.iq} 悟:${c.daoWit}</div>
                <div style="font-size:9.5px;color:#70b8f0;">信${r.trust} 畏${r.dread} 柄${r.hook} 道${r.daoResonance}</div>
              </div>`;
            }).join('')}
          </div>
          <div class="ls-card">
            ${curNpc ? `
              <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;">
                <div class="ls-slot-box" data-asset-slot="npc_portrait_${curNpc.species}" title="NPC立绘占位槽"><span>NPC立绘<br/>${curNpc.species}</span></div>
                <div>
                  <h3 style="border:none;margin:0;padding:0;">${curNpc.name}（${curNpc.species} · ${curNpc.realm} · ${Math.round(curNpc.age)}/${curNpc.maxAge}岁）</h3>
                  <div style="font-size:11px;color:#bfb7a8;">8维人格：<b>${curNpc.persLabel}</b> ｜ IQ:${curNpc.iq} EQ:${curNpc.eq} 悟:${curNpc.daoWit}</div>
                  <div><span class="ls-pill">信任 ${rel.trust}</span><span class="ls-pill">敬畏 ${rel.dread}</span><span class="ls-pill jade">人情把柄 ${rel.hook}</span><span class="ls-pill">道念共鸣 ${rel.daoResonance}</span></div>
                </div>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;">
                ${window.LifeSim.SOCIAL_ACTIONS.filter(a => a.id !== 'ai_free_talk').map(a => `
                  <button class="ls-btn ${a.cat==='暗黑魔道'?'red':(a.cat==='道途传承'?'jade':'')}" data-sact="${a.id}" title="${a.desc}">[${a.cat}] ${a.name}</button>
                `).join('')}
              </div>
              <div class="ls-log">
                <b style="color:#f2daa0;">【江湖博弈因果】</b><br/>
                ${rel.history.length ? rel.history.map(h => `• ${h}`).join('<br/>') : '请选择上方 18 种江湖手段开启博弈。'}
              </div>
            ` : '暂无在世关键人物。'}
          </div>
        </div>
      `;
      body.querySelectorAll('[data-npc]').forEach(el => { el.onclick = () => { selectedNpcId = el.dataset.npc; renderModal(); }; });
      body.querySelectorAll('[data-sact]').forEach(btn => {
        btn.onclick = () => {
          window.LifeSim.executeSocialAction(HERO, curNpc, btn.dataset.sact);
          saveState(); renderModal();
        };
      });
    } else if (activeTab === 'beasts') {
      const beastList = [
        { name: curPlate.fauna || '感灵山林野兽', tier: curPlate.sha >= 55 ? '煞化凶妖' : '本土灵兽', drop: curPlate.sha >= 55 ? '血煞妖丹' : '一阶灵兽内丹' },
        { name: curPlate.elem === 'fire' ? '赤焰火蜥' : (curPlate.elem === 'ice' ? '寒渊冰狼' : (curPlate.isSea ? '沧溟玄鳌' : '青林灵狐')), tier: '稀世异兽', drop: '高纯属性兽核' }
      ];
      body.innerHTML = `
        <div class="ls-card">
          <h3><span>【${curPlate.name}】本土妖兽与异兽生态</span><span>草木：${curPlate.flora} · 怨煞：${curPlate.sha}</span></h3>
          <div class="ls-grid-2">
            ${beastList.map((b, idx) => `
              <div class="ls-card" style="display:flex;gap:10px;align-items:center;">
                <div class="ls-slot-box" data-asset-slot="beast_art_${idx}" title="妖兽立绘占位槽"><span>妖兽图鉴<br/>待补图</span></div>
                <div style="flex:1;">
                  <b style="color:#f2daa0;">${b.name}</b> <span class="ls-pill ${b.tier.includes('煞')?'warn':'jade'}">${b.tier}</span>
                  <div style="font-size:10.5px;color:#938c7e;margin:3px 0;">掉落：${b.drop}</div>
                  <div style="display:flex;gap:5px;">
                    <button class="ls-btn red" data-hunt="${b.name}|${b.drop}">⚔️ 猎妖取丹</button>
                    <button class="ls-btn jade" data-tame="${b.name}">🐾 尝试驯服灵宠</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="margin-top:8px;font-size:11px;color:#6fd3a8;">已收服灵宠：${HERO.pets.length ? HERO.pets.join('、') : '尚无灵宠'}</div>
        </div>
      `;
      body.querySelectorAll('[data-hunt]').forEach(btn => {
        btn.onclick = () => {
          const [bn, dp] = btn.dataset.hunt.split('|');
          HERO.bag.push({ id: 'it_' + Date.now(), name: dp, kind: '妖丹', qty: 1, desc: `猎杀【${bn}】所得，可炼丹或高价售卖` });
          pushLog(`你在【${curPlate.name}】斩杀【${bn}】，夺得【${dp}】！`);
          saveState(); activeTab = 'bag'; renderModal();
        };
      });
      body.querySelectorAll('[data-tame]').forEach(btn => {
        btn.onclick = () => {
          const bn = btn.dataset.tame;
          if (!HERO.pets.includes(bn)) HERO.pets.push(bn);
          HERO.life.loneliness = Math.max(0, HERO.life.loneliness - 20);
          pushLog(`你以灵草与神识温养，成功收服【${bn}】为伴生灵宠！`);
          saveState(); renderModal();
        };
      });
    } else if (activeTab === 'bag') {
      body.innerHTML = `
        <div class="ls-grid-2">
          <div class="ls-card">
            <h3><span>储物袋道具（统一道具占位图标，后续替换）</span><span>灵石：${HERO.stones}</span></h3>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${HERO.bag.map((it, idx) => `
                <div style="display:flex;gap:8px;align-items:center;padding:6px;background:rgba(10,14,20,0.85);border:1px solid rgba(212,184,122,0.18);border-radius:3px;">
                  <div class="ls-slot-box" style="width:38px;height:38px;" data-asset-slot="item_icon_${it.kind}">
                    <img src="assets/items/spirit_stone.webp" alt="道具图标" />
                  </div>
                  <div style="flex:1;">
                    <b style="color:#f2daa0;">${it.name}</b> ×${it.qty} <span class="ls-pill">${it.kind}</span>
                    <div style="font-size:10px;color:#938c7e;">${it.desc}</div>
                  </div>
                  ${it.kind === '丹药' ? `<button class="ls-btn jade" data-use="${idx}">服用</button>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          <div class="ls-card">
            <h3><span>已习得功法与传承残卷</span></h3>
            ${HERO.arts.map(a => `<div style="padding:5px 0;border-bottom:1px dashed rgba(212,184,122,0.15);color:#9ff2cf;">📜 ${a}</div>`).join('')}
          </div>
        </div>
      `;
      body.querySelectorAll('[data-use]').forEach(btn => {
        btn.onclick = () => {
          const it = HERO.bag[Number(btn.dataset.use)];
          if (!it) return;
          HERO.life.pillToxin = Math.min(100, HERO.life.pillToxin + 12);
          it.qty--;
          if (it.qty <= 0) HERO.bag.splice(Number(btn.dataset.use), 1);
          pushLog(`你服下【${it.name}】，灵力大涨，但丹毒升至 ${HERO.life.pillToxin}/100！`);
          saveState(); activeTab = 'life'; renderModal();
        };
      });
    } else {
      const en = window.WorldCore.calcConservation(WORLD);
      body.innerHTML = `
        <div class="ls-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div><b>5 池守恒(20,000)</b>：核${en.core} / 游${en.ambient} / 表${en.surf} / 锁${en.locked} / 煞${en.shaE} · 遗迹 <b>${(WORLD.ruins||[]).length}</b> 座 · 涌现制度 <b>${(WORLD.institutions||[]).length}</b> 项</div>
          <div style="display:flex;gap:6px;">
            <label class="ls-btn jade" style="display:inline-block;">📂 导入实验室 v7.4 JSON<input type="file" id="ls-import-file" accept=".json" style="display:none;" /></label>
            <button class="ls-btn" id="ls-regen-world">⚡ 25ms 重建新 1200 年社会</button>
          </div>
        </div>
        <div class="ls-grid-2">
          <div class="ls-card" style="max-height:420px;overflow-y:auto;">
            <h3>自然涌现的社会制度（动态周期·腐化·停办）</h3>
            ${(WORLD.institutions || []).slice(0, 20).map(i => `
              <div style="padding:5px 0;border-bottom:1px dashed rgba(212,184,122,0.14);font-size:10.5px;">
                <b style="color:#f2daa0;">${i.name}</b> <span class="ls-pill ${i.status==='corrupt'||i.status==='suspended'?'warn':'jade'}">${i.status}</span>
                <div style="color:#938c7e;">周期:${i.cycleYears?`每${i.cycleYears}年`:'常设'} · 公正度:${Math.round(i.integrity)} · 主办:${i.hostName}</div>
              </div>
            `).join('') || '尚无制度涌现'}
          </div>
          <div class="ls-card" style="max-height:420px;overflow-y:auto;">
            <h3>严格溯源遗迹库 & 宗门官僚/杂役状况</h3>
            ${(WORLD.ruins || []).slice(0, 12).map(r => `
              <div style="padding:4px 0;border-bottom:1px dashed rgba(212,184,122,0.14);font-size:10.5px;">
                <b>🗝️ ${r.name}</b>（${r.plateId}·阵法${r.sealStrength}·${r.discovered?'已探明':'未发现'}）<br/>
                <span style="color:#938c7e;">宝库：${r.vault.join('、')}</span>
              </div>
            `).join('') || '尚无遗迹'}
            <div style="margin-top:8px;border-top:1px solid rgba(212,184,122,0.2);padding-top:6px;">
              ${WORLD.factions.filter(f=>f.alive).slice(0,8).map(f=>`<div style="font-size:10px;color:#bfb7a8;">• <b>${f.name}</b>：官僚${Math.round(f.bureaucracy||0)} · 不公${Math.round(f.inequality||0)} · 杂役${f.servants||0}人</div>`).join('')}
            </div>
          </div>
        </div>
      `;
      const imp = document.getElementById('ls-import-file');
      if (imp) imp.onchange = async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const json = JSON.parse(await file.text());
          WORLD = window.WorldCore.importLabWorldJson(json);
          if (window.Sociology) window.Sociology.stepSociology(WORLD, { next: Math.random }, 10);
          window.LifeSim.initHeroLife(HERO, WORLD);
          pushLog(`✔ 已导入实验室第 ${WORLD.year} 年世界并同步涌现社会制度！`);
          saveState(); renderModal();
        } catch (err) { alert('导入失败：' + err.message); }
      };
      const rg = document.getElementById('ls-regen-world');
      if (rg) rg.onclick = () => {
        freshWorld(Math.floor(Math.random() * 99999));
        pushLog(`⚡ 已在 25ms 内生成全新 1200 年世界（含 ${(WORLD.ruins||[]).length} 座溯源遗迹、${(WORLD.institutions||[]).length} 项涌现制度）！`);
        renderModal();
      };
    }
  }

  function mount() {
    if (!window.WorldCore || !window.LifeSim) return;
    injectStyles();
    const btn = document.createElement('button');
    btn.id = 'btn-open-life-sim';
    btn.textContent = '☯ 人生·社会 v8.6';
    btn.onclick = () => {
      document.getElementById('life-sim-modal').classList.add('open');
      renderModal();
    };
    document.body.appendChild(btn);

    const modal = document.createElement('div');
    modal.id = 'life-sim-modal';
    modal.innerHTML = `
      <div class="ls-box">
        <div class="ls-head">
          <h2 id="ls-title">沧溟修仙模拟人生 v8.6</h2>
          <button class="ls-btn red" id="ls-close">✕ 关闭</button>
        </div>
        <div class="ls-tabs">
          <div class="ls-tab active" data-tab="life">🧬 人物与人生</div>
          <div class="ls-tab" data-tab="map">🗺️ 五洲七海大地图</div>
          <div class="ls-tab" data-tab="social">🤝 众生与江湖博弈</div>
          <div class="ls-tab" data-tab="beasts">🐾 妖兽与生态图鉴</div>
          <div class="ls-tab" data-tab="bag">🎒 行囊与功法遗物</div>
          <div class="ls-tab" data-tab="world">🏛️ 社会制度与遗迹库</div>
        </div>
        <div class="ls-body" id="ls-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('ls-close').onclick = () => modal.classList.remove('open');
    modal.querySelectorAll('.ls-tab').forEach(t => {
      t.onclick = () => { activeTab = t.dataset.tab; renderModal(); };
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
