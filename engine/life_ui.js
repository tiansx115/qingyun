/* ============================================================================
 * 《沧溟界》v8.7.0 完整六维框架 · 可视化五洲七海交互地图 + 多步真实交互场景
 * 文件：engine/life_ui.js
 * ============================================================================ */
(function () {
  'use strict';

  const LS_KEY = 'qingyun_v87_world_life_v1';
  let WORLD = null;
  let HERO = null;
  let activeTab = 'map';
  let mapMode = '3d'; // '3d' (HD-2D Three.js 立体山海) | '2d' (SVG 战术图)
  let selectedPlateId = 'E2';
  let selectedNpcId = null;
  let activeScene = null; // 实时多步交互场景：{ type:'travel_event'|'auction'|'ruin'|'found_sect'|'free_talk', data:{} }
  let lastLog = [];

  // 24 板块真实地理坐标（五洲七海 + 极深渊 + 彼岸孤岛，viewBox 920x450）
  const PLATE_COORDS = {
    // 北陆 (极寒)
    N1: [165, 58],  N2: [285, 62],  N3: [120, 128], N4: [265, 132],
    // 中陆 (中原)
    C1: [330, 210], C2: [225, 245], C3: [445, 195], C4: [365, 290],
    // 东陆 (山海)
    E1: [565, 165], E2: [660, 145], E3: [675, 225], E4: [580, 245],
    // 南陆 (火山)
    S1: [345, 365], S2: [230, 392], S3: [455, 395], S4: [545, 372],
    // 72% 沧溟大洋
    O1: [575, 310], O2: [655, 375], O3: [430, 95],
    O4: [725, 285], O5: [745, 365], O6: [815, 310],
    // 彼岸孤岛
    Y1: [855, 210], Y2: [860, 125]
  };
  const CHOKEPOINT_PAIRS = new Set(['E1-C3', 'C3-E1', 'S1-C4', 'C4-S1', 'N4-C1', 'C1-N4']);

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
      iq: 82, eq: 74, daoWit: 86, stones: 180,
      myFactionId: null,
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
    activeScene = null;
    saveState();
  }

  function saveState() {
    try {
      const slimWorld = Object.assign({}, WORLD, { nodeMap: undefined });
      localStorage.setItem(LS_KEY, JSON.stringify({ world: slimWorld, hero: HERO }));
    } catch {}
  }

  function pushLog(msg) {
    lastLog.unshift(msg);
    if (lastLog.length > 14) lastLog.length = 14;
    HERO.life.diary.unshift(`第${WORLD.year}年：${msg}`);
  }

  function injectStyles() {
    if (document.getElementById('life-ui-style')) return;
    const st = document.createElement('style');
    st.id = 'life-ui-style';
    st.textContent = `
      #ow-hud {
        position:absolute; inset:0; z-index:32; pointer-events:none;
        font-family:"Songti SC","Noto Serif SC",serif; color:#e6dfd3;
      }
      .ow-top-bar {
        position:absolute; top:12px; left:50%; transform:translateX(-50%); pointer-events:auto;
        display:flex; align-items:center; gap:8px; padding:6px 14px;
        background:rgba(8,13,20,0.84); border:1px solid rgba(212,184,122,0.45);
        border-radius:20px; backdrop-filter:blur(6px); box-shadow:0 4px 18px rgba(0,0,0,0.55);
        font-size:11.5px; white-space:nowrap;
      }
      .ow-nearby-wrap {
        position:absolute; bottom:84px; left:50%; transform:translateX(-50%); pointer-events:auto;
        display:none;
      }
      .ow-nearby-wrap.show { display:block; }
      #ow-nearby-btn {
        background:linear-gradient(180deg, rgba(28,74,58,0.96), rgba(14,42,33,0.98));
        border:1.5px solid #6fd3a8; color:#eafff5; padding:8px 18px; border-radius:22px;
        font-size:13px; font-weight:700; letter-spacing:1px; cursor:pointer; font-family:inherit;
        box-shadow:0 6px 24px rgba(0,0,0,0.68), 0 0 16px rgba(111,211,168,0.35);
      }
      #ow-nearby-btn:hover { background:rgba(36,96,74,0.98); transform:translateY(-1px); }
      .ow-ctrl-bl {
        position:absolute; left:16px; bottom:16px; pointer-events:auto;
        display:flex; align-items:flex-end; gap:10px;
      }
      .ow-dpad {
        display:grid; grid-template-columns:repeat(3,32px); grid-template-rows:repeat(3,32px); gap:3px;
        background:rgba(8,12,18,0.65); padding:5px; border-radius:10px; border:1px solid rgba(212,184,122,0.3);
      }
      .ow-dpad button {
        background:rgba(212,184,122,0.14); border:1px solid rgba(212,184,122,0.35); color:#f2daa0;
        border-radius:5px; cursor:pointer; font-size:13px; font-weight:700; user-select:none;
      }
      .ow-dpad button:active { background:rgba(111,211,168,0.4); }
      .ow-hint-box {
        background:rgba(8,12,18,0.78); border:1px solid rgba(212,184,122,0.28); border-radius:6px;
        padding:6px 10px; font-size:10.5px; color:#cfc6b4; line-height:1.55;
      }
      .ow-menu-br {
        position:absolute; right:16px; bottom:16px; pointer-events:auto;
        display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; max-width:460px;
      }
      .ow-menu-btn {
        background:rgba(12,18,28,0.9); border:1px solid rgba(212,184,122,0.48); color:#f2daa0;
        padding:7px 11px; border-radius:5px; font-size:11.5px; font-weight:700; cursor:pointer;
        font-family:inherit; box-shadow:0 4px 14px rgba(0,0,0,0.55);
      }
      .ow-menu-btn:hover { background:rgba(212,184,122,0.24); color:#fff; }
      .ow-menu-btn.accent {
        background:linear-gradient(180deg, rgba(168,52,46,0.95), rgba(118,28,24,0.98));
        border-color:#f2daa0; color:#fff5e0;
      }
      #ow-toast {
        position:fixed; top:66px; left:50%; transform:translateX(-50%); z-index:9900;
        background:rgba(10,18,28,0.94); border:1px solid #6fd3a8; color:#eafff5;
        padding:7px 16px; border-radius:18px; font-size:12px; pointer-events:none;
        opacity:0; transition:opacity 0.25s; box-shadow:0 6px 22px rgba(0,0,0,0.65);
      }
      #ow-toast.show { opacity:1; }
      #life-sim-modal {
        position:fixed; inset:0; z-index:9800; background:rgba(5,8,12,0.88);
        backdrop-filter:blur(6px); display:none; align-items:center; justify-content:center; padding:10px;
        font-family:"Songti SC","Noto Serif SC",serif; color:#e6dfd3;
      }
      #life-sim-modal.open { display:flex; }
      .ls-box {
        width:min(1180px, 98vw); height:min(740px, 95vh); background:#0c1017;
        border:1px solid rgba(212,184,122,0.5); border-radius:6px; display:flex; flex-direction:column; overflow:hidden;
      }
      .ls-head {
        display:flex; justify-content:space-between; align-items:center; padding:8px 14px;
        background:#080b10; border-bottom:1px solid rgba(212,184,122,0.28);
      }
      .ls-head h2 { font-size:14px; color:#f2daa0; margin:0; letter-spacing:1px; }
      .ls-tabs { display:flex; gap:5px; padding:7px 14px; background:#0a0d13; border-bottom:1px solid rgba(212,184,122,0.18); flex-wrap:wrap; }
      .ls-tab {
        padding:5px 11px; font-size:11.5px; border:1px solid rgba(212,184,122,0.28); border-radius:3px;
        background:rgba(212,184,122,0.06); color:#9d9586; cursor:pointer;
      }
      .ls-tab.active { background:rgba(212,184,122,0.24); color:#f2daa0; border-color:#f2daa0; font-weight:700; }
      .ls-body { flex:1; overflow-y:auto; padding:10px 14px; display:flex; flex-direction:column; gap:9px; position:relative; }
      .ls-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      .ls-map-layout { display:grid; grid-template-columns:1fr 330px; gap:10px; align-items:start; }
      .ls-svg-wrap {
        background:radial-gradient(circle at 55% 45%, #112233 0%, #09131f 70%, #050a12 100%);
        border:1px solid rgba(212,184,122,0.38); border-radius:5px; overflow:hidden; position:relative;
      }
      .ls-svg-wrap svg { width:100%; height:auto; display:block; }
      .map-node-g { cursor:pointer; transition:0.15s; }
      .map-node-g:hover circle.nd-core { stroke:#fff; stroke-width:2.5; }
      .ls-card { background:rgba(18,24,34,0.92); border:1px solid rgba(212,184,122,0.22); border-radius:4px; padding:9px 11px; font-size:11.5px; line-height:1.55; }
      .ls-card h3 { font-size:12.5px; color:#f2daa0; margin:0 0 6px; border-bottom:1px solid rgba(212,184,122,0.15); padding-bottom:4px; display:flex; justify-content:space-between; }
      .ls-scene-banner {
        background:linear-gradient(135deg, rgba(32,48,74,0.96), rgba(18,24,36,0.98));
        border:1px solid #f2daa0; border-radius:5px; padding:11px 13px; box-shadow:0 6px 24px rgba(0,0,0,0.6);
      }
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
      .ls-log { background:rgba(6,9,13,0.94); border:1px solid rgba(111,211,168,0.3); padding:8px 10px; border-radius:4px; font-size:11px; line-height:1.6; max-height:150px; overflow-y:auto; }
      .ls-slot-box {
        width:60px; height:60px; border:1px dashed rgba(212,184,122,0.5); border-radius:4px;
        background:rgba(8,12,18,0.9); display:flex; flex-direction:column; align-items:center; justify-content:center;
        overflow:hidden; flex-shrink:0; font-size:9px; color:#938c7e; text-align:center;
      }
      .ls-slot-box img { width:100%; height:100%; object-fit:cover; }
      .ls-input {
        background:#080c12; border:1px solid rgba(212,184,122,0.35); color:#e6dfd3;
        padding:5px 8px; border-radius:3px; font-size:11.5px; font-family:inherit; width:100%;
      }
    `;
    document.head.appendChild(st);
  }

  // ===== 绘制真正的五洲七海 SVG 交互地理大地图 =====
  function buildWorldMapSvg() {
    const drawnEdges = new Set();
    let edgeSvg = '';
    WORLD.nodes.forEach(nd => {
      const p1 = PLATE_COORDS[nd.id];
      if (!p1) return;
      nd.neighbors.forEach(nbId => {
        const key = [nd.id, nbId].sort().join('-');
        if (drawnEdges.has(key)) return;
        drawnEdges.add(key);
        const p2 = PLATE_COORDS[nbId];
        const nb = WORLD.nodeMap[nbId];
        if (!p2 || !nb) return;
        const isChoke = CHOKEPOINT_PAIRS.has(key);
        const isSeaEdge = nd.isSea || nb.isSea;
        let stroke = 'rgba(212,184,122,0.32)', dash = '', sw = 1.6;
        if (isChoke) { stroke = '#f0a850'; dash = '5,3'; sw = 2.4; }
        else if (isSeaEdge) {
          stroke = WORLD.seaTechUnlocked ? 'rgba(112,184,240,0.58)' : 'rgba(112,184,240,0.18)';
          dash = WORLD.seaTechUnlocked ? '' : '3,4';
          sw = WORLD.seaTechUnlocked ? 1.8 : 1.2;
        }
        edgeSvg += `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${stroke}" stroke-width="${sw}" ${dash ? `stroke-dasharray="${dash}"` : ''} />`;
        if (isChoke) {
          const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
          edgeSvg += `<text x="${mx}" y="${my - 4}" fill="#ffd299" font-size="8.5" text-anchor="middle">咽喉关隘</text>`;
        }
      });
    });

    let nodesSvg = '';
    WORLD.nodes.forEach(nd => {
      const pos = PLATE_COORDS[nd.id];
      if (!pos) return;
      const isHere = HERO.locId === nd.id;
      const isSel = selectedPlateId === nd.id;
      const hasRuin = (WORLD.ruins || []).some(r => r.plateId === nd.id);
      const hasInst = (WORLD.institutions || []).some(i => i.plateId === nd.id && i.status !== 'abolished');
      let fill = nd.isSea ? '#1d4d78' : (nd.sha >= 55 ? '#8f2c2c' : (nd.elem === 'ice' ? '#3d6382' : (nd.elem === 'fire' ? '#8c4427' : (nd.elem === 'wood' ? '#296b52' : '#7a6638'))));
      const stroke = isSel ? '#ffffff' : (isHere ? '#6fd3a8' : '#d4b87a');
      const r = isSel ? 15 : (isHere ? 14 : 11.5);
      nodesSvg += `
        <g class="map-node-g" data-pid="${nd.id}" transform="translate(${pos[0]},${pos[1]})">
          ${isHere ? `<circle r="21" fill="none" stroke="#6fd3a8" stroke-width="1.6" stroke-dasharray="4,3" opacity="0.85" />` : ''}
          ${nd.sha >= 55 ? `<circle r="18" fill="rgba(224,98,88,0.22)" />` : ''}
          <circle class="nd-core" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${isSel?2.5:1.5}" />
          <text y="3.5" fill="#fff" font-size="8.5" font-weight="700" text-anchor="middle">${nd.id}</text>
          <text y="25" fill="${isSel?'#fff':'#e6dfd3'}" font-size="9.5" text-anchor="middle">${nd.name.slice(0, 7)}</text>
          ${isHere ? `<text x="14" y="-10" font-size="12">📍</text>` : ''}
          ${hasRuin ? `<text x="-18" y="-9" font-size="10">🗝️</text>` : ''}
          ${hasInst ? `<text x="12" y="13" font-size="10">⚖️</text>` : ''}
        </g>
      `;
    });

    return `
      <svg viewBox="0 0 920 445" xmlns="http://www.w3.org/2000/svg">
        <!-- 五洲水墨地形轮廓 -->
        <polygon points="75,30 335,28 345,155 110,165" fill="rgba(120,168,205,0.13)" stroke="rgba(150,200,235,0.26)" stroke-width="1.2" />
        <text x="95" y="45" fill="rgba(180,220,250,0.45)" font-size="11">北陆 · 极寒冰原</text>

        <polygon points="180,175 480,165 455,320 195,310" fill="rgba(205,178,118,0.12)" stroke="rgba(212,184,122,0.26)" stroke-width="1.2" />
        <text x="195" y="192" fill="rgba(242,218,160,0.45)" font-size="11">中陆 · 中原沃野</text>

        <polygon points="525,115 725,110 725,268 530,275" fill="rgba(105,195,155,0.13)" stroke="rgba(111,211,168,0.26)" stroke-width="1.2" />
        <text x="640" y="128" fill="rgba(159,242,207,0.45)" font-size="11">东陆 · 青木山海</text>

        <polygon points="185,342 575,340 580,428 190,425" fill="rgba(218,108,82,0.13)" stroke="rgba(224,118,92,0.28)" stroke-width="1.2" />
        <text x="198" y="362" fill="rgba(255,175,155,0.45)" font-size="11">南陆 · 炽热火山</text>

        <polygon points="815,92 900,98 898,248 815,245" fill="rgba(186,138,240,0.14)" stroke="rgba(194,142,242,0.32)" stroke-width="1.2" />
        <text x="822" y="108" fill="rgba(226,194,255,0.55)" font-size="10">彼岸孤岛</text>

        <text x="640" y="340" fill="rgba(112,184,240,0.35)" font-size="12" letter-spacing="3">沧 溟 大 洋 (${WORLD.seaTechUnlocked?'大航海已通':'海路隔绝'})</text>
        ${edgeSvg}
        ${nodesSvg}
      </svg>
    `;
  }

  // ===== 渲染多步实时交互场景（赶路劫修 / 拍卖抬价 / 遗迹破阵 / 开宗立派 / DeepSeek自由交涉） =====
  function renderActiveSceneHtml() {
    if (!activeScene) return '';
    const d = activeScene.data || {};
    if (activeScene.type === 'travel_event') {
      return `
        <div class="ls-scene-banner">
          <div style="color:#ffd299;font-size:13px;font-weight:700;margin-bottom:4px;">⚔️ 途中遇险 · 【${d.plateName}】黑暗森林(指数 ${d.dfIdx})</div>
          <div style="font-size:11.5px;margin-bottom:8px;">你正赶往【${d.plateName}】，半路林间突然窜出三名蒙面劫修，刀剑相指：“此山是我开，留下 40 块灵石买路，否则搜魂夺宝！”</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="ls-btn red" data-sc="fight">⚔️ 硬刚反杀（有几率负暗伤，胜则夺其储物袋）</button>
            <button class="ls-btn" data-sc="pay">💰 破财免灾（交 40 灵石平安脱身）</button>
            <button class="ls-btn blue" data-sc="bluff">🎭 智谋唬退（比拼 IQ:${HERO.iq} ${HERO.masked?'+易容马甲加成':''}）</button>
          </div>
        </div>
      `;
    }
    if (activeScene.type === 'auction') {
      return `
        <div class="ls-scene-banner">
          <div style="color:#f2daa0;font-size:13px;font-weight:700;margin-bottom:4px;">⚖️ ${d.inst.name}（${d.inst.status==='corrupt'?'⚠️ 黑幕腐化：托儿遍地':'繁荣盛会'} · 你的灵石：${HERO.stones}）</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0;">
            ${d.lots.map((lot, i) => `
              <div class="ls-card" style="padding:7px;">
                <b style="color:#f2daa0;">${lot.name}</b> ${lot.checked ? (lot.isFake ? '<span class="ls-pill warn">已验：假货!</span>' : '<span class="ls-pill jade">已验：真品!</span>') : ''}<br/>
                <span style="color:#938c7e;font-size:10px;">底价 ${lot.price} 灵石 · ${lot.desc}</span>
                <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap;">
                  <button class="ls-btn jade" data-auc="buy|${i}">竞拍(${lot.price})</button>
                  <button class="ls-btn blue" data-auc="inspect|${i}">鉴宝(IQ)</button>
                  <button class="ls-btn red" data-auc="shill|${i}">抬价坑人</button>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="ls-btn" data-sc="close">离开会场</button>
        </div>
      `;
    }
    if (activeScene.type === 'ruin') {
      return `
        <div class="ls-scene-banner">
          <div style="color:#a8d4ff;font-size:13px;font-weight:700;margin-bottom:4px;">🗝️ 深入古遗迹 · 【${d.ruin.name}】（阵法强度 ${d.ruin.sealStrength}）</div>
          <div style="font-size:11.5px;margin-bottom:8px;">墓主为上古大能【${d.ruin.ownerName}】，石门残阵隐隐闪烁雷光，门后疑似封存着：${d.ruin.vault.join('、')}。你打算如何行事？</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="ls-btn jade" data-sc="ruin_wit">🧠 以悟性(${HERO.daoWit})推演破阵（稳妥取宝）</button>
            <button class="ls-btn red" data-sc="ruin_force">💥 强行轰开禁制（必得重宝，但易留暗伤）</button>
            <button class="ls-btn blue" data-sc="ruin_sellmap">📜 绘成真假残图卖给仇家（赚 120 灵石坐山观虎斗）</button>
            <button class="ls-btn" data-sc="close">暂且退去</button>
          </div>
        </div>
      `;
    }
    if (activeScene.type === 'found_sect') {
      return `
        <div class="ls-scene-banner">
          <div style="color:#6fd3a8;font-size:13px;font-weight:700;margin-bottom:4px;">🏯 开宗立派 · 于【${d.plateName}】立下你的道统（需 150 灵石）</div>
          <div style="display:flex;gap:8px;align-items:center;margin:8px 0;">
            <input class="ls-input" id="inp-new-sect-name" value="太初青云宗" placeholder="输入你的宗门名" style="max-width:220px;" />
            <button class="ls-btn jade" data-sc="do_found_sect">确认开宗（写入世界内核！）</button>
            <button class="ls-btn" data-sc="close">取消</button>
          </div>
        </div>
      `;
    }
    if (activeScene.type === 'free_talk') {
      return `
        <div class="ls-scene-banner">
          <div style="color:#a8d4ff;font-size:13px;font-weight:700;margin-bottom:4px;">🗣️ DeepSeek 自由交涉 · 对话【${d.npc.name}】(${d.npc.persLabel} · IQ:${d.npc.iq})</div>
          <div style="font-size:10.5px;color:#938c7e;margin-bottom:6px;">可直接打字画大饼、套话、威胁或求情；若未填 DeepSeek Key 则自动按其 8 维人格做本地裁定。</div>
          <div style="display:flex;gap:6px;margin-bottom:6px;">
            <input class="ls-input" id="inp-free-talk" placeholder="例：道友，我知道北陆陨坑有极品灵矿，愿与你三七分账联手探索……" />
            <button class="ls-btn jade" id="btn-send-free-talk" style="white-space:nowrap;">发送交涉</button>
            <button class="ls-btn" data-sc="close">结束</button>
          </div>
          ${d.reply ? `<div class="ls-log">${d.reply}</div>` : ''}
        </div>
      `;
    }
    if (activeScene.type === 'beast_hunt') {
      const b = d.beast || { name: '幽林妖狼', plate: { name: '野外' } };
      return `
        <div class="ls-scene-banner">
          <div style="color:#ffaaa3;font-size:13px;font-weight:700;margin-bottom:4px;">🐾 野外遇妖 · 【${b.name}】（出没于 ${b.plate ? b.plate.name : '荒野'}）</div>
          <div style="font-size:11.5px;margin-bottom:8px;">你在山林间与一头凶气逼人的【${b.name}】正面遭遇！它低伏身躯发出低吼，周身妖气翻涌。</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="ls-btn red" data-sc="beast_kill">⚔️ 祭剑搏杀（胜则获妖丹+灵石，有概率负伤）</button>
            <button class="ls-btn blue" data-sc="beast_trap">🕸️ 布阵智取（比拼 IQ:${HERO.iq} 稳妥斩妖）</button>
            <button class="ls-btn jade" data-sc="beast_tame">✨ 灵契驯服（收为伴生灵宠）</button>
            <button class="ls-btn" data-sc="close">💨 施展身法退避</button>
          </div>
        </div>
      `;
    }
    return '';
  }

  function bindSceneActions(body) {
    if (!activeScene) return;
    body.querySelectorAll('[data-sc]').forEach(btn => {
      btn.onclick = () => {
        const sc = btn.dataset.sc;
        const d = activeScene.data;
        if (sc === 'close') { activeScene = null; renderModal(); return; }

        if (activeScene.type === 'travel_event') {
          if (sc === 'fight') {
            if (Math.random() < 0.65) {
              HERO.stones += 55;
              pushLog(`你反杀拦路劫修，搜出 55 灵石！顺利抵达【${d.plateName}】。`);
            } else {
              HERO.life.injuries.push({ name: '劫修伏击剑伤', penalty: '气血上限-8%' });
              pushLog(`激战中你虽击退劫修，却留下【劫修伏击剑伤】，带伤抵达【${d.plateName}】。`);
            }
          } else if (sc === 'pay') {
            HERO.stones = Math.max(0, HERO.stones - 40);
            pushLog(`你交出 40 灵石破财免灾，平安抵达【${d.plateName}】。`);
          } else if (sc === 'bluff') {
            const ok = (HERO.iq + (HERO.masked ? 18 : 0)) >= 85;
            if (ok) pushLog(`你沉声亮出大宗名号${HERO.masked?'与鬼面威势':''}，劫修疑心大起惊退！平安抵达【${d.plateName}】。`);
            else { HERO.stones = Math.max(0, HERO.stones - 50); pushLog(`劫修未被唬住，你只得丢下 50 灵石突围抵达【${d.plateName}】。`); }
          }
          HERO.locId = d.plateId;
          activeScene = null; saveState(); renderModal(); return;
        }

        if (activeScene.type === 'ruin') {
          const r = d.ruin;
          if (sc === 'ruin_wit' || sc === 'ruin_force') {
            r.discovered = true;
            const loot = r.vault[0] || '上古灵石箱';
            HERO.bag.push({ id: 'it_' + Date.now(), name: loot, kind: '遗迹秘宝', qty: 1, desc: `出土于【${r.name}】` });
            if (loot.includes('残') || loot.includes('经')) HERO.arts.push(loot);
            if (sc === 'ruin_force') HERO.life.injuries.push({ name: '古阵雷煞反噬', penalty: '修炼-10%' });
            pushLog(`你${sc==='ruin_wit'?'以悟性巧破残阵':'强行轰开古阵'}，从【${r.name}】夺得【${loot}】！`);
          } else if (sc === 'ruin_sellmap') {
            HERO.stones += 120; HERO.life.reputation.demonic += 8;
            pushLog(`你将【${r.name}】绘成真假参半的残图高价售出，净赚 120 灵石，坐看三家仇敌入阵互残！`);
          }
          activeScene = null; saveState(); renderModal(); return;
        }

        if (activeScene.type === 'beast_hunt') {
          const b = d.beast || { name: '幽林妖狼' };
          if (sc === 'beast_kill') {
            HERO.stones += 45;
            HERO.bag.push({ id: 'it_' + Date.now(), name: `${b.name}妖丹`, kind: '妖材', qty: 1, desc: '可炼丹或售卖换取灵石' });
            if (Math.random() < 0.35) HERO.life.injuries.push({ name: '妖爪裂伤', penalty: '气血上限-5%' });
            pushLog(`你与【${b.name}】激战数十回合终将其斩杀，剖得妖丹一枚与 45 灵石！`);
          } else if (sc === 'beast_trap') {
            if (HERO.iq >= 75) {
              HERO.stones += 38;
              HERO.bag.push({ id: 'it_' + Date.now(), name: `${b.name}灵皮`, kind: '妖材', qty: 1, desc: '炼器制符上佳灵材' });
              pushLog(`你借地形布下困灵小阵智取【${b.name}】，毫发无损收获灵皮与 38 灵石！`);
            } else {
              pushLog(`困阵被【${b.name}】蛮力撞破，你只得抽身退走。`);
            }
          } else if (sc === 'beast_tame') {
            if (!HERO.pets.includes(b.name)) HERO.pets.push(b.name);
            HERO.life.loneliness = Math.max(0, HERO.life.loneliness - 18);
            pushLog(`你以灵识温和安抚并缔结血契，成功收服【${b.name}】为伴生灵宠！`);
          }
          activeScene = null; saveState(); syncTopHud(); renderModal(); return;
        }

        if (activeScene.type === 'found_sect' && sc === 'do_found_sect') {
          const nm = (document.getElementById('inp-new-sect-name')?.value || '太初青云宗').trim();
          if (HERO.stones < 150) { alert('灵石不足 150！'); return; }
          HERO.stones -= 150;
          const nd = WORLD.nodeMap[HERO.locId];
          const fac = {
            id: 'f_hero_' + Date.now(), name: nm, kind: 'sect', homePlate: nd.id, isSeaFac: nd.isSea,
            leaderId: 'hero', leader: HERO.name, pers: { yi: 40, kuang: 20, ren: 30, chi: 0, ao: 20, dao: 50, cheng: 30, pan: 0 },
            born: WORLD.year, fallen: null, alive: true,
            treasury: { mineral: 100, herb: 100, stones: 300 }, disciples: 60, diplomacy: {}, dryEpochs: 0
          };
          WORLD.factions.push(fac);
          window.WorldCore.adjustHolding(nd, fac.id, 35);
          HERO.myFactionId = fac.id;
          WORLD.chronicles.unshift({ year: WORLD.year, tag: '开宗', text: `第${WORLD.year}年：玩家【${HERO.name}】于【${nd.name}】正式开山立派，创立【${nm}】！` });
          pushLog(`你耗费 150 灵石在【${nd.name}】正式开宗立派【${nm}】（占本地 35% 影响力），正式加入五洲七海势力博弈！`);
          activeScene = null; saveState(); renderModal(); return;
        }
      };
    });

    // 拍卖会竞价 / 鉴宝 / 抬价坑人
    body.querySelectorAll('[data-auc]').forEach(btn => {
      btn.onclick = () => {
        const [op, idxStr] = btn.dataset.auc.split('|');
        const idx = Number(idxStr);
        const lot = activeScene.data.lots[idx];
        if (!lot) return;
        if (op === 'inspect') {
          lot.checked = true;
          pushLog(`你运起神识鉴宝【${lot.name}】→ 确认此物为【${lot.isFake ? '黑幕赝品！' : '货真价实之物！'}】`);
        } else if (op === 'buy') {
          if (HERO.stones < lot.price) { alert('灵石不足！'); return; }
          HERO.stones -= lot.price;
          if (lot.isFake) {
            pushLog(`你花 ${lot.price} 灵石拍下【${lot.name}】，散场后才发现竟是黑市假货，血亏！`);
          } else {
            HERO.bag.push({ id: 'it_' + Date.now(), name: lot.name, kind: lot.kind, qty: 1, desc: lot.desc });
            pushLog(`你以 ${lot.price} 灵石成功拍得真品【${lot.name}】！`);
          }
          activeScene.data.lots.splice(idx, 1);
        } else if (op === 'shill') {
          lot.price = Math.round(lot.price * 1.45);
          HERO.stones += 25;
          pushLog(`你故意疯狂抬价把【${lot.name}】顶到 ${lot.price} 灵石，让死对头高价接盘，你暗收托费/差价 +25 灵石！`);
        }
        saveState(); renderModal();
      };
    });

    // DeepSeek 自由交涉发送
    const sendBtn = document.getElementById('btn-send-free-talk');
    if (sendBtn) {
      sendBtn.onclick = async () => {
        const txt = (document.getElementById('inp-free-talk')?.value || '').trim();
        if (!txt) return;
        const npc = activeScene.data.npc;
        const rel = window.LifeSim.ensureRel(HERO, npc.id);
        const key = localStorage.getItem('cangming_ds_key') || '';
        sendBtn.disabled = true; sendBtn.textContent = '交涉中…';
        if (key) {
          try {
            const resp = await fetch(localStorage.getItem('cangming_ds_url') || 'https://api.deepseek.com/chat/completions', {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
              body: JSON.stringify({
                model: localStorage.getItem('cangming_ds_model') || 'deepseek-chat',
                response_format: { type: 'json_object' },
                messages: [
                  { role: 'system', content: '你是修仙沙盒NPC自由交涉裁判，只输出纯JSON: {"reply":"80字内贴合性格古风回复","trust_d":0,"dread_d":0,"hook_d":0,"dao_d":0}' },
                  { role: 'user', content: `NPC:${npc.name}(${npc.species}·${npc.realm},人格:${npc.persLabel},IQ:${npc.iq}/EQ:${npc.eq}/悟:${npc.daoWit})，当前关系:信任${rel.trust}/敬畏${rel.dread}/把柄${rel.hook}/道念${rel.daoResonance}。玩家说：“${txt}”。请按NPC真实人格裁定回应与关系增减。` }
                ]
              })
            });
            const j = JSON.parse((await resp.json()).choices[0].message.content);
            rel.trust = Math.max(-100, Math.min(100, rel.trust + (Number(j.trust_d) || 0)));
            rel.dread = Math.max(0, Math.min(100, rel.dread + (Number(j.dread_d) || 0)));
            rel.hook = Math.max(-100, Math.min(100, rel.hook + (Number(j.hook_d) || 0)));
            rel.daoResonance = Math.max(-100, Math.min(100, rel.daoResonance + (Number(j.dao_d) || 0)));
            activeScene.data.reply = `<b>${npc.name}：</b>“${j.reply}”<br/><span style="color:#6fd3a8;">关系变动：信${j.trust_d>=0?'+':''}${j.trust_d} 畏${j.dread_d>=0?'+':''}${j.dread_d} 柄${j.hook_d>=0?'+':''}${j.hook_d} 道${j.dao_d>=0?'+':''}${j.dao_d}</span>`;
            rel.history.unshift(`自由交涉：${j.reply}`);
            saveState(); renderModal(); return;
          } catch {}
        }
        // 无 Key 时按 8 维人格本地即时裁定
        const wary = (npc.p?.cheng || 0) < -15;
        const reply = wary
          ? `“哼，阁下这番话听着动人，可在这黑暗森林里空口白牙我怎敢轻信？拿出真凭实据来再谈！”（多疑性格，信任 -5）`
          : `“道友言之有理，此事倒有几分可图，不妨先饮一杯再详议。”（信任 +8，道念 +5）`;
        rel.trust += wary ? -5 : 8;
        if (!wary) rel.daoResonance += 5;
        activeScene.data.reply = `<b>${npc.name}：</b>${reply}`;
        rel.history.unshift(`自由交涉：${reply}`);
        saveState(); renderModal();
      };
    }
  }

  function renderModal() {
    ensureInit();
    syncTopHud();
    const body = document.getElementById('ls-body');
    const title = document.getElementById('ls-title');
    const curPlate = WORLD.nodeMap[HERO.locId] || WORLD.nodes[0];
    title.textContent = `沧溟修仙模拟人生 v9.0 · 第 ${WORLD.year} 年 ${WORLD.month} 月 · 身在【${curPlate.name}】 · 灵石 ${HERO.stones}`;

    document.querySelectorAll('.ls-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === activeTab);
    });

    const sceneHtml = renderActiveSceneHtml();

    if (activeTab === 'map') {
      const sp = WORLD.nodeMap[selectedPlateId] || curPlate;
      const localInsts = (WORLD.institutions || []).filter(i => i.plateId === sp.id);
      const localRuins = (WORLD.ruins || []).filter(r => r.plateId === sp.id);
      const canTravel = curPlate.neighbors.includes(sp.id) || WORLD.seaTechUnlocked;
      const holdsTxt = (sp.holdings || []).map(h => {
        const f = WORLD.factions.find(x => x.id === h.factionId);
        return f ? `${f.name}(${h.share}%)` : '';
      }).filter(Boolean).join(' · ') || '无主之地';

      body.innerHTML = `
        ${sceneHtml}
        <div class="ls-map-layout">
          <div class="ls-svg-wrap" style="min-height:430px;">
            ${buildWorldMapSvg()}
            <div style="position:absolute;left:8px;bottom:6px;z-index:10;font-size:9.5px;color:#d8d0c0;background:rgba(5,8,12,0.82);padding:3px 8px;border-radius:3px;">
              五洲七海战略舆图 · 点击板块查看势力/物价/遗迹，点击右侧按钮可令 3D 主角自动寻路前往
            </div>
          </div>
          <div class="ls-card" style="display:flex;flex-direction:column;gap:6px;">
            <h3><span>${sp.name} (${sp.id})</span><span>${sp.climate}/${sp.elem}</span></h3>
            <div style="font-size:10.5px;color:#6fd3a8;">势力份额：${holdsTxt}</div>
            <div style="font-size:10.5px;">
              脉<b>${sp.leyline}</b> · 矿<b>${sp.mineral}</b> · 药<b>${sp.herb}</b> · 煞<b style="color:${sp.sha>=55?'#ff9d95':'#c28ef2'}">${sp.sha}</b> ·
              黑暗森林 <b style="color:${(sp.darkForestIdx||0)>=65?'#ff9d95':'#70b8f0'}">${sp.darkForestIdx||0}</b><br/>
              凡人 ${sp.pop.toLocaleString()} ｜ 物价：丹×${sp.priceIndex.pill} 矿×${sp.priceIndex.mineral} 粮×${sp.priceIndex.grain}
            </div>
            <div>${(sp.phenomena || []).map(x => `<span class="ls-pill ${x.includes('黑暗')||x.includes('邪教')?'warn':'jade'}">${x}</span>`).join('') || '<span class="ls-pill">自然荒野</span>'}</div>
            <div style="font-size:10.5px;color:#bfb7a8;border-top:1px dashed rgba(212,184,122,0.18);padding-top:5px;">
              <b>涌现制度：</b>${localInsts.length ? localInsts.map(i => `${i.name}(${i.cycleYears?`每${i.cycleYears}年`:'常设'}·${i.status})`).join('；') : '无'}<br/>
              <b>真实遗迹：</b>${localRuins.length ? localRuins.map(r => `${r.name}(阵${r.sealStrength})`).join('；') : '无'}
            </div>
            <div style="display:flex;flex-direction:column;gap:5px;margin-top:4px;">
              ${HERO.locId !== sp.id
                ? `<button class="ls-btn jade" id="btn-walk-plate">🧭 令主角自动寻路前往【${sp.name}】（关闭地图在 3D 世界中行走）</button>
                   <button class="ls-btn" id="btn-travel-plate" ${canTravel?'':'disabled'}>${canTravel ? `⚡ 快速跋涉直达【${sp.name}】（耗时2月）` : '🔒 隔洲未邻接（需沿关隘或等大航海解锁）'}</button>`
                : `
                  <button class="ls-btn" id="btn-teahouse">🍵 逛茶馆听评书（听本世界真实史话）</button>
                  ${localInsts.length ? `<button class="ls-btn blue" id="btn-open-auction">⚖️ 进入【${localInsts[0].name}】（竞价/鉴宝/抬价坑人）</button>` : ''}
                  ${localRuins.length ? `<button class="ls-btn red" id="btn-open-ruin">🗝️ 探索【${localRuins[0].name}】（破阵/卖假图）</button>` : ''}
                  ${!HERO.myFactionId ? `<button class="ls-btn jade" id="btn-open-found">🏯 在此地开宗立派（150 灵石）</button>` : ''}
                `}
            </div>
          </div>
        </div>
      `;
      body.querySelectorAll('[data-pid]').forEach(el => { el.onclick = () => { selectedPlateId = el.dataset.pid; activeScene = null; renderModal(); }; });
      const wp = document.getElementById('btn-walk-plate');
      if (wp) wp.onclick = () => {
        document.getElementById('life-sim-modal').classList.remove('open');
        if (window.Map3D) window.Map3D.moveToPlate(sp.id);
        showOwToast(`🧭 主角正动身前往【${sp.name}】……`);
      };
      const tv = document.getElementById('btn-travel-plate');
      if (tv) tv.onclick = () => {
        window.LifeSim.advanceLifeMonths(HERO, WORLD, 2, 'mortal_life');
        if ((sp.darkForestIdx || 0) >= 40 && Math.random() < 0.65) {
          activeScene = { type: 'travel_event', data: { plateId: sp.id, plateName: sp.name, dfIdx: sp.darkForestIdx } };
        } else {
          HERO.locId = sp.id;
          if (window.Map3D) window.Map3D.teleportToPlate(sp.id);
          pushLog(`你历经两月风霜平安抵达【${sp.name}】。`);
        }
        saveState(); syncTopHud(); renderModal();
      };
      const th = document.getElementById('btn-teahouse');
      if (th) th.onclick = () => {
        const hist = WORLD.chronicles[Math.floor(Math.random() * Math.min(18, WORLD.chronicles.length))];
        HERO.life.loneliness = Math.max(0, HERO.life.loneliness - 15);
        pushLog(`你在【${sp.name}】茶馆听评书：“${hist ? hist.text : '太古灵潮初开之时……'}”`);
        saveState(); activeTab = 'life'; renderModal();
      };
      const oa = document.getElementById('btn-open-auction');
      if (oa) oa.onclick = () => {
        const inst = localInsts[0];
        const corrupt = inst.status === 'corrupt';
        activeScene = {
          type: 'auction',
          data: {
            inst,
            lots: [
              { name: '二阶筑基灵丹', kind: '丹药', price: Math.round(95 * sp.priceIndex.pill), desc: '突破筑基关键灵丹', isFake: corrupt && Math.random() < 0.5, checked: false },
              { name: '太古陨星灵矿', kind: '灵材', price: Math.round(70 * sp.priceIndex.mineral), desc: '炼制高阶飞剑主材', isFake: false, checked: false },
              { name: '古宗残缺剑诀', kind: '功法', price: 110, desc: '疑似某覆灭大宗流出', isFake: corrupt, checked: false }
            ]
          }
        };
        renderModal();
      };
      const oru = document.getElementById('btn-open-ruin');
      if (oru) oru.onclick = () => { activeScene = { type: 'ruin', data: { ruin: localRuins[0] } }; renderModal(); };
      const ofd = document.getElementById('btn-open-found');
      if (ofd) ofd.onclick = () => { activeScene = { type: 'found_sect', data: { plateName: sp.name } }; renderModal(); };
    } else if (activeTab === 'life') {
      const life = HERO.life;
      body.innerHTML = `
        ${sceneHtml}
        <div class="ls-card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <div class="ls-slot-box" data-asset-slot="hero_portrait"><img src="assets/chars/hero.webp" alt="主角立绘" /></div>
          <div style="flex:1;min-width:260px;">
            <div style="font-size:13px;">
              <b style="color:#f2daa0;">${HERO.masked ? `${HERO.maskName} (易容马甲)` : HERO.name}</b> ·
              <span class="ls-pill jade">${HERO.realm}</span> · 寿 <b>${HERO.age}</b> 岁 · 灵石 <b>${HERO.stones}</b> · IQ:${HERO.iq} EQ:${HERO.eq} 悟:${HERO.daoWit}
            </div>
            <div style="margin-top:4px;font-size:11px;">
              心魔 <b style="color:${life.heartDemon>=50?'#ff9d95':'#6fd3a8'}">${life.heartDemon}/100</b> ｜ 丹毒 <b>${life.pillToxin}/100</b> ｜ 孤寂 <b>${life.loneliness}/100</b>
            </div>
            <div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap;">
              <button class="ls-btn jade" data-act="seclude1">闭关 1 年</button>
              <button class="ls-btn jade" data-act="seclude10">闭关 10 年（看尘世变迁）</button>
              <button class="ls-btn" data-act="mortal">红尘炼心 (1年)</button>
              <button class="ls-btn" data-act="work">仙城画符谋生 (1年)</button>
              <button class="ls-btn blue" data-act="court">入世当王府供奉 (1年)</button>
              <button class="ls-btn ${HERO.masked?'red':''}" data-act="mask">${HERO.masked ? '🎭 摘下马甲' : '🎭 戴上易容马甲'}</button>
            </div>
          </div>
        </div>
        ${lastLog.length ? `<div class="ls-log"><b style="color:#6fd3a8;">【最新尘世变迁与人生记录】</b><br/>${lastLog.map(x => `• ${x}`).join('<br/>')}</div>` : ''}
        <div class="ls-grid-2">
          <div class="ls-card">
            <h3><span>凡人亲情与故旧羁绊</span><span style="font-size:10px;color:#938c7e;">故乡:${life.homePlateName}</span></h3>
            ${life.family.map(f => `<div style="padding:4px 0;border-bottom:1px dashed rgba(212,184,122,0.12);opacity:${f.alive?1:0.5}"><b>${f.name}</b>（${f.role}）· ${f.alive ? `在世 ${Math.round(f.age)}/${f.maxAge} 岁` : `<span style="color:#ff9d95;">已故（享年 ${Math.round(f.age)} 岁）</span>`} · 羁绊 ${f.bond}</div>`).join('')}
            <div style="margin-top:7px;color:#938c7e;font-size:10.5px;">多面名声：凡人(${life.reputation.mortal}) · 正道(${life.reputation.righteous}) · 魔道(${life.reputation.demonic}) · 妖海(${life.reputation.yao})</div>
          </div>
          <div class="ls-card">
            <h3><span>人生执念 · 暗伤 · 手记</span></h3>
            <div><b>执念：</b>${life.obsessions.map(o => `${o.done ? '✔' : '○'} ${o.text}`).join(' ｜ ')}</div>
            <div style="margin-top:4px;"><b>永久暗伤：</b>${life.injuries.length ? life.injuries.map(i => `<span style="color:#ff9d95;">${i.name}(${i.penalty})</span>`).join('、') : '体魄完好'}</div>
            <div style="margin-top:6px;max-height:130px;overflow-y:auto;color:#bfb7a8;font-size:10.5px;">${life.diary.slice(0, 14).map(d => `<div>• ${d}</div>`).join('')}</div>
          </div>
        </div>
      `;
      body.querySelectorAll('[data-act]').forEach(btn => {
        btn.onclick = () => {
          const a = btn.dataset.act;
          if (a === 'mask') { HERO.masked = !HERO.masked; pushLog(HERO.masked ? `你戴上【${HERO.maskName}】隐匿真容！` : `你摘下马甲恢复真容。`); saveState(); renderModal(); return; }
          if (a === 'court') { const res = window.LifeSim.advanceLifeMonths(HERO, WORLD, 12, 'livelihood'); HERO.stones += 45; HERO.life.reputation.mortal += 8; lastLog = [`在王府任供奉 1 年，得 45 灵石！`, ...res.changes]; saveState(); renderModal(); return; }
          const res = a === 'seclude1' ? window.LifeSim.advanceLifeMonths(HERO, WORLD, 12, 'seclude')
            : a === 'seclude10' ? window.LifeSim.advanceLifeMonths(HERO, WORLD, 120, 'seclude')
            : a === 'mortal' ? window.LifeSim.advanceLifeMonths(HERO, WORLD, 12, 'mortal_life')
            : window.LifeSim.advanceLifeMonths(HERO, WORLD, 12, 'livelihood');
          lastLog = res.changes.slice();
          if (res.proactiveEvent) lastLog.unshift(`${res.proactiveEvent.title}：${res.proactiveEvent.desc}`);
          saveState(); renderModal();
        };
      });
    } else if (activeTab === 'social') {
      const aliveNpcs = WORLD.people.filter(c => c.alive).slice(0, 22);
      if (!selectedNpcId && aliveNpcs.length) selectedNpcId = aliveNpcs[0].id;
      const curNpc = aliveNpcs.find(c => c.id === selectedNpcId) || aliveNpcs[0];
      const rel = curNpc ? window.LifeSim.ensureRel(HERO, curNpc.id) : null;
      body.innerHTML = `
        ${sceneHtml}
        <div class="ls-grid-2" style="grid-template-columns:270px 1fr;">
          <div class="ls-card" style="max-height:510px;overflow-y:auto;">
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
                <div class="ls-slot-box" data-asset-slot="npc_portrait_${curNpc.species}"><span>NPC立绘<br/>${curNpc.species}</span></div>
                <div>
                  <h3 style="border:none;margin:0;padding:0;">${curNpc.name}（${curNpc.species} · ${curNpc.realm} · ${Math.round(curNpc.age)}/${curNpc.maxAge}岁）</h3>
                  <div style="font-size:11px;color:#bfb7a8;">8维人格：<b>${curNpc.persLabel}</b> ｜ IQ:${curNpc.iq} EQ:${curNpc.eq} 悟:${curNpc.daoWit}</div>
                  <div><span class="ls-pill">信任 ${rel.trust}</span><span class="ls-pill">敬畏 ${rel.dread}</span><span class="ls-pill jade">人情把柄 ${rel.hook}</span><span class="ls-pill">道念共鸣 ${rel.daoResonance}</span></div>
                </div>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;">
                ${window.LifeSim.SOCIAL_ACTIONS.map(a => `
                  <button class="ls-btn ${a.id==='ai_free_talk'?'blue':(a.cat==='暗黑魔道'?'red':(a.cat==='道途传承'?'jade':''))}" data-sact="${a.id}" title="${a.desc}">[${a.cat}] ${a.name}</button>
                `).join('')}
              </div>
              <div class="ls-log"><b style="color:#f2daa0;">【江湖博弈因果】</b><br/>${rel.history.length ? rel.history.map(h => `• ${h}`).join('<br/>') : '请选择上方 18 种江湖手段开启博弈。'}</div>
            ` : '暂无在世关键人物。'}
          </div>
        </div>
      `;
      body.querySelectorAll('[data-npc]').forEach(el => { el.onclick = () => { selectedNpcId = el.dataset.npc; activeScene = null; renderModal(); }; });
      body.querySelectorAll('[data-sact]').forEach(btn => {
        btn.onclick = () => {
          if (btn.dataset.sact === 'ai_free_talk') {
            activeScene = { type: 'free_talk', data: { npc: curNpc, reply: '' } };
            renderModal(); return;
          }
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
                <div class="ls-slot-box" data-asset-slot="beast_art_${idx}"><span>妖兽图鉴<br/>待补图</span></div>
                <div style="flex:1;">
                  <b style="color:#f2daa0;">${b.name}</b> <span class="ls-pill ${b.tier.includes('煞')?'warn':'jade'}">${b.tier}</span>
                  <div style="font-size:10.5px;color:#938c7e;margin:3px 0;">掉落：${b.drop}</div>
                  <div style="display:flex;gap:5px;">
                    <button class="ls-btn red" data-hunt="${b.name}|${b.drop}">⚔️ 猎妖取丹</button>
                    <button class="ls-btn jade" data-tame="${b.name}">🐾 驯服灵宠</button>
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
          HERO.bag.push({ id: 'it_' + Date.now(), name: dp, kind: '妖丹', qty: 1, desc: `猎杀【${bn}】所得` });
          pushLog(`你在【${curPlate.name}】斩杀【${bn}】，夺得【${dp}】！`);
          saveState(); activeTab = 'bag'; renderModal();
        };
      });
      body.querySelectorAll('[data-tame]').forEach(btn => {
        btn.onclick = () => {
          const bn = btn.dataset.tame;
          if (!HERO.pets.includes(bn)) HERO.pets.push(bn);
          HERO.life.loneliness = Math.max(0, HERO.life.loneliness - 20);
          pushLog(`你成功收服【${bn}】为伴生灵宠！`);
          saveState(); renderModal();
        };
      });
    } else if (activeTab === 'bag') {
      body.innerHTML = `
        <div class="ls-grid-2">
          <div class="ls-card">
            <h3><span>储物袋道具（统一占位图标槽）</span><span>灵石：${HERO.stones}</span></h3>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${HERO.bag.map((it, idx) => `
                <div style="display:flex;gap:8px;align-items:center;padding:6px;background:rgba(10,14,20,0.85);border:1px solid rgba(212,184,122,0.18);border-radius:3px;">
                  <div class="ls-slot-box" style="width:36px;height:36px;" data-asset-slot="item_icon_${it.kind}"><img src="assets/items/spirit_stone.webp" alt="道具" /></div>
                  <div style="flex:1;"><b style="color:#f2daa0;">${it.name}</b> ×${it.qty} <span class="ls-pill">${it.kind}</span><div style="font-size:10px;color:#938c7e;">${it.desc}</div></div>
                  ${it.kind === '丹药' ? `<button class="ls-btn jade" data-use="${idx}">服用</button>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          <div class="ls-card">
            <h3><span>已习得功法与残卷</span></h3>
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
          pushLog(`你服下【${it.name}】，灵力大涨，丹毒升至 ${HERO.life.pillToxin}/100！`);
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
            ${(WORLD.institutions || []).slice(0, 22).map(i => `<div style="padding:5px 0;border-bottom:1px dashed rgba(212,184,122,0.14);font-size:10.5px;"><b style="color:#f2daa0;">${i.name}</b> <span class="ls-pill ${i.status==='corrupt'||i.status==='suspended'?'warn':'jade'}">${i.status}</span><div style="color:#938c7e;">周期:${i.cycleYears?`每${i.cycleYears}年`:'常设'} · 公正度:${Math.round(i.integrity)} · 主办:${i.hostName}</div></div>`).join('') || '尚无制度涌现'}
          </div>
          <div class="ls-card" style="max-height:420px;overflow-y:auto;">
            <h3>严格溯源遗迹库 & 宗门官僚/杂役状况</h3>
            ${(WORLD.ruins || []).slice(0, 12).map(r => `<div style="padding:4px 0;border-bottom:1px dashed rgba(212,184,122,0.14);font-size:10.5px;"><b>🗝️ ${r.name}</b>（${r.plateId}·阵法${r.sealStrength}·${r.discovered?'已探明':'未发现'}）<br/><span style="color:#938c7e;">宝库：${r.vault.join('、')}</span></div>`).join('') || '尚无遗迹'}
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
          pushLog(`✔ 已导入实验室第 ${WORLD.year} 年世界！`);
          saveState(); renderModal();
        } catch (err) { alert('导入失败：' + err.message); }
      };
      const rg = document.getElementById('ls-regen-world');
      if (rg) rg.onclick = () => { freshWorld(Math.floor(Math.random() * 99999)); pushLog(`⚡ 已重建全新 1200 年世界！`); renderModal(); };
    }

    bindSceneActions(body);
  }

  let toastTimer = null;
  function showOwToast(msg) {
    let el = document.getElementById('ow-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ow-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function syncTopHud() {
    if (!WORLD || !HERO) return;
    const nd = WORLD.nodeMap[HERO.locId] || WORLD.nodes[0];
    const rEl = document.getElementById('hud-realm-txt');
    const dEl = document.getElementById('hud-date');
    const sEl = document.getElementById('hud-stone');
    const aEl = document.getElementById('hud-age');
    const tEl = document.getElementById('hud-timeline');
    if (rEl) rEl.textContent = HERO.realm;
    if (dEl) dEl.textContent = `第${WORLD.year}年·${WORLD.month}月`;
    if (sEl) sEl.textContent = HERO.stones;
    if (aEl) aEl.textContent = `${HERO.age}/120岁`;
    if (tEl) tEl.textContent = `身在【${nd.name}】· 灵脉${nd.leyline} · 暗森${nd.darkForestIdx || 0}`;

    const regEl = document.getElementById('ow-region-info');
    if (regEl) {
      const holds = (nd.holdings || []).map(h => {
        const f = WORLD.factions.find(x => x.id === h.factionId);
        return f ? f.name : '';
      }).filter(Boolean).slice(0, 2).join('/') || '无主荒野';
      regEl.innerHTML = `<b style="color:#f2daa0;">📍 ${nd.name}</b> (${nd.id}) · 脉<b style="color:#6fd3a8;">${nd.leyline}</b> · 暗森<b style="color:${(nd.darkForestIdx||0)>=55?'#ff9d95':'#70b8f0'};">${nd.darkForestIdx||0}</b> · ${holds}`;
    }
  }

  function openModalTab(tab) {
    activeTab = tab;
    activeScene = null;
    document.getElementById('life-sim-modal').classList.add('open');
    renderModal();
  }

  function handleWorldInteract(target) {
    if (!target) return;
    if (target.type === 'gather') {
      const nd = target.data;
      const gain = 12 + Math.floor((nd.leyline || 30) * 0.25);
      HERO.stones += gain;
      const hasHerb = HERO.bag.find(i => i.name === '野生聚灵草');
      if (hasHerb) hasHerb.qty += 1;
      else HERO.bag.push({ id: 'it_herb', name: '野生聚灵草', kind: '灵材', qty: 1, desc: '采自野外灵脉，可售卖或炼丹' });
      pushLog(`你在【${nd.name}】灵脉处采得野生聚灵草×1，并掘出灵石 +${gain}！`);
      saveState(); syncTopHud();
      showOwToast(`🌿 采集成功！获得 野生聚灵草×1、灵石 +${gain}`);
      return;
    }
    if (target.type === 'npc') {
      selectedNpcId = target.data.id;
      activeTab = 'social';
      activeScene = null;
      document.getElementById('life-sim-modal').classList.add('open');
      renderModal();
      return;
    }
    if (target.type === 'ruin') {
      activeTab = 'map';
      activeScene = { type: 'ruin', data: { ruin: target.data } };
      document.getElementById('life-sim-modal').classList.add('open');
      renderModal();
      return;
    }
    if (target.type === 'beast') {
      activeTab = 'map';
      activeScene = { type: 'beast_hunt', data: { beast: target.data } };
      document.getElementById('life-sim-modal').classList.add('open');
      renderModal();
      return;
    }
    if (target.type === 'plate') {
      selectedPlateId = target.data.id;
      HERO.locId = target.data.id;
      activeTab = 'map';
      activeScene = null;
      document.getElementById('life-sim-modal').classList.add('open');
      renderModal();
    }
  }

  function mountMainBg3D() {
    ensureInit();
    if (!window.Map3D || !window.THREE) return;
    const app = document.getElementById('app');
    if (!app) return;

    // 隐藏旧 2D 图层与冲突的底栏按钮，让 2.5D 可操控世界成为唯一主画面
    ['world-layer', 'hud-bl', 'hud-br', 'hud-tc'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    let host = document.getElementById('main-map3d-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'main-map3d-host';
      host.style.cssText = 'position:absolute;inset:0;z-index:10;cursor:crosshair;';
      app.appendChild(host);
    }

    let zoomMode = 'close';
    if (!document.getElementById('ow-hud')) {
      const hud = document.createElement('div');
      hud.id = 'ow-hud';
      hud.innerHTML = `
        <div class="ow-top-bar">
          <span id="ow-region-info">📍 加载沧溟山河……</span>
          <button class="ls-btn jade" id="ow-btn-m1" style="padding:3px 7px;">⏱ +1月</button>
          <button class="ls-btn blue" id="ow-btn-y1" style="padding:3px 7px;">🧘 闭关1年</button>
          <button class="ls-btn" id="ow-btn-zoom" style="padding:3px 7px;">🔭 俯瞰全景</button>
        </div>
        <div class="ow-nearby-wrap" id="ow-nearby-wrap">
          <button id="ow-nearby-btn">[E] 交互</button>
        </div>
        <div class="ow-ctrl-bl">
          <div class="ow-dpad">
            <span></span><button data-dir="0,-1">▲</button><span></span>
            <button data-dir="-1,0">◀</button><button id="ow-btn-fly" title="切换御剑飞行(Space)">🚶</button><button data-dir="1,0">▶</button>
            <span></span><button data-dir="0,1">▼</button><span></span>
          </div>
          <div class="ow-hint-box">
            <div><b style="color:#6fd3a8;">WASD / 方向键 / 点击地面</b> 控制主角行走</div>
            <div><b style="color:#f2daa0;">Space</b> 御剑飞行 · <b style="color:#f2daa0;">E</b> 靠近交互 · <b>右键</b>转视角 · <b>滚轮</b>缩放</div>
          </div>
        </div>
        <div class="ow-menu-br">
          <button class="ow-menu-btn accent" data-ow-tab="map">🗺️ 战略图</button>
          <button class="ow-menu-btn" data-ow-tab="life">🧬 人物</button>
          <button class="ow-menu-btn" data-ow-tab="social">🤝 江湖</button>
          <button class="ow-menu-btn" data-ow-tab="bag">🎒 行囊</button>
          <button class="ow-menu-btn" data-ow-tab="beasts">🐾 妖兽</button>
          <button class="ow-menu-btn" data-ow-tab="world">🏛️ 世界</button>
        </div>
      `;
      app.appendChild(hud);

      hud.querySelectorAll('[data-ow-tab]').forEach(b => {
        b.onclick = () => openModalTab(b.dataset.owTab);
      });
      hud.querySelectorAll('[data-dir]').forEach(b => {
        const [vx, vz] = b.dataset.dir.split(',').map(Number);
        const start = () => window.Map3D && window.Map3D.setJoystick(vx, vz);
        const stop = () => window.Map3D && window.Map3D.setJoystick(0, 0);
        b.addEventListener('pointerdown', start);
        b.addEventListener('pointerup', stop);
        b.addEventListener('pointerleave', stop);
      });
      document.getElementById('ow-btn-fly').onclick = () => {
        if (window.Map3D) window.Map3D.toggleFly();
      };
      document.getElementById('ow-nearby-btn').onclick = () => {
        if (window.Map3D) window.Map3D.triggerInteract();
      };
      document.getElementById('ow-btn-zoom').onclick = () => {
        zoomMode = zoomMode === 'close' ? 'world' : 'close';
        if (window.Map3D) window.Map3D.setZoomPreset(zoomMode);
        document.getElementById('ow-btn-zoom').textContent = zoomMode === 'close' ? '🔭 俯瞰全景' : '🎯 拉近主角';
      };
      document.getElementById('ow-btn-m1').onclick = () => {
        const logs = window.LifeSim.advanceLifeMonths(HERO, WORLD, 1, 'mortal_life');
        saveState(); syncTopHud();
        showOwToast(logs[0] || `岁月流转：第 ${WORLD.year} 年 ${WORLD.month} 月`);
      };
      document.getElementById('ow-btn-y1').onclick = () => {
        const logs = window.LifeSim.advanceLifeMonths(HERO, WORLD, 12, 'seclusion');
        saveState(); syncTopHud();
        showOwToast(logs[0] || `闭关一年出关！当前第 ${WORLD.year} 年，寿 ${HERO.age} 岁`);
      };
    }

    syncTopHud();
    requestAnimationFrame(() => {
      window.Map3D.mount(host, WORLD, HERO, {
        onRegionChange: pid => {
          selectedPlateId = pid;
          syncTopHud();
          const nd = WORLD.nodeMap[pid];
          if (nd) showOwToast(`🗺️ 踏入【${nd.name}】地界（灵脉 ${nd.leyline} · 暗森 ${nd.darkForestIdx || 0}）`);
        },
        onNearbyChange: target => {
          const wrap = document.getElementById('ow-nearby-wrap');
          const btn = document.getElementById('ow-nearby-btn');
          if (!wrap || !btn) return;
          if (target) {
            btn.textContent = `[E] ${target.label}（${target.sub}）`;
            wrap.classList.add('show');
          } else {
            wrap.classList.remove('show');
          }
        },
        onInteract: target => handleWorldInteract(target),
        onFlyToggle: flying => {
          const fb = document.getElementById('ow-btn-fly');
          if (fb) fb.textContent = flying ? '🗡️' : '🚶';
          showOwToast(flying ? '🗡️ 已祭出飞剑！进入【御剑飞行】状态（速度×2.3，可越海穿山）' : '🚶 已收剑落地，恢复【徒步漫游】');
        },
        onToast: msg => showOwToast(msg)
      });
    });
  }

  function mount() {
    if (!window.WorldCore || !window.LifeSim) return;
    injectStyles();

    const modal = document.createElement('div');
    modal.id = 'life-sim-modal';
    modal.innerHTML = `
      <div class="ls-box">
        <div class="ls-head">
          <h2 id="ls-title">沧溟修仙模拟人生 v9.0</h2>
          <button class="ls-btn red" id="ls-close">✕ 返回大世界</button>
        </div>
        <div class="ls-tabs">
          <div class="ls-tab active" data-tab="map">🗺️ 五洲七海战略图</div>
          <div class="ls-tab" data-tab="life">🧬 人物与人生</div>
          <div class="ls-tab" data-tab="social">🤝 众生与江湖博弈</div>
          <div class="ls-tab" data-tab="beasts">🐾 妖兽与生态图鉴</div>
          <div class="ls-tab" data-tab="bag">🎒 行囊与功法遗物</div>
          <div class="ls-tab" data-tab="world">🏛️ 社会制度与遗迹库</div>
        </div>
        <div class="ls-body" id="ls-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('ls-close').onclick = () => {
      modal.classList.remove('open');
      syncTopHud();
    };
    modal.querySelectorAll('.ls-tab').forEach(t => {
      t.onclick = () => { activeTab = t.dataset.tab; activeScene = null; renderModal(); };
    });

    // 启动即进入真 2.5D HD-2D 可操控主角开放大世界！
    mountMainBg3D();
    // 若旧版标题遮罩在点击进入后重新渲染了旧 HUD，定时保证我们的实时数值同步
    setInterval(syncTopHud, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
