/* ============================================================================
 * 《沧溟界》v9.0.0 HD-2D / 2.5D 可操控开放世界引擎 (engine/map3d.js)
 * ----------------------------------------------------------------------------
 * - 真实主角立绘在 3D 山川海岳上自由行走 / 御剑飞行（WASD / 方向键 / 鼠标点击地面寻路）
 * - 第三人称 HD-2D 跟随镜头（滚轮可从贴地冒险视角无极拉远至五洲七海全局视角）
 * - 24 板块 3D 宗门楼阁 / 坊市 / 遗迹石碑 / 灵树松林实体地标
 * - 活着的 NPC 修士 & 野外妖兽在地形上实时游历巡逻，靠近自动触发交互提示（按 E 或点击）
 * ============================================================================ */
(function (root) {
  'use strict';

  // 24 板块 3D 世界坐标 [x (-28..28), z (-16..16), peakHeight, biome]
  const COORDS_3D = {
    N1: [-17.5, -11.5, 3.6, 'ice'],   N2: [ -8.8, -11.2, 2.5, 'ice'],
    N3: [-20.5,  -6.0, 3.1, 'ice'],   N4: [-10.2,  -5.6, 1.7, 'ice'],

    C1: [ -5.8,   0.3, 1.3, 'earth'], C2: [-13.0,   2.8, 1.1, 'earth'],
    C3: [  1.6,  -0.8, 2.5, 'earth'], C4: [ -3.6,   6.0, 1.9, 'earth'],

    E1: [  9.2,  -3.2, 2.7, 'wood'],  E2: [ 15.2,  -4.4, 1.6, 'wood'],
    E3: [ 16.2,   1.6, 2.3, 'wood'],  E4: [  9.8,   3.1, 1.2, 'wood'],

    S1: [ -4.8,  11.0, 1.8, 'fire'],  S2: [-12.5,  13.0, 4.0, 'volcano'],
    S3: [  2.3,  13.2, 1.3, 'earth'], S4: [  8.2,  11.5, 1.2, 'fire'],

    O1: [  9.8,   7.6, 0.0, 'ocean'], O2: [ 14.8,  11.8, 0.0, 'ocean'],
    O3: [  0.6,  -9.0, 0.0, 'ocean'], O4: [ 19.6,   6.0, 0.2, 'ocean'],
    O5: [ 21.0,  11.5, 0.0, 'ocean'], O6: [ 25.0,   7.8, 0.0, 'ocean'],

    Y1: [ 27.2,   0.6, 1.9, 'island'], Y2: [ 27.8,  -5.6, 3.4, 'island']
  };

  const CHOKE_KEYS = new Set(['E1-C3', 'C3-E1', 'S1-C4', 'C4-S1', 'N4-C1', 'C1-N4']);

  let state = null;

  function heightAt(x, z) {
    let h = -0.72;
    for (const id in COORDS_3D) {
      const [cx, cz, peak, biome] = COORDS_3D[id];
      if (biome === 'ocean' && peak <= 0.1) continue;
      const dx = x - cx, dz = z - cz;
      const dist2 = dx * dx + dz * dz;
      const rad = biome === 'volcano' ? 11.0 : (biome === 'island' ? 9.5 : 17.5);
      const contrib = (peak + 0.72) * Math.exp(-dist2 / rad);
      if (contrib - 0.72 > h) h = contrib - 0.72;
    }
    if (h > 0.05) {
      h += Math.sin(x * 0.65) * Math.cos(z * 0.65) * 0.16 + Math.sin(x * 1.6 + z * 1.3) * 0.05;
    }
    return h;
  }

  function nearestPlateAt(x, z, world) {
    let bestId = 'E2', bestD = Infinity;
    const nodes = world ? world.nodes : null;
    for (const id in COORDS_3D) {
      if (nodes && !world.nodeMap[id]) continue;
      const [cx, cz] = COORDS_3D[id];
      const d = (x - cx) * (x - cx) + (z - cz) * (z - cz);
      if (d < bestD) { bestD = d; bestId = id; }
    }
    return bestId;
  }

  function makeNameplateTexture(title, sub, borderColor) {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 68;
    const ctx = cv.getContext('2d');
    const grd = ctx.createLinearGradient(0, 0, 256, 0);
    grd.addColorStop(0, 'rgba(8,10,14,0)');
    grd.addColorStop(0.15, 'rgba(8,11,16,0.84)');
    grd.addColorStop(0.85, 'rgba(8,11,16,0.84)');
    grd.addColorStop(1, 'rgba(8,10,14,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 8, 256, 52);

    ctx.strokeStyle = borderColor || 'rgba(212,184,122,0.75)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(28, 9); ctx.lineTo(228, 9);
    ctx.moveTo(28, 59); ctx.lineTo(228, 59);
    ctx.stroke();

    ctx.fillStyle = '#f6e7c1';
    ctx.font = 'bold 21px "Songti SC","Noto Serif SC",serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 10), 128, sub ? 34 : 42);

    if (sub) {
      ctx.fillStyle = '#a8d9c4';
      ctx.font = '13.5px sans-serif';
      ctx.fillText(sub.slice(0, 18), 128, 53);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;
    return tex;
  }

  // 创建立绘人物牌（带圆角肖像+修仙道袍轮廓，图片加载完自动贴图）
  function makeCharacterSprite(imgUrl, name, sub, tintHex, scaleW, scaleH) {
    const group = new THREE.Group();

    // 地面阴影
    const shGeo = new THREE.CircleGeometry(0.45, 20);
    shGeo.rotateX(-Math.PI / 2);
    const shMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.48, depthWrite: false });
    const shadow = new THREE.Mesh(shGeo, shMat);
    shadow.position.y = 0.04;
    group.add(shadow);

    // 脚下光环
    const rGeo = new THREE.RingGeometry(0.36, 0.50, 24);
    rGeo.rotateX(-Math.PI / 2);
    const rMat = new THREE.MeshBasicMaterial({ color: tintHex, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const ring = new THREE.Mesh(rGeo, rMat);
    ring.position.y = 0.06;
    group.add(ring);

    // 2D 纸片人立绘（HD-2D 核心）
    const cv = document.createElement('canvas');
    cv.width = 160; cv.height = 220;
    const ctx = cv.getContext('2d');
    const drawFallback = () => {
      ctx.clearRect(0, 0, 160, 220);
      // 仙侠道袍剪影兜底
      const grd = ctx.createLinearGradient(80, 30, 80, 210);
      grd.addColorStop(0, '#' + tintHex.toString(16).padStart(6, '0'));
      grd.addColorStop(1, '#121a28');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(80, 62); ctx.lineTo(126, 205); ctx.lineTo(34, 205); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f2daa0'; ctx.lineWidth = 4; ctx.stroke();
      // 头部
      ctx.fillStyle = '#f5dec2';
      ctx.beginPath(); ctx.arc(80, 44, 22, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1b1d24'; ctx.lineWidth = 3; ctx.stroke();
    };
    drawFallback();
    const charTex = new THREE.CanvasTexture(cv);
    if (imgUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, 160, 220);
        // 圆形仙侠立绘徽章风格（防止方形背景穿帮）
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(14, 14, 132, 192, 66);
        ctx.clip();
        const aspect = img.width / img.height;
        let dw = 150, dh = 150 / aspect;
        if (dh < 200) { dh = 200; dw = dh * aspect; }
        ctx.drawImage(img, (160 - dw) / 2, 8, dw, dh);
        ctx.restore();
        // 金玉描边
        ctx.strokeStyle = '#' + tintHex.toString(16).padStart(6, '0');
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(14, 14, 132, 192, 66);
        ctx.stroke();
        charTex.needsUpdate = true;
      };
      img.src = imgUrl;
    }

    const spMat = new THREE.SpriteMaterial({ map: charTex, transparent: true });
    const body = new THREE.Sprite(spMat);
    body.scale.set(scaleW || 1.35, scaleH || 1.85, 1);
    body.position.y = (scaleH || 1.85) * 0.52;
    group.add(body);

    // 头顶名牌
    if (name) {
      const npTex = makeNameplateTexture(name, sub || '', '#' + tintHex.toString(16).padStart(6, '0'));
      const npSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: npTex, transparent: true, depthTest: false }));
      npSp.scale.set(2.5, 0.82, 1);
      npSp.position.y = (scaleH || 1.85) + 0.58;
      group.add(npSp);
    }

    return { group, body, ring, shadow };
  }

  // 3D 低多边形仙侠宗门楼阁 / 聚落建筑
  function buildSectHall(colorHex, scale) {
    const g = new THREE.Group();
    const s = scale || 1;
    // 石台基座
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9 * s, 1.15 * s, 0.35 * s, 6),
      new THREE.MeshStandardMaterial({ color: 0x5c5b57, roughness: 0.9 })
    );
    base.position.y = 0.17 * s;
    g.add(base);
    // 殿身
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62 * s, 0.68 * s, 0.72 * s, 6),
      new THREE.MeshStandardMaterial({ color: 0x8a3028, roughness: 0.7 })
    );
    wall.position.y = 0.68 * s;
    g.add(wall);
    // 飞檐黛瓦顶
    const roof1 = new THREE.Mesh(
      new THREE.ConeGeometry(1.12 * s, 0.55 * s, 6),
      new THREE.MeshStandardMaterial({ color: colorHex || 0x26485c, roughness: 0.55, metalness: 0.25 })
    );
    roof1.position.y = 1.24 * s;
    g.add(roof1);
    // 二层重檐
    const roof2 = new THREE.Mesh(
      new THREE.ConeGeometry(0.75 * s, 0.45 * s, 6),
      new THREE.MeshStandardMaterial({ color: 0xd4b87a, roughness: 0.4, metalness: 0.5 })
    );
    roof2.position.y = 1.65 * s;
    g.add(roof2);
    return g;
  }

  // 3D 古遗迹石碑
  function buildRuinMonolith() {
    const g = new THREE.Group();
    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 1.55, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x3a4654, roughness: 0.85, emissive: 0x243b4a, emissiveIntensity: 0.5 })
    );
    stone.position.y = 0.78;
    g.add(stone);
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.26, 0),
      new THREE.MeshBasicMaterial({ color: 0xf7d070 })
    );
    orb.position.y = 1.85;
    g.add(orb);
    return { group: g, orb };
  }

  function dispose() {
    if (!state) return;
    if (state.raf) cancelAnimationFrame(state.raf);
    if (state.cleanupListeners) state.cleanupListeners();
    if (state.renderer) {
      state.renderer.dispose();
      if (state.renderer.domElement && state.renderer.domElement.parentNode) {
        state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
      }
    }
    state = null;
  }

  function mount(container, world, hero, opts) {
    dispose();
    if (!window.THREE || !container) return false;
    opts = opts || {};
    const THREE = window.THREE;
    const W = Math.max(480, container.clientWidth || window.innerWidth || 960);
    const H = Math.max(360, container.clientHeight || window.innerHeight || 640);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07101c);
    scene.fog = new THREE.FogExp2(0x0a1626, 0.014);

    const camera = new THREE.PerspectiveCamera(44, W / H, 0.3, 180);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 仙侠光影
    scene.add(new THREE.AmbientLight(0x9ab8d8, 0.78));
    const sun = new THREE.DirectionalLight(0xffe9c2, 1.18);
    sun.position.set(22, 34, 18);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x4f94d4, 0.42);
    rim.position.set(-24, 16, -20);
    scene.add(rim);

    // 1. 高精 3D 起伏地形（140×90）
    const tGeo = new THREE.PlaneGeometry(72, 42, 140, 90);
    tGeo.rotateX(-Math.PI / 2);
    const pos = tGeo.attributes.position;
    const colors = [];
    const cTmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i) + 4.0;
      const vz = pos.getZ(i) + 1.2;
      const vy = heightAt(vx, vz);
      pos.setXYZ(i, vx, vy, vz);
      if (vy <= 0.02) cTmp.setHex(0x0c253b);
      else if (vy < 0.16) cTmp.setHex(0x8c7f5f); // 海岸浅滩
      else if (vx > 23.0) cTmp.setHex(vy > 2.0 ? 0x7658a6 : 0x3f4c73); // 彼岸孤岛
      else if (vz < -3.5 && vx < 3.0) cTmp.setHex(vy > 2.0 ? 0xe4f3ff : 0x6f8fa8); // 北陆冰原
      else if (vz > 8.0 && vx < 10.5) cTmp.setHex(vy > 2.4 ? 0xcf4d2d : 0x703d2e); // 南陆火山
      else if (vx > 5.5 && vz < 6.0) cTmp.setHex(vy > 1.9 ? 0x3f8464 : 0x2a5c47); // 东陆青木
      else cTmp.setHex(vy > 1.7 ? 0x918056 : 0x4f6446); // 中陆沃野
      colors.push(cTmp.r, cTmp.g, cTmp.b);
    }
    tGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    tGeo.computeVertexNormals();
    const terrain = new THREE.Mesh(
      tGeo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.06, flatShading: true })
    );
    scene.add(terrain);

    // 2. 沧溟大洋海面
    const seaGeo = new THREE.PlaneGeometry(86, 54, 48, 32);
    seaGeo.rotateX(-Math.PI / 2);
    const sea = new THREE.Mesh(
      seaGeo,
      new THREE.MeshStandardMaterial({ color: 0x0e3b60, transparent: true, opacity: 0.84, roughness: 0.22, metalness: 0.38 })
    );
    sea.position.set(4.0, 0.07, 1.2);
    scene.add(sea);

    // 3. 3D 植被（灵松 / 雪松 / 灵石，增强贴地行走的空间纵深感）
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4b3626, roughness: 0.9 });
    const leafWood = new THREE.MeshStandardMaterial({ color: 0x245940, roughness: 0.85, flatShading: true });
    const leafSnow = new THREE.MeshStandardMaterial({ color: 0xb7d4e8, roughness: 0.85, flatShading: true });
    const trunkGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.36, 5);
    const coneGeo = new THREE.ConeGeometry(0.32, 0.88, 5);
    let seed = 1337;
    const srand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < 150; i++) {
      const tx = -24 + srand() * 54;
      const tz = -14 + srand() * 29;
      const ty = heightAt(tx, tz);
      if (ty < 0.25 || ty > 2.8) continue;
      if (tz > 8.0 && tx < 10.0) continue; // 火山区不长树
      const tree = new THREE.Group();
      const tr = new THREE.Mesh(trunkGeo, trunkMat);
      tr.position.y = 0.18;
      const cn = new THREE.Mesh(coneGeo, (tz < -3.5 && tx < 3.0) ? leafSnow : leafWood);
      cn.position.y = 0.68;
      tree.add(tr); tree.add(cn);
      const sc = 0.75 + srand() * 0.65;
      tree.scale.setScalar(sc);
      tree.position.set(tx, ty - 0.04, tz);
      scene.add(tree);
    }

    // 4. 陆路 / 咽喉关隘 / 沧溟航道连线
    const drawn = new Set();
    world.nodes.forEach(nd => {
      const p1 = COORDS_3D[nd.id];
      if (!p1) return;
      nd.neighbors.forEach(nbId => {
        const key = [nd.id, nbId].sort().join('-');
        if (drawn.has(key)) return;
        drawn.add(key);
        const p2 = COORDS_3D[nbId];
        const nb = world.nodeMap[nbId];
        if (!p2 || !nb) return;
        const isChoke = CHOKE_KEYS.has(key);
        const isSeaEdge = nd.isSea || nb.isSea;
        const y1 = Math.max(0.18, heightAt(p1[0], p1[1]) + 0.15);
        const y2 = Math.max(0.18, heightAt(p2[0], p2[1]) + 0.15);
        const midY = Math.max(y1, y2) + (isChoke ? 1.1 : 0.35);
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(p1[0], y1, p1[1]),
          new THREE.Vector3((p1[0] + p2[0]) / 2, midY, (p1[1] + p2[1]) / 2),
          new THREE.Vector3(p2[0], y2, p2[1])
        );
        const col = isChoke ? 0xffa64d : (isSeaEdge ? (world.seaTechUnlocked ? 0x70b8f0 : 0x26445e) : 0xcab077);
        const lMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: isChoke ? 0.9 : 0.42 });
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(18)), lMat));
      });
    });

    // 5. 24 板块实体地标（宗门大殿 + 牌匾） & 可交互实体池
    const interactables = []; // { type, id, label, sub, x, z, obj, data }
    const clickMeshes = [];
    const ruinOrbs = [];

    world.nodes.forEach(nd => {
      const c3 = COORDS_3D[nd.id];
      if (!c3) return;
      const baseH = Math.max(0.12, heightAt(c3[0], c3[1]));

      // 陆地板块放 3D 宗门楼阁 / 聚落
      if (!nd.isSea) {
        const hasFac = (nd.holdings || []).length > 0;
        const hall = buildSectHall(hasFac ? 0x1e6058 : 0x3b4858, hasFac ? 1.05 : 0.78);
        hall.position.set(c3[0], baseH - 0.05, c3[1]);
        scene.add(hall);
      }

      // 地标牌匾
      const hasRuin = (world.ruins || []).some(r => r.plateId === nd.id);
      const hasInst = (world.institutions || []).some(i => i.plateId === nd.id && i.status !== 'abolished');
      const badges = (hasRuin ? '🗝️' : '') + (hasInst ? '⚖️' : '') + (nd.sha >= 55 ? '🔥' : '');
      const tex = makeNameplateTexture(`${badges}${nd.name}`, `${nd.id} · 脉${nd.leyline} 暗${nd.darkForestIdx || 0}`, nd.sha >= 55 ? '#e06258' : '#d4b87a');
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      sp.scale.set(3.4, 1.12, 1);
      sp.position.set(c3[0], baseH + 2.55, c3[1]);
      sp.userData = { interactIdx: interactables.length };
      scene.add(sp);
      clickMeshes.push(sp);

      interactables.push({
        type: 'plate', id: nd.id, label: `进入【${nd.name}】`,
        sub: `脉${nd.leyline} · 暗森${nd.darkForestIdx || 0}`,
        x: c3[0], z: c3[1], obj: sp, data: nd
      });

      // 如果该板块有遗迹，在旁边生成发光 3D 石碑！
      const localRuins = (world.ruins || []).filter(r => r.plateId === nd.id);
      localRuins.slice(0, 1).forEach(r => {
        const rx = c3[0] + 2.1, rz = c3[1] + 1.4;
        const ry = Math.max(0.12, heightAt(rx, rz));
        const mono = buildRuinMonolith();
        mono.group.position.set(rx, ry - 0.05, rz);
        scene.add(mono.group);
        ruinOrbs.push(mono.orb);
        const rTex = makeNameplateTexture('🗝️ 古修遗迹', r.name.slice(0, 10), '#f7d070');
        const rSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: rTex, transparent: true, depthTest: false }));
        rSp.scale.set(2.4, 0.78, 1);
        rSp.position.set(rx, ry + 2.35, rz);
        rSp.userData = { interactIdx: interactables.length };
        scene.add(rSp);
        clickMeshes.push(rSp);
        interactables.push({
          type: 'ruin', id: r.id, label: `探索遗迹【${r.name}】`,
          sub: r.discovered ? '已暴露·凶险' : '未现世秘境',
          x: rx, z: rz, obj: rSp, data: r
        });
      });

      // 如果有野生灵草/矿脉点（每个陆地板块放 1 个可采集点）
      if (!nd.isSea && nd.leyline >= 35) {
        const hx = c3[0] - 2.0, hz = c3[1] + 1.6;
        const hy = Math.max(0.12, heightAt(hx, hz));
        const crystal = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.32, 0),
          new THREE.MeshStandardMaterial({ color: 0x6fd3a8, emissive: 0x2a8060, emissiveIntensity: 0.7 })
        );
        crystal.position.set(hx, hy + 0.42, hz);
        crystal.userData = { interactIdx: interactables.length };
        scene.add(crystal);
        clickMeshes.push(crystal);
        ruinOrbs.push(crystal);
        interactables.push({
          type: 'gather', id: 'g_' + nd.id, label: `采集【${nd.name}灵脉灵草】`,
          sub: `灵脉${nd.leyline} · 消耗少许体力`,
          x: hx, z: hz, obj: crystal, data: nd
        });
      }
    });

    // 6. 活着的 NPC 修士实体（在 3D 地形上真实巡逻游历！）
    const npcActors = [];
    const npcPortraits = ['assets/chars/sister_full.webp', 'assets/chars/elder.webp', 'assets/chars/hero.webp'];
    (world.people || world.agents || []).filter(a => a.alive).slice(0, 26).forEach((ag, idx) => {
      const c3 = COORDS_3D[ag.plateId || ag.locId] || COORDS_3D.E2;
      const ox = (srand() - 0.5) * 4.5;
      const oz = (srand() - 0.5) * 4.5;
      const x = c3[0] + ox, z = c3[1] + oz;
      const fac = ag.factionId ? world.factions.find(f => f.id === ag.factionId) : null;
      const tint = ag.factionId ? 0x70b8f0 : 0xd4b87a;
      const spriteObj = makeCharacterSprite(
        npcPortraits[idx % npcPortraits.length],
        ag.name,
        `${ag.realm}${fac ? '·' + fac.name.slice(0, 4) : '·散修'}`,
        tint, 1.15, 1.55
      );
      const y = Math.max(0.12, heightAt(x, z));
      spriteObj.group.position.set(x, y, z);
      spriteObj.body.userData = { interactIdx: interactables.length };
      scene.add(spriteObj.group);
      clickMeshes.push(spriteObj.body);

      const entry = {
        type: 'npc', id: ag.id, label: `与【${ag.name}】交涉`,
        sub: `${ag.realm} · ${fac ? fac.name : '散修'}`,
        x, z, obj: spriteObj.group, data: ag
      };
      interactables.push(entry);
      npcActors.push({
        ag, spriteObj, entry,
        homeX: c3[0], homeZ: c3[1],
        x, z, tx: x, tz: z, wait: 1 + srand() * 3, speed: 0.9 + srand() * 0.5, phase: srand() * 6
      });
    });

    // 7. 野外游荡妖兽（带红圈警戒，高暗森区会主动逼近）
    const beastActors = [];
    const beastNodes = world.nodes.filter(n => !n.isSea && (n.sha >= 30 || (n.darkForestIdx || 0) >= 35)).slice(0, 12);
    beastNodes.forEach((nd, idx) => {
      const c3 = COORDS_3D[nd.id];
      if (!c3) return;
      const x = c3[0] + (srand() - 0.5) * 5.2;
      const z = c3[1] + (srand() - 0.5) * 5.2;
      const bName = nd.biome === 'ice' ? '寒渊冰蛟' : (nd.biome === 'volcano' ? '赤炎妖猿' : '幽林妖狼');
      const spriteObj = makeCharacterSprite('assets/chars/wolf_boss.webp', bName, `妖兽 · 危`, 0xe06258, 1.3, 1.45);
      const y = Math.max(0.12, heightAt(x, z));
      spriteObj.group.position.set(x, y, z);
      spriteObj.body.userData = { interactIdx: interactables.length };
      scene.add(spriteObj.group);
      clickMeshes.push(spriteObj.body);

      const entry = {
        type: 'beast', id: 'b_' + idx, label: `遭遇妖兽【${bName}】`,
        sub: `${nd.name}野外 · 可猎杀/驱赶`,
        x, z, obj: spriteObj.group, data: { name: bName, plate: nd }
      };
      interactables.push(entry);
      beastActors.push({
        spriteObj, entry, plate: nd,
        homeX: c3[0], homeZ: c3[1], x, z, tx: x, tz: z, wait: 0.5 + srand() * 2, speed: 1.35, phase: srand() * 6
      });
    });

    // 8. 真正可操控的主角（HD-2D 立绘 + 地面投影 + 御剑飞剑光效！）
    const startC = COORDS_3D[(hero && hero.locId) || 'E2'] || COORDS_3D.E2;
    const heroPos = {
      x: (hero && typeof hero._x === 'number') ? hero._x : startC[0] + 0.8,
      z: (hero && typeof hero._z === 'number') ? hero._z : startC[1] + 1.2,
      tx: null, tz: null,
      flying: false,
      facing: 1,
      walkPhase: 0,
      plateId: (hero && hero.locId) || 'E2'
    };
    const heroActor = makeCharacterSprite(
      'assets/chars/hero_full.webp',
      (hero && hero.masked ? hero.maskName : (hero && hero.name)) || '青云道友',
      (hero && hero.realm) || '炼气一层',
      0x6fd3a8, 1.5, 2.05
    );
    // 飞剑模型（御剑模式显示）
    const swordMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.06, 1.55),
      new THREE.MeshBasicMaterial({ color: 0x8ef7da })
    );
    swordMesh.position.y = 0.12;
    swordMesh.visible = false;
    heroActor.group.add(swordMesh);
    heroActor.group.position.set(heroPos.x, Math.max(0.12, heightAt(heroPos.x, heroPos.z)), heroPos.z);
    scene.add(heroActor.group);

    // 点击地面落点光环
    const clickRing = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.48, 24),
      new THREE.MeshBasicMaterial({ color: 0x6fd3a8, side: THREE.DoubleSide, transparent: true, opacity: 0.0 })
    );
    clickRing.rotateX(-Math.PI / 2);
    scene.add(clickRing);
    let clickRingLife = 0;

    // 9. 飘浮云海
    const clouds = [];
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xdbe9f6, transparent: true, opacity: 0.14, depthWrite: false });
    const cloudGeo = new THREE.SphereGeometry(2.8, 10, 8);
    cloudGeo.scale(2.3, 0.24, 1.3);
    for (let i = 0; i < 14; i++) {
      const cl = new THREE.Mesh(cloudGeo, cloudMat);
      cl.position.set(-24 + Math.random() * 56, 5.6 + Math.random() * 2.4, -14 + Math.random() * 28);
      scene.add(cl);
      clouds.push(cl);
    }

    // 10. 第三人称 HD-2D 跟随镜头 + 自由旋转缩放
    const camState = { yaw: 0.0, pitch: 0.62, dist: 12.5, cx: heroPos.x, cz: heroPos.z };
    const updateCam = () => {
      camera.position.set(
        camState.cx + Math.sin(camState.yaw) * Math.cos(camState.pitch) * camState.dist,
        Math.sin(camState.pitch) * camState.dist + 1.2,
        camState.cz + Math.cos(camState.yaw) * Math.cos(camState.pitch) * camState.dist
      );
      camera.lookAt(camState.cx, Math.max(0.4, heightAt(camState.cx, camState.cz) + 0.7), camState.cz);
    };
    updateCam();

    // 11. 键盘 WASD / 方向键 / Space(御剑) / E(交互) + 鼠标左键行走/点击实体 + 右键旋转 + 滚轮缩放
    const keys = {};
    const joyVec = { x: 0, z: 0 };
    let nearbyTarget = null;
    let pendingInteract = null;
    let seaWarnCd = 0;

    const onKeyDown = e => {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      const md = document.getElementById('life-sim-modal');
      if (md && md.classList.contains('open')) return;
      const k = e.key.toLowerCase();
      keys[k] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (k === ' ') {
        heroPos.flying = !heroPos.flying;
        swordMesh.visible = heroPos.flying;
        if (opts.onFlyToggle) opts.onFlyToggle(heroPos.flying);
      }
      if (k === 'e' && nearbyTarget && opts.onInteract) {
        opts.onInteract(nearbyTarget);
      }
    };
    const onKeyUp = e => { keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const dom = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let rDragging = false, moved = false, lx = 0, ly = 0;

    const onPointerDown = e => {
      lx = e.clientX; ly = e.clientY; moved = false;
      if (e.button === 2 || e.shiftKey) rDragging = true;
    };
    const onPointerMove = e => {
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      lx = e.clientX; ly = e.clientY;
      if (rDragging) {
        camState.yaw -= dx * 0.0065;
        camState.pitch = Math.max(0.32, Math.min(1.28, camState.pitch + dy * 0.005));
      }
    };
    const onPointerUp = () => { rDragging = false; };
    const onContextMenu = e => e.preventDefault();
    const onWheel = e => {
      e.preventDefault();
      camState.dist = Math.max(6.5, Math.min(46, camState.dist + e.deltaY * 0.02));
    };
    const onClick = e => {
      if (moved || e.button !== 0) return;
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // 优先检测是否点击了 NPC / 妖兽 / 地标 / 遗迹
      const hitEnt = raycaster.intersectObjects(clickMeshes);
      if (hitEnt.length) {
        const idx = hitEnt[0].object.userData.interactIdx;
        const target = interactables[idx];
        if (target) {
          const dist = Math.hypot(target.x - heroPos.x, target.z - heroPos.z);
          if (dist < 3.2 && opts.onInteract) {
            opts.onInteract(target);
          } else {
            heroPos.tx = target.x; heroPos.tz = target.z;
            pendingInteract = target;
            clickRing.position.set(target.x, Math.max(0.14, heightAt(target.x, target.z)) + 0.1, target.z);
            clickRingLife = 1.0;
          }
          return;
        }
      }

      // 否则点击地面：让主角走过去！
      const hitGround = raycaster.intersectObjects([terrain, sea]);
      if (hitGround.length) {
        const pt = hitGround[0].point;
        heroPos.tx = Math.max(-28, Math.min(32, pt.x));
        heroPos.tz = Math.max(-16, Math.min(16, pt.z));
        pendingInteract = null;
        clickRing.position.set(heroPos.tx, Math.max(0.12, pt.y) + 0.1, heroPos.tz);
        clickRingLife = 1.0;
      }
    };
    const onResize = () => {
      if (!state) return;
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);

    // 12. 实时主循环（主角移动、NPC 巡游、妖兽警戒、镜头跟随、临近交互检测）
    let lastTime = performance.now();
    let t = 0, proximityTick = 0;

    const animate = now => {
      if (!state) return;
      state.raf = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      t += dt;
      if (seaWarnCd > 0) seaWarnCd -= dt;

      // —— 主角移动计算 ——
      let ix = joyVec.x, iz = joyVec.z;
      if (keys.w || keys.arrowup) iz -= 1;
      if (keys.s || keys.arrowdown) iz += 1;
      if (keys.a || keys.arrowleft) ix -= 1;
      if (keys.d || keys.arrowright) ix += 1;

      const speed = heroPos.flying ? 7.6 : 3.4;
      let moving = false;

      if (Math.abs(ix) > 0.05 || Math.abs(iz) > 0.05) {
        // 键盘/摇杆优先，取消自动寻路
        heroPos.tx = null; heroPos.tz = null; pendingInteract = null;
        const len = Math.hypot(ix, iz);
        ix /= len; iz /= len;
        // 依据相机朝向映射方向
        const cosY = Math.cos(camState.yaw), sinY = Math.sin(camState.yaw);
        const wx = ix * cosY + iz * sinY;
        const wz = -ix * sinY + iz * cosY;
        const nx = Math.max(-28, Math.min(32, heroPos.x + wx * speed * dt));
        const nz = Math.max(-16, Math.min(16, heroPos.z + wz * speed * dt));
        const nh = heightAt(nx, nz);
        if (nh < -0.18 && !heroPos.flying && !world.seaTechUnlocked) {
          if (seaWarnCd <= 0 && opts.onToast) {
            opts.onToast('🌊 沧溟深海瘴气阻路！按【空格】御剑飞行或待渡海灵舟解封后方可远航');
            seaWarnCd = 3.0;
          }
        } else {
          heroPos.x = nx; heroPos.z = nz;
          moving = true;
          if (Math.abs(wx) > 0.1) heroPos.facing = wx > 0 ? 1 : -1;
        }
      } else if (heroPos.tx !== null && heroPos.tz !== null) {
        const dx = heroPos.tx - heroPos.x, dz = heroPos.tz - heroPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist < (pendingInteract ? 2.2 : 0.25)) {
          heroPos.tx = null; heroPos.tz = null;
          if (pendingInteract && opts.onInteract) {
            const tg = pendingInteract; pendingInteract = null;
            opts.onInteract(tg);
          }
        } else {
          const step = Math.min(dist, speed * dt);
          const nx = heroPos.x + (dx / dist) * step;
          const nz = heroPos.z + (dz / dist) * step;
          const nh = heightAt(nx, nz);
          if (nh < -0.18 && !heroPos.flying && !world.seaTechUnlocked) {
            heroPos.tx = null; heroPos.tz = null; pendingInteract = null;
            if (seaWarnCd <= 0 && opts.onToast) {
              opts.onToast('🌊 前方深海不可徒步跨越，请按【空格】切换御剑飞行！');
              seaWarnCd = 2.5;
            }
          } else {
            heroPos.x = nx; heroPos.z = nz;
            moving = true;
            if (Math.abs(dx) > 0.05) heroPos.facing = dx > 0 ? 1 : -1;
          }
        }
      }

      // 主角地形贴合 + 行走弹跳 / 御剑悬浮动画
      const groundY = Math.max(0.1, heightAt(heroPos.x, heroPos.z));
      const hoverY = heroPos.flying ? (1.15 + Math.sin(t * 4.2) * 0.14) : 0;
      if (moving) heroPos.walkPhase += dt * (heroPos.flying ? 6 : 12);
      const bob = (!heroPos.flying && moving) ? Math.abs(Math.sin(heroPos.walkPhase)) * 0.18 : 0;
      heroActor.group.position.set(heroPos.x, groundY, heroPos.z);
      heroActor.body.position.y = 1.05 + hoverY + bob;
      heroActor.body.scale.x = 1.5 * heroPos.facing;
      swordMesh.position.y = 0.12 + hoverY;
      swordMesh.rotation.y = Math.atan2(heroPos.facing, 0.3) + Math.sin(t * 3) * 0.06;

      if (hero) { hero._x = heroPos.x; hero._z = heroPos.z; }

      // 镜头平滑跟随主角
      camState.cx += (heroPos.x - camState.cx) * Math.min(1, dt * 6.5);
      camState.cz += (heroPos.z - camState.cz) * Math.min(1, dt * 6.5);
      updateCam();

      // 点击波纹动画
      if (clickRingLife > 0) {
        clickRingLife -= dt * 1.4;
        clickRing.material.opacity = Math.max(0, clickRingLife * 0.9);
        const sc = 1 + (1 - clickRingLife) * 1.6;
        clickRing.scale.set(sc, sc, 1);
      }

      // —— NPC 实时巡逻 ——
      npcActors.forEach(a => {
        if (a.wait > 0) {
          a.wait -= dt;
          if (a.wait <= 0) {
            a.tx = a.homeX + (Math.random() - 0.5) * 6.0;
            a.tz = a.homeZ + (Math.random() - 0.5) * 6.0;
          }
        } else {
          const dx = a.tx - a.x, dz = a.tz - a.z;
          const d = Math.hypot(dx, dz);
          if (d < 0.25) { a.wait = 1.5 + Math.random() * 3.5; }
          else {
            a.x += (dx / d) * a.speed * dt;
            a.z += (dz / d) * a.speed * dt;
            a.phase += dt * 8;
            a.spriteObj.body.position.y = 0.8 + Math.abs(Math.sin(a.phase)) * 0.1;
          }
        }
        const ny = Math.max(0.1, heightAt(a.x, a.z));
        a.spriteObj.group.position.set(a.x, ny, a.z);
        a.entry.x = a.x; a.entry.z = a.z;
      });

      // —— 妖兽实时巡逻（靠近时小幅逼近） ——
      beastActors.forEach(b => {
        const dHero = Math.hypot(heroPos.x - b.x, heroPos.z - b.z);
        if (dHero < 4.5 && dHero > 1.6 && !heroPos.flying) {
          b.x += ((heroPos.x - b.x) / dHero) * (b.speed * 0.85) * dt;
          b.z += ((heroPos.z - b.z) / dHero) * (b.speed * 0.85) * dt;
        } else if (b.wait > 0) {
          b.wait -= dt;
          if (b.wait <= 0) {
            b.tx = b.homeX + (Math.random() - 0.5) * 5.5;
            b.tz = b.homeZ + (Math.random() - 0.5) * 5.5;
          }
        } else {
          const dx = b.tx - b.x, dz = b.tz - b.z;
          const d = Math.hypot(dx, dz);
          if (d < 0.3) b.wait = 1.0 + Math.random() * 2.5;
          else { b.x += (dx / d) * b.speed * dt; b.z += (dz / d) * b.speed * dt; }
        }
        const by = Math.max(0.1, heightAt(b.x, b.z));
        b.spriteObj.group.position.set(b.x, by, b.z);
        b.entry.x = b.x; b.entry.z = b.z;
      });

      // 环境动画（海面波动、云海漂移、遗迹/灵晶旋转）
      sea.position.y = 0.07 + Math.sin(t * 1.4) * 0.035;
      clouds.forEach((c, idx) => {
        c.position.x += (0.45 + (idx % 3) * 0.15) * dt;
        if (c.position.x > 34) c.position.x = -26;
      });
      ruinOrbs.forEach((o, i) => { o.rotation.y = t * 1.5 + i; });

      // —— 10Hz 板块切换 & 临近交互目标检测 ——
      proximityTick += dt;
      if (proximityTick >= 0.1) {
        proximityTick = 0;
        const pid = nearestPlateAt(heroPos.x, heroPos.z, world);
        if (pid !== heroPos.plateId) {
          heroPos.plateId = pid;
          if (hero) hero.locId = pid;
          if (opts.onRegionChange) opts.onRegionChange(pid);
        }
        let bestT = null, bestDist = 3.1;
        for (let i = 0; i < interactables.length; i++) {
          const it = interactables[i];
          const d = Math.hypot(it.x - heroPos.x, it.z - heroPos.z);
          if (d < bestDist) { bestDist = d; bestT = it; }
        }
        if (bestT !== nearbyTarget) {
          nearbyTarget = bestT;
          if (opts.onNearbyChange) opts.onNearbyChange(bestT);
        }
      }

      renderer.render(scene, camera);
    };

    const cleanupListeners = () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
    };

    state = {
      renderer, scene, camera, raf: null, cleanupListeners,
      heroPos, camState, swordMesh, joyVec,
      npcActors, beastActors, world,
      getNearby: () => nearbyTarget,
      opts
    };
    animate(performance.now());
    return true;
  }

  function moveToPlate(plateId) {
    if (!state || !COORDS_3D[plateId]) return;
    const [tx, tz] = COORDS_3D[plateId];
    state.heroPos.tx = tx + 0.6;
    state.heroPos.tz = tz + 0.9;
  }

  function teleportToPlate(plateId) {
    if (!state || !COORDS_3D[plateId]) return;
    const [tx, tz] = COORDS_3D[plateId];
    state.heroPos.x = tx + 0.6;
    state.heroPos.z = tz + 0.9;
    state.heroPos.tx = null;
    state.heroPos.tz = null;
    state.heroPos.plateId = plateId;
  }

  function toggleFly() {
    if (!state) return false;
    state.heroPos.flying = !state.heroPos.flying;
    state.swordMesh.visible = state.heroPos.flying;
    if (state.opts && state.opts.onFlyToggle) state.opts.onFlyToggle(state.heroPos.flying);
    return state.heroPos.flying;
  }

  function setZoomPreset(mode) {
    if (!state) return;
    if (mode === 'world') { state.camState.dist = 38; state.camState.pitch = 0.95; }
    else { state.camState.dist = 12.5; state.camState.pitch = 0.62; }
  }

  function setJoystick(vx, vz) {
    if (!state) return;
    state.joyVec.x = vx; state.joyVec.z = vz;
  }

  function triggerInteract() {
    if (!state) return;
    const tg = state.getNearby();
    if (tg && state.opts && state.opts.onInteract) state.opts.onInteract(tg);
  }

  function walkTo(x, z) {
    if (!state) return;
    state.heroPos.tx = Math.max(-28, Math.min(32, x));
    state.heroPos.tz = Math.max(-16, Math.min(16, z));
  }

  function getMinimapData() {
    if (!state) return null;
    return {
      mode: 'world',
      title: '五洲七海大洲图',
      w: 64, h: 36,
      ox: 4.0, oz: 1.2,
      hero: { x: state.heroPos.x, z: state.heroPos.z },
      pois: (state.world.nodes || []).map(nd => {
        const c = COORDS_3D[nd.id] || [0, 0];
        return { x: c[0], z: c[1], label: nd.id, type: nd.isSea ? 'sea' : 'plate' };
      }),
      npcs: (state.npcActors || []).map(a => ({ x: a.x, z: a.z })),
      beasts: (state.beastActors || []).map(b => ({ x: b.x, z: b.z }))
    };
  }

  const Map3D = { mount, dispose, moveToPlate, teleportToPlate, walkTo, toggleFly, setZoomPreset, setJoystick, triggerInteract, getMinimapData, COORDS_3D };
  if (typeof module !== 'undefined' && module.exports) module.exports = Map3D;
  root.Map3D = Map3D;
})(typeof window !== 'undefined' ? window : globalThis);
