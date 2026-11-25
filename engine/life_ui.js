/* ============================================================================
 * 《沧溟界》v8.7.0 完整六维框架 · 可视化五洲七海交互地图 + 多步真实交互场景
 * 文件：engine/life_ui.js
 * ============================================================================ */
(function () {
  'use strict';

  const LS_KEY = 'qingyun_v87_world_life_v1';
  const APP_VER = 'v11.5';
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
        font-family:"Songti SC","Kaiti SC","Noto Serif SC",serif; color:#ebe3d3;
      }
      /* 顶部水墨卷轴地名与时辰栏（紧凑控宽，绝不与左上/右上 HUD 撞车） */
      .ow-top-bar {
        position:absolute; top:14px; left:50%; transform:translateX(-50%); pointer-events:auto;
        display:flex; align-items:center; gap:6px; padding:5px 16px;
        background:linear-gradient(90deg, rgba(7,10,14,0) 0%, rgba(10,14,19,0.84) 10%, rgba(10,14,19,0.84) 90%, rgba(7,10,14,0) 100%);
        border-top:1px solid rgba(212,184,122,0.45);
        border-bottom:1px solid rgba(212,184,122,0.45);
        font-size:11.5px; letter-spacing:0.6px; white-space:nowrap;
      }
      .ow-micro-btn {
        background:rgba(212,184,122,0.08); border:1px solid rgba(212,184,122,0.38); color:#ebd5a2;
        padding:2px 7px; border-radius:2px; font-size:10.5px; cursor:pointer; font-family:inherit;
        letter-spacing:0.5px; transition:all 0.16s;
      }
      .ow-micro-btn:hover { background:rgba(212,184,122,0.26); color:#fff; border-color:#f2daa0; }
      .ow-micro-btn.crimson {
        background:linear-gradient(180deg, rgba(168,48,40,0.92), rgba(112,26,22,0.95));
        border-color:#f2daa0; color:#fff4dc; font-weight:700;
      }
      /* 右上角圆形青铜八卦罗盘小地图 */
      #ow-minimap-box {
        position:absolute; right:20px; top:66px; pointer-events:auto;
        width:138px; height:138px; border-radius:50%;
        background:radial-gradient(circle, rgba(12,20,28,0.88) 62%, rgba(28,24,18,0.96) 100%);
        border:2px solid rgba(212,184,122,0.72);
        box-shadow:0 0 0 3px rgba(8,11,15,0.75), 0 0 0 4px rgba(212,184,122,0.35), 0 8px 24px rgba(0,0,0,0.72);
        display:flex; align-items:center; justify-content:center;
      }
      #ow-minimap-cv {
        display:block; width:124px; height:124px; border-radius:50%; cursor:pointer;
      }
      .mm-card {
        position:absolute; font-size:9px; color:#d4b87a; font-weight:700;
        text-shadow:0 1px 3px #000; pointer-events:none;
      }
      .mm-n { top:-6px; left:50%; transform:translateX(-50%); background:#0c1016; padding:0 3px; }
      .mm-s { bottom:-6px; left:50%; transform:translateX(-50%); background:#0c1016; padding:0 3px; }
      .mm-w { left:-6px; top:50%; transform:translateY(-50%); background:#0c1016; padding:0 2px; }
      .mm-e { right:-6px; top:50%; transform:translateY(-50%); background:#0c1016; padding:0 2px; }
      #ow-minimap-title {
        position:absolute; bottom:-22px; left:50%; transform:translateX(-50%);
        font-size:10.5px; color:#e5d3a8; white-space:nowrap; letter-spacing:1.2px;
        text-shadow:0 1px 4px #000;
      }
      /* 靠近交互金条 */
      .ow-nearby-wrap {
        position:absolute; bottom:94px; left:50%; transform:translateX(-50%); pointer-events:auto;
        display:none;
      }
      .ow-nearby-wrap.show { display:block; }
      #ow-nearby-btn {
        background:linear-gradient(90deg, rgba(12,24,22,0.88), rgba(20,52,44,0.94), rgba(12,24,22,0.88));
        border:1px solid #80dec0; color:#f4fff9; padding:7px 22px; border-radius:3px;
        font-size:12.5px; font-weight:700; letter-spacing:1.5px; cursor:pointer; font-family:inherit;
        box-shadow:0 4px 20px rgba(0,0,0,0.7), inset 0 0 12px rgba(111,211,168,0.2);
      }
      #ow-nearby-btn:hover { background:rgba(28,74,60,0.96); transform:translateY(-1px); }
      /* 底部居中 3A 鎏金动作技能槽 */
      .ow-skill-bar {
        position:absolute; bottom:18px; left:50%; transform:translateX(-50%); pointer-events:auto;
        display:flex; gap:8px; padding:6px 10px;
        background:linear-gradient(180deg, rgba(10,14,19,0.78), rgba(6,9,13,0.92));
        border:1px solid rgba(212,184,122,0.48); border-radius:4px;
        box-shadow:0 8px 26px rgba(0,0,0,0.75);
      }
      .ow-sk-slot {
        position:relative; width:54px; height:54px; cursor:pointer;
        background:radial-gradient(circle at 50% 35%, rgba(28,36,46,0.92), rgba(10,14,19,0.98));
        border:1px solid rgba(212,184,122,0.55); border-radius:3px;
        display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
        color:#f0dec0; font-family:inherit; transition:all 0.14s; overflow:hidden;
      }
      .ow-sk-slot:hover { border-color:#80dec0; transform:translateY(-2px); box-shadow:0 4px 12px rgba(111,211,168,0.28); }
      .ow-sk-slot.active-fly { border-color:#6fd3a8; box-shadow:0 0 14px rgba(111,211,168,0.45); }
      .ow-sk-slot svg { width:22px; height:22px; stroke:#e6cc93; fill:none; stroke-width:1.7; }
      .ow-sk-name { font-size:10px; letter-spacing:0.8px; color:#e6d6b5; }
      .ow-sk-key {
        position:absolute; top:2px; left:4px; font-size:9px; color:#a89b82; font-family:sans-serif; font-weight:700;
      }
      .ow-sk-cd {
        position:absolute; inset:0; background:rgba(5,8,12,0.76); color:#ffd299;
        display:none; align-items:center; justify-content:center; font-size:13px; font-weight:700; font-family:sans-serif;
      }
      .ow-sk-cd.on { display:flex; }
      /* 左上角新手4步极简引导条（完成后自动消失，可随时点×关闭） */
      #ow-guide-pill {
        position:absolute; left:18px; top:94px; pointer-events:auto; max-width:270px;
        background:rgba(10,15,22,0.84); border-left:2.5px solid #f2daa0;
        border-top:1px solid rgba(212,184,122,0.3); border-bottom:1px solid rgba(212,184,122,0.3);
        border-right:1px solid rgba(212,184,122,0.2);
        padding:6px 10px; font-size:11px; line-height:1.45; color:#ebe3d3;
        box-shadow:0 4px 16px rgba(0,0,0,0.6); display:none;
      }
      #ow-guide-pill.show { display:flex; align-items:flex-start; gap:8px; }
      #ow-guide-close { background:none; border:none; color:#9d9586; cursor:pointer; font-size:12px; padding:0; }
      #ow-guide-close:hover { color:#fff; }
      /* 统一 3A 宋明开场标题幕布（彻底取代旧版割裂开场） */
      #v10-title-curtain {
        position:fixed; inset:0; z-index:9600;
        background:radial-gradient(circle at 50% 40%, rgba(16,26,34,0.88) 0%, rgba(5,8,12,0.97) 100%);
        backdrop-filter:blur(8px); display:flex; flex-direction:column; align-items:center; justify-content:center;
        font-family:"Songti SC","Kaiti SC","Noto Serif SC",serif; color:#f2e7d0; text-align:center; padding:20px;
      }
      .v10-title-card {
        max-width:520px; width:92%; padding:30px 28px;
        background:linear-gradient(180deg, rgba(14,20,28,0.92), rgba(8,11,16,0.96));
        border:1px solid rgba(212,184,122,0.58);
        box-shadow:0 0 0 4px rgba(8,11,15,0.8), 0 0 0 5px rgba(212,184,122,0.25), 0 24px 64px rgba(0,0,0,0.88);
      }
      .v10-t-btn {
        width:100%; padding:10px 16px; margin-top:10px; cursor:pointer; font-family:inherit;
        font-size:13.5px; letter-spacing:2px; font-weight:700; border-radius:2px;
        background:rgba(212,184,122,0.12); border:1px solid rgba(212,184,122,0.52); color:#f5e2b5;
      }
      .v10-t-btn:hover { background:rgba(212,184,122,0.28); color:#fff; }
      .v10-t-btn.main {
        background:linear-gradient(180deg, rgba(162,48,40,0.94), rgba(110,24,20,0.98));
        border-color:#f5dda2; color:#fff6e2;
      }
      /* 左下角极简双行轻提示（稳避左下角版本号与居中技能栏） */
      .ow-whisper-bl {
        position:absolute; left:16px; bottom:26px; max-width:230px; pointer-events:none;
        font-size:10px; line-height:1.45; color:rgba(230,220,200,0.62); letter-spacing:0.6px;
        text-shadow:0 1px 4px rgba(0,0,0,0.92);
      }
      .mini-bar.exp i { background:linear-gradient(90deg, #b88b35, #f5d882); }
      /* 右下角 5 枚宋明玉印功能键 */
      .ow-menu-br {
        position:absolute; right:18px; bottom:18px; pointer-events:auto;
        display:flex; gap:7px;
      }
      .ow-seal-btn {
        width:48px; height:48px; cursor:pointer;
        background:linear-gradient(180deg, rgba(16,22,30,0.9), rgba(8,12,18,0.96));
        border:1px solid rgba(212,184,122,0.52); border-radius:3px;
        color:#ecd8ae; font-family:inherit; font-size:12px; font-weight:700; letter-spacing:1px;
        display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
        box-shadow:0 4px 16px rgba(0,0,0,0.65); transition:all 0.15s;
      }
      .ow-seal-btn svg { width:16px; height:16px; stroke:#d4b87a; fill:none; stroke-width:1.6; }
      .ow-seal-btn:hover { background:rgba(34,44,56,0.96); border-color:#f5e2b5; color:#fff; transform:translateY(-2px); }
      .ow-seal-btn.primary {
        background:linear-gradient(180deg, rgba(145,42,36,0.92), rgba(92,22,19,0.96));
        border-color:#f0d498; color:#fff3dc;
      }
      .ow-seal-btn.primary svg { stroke:#fff3dc; }
      #ow-toast {
        position:fixed; top:60px; left:50%; transform:translateX(-50%); z-index:9900;
        background:rgba(10,15,21,0.92); border:1px solid rgba(212,184,122,0.7); color:#f6ecd4;
        padding:6px 18px; border-radius:2px; font-size:12px; letter-spacing:1px; pointer-events:none;
        opacity:0; transition:opacity 0.25s; box-shadow:0 6px 24px rgba(0,0,0,0.75);
      }
      #ow-toast.show { opacity:1; }
      #life-sim-modal {
        position:fixed; inset:0; z-index:9800; background:rgba(4,7,11,0.84);
        backdrop-filter:blur(8px); display:none; align-items:center; justify-content:center; padding:12px;
        font-family:"Songti SC","Noto Serif SC",serif; color:#e8e0d2;
      }
      #life-sim-modal.open { display:flex; }
      .ls-box {
        width:min(1160px, 96vw); height:min(720px, 92vh);
        background:linear-gradient(180deg, #0d1219 0%, #090c12 100%);
        border:1px solid rgba(212,184,122,0.58);
        box-shadow:0 0 0 3px rgba(8,11,15,0.85), 0 0 0 4px rgba(212,184,122,0.22), 0 20px 60px rgba(0,0,0,0.85);
        border-radius:3px; display:flex; flex-direction:column; overflow:hidden;
      }
      .ls-head {
        display:flex; justify-content:space-between; align-items:center; padding:10px 18px;
        background:linear-gradient(90deg, rgba(20,26,34,0.95), rgba(11,15,22,0.95));
        border-bottom:1px solid rgba(212,184,122,0.32);
      }
      .ls-head h2 { font-size:15px; color:#f2daa0; margin:0; letter-spacing:2px; font-weight:700; }
      .ls-tabs { display:flex; gap:6px; padding:8px 18px; background:#090d13; border-bottom:1px solid rgba(212,184,122,0.2); flex-wrap:wrap; }
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
    if (activeScene.type === 'combat' && d.battle) {
      const b = d.battle, h = b.hero, e = b.enemy;
      const hPct = Math.round(h.hp / h.maxHp * 100);
      const ePct = Math.round(e.hp / e.maxHp * 100);
      const qPct = Math.round(h.qi / h.maxQi * 100);
      const hasPill = (HERO.bag || []).some(i => i.kind === '丹药' && i.qty > 0);
      return `
        <div class="ls-scene-banner">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <b style="color:#ffd299;font-size:13.5px;">⚔️ 实时仙侠斗法 · 第 ${b.turn} 回合</b>
            <span class="ls-pill warn">${e.intent}</span>
          </div>
          <div class="ls-grid-2" style="margin-bottom:8px;">
            <div class="ls-card">
              <div style="display:flex;gap:8px;align-items:center;">
                <img src="assets/chars/hero.webp" style="width:44px;height:44px;border-radius:50%;border:1.5px solid #6fd3a8;object-fit:cover;" />
                <div style="flex:1;">
                  <b style="color:#6fd3a8;">${h.name}</b> ${h.shield > 0 ? `<span class="ls-pill jade">盾 ${h.shield}</span>` : ''}
                  <div style="background:#1c2430;height:8px;border-radius:4px;margin:3px 0;"><div style="background:#56c288;height:100%;width:${hPct}%;border-radius:4px;"></div></div>
                  <div style="font-size:10px;">气血 ${h.hp}/${h.maxHp} ｜ 灵力 ${h.qi}/${h.maxQi} (${qPct}%)</div>
                </div>
              </div>
            </div>
            <div class="ls-card">
              <div style="display:flex;gap:8px;align-items:center;">
                <img src="${e.avatar}" style="width:44px;height:44px;border-radius:50%;border:1.5px solid #e06258;object-fit:cover;" />
                <div style="flex:1;">
                  <b style="color:#ffaaa3;">${e.name}</b> <span class="ls-pill">${e.title}</span>
                  <div style="background:#1c2430;height:8px;border-radius:4px;margin:3px 0;"><div style="background:#e06258;height:100%;width:${ePct}%;border-radius:4px;"></div></div>
                  <div style="font-size:10px;">敌方气血 ${e.hp}/${e.maxHp} ｜ 攻势 ${e.atk}</div>
                </div>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            ${b.status === 'fighting' ? `
              <button class="ls-btn jade" data-cb="strike">⚔️ 青云剑诀 (回气+16)</button>
              <button class="ls-btn red" data-cb="spell" ${h.cdSpell > 0 ? 'disabled' : ''}>🔥 五行雷法 (耗28气${h.cdSpell > 0 ? ` · CD:${h.cdSpell}` : ''})</button>
              <button class="ls-btn blue" data-cb="shield" ${h.cdShield > 0 ? 'disabled' : ''}>🛡️ 玄玉灵盾 (耗18气${h.cdShield > 0 ? ` · CD:${h.cdShield}` : ''})</button>
              <button class="ls-btn" data-cb="pill" ${hasPill ? '' : 'disabled'}>💊 吞服丹药 (回血+气)</button>
              <button class="ls-btn" data-cb="flee">💨 施展遁术</button>
            ` : `<button class="ls-btn jade" data-cb="finish">✔ 结算战果并返回</button>`}
          </div>
          <div class="ls-log">${b.logs.join('<br/>')}</div>
        </div>
      `;
    }
    if (activeScene.type === 'birth_story' && window.LifeModules) {
      const step = d.step || 0;
      const ch = window.LifeModules.BIRTH_CHAPTERS[step];
      if (!ch) return '';
      return `
        <div class="ls-scene-banner">
          <div style="color:#f2daa0;font-size:13.5px;font-weight:700;margin-bottom:4px;">📜 0–18 岁童年少年开局手记 · ${ch.age} (${step + 1}/4)</div>
          ${step === 0 ? `<div style="margin-bottom:8px;display:flex;align-items:center;gap:8px;"><span style="font-size:11.5px;color:#9ff2cf;">自定道号：</span><input class="ls-input" id="inp-hero-daoname" value="${HERO.name}" style="max-width:180px;" /></div>` : ''}
          <div style="font-size:12px;margin-bottom:10px;">${ch.prompt}</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${ch.choices.map((c, idx) => `<button class="ls-btn jade" style="text-align:left;padding:7px 10px;" data-birth="${idx}">${idx + 1}. ${c.label}</button>`).join('')}
          </div>
        </div>
      `;
    }
    if (activeScene.type === 'living_event' && d.ev) {
      const ev = d.ev;
      return `
        <div class="ls-scene-banner" style="border-color:#f2daa0;">
          <div style="color:#f5e2b5;font-size:14px;font-weight:700;margin-bottom:6px;">${ev.title}</div>
          <div style="font-size:12px;line-height:1.65;margin-bottom:10px;color:#e6dfd3;">${ev.desc}</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${ev.choices.map((c, idx) => `<button class="ls-btn jade" style="text-align:left;padding:7px 11px;" data-lev="${idx}">${idx + 1}. ${c.label}</button>`).join('')}
          </div>
        </div>
      `;
    }
    if (activeScene.type === 'bounty_board' && window.WorldDirector) {
      window.WorldDirector.ensureDirectorState(HERO, WORLD);
      const sp = WORLD.nodeMap[HERO.locId] || WORLD.nodes[0];
      const goods = window.WorldDirector.TRADE_GOODS;
      return `
        <div class="ls-scene-banner">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <b style="color:#f7d070;font-size:13.5px;">📜 【${sp.name}】仙城悬赏榜 & 跨洲商行货栈（灵石：${HERO.stones}）</b>
            <button class="ls-btn" data-sc="close">离开告示牌</button>
          </div>
          <div class="ls-grid-2">
            <div class="ls-card">
              <h3><span>本地实时悬赏（完成自动计数）</span><button class="ls-btn" data-sc="refresh_bounty" style="padding:2px 6px;">刷新榜文</button></h3>
              ${HERO.bounties.map(b => `
                <div style="padding:5px 0;border-bottom:1px dashed rgba(212,184,122,0.16);display:flex;justify-content:space-between;align-items:center;gap:6px;">
                  <div>
                    <b style="color:#f2daa0;">${b.title}</b> <span class="ls-pill ${b.progress>=b.target?'jade':''}">${b.progress}/${b.target}</span>
                    <div style="font-size:10px;color:#938c7e;">${b.desc} · 赏 ${b.rewardStones}石</div>
                  </div>
                  ${b.claimed ? '<span class="ls-pill">已领赏</span>' : (b.progress >= b.target ? `<button class="ls-btn jade" data-claim="${b.id}">领赏</button>` : '<span style="font-size:10px;color:#938c7e;">进行中</span>')}
                </div>
              `).join('')}
            </div>
            <div class="ls-card">
              <h3><span>跨洲商行货栈（按本地真实物价波动）</span></h3>
              <div style="font-size:10px;color:#938c7e;margin-bottom:6px;">本地物价指数：丹×${sp.priceIndex.pill} · 矿×${sp.priceIndex.mineral} · 粮×${sp.priceIndex.grain}（低买跨洲高卖！）</div>
              ${goods.map(g => {
                const pr = window.WorldDirector.getLocalTradePrice(sp, g);
                const own = (HERO.bag || []).filter(i => i.name === g.name).reduce((s, i) => s + (i.qty || 1), 0);
                return `
                  <div style="padding:5px 0;border-bottom:1px dashed rgba(212,184,122,0.16);display:flex;justify-content:space-between;align-items:center;">
                    <div><b style="color:#f2daa0;">${g.name}</b> <span class="ls-pill">持 ${own}</span><div style="font-size:10px;color:#9ff2cf;">本地市价：${pr} 灵石</div></div>
                    <div style="display:flex;gap:4px;">
                      <button class="ls-btn blue" data-trade="buy|${g.id}">购入</button>
                      <button class="ls-btn jade" data-trade="sell|${g.id}" ${own>0?'':'disabled'}>售出</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }
    if (activeScene.type === 'mortality') {
      const lin = window.Lineage ? window.Lineage.ensureLineage(HERO) : { heirs: [] };
      return `
        <div class="ls-scene-banner" style="border-color:#e06258;">
          <div style="color:#ffaaa3;font-size:14px;font-weight:700;margin-bottom:4px;">⏳ 寿元大限将至 · 【${HERO.name}】已至 ${Math.round(HERO.age)}/${HERO.lifespan} 岁</div>
          <div style="font-size:11.5px;margin-bottom:8px;">长生路漫，气血渐衰。你可以消耗奇珍续命，或立下碑文将洞府、宗门与遗物传给下一代传人！</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${HERO.stones >= 200 ? `<button class="ls-btn jade" data-sc="extend_life">💊 耗 200 灵石服延寿玄丹（寿元 +25 岁）</button>` : ''}
            ${lin.heirs.length
              ? lin.heirs.map(h => `<button class="ls-btn blue" data-inherit="${h.id}">🔥 坐化传功给【${h.name}】(${h.kind})</button>`).join('')
              : `<button class="ls-btn blue" data-sc="auto_inherit">🔥 临终收一名有缘散修继承衣钵（开启第 ${(lin.generation||1)+1} 代）</button>`}
          </div>
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
            <button class="ls-btn red" data-sc="beast_combat">⚔️ 进入实时仙侠斗法（亲自出招斩妖夺丹）</button>
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
            HERO.stones += 120; HERO.life.reputation.demonic += 8; HERO.wanted = (HERO.wanted || 0) + 15;
            pushLog(`你将【${r.name}】绘成真假参半的残图高价售出，净赚 120 灵石，但恶名传开已遭宗门通缉（通缉+15，黑市戴面具可避祸）！`);
          }
          activeScene = null; saveState(); renderModal(); return;
        }

        if (activeScene.type === 'bounty_board' && sc === 'refresh_bounty' && window.WorldDirector) {
          window.WorldDirector.refreshBounties(HERO, WORLD);
          saveState(); renderModal(); return;
        }
        if (activeScene.type === 'mortality') {
          if (sc === 'extend_life' && HERO.stones >= 200) {
            HERO.stones -= 200;
            HERO.lifespan = (HERO.lifespan || 110) + 25;
            pushLog(`你以 200 灵石求得延寿玄丹服下，寿元上限增至 ${HERO.lifespan} 岁！`);
            activeScene = null; saveState(); syncTopHud(); renderModal(); return;
          }
          if (sc === 'auto_inherit' && window.Lineage) {
            window.Lineage.adoptOrBirthHeir(HERO, WORLD, 'disciple');
            const hId = HERO.lineage.heirs[0].id;
            const res = window.Lineage.passTorchToHeir(HERO, WORLD, hId);
            pushLog(res.msg); showOwToast(res.msg);
            activeScene = null; saveState(); syncTopHud(); renderModal(); return;
          }
        }
        if (activeScene.type === 'beast_hunt') {
          const b = d.beast || { name: '幽林妖狼' };
          if (sc === 'beast_combat' && window.RealtimeCombat) {
            ensureHeroStats();
            const bt = window.RealtimeCombat.createBattle(HERO, {
              name: b.name, title: '野外凶兽', kind: 'beast', avatar: 'assets/chars/wolf_boss.webp',
              power: 1 + (HERO.realmIdx || 0) * 0.55
            });
            activeScene = { type: 'combat', data: { battle: bt } };
            renderModal(); return;
          }
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

    // 真实社会演化动态事件抉择
    body.querySelectorAll('[data-lev]').forEach(btn => {
      btn.onclick = () => {
        const ev = activeScene.data && activeScene.data.ev;
        if (!ev) return;
        const ch = ev.choices[Number(btn.dataset.lev)];
        if (ch && ch.run) {
          const msg = ch.run(HERO, WORLD);
          pushLog(msg); showOwToast(msg);
        }
        activeScene = null; saveState(); syncTopHud(); renderModal();
      };
    });

    // 悬赏领赏 & 跨洲商行买卖
    body.querySelectorAll('[data-claim]').forEach(btn => {
      btn.onclick = () => {
        const res = window.WorldDirector.claimBounty(HERO, WORLD, btn.dataset.claim);
        if (res.ok) { pushLog(res.msg); showOwToast(res.msg); saveState(); syncTopHud(); renderModal(); }
        else showOwToast(res.msg);
      };
    });
    body.querySelectorAll('[data-trade]').forEach(btn => {
      btn.onclick = () => {
        const [op, gid] = btn.dataset.trade.split('|');
        const sp = WORLD.nodeMap[HERO.locId] || WORLD.nodes[0];
        const res = op === 'buy'
          ? window.WorldDirector.buyTradeGood(HERO, sp, gid)
          : window.WorldDirector.sellTradeGood(HERO, sp, gid);
        if (res.ok) { pushLog(res.msg); showOwToast(res.msg); saveState(); syncTopHud(); renderModal(); }
        else showOwToast(res.msg);
      };
    });

    // 实时斗法出招与结算
    body.querySelectorAll('[data-cb]').forEach(btn => {
      btn.onclick = () => {
        const op = btn.dataset.cb;
        const bt = activeScene.data.battle;
        if (!bt) return;
        if (window.SFX && window.SFX.play) { try { window.SFX.play('click'); } catch {} }
        if (op === 'finish') {
          HERO.hp = bt.hero.hp; HERO.qi = bt.hero.qi;
          if (bt.status === 'win') {
            HERO.stones += bt.enemy.rewardStones;
            HERO.exp = Math.min(HERO.maxExp || 100, (HERO.exp || 0) + bt.enemy.rewardExp);
            if (bt.enemy.dropItem) {
              const ex = HERO.bag.find(i => i.name === bt.enemy.dropItem.name);
              if (ex) ex.qty += 1;
              else HERO.bag.push(Object.assign({ id: 'it_' + Date.now(), qty: 1 }, bt.enemy.dropItem));
            }
            pushLog(`⚔️ 你在斗法中击败【${bt.enemy.name}】，收获灵石 +${bt.enemy.rewardStones}、修为 +${bt.enemy.rewardExp} 与【${bt.enemy.dropItem.name}】！`);
            showOwToast(`🏆 斩敌获胜！修为 +${bt.enemy.rewardExp}、灵石 +${bt.enemy.rewardStones}`);
          } else if (bt.status === 'lose') {
            HERO.life.injuries.push({ name: '斗法重创暗伤', penalty: '破境成功率-8%' });
            pushLog(`🩸 你不敌【${bt.enemy.name}】，拼死脱身却留下暗伤，需尽快疗伤！`);
          }
          activeScene = null; saveState(); syncTopHud(); renderModal(); return;
        }
        window.RealtimeCombat.stepBattle(bt, op, HERO);
        renderModal();
      };
    });

    // 0-18 岁童年手记抉择
    body.querySelectorAll('[data-birth]').forEach(btn => {
      btn.onclick = () => {
        const nameInp = document.getElementById('inp-hero-daoname');
        if (nameInp && nameInp.value.trim()) HERO.name = nameInp.value.trim().slice(0, 8);
        const idx = Number(btn.dataset.birth);
        const picks = activeScene.data.picks || [];
        picks.push(idx);
        const nextStep = (activeScene.data.step || 0) + 1;
        if (nextStep < window.LifeModules.BIRTH_CHAPTERS.length) {
          activeScene = { type: 'birth_story', data: { step: nextStep, picks } };
        } else {
          window.LifeModules.applyBirthChoices(HERO, picks);
          pushLog(`📜 【${HERO.name}】完成了 0–18 岁成长手记，携初始道心正式踏入沧溟修仙界！`);
          activeScene = null;
          saveState(); syncTopHud();
          switchViewLayer(viewLayer, HERO.locId, currentRoom);
          showOwToast(`【${HERO.name}】0–18 岁成长手记已铸就你的初始根骨与道心！`);
        }
        renderModal();
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
    title.textContent = `沧溟修仙模拟人生 ${APP_VER} · 第 ${WORLD.year} 年 ${WORLD.month} 月 · 身在【${curPlate.name}】 · 灵石 ${HERO.stones}`;

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
      const lin = window.Lineage ? window.Lineage.ensureLineage(HERO) : { generation: 1, companion: null, heirs: [], ancestors: [] };
      const candNpc = (WORLD.people || []).find(a => a.alive) || { id: 'npc_0', name: '苏清婉', realm: '筑基初期' };
      body.innerHTML = `
        ${sceneHtml}
        <div class="ls-card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <div class="ls-slot-box" data-asset-slot="hero_portrait"><img src="assets/chars/hero.webp" alt="主角立绘" /></div>
          <div style="flex:1;min-width:260px;">
            <div style="font-size:13px;">
              <span class="ls-pill">第${lin.generation}代</span>
              <b style="color:#f2daa0;">${HERO.masked ? `${HERO.maskName} (易容马甲)` : HERO.name}</b> ·
              <span class="ls-pill jade">${HERO.realm}</span> · 寿 <b>${HERO.age}/${HERO.lifespan || 110}</b> 岁 · 灵石 <b>${HERO.stones}</b> · IQ:${HERO.iq} EQ:${HERO.eq} 悟:${HERO.daoWit}
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
              <button class="ls-btn ${HERO.masked?'red':''}" data-act="mask">${HERO.masked ? '摘下马甲' : '戴上易容马甲'}</button>
            </div>
          </div>
        </div>
        ${lastLog.length ? `<div class="ls-log"><b style="color:#6fd3a8;">【最新尘世变迁与人生记录】</b><br/>${lastLog.map(x => `• ${x}`).join('<br/>')}</div>` : ''}
        <div class="ls-card" style="border-color:rgba(212,184,122,0.42);">
          <h3><span>道侣双修 · 血脉子嗣与代际传承（第 ${lin.generation} 代）</span><span>先祖碑林：${lin.ancestors.length} 位</span></h3>
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:6px;">
            <div>
              <b>道侣：</b>${lin.companion ? `<span style="color:#ffbed8;">${lin.companion.name}</span>（${lin.companion.realm} · 情谊 ${lin.companion.intimacy}）` : '尚未结缘'}
            </div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">
              ${!lin.companion
                ? `<button class="ls-btn jade" data-lin="bond">与【${candNpc.name}】缔结道侣</button>`
                : `<button class="ls-btn jade" data-lin="dual">双修共参大道(+修为/抚心魔)</button><button class="ls-btn blue" data-lin="child">孕育血脉子嗣</button>`}
              <button class="ls-btn" data-lin="disciple">收徒亲传弟子</button>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${lin.heirs.length ? lin.heirs.map(h => `
              <div style="padding:5px 8px;background:rgba(12,18,26,0.9);border:1px solid rgba(212,184,122,0.28);border-radius:3px;font-size:10.5px;">
                <b style="color:#f2daa0;">${h.name}</b> <span class="ls-pill">${h.kind}</span> (悟${h.daoWit} 智${h.iq})
                <button class="ls-btn red" style="margin-left:6px;padding:2px 6px;" data-inherit="${h.id}">坐化传功·下代继位</button>
              </div>
            `).join('') : '<span style="font-size:10.5px;color:#938c7e;">尚无衣钵传人（可收徒或与道侣育子，寿尽时可由下代无缝继承洞府、宗门与遗物）</span>'}
          </div>
          ${lin.ancestors.length ? `<div style="margin-top:6px;font-size:10px;color:#bfb7a8;border-top:1px dashed rgba(212,184,122,0.18);padding-top:4px;"><b>先祖碑文：</b>${lin.ancestors.slice(0,2).map(a => a.epitaph).join(' ｜ ')}</div>` : ''}
        </div>
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
      body.querySelectorAll('[data-lin]').forEach(btn => {
        btn.onclick = () => {
          if (!window.Lineage) return;
          const op = btn.dataset.lin;
          let res;
          if (op === 'bond') res = window.Lineage.bondCompanion(HERO, candNpc);
          else if (op === 'dual') res = window.Lineage.dualCultivate(HERO, WORLD);
          else res = window.Lineage.adoptOrBirthHeir(HERO, WORLD, op);
          if (res.ok) { pushLog(res.msg); showOwToast(res.msg); saveState(); syncTopHud(); renderModal(); }
          else showOwToast(res.msg);
        };
      });
      body.querySelectorAll('[data-inherit]').forEach(btn => {
        btn.onclick = () => {
          if (!window.Lineage) return;
          const res = window.Lineage.passTorchToHeir(HERO, WORLD, btn.dataset.inherit);
          if (res.ok) { pushLog(res.msg); showOwToast(res.msg); saveState(); syncTopHud(); switchViewLayer(viewLayer, HERO.locId, currentRoom); renderModal(); }
          else showOwToast(res.msg);
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
              <div style="background:rgba(8,12,18,0.86);border-left:2.5px solid #d4b87a;padding:8px 12px;margin-bottom:8px;font-size:12px;line-height:1.6;color:#f5ebd6;font-style:italic;">
                ${window.LivingEvents ? window.LivingEvents.generateNpcGreeting(curNpc, HERO, WORLD, rel) : '“道友有礼。”'}
              </div>
              <div style="display:flex;gap:6px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed rgba(212,184,122,0.2);">
                <button class="ls-btn jade" id="btn-duel-spar">实景切磋论道（直接在大街即时开打）</button>
                <button class="ls-btn red" id="btn-duel-kill">实景伏击夺宝（生死死战 · 胜则陨落写入世界史）</button>
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
      const startLiveDuel = isLethal => {
        if (!curNpc) return;
        document.getElementById('life-sim-modal').classList.remove('open');
        const launch = () => {
          if (window.LocalMap3D && window.LocalMap3D.spawnDuelNpc) {
            window.LocalMap3D.spawnDuelNpc(curNpc, isLethal);
            showOwToast(isLethal
              ? `拔剑伏击【${curNpc.name}】！走位躲红圈、按 F/2/3 即时生死决战！`
              : `向【${curNpc.name}】发起实景切磋！按 F/2/3 即时论剑！`);
          }
        };
        if (viewLayer !== 'local') {
          switchViewLayer('local', HERO.locId);
          setTimeout(launch, 160);
        } else launch();
      };
      const ds = document.getElementById('btn-duel-spar');
      const dk = document.getElementById('btn-duel-kill');
      if (ds) ds.onclick = () => startLiveDuel(false);
      if (dk) dk.onclick = () => startLiveDuel(true);
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
      const caveLv = HERO.caveLv || 1;
      const recipes = (window.LifeModules && window.LifeModules.RECIPES) || [];
      const ab = (window.LifeModules && window.LifeModules.getArtBonus) ? window.LifeModules.getArtBonus(HERO) : { art: HERO.arts[0], lv: 1, weaponAtk: 0, label: '吐纳流' };
      const eq = (window.LifeModules && window.LifeModules.ensureEquipState) ? window.LifeModules.ensureEquipState(HERO) : { art: HERO.arts[0], weapon: null };
      body.innerHTML = `
        ${sceneHtml}
        <div class="ls-card" style="border-color:rgba(212,184,122,0.52);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <b style="color:#f5e2b5;">主修功法：</b>${ab.art} <span class="ls-pill jade">第${ab.lv}层 · ${ab.label}</span>
            <span style="margin-left:10px;"><b style="color:#f5e2b5;">本命法宝：</b>${eq.weapon ? `<span style="color:#9ff2cf;">${eq.weapon.name} (攻+${eq.weapon.atkBonus})</span>` : '<span style="color:#938c7e;">未装备（可在下方装备法宝/遗迹秘宝）</span>'}</span>
          </div>
          <button class="ls-btn jade" id="btn-lvup-art">参悟升阶主修功法 (${ab.lv * 45}石)</button>
        </div>
        <div class="ls-grid-2">
          <div class="ls-card">
            <h3><span>储物袋道具 · 法宝与遗物</span><span>灵石：${HERO.stones}</span></h3>
            <div style="display:flex;flex-direction:column;gap:6px;max-height:240px;overflow-y:auto;">
              ${HERO.bag.map((it, idx) => `
                <div style="display:flex;gap:8px;align-items:center;padding:6px;background:rgba(10,14,20,0.85);border:1px solid rgba(212,184,122,0.18);border-radius:3px;">
                  <div class="ls-slot-box" style="width:36px;height:36px;" data-asset-slot="item_icon_${it.kind}"><img src="assets/items/spirit_stone.webp" alt="道具" /></div>
                  <div style="flex:1;"><b style="color:#f2daa0;">${it.name}</b> ×${it.qty} <span class="ls-pill">${it.kind}</span><div style="font-size:10px;color:#938c7e;">${it.desc}</div></div>
                  ${it.kind === '丹药' ? `<button class="ls-btn jade" data-use="${idx}">服用</button>` : ''}
                  ${(it.kind === '法宝' || it.kind === '遗迹秘宝') ? `<button class="ls-btn blue" data-eqw="${idx}">装备</button>` : ''}
                </div>
              `).join('')}
            </div>
            <div style="margin-top:8px;border-top:1px dashed rgba(212,184,122,0.2);padding-top:6px;">
              <b style="color:#f2daa0;">已习得功法（点击切换主修）：</b>
              <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:4px;">
                ${HERO.arts.map(a => `<button class="ls-btn ${eq.art===a?'jade':''}" data-eqa="${a}">${a} (L${(HERO.artLevels&&HERO.artLevels[a])||1})</button>`).join('')}
              </div>
            </div>
          </div>
          <div class="ls-card">
            <h3><span>🏔️ 洞府聚灵阵 (${caveLv}阶) · 炼丹炼器炉</span><button class="ls-btn jade" id="btn-up-cave" style="padding:2px 7px;">升级洞府(${caveLv*110}石)</button></h3>
            <div style="font-size:10.5px;color:#938c7e;margin-bottom:6px;">消耗野外采集的【聚灵草】与斩妖获得的【妖丹】亲手炼丹铸剑！</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${recipes.map(r => `
                <div style="padding:6px 8px;background:rgba(10,15,22,0.88);border:1px solid rgba(212,184,122,0.2);border-radius:4px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
                  <div>
                    <b style="color:#f2daa0;">${r.name}</b> <span class="ls-pill">${r.kind}</span>
                    <div style="font-size:10px;color:#938c7e;">${r.desc}</div>
                    <div style="font-size:9.5px;color:#70b8f0;">需：灵石${r.needStones}${r.needHerb?` + 灵草×${r.needHerb}`:''}${r.needCore?` + 妖丹×${r.needCore}`:''}</div>
                  </div>
                  <button class="ls-btn blue" data-craft="${r.id}">开炉炼制</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      body.querySelectorAll('[data-use]').forEach(btn => {
        btn.onclick = () => {
          ensureHeroStats();
          const it = HERO.bag[Number(btn.dataset.use)];
          if (!it) return;
          const ef = it.effect || { exp: 45, toxin: 12 };
          if (ef.exp) HERO.exp = Math.min(HERO.maxExp, HERO.exp + ef.exp);
          if (ef.toxin) HERO.life.pillToxin = Math.min(100, HERO.life.pillToxin + ef.toxin);
          if (ef.detox) HERO.life.pillToxin = Math.max(0, HERO.life.pillToxin - ef.detox);
          if (ef.calm) HERO.life.heartDemon = Math.max(0, HERO.life.heartDemon - ef.calm);
          it.qty--;
          if (it.qty <= 0) HERO.bag.splice(Number(btn.dataset.use), 1);
          pushLog(`你服下【${it.name}】！当前修为 ${HERO.exp}/${HERO.maxExp}，丹毒 ${HERO.life.pillToxin}/100。`);
          saveState(); syncTopHud(); renderModal();
        };
      });
      body.querySelectorAll('[data-craft]').forEach(btn => {
        btn.onclick = () => {
          const res = window.LifeModules.craftRecipe(HERO, btn.dataset.craft);
          if (res.ok) { pushLog(res.msg); showOwToast(res.msg); saveState(); syncTopHud(); renderModal(); }
          else showOwToast('⚠️ ' + res.msg);
        };
      });
      const uc = document.getElementById('btn-up-cave');
      if (uc) uc.onclick = () => {
        const res = window.LifeModules.upgradeCave(HERO);
        if (res.ok) { pushLog(res.msg); showOwToast(res.msg); saveState(); syncTopHud(); renderModal(); }
        else showOwToast('⚠️ ' + res.msg);
      };
      const la = document.getElementById('btn-lvup-art');
      if (la) la.onclick = () => {
        const res = window.LifeModules.levelUpArt(HERO, eq.art);
        if (res.ok) { pushLog(res.msg); showOwToast(res.msg); saveState(); syncTopHud(); renderModal(); }
        else showOwToast(res.msg);
      };
      body.querySelectorAll('[data-eqa]').forEach(b => {
        b.onclick = () => {
          const res = window.LifeModules.equipArt(HERO, b.dataset.eqa);
          if (res.ok) { showOwToast(res.msg); saveState(); renderModal(); }
        };
      });
      body.querySelectorAll('[data-eqw]').forEach(b => {
        b.onclick = () => {
          const res = window.LifeModules.equipWeapon(HERO, Number(b.dataset.eqw));
          if (res.ok) { pushLog(res.msg); showOwToast(res.msg); saveState(); renderModal(); }
        };
      });
    } else {
      const en = window.WorldCore.calcConservation(WORLD);
      const myFac = HERO.myFactionId ? WORLD.factions.find(f => f.id === HERO.myFactionId && f.alive) : null;
      const hasDsKey = !!(localStorage.getItem('cangming_ds_key') || '').trim();
      body.innerHTML = `
        ${sceneHtml}
        <div class="ls-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div><b>5 池守恒(20,000)</b>：核${en.core} / 游${en.ambient} / 表${en.surf} / 锁${en.locked} / 煞${en.shaE} · 遗迹 <b>${(WORLD.ruins||[]).length}</b> 座 · 涌现制度 <b>${(WORLD.institutions||[]).length}</b> 项</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="ls-btn blue" id="ls-open-birth">童年手记</button>
            <button class="ls-btn jade" id="ls-export-save">导出存档</button>
            <label class="ls-btn" style="display:inline-block;">读取存档<input type="file" id="ls-import-save" accept=".json" style="display:none;" /></label>
            <label class="ls-btn jade" style="display:inline-block;">导入实验室JSON<input type="file" id="ls-import-file" accept=".json" style="display:none;" /></label>
            <button class="ls-btn red" id="ls-regen-world">重建新1200年世界</button>
          </div>
        </div>
        <div class="ls-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;border-color:rgba(112,184,240,0.4);">
          <div style="font-size:11px;">
            <b style="color:#a8d4ff;">DeepSeek AI 自由交涉引擎</b>
            <span class="ls-pill ${hasDsKey?'jade':''}">${hasDsKey ? '已配置 Key · 实时AI模式' : '未配置 · 本地人格裁定模式'}</span>
            <span style="color:#938c7e;">（Key 仅保存在你本机浏览器 localStorage）</span>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <input type="password" class="ls-input" id="inp-ds-key" value="${hasDsKey ? '••••••••••••' : ''}" placeholder="输入 sk-... DeepSeek Key" style="width:200px;" />
            <button class="ls-btn blue" id="btn-save-ds">保存</button>
            ${hasDsKey ? '<button class="ls-btn red" id="btn-clear-ds">清除</button>' : ''}
          </div>
        </div>
        ${myFac ? `
          <div class="ls-card" style="border-color:#6fd3a8;">
            <h3><span>我的宗门治理 · 【${myFac.name}】</span><span>门徒 ${myFac.disciples} 人 · 官僚 ${Math.round(myFac.bureaucracy||0)} · 不公 ${Math.round(myFac.inequality||0)} · 杂役 ${myFac.servants||0}</span></h3>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="ls-btn red" data-sect="exploit_servants">压榨杂役(+90石/不公与通缉↑)</button>
              <button class="ls-btn jade" data-sect="treat_well">厚待放权(-45石/民心与掌控↑)</button>
              <button class="ls-btn blue" data-sect="recruit">招募散修(-55石/门徒+20)</button>
              <button class="ls-btn" data-sect="host_inst">创办本宗十年交易盛会(-100石)</button>
              <button class="ls-btn jade" data-sect="expedition">派弟子探查周边灵脉(-40石)</button>
            </div>
          </div>
        ` : ''}
        <div class="ls-card" style="max-height:175px;overflow-y:auto;">
          <h3><span>《沧溟界实时编年史》（共 ${(WORLD.chronicles||[]).length} 条真实演化与玩家史迹）</span></h3>
          ${(WORLD.chronicles || []).slice(0, 28).map(c => `<div style="padding:3px 0;border-bottom:1px dashed rgba(212,184,122,0.12);font-size:10.5px;"><span class="ls-pill">${c.tag || '史'}</span> ${c.text}</div>`).join('') || '暂无史册记录'}
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
      if (rg) rg.onclick = () => {
        if (!confirm('确认清空当前存档并重新演化一个全新的 1200 年沧溟界？')) return;
        freshWorld(Math.floor(Math.random() * 99999)); pushLog(`⚡ 已重建全新 1200 年世界！`); switchViewLayer('local', HERO.locId); renderModal();
      };
      const exSave = document.getElementById('ls-export-save');
      if (exSave) exSave.onclick = () => {
        const slimWorld = Object.assign({}, WORLD, { nodeMap: undefined });
        const blob = new Blob([JSON.stringify({ world: slimWorld, hero: HERO }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `qingyun_save_${HERO.name}_第${WORLD.year}年.json`;
        a.click();
        showOwToast('已导出完整游戏存档 JSON！');
      };
      const imSave = document.getElementById('ls-import-save');
      if (imSave) imSave.onchange = async e => {
        const file = e.target.files?.[0]; if (!file) return;
        try {
          const parsed = JSON.parse(await file.text());
          if (!parsed.world || !parsed.hero) throw new Error('非有效存档格式');
          WORLD = parsed.world;
          WORLD.nodeMap = Object.fromEntries(WORLD.nodes.map(n => [n.id, n]));
          HERO = parsed.hero;
          selectedPlateId = HERO.locId || 'E2';
          saveState(); switchViewLayer('local', HERO.locId); renderModal();
          showOwToast(`已读取存档：【${HERO.name}】第 ${WORLD.year} 年！`);
        } catch (err) { alert('读取存档失败：' + err.message); }
      };
      const bSaveDs = document.getElementById('btn-save-ds');
      if (bSaveDs) bSaveDs.onclick = () => {
        const v = (document.getElementById('inp-ds-key')?.value || '').trim();
        if (!v || v.startsWith('••')) { showOwToast('请输入有效的 sk-... API Key'); return; }
        localStorage.setItem('cangming_ds_key', v);
        showOwToast('DeepSeek API Key 已保存到本地浏览器！现可在江湖面板开启真实 AI 自由交涉');
        renderModal();
      };
      const bClrDs = document.getElementById('btn-clear-ds');
      if (bClrDs) bClrDs.onclick = () => {
        localStorage.removeItem('cangming_ds_key');
        showOwToast('已清除本机 DeepSeek API Key');
        renderModal();
      };
      const ob = document.getElementById('ls-open-birth');
      if (ob) ob.onclick = () => { activeScene = { type: 'birth_story', data: { step: 0, picks: [] } }; renderModal(); };
      body.querySelectorAll('[data-sect]').forEach(btn => {
        btn.onclick = () => {
          const res = window.LifeModules.manageSect(HERO, WORLD, btn.dataset.sect);
          if (res.ok) { pushLog(res.msg); showOwToast(res.msg); saveState(); syncTopHud(); renderModal(); }
          else showOwToast('⚠️ ' + res.msg);
        };
      });
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

  const REALM_LADDER = [
    { name: '炼气一层', maxExp: 100, hp: 120, qi: 80, lifespan: 110 },
    { name: '炼气三层', maxExp: 180, hp: 180, qi: 130, lifespan: 120 },
    { name: '炼气圆满', maxExp: 280, hp: 260, qi: 200, lifespan: 130 },
    { name: '筑基初期', maxExp: 450, hp: 480, qi: 400, lifespan: 220 },
    { name: '筑基圆满', maxExp: 700, hp: 720, qi: 620, lifespan: 250 },
    { name: '金丹初期', maxExp: 1200, hp: 1400, qi: 1200, lifespan: 500 },
    { name: '元婴初期', maxExp: 2200, hp: 3200, qi: 2800, lifespan: 1000 },
    { name: '化神尊者', maxExp: 4000, hp: 7500, qi: 6800, lifespan: 2200 }
  ];

  function ensureHeroStats() {
    if (!HERO) return;
    if (typeof HERO.realmIdx !== 'number') HERO.realmIdx = 0;
    const rl = REALM_LADDER[Math.min(HERO.realmIdx, REALM_LADDER.length - 1)];
    if (typeof HERO.exp !== 'number') HERO.exp = 20;
    HERO.maxExp = rl.maxExp;
    HERO.maxHp = rl.hp;
    HERO.maxQi = rl.qi;
    if (typeof HERO.hp !== 'number') HERO.hp = rl.hp;
    if (typeof HERO.qi !== 'number') HERO.qi = rl.qi;
    HERO.lifespan = rl.lifespan;
    HERO.realm = rl.name;
  }

  function attemptBreakthrough() {
    ensureHeroStats();
    if (HERO.realmIdx >= REALM_LADDER.length - 1) { showOwToast('✨ 你已臻化神之境，俯瞰沧溟！'); return; }
    if (HERO.exp < HERO.maxExp) { showOwToast(`修为尚浅（${HERO.exp}/${HERO.maxExp}），请前往【聚灵蒲团】打坐吐纳！`); return; }
    const nd = WORLD.nodeMap[HERO.locId] || WORLD.nodes[0];
    const toxinPen = Math.floor((HERO.life.pillToxin || 0) * 0.35);
    const demonPen = Math.floor((HERO.life.heartDemon || 0) * 0.4);
    const injPen = (HERO.life.injuries || []).length * 8;
    const leyBonus = Math.floor((nd.leyline || 40) * 0.25);
    const rate = Math.max(15, Math.min(95, 72 + leyBonus - toxinPen - demonPen - injPen));
    if (Math.random() * 100 < rate) {
      HERO.realmIdx++;
      HERO.exp = 0;
      ensureHeroStats();
      HERO.hp = HERO.maxHp; HERO.qi = HERO.maxQi;
      HERO.life.pillToxin = Math.max(0, HERO.life.pillToxin - 15);
      if (viewLayer === 'local' && window.LocalMap3D && window.LocalMap3D.playBreakthroughVfx) {
        window.LocalMap3D.playBreakthroughVfx(true, HERO.realm);
      }
      pushLog(`⚡ 破境成功（成功率 ${rate}%）！你于【${nd.name}】引动天地灵潮，正式踏入【${HERO.realm}】，寿元增至 ${HERO.lifespan} 岁！`);
      showOwToast(`⚡ 破境成功！恭喜踏入【${HERO.realm}】！（成功率 ${rate}%）`);
    } else {
      HERO.exp = Math.floor(HERO.maxExp * 0.65);
      HERO.life.heartDemon = Math.min(100, HERO.life.heartDemon + 12);
      if (viewLayer === 'local' && window.LocalMap3D && window.LocalMap3D.playBreakthroughVfx) {
        window.LocalMap3D.playBreakthroughVfx(false, HERO.realm);
      }
      pushLog(`💔 破境受挫（成功率 ${rate}%，受丹毒/心魔所累），修为跌回 ${HERO.exp}/${HERO.maxExp}，心魔+12！`);
      showOwToast(`💔 破境失败（成功率 ${rate}%），丹毒或心魔过重！`);
    }
    saveState(); syncTopHud();
  }

  function syncTopHud() {
    if (!WORLD || !HERO) return;
    ensureHeroStats();
    const nd = WORLD.nodeMap[HERO.locId] || WORLD.nodes[0];
    const rEl = document.getElementById('hud-realm-txt');
    const dEl = document.getElementById('hud-date');
    const sEl = document.getElementById('hud-stone');
    const aEl = document.getElementById('hud-age');
    const tEl = document.getElementById('hud-timeline');
    const hpBar = document.getElementById('bar-hp');
    const qiBar = document.getElementById('bar-qi');
    let expBar = document.getElementById('bar-exp');
    if (!expBar) {
      const bars = document.querySelector('#hud-tl .hud-mini-bars');
      if (bars) {
        const wrap = document.createElement('div');
        wrap.className = 'mini-bar exp';
        wrap.innerHTML = '<i id="bar-exp" style="width:0%"></i>';
        bars.appendChild(wrap);
        expBar = document.getElementById('bar-exp');
      }
    }
    const hpTxt = document.getElementById('bar-hp-txt');
    const qiTxt = document.getElementById('bar-qi-txt');
    if (rEl) rEl.textContent = HERO.realm;
    if (dEl) dEl.textContent = `第${WORLD.year}年·${WORLD.month}月`;
    if (sEl) sEl.textContent = HERO.stones;
    if (aEl) aEl.textContent = `${HERO.age}/${HERO.lifespan}岁`;
    if (hpBar) hpBar.style.width = Math.min(100, Math.round(HERO.hp / HERO.maxHp * 100)) + '%';
    if (qiBar) qiBar.style.width = Math.min(100, Math.round((HERO.qi || 0) / HERO.maxQi * 100)) + '%';
    if (expBar) expBar.style.width = Math.min(100, Math.round(HERO.exp / HERO.maxExp * 100)) + '%';
    if (hpTxt) hpTxt.textContent = `血${HERO.hp} 气${Math.round(HERO.qi || 0)}`;
    if (qiTxt) qiTxt.textContent = `修${HERO.exp}/${HERO.maxExp}`;
    if (tEl) tEl.style.display = 'none';

    const btBtn = document.getElementById('ow-btn-break');
    if (btBtn) btBtn.style.display = HERO.exp >= HERO.maxExp ? 'inline-block' : 'none';
    const biBtn = document.getElementById('ow-btn-birth');
    if (biBtn) biBtn.style.display = HERO.birthDone ? 'none' : 'inline-block';

    // 更新左上角新手4步极简引导条
    const gp = document.getElementById('ow-guide-pill');
    const gt = document.getElementById('ow-guide-txt');
    if (gp && gt) {
      if (HERO._guideDismissed || (HERO.realmIdx || 0) >= 1) {
        gp.classList.remove('show');
      } else {
        const step = HERO._guideStep || 0;
        const steps = [
          '<b>初入仙途 (1/4)</b><br/>走到广场西侧【悬赏榜】按 <b>E</b>（或点右上罗盘「赏」字自动寻路）',
          '<b>初入仙途 (2/4)</b><br/>过南桥去城外，左键点妖狼，走位躲红圈并按 <b>F / 2</b> 斩杀拾取金球',
          '<b>初入仙途 (3/4)</b><br/>点顶部【回洞府】在蒲团按 <b>E</b> 打坐，蓄满修为进度条',
          '<b>初入仙途 (4/4)</b><br/>修为蓄满后，点顶部红印【破境渡劫】踏入下一重境界！'
        ];
        gt.innerHTML = steps[Math.min(step, steps.length - 1)];
        gp.classList.add('show');
      }
    }

    const regEl = document.getElementById('ow-region-info');
    if (regEl) {
      const holds = (nd.holdings || []).map(h => {
        const f = WORLD.factions.find(x => x.id === h.factionId);
        return f ? f.name : '';
      }).filter(Boolean).slice(0, 1).join('') || '无主荒野';
      regEl.innerHTML = `<b style="color:#f5e2b5;letter-spacing:1.5px;">${nd.name}</b> <span style="color:#8f8776;">·</span> <span style="color:#9ff2cf;">灵脉${nd.leyline}</span> <span style="color:#8f8776;">·</span> <span style="color:${(nd.darkForestIdx||0)>=55?'#ff9d95':'#c8bfa8'};">${holds}</span>`;
    }
    const goalEl = document.getElementById('ow-goal-txt');
    if (goalEl) {
      const hint = HERO.exp >= HERO.maxExp
        ? '⚡ 修为已满！点击顶部【破境渡劫】'
        : (!HERO.myFactionId && HERO.stones >= 150
          ? '🏯 灵石充裕，可在宗门大殿开宗立派'
          : '🧘 东南【聚灵蒲团】打坐 / 东北采草 / 城外斩妖');
      const news = (WORLD.chronicles && WORLD.chronicles[0]) ? WORLD.chronicles[0].text.slice(0, 28) + '…' : '沧溟界灵潮涌动…';
      goalEl.innerHTML = `<div style="color:#6fd3a8;margin-bottom:3px;">${hint}</div><div style="color:#9d9586;font-size:9.5px;">📰 ${news}</div>`;
    }
  }

  function openModalTab(tab) {
    activeTab = tab;
    activeScene = null;
    document.getElementById('life-sim-modal').classList.add('open');
    renderModal();
  }

  let viewLayer = 'local'; // 'local' (城镇实景) | 'world' (大洲地图) | 'interior' (室内精细实景)
  let currentRoom = 'cave';
  let minimapTimer = null;

  function activeMapEngine() {
    if (viewLayer === 'interior') return window.InteriorMap3D;
    return viewLayer === 'local' ? window.LocalMap3D : window.Map3D;
  }

  function renderMinimap() {
    const cv = document.getElementById('ow-minimap-cv');
    const head = document.getElementById('ow-minimap-title');
    if (!cv) return;
    const eng = activeMapEngine();
    const d = eng && eng.getMinimapData ? eng.getMinimapData() : null;
    if (!d) return;
    if (head) head.textContent = d.mode === 'local' ? d.title : '五洲七海';
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = d.mode === 'local' ? '#101d1c' : '#081624';
    ctx.fillRect(0, 0, W, H);
    // 八卦罗盘细环刻度
    ctx.strokeStyle = 'rgba(212,184,122,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, W * 0.32, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W / 2, 4); ctx.lineTo(W / 2, H - 4); ctx.moveTo(4, H / 2); ctx.lineTo(W - 4, H / 2); ctx.stroke();

    // 同步底部 3A 动作栏实时技能冷却遮罩
    if (viewLayer === 'local' && window.LocalMap3D && window.LocalMap3D.getCombatHudState) {
      const cs = window.LocalMap3D.getCombatHudState();
      if (cs) {
        const setCd = (id, val) => {
          const el = document.getElementById(id);
          if (!el) return;
          if (val > 0.08) { el.textContent = val.toFixed(1); el.classList.add('on'); }
          else el.classList.remove('on');
        };
        setCd('cd-strike', cs.cdStrike);
        setCd('cd-spell', cs.cdSpell);
        setCd('cd-shield', cs.cdShield);
        const fb = document.getElementById('ow-btn-fly');
        if (fb) fb.classList.toggle('active-fly', !!cs.flying);
      }
    }

    const ox = d.ox || 0, oz = d.oz || 0;
    const sx = x => ((x - ox) / d.w + 0.5) * W;
    const sy = z => ((z - oz) / d.h + 0.5) * H;

    if (d.mode === 'local') {
      // 十字主街 & 灵溪简图
      ctx.fillStyle = 'rgba(190,175,140,0.28)';
      ctx.fillRect(W * 0.44, 6, W * 0.12, H - 12);
      ctx.fillRect(10, H * 0.43, W - 20, H * 0.12);
      ctx.fillStyle = 'rgba(42,130,175,0.45)';
      ctx.fillRect(0, H * 0.70, W, H * 0.10);
    }

    // 建筑 / 板块点（带清晰单字地标，一眼认出悬赏/坊市/蒲团/城门！）
    const poiChar = { sect_hall: '宗', market: '市', teahouse: '茶', black_market: '黑', meditate: '坐', gather: '草', ruin: '遗', exit: '门', bounty: '赏' };
    ctx.font = 'bold 9px "Songti SC",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    (d.pois || []).forEach(p => {
      const px = sx(p.x), py = sy(p.z);
      const ch = poiChar[p.type];
      if (ch && d.mode === 'local') {
        ctx.fillStyle = p.type === 'exit' || p.type === 'bounty' ? 'rgba(247,208,112,0.92)' : 'rgba(20,30,40,0.88)';
        ctx.beginPath(); ctx.arc(px, py, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d4b87a'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = (p.type === 'exit' || p.type === 'bounty') ? '#14120e' : '#f2daa0';
        ctx.fillText(ch, px, py + 0.5);
      } else {
        ctx.fillStyle = p.type === 'sea' ? 'rgba(70,130,180,0.35)' : '#d4b87a';
        ctx.fillRect(px - 2.5, py - 2.5, 5, 5);
      }
    });
    // NPC（蓝点）
    ctx.fillStyle = '#70b8f0';
    (d.npcs || []).forEach(n => {
      ctx.beginPath(); ctx.arc(sx(n.x), sy(n.z), 2.3, 0, Math.PI * 2); ctx.fill();
    });
    // 妖兽（红点）
    ctx.fillStyle = '#e06258';
    (d.beasts || []).forEach(b => {
      ctx.beginPath(); ctx.arc(sx(b.x), sy(b.z), 2.8, 0, Math.PI * 2); ctx.fill();
    });
    // 主角（亮绿光点）
    const hx = sx(d.hero.x), hy = sy(d.hero.z);
    ctx.fillStyle = '#6fd3a8';
    ctx.beginPath(); ctx.arc(hx, hy, 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4; ctx.stroke();
  }

  function handleWorldInteract(target) {
    if (!target) return;
    if (target.type === 'bounty_board') {
      if ((HERO._guideStep || 0) < 1) HERO._guideStep = 1;
      activeTab = 'map';
      activeScene = { type: 'bounty_board', data: {} };
      document.getElementById('life-sim-modal').classList.add('open');
      renderModal();
      return;
    }
    if (target.type === 'refugee') {
      const ym = WORLD.year * 12 + WORLD.month;
      if (HERO._lastRefugeeYm === ym) {
        showOwToast('本月已施舍过此地流民，待下月再来探望吧');
        return;
      }
      if (HERO.stones >= 20) {
        HERO._lastRefugeeYm = ym;
        HERO.stones -= 20;
        HERO.life.reputation.mortal += 12;
        HERO.life.heartDemon = Math.max(0, HERO.life.heartDemon - 10);
        HERO.wanted = Math.max(0, (HERO.wanted || 0) - 5);
        pushLog('你在桥畔施舍 20 灵石救助落魄流民，凡人功德 +12，心魔 -10！');
        saveState(); syncTopHud();
        showOwToast('施舍 20 灵石救助流民：凡人名声 +12、心魔 -10！');
      } else {
        showOwToast('你囊中羞涩（需 20 灵石），只能宽慰流民几句');
      }
      return;
    }
    if (target.type === 'exit_interior') {
      switchViewLayer('local', HERO.locId);
      showOwToast('已推门走出，重返城镇大街');
      return;
    }
    if (target.type === 'open_alchemy') { openModalTab('bag'); return; }
    if (target.type === 'open_world_tab') { openModalTab('world'); return; }
    if (target.type === 'cave_relics') {
      HERO.life.heartDemon = Math.max(0, HERO.life.heartDemon - 20);
      HERO.life.loneliness = Math.max(0, HERO.life.loneliness - 15);
      saveState(); syncTopHud();
      showOwToast('观想供案旧物与功法残卷，道心通明（心魔-20、孤寂-15）');
      return;
    }
    if (target.type === 'tea_rest') {
      ensureHeroStats(); HERO.hp = HERO.maxHp; HERO.qi = HERO.maxQi;
      saveState(); syncTopHud();
      showOwToast('饮下一盏青云灵茶，气血与灵力尽数恢复！');
      return;
    }
    if (target.type === 'sect_panel') {
      selectedPlateId = target.data.plate.id;
      openModalTab(HERO.myFactionId ? 'world' : 'map');
      return;
    }
    if (target.type === 'meditate') {
      ensureHeroStats();
      const nd = target.data || WORLD.nodeMap[HERO.locId];
      const caveBonus = 1 + ((HERO.caveLv || 1) - 1) * 0.25;
      const artMedMul = (window.LifeModules && window.LifeModules.getArtBonus) ? window.LifeModules.getArtBonus(HERO).meditateMul : 1;
      const gain = Math.round((28 + (nd.leyline || 40) * 0.55 + (HERO.daoWit || 70) * 0.2) * caveBonus * artMedMul);
      HERO.exp = Math.min(HERO.maxExp, HERO.exp + gain);
      HERO.hp = HERO.maxHp; HERO.qi = HERO.maxQi;
      HERO.life.pillToxin = Math.max(0, HERO.life.pillToxin - 4);
      window.LifeSim.advanceLifeMonths(HERO, WORLD, 1, 'seclude');
      pushLog(`你在【${nd.name}】聚灵蒲团盘膝吐纳一月，修为 +${gain}（${HERO.exp}/${HERO.maxExp}），丹毒略散！`);
      if ((HERO._guideStep || 0) < 3) HERO._guideStep = 3;
      if (window.WorldDirector) {
        const done = window.WorldDirector.recordProgress(HERO, 'meditate', 1);
        if (done) showOwToast(`悬赏达成【${done.title}】！请前往广场悬赏榜领赏`);
      }
      saveState(); syncTopHud();
      showOwToast(HERO.exp >= HERO.maxExp
        ? `修为圆满（${HERO.exp}/${HERO.maxExp}）！可点击顶部【破境渡劫】`
        : `盘膝打坐一月：修为 +${gain}（${HERO.exp}/${HERO.maxExp}），气血灵力回满`);
      return;
    }
    if (target.type === 'exit_world') {
      switchViewLayer('world');
      showOwToast('已走出山门 · 进入五洲七海 2.5D 大洲地图');
      return;
    }
    if (target.type === 'teahouse') {
      if (viewLayer === 'local' && window.InteriorMap3D) {
        switchViewLayer('interior', HERO.locId, 'teahouse');
        showOwToast('步入【仙缘茶馆·雅间】，可听评书、品灵茶或结交散修');
        return;
      }
      const sp = target.data.plate || WORLD.nodeMap[HERO.locId];
      if (window.LivingEvents && Math.random() < 0.65) {
        const ev = window.LivingEvents.rollLivingSocialEvent(HERO, WORLD);
        if (ev) {
          activeTab = 'life';
          activeScene = { type: 'living_event', data: { ev } };
          document.getElementById('life-sim-modal').classList.add('open');
          renderModal();
          return;
        }
      }
      const hist = WORLD.chronicles[Math.floor(Math.random() * Math.min(20, WORLD.chronicles.length))];
      HERO.life.loneliness = Math.max(0, HERO.life.loneliness - 15);
      pushLog(`你在【${sp.name}】仙缘茶馆听评书：“${hist ? hist.text : '太古灵潮初开之时……'}”`);
      saveState(); syncTopHud();
      showOwToast(`茶馆听书：${hist ? hist.text.slice(0, 38) + '…' : '孤寂大幅缓解！'}`);
      return;
    }
    if (target.type === 'market') {
      const sp = target.data.plate || WORLD.nodeMap[HERO.locId];
      const inst = target.data.inst || { name: `${sp.name}·万宝坊市`, status: 'thriving' };
      const corrupt = inst.status === 'corrupt';
      activeTab = 'map';
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
      document.getElementById('life-sim-modal').classList.add('open');
      renderModal();
      return;
    }
    if (target.type === 'black_market') {
      HERO.masked = !HERO.masked;
      saveState(); syncTopHud();
      showOwToast(HERO.masked ? `🎭 黑市易容：你戴上【${HERO.maskName}】，江湖身份已隐藏！` : '🎭 你在暗巷卸下易容，恢复真容');
      return;
    }
    if (target.type === 'sect_hall') {
      if (viewLayer === 'local' && window.InteriorMap3D) {
        switchViewLayer('interior', HERO.locId, 'sect_hall');
        showOwToast('步入【宗门大殿·正堂】，可登台议事、开宗立派或查阅悬赏');
        return;
      }
      selectedPlateId = target.data.plate.id;
      activeTab = 'map'; activeScene = null;
      document.getElementById('life-sim-modal').classList.add('open');
      renderModal();
      return;
    }
    if (target.type === 'gather') {
      const nowMs = Date.now();
      const ym = WORLD.year * 12 + WORLD.month;
      if (HERO._lastGatherYm === ym && HERO._lastGatherMs && (nowMs - HERO._lastGatherMs) < 18000) {
        const left = Math.ceil((18000 - (nowMs - HERO._lastGatherMs)) / 1000);
        showOwToast(`灵草正在灵脉滋养再生中（剩余 ${left} 秒，或推进一月立即重生）`);
        return;
      }
      HERO._lastGatherYm = ym; HERO._lastGatherMs = nowMs;
      const nd = target.data;
      const gain = 12 + Math.floor((nd.leyline || 30) * 0.25);
      HERO.stones += gain;
      const hasHerb = HERO.bag.find(i => i.name === '野生聚灵草');
      if (hasHerb) hasHerb.qty += 1;
      else HERO.bag.push({ id: 'it_herb', name: '野生聚灵草', kind: '灵材', qty: 1, desc: '采自野外灵脉，可售卖或炼丹' });
      pushLog(`你在【${nd.name}】灵脉处采得野生聚灵草×1，并掘出灵石 +${gain}！`);
      if (window.WorldDirector) {
        const done = window.WorldDirector.recordProgress(HERO, 'gather', 1);
        if (done) showOwToast(`悬赏达成【${done.title}】！请前往广场悬赏榜领赏`);
      }
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
      switchViewLayer('local', target.data.id);
      showOwToast(`🏘️ 已步入【${target.data.name}】正常视角城镇实景！`);
    }
  }

  function switchViewLayer(layer, plateId, roomType) {
    ensureInit();
    if (plateId) { HERO.locId = plateId; selectedPlateId = plateId; }
    if (roomType) currentRoom = roomType;
    viewLayer = layer;
    const host = document.getElementById('main-map3d-host');
    if (!host) return;
    if (window.LocalMap3D) window.LocalMap3D.dispose();
    if (window.Map3D) window.Map3D.dispose();
    if (window.InteriorMap3D) window.InteriorMap3D.dispose();

    const wrap = document.getElementById('ow-nearby-wrap');
    if (wrap) wrap.classList.remove('show');
    const swBtn = document.getElementById('ow-btn-layer');
    if (swBtn) swBtn.textContent = viewLayer === 'interior' ? '离开室内' : (viewLayer === 'local' ? '出城舆图' : '进城实景');
    const skBar = document.getElementById('ow-skill-bar');
    if (skBar) skBar.style.display = viewLayer === 'local' ? 'flex' : 'none';

    const commonOpts = {
      onRegionChange: pid => {
        selectedPlateId = pid;
        syncTopHud();
        const nd = WORLD.nodeMap[pid];
        if (nd) showOwToast(`🗺️ 踏入【${nd.name}】地界（灵脉 ${nd.leyline} · 暗森 ${nd.darkForestIdx || 0}）`);
      },
      onNearbyChange: target => {
        const w = document.getElementById('ow-nearby-wrap');
        const b = document.getElementById('ow-nearby-btn');
        if (!w || !b) return;
        if (target) { b.textContent = `[E] ${target.label}（${target.sub}）`; w.classList.add('show'); }
        else w.classList.remove('show');
      },
      onInteract: target => handleWorldInteract(target),
      onFlyToggle: flying => {
        const ft = document.getElementById('ow-fly-txt');
        const fb = document.getElementById('ow-btn-fly');
        if (ft) ft.textContent = flying ? '御剑中' : '御剑';
        if (fb) fb.classList.toggle('active-fly', !!flying);
        showOwToast(flying ? '祭出飞剑 · 进入御剑凌空状态' : '收剑落地 · 恢复徒步漫游');
      },
      onHeroStatsChange: () => syncTopHud(),
      onEnemyKilled: en => {
        ensureHeroStats();
        HERO.stones += en.rewardStones;
        HERO.exp = Math.min(HERO.maxExp, HERO.exp + en.rewardExp);
        if (en.drop) {
          const ex = HERO.bag.find(i => i.name === en.drop);
          if (ex) ex.qty += 1;
          else HERO.bag.push({ id: 'it_' + Date.now(), name: en.drop, kind: '妖材', qty: 1, desc: `即时斩杀【${en.name}】掉落` });
        }
        if ((HERO._guideStep || 0) < 2) HERO._guideStep = 2;
        if (en.isDuel && en.isLethal && en.npcRef) {
          en.npcRef.alive = false;
          HERO.wanted = (HERO.wanted || 0) + 25;
          HERO.life.reputation.demonic += 15;
          WORLD.chronicles.unshift({ year: WORLD.year, tag: '陨落', text: `第${WORLD.year}年：【${en.npcRef.name}】(${en.npcRef.realm})在实景斗法中被【${HERO.masked ? HERO.maskName : HERO.name}】当街斩杀夺宝！` });
        }
        if (window.WorldDirector) {
          const done = window.WorldDirector.recordProgress(HERO, 'kill', 1);
          if (done) showOwToast(`悬赏达成【${done.title}】！请前往广场悬赏榜领赏`);
        }
        pushLog(`⚔️ 你在实景激战中斩杀【${en.name}】，收获灵石 +${en.rewardStones}、修为 +${en.rewardExp}、${en.drop}×1！`);
        saveState(); syncTopHud();
        showOwToast(`🏆 斩杀【${en.name}】！灵石 +${en.rewardStones} · 修为 +${en.rewardExp} · 掉【${en.drop}】`);
      },
      onHeroDefeated: en => {
        HERO.life.injuries.push({ name: `${en.name}重创暗伤`, penalty: '破境成功率-8%' });
        HERO.stones = Math.max(0, HERO.stones - 15);
        pushLog(`🩸 你在城外被【${en.name}】击溃，保命遁符自动闪回中央广场（失 15 灵石，留暗伤）！`);
        saveState(); syncTopHud();
        showOwToast(`🩸 不敌【${en.name}】！保命遁符已将你闪回中央广场，快打坐疗伤！`);
      },
      onUseQuickPill: () => {
        ensureHeroStats();
        const idx = (HERO.bag || []).findIndex(i => i.kind === '丹药' && i.qty > 0);
        if (idx < 0) { showOwToast('⚠️ 储物袋暂无丹药（可在行囊-洞府炼丹炉用灵草炼制）'); return false; }
        const it = HERO.bag[idx];
        it.qty--;
        if (it.qty <= 0) HERO.bag.splice(idx, 1);
        HERO.hp = Math.min(HERO.maxHp, HERO.hp + Math.round(HERO.maxHp * 0.45));
        HERO.qi = Math.min(HERO.maxQi, HERO.qi + 35);
        HERO.life.pillToxin = Math.min(100, HERO.life.pillToxin + 8);
        saveState(); syncTopHud();
        showOwToast(`💊 即时吞服【${it.name}】：气血与灵力大幅回复（丹毒+8）`);
        return true;
      },
      onToast: msg => showOwToast(msg)
    };

    syncTopHud();
    requestAnimationFrame(() => {
      if (viewLayer === 'interior' && window.InteriorMap3D) {
        const plate = WORLD.nodeMap[HERO.locId] || WORLD.nodes[0];
        window.InteriorMap3D.mount(host, WORLD, HERO, plate, currentRoom, commonOpts);
      } else if (viewLayer === 'local' && window.LocalMap3D) {
        const plate = WORLD.nodeMap[HERO.locId] || WORLD.nodes[0];
        window.LocalMap3D.mount(host, WORLD, HERO, plate, commonOpts);
      } else if (window.Map3D) {
        window.Map3D.mount(host, WORLD, HERO, commonOpts);
      }
      renderMinimap();
    });
  }

  function mountMainBg3D() {
    ensureInit();
    if (!window.THREE) return;
    const app = document.getElementById('app');
    if (!app) return;

    ['world-layer', 'hud-bl', 'hud-br', 'hud-tc', 'hud-timeline'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const hudTl = document.getElementById('hud-tl');
    if (hudTl && !hudTl._v10Bound) {
      hudTl._v10Bound = true;
      hudTl.addEventListener('click', e => {
        e.preventDefault(); e.stopImmediatePropagation();
        openModalTab('life');
      }, true);
    }

    let host = document.getElementById('main-map3d-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'main-map3d-host';
      host.style.cssText = 'position:absolute;inset:0;z-index:10;cursor:crosshair;';
      app.appendChild(host);
    }

    if (!document.getElementById('ow-hud')) {
      const hud = document.createElement('div');
      hud.id = 'ow-hud';
      hud.innerHTML = `
        <div class="ow-top-bar">
          <span id="ow-region-info">沧溟山河</span>
          <button class="ow-micro-btn" id="ow-btn-layer">出城</button>
          <button class="ow-micro-btn" id="ow-btn-cave">洞府</button>
          <button class="ow-micro-btn" id="ow-btn-birth" style="display:none;">出身</button>
          <button class="ow-micro-btn" id="ow-btn-tod">昼</button>
          <button class="ow-micro-btn" id="ow-btn-clock" title="切换岁月自然流逝">⏸</button>
          <button class="ow-micro-btn" id="ow-btn-m1">+1月</button>
          <button class="ow-micro-btn" id="ow-btn-y1">闭关</button>
          <button class="ow-micro-btn crimson" id="ow-btn-break" style="display:none;">破境</button>
        </div>
        <div id="ow-minimap-box" title="点击罗盘任意方位自动寻路">
          <span class="mm-card mm-n">北</span><span class="mm-card mm-s">南</span>
          <span class="mm-card mm-w">西</span><span class="mm-card mm-e">东</span>
          <canvas id="ow-minimap-cv" width="124" height="124"></canvas>
          <div id="ow-minimap-title">沧溟舆图</div>
        </div>
        <div id="ow-guide-pill">
          <div id="ow-guide-txt"></div>
          <button id="ow-guide-close" title="隐藏引导">✕</button>
        </div>
        <div class="ow-nearby-wrap" id="ow-nearby-wrap">
          <button id="ow-nearby-btn">[E] 交互</button>
        </div>
        <div class="ow-skill-bar" id="ow-skill-bar">
          <button class="ow-sk-slot" data-sk="strike">
            <span class="ow-sk-key">F</span>
            <svg viewBox="0 0 24 24"><path d="M19 5L5 19M14 5h5v5M7 13l4 4"/></svg>
            <span class="ow-sk-name">剑诀</span>
            <div class="ow-sk-cd" id="cd-strike"></div>
          </button>
          <button class="ow-sk-slot" data-sk="spell">
            <span class="ow-sk-key">2</span>
            <svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
            <span class="ow-sk-name">天雷</span>
            <div class="ow-sk-cd" id="cd-spell"></div>
          </button>
          <button class="ow-sk-slot" data-sk="shield">
            <span class="ow-sk-key">3</span>
            <svg viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"/></svg>
            <span class="ow-sk-name">灵盾</span>
            <div class="ow-sk-cd" id="cd-shield"></div>
          </button>
          <button class="ow-sk-slot" data-sk="pill">
            <span class="ow-sk-key">4</span>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="15" r="5"/><path d="M9 10c0-2 1.5-4 3-5 1.5 1 3 3 3 5M10 4h4"/></svg>
            <span class="ow-sk-name">丹药</span>
          </button>
          <button class="ow-sk-slot" id="ow-btn-fly">
            <span class="ow-sk-key">空</span>
            <svg viewBox="0 0 24 24"><path d="M3 17l9-12 9 12M7 17h10"/></svg>
            <span class="ow-sk-name" id="ow-fly-txt">御剑</span>
          </button>
        </div>
        <div class="ow-whisper-bl">WASD/点地行走 · F/2/3/4 斗法 · Shift 闪避<br/>E 交互 · Space 御剑 · 右键转视角</div>
        <div class="ow-menu-br">
          <button class="ow-seal-btn primary" data-ow-tab="map">
            <svg viewBox="0 0 24 24"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z"/></svg><span>舆图</span>
          </button>
          <button class="ow-seal-btn" data-ow-tab="life">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M5 20c1.5-4 12.5-4 14 0"/></svg><span>人物</span>
          </button>
          <button class="ow-seal-btn" data-ow-tab="bag">
            <svg viewBox="0 0 24 24"><path d="M6 8h12l1 12H5L6 8zM9 8V6a3 3 0 016 0v2"/></svg><span>行囊</span>
          </button>
          <button class="ow-seal-btn" data-ow-tab="social">
            <svg viewBox="0 0 24 24"><circle cx="9" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 19c1-3 5-4 8-3M13 19c1-3 5-4 8-3"/></svg><span>江湖</span>
          </button>
          <button class="ow-seal-btn" data-ow-tab="world">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 010 18M12 3a13 13 0 000 18"/></svg><span>天道</span>
          </button>
        </div>
      `;
      app.appendChild(hud);

      hud.querySelectorAll('[data-ow-tab]').forEach(b => {
        b.onclick = () => openModalTab(b.dataset.owTab);
      });
      hud.querySelectorAll('[data-sk]').forEach(b => {
        b.onclick = () => {
          if (viewLayer === 'local' && window.LocalMap3D) window.LocalMap3D.castSkill(b.dataset.sk);
          else showOwToast('请进入城镇/野外实景地图进行即时战斗');
        };
      });
      document.getElementById('ow-btn-fly').onclick = () => {
        const e = activeMapEngine(); if (e) e.toggleFly();
      };
      document.getElementById('ow-nearby-btn').onclick = () => {
        const e = activeMapEngine(); if (e) e.triggerInteract();
      };
      document.getElementById('ow-btn-layer').onclick = () => {
        if (viewLayer === 'interior') switchViewLayer('local', HERO.locId);
        else switchViewLayer(viewLayer === 'local' ? 'world' : 'local');
      };
      document.getElementById('ow-btn-cave').onclick = () => {
        switchViewLayer('interior', HERO.locId, 'cave');
        showOwToast('已步入私人【灵脉洞府·石室】，可打坐、炼丹或观想遗物');
      };
      document.getElementById('ow-btn-birth').onclick = () => {
        activeTab = 'life';
        activeScene = { type: 'birth_story', data: { step: 0, picks: [] } };
        document.getElementById('life-sim-modal').classList.add('open');
        renderModal();
      };
      document.getElementById('ow-btn-tod').onclick = () => {
        if (viewLayer !== 'local' || !window.LocalMap3D) { showOwToast('昼夜灯火切换仅在局部城镇实景中生效'); return; }
        const m = window.LocalMap3D.cycleTimeOfDay();
        const lb = { day: '昼', dusk: '暮', night: '夜' }[m];
        document.getElementById('ow-btn-tod').textContent = lb;
        showOwToast(m === 'night' ? '暮色四合，仙镇华灯初上，黑市鬼火幽幽…' : (m === 'dusk' ? '残阳如血，倦鸟归林…' : '晨曦初照，天地灵气复苏'));
      };
      document.getElementById('ow-guide-close').onclick = () => {
        HERO._guideDismissed = true; saveState(); syncTopHud();
      };
      document.getElementById('ow-btn-break').onclick = () => attemptBreakthrough();
      document.getElementById('ow-minimap-cv').onclick = e => {
        const eng = activeMapEngine();
        const d = eng && eng.getMinimapData ? eng.getMinimapData() : null;
        if (!d || !eng.walkTo) return;
        const rect = e.target.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        const wx = (nx - 0.5) * d.w + (d.ox || 0);
        const wz = (ny - 0.5) * d.h + (d.oz || 0);
        eng.walkTo(wx, wz);
        showOwToast('🧭 已按小地图坐标自动寻路前往…');
      };
      function checkMortality() {
        ensureHeroStats();
        if (HERO.age >= HERO.lifespan && (!activeScene || activeScene.type !== 'mortality')) {
          activeTab = 'life';
          activeScene = { type: 'mortality', data: {} };
          document.getElementById('life-sim-modal').classList.add('open');
          renderModal();
        }
      }
      let autoClockOn = true;
      document.getElementById('ow-btn-clock').onclick = () => {
        autoClockOn = !autoClockOn;
        document.getElementById('ow-btn-clock').textContent = autoClockOn ? '⏸' : '▶';
        showOwToast(autoClockOn ? '岁月恢复自然流逝（每 25 秒推进一月）' : '已暂停岁月自然流逝');
      };
      setInterval(() => {
        if (!autoClockOn) return;
        const md = document.getElementById('life-sim-modal');
        const ct = document.getElementById('v10-title-curtain');
        if ((md && md.classList.contains('open')) || ct) return;
        const res = window.LifeSim.advanceLifeMonths(HERO, WORLD, 1, 'mortal_life');
        saveState(); syncTopHud();
        if (res && res.proactiveEvent) {
          showOwToast(`${res.proactiveEvent.title}：${res.proactiveEvent.desc}`);
        }
        checkMortality();
      }, 25000);
      document.getElementById('ow-btn-m1').onclick = () => {
        const res = window.LifeSim.advanceLifeMonths(HERO, WORLD, 1, 'mortal_life');
        const npcLogs = window.LivingEvents ? window.LivingEvents.stepLivingNpcs(WORLD, 1) : [];
        saveState(); syncTopHud();
        if (window.LivingEvents && Math.random() < 0.42) {
          const ev = window.LivingEvents.rollLivingSocialEvent(HERO, WORLD);
          if (ev) {
            activeTab = 'life'; activeScene = { type: 'living_event', data: { ev } };
            document.getElementById('life-sim-modal').classList.add('open');
            renderModal(); checkMortality(); return;
          }
        }
        const msg = npcLogs[0] || ((res && res.proactiveEvent) ? `${res.proactiveEvent.title}：${res.proactiveEvent.desc}` : ((res && res.changes && res.changes[0]) || `岁月流转：第 ${WORLD.year} 年 ${WORLD.month} 月`));
        showOwToast(msg);
        checkMortality();
      };
      document.getElementById('ow-btn-y1').onclick = () => {
        ensureHeroStats();
        const nd = WORLD.nodeMap[HERO.locId] || WORLD.nodes[0];
        const caveBonus = 1 + ((HERO.caveLv || 1) - 1) * 0.25;
        const gain = Math.round((70 + (nd.leyline || 40) * 1.1) * caveBonus);
        HERO.exp = Math.min(HERO.maxExp, HERO.exp + gain);
        const res = window.LifeSim.advanceLifeMonths(HERO, WORLD, 12, 'seclude');
        const npcLogs = window.LivingEvents ? window.LivingEvents.stepLivingNpcs(WORLD, 12) : [];
        saveState(); syncTopHud();
        const msg = HERO.exp >= HERO.maxExp
          ? `闭关一年修为圆满(${HERO.exp}/${HERO.maxExp})！可点击顶部【破境渡劫】`
          : (npcLogs[0] || ((res && res.proactiveEvent) ? `${res.proactiveEvent.title}：${res.proactiveEvent.desc}` : ((res && res.changes && res.changes[0]) || `闭关一年出关！修为 +${gain}，当前第 ${WORLD.year} 年`)));
        showOwToast(msg);
        checkMortality();
      };
    }

    // 默认直接进入【正常视角局部城镇/宗门实景地图】！
    switchViewLayer('local', HERO.locId);
    if (minimapTimer) clearInterval(minimapTimer);
    minimapTimer = setInterval(renderMinimap, 120);
  }

  function mount() {
    if (!window.WorldCore || !window.LifeSim) return;
    injectStyles();

    const modal = document.createElement('div');
    modal.id = 'life-sim-modal';
    modal.innerHTML = `
      <div class="ls-box">
        <div class="ls-head">
          <h2 id="ls-title">沧溟修仙模拟人生 ${APP_VER}</h2>
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
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        modal.classList.remove('open');
        syncTopHud();
      }
    });
    modal.querySelectorAll('.ls-tab').forEach(t => {
      t.onclick = () => { activeTab = t.dataset.tab; activeScene = null; renderModal(); };
    });

    // 隐藏旧版静态容器，启动统一 3A 沧溟界引擎
    const oldTitle = document.getElementById('title-root');
    if (oldTitle) oldTitle.style.display = 'none';

    mountMainBg3D();
    setInterval(syncTopHud, 2000);

    // 统一 3A 宋明开场标题幕布（让第一次打开游戏的玩家清晰了解世界并一键开局！）
    const hasSave = !!localStorage.getItem(LS_KEY);
    const curtain = document.createElement('div');
    curtain.id = 'v10-title-curtain';
    curtain.innerHTML = `
      <div class="v10-title-card">
        <div style="font-size:11px;letter-spacing:4px;color:#9ff2cf;margin-bottom:6px;">真实演化修仙模拟人生 · 沧溟界 ${APP_VER}</div>
        <h1 style="font-size:32px;letter-spacing:6px;color:#f5e2b5;margin:0 0 10px;font-weight:700;">青云问道录</h1>
        <div style="font-size:12px;color:#bfb7a8;line-height:1.7;margin-bottom:18px;">
          五洲七海已先行自然演化 1200 年：宗门兴衰、物价涨落、遗迹现世、众生百态皆非预设剧本。<br/>
          你将亲自漫游于三层立体山海实景，在饥荒式即时斗法与百年世家传承中走出自己的仙途。
        </div>
        ${hasSave ? `<button class="v10-t-btn main" id="t-btn-cont">继续仙途（${HERO.name} · ${HERO.realm} · 第${WORLD.year}年）</button>` : ''}
        <button class="v10-t-btn ${hasSave ? '' : 'main'}" id="t-btn-birth">${hasSave ? '重开新档 · 0–18 岁童年手记开局' : '踏入沧溟 · 0–18 岁童年手记开局'}</button>
        <button class="v10-t-btn" id="t-btn-direct">直接降临仙城广场</button>
      </div>
    `;
    document.body.appendChild(curtain);
    const closeCurtain = () => { if (curtain.parentNode) curtain.parentNode.removeChild(curtain); };
    const bCont = document.getElementById('t-btn-cont');
    if (bCont) bCont.onclick = () => { closeCurtain(); showOwToast(`欢迎归来，【${HERO.name}】！`); };
    document.getElementById('t-btn-direct').onclick = () => { closeCurtain(); showOwToast('已降临仙城中央广场 · 请参考左上角 4 步初入指引！'); };
    document.getElementById('t-btn-birth').onclick = () => {
      if (hasSave) { freshWorld(Math.floor(Math.random() * 99999)); switchViewLayer('local', HERO.locId); }
      closeCurtain();
      activeTab = 'life';
      activeScene = { type: 'birth_story', data: { step: 0, picks: [] } };
      document.getElementById('life-sim-modal').classList.add('open');
      renderModal();
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
