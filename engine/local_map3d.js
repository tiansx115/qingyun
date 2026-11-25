/* ============================================================================
 * 《沧溟界》v9.6.0 正常视角 HD-2D 局部实景 + 饥荒风无缝即时战斗引擎 (engine/local_map3d.js)
 * ----------------------------------------------------------------------------
 * - 无专门战斗场景！所有妖兽与暗森劫修直接在实景地图上即时战斗（饥荒式走位拉扯/打一走一）
 * - 敌怪头顶实时血条 + 仇恨追击 + 地面红圈蓄力前摇（走出红圈即可完美闪避 MISS!）
 * - 即时快捷键：[F / 1 / 左键点怪] 青云剑诀挥砍 · [2] 五行天雷 · [3] 玄玉灵盾 · [4] 吞丹回血
 * - 3D 剑气弧光、天雷光柱、护体灵盾球、浮空伤害数字、击杀直接爆灵石/妖丹/修为
 * ============================================================================ */
(function (root) {
  'use strict';

  let state = null;

  function makeGroundTexture(biome) {
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 1024;
    const ctx = cv.getContext('2d');
    const pal = {
      ice:     { base: '#b9cfe0', grass: '#9eb8cc', road: '#6d7b8a', border: '#dceaf5', water: '#2a638c' },
      volcano: { base: '#4a332c', grass: '#5c3b2e', road: '#6e5c52', border: '#9c6448', water: '#c44b24' },
      fire:    { base: '#594234', grass: '#6b4f3a', road: '#7c6a58', border: '#a88c68', water: '#3a6f82' },
      wood:    { base: '#34523c', grass: '#2b4733', road: '#7b7464', border: '#a89d86', water: '#206378' },
      island:  { base: '#3d4766', grass: '#333b59', road: '#757282', border: '#a69ec2', water: '#1b5375' },
      ocean:   { base: '#2c4f63', grass: '#234457', road: '#7e7663', border: '#b8aa8c', water: '#154d73' },
      earth:   { base: '#47573c', grass: '#3b4a31', road: '#857a65', border: '#b3a588', water: '#24687d' }
    }[biome] || { base: '#47573c', grass: '#3b4a31', road: '#857a65', border: '#b3a588', water: '#24687d' };

    ctx.fillStyle = pal.base;
    ctx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = i % 2 === 0 ? pal.grass : 'rgba(255,255,255,0.04)';
      ctx.beginPath(); ctx.arc((i * 197) % 1024, (i * 353) % 1024, 12 + (i % 28), 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = pal.water;
    ctx.fillRect(0, 718, 1024, 88);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 718); ctx.lineTo(1024, 718); ctx.moveTo(0, 806); ctx.lineTo(1024, 806); ctx.stroke();

    const drawStoneRoad = (x, y, w, h) => {
      ctx.fillStyle = pal.road; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = pal.border; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5;
      for (let gx = x; gx < x + w; gx += 26) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); }
      for (let gy = y; gy < y + h; gy += 26) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
    };
    drawStoneRoad(452, 72, 120, 888);
    drawStoneRoad(80, 442, 864, 106);

    ctx.fillStyle = pal.road;
    ctx.beginPath(); ctx.arc(512, 495, 118, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d4b87a'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = 'rgba(111,211,168,0.5)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(512, 495, 86, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(512, 495, 46, 0, Math.PI * 2); ctx.stroke();

    ctx.strokeStyle = 'rgba(60,55,48,0.65)'; ctx.lineWidth = 14;
    ctx.strokeRect(24, 24, 976, 976);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    return tex;
  }

  function makePlaque(title, sub, borderColor) {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 80;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = 'rgba(10,14,22,0.88)';
    ctx.strokeStyle = borderColor || '#d4b87a';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(6, 6, 244, 66, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f6e7c1';
    ctx.font = 'bold 23px "Songti SC","Noto Serif SC",serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 10), 128, 36);
    if (sub) {
      ctx.fillStyle = '#9ff2cf';
      ctx.font = '15px sans-serif';
      ctx.fillText(sub.slice(0, 16), 128, 60);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;
    return tex;
  }

  function makeHpBarTexture(hp, maxHp, name) {
    const cv = document.createElement('canvas');
    cv.width = 220; cv.height = 56;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = 'rgba(10,12,18,0.86)';
    ctx.beginPath(); ctx.roundRect(6, 4, 208, 48, 7); ctx.fill();
    ctx.fillStyle = '#ffccc4';
    ctx.font = 'bold 17px "Songti SC","Noto Serif SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${name} (${Math.max(0, Math.round(hp))}/${maxHp})`, 110, 24);
    ctx.fillStyle = '#2a181c';
    ctx.fillRect(16, 32, 188, 12);
    const pct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
    ctx.fillStyle = pct > 0.35 ? '#e05248' : '#ff9138';
    ctx.fillRect(16, 32, Math.round(188 * pct), 12);
    ctx.strokeStyle = '#d4b87a'; ctx.lineWidth = 1.5;
    ctx.strokeRect(16, 32, 188, 12);
    const tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;
    return tex;
  }

  function makeBubbleTexture(text, col) {
    const cv = document.createElement('canvas');
    cv.width = 320; cv.height = 64;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = 'rgba(12,16,24,0.92)';
    ctx.strokeStyle = col || 'rgba(242,218,160,0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(6, 6, 308, 44, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff5dc';
    ctx.font = '17px "Songti SC","Noto Serif SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text.slice(0, 17), 160, 34);
    const tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;
    return tex;
  }

  function buildChineseBuilding(w, h, d, roofHex, wallHex, hasLanterns) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.7, 0.35, d + 0.7), new THREE.MeshStandardMaterial({ color: 0x6e6c66, roughness: 0.9 }));
    base.position.y = 0.175; g.add(base);
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: wallHex || 0xd6ccb8, roughness: 0.8 }));
    body.position.y = 0.35 + h / 2; g.add(body);
    const pMat = new THREE.MeshStandardMaterial({ color: 0x8c2822, roughness: 0.6 });
    const pGeo = new THREE.CylinderGeometry(0.11, 0.12, h, 8);
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => {
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(sx * (w / 2 - 0.1), 0.35 + h / 2, sz * (d / 2 + 0.08)); g.add(p);
    });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.2, Math.min(1.7, h * 0.75)), new THREE.MeshBasicMaterial({ color: 0xffe09c }));
    door.position.set(0, 0.35 + Math.min(1.7, h * 0.75) / 2, d / 2 + 0.02); g.add(door);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.82, 1.55, 4), new THREE.MeshStandardMaterial({ color: roofHex || 0x263c4d, roughness: 0.55, metalness: 0.2 }));
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(w / Math.max(w, d) * 1.15, 1, d / Math.max(w, d) * 1.15);
    roof.position.y = 0.35 + h + 0.72; g.add(roof);
    if (hasLanterns) {
      const lMat = new THREE.MeshBasicMaterial({ color: 0xff6b42 });
      const lGeo = new THREE.SphereGeometry(0.2, 8, 8);
      [-w * 0.32, w * 0.32].forEach(lx => {
        const lan = new THREE.Mesh(lGeo, lMat);
        lan.position.set(lx, 0.35 + h - 0.16, d / 2 + 0.35); g.add(lan);
      });
    }
    return g;
  }

  function buildLanternPost() {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.6, 6), new THREE.MeshStandardMaterial({ color: 0x4d3426 }));
    pole.position.y = 1.3;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.08), new THREE.MeshStandardMaterial({ color: 0x4d3426 }));
    arm.position.set(0.28, 2.55, 0);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffb35c }));
    orb.position.set(0.55, 2.32, 0);
    g.add(pole, arm, orb);
    return g;
  }

  function buildMarketStall(awningHex) {
    const g = new THREE.Group();
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.72, 1.0), new THREE.MeshStandardMaterial({ color: 0x7a5638 }));
    table.position.y = 0.36;
    const awning = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.14, 1.35), new THREE.MeshStandardMaterial({ color: awningHex || 0xa63c32 }));
    awning.position.set(0, 1.85, 0); awning.rotation.x = 0.18;
    const pGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.85, 6);
    const pMat = new THREE.MeshStandardMaterial({ color: 0x523926 });
    [[-1.05,-0.45],[1.05,-0.45],[-1.05,0.45],[1.05,0.45]].forEach(([px, pz]) => {
      const p = new THREE.Mesh(pGeo, pMat); p.position.set(px, 0.92, pz); g.add(p);
    });
    g.add(table, awning);
    return g;
  }

  function buildArchway() {
    const g = new THREE.Group();
    const pMat = new THREE.MeshStandardMaterial({ color: 0x7d2922, roughness: 0.6 });
    const rMat = new THREE.MeshStandardMaterial({ color: 0x22384a, roughness: 0.5 });
    [-2.0, 2.0].forEach(px => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.6, 8), pMat);
      col.position.set(px, 1.8, 0); g.add(col);
    });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.45, 0.5), pMat); beam.position.set(0, 3.2, 0);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.36, 1.25), rMat); roof.position.set(0, 3.65, 0);
    g.add(beam, roof);
    return g;
  }

  function makeHumanSprite(imgUrl, name, sub, tintHex, scaleW, scaleH, isHostile) {
    const group = new THREE.Group();
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false }));
    sh.rotateX(-Math.PI / 2); sh.position.y = 0.03; group.add(sh);

    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.58, 24), new THREE.MeshBasicMaterial({ color: tintHex, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
    ring.rotateX(-Math.PI / 2); ring.position.y = 0.05; group.add(ring);

    const cv = document.createElement('canvas');
    cv.width = 160; cv.height = 220;
    const ctx = cv.getContext('2d');
    const hexStr = '#' + tintHex.toString(16).padStart(6, '0');
    ctx.fillStyle = hexStr;
    ctx.beginPath(); ctx.moveTo(80, 62); ctx.lineTo(126, 205); ctx.lineTo(34, 205); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f5dec2'; ctx.beginPath(); ctx.arc(80, 44, 22, 0, Math.PI * 2); ctx.fill();
    const charTex = new THREE.CanvasTexture(cv);

    if (imgUrl) {
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, 160, 220);
        ctx.save(); ctx.beginPath(); ctx.roundRect(14, 14, 132, 192, 66); ctx.clip();
        const aspect = img.width / img.height;
        let dw = 152, dh = 152 / aspect;
        if (dh < 200) { dh = 200; dw = dh * aspect; }
        ctx.drawImage(img, (160 - dw) / 2, 8, dw, dh);
        ctx.restore();
        ctx.strokeStyle = hexStr; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.roundRect(14, 14, 132, 192, 66); ctx.stroke();
        charTex.needsUpdate = true;
      };
      img.src = imgUrl;
    }

    const body = new THREE.Sprite(new THREE.SpriteMaterial({ map: charTex, transparent: true }));
    body.scale.set(scaleW || 1.45, scaleH || 2.05, 1);
    body.position.y = (scaleH || 2.05) * 0.52;
    group.add(body);

    let hpSprite = null;
    if (isHostile) {
      hpSprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
      hpSprite.scale.set(2.4, 0.62, 1);
      hpSprite.position.y = (scaleH || 1.8) + 0.45;
      group.add(hpSprite);
    } else if (name) {
      const np = new THREE.Sprite(new THREE.SpriteMaterial({ map: makePlaque(name, sub, hexStr), transparent: true, depthTest: false }));
      np.scale.set(2.4, 0.75, 1);
      np.position.y = (scaleH || 2.05) + 0.52;
      group.add(np);
    }

    const bubbleSp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, opacity: 0 }));
    bubbleSp.scale.set(3.4, 0.68, 1);
    bubbleSp.position.y = (scaleH || 2.05) + 1.25;
    group.add(bubbleSp);

    return { group, body, ring, bubbleSp, hpSprite };
  }

  function dispose() {
    if (!state) return;
    if (state.raf) cancelAnimationFrame(state.raf);
    if (state.cleanup) state.cleanup();
    if (state.renderer) {
      state.renderer.dispose();
      if (state.renderer.domElement && state.renderer.domElement.parentNode) {
        state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
      }
    }
    state = null;
  }

  function mount(container, world, hero, plate, opts) {
    dispose();
    if (!window.THREE || !container || !plate) return false;
    opts = opts || {};
    const THREE = window.THREE;
    const W = Math.max(480, container.clientWidth || window.innerWidth || 960);
    const H = Math.max(360, container.clientHeight || window.innerHeight || 640);

    const scene = new THREE.Scene();
    const skyMap = { ice: 0x16283b, volcano: 0x26120e, wood: 0x0f2120, island: 0x15142b };
    const baseSky = skyMap[plate.biome] || 0x112030;
    scene.background = new THREE.Color(baseSky);
    scene.fog = new THREE.FogExp2(baseSky, 0.014);

    const camera = new THREE.PerspectiveCamera(38, W / H, 0.3, 140);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xb8cbe0, 0.85);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffe6bd, 1.15);
    sun.position.set(16, 28, 18);
    scene.add(sun);

    const nightLights = [];
    const addNightLight = (x, y, z, col, dist) => {
      const pl = new THREE.PointLight(col || 0xffaa55, 0.0, dist || 14);
      pl.position.set(x, y, z); scene.add(pl); nightLights.push(pl);
    };

    const MAP_W = 52, MAP_H = 46;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_W, MAP_H),
      new THREE.MeshStandardMaterial({ map: makeGroundTexture(plate.biome), roughness: 0.92 })
    );
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    // 灵溪拱桥
    const addBridge = (bx, bw) => {
      const br = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.32, 5.4), new THREE.MeshStandardMaterial({ color: 0x855a3c, roughness: 0.8 }));
      br.position.set(bx, 0.18, 11.1); scene.add(br);
      [-bw / 2 + 0.12, bw / 2 - 0.12].forEach(ox => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 5.4), new THREE.MeshStandardMaterial({ color: 0x6e261f, roughness: 0.7 }));
        rail.position.set(bx + ox, 0.55, 11.1); scene.add(rail);
      });
    };
    addBridge(0, 4.6); addBridge(13.0, 2.8);

    [[-3.6, -7.5], [3.6, -7.5], [-3.6, 5.5], [3.6, 5.5], [-8.5, 2.8], [8.5, 2.8]].forEach(([lx, lz]) => {
      const lp = buildLanternPost(); lp.position.set(lx, 0, lz); scene.add(lp);
      addNightLight(lx, 2.6, lz, 0xffa852, 13);
    });

    const colliders = [];
    const interactables = [];
    const clickMeshes = [];
    const buildingsForMini = [];

    const addBuildingPoi = (x, z, w, h, d, roofHex, wallHex, title, sub, type, data, borderCol) => {
      const b = buildChineseBuilding(w, h, d, roofHex, wallHex, true);
      b.position.set(x, 0, z); scene.add(b);
      colliders.push({ minX: x - w / 2 - 0.45, maxX: x + w / 2 + 0.45, minZ: z - d / 2 - 0.45, maxZ: z + d / 2 + 0.45 });
      addNightLight(x, h + 0.5, z + d / 2 + 1.0, type === 'black_market' ? 0xb56eff : 0xffb35c, 15);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makePlaque(title, sub, borderCol || '#d4b87a'), transparent: true, depthTest: false }));
      sp.scale.set(3.2, 1.0, 1); sp.position.set(x, h + 2.7, z);
      sp.userData = { interactIdx: interactables.length };
      scene.add(sp); clickMeshes.push(sp);
      buildingsForMini.push({ x, z, label: title, type });
      interactables.push({ type, id: type + '_' + x, label: `进入【${title}】`, sub, x, z: z + d / 2 + 1.35, obj: sp, data });
    };

    const mainFac = (plate.holdings && plate.holdings.length) ? world.factions.find(f => f.id === plate.holdings[0].factionId) : null;
    const localInsts = (world.institutions || []).filter(i => i.plateId === plate.id);
    const localRuins = (world.ruins || []).filter(r => r.plateId === plate.id);

    addBuildingPoi(0, -14.8, 7.2, 3.3, 4.6, 0x1d4d4f, 0xd8cbb4,
      mainFac ? `${mainFac.name}·主殿` : `${plate.name}·仙盟议事堂`,
      mainFac ? `掌门:${mainFac.leader} · 占${plate.holdings[0].share}%` : '无主之地 · 可开宗立派',
      'sect_hall', { plate, fac: mainFac }, '#6fd3a8');

    addBuildingPoi(-12.5, -4.2, 5.4, 2.6, 4.0, 0x3b3552, 0xd9ceba,
      localInsts.length ? localInsts[0].name : `${plate.name}·万宝坊市`,
      `丹×${plate.priceIndex.pill} 矿×${plate.priceIndex.mineral} · 交易/竞拍`,
      'market', { plate, inst: localInsts[0] || null }, '#70b8f0');

    const stall1 = buildMarketStall(0xa63c32); stall1.position.set(-7.5, 0, -4.6); scene.add(stall1);
    colliders.push({ minX: -8.8, maxX: -6.2, minZ: -5.4, maxZ: -3.8 });
    const stall2 = buildMarketStall(0x2d685c); stall2.position.set(7.5, 0, -4.6); scene.add(stall2);
    colliders.push({ minX: 6.2, maxX: 8.8, minZ: -5.4, maxZ: -3.8 });

    addBuildingPoi(12.5, -4.2, 5.2, 2.5, 3.8, 0x5c3424, 0xdfd3be, '仙缘茶馆·听书楼', '打听本世界真实史话与秘境风声', 'teahouse', { plate }, '#f2daa0');
    addBuildingPoi(-14.5, 5.2, 4.2, 2.1, 3.4, 0x231d29, 0x615966, '幽影黑市暗巷', `暗森指数 ${plate.darkForestIdx || 0} · 销赃/易容`, 'black_market', { plate }, '#e06258');

    // 东南：聚灵蒲团
    const cx = 13.5, cz = 4.6;
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0xb8893c, roughness: 0.7 }));
    cushion.position.set(cx, 0.11, cz); scene.add(cushion);
    const medRing = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.48, 32), new THREE.MeshBasicMaterial({ color: 0x6fd3a8, side: THREE.DoubleSide, transparent: true, opacity: 0.75 }));
    medRing.rotateX(-Math.PI / 2); medRing.position.set(cx, 0.05, cz); scene.add(medRing);
    const cSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makePlaque('🧘 聚灵蒲团·打坐', `本地灵脉${plate.leyline} · 增修为`, '#6fd3a8'), transparent: true, depthTest: false }));
    cSp.scale.set(2.9, 0.88, 1); cSp.position.set(cx, 2.2, cz); cSp.userData = { interactIdx: interactables.length };
    scene.add(cSp); clickMeshes.push(cSp);
    buildingsForMini.push({ x: cx, z: cz, label: '打坐', type: 'meditate' });
    interactables.push({ type: 'meditate', id: 'meditate_spot', label: '盘膝打坐 · 吐纳灵气增进修为', sub: `灵脉${plate.leyline}加成`, x: cx, z: cz, obj: cSp, data: plate });

    // 东北：野生灵草
    const gx = 16.5, gz = -13.2;
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), new THREE.MeshStandardMaterial({ color: 0x6fd3a8, emissive: 0x268560, emissiveIntensity: 0.75 }));
    crystal.position.set(gx, 0.9, gz); crystal.userData = { interactIdx: interactables.length };
    scene.add(crystal); clickMeshes.push(crystal);
    const gSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makePlaque('🌿 野生灵脉草丛', `灵脉${plate.leyline} · 按E采集`, '#6fd3a8'), transparent: true, depthTest: false }));
    gSp.scale.set(2.8, 0.85, 1); gSp.position.set(gx, 2.3, gz); scene.add(gSp);
    buildingsForMini.push({ x: gx, z: gz, label: '灵草', type: 'gather' });
    interactables.push({ type: 'gather', id: 'local_gather', label: `采集【${plate.name}灵草】`, sub: `灵脉${plate.leyline}`, x: gx, z: gz, obj: crystal, data: plate });

    // 西北：古修遗迹
    if (localRuins.length) {
      const r = localRuins[0];
      const rx = -16.5, rz = -13.5;
      const mono = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 0.7), new THREE.MeshStandardMaterial({ color: 0x384859, emissive: 0x1d3b4d, emissiveIntensity: 0.6 }));
      mono.position.set(rx, 1.6, rz); mono.userData = { interactIdx: interactables.length };
      scene.add(mono); clickMeshes.push(mono);
      const rSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makePlaque('🗝️ 古修遗迹入口', r.name.slice(0, 10), '#f7d070'), transparent: true, depthTest: false }));
      rSp.scale.set(3.0, 0.9, 1); rSp.position.set(rx, 4.1, rz); scene.add(rSp);
      buildingsForMini.push({ x: rx, z: rz, label: '遗迹', type: 'ruin' });
      interactables.push({ type: 'ruin', id: r.id, label: `闯入古遗迹【${r.name}】`, sub: `阵法${r.sealStrength}`, x: rx, z: rz + 1.2, obj: rSp, data: r });
    }

    // 南侧：城门出口
    const arch = buildArchway(); arch.position.set(0, 0, 18.8); scene.add(arch);
    const exSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makePlaque('🚪 城门·出城远行', '前往五洲七海大洲地图', '#f2daa0'), transparent: true, depthTest: false }));
    exSp.scale.set(3.4, 1.05, 1); exSp.position.set(0, 4.6, 18.8); exSp.userData = { interactIdx: interactables.length };
    scene.add(exSp); clickMeshes.push(exSp);
    buildingsForMini.push({ x: 0, z: 18.8, label: '城门', type: 'exit' });
    interactables.push({ type: 'exit_world', id: 'exit_gate', label: '走出城门 · 前往【五洲七海大洲地图】', sub: '跨洲御剑 / 游历天下', x: 0, z: 17.5, obj: exSp, data: plate });

    // 古松
    const trMat = new THREE.MeshStandardMaterial({ color: 0x4d3726, roughness: 0.9 });
    const lfMat = new THREE.MeshStandardMaterial({ color: plate.biome === 'ice' ? 0xc0d9eb : (plate.biome === 'volcano' ? 0x6b3a28 : 0x265c41), flatShading: true });
    const trGeo = new THREE.CylinderGeometry(0.14, 0.2, 1.1, 6);
    const lfGeo = new THREE.ConeGeometry(0.95, 2.3, 6);
    [[-21,-17],[-19,-8],[-21,2],[-20,15],[-9,-17],[9,-17],[21,-16],[20,-6],[21,4],[19,16],[-8,6],[8,6],[-10,16],[8,16]].forEach(([tx, tz]) => {
      const tg = new THREE.Group();
      const tr = new THREE.Mesh(trGeo, trMat); tr.position.y = 0.55;
      const lf = new THREE.Mesh(lfGeo, lfMat); lf.position.y = 2.0;
      tg.add(tr, lf); tg.position.set(tx, 0, tz); scene.add(tg);
    });

    // 街道活 NPC
    const ambientLines = [
      `听说了吗？本地丹药价涨到 ×${plate.priceIndex.pill} 了！`,
      mainFac && mainFac.hasServantSystem ? `唉，${mainFac.name}杂役月俸又被执事克扣了…` : '散修难当，还是早日找个靠山安稳。',
      '城南河边妖兽横行，出城记得祭剑走位躲红圈！',
      localRuins.length ? `西北城外那座【${localRuins[0].name.slice(0,6)}】昨夜竟有雷光！` : '哪天能撞上一座古修洞府就好了…',
      world.chronicles && world.chronicles[0] ? world.chronicles[0].text.slice(0, 16) + '…' : '沧溟灵潮起伏，不知又能出几位大能。'
    ];
    const npcActors = [];
    const localAgents = (world.agents || []).filter(a => a.alive && a.locId === plate.id);
    const fallbackAgents = (world.agents || []).filter(a => a.alive).slice(0, 5);
    const showAgents = (localAgents.length >= 3 ? localAgents : localAgents.concat(fallbackAgents)).slice(0, 6);
    const portraits = ['assets/chars/sister_full.webp', 'assets/chars/elder.webp', 'assets/chars/hero.webp'];

    showAgents.forEach((ag, idx) => {
      const sx = -8 + (idx % 3) * 7.5;
      const sz = -1.5 + Math.floor(idx / 3) * 5.8;
      const fac = ag.factionId ? world.factions.find(f => f.id === ag.factionId) : null;
      const sp = makeHumanSprite(portraits[idx % portraits.length], ag.name, `${ag.realm}·${fac ? fac.name.slice(0, 4) : '散修'}`, ag.factionId ? 0x70b8f0 : 0xd4b87a, 1.35, 1.9, false);
      sp.group.position.set(sx, 0, sz); sp.body.userData = { interactIdx: interactables.length };
      scene.add(sp.group); clickMeshes.push(sp.body);
      const entry = { type: 'npc', id: ag.id, label: `与【${ag.name}】交谈`, sub: `${ag.realm} · ${fac ? fac.name : '散修'}`, x: sx, z: sz, obj: sp.group, data: ag };
      interactables.push(entry);
      npcActors.push({ sp, entry, homeX: sx, homeZ: sz, x: sx, z: sz, tx: sx, tz: sz, wait: 1 + Math.random() * 2.5, speed: 1.55, phase: Math.random() * 6, bubbleLife: 0 });
    });

    // ===== 饥荒风：无缝即时战斗敌怪群（直接在城外实景中拉扯、走位、挥剑斩杀！） =====
    const hostileActors = [];
    const rScale = 1 + ((hero && hero.realmIdx) || 0) * 0.55;
    const bName = plate.biome === 'ice' ? '寒渊冰蛟' : (plate.biome === 'volcano' ? '赤炎妖猿' : '幽林妖狼');
    const enemySpawns = [
      { x: 14.8, z: 15.6, name: bName, avatar: 'assets/chars/wolf_boss.webp', hp: Math.round(95 * rScale), atk: Math.round(14 * rScale), rewardStones: 36, rewardExp: 32, drop: `${bName}妖丹` },
      { x: -13.5, z: 15.8, name: bName + '头领', avatar: 'assets/chars/wolf_boss.webp', hp: Math.round(135 * rScale), atk: Math.round(18 * rScale), rewardStones: 55, rewardExp: 48, drop: `${bName}妖丹` },
      { x: -16.5, z: -8.5, name: '暗森劫修', avatar: 'assets/chars/elder.webp', hp: Math.round(115 * rScale), atk: Math.round(16 * rScale), rewardStones: 62, rewardExp: 42, drop: '劫修储物袋' }
    ];

    enemySpawns.forEach((spDef, idx) => {
      const sp = makeHumanSprite(spDef.avatar, spDef.name, '', 0xe05248, 1.5, 1.75, true);
      sp.group.position.set(spDef.x, 0, spDef.z);
      sp.hpSprite.material.map = makeHpBarTexture(spDef.hp, spDef.hp, spDef.name);
      sp.hpSprite.material.needsUpdate = true;

      // 饥荒风：地面攻击预警红圈（蓄力时放大变亮，走出红圈即可完美闪避！）
      const warnRing = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 2.35, 28),
        new THREE.MeshBasicMaterial({ color: 0xff3b30, side: THREE.DoubleSide, transparent: true, opacity: 0 })
      );
      warnRing.rotateX(-Math.PI / 2); warnRing.position.y = 0.08;
      sp.group.add(warnRing);

      const en = {
        id: 'en_' + idx, sp, warnRing,
        name: spDef.name, homeX: spDef.x, homeZ: spDef.z,
        x: spDef.x, z: spDef.z, tx: spDef.x, tz: spDef.z,
        hp: spDef.hp, maxHp: spDef.hp, atk: spDef.atk,
        rewardStones: spDef.rewardStones, rewardExp: spDef.rewardExp, drop: spDef.drop,
        alive: true, respawnTimer: 0,
        aiState: 'patrol', aiTimer: 1.0, hitFlash: 0, speed: 2.85
      };
      sp.body.userData = { hostileRef: en };
      scene.add(sp.group);
      clickMeshes.push(sp.body);
      hostileActors.push(en);
    });

    // 主角
    const heroPos = { x: 0, z: 1.5, tx: null, tz: null, flying: false, facing: 1, walkPhase: 0, attackTarget: null };
    const heroActor = makeHumanSprite(
      'assets/chars/hero_full.webp',
      (hero && hero.masked ? hero.maskName : (hero && hero.name)) || '青云道友',
      (hero && hero.realm) || '炼气一层',
      0x6fd3a8, 1.55, 2.15, false
    );
    const swordMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 1.65), new THREE.MeshBasicMaterial({ color: 0x8ef7da }));
    swordMesh.visible = false;
    heroActor.group.add(swordMesh);

    // 护体灵盾 3D 光球
    const shieldDome = new THREE.Mesh(
      new THREE.SphereGeometry(1.35, 18, 14),
      new THREE.MeshBasicMaterial({ color: 0x6fd3a8, transparent: true, opacity: 0.25, wireframe: true })
    );
    shieldDome.position.y = 1.1; shieldDome.visible = false;
    heroActor.group.add(shieldDome);

    heroActor.group.position.set(heroPos.x, 0, heroPos.z);
    scene.add(heroActor.group);

    // 3D 即时特效池（剑气弧光、天雷光柱、浮空飘字）
    const vfxList = []; // { mesh, life, maxLife, vy, expand }
    const spawnFloatText = (x, y, z, text, color) => {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
      const ctx = cv.getContext('2d');
      ctx.font = 'bold 30px "Songti SC",sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 5; ctx.strokeStyle = '#090c12'; ctx.strokeText(text, 128, 44);
      ctx.fillStyle = color || '#ffeb99'; ctx.fillText(text, 128, 44);
      const tex = new THREE.CanvasTexture(cv);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      sp.scale.set(2.8, 0.72, 1); sp.position.set(x, y, z);
      scene.add(sp);
      vfxList.push({ mesh: sp, life: 0.95, maxLife: 0.95, vy: 1.9, expand: 0 });
    };

    const spawnSlashVfx = (x, z, angle) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.9, 2.1, 16, 1, -0.9, 1.8),
        new THREE.MeshBasicMaterial({ color: 0x7ef7d4, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
      );
      ring.rotateX(-Math.PI / 2); ring.rotation.z = -angle;
      ring.position.set(x, 1.0, z);
      scene.add(ring);
      vfxList.push({ mesh: ring, life: 0.24, maxLife: 0.24, vy: 0, expand: 2.2 });
    };

    const spawnLightningVfx = (x, z) => {
      const bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.65, 11, 10),
        new THREE.MeshBasicMaterial({ color: 0xffe478, transparent: true, opacity: 0.92 })
      );
      bolt.position.set(x, 5.5, z); scene.add(bolt);
      vfxList.push({ mesh: bolt, life: 0.36, maxLife: 0.36, vy: 0, expand: -0.6 });
      const shock = new THREE.Mesh(
        new THREE.RingGeometry(0.4, 3.4, 28),
        new THREE.MeshBasicMaterial({ color: 0xa8d4ff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      );
      shock.rotateX(-Math.PI / 2); shock.position.set(x, 0.14, z); scene.add(shock);
      vfxList.push({ mesh: shock, life: 0.42, maxLife: 0.42, vy: 0, expand: 3.5 });
    };

    // 实时战斗冷却状态
    const combatState = { cdStrike: 0, cdSpell: 0, cdShield: 0, shieldTime: 0, petCd: 0 };

    const damageEnemy = (en, dmg, isCrit, knockDirX, knockDirZ) => {
      if (!en.alive) return;
      en.hp = Math.max(0, en.hp - dmg);
      en.hitFlash = 0.18;
      en.x = Math.max(-23, Math.min(23, en.x + knockDirX * 0.65));
      en.z = Math.max(-20, Math.min(20, en.z + knockDirZ * 0.65));
      en.sp.hpSprite.material.map = makeHpBarTexture(en.hp, en.maxHp, en.name);
      en.sp.hpSprite.material.needsUpdate = true;
      spawnFloatText(en.x, 2.4, en.z, isCrit ? `💥暴击 -${dmg}` : `-${dmg}`, isCrit ? '#ff9138' : '#ffe899');
      if (en.aiState === 'patrol') en.aiState = 'chase';

      if (en.hp <= 0) {
        en.alive = false;
        en.respawnTimer = 22.0;
        en.sp.group.visible = false;
        en.warnRing.material.opacity = 0;
        if (heroPos.attackTarget === en) heroPos.attackTarget = null;
        spawnFloatText(en.x, 2.8, en.z, `+${en.rewardStones}石 +${en.rewardExp}修为`, '#6fd3a8');
        if (opts.onEnemyKilled) opts.onEnemyKilled(en);
      }
    };

    const findNearestHostile = maxRange => {
      let best = null, bestD = maxRange || 99;
      for (let i = 0; i < hostileActors.length; i++) {
        const en = hostileActors[i];
        if (!en.alive) continue;
        const d = Math.hypot(en.x - heroPos.x, en.z - heroPos.z);
        if (d < bestD) { bestD = d; best = en; }
      }
      return best;
    };

    const castSkill = slot => {
      const rIdx = (hero && hero.realmIdx) || 0;
      const baseAtk = 20 + rIdx * 16 + ((hero && hero.bonusAtk) || 0);

      if (slot === 'strike') {
        if (combatState.cdStrike > 0) return;
        combatState.cdStrike = 0.48;
        const tg = findNearestHostile(4.2);
        const ang = tg ? Math.atan2(tg.z - heroPos.z, tg.x - heroPos.x) : (heroPos.facing > 0 ? 0 : Math.PI);
        if (tg) heroPos.facing = tg.x >= heroPos.x ? 1 : -1;
        spawnSlashVfx(heroPos.x, heroPos.z, ang);
        if (window.SFX && window.SFX.play) { try { window.SFX.play('click'); } catch {} }
        if (tg) {
          const crit = Math.random() < 0.22;
          const dmg = Math.round(baseAtk * (crit ? 1.55 : (0.9 + Math.random() * 0.25)));
          const d = Math.max(0.1, Math.hypot(tg.x - heroPos.x, tg.z - heroPos.z));
          damageEnemy(tg, dmg, crit, (tg.x - heroPos.x) / d, (tg.z - heroPos.z) / d);
          if (hero) { hero.qi = Math.min(hero.maxQi || 80, (hero.qi || 0) + 10); if (opts.onHeroStatsChange) opts.onHeroStatsChange(); }
        } else {
          spawnFloatText(heroPos.x, 2.3, heroPos.z, '剑气空挥', '#a8d4ff');
        }
        return;
      }

      if (slot === 'spell') {
        if (combatState.cdSpell > 0) { if (opts.onToast) opts.onToast(`🔥 五行雷法冷却中 (${combatState.cdSpell.toFixed(1)}s)`); return; }
        if (hero && (hero.qi || 0) < 25) { if (opts.onToast) opts.onToast('⚠️ 灵力不足 25（普攻或等待自动回气）'); return; }
        const tg = findNearestHostile(11.0);
        if (!tg) { if (opts.onToast) opts.onToast('附近 11 步内无敌怪，请往城外河边或西北走！'); return; }
        if (hero) { hero.qi = Math.max(0, (hero.qi || 0) - 25); if (opts.onHeroStatsChange) opts.onHeroStatsChange(); }
        combatState.cdSpell = 3.8;
        spawnLightningVfx(tg.x, tg.z);
        hostileActors.forEach(en => {
          if (!en.alive) return;
          const dist = Math.hypot(en.x - tg.x, en.z - tg.z);
          if (dist < 4.0) {
            const dmg = Math.round(baseAtk * 1.95);
            damageEnemy(en, dmg, true, (en.x - heroPos.x) * 0.2, (en.z - heroPos.z) * 0.2);
          }
        });
        return;
      }

      if (slot === 'shield') {
        if (combatState.cdShield > 0) { if (opts.onToast) opts.onToast(`🛡️ 玄玉灵盾冷却中 (${combatState.cdShield.toFixed(1)}s)`); return; }
        if (hero && (hero.qi || 0) < 18) { if (opts.onToast) opts.onToast('⚠️ 灵力不足 18'); return; }
        if (hero) { hero.qi = Math.max(0, (hero.qi || 0) - 18); if (opts.onHeroStatsChange) opts.onHeroStatsChange(); }
        combatState.cdShield = 8.0;
        combatState.shieldTime = 5.0;
        shieldDome.visible = true;
        spawnFloatText(heroPos.x, 2.5, heroPos.z, '🛡️ 玄玉护盾 5s', '#6fd3a8');
        return;
      }

      if (slot === 'pill') {
        if (opts.onUseQuickPill) {
          const ok = opts.onUseQuickPill();
          if (ok) spawnFloatText(heroPos.x, 2.5, heroPos.z, '💊 吞丹回血+气!', '#6fd3a8');
        }
      }
    };

    // 碰撞检测
    const isBlocked = (nx, nz) => {
      if (heroPos.flying) return false;
      if (nz > 9.3 && nz < 12.9) {
        const onBridge = (nx > -2.3 && nx < 2.3) || (nx > 11.6 && nx < 14.4);
        if (!onBridge) return true;
      }
      for (let i = 0; i < colliders.length; i++) {
        const c = colliders[i];
        if (nx > c.minX && nx < c.maxX && nz > c.minZ && nz < c.maxZ) return true;
      }
      return false;
    };

    const clickRing = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.52, 24),
      new THREE.MeshBasicMaterial({ color: 0x6fd3a8, side: THREE.DoubleSide, transparent: true, opacity: 0 })
    );
    clickRing.rotateX(-Math.PI / 2); scene.add(clickRing);
    let clickRingLife = 0;

    const pCol = plate.biome === 'ice' ? 0xe8f6ff : (plate.biome === 'volcano' ? 0xff7b42 : 0xaef7d8);
    const pGeo = new THREE.BufferGeometry();
    const pArr = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) { pArr[i * 3] = (Math.random() - 0.5) * MAP_W; pArr[i * 3 + 1] = 0.5 + Math.random() * 7; pArr[i * 3 + 2] = (Math.random() - 0.5) * MAP_H; }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: pCol, size: 0.16, transparent: true, opacity: 0.72 }));
    scene.add(particles);

    const camState = { yaw: 0, pitch: 0.56, dist: 14.5, cx: heroPos.x, cz: heroPos.z };
    const updateCam = () => {
      camera.position.set(
        camState.cx + Math.sin(camState.yaw) * Math.cos(camState.pitch) * camState.dist,
        Math.sin(camState.pitch) * camState.dist + 1.1,
        camState.cz + Math.cos(camState.yaw) * Math.cos(camState.pitch) * camState.dist
      );
      camera.lookAt(camState.cx, 1.0, camState.cz);
    };
    updateCam();

    let timeMode = 'day';
    const applyTimeOfDay = mode => {
      timeMode = mode;
      if (mode === 'day') {
        scene.background.setHex(baseSky); scene.fog.color.setHex(baseSky);
        ambient.color.setHex(0xb8cbe0); ambient.intensity = 0.88;
        sun.color.setHex(0xffe6bd); sun.intensity = 1.15; sun.position.set(16, 28, 18);
        nightLights.forEach(pl => { pl.intensity = 0.25; });
      } else if (mode === 'dusk') {
        scene.background.setHex(0x2b191c); scene.fog.color.setHex(0x2b191c);
        ambient.color.setHex(0xd4967a); ambient.intensity = 0.65;
        sun.color.setHex(0xff8a47); sun.intensity = 1.25; sun.position.set(-28, 11, 14);
        nightLights.forEach(pl => { pl.intensity = 1.15; });
      } else {
        scene.background.setHex(0x060b16); scene.fog.color.setHex(0x060b16);
        ambient.color.setHex(0x4c6b99); ambient.intensity = 0.42;
        sun.color.setHex(0x7aa4e0); sun.intensity = 0.45; sun.position.set(-14, 24, -16);
        nightLights.forEach(pl => { pl.intensity = 2.1; });
      }
    };
    applyTimeOfDay('day');

    const keys = {};
    const joyVec = { x: 0, z: 0 };
    let nearbyTarget = null, pendingInteract = null;

    const onKeyDown = e => {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      const k = e.key.toLowerCase();
      keys[k] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (k === ' ') {
        heroPos.flying = !heroPos.flying;
        swordMesh.visible = heroPos.flying;
        if (opts.onFlyToggle) opts.onFlyToggle(heroPos.flying);
      }
      if (k === 'e' && nearbyTarget && opts.onInteract) opts.onInteract(nearbyTarget);
      if (k === 'f' || k === '1') castSkill('strike');
      if (k === '2') castSkill('spell');
      if (k === '3') castSkill('shield');
      if (k === '4') castSkill('pill');
    };
    const onKeyUp = e => { keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const dom = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let rDrag = false, moved = false, lx = 0, ly = 0;

    const onPointerDown = e => { lx = e.clientX; ly = e.clientY; moved = false; if (e.button === 2 || e.shiftKey) rDrag = true; };
    const onPointerMove = e => {
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      lx = e.clientX; ly = e.clientY;
      if (rDrag) {
        camState.yaw -= dx * 0.0065;
        camState.pitch = Math.max(0.32, Math.min(1.15, camState.pitch + dy * 0.005));
      }
    };
    const onPointerUp = () => { rDrag = false; };
    const onContextMenu = e => e.preventDefault();
    const onWheel = e => { e.preventDefault(); camState.dist = Math.max(8, Math.min(28, camState.dist + e.deltaY * 0.015)); };
    const onClick = e => {
      if (moved || e.button !== 0) return;
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hitEnt = raycaster.intersectObjects(clickMeshes);
      if (hitEnt.length) {
        const ud = hitEnt[0].object.userData;
        // 饥荒风：左键直接点击敌怪 → 走过去挥剑即时斩杀！
        if (ud.hostileRef && ud.hostileRef.alive) {
          const en = ud.hostileRef;
          if (Math.hypot(en.x - heroPos.x, en.z - heroPos.z) < 3.6) {
            castSkill('strike');
          } else {
            heroPos.attackTarget = en; heroPos.tx = null; heroPos.tz = null;
            clickRing.position.set(en.x, 0.08, en.z); clickRingLife = 1.0;
          }
          return;
        }
        const tg = interactables[ud.interactIdx];
        if (tg) {
          heroPos.attackTarget = null;
          if (Math.hypot(tg.x - heroPos.x, tg.z - heroPos.z) < 3.6 && opts.onInteract) opts.onInteract(tg);
          else { heroPos.tx = tg.x; heroPos.tz = tg.z; pendingInteract = tg; clickRing.position.set(tg.x, 0.08, tg.z); clickRingLife = 1.0; }
          return;
        }
      }
      const hitG = raycaster.intersectObject(ground);
      if (hitG.length) {
        const pt = hitG[0].point;
        heroPos.attackTarget = null;
        heroPos.tx = Math.max(-23, Math.min(23, pt.x));
        heroPos.tz = Math.max(-20, Math.min(20, pt.z));
        pendingInteract = null;
        clickRing.position.set(heroPos.tx, 0.08, heroPos.tz); clickRingLife = 1.0;
      }
    };
    const onResize = () => {
      if (!state) return;
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);

    const tryMoveHero = (dx, dz) => {
      const nx = Math.max(-23, Math.min(23, heroPos.x + dx));
      const nz = Math.max(-20, Math.min(20, heroPos.z + dz));
      let movedAny = false;
      if (!isBlocked(nx, heroPos.z)) { heroPos.x = nx; movedAny = true; }
      if (!isBlocked(heroPos.x, nz)) { heroPos.z = nz; movedAny = true; }
      return movedAny;
    };

    let lastTime = performance.now(), t = 0, proxTick = 0, bubbleTick = 0, regenTick = 0;
    const animate = now => {
      if (!state) return;
      state.raf = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now; t += dt;

      // 冷却与护盾衰减
      if (combatState.cdStrike > 0) combatState.cdStrike = Math.max(0, combatState.cdStrike - dt);
      if (combatState.cdSpell > 0) combatState.cdSpell = Math.max(0, combatState.cdSpell - dt);
      if (combatState.cdShield > 0) combatState.cdShield = Math.max(0, combatState.cdShield - dt);
      if (combatState.shieldTime > 0) {
        combatState.shieldTime -= dt;
        shieldDome.rotation.y = t * 1.8;
        if (combatState.shieldTime <= 0) shieldDome.visible = false;
      }

      // 灵力自然回复 + 灵宠自动协战
      regenTick += dt;
      if (regenTick >= 1.0 && hero) {
        regenTick = 0;
        if ((hero.qi || 0) < (hero.maxQi || 80)) {
          hero.qi = Math.min(hero.maxQi || 80, (hero.qi || 0) + 4);
          if (opts.onHeroStatsChange) opts.onHeroStatsChange();
        }
        // 伴生灵宠自动协战
        if (hero.pets && hero.pets.length > 0) {
          const nearEn = findNearestHostile(6.5);
          if (nearEn && nearEn.aiState !== 'patrol') {
            const pDmg = Math.round(12 + (hero.realmIdx || 0) * 8);
            damageEnemy(nearEn, pDmg, false, 0, 0);
            spawnFloatText(nearEn.x, 3.0, nearEn.z, `🐾灵宠 -${pDmg}`, '#9ff2cf');
          }
        }
      }

      // 主角移动
      let ix = joyVec.x, iz = joyVec.z;
      if (keys.w || keys.arrowup) iz -= 1;
      if (keys.s || keys.arrowdown) iz += 1;
      if (keys.a || keys.arrowleft) ix -= 1;
      if (keys.d || keys.arrowright) ix += 1;

      const speed = heroPos.flying ? 11.5 : 6.2;
      let moving = false;

      if (Math.abs(ix) > 0.05 || Math.abs(iz) > 0.05) {
        heroPos.tx = null; heroPos.tz = null; pendingInteract = null; heroPos.attackTarget = null;
        const len = Math.hypot(ix, iz); ix /= len; iz /= len;
        const cosY = Math.cos(camState.yaw), sinY = Math.sin(camState.yaw);
        const wx = ix * cosY + iz * sinY, wz = -ix * sinY + iz * cosY;
        moving = tryMoveHero(wx * speed * dt, wz * speed * dt);
        if (Math.abs(wx) > 0.1) heroPos.facing = wx > 0 ? 1 : -1;
      } else if (heroPos.attackTarget && heroPos.attackTarget.alive) {
        const en = heroPos.attackTarget;
        const dx = en.x - heroPos.x, dz = en.z - heroPos.z, d = Math.hypot(dx, dz);
        if (d < 2.9) {
          castSkill('strike');
        } else {
          const step = Math.min(d, speed * dt);
          moving = tryMoveHero((dx / d) * step, (dz / d) * step);
          if (Math.abs(dx) > 0.05) heroPos.facing = dx > 0 ? 1 : -1;
        }
      } else if (heroPos.tx !== null && heroPos.tz !== null) {
        const dx = heroPos.tx - heroPos.x, dz = heroPos.tz - heroPos.z, d = Math.hypot(dx, dz);
        if (d < (pendingInteract ? 2.6 : 0.28)) {
          heroPos.tx = null; heroPos.tz = null;
          if (pendingInteract && opts.onInteract) { const tg = pendingInteract; pendingInteract = null; opts.onInteract(tg); }
        } else {
          const step = Math.min(d, speed * dt);
          const ok = tryMoveHero((dx / d) * step, (dz / d) * step);
          moving = ok;
          if (!ok) { heroPos.tx = null; heroPos.tz = null; pendingInteract = null; }
          if (Math.abs(dx) > 0.05) heroPos.facing = dx > 0 ? 1 : -1;
        }
      }

      const hover = heroPos.flying ? (1.0 + Math.sin(t * 4.5) * 0.12) : 0;
      if (moving) heroPos.walkPhase += dt * (heroPos.flying ? 6 : 13);
      const bob = (!heroPos.flying && moving) ? Math.abs(Math.sin(heroPos.walkPhase)) * 0.16 : 0;
      heroActor.group.position.set(heroPos.x, 0, heroPos.z);
      heroActor.body.position.y = 1.1 + hover + bob;
      heroActor.body.scale.x = 1.55 * heroPos.facing;
      swordMesh.position.y = 0.15 + hover;

      camState.cx += (heroPos.x - camState.cx) * Math.min(1, dt * 7.5);
      camState.cz += (heroPos.z - camState.cz) * Math.min(1, dt * 7.5);
      updateCam();

      if (clickRingLife > 0) {
        clickRingLife -= dt * 1.5;
        clickRing.material.opacity = Math.max(0, clickRingLife * 0.9);
        const sc = 1 + (1 - clickRingLife) * 1.4;
        clickRing.scale.set(sc, sc, 1);
      }

      // ===== 饥荒风敌怪实时 AI（巡逻 → 仇恨追击 → 红圈前摇蓄力 → 扑击判定 → 硬直喘息） =====
      hostileActors.forEach(en => {
        if (!en.alive) {
          en.respawnTimer -= dt;
          if (en.respawnTimer <= 0) {
            en.alive = true; en.hp = en.maxHp; en.x = en.homeX; en.z = en.homeZ;
            en.aiState = 'patrol'; en.sp.group.visible = true;
            en.sp.hpSprite.material.map = makeHpBarTexture(en.hp, en.maxHp, en.name);
            en.sp.hpSprite.material.needsUpdate = true;
          }
          return;
        }
        if (en.hitFlash > 0) {
          en.hitFlash -= dt;
          en.sp.body.material.color.setHex(en.hitFlash > 0 ? 0xff6666 : 0xffffff);
        }

        const dHero = Math.hypot(heroPos.x - en.x, heroPos.z - en.z);
        const dHome = Math.hypot(en.x - en.homeX, en.z - en.homeZ);

        if (en.aiState === 'patrol') {
          en.warnRing.material.opacity = 0;
          if (dHero < 6.4 && !heroPos.flying) {
            en.aiState = 'chase';
            spawnFloatText(en.x, 2.5, en.z, '❗ 发现猎物', '#ff7b72');
          } else {
            en.aiTimer -= dt;
            if (en.aiTimer <= 0) {
              en.aiTimer = 2.0 + Math.random() * 2.5;
              en.tx = en.homeX + (Math.random() - 0.5) * 6;
              en.tz = en.homeZ + (Math.random() - 0.5) * 5;
            }
            const dx = en.tx - en.x, dz = en.tz - en.z, d = Math.hypot(dx, dz);
            if (d > 0.3) { en.x += (dx / d) * 1.5 * dt; en.z += (dz / d) * 1.5 * dt; }
          }
        } else if (en.aiState === 'chase') {
          en.warnRing.material.opacity = 0;
          if (dHero > 12.0 || dHome > 13.5 || heroPos.flying) {
            en.aiState = 'patrol';
          } else if (dHero < 2.35) {
            // 进入攻击范围：开始饥荒式 0.68s 红圈前摇！（此时走位远离即可躲开！）
            en.aiState = 'windup';
            en.aiTimer = 0.68;
          } else {
            en.x += ((heroPos.x - en.x) / dHero) * en.speed * dt;
            en.z += ((heroPos.z - en.z) / dHero) * en.speed * dt;
          }
        } else if (en.aiState === 'windup') {
          en.aiTimer -= dt;
          const p = 1 - Math.max(0, en.aiTimer / 0.68);
          en.warnRing.material.opacity = 0.3 + p * 0.55;
          en.warnRing.scale.setScalar(0.55 + p * 0.55);
          if (en.aiTimer <= 0) {
            en.warnRing.material.opacity = 0;
            // 判定主角是否仍在红圈扑击半径(2.55)内
            if (dHero < 2.55 && !heroPos.flying) {
              const reduce = combatState.shieldTime > 0 ? 0.38 : 1.0;
              const dmg = Math.max(2, Math.round(en.atk * reduce));
              if (hero) {
                hero.hp = Math.max(0, (hero.hp || 120) - dmg);
                spawnFloatText(heroPos.x, 2.5, heroPos.z, combatState.shieldTime > 0 ? `🛡️格挡 -${dmg}` : `🩸-${dmg}`, '#ff6b63');
                if (hero.hp <= 0) {
                  // 保命遁符自动回城，不弹僵硬 Game Over
                  hero.hp = Math.max(20, Math.round((hero.maxHp || 120) * 0.25));
                  heroPos.x = 0; heroPos.z = 1.5; heroPos.tx = null; heroPos.tz = null; heroPos.attackTarget = null;
                  if (opts.onHeroDefeated) opts.onHeroDefeated(en);
                }
                if (opts.onHeroStatsChange) opts.onHeroStatsChange();
              }
            } else {
              spawnFloatText(heroPos.x, 2.4, heroPos.z, '💨 MISS 闪避!', '#9ff2cf');
            }
            en.aiState = 'recover';
            en.aiTimer = 0.95; // 饥荒式攻击后硬直，绝佳反击窗口！
          }
        } else if (en.aiState === 'recover') {
          en.aiTimer -= dt;
          if (en.aiTimer <= 0) en.aiState = 'chase';
        }
        en.sp.group.position.set(en.x, 0, en.z);
      });

      // 更新 3D 特效与浮空字
      for (let i = vfxList.length - 1; i >= 0; i--) {
        const v = vfxList[i];
        v.life -= dt;
        if (v.life <= 0) {
          scene.remove(v.mesh);
          vfxList.splice(i, 1);
          continue;
        }
        v.mesh.position.y += v.vy * dt;
        if (v.expand) {
          const s = Math.max(0.1, 1 + (1 - v.life / v.maxLife) * v.expand);
          v.mesh.scale.set(s, s, 1);
        }
        v.mesh.material.opacity = Math.max(0, v.life / v.maxLife);
      }

      // NPC 散步 & 气泡
      bubbleTick += dt;
      if (bubbleTick >= 3.6 && npcActors.length) {
        bubbleTick = 0;
        const pick = npcActors[Math.floor(Math.random() * npcActors.length)];
        const line = ambientLines[Math.floor(Math.random() * ambientLines.length)];
        pick.sp.bubbleSp.material.map = makeBubbleTexture(line);
        pick.sp.bubbleSp.material.needsUpdate = true;
        pick.bubbleLife = 3.2;
      }
      npcActors.forEach(a => {
        if (a.bubbleLife > 0) { a.bubbleLife -= dt; a.sp.bubbleSp.material.opacity = Math.min(1, a.bubbleLife * 1.5); }
        else a.sp.bubbleSp.material.opacity = 0;
        if (a.wait > 0) {
          a.wait -= dt;
          if (a.wait <= 0) { a.tx = Math.max(-16, Math.min(16, a.homeX + (Math.random() - 0.5) * 8)); a.tz = Math.max(-8, Math.min(7, a.homeZ + (Math.random() - 0.5) * 7)); }
        } else {
          const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
          if (d < 0.3) a.wait = 1.5 + Math.random() * 3;
          else {
            const nx = a.x + (dx / d) * a.speed * dt, nz = a.z + (dz / d) * a.speed * dt;
            let hit = false;
            for (let i = 0; i < colliders.length; i++) { const c = colliders[i]; if (nx > c.minX && nx < c.maxX && nz > c.minZ && nz < c.maxZ) { hit = true; break; } }
            if (hit) a.wait = 1.2;
            else { a.x = nx; a.z = nz; a.phase += dt * 8; a.sp.body.position.y = 0.98 + Math.abs(Math.sin(a.phase)) * 0.09; }
          }
        }
        a.sp.group.position.set(a.x, 0, a.z);
        if (a.entry) { a.entry.x = a.x; a.entry.z = a.z; }
      });

      crystal.rotation.y = t * 1.4;
      medRing.rotation.z = t * 0.8;
      particles.rotation.y = t * 0.03;

      proxTick += dt;
      if (proxTick >= 0.1) {
        proxTick = 0;
        let bestT = null, bestD = 3.5;
        for (let i = 0; i < interactables.length; i++) {
          const it = interactables[i];
          const d = Math.hypot(it.x - heroPos.x, it.z - heroPos.z);
          if (d < bestD) { bestD = d; bestT = it; }
        }
        if (bestT !== nearbyTarget) {
          nearbyTarget = bestT;
          if (opts.onNearbyChange) opts.onNearbyChange(bestT);
        }
      }

      renderer.render(scene, camera);
    };

    const cleanup = () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
    };

    state = {
      renderer, scene, camera, raf: null, cleanup,
      heroPos, swordMesh, joyVec, opts, plate, MAP_W, MAP_H,
      buildingsForMini, npcActors, hostileActors, applyTimeOfDay, castSkill,
      getTimeMode: () => timeMode,
      getNearby: () => nearbyTarget
    };
    animate(performance.now());
    return true;
  }

  function toggleFly() {
    if (!state) return false;
    state.heroPos.flying = !state.heroPos.flying;
    state.swordMesh.visible = state.heroPos.flying;
    if (state.opts && state.opts.onFlyToggle) state.opts.onFlyToggle(state.heroPos.flying);
    return state.heroPos.flying;
  }

  function setJoystick(vx, vz) { if (state) { state.joyVec.x = vx; state.joyVec.z = vz; } }
  function triggerInteract() { if (state && state.getNearby() && state.opts.onInteract) state.opts.onInteract(state.getNearby()); }
  function walkTo(x, z) { if (state) { state.heroPos.attackTarget = null; state.heroPos.tx = Math.max(-23, Math.min(23, x)); state.heroPos.tz = Math.max(-20, Math.min(20, z)); } }
  function castSkill(slot) { if (state && state.castSkill) state.castSkill(slot); }
  function cycleTimeOfDay() {
    if (!state) return 'day';
    const order = ['day', 'dusk', 'night'];
    const next = order[(order.indexOf(state.getTimeMode()) + 1) % order.length];
    state.applyTimeOfDay(next);
    return next;
  }

  function getMinimapData() {
    if (!state) return null;
    return {
      mode: 'local',
      title: state.plate.name,
      w: state.MAP_W, h: state.MAP_H,
      hero: { x: state.heroPos.x, z: state.heroPos.z },
      pois: state.buildingsForMini,
      npcs: state.npcActors.map(a => ({ x: a.x, z: a.z })),
      beasts: state.hostileActors.filter(b => b.alive).map(b => ({ x: b.x, z: b.z }))
    };
  }

  const LocalMap3D = { mount, dispose, toggleFly, setJoystick, triggerInteract, walkTo, castSkill, cycleTimeOfDay, getMinimapData };
  if (typeof module !== 'undefined' && module.exports) module.exports = LocalMap3D;
  root.LocalMap3D = LocalMap3D;
})(typeof window !== 'undefined' ? window : globalThis);
