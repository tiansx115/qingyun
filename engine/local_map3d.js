/* ============================================================================
 * 《沧溟界》v9.1.0 正常视角 HD-2D 局部城镇/宗门/野外实景地图引擎 (engine/local_map3d.js)
 * ----------------------------------------------------------------------------
 * - 正常人体比例的 HD-2D 斜45° 实景视角（参考《八方旅人》/《大侠立志传》）
 * - 根据所在板块的气候、灵脉、主导宗门、涌现制度、暗森指数、真实遗迹动态生成街道建筑：
 *   青石主街、流水灵溪与木桥、宗门大殿、坊市商铺、茶馆酒楼、黑市暗巷、城外采药林与遗迹石门、城门出口
 * - 街上走动的真实 NPC 修士、杂役弟子、商贩、城外游荡妖兽，走近按 E 实时交互
 * - 提供实时小地图雷达数据接口 getMinimapData()
 * ============================================================================ */
(function (root) {
  'use strict';

  let state = null;

  function makeGroundTexture(biome) {
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 1024;
    const ctx = cv.getContext('2d');

    // 地貌底色
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

    // 自然地皮斑块纹理
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = i % 2 === 0 ? pal.grass : 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.arc((i * 197) % 1024, (i * 353) % 1024, 12 + (i % 28), 0, Math.PI * 2);
      ctx.fill();
    }

    // 灵溪水道（穿过地图中下部）
    ctx.fillStyle = pal.water;
    ctx.beginPath();
    ctx.moveTo(0, 710);
    ctx.bezierCurveTo(320, 660, 700, 760, 1024, 700);
    ctx.lineTo(1024, 795);
    ctx.bezierCurveTo(700, 855, 320, 755, 0, 805);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 青石板十字主干道 + 中央广场
    const drawStoneRoad = (x, y, w, h) => {
      ctx.fillStyle = pal.road;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1.5;
      for (let gx = x; gx < x + w; gx += 28) {
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
      }
      for (let gy = y; gy < y + h; gy += 28) {
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
      }
    };
    drawStoneRoad(452, 80, 120, 880);   // 南北中轴大街（通往北侧宗门大殿 & 南侧城门出口）
    drawStoneRoad(90, 440, 844, 108);  // 东西坊市主街
    // 中央八角广场
    ctx.fillStyle = pal.road;
    ctx.beginPath(); ctx.arc(512, 494, 118, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d4b87a'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = 'rgba(212,184,122,0.45)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(512, 494, 86, 0, Math.PI * 2); ctx.stroke();

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

  // 构建正常人体比例的 3D 中式古建筑（青瓦飞檐 + 红柱暖窗 + 灯笼）
  function buildChineseBuilding(w, h, d, roofHex, wallHex, hasLanterns) {
    const g = new THREE.Group();
    // 石阶底座
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.7, 0.35, d + 0.7),
      new THREE.MeshStandardMaterial({ color: 0x6e6c66, roughness: 0.9 })
    );
    base.position.y = 0.175;
    g.add(base);

    // 墙体
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: wallHex || 0xd6ccb8, roughness: 0.8 })
    );
    body.position.y = 0.35 + h / 2;
    g.add(body);

    // 朱红廊柱（四角）
    const pMat = new THREE.MeshStandardMaterial({ color: 0x8c2822, roughness: 0.6 });
    const pGeo = new THREE.CylinderGeometry(0.11, 0.12, h, 8);
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => {
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(sx * (w / 2 - 0.1), 0.35 + h / 2, sz * (d / 2 + 0.08));
      g.add(p);
    });

    // 暖光木门窗
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, Math.min(1.65, h * 0.75)),
      new THREE.MeshBasicMaterial({ color: 0xffe09c })
    );
    door.position.set(0, 0.35 + Math.min(1.65, h * 0.75) / 2, d / 2 + 0.02);
    g.add(door);

    // 黛瓦庑殿顶
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(w, d) * 0.82, 1.55, 4),
      new THREE.MeshStandardMaterial({ color: roofHex || 0x263c4d, roughness: 0.55, metalness: 0.2 })
    );
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(w / Math.max(w, d) * 1.15, 1, d / Math.max(w, d) * 1.15);
    roof.position.y = 0.35 + h + 0.72;
    g.add(roof);

    // 屋檐红灯笼
    if (hasLanterns) {
      const lMat = new THREE.MeshBasicMaterial({ color: 0xff6b42 });
      const lGeo = new THREE.SphereGeometry(0.18, 8, 8);
      [-w * 0.32, w * 0.32].forEach(lx => {
        const lan = new THREE.Mesh(lGeo, lMat);
        lan.position.set(lx, 0.35 + h - 0.18, d / 2 + 0.35);
        g.add(lan);
      });
    }
    return g;
  }

  // 构建 3D 山门牌坊（城门出口）
  function buildArchway() {
    const g = new THREE.Group();
    const pMat = new THREE.MeshStandardMaterial({ color: 0x7d2922, roughness: 0.6 });
    const rMat = new THREE.MeshStandardMaterial({ color: 0x22384a, roughness: 0.5 });
    [-1.8, 1.8].forEach(px => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.4, 8), pMat);
      col.position.set(px, 1.7, 0);
      g.add(col);
    });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.45, 0.5), pMat);
    beam.position.set(0, 3.1, 0);
    g.add(beam);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.35, 1.2), rMat);
    roof.position.set(0, 3.55, 0);
    g.add(roof);
    return g;
  }

  // 构建正常人体比例 HD-2D 人物（主角 / NPC / 妖兽）
  function makeHumanSprite(imgUrl, name, sub, tintHex, scaleW, scaleH) {
    const group = new THREE.Group();
    const sh = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })
    );
    sh.rotateX(-Math.PI / 2);
    sh.position.y = 0.03;
    group.add(sh);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.56, 24),
      new THREE.MeshBasicMaterial({ color: tintHex, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    ring.rotateX(-Math.PI / 2);
    ring.position.y = 0.05;
    group.add(ring);

    const cv = document.createElement('canvas');
    cv.width = 160; cv.height = 220;
    const ctx = cv.getContext('2d');
    const hexStr = '#' + tintHex.toString(16).padStart(6, '0');
    ctx.fillStyle = hexStr;
    ctx.beginPath(); ctx.moveTo(80, 62); ctx.lineTo(126, 205); ctx.lineTo(34, 205); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f5dec2';
    ctx.beginPath(); ctx.arc(80, 44, 22, 0, Math.PI * 2); ctx.fill();
    const charTex = new THREE.CanvasTexture(cv);

    if (imgUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, 160, 220);
        ctx.save();
        ctx.beginPath(); ctx.roundRect(14, 14, 132, 192, 66); ctx.clip();
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

    if (name) {
      const np = new THREE.Sprite(new THREE.SpriteMaterial({ map: makePlaque(name, sub, hexStr), transparent: true, depthTest: false }));
      np.scale.set(2.4, 0.75, 1);
      np.position.y = (scaleH || 2.05) + 0.52;
      group.add(np);
    }
    return { group, body, ring };
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
    const skyMap = { ice: 0x162436, volcano: 0x26120e, wood: 0x0e1d1c, island: 0x15142b };
    const skyCol = skyMap[plate.biome] || 0x101c28;
    scene.background = new THREE.Color(skyCol);
    scene.fog = new THREE.FogExp2(skyCol, 0.015);

    // 正常人体比例 HD-2D 镜头
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.3, 140);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 暖昼仙侠光照
    scene.add(new THREE.AmbientLight(0xb8cbe0, 0.85));
    const sun = new THREE.DirectionalLight(0xffe6bd, 1.15);
    sun.position.set(16, 28, 18);
    scene.add(sun);

    // 1. 地面（52 × 46 正常比例城镇/山门/野外一体化场景）
    const MAP_W = 52, MAP_H = 46;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_W, MAP_H),
      new THREE.MeshStandardMaterial({ map: makeGroundTexture(plate.biome), roughness: 0.92 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 跨越灵溪的拱桥（中轴线 z ≈ 11）
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.32, 6.2),
      new THREE.MeshStandardMaterial({ color: 0x855a3c, roughness: 0.8 })
    );
    bridge.position.set(0, 0.2, 11.2);
    scene.add(bridge);
    [-2.05, 2.05].forEach(bx => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.55, 6.2),
        new THREE.MeshStandardMaterial({ color: 0x6e261f, roughness: 0.7 })
      );
      rail.position.set(bx, 0.58, 11.2);
      scene.add(rail);
    });

    // 2. 场景建筑群 & 交互实体池
    const interactables = [];
    const clickMeshes = [];
    const buildingsForMini = [];

    const addBuildingPoi = (x, z, w, h, d, roofHex, wallHex, title, sub, type, data, borderCol) => {
      const b = buildChineseBuilding(w, h, d, roofHex, wallHex, true);
      b.position.set(x, 0, z);
      scene.add(b);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makePlaque(title, sub, borderCol || '#d4b87a'), transparent: true, depthTest: false }));
      sp.scale.set(3.2, 1.0, 1);
      sp.position.set(x, h + 2.7, z);
      sp.userData = { interactIdx: interactables.length };
      scene.add(sp);
      clickMeshes.push(sp);
      buildingsForMini.push({ x, z, label: title, type });
      interactables.push({ type, id: type + '_' + x, label: `进入【${title}】`, sub, x, z: z + d / 2 + 1.1, obj: sp, data });
    };

    const mainFac = (plate.holdings && plate.holdings.length)
      ? world.factions.find(f => f.id === plate.holdings[0].factionId)
      : null;
    const localInsts = (world.institutions || []).filter(i => i.plateId === plate.id);
    const localRuins = (world.ruins || []).filter(r => r.plateId === plate.id);

    // 北侧主建筑：主导宗门大殿（或无主古祠）
    addBuildingPoi(
      0, -14.5, 7.2, 3.2, 4.6, 0x1d4d4f, 0xd8cbb4,
      mainFac ? `${mainFac.name}·主殿` : `${plate.name}·仙盟议事堂`,
      mainFac ? `掌门:${mainFac.leader} · 占${plate.holdings[0].share}%` : '无主之地 · 可开宗立派',
      'sect_hall', { plate, fac: mainFac }, '#6fd3a8'
    );

    // 西侧坊市：拍卖行 / 集镇商铺
    addBuildingPoi(
      -12.5, -3.8, 5.4, 2.6, 4.0, 0x3b3552, 0xd9ceba,
      localInsts.length ? localInsts[0].name : `${plate.name}·万宝坊市`,
      `丹×${plate.priceIndex.pill} 矿×${plate.priceIndex.mineral} · 交易/竞拍`,
      'market', { plate, inst: localInsts[0] || null }, '#70b8f0'
    );

    // 东侧酒楼：仙缘茶馆
    addBuildingPoi(
      12.5, -3.8, 5.2, 2.5, 3.8, 0x5c3424, 0xdfd3be,
      '仙缘茶馆·听书楼',
      '打听本世界真实史话与秘境风声',
      'teahouse', { plate }, '#f2daa0'
    );

    // 西南角：黑市暗巷（高暗森或常设地下黑市）
    addBuildingPoi(
      -14.5, 5.2, 4.2, 2.1, 3.4, 0x231d29, 0x615966,
      '幽影黑市暗巷',
      `暗森指数 ${plate.darkForestIdx || 0} · 销赃/情报/易容`,
      'black_market', { plate }, '#e06258'
    );

    // 城外东北角：野生灵脉采药区（发光灵晶）
    const gx = 16.5, gz = -13.0;
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.65, 0),
      new THREE.MeshStandardMaterial({ color: 0x6fd3a8, emissive: 0x268560, emissiveIntensity: 0.75 })
    );
    crystal.position.set(gx, 0.9, gz);
    crystal.userData = { interactIdx: interactables.length };
    scene.add(crystal);
    clickMeshes.push(crystal);
    const gSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makePlaque('🌿 野生灵脉草丛', `灵脉${plate.leyline} · 按E采集`, '#6fd3a8'), transparent: true, depthTest: false }));
    gSp.scale.set(2.8, 0.85, 1); gSp.position.set(gx, 2.3, gz);
    scene.add(gSp);
    buildingsForMini.push({ x: gx, z: gz, label: '灵草', type: 'gather' });
    interactables.push({ type: 'gather', id: 'local_gather', label: `采集【${plate.name}灵草】`, sub: `灵脉${plate.leyline}`, x: gx, z: gz, obj: crystal, data: plate });

    // 城外西北角：若本板块有真实遗迹，生成古修石门！
    if (localRuins.length) {
      const r = localRuins[0];
      const rx = -16.5, rz = -13.5;
      const mono = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 3.2, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x384859, emissive: 0x1d3b4d, emissiveIntensity: 0.6 })
      );
      mono.position.set(rx, 1.6, rz);
      mono.userData = { interactIdx: interactables.length };
      scene.add(mono);
      clickMeshes.push(mono);
      const rSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makePlaque('🗝️ 古修遗迹入口', r.name.slice(0, 10), '#f7d070'), transparent: true, depthTest: false }));
      rSp.scale.set(3.0, 0.9, 1); rSp.position.set(rx, 4.1, rz);
      scene.add(rSp);
      buildingsForMini.push({ x: rx, z: rz, label: '遗迹', type: 'ruin' });
      interactables.push({ type: 'ruin', id: r.id, label: `闯入古遗迹【${r.name}】`, sub: `阵法${r.sealStrength}`, x: rx, z: rz + 1.2, obj: rSp, data: r });
    }

    // 南侧正中：山门牌坊（离开本地，前往五洲七海大洲地图！）
    const arch = buildArchway();
    arch.position.set(0, 0, 18.8);
    scene.add(arch);
    const exSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makePlaque('🚪 城门·出城远行', '前往五洲七海大洲地图', '#f2daa0'), transparent: true, depthTest: false }));
    exSp.scale.set(3.4, 1.05, 1);
    exSp.position.set(0, 4.6, 18.8);
    exSp.userData = { interactIdx: interactables.length };
    scene.add(exSp);
    clickMeshes.push(exSp);
    buildingsForMini.push({ x: 0, z: 18.8, label: '城门', type: 'exit' });
    interactables.push({ type: 'exit_world', id: 'exit_gate', label: '走出城门 · 前往【五洲七海大洲地图】', sub: '跨洲御剑 / 游历天下', x: 0, z: 17.5, obj: exSp, data: plate });

    // 3. 周边装饰古松 / 灵树 / 灯柱（营造正常视角的街道沉浸感）
    const trMat = new THREE.MeshStandardMaterial({ color: 0x4d3726, roughness: 0.9 });
    const lfMat = new THREE.MeshStandardMaterial({ color: plate.biome === 'ice' ? 0xc0d9eb : (plate.biome === 'volcano' ? 0x6b3a28 : 0x265c41), flatShading: true });
    const trGeo = new THREE.CylinderGeometry(0.14, 0.2, 1.1, 6);
    const lfGeo = new THREE.ConeGeometry(0.95, 2.3, 6);
    const treeSpots = [
      [-21,-17],[-19,-8],[-21,2],[-20,14],[-9,-17],[9,-17],
      [21,-16],[20,-6],[21,4],[19,15],[-7,6],[7,6],[-10,16],[10,16]
    ];
    treeSpots.forEach(([tx, tz]) => {
      const tg = new THREE.Group();
      const tr = new THREE.Mesh(trGeo, trMat); tr.position.y = 0.55;
      const lf = new THREE.Mesh(lfGeo, lfMat); lf.position.y = 2.0;
      tg.add(tr); tg.add(lf);
      tg.position.set(tx, 0, tz);
      scene.add(tg);
    });

    // 4. 本地街道上真实走动的 NPC（本板块真实修士 + 本地杂役/商贩）
    const npcActors = [];
    const localAgents = (world.agents || []).filter(a => a.alive && a.locId === plate.id);
    const fallbackAgents = (world.agents || []).filter(a => a.alive).slice(0, 5);
    const showAgents = (localAgents.length >= 3 ? localAgents : localAgents.concat(fallbackAgents)).slice(0, 8);
    const portraits = ['assets/chars/sister_full.webp', 'assets/chars/elder.webp', 'assets/chars/hero.webp'];

    showAgents.forEach((ag, idx) => {
      const sx = -9 + (idx % 4) * 6 + (Math.random() - 0.5) * 2;
      const sz = -6 + Math.floor(idx / 4) * 9 + (Math.random() - 0.5) * 2;
      const fac = ag.factionId ? world.factions.find(f => f.id === ag.factionId) : null;
      const sp = makeHumanSprite(
        portraits[idx % portraits.length],
        ag.name,
        `${ag.realm}·${fac ? fac.name.slice(0, 4) : '散修'}`,
        ag.factionId ? 0x70b8f0 : 0xd4b87a, 1.35, 1.9
      );
      sp.group.position.set(sx, 0, sz);
      sp.body.userData = { interactIdx: interactables.length };
      scene.add(sp.group);
      clickMeshes.push(sp.body);
      const entry = {
        type: 'npc', id: ag.id, label: `与【${ag.name}】交谈`,
        sub: `${ag.realm} · ${fac ? fac.name : '散修'}`,
        x: sx, z: sz, obj: sp.group, data: ag
      };
      interactables.push(entry);
      npcActors.push({
        sp, entry, homeX: sx, homeZ: sz, x: sx, z: sz, tx: sx, tz: sz,
        wait: 1 + Math.random() * 2.5, speed: 1.55, phase: Math.random() * 6
      });
    });

    // 城外东南野外：1~2 头游荡妖兽
    const beastActors = [];
    const bName = plate.biome === 'ice' ? '寒渊冰蛟' : (plate.biome === 'volcano' ? '赤炎妖猿' : '幽林妖狼');
    const bx = 15.5, bz = 14.5;
    const bSp = makeHumanSprite('assets/chars/wolf_boss.webp', bName, '城外妖兽', 0xe06258, 1.5, 1.65);
    bSp.group.position.set(bx, 0, bz);
    bSp.body.userData = { interactIdx: interactables.length };
    scene.add(bSp.group);
    clickMeshes.push(bSp.body);
    const bEntry = { type: 'beast', id: 'local_beast', label: `迎战城外妖兽【${bName}】`, sub: '可斩杀/智取/驯服', x: bx, z: bz, obj: bSp.group, data: { name: bName, plate } };
    interactables.push(bEntry);
    beastActors.push({ sp: bSp, entry: bEntry, homeX: bx, homeZ: bz, x: bx, z: bz, tx: bx, tz: bz, wait: 1, speed: 1.8 });

    // 5. 主角（出生在中央广场，正常人体比例，WASD / 点击地面丝滑走动）
    const heroPos = { x: 0, z: 2.5, tx: null, tz: null, flying: false, facing: 1, walkPhase: 0 };
    const heroActor = makeHumanSprite(
      'assets/chars/hero_full.webp',
      (hero && hero.masked ? hero.maskName : (hero && hero.name)) || '青云道友',
      (hero && hero.realm) || '炼气一层',
      0x6fd3a8, 1.55, 2.15
    );
    const swordMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 1.65), new THREE.MeshBasicMaterial({ color: 0x8ef7da }));
    swordMesh.visible = false;
    heroActor.group.add(swordMesh);
    heroActor.group.position.set(heroPos.x, 0, heroPos.z);
    scene.add(heroActor.group);

    // 点击地面玉色落点光圈
    const clickRing = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.52, 24),
      new THREE.MeshBasicMaterial({ color: 0x6fd3a8, side: THREE.DoubleSide, transparent: true, opacity: 0 })
    );
    clickRing.rotateX(-Math.PI / 2);
    scene.add(clickRing);
    let clickRingLife = 0;

    // 飘浮灵气粒子（花瓣/雪花/火星）
    const pCol = plate.biome === 'ice' ? 0xe8f6ff : (plate.biome === 'volcano' ? 0xff7b42 : 0xaef7d8);
    const pGeo = new THREE.BufferGeometry();
    const pArr = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) {
      pArr[i * 3] = (Math.random() - 0.5) * MAP_W;
      pArr[i * 3 + 1] = 0.5 + Math.random() * 7;
      pArr[i * 3 + 2] = (Math.random() - 0.5) * MAP_H;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: pCol, size: 0.16, transparent: true, opacity: 0.72 }));
    scene.add(particles);

    // 6. 第三人称 HD-2D 正常视角相机（平滑跟随主角）
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

    // 7. 键鼠控制
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
        const tg = interactables[hitEnt[0].object.userData.interactIdx];
        if (tg) {
          if (Math.hypot(tg.x - heroPos.x, tg.z - heroPos.z) < 3.4 && opts.onInteract) {
            opts.onInteract(tg);
          } else {
            heroPos.tx = tg.x; heroPos.tz = tg.z; pendingInteract = tg;
            clickRing.position.set(tg.x, 0.08, tg.z); clickRingLife = 1.0;
          }
          return;
        }
      }
      const hitG = raycaster.intersectObject(ground);
      if (hitG.length) {
        const pt = hitG[0].point;
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

    // 8. 实时主循环
    let lastTime = performance.now(), t = 0, proxTick = 0;
    const animate = now => {
      if (!state) return;
      state.raf = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now; t += dt;

      let ix = joyVec.x, iz = joyVec.z;
      if (keys.w || keys.arrowup) iz -= 1;
      if (keys.s || keys.arrowdown) iz += 1;
      if (keys.a || keys.arrowleft) ix -= 1;
      if (keys.d || keys.arrowright) ix += 1;

      const speed = heroPos.flying ? 11.5 : 5.8;
      let moving = false;

      if (Math.abs(ix) > 0.05 || Math.abs(iz) > 0.05) {
        heroPos.tx = null; heroPos.tz = null; pendingInteract = null;
        const len = Math.hypot(ix, iz); ix /= len; iz /= len;
        const cosY = Math.cos(camState.yaw), sinY = Math.sin(camState.yaw);
        const wx = ix * cosY + iz * sinY, wz = -ix * sinY + iz * cosY;
        heroPos.x = Math.max(-23, Math.min(23, heroPos.x + wx * speed * dt));
        heroPos.z = Math.max(-20, Math.min(20, heroPos.z + wz * speed * dt));
        moving = true;
        if (Math.abs(wx) > 0.1) heroPos.facing = wx > 0 ? 1 : -1;
      } else if (heroPos.tx !== null && heroPos.tz !== null) {
        const dx = heroPos.tx - heroPos.x, dz = heroPos.tz - heroPos.z;
        const d = Math.hypot(dx, dz);
        if (d < (pendingInteract ? 2.6 : 0.25)) {
          heroPos.tx = null; heroPos.tz = null;
          if (pendingInteract && opts.onInteract) { const tg = pendingInteract; pendingInteract = null; opts.onInteract(tg); }
        } else {
          const step = Math.min(d, speed * dt);
          heroPos.x += (dx / d) * step; heroPos.z += (dz / d) * step;
          moving = true;
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

      camState.cx += (heroPos.x - camState.cx) * Math.min(1, dt * 7);
      camState.cz += (heroPos.z - camState.cz) * Math.min(1, dt * 7);
      updateCam();

      if (clickRingLife > 0) {
        clickRingLife -= dt * 1.5;
        clickRing.material.opacity = Math.max(0, clickRingLife * 0.9);
        const sc = 1 + (1 - clickRingLife) * 1.4;
        clickRing.scale.set(sc, sc, 1);
      }

      // 街道 NPC 散步
      npcActors.forEach(a => {
        if (a.wait > 0) {
          a.wait -= dt;
          if (a.wait <= 0) {
            a.tx = Math.max(-18, Math.min(18, a.homeX + (Math.random() - 0.5) * 8));
            a.tz = Math.max(-10, Math.min(10, a.homeZ + (Math.random() - 0.5) * 8));
          }
        } else {
          const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
          if (d < 0.3) a.wait = 1.5 + Math.random() * 3;
          else {
            a.x += (dx / d) * a.speed * dt; a.z += (dz / d) * a.speed * dt;
            a.phase += dt * 8;
            a.sp.body.position.y = 0.98 + Math.abs(Math.sin(a.phase)) * 0.09;
          }
        }
        a.sp.group.position.set(a.x, 0, a.z);
        a.entry.x = a.x; a.entry.z = a.z;
      });

      // 城外妖兽巡逻
      beastActors.forEach(b => {
        if (b.wait > 0) {
          b.wait -= dt;
          if (b.wait <= 0) {
            b.tx = b.homeX + (Math.random() - 0.5) * 6;
            b.tz = b.homeZ + (Math.random() - 0.5) * 5;
          }
        } else {
          const dx = b.tx - b.x, dz = b.tz - b.z, d = Math.hypot(dx, dz);
          if (d < 0.3) b.wait = 1.2 + Math.random() * 2;
          else { b.x += (dx / d) * b.speed * dt; b.z += (dz / d) * b.speed * dt; }
        }
        b.sp.group.position.set(b.x, 0, b.z);
        b.entry.x = b.x; b.entry.z = b.z;
      });

      crystal.rotation.y = t * 1.4;
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
      buildingsForMini, npcActors, beastActors,
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

  function getMinimapData() {
    if (!state) return null;
    return {
      mode: 'local',
      title: state.plate.name,
      w: state.MAP_W, h: state.MAP_H,
      hero: { x: state.heroPos.x, z: state.heroPos.z },
      pois: state.buildingsForMini,
      npcs: state.npcActors.map(a => ({ x: a.x, z: a.z })),
      beasts: state.beastActors.map(b => ({ x: b.x, z: b.z }))
    };
  }

  const LocalMap3D = { mount, dispose, toggleFly, setJoystick, triggerInteract, getMinimapData };
  if (typeof module !== 'undefined' && module.exports) module.exports = LocalMap3D;
  root.LocalMap3D = LocalMap3D;
})(typeof window !== 'undefined' ? window : globalThis);
