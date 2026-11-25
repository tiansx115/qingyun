/* ============================================================================
 * 《沧溟界》v8.5.0 真实修仙模拟人生 & 同源三层世界 UI 桥接层 (engine/life_ui.js)
 * 独立挂载，不侵入原有 app.js 逻辑；完整接入 WorldCore + LifeSim
 * ============================================================================ */
(function () {
  'use strict';

  const LS_KEY = 'qingyun_v85_world_life_v1';
  let WORLD = null;
  let HERO = null;
  let activeTab = 'life';
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
          return;
        }
      }
    } catch {}
    WORLD = window.WorldCore.createWorld({ seed: 88469, params: { awakeYear: 51, surgePct: 70, entryBp: 22, consumeLv: 6, healLv: 4, yaoLv: 4, chaosLv: 6 } });
    window.WorldCore.runGenesis(WORLD, 1200);
    HERO = { name: '青云道友', age: 18, iq: 82, eq: 74, daoWit: 86, stones: 70 };
    window.LifeSim.initHeroLife(HERO, WORLD);
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
        background:linear-gradient(180deg, rgba(44,82,138,0.92), rgba(22,42,78,0.96));
        border:1px solid #d4b87a; color:#f2daa0; padding:7px 12px; border-radius:4px;
        font-family:"Songti SC","Noto Serif SC",serif; font-size:12px; font-weight:700;
        letter-spacing:1px; cursor:pointer; box-shadow:0 4px 18px rgba(0,0,0,0.55);
      }
      #btn-open-life-sim:hover { background:rgba(66,112,178,0.96); color:#fff; }
      #life-sim-modal {
        position:fixed; inset:0; z-index:999; background:rgba(5,8,12,0.82);
        backdrop-filter:blur(6px); display:none; align-items:center; justify-content:center; padding:14px;
        font-family:"Songti SC","Noto Serif SC",serif; color:#e6dfd3;
      }
      #life-sim-modal.open { display:flex; }
      .ls-box {
        width:min(1060px, 96vw); height:min(680px, 92vh); background:#0d1118;
        border:1px solid rgba(212,184,122,0.45); border-radius:6px; display:flex; flex-direction:column; overflow:hidden;
      }
      .ls-head {
        display:flex; justify-content:space-between; align-items:center; padding:10px 14px;
        background:#090c11; border-bottom:1px solid rgba(212,184,122,0.28);
      }
      .ls-head h2 { font-size:15px; color:#f2daa0; margin:0; letter-spacing:1.5px; }
      .ls-tabs { display:flex; gap:6px; padding:8px 14px; background:#0b0e14; border-bottom:1px solid rgba(212,184,122,0.18); }
      .ls-tab {
        padding:5px 12px; font-size:12px; border:1px solid rgba(212,184,122,0.28); border-radius:3px;
        background:rgba(212,184,122,0.06); color:#9d9586; cursor:pointer;
      }
      .ls-tab.active { background:rgba(212,184,122,0.22); color:#f2daa0; border-color:#f2daa0; font-weight:700; }
      .ls-body { flex:1; overflow-y:auto; padding:12px 14px; display:flex; flex-direction:column; gap:10px; }
      .ls-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      .ls-card { background:rgba(20,26,36,0.9); border:1px solid rgba(212,184,122,0.22); border-radius:4px; padding:9px 11px; font-size:11.5px; line-height:1.55; }
      .ls-card h3 { font-size:12.5px; color:#f2daa0; margin:0 0 6px; border-bottom:1px solid rgba(212,184,122,0.15); padding-bottom:4px; }
      .ls-btn {
        background:rgba(212,184,122,0.12); border:1px solid rgba(212,184,122,0.38); color:#f2daa0;
        padding:5px 10px; border-radius:3px; font-size:11px; cursor:pointer; font-family:inherit;
      }
      .ls-btn:hover { background:rgba(212,184,122,0.28); }
      .ls-btn.jade { border-color:#6fd3a8; color:#6fd3a8; background:rgba(111,211,168,0.12); }
      .ls-btn.red { border-color:#e06258; color:#ffaaa3; background:rgba(224,98,88,0.14); }
      .ls-pill { display:inline-block; font-size:10px; padding:1px 6px; border-radius:3px; background:rgba(255,255,255,0.08); margin-right:4px; }
      .ls-log { background:rgba(6,9,13,0.92); border:1px solid rgba(111,211,168,0.3); padding:8px 10px; border-radius:4px; font-size:11px; line-height:1.6; max-height:170px; overflow-y:auto; }
    `;
    document.head.appendChild(st);
  }

  function renderModal() {
    ensureInit();
    const body = document.getElementById('ls-body');
    const title = document.getElementById('ls-title');
    const en = window.WorldCore.calcConservation(WORLD);
    title.textContent = `沧溟修仙模拟人生 v8.5 · 第 ${WORLD.year} 年 ${WORLD.month} 月 · ${WORLD.eraName}`;

    document.querySelectorAll('.ls-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === activeTab);
    });

    if (activeTab === 'life') {
      const life = HERO.life;
      body.innerHTML = `
        <div class="ls-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <b style="color:#f2daa0;font-size:13px;">${HERO.name}</b> · 年龄 <b>${HERO.age}</b> 岁 · 灵石 <b>${HERO.stones}</b> ·
            心魔 <b style="color:${life.heartDemon>=50?'#ff9d95':'#6fd3a8'}">${life.heartDemon}/100</b> ·
            丹毒 <b>${life.pillToxin}/100</b> · 孤寂 <b>${life.loneliness}/100</b>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="ls-btn jade" data-act="seclude1">闭关 1 年</button>
            <button class="ls-btn jade" data-act="seclude10">闭关 10 年（看尘世变迁）</button>
            <button class="ls-btn" data-act="mortal">入世红尘炼心 (1年)</button>
            <button class="ls-btn" data-act="work">仙城画符谋生 (1年)</button>
          </div>
        </div>
        ${lastLog.length ? `<div class="ls-log"><b style="color:#6fd3a8;">【最新尘世变迁录】</b><br/>${lastLog.map(x => `• ${x}`).join('<br/>')}</div>` : ''}
        <div class="ls-grid-2">
          <div class="ls-card">
            <h3>凡人亲情与故旧羁绊（仙凡永隔）</h3>
            ${life.family.map(f => `
              <div style="padding:4px 0;border-bottom:1px dashed rgba(212,184,122,0.12);opacity:${f.alive?1:0.5}">
                <b>${f.name}</b>（${f.role}）· ${f.alive ? `在世 ${Math.round(f.age)}/${f.maxAge} 岁` : `<span style="color:#ff9d95;">已故（享年 ${Math.round(f.age)} 岁）</span>`} · 羁绊 ${f.bond}
              </div>
            `).join('')}
            <div style="margin-top:8px;color:#938c7e;font-size:10.5px;">
              多面江湖名声：凡人(${life.reputation.mortal}) · 正道(${life.reputation.righteous}) · 魔道(${life.reputation.demonic}) · 妖海(${life.reputation.yao})
            </div>
          </div>
          <div class="ls-card">
            <h3>人生执念 · 肉身暗伤 · 个人手记</h3>
            <div><b>执念：</b>${life.obsessions.map(o => `${o.done ? '✔' : '○'} ${o.text}`).join(' ｜ ')}</div>
            <div style="margin-top:4px;"><b>永久暗伤：</b>${life.injuries.length ? life.injuries.map(i => `<span style="color:#ff9d95;">${i.name}(${i.penalty})</span>`).join('、') : '无暗伤'}</div>
            <div style="margin-top:6px;max-height:130px;overflow-y:auto;color:#bfb7a8;font-size:10.5px;">
              ${life.diary.slice(0, 12).map(d => `<div>• ${d}</div>`).join('')}
            </div>
          </div>
        </div>
      `;
      body.querySelectorAll('[data-act]').forEach(btn => {
        btn.onclick = () => {
          const a = btn.dataset.act;
          const res = a === 'seclude1' ? window.LifeSim.advanceLifeMonths(HERO, WORLD, 12, 'seclude')
            : a === 'seclude10' ? window.LifeSim.advanceLifeMonths(HERO, WORLD, 120, 'seclude')
            : a === 'mortal' ? window.LifeSim.advanceLifeMonths(HERO, WORLD, 12, 'mortal_life')
            : window.LifeSim.advanceLifeMonths(HERO, WORLD, 12, 'livelihood');
          lastLog = res.changes.slice();
          if (res.proactiveEvent) lastLog.unshift(`${res.proactiveEvent.title}：${res.proactiveEvent.desc}`);
          saveState();
          renderModal();
        };
      });
    } else if (activeTab === 'social') {
      const aliveNpcs = WORLD.people.filter(c => c.alive).slice(0, 20);
      if (!selectedNpcId && aliveNpcs.length) selectedNpcId = aliveNpcs[0].id;
      const curNpc = aliveNpcs.find(c => c.id === selectedNpcId) || aliveNpcs[0];
      const rel = curNpc ? window.LifeSim.ensureRel(HERO, curNpc.id) : null;
      body.innerHTML = `
        <div class="ls-grid-2" style="grid-template-columns:280px 1fr;">
          <div class="ls-card" style="max-height:500px;overflow-y:auto;">
            <h3>在世人物（点击展开 4 维博弈）</h3>
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
              <h3>${curNpc.name}（${curNpc.species} · ${curNpc.realm} · ${Math.round(curNpc.age)}/${curNpc.maxAge}岁）</h3>
              <div style="font-size:11px;color:#bfb7a8;margin-bottom:6px;">
                8维人格：<b>${curNpc.persLabel}</b> ｜ IQ:${curNpc.iq} / EQ:${curNpc.eq} / 悟性:${curNpc.daoWit}<br/>
                4维关系：<span class="ls-pill">信任 ${rel.trust}</span><span class="ls-pill">敬畏 ${rel.dread}</span><span class="ls-pill">人情/把柄 ${rel.hook}</span><span class="ls-pill">道念共鸣 ${rel.daoResonance}</span>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;">
                ${window.LifeSim.SOCIAL_ACTIONS.filter(a => a.id !== 'ai_free_talk').map(a => `
                  <button class="ls-btn ${a.cat==='暗黑魔道'?'red':(a.cat==='道途传承'?'jade':'')}" data-sact="${a.id}" title="${a.desc}">[${a.cat}] ${a.name}</button>
                `).join('')}
              </div>
              <div class="ls-log">
                <b style="color:#f2daa0;">【交互因果记录】</b><br/>
                ${rel.history.length ? rel.history.map(h => `• ${h}`).join('<br/>') : '尚未与该修士产生江湖交集，请选择上方任意手段开启博弈。'}
              </div>
            ` : '当前世界暂无在世关键人物。'}
          </div>
        </div>
      `;
      body.querySelectorAll('[data-npc]').forEach(el => { el.onclick = () => { selectedNpcId = el.dataset.npc; renderModal(); }; });
      body.querySelectorAll('[data-sact]').forEach(btn => {
        btn.onclick = () => {
          window.LifeSim.executeSocialAction(HERO, curNpc, btn.dataset.sact);
          saveState();
          renderModal();
        };
      });
    } else {
      body.innerHTML = `
        <div class="ls-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <b>5 池守恒(20,000)</b>：核${en.core} / 游${en.ambient} / 表${en.surf} / 锁${en.locked} / 煞${en.shaE} · 大航海：<b>${WORLD.seaTechUnlocked ? '已连通' : '物理隔绝'}</b>
          </div>
          <div style="display:flex;gap:6px;">
            <label class="ls-btn jade" style="display:inline-block;">📂 导入实验室 v7.4 JSON<input type="file" id="ls-import-file" accept=".json" style="display:none;" /></label>
            <button class="ls-btn" id="ls-regen-world">⚡ 14ms 重建新 1200 年世界</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
          ${WORLD.nodes.map(nd => {
            const holds = (nd.holdings || []).map(h => {
              const f = WORLD.factions.find(x => x.id === h.factionId);
              return f ? `${f.name}(${h.share}%)` : '';
            }).filter(Boolean).join(' · ') || '无主';
            return `<div class="ls-card" style="padding:6px 8px;font-size:10px;">
              <b style="color:#f2daa0;">${nd.id} ${nd.name}</b><br/>
              <span style="color:#6fd3a8;">${holds}</span><br/>
              脉${nd.leyline} 矿${nd.mineral} 药${nd.herb} 煞${nd.sha}<br/>
              <span style="color:#938c7e;">物价:丹×${nd.priceIndex.pill} 矿×${nd.priceIndex.mineral}</span>
            </div>`;
          }).join('')}
        </div>
      `;
      const imp = document.getElementById('ls-import-file');
      if (imp) imp.onchange = async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const json = JSON.parse(await file.text());
          WORLD = window.WorldCore.importLabWorldJson(json);
          HERO = { name: HERO.name || '青云道友', age: 18, iq: 82, eq: 74, daoWit: 86, stones: 70 };
          window.LifeSim.initHeroLife(HERO, WORLD);
          lastLog = [`✔ 已成功导入实验室第 ${WORLD.year} 年世界（${WORLD.eraName}）！`];
          saveState();
          renderModal();
        } catch (err) { alert('导入失败：' + err.message); }
      };
      const rg = document.getElementById('ls-regen-world');
      if (rg) rg.onclick = () => {
        WORLD = window.WorldCore.createWorld({ seed: Math.floor(Math.random() * 99999), params: { awakeYear: 51, surgePct: 70, entryBp: 22, consumeLv: 6, healLv: 4, yaoLv: 4, chaosLv: 6 } });
        window.WorldCore.runGenesis(WORLD, 1200);
        HERO = { name: HERO.name || '青云道友', age: 18, iq: 82, eq: 74, daoWit: 86, stones: 70 };
        window.LifeSim.initHeroLife(HERO, WORLD);
        lastLog = [`⚡ 已在 15ms 内推演全新 1200 年三层同源世界（Seed ${WORLD.seed}）！`];
        saveState();
        renderModal();
      };
    }
  }

  function mount() {
    if (!window.WorldCore || !window.LifeSim) return;
    injectStyles();
    const btn = document.createElement('button');
    btn.id = 'btn-open-life-sim';
    btn.textContent = '☯ 人生·天道 v8.5';
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
          <h2 id="ls-title">沧溟修仙模拟人生 v8.5</h2>
          <button class="ls-btn red" id="ls-close">✕ 关闭</button>
        </div>
        <div class="ls-tabs">
          <div class="ls-tab active" data-tab="life">🧬 人生手记 & 尘世变迁</div>
          <div class="ls-tab" data-tab="social">🤝 4维关系 & 18种江湖博弈</div>
          <div class="ls-tab" data-tab="world">🌍 同源三层世界 (导入JSON)</div>
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
