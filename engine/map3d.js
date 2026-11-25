/* ============================================================================
 * 《沧溟界》HD-2D / 2.5D Three.js 立体山海大地图引擎 (engine/map3d.js)
 * 真 3D 起伏地形山脉 + 沧溟动态海面 + 漂浮云海 + 2D 仙侠地标立牌(Billboard)
 * 支持鼠标拖拽平移/旋转、滚轮缩放、3D 射线点击板块交互（离线自动优雅降级）
 * ============================================================================ */
(function (root) {
  'use strict';

  // 24 板块 3D 世界坐标 [x (-22..22), z (-13..13), peakHeight, biome]
  const COORDS_3D = {
    N1: [-13.5, -9.2, 3.3, 'ice'],   N2: [-7.0, -9.0, 2.2, 'ice'],
    N3: [-16.0, -4.8, 2.8, 'ice'],   N4: [-8.0, -4.5, 1.5, 'ice'],

    C1: [-4.5,  0.2,  1.2, 'earth'], C2: [-10.0,  2.2, 0.9, 'earth'],
    C3: [ 1.2, -0.6,  2.4, 'earth'], C4: [-2.8,  4.8, 1.8, 'earth'],

    E1: [ 7.2, -2.5,  2.5, 'wood'],  E2: [12.0, -3.5, 1.4, 'wood'],
    E3: [12.8,  1.2,  2.1, 'wood'],  E4: [ 7.8,  2.4, 1.1, 'wood'],

    S1: [-3.8,  8.8,  1.6, 'fire'],  S2: [-9.8, 10.4, 3.6, 'volcano'],
    S3: [ 1.8, 10.6,  1.2, 'earth'], S4: [ 6.5,  9.2, 1.1, 'fire'],

    O1: [ 7.8,  6.0,  0.0, 'ocean'], O2: [11.8,  9.5, 0.0, 'ocean'],
    O3: [ 0.5, -7.2,  0.0, 'ocean'], O4: [15.5,  4.8, 0.2, 'ocean'],
    O5: [16.5,  9.2,  0.0, 'ocean'], O6: [19.8,  6.2, 0.0, 'ocean'],

    Y1: [21.5,  0.5,  1.7, 'island'], Y2: [22.0, -4.5, 3.2, 'island']
  };

  const CHOKE_KEYS = new Set(['E1-C3', 'C3-E1', 'S1-C4', 'C4-S1', 'N4-C1', 'C1-N4']);

  let state = null;

  function heightAt(x, z) {
    let h = -0.65; // 海床基准
    for (const id in COORDS_3D) {
      const [cx, cz, peak, biome] = COORDS_3D[id];
      if (biome === 'ocean' && peak <= 0.1) continue;
      const dx = x - cx, dz = z - cz;
      const dist2 = dx * dx + dz * dz;
      const rad = biome === 'volcano' ? 7.5 : (biome === 'island' ? 6.5 : 11.5);
      const contrib = (peak + 0.65) * Math.exp(-dist2 / rad);
      if (contrib - 0.65 > h) h = contrib - 0.65;
    }
    // 细腻山脊纹理起伏
    if (h > 0.05) {
      h += Math.sin(x * 0.9) * Math.cos(z * 0.9) * 0.18 + Math.sin(x * 2.1 + z * 1.7) * 0.06;
    }
    return h;
  }

  function makeBillboardTexture(nd, isHere, isSel, hasRuin, hasInst) {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 112;
    const ctx = cv.getContext('2d');

    // 仙侠古玉牌匾底框
    ctx.fillStyle = isSel ? 'rgba(34,26,12,0.95)' : (isHere ? 'rgba(12,38,30,0.94)' : 'rgba(10,15,22,0.88)');
    ctx.strokeStyle = isSel ? '#ffffff' : (isHere ? '#6fd3a8' : (nd.sha >= 55 ? '#e06258' : '#d4b87a'));
    ctx.lineWidth = isSel ? 5 : 3;
    ctx.beginPath();
    ctx.roundRect(8, 12, 240, 74, 10);
    ctx.fill();
    ctx.stroke();

    // 顶部徽记（📍 / 🗝️ / ⚖️）
    let badges = '';
    if (isHere) badges += '📍';
    if (hasRuin) badges += '🗝️';
    if (hasInst) badges += '⚖️';
    if (nd.sha >= 55) badges += '🔥';

    ctx.fillStyle = isSel ? '#ffffff' : '#f2daa0';
    ctx.font = 'bold 26px "Songti SC", "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${badges}${nd.name.slice(0, 7)}`, 128, 46);

    ctx.fillStyle = nd.sha >= 55 ? '#ffaaa3' : '#9ff2cf';
    ctx.font = '18px sans-serif';
    ctx.fillText(`${nd.id} · 脉${nd.leyline} 矿${nd.mineral} 暗${nd.darkForestIdx || 0}`, 128, 74);

    // 底部指示尖角
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(118, 86); ctx.lineTo(138, 86); ctx.lineTo(128, 106);
    ctx.closePath(); ctx.fill();

    const tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;
    return tex;
  }

  function dispose() {
    if (!state) return;
    if (state.raf) cancelAnimationFrame(state.raf);
    if (state.renderer) {
      state.renderer.dispose();
      if (state.renderer.domElement && state.renderer.domElement.parentNode) {
        state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
      }
    }
    state = null;
  }

  function mount(container, world, hero, selectedPlateId, onSelectPlate) {
    dispose();
    if (!window.THREE || !container) return false;
    const THREE = window.THREE;
    const W = Math.max(480, container.clientWidth || 720);
    const H = Math.max(360, container.clientHeight || 430);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070d16);
    scene.fog = new THREE.FogExp2(0x091320, 0.0145);

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.5, 160);
    const camState = { yaw: 0.06, pitch: 0.78, dist: 36, tx: 3.5, tz: 1.5 };
    const updateCam = () => {
      camera.position.set(
        camState.tx + Math.sin(camState.yaw) * Math.cos(camState.pitch) * camState.dist,
        Math.sin(camState.pitch) * camState.dist,
        camState.tz + Math.cos(camState.yaw) * Math.cos(camState.pitch) * camState.dist
      );
      camera.lookAt(camState.tx, 0.4, camState.tz);
    };
    updateCam();

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 灯光（冷月环境光 + 金暖太阳斜照，营造 HD-2D 山海立体光影）
    scene.add(new THREE.AmbientLight(0x88a8c8, 0.72));
    const sun = new THREE.DirectionalLight(0xffe6ba, 1.15);
    sun.position.set(18, 28, 14);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x4b8ec8, 0.45);
    rim.position.set(-22, 14, -18);
    scene.add(rim);

    // 1. 真 3D 起伏地形网格（110 × 68 顶点高度图 + 气候生物群系顶点着色）
    const tGeo = new THREE.PlaneGeometry(54, 30, 110, 68);
    tGeo.rotateX(-Math.PI / 2);
    const pos = tGeo.attributes.position;
    const colors = [];
    const cTmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i) + 3.5;
      const vz = pos.getZ(i) + 1.0;
      const vy = heightAt(vx, vz);
      pos.setXYZ(i, vx, vy, vz);

      // 根据坐标与高度着色（冰原白蓝 / 火山暗红 / 青木翠绿 / 中原苍玉 / 彼岸玄紫）
      if (vy <= 0.02) cTmp.setHex(0x0c2438);
      else if (vx > 18.5) cTmp.setHex(vy > 2.0 ? 0x6f5499 : 0x3b486e); // 彼岸孤岛
      else if (vz < -3.0 && vx < 2.0) cTmp.setHex(vy > 1.9 ? 0xdbeeff : 0x6988a3); // 北陆冰原
      else if (vz > 6.5 && vx < 8.5) cTmp.setHex(vy > 2.2 ? 0xc4492b : 0x6b3a2b); // 南陆火山
      else if (vx > 4.5 && vz < 5.0) cTmp.setHex(vy > 1.8 ? 0x3d7d60 : 0x265442); // 东陆青木
      else cTmp.setHex(vy > 1.6 ? 0x8c7b52 : 0x4c5e42); // 中陆沃野
      colors.push(cTmp.r, cTmp.g, cTmp.b);
    }
    tGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    tGeo.computeVertexNormals();
    const terrain = new THREE.Mesh(
      tGeo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0.08, flatShading: true })
    );
    scene.add(terrain);

    // 2. 动态沧溟大洋海面
    const seaGeo = new THREE.PlaneGeometry(66, 40, 42, 28);
    seaGeo.rotateX(-Math.PI / 2);
    const seaMat = new THREE.MeshStandardMaterial({
      color: 0x0d3659, transparent: true, opacity: 0.84, roughness: 0.25, metalness: 0.35
    });
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.position.set(3.5, 0.08, 1.0);
    scene.add(sea);

    // 3. 3D 空间连线（普通陆路 / 咽喉关隘金红拱桥 / 沧溟海路航道）
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
        const y1 = Math.max(0.25, heightAt(p1[0], p1[1]) + 0.25);
        const y2 = Math.max(0.25, heightAt(p2[0], p2[1]) + 0.25);
        const midY = Math.max(y1, y2) + (isChoke ? 1.4 : (isSeaEdge ? 0.5 : 0.7));
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(p1[0], y1, p1[1]),
          new THREE.Vector3((p1[0] + p2[0]) / 2, midY, (p1[1] + p2[1]) / 2),
          new THREE.Vector3(p2[0], y2, p2[1])
        );
        const pts = curve.getPoints(18);
        const lGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const col = isChoke ? 0xffa64d : (isSeaEdge ? (world.seaTechUnlocked ? 0x70b8f0 : 0x26445e) : 0xd4b87a);
        const lMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: isChoke ? 0.95 : (isSeaEdge && !world.seaTechUnlocked ? 0.35 : 0.65) });
        scene.add(new THREE.Line(lGeo, lMat));
      });
    });

    // 4. HD-2D 24 处仙侠地标立牌 (Billboard Sprites) + 底座光柱
    const sprites = [];
    world.nodes.forEach(nd => {
      const c3 = COORDS_3D[nd.id];
      if (!c3) return;
      const baseH = Math.max(0.22, heightAt(c3[0], c3[1]));
      const isHere = hero && hero.locId === nd.id;
      const isSel = selectedPlateId === nd.id;
      const hasRuin = (world.ruins || []).some(r => r.plateId === nd.id);
      const hasInst = (world.institutions || []).some(i => i.plateId === nd.id && i.status !== 'abolished');

      // 地面灵气光环底座
      const ringGeo = new THREE.RingGeometry(0.45, 0.72, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSel ? 0xffffff : (isHere ? 0x6fd3a8 : (nd.sha >= 55 ? 0xe06258 : 0xd4b87a)),
        side: THREE.DoubleSide, transparent: true, opacity: 0.9
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(c3[0], baseH + 0.12, c3[1]);
      scene.add(ring);

      // HD-2D 朝向镜头的牌匾立牌
      const tex = makeBillboardTexture(nd, isHere, isSel, hasRuin, hasInst);
      const spMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
      const sp = new THREE.Sprite(spMat);
      sp.scale.set(isSel ? 5.2 : 4.3, isSel ? 2.25 : 1.88, 1);
      sp.position.set(c3[0], baseH + 1.65, c3[1]);
      sp.userData = { plateId: nd.id };
      scene.add(sp);
      sprites.push(sp);
    });

    // 5. 漂浮仙侠云海粒子
    const clouds = [];
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xdbe9f6, transparent: true, opacity: 0.16, depthWrite: false });
    const cloudGeo = new THREE.SphereGeometry(2.4, 10, 8);
    cloudGeo.scale(2.2, 0.25, 1.3);
    for (let i = 0; i < 14; i++) {
      const cl = new THREE.Mesh(cloudGeo, cloudMat);
      cl.position.set(-18 + Math.random() * 44, 4.2 + Math.random() * 2.2, -11 + Math.random() * 22);
      scene.add(cl);
      clouds.push(cl);
    }

    // 6. 鼠标拖拽平移/旋转 + 滚轮缩放 + 3D 射线点击板块
    const dom = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let dragging = false, moved = false, lx = 0, ly = 0;

    dom.addEventListener('pointerdown', e => {
      dragging = true; moved = false; lx = e.clientX; ly = e.clientY;
    });
    window.addEventListener('pointermove', e => {
      if (!dragging || !state) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      lx = e.clientX; ly = e.clientY;
      if (e.buttons === 2 || e.shiftKey) {
        camState.yaw -= dx * 0.006;
        camState.pitch = Math.max(0.35, Math.min(1.35, camState.pitch + dy * 0.005));
      } else {
        camState.tx = Math.max(-14, Math.min(20, camState.tx - dx * 0.045));
        camState.tz = Math.max(-10, Math.min(12, camState.tz - dy * 0.045));
      }
      updateCam();
    });
    window.addEventListener('pointerup', () => { dragging = false; });
    dom.addEventListener('contextmenu', e => e.preventDefault());
    dom.addEventListener('wheel', e => {
      e.preventDefault();
      camState.dist = Math.max(14, Math.min(54, camState.dist + e.deltaY * 0.025));
      updateCam();
    }, { passive: false });

    dom.addEventListener('click', e => {
      if (moved) return;
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(sprites);
      if (hits.length && hits[0].object.userData.plateId && onSelectPlate) {
        onSelectPlate(hits[0].object.userData.plateId);
      }
    });

    // 7. 动画循环（海面波光 + 云海缓缓漂移）
    let t = 0;
    const animate = () => {
      if (!state) return;
      state.raf = requestAnimationFrame(animate);
      t += 0.015;
      sea.position.y = 0.08 + Math.sin(t) * 0.04;
      clouds.forEach((c, idx) => {
        c.position.x += 0.012 + (idx % 3) * 0.004;
        if (c.position.x > 28) c.position.x = -22;
      });
      renderer.render(scene, camera);
    };

    state = { renderer, scene, camera, raf: null };
    animate();
    return true;
  }

  const Map3D = { mount, dispose, COORDS_3D };
  if (typeof module !== 'undefined' && module.exports) module.exports = Map3D;
  root.Map3D = Map3D;
})(typeof window !== 'undefined' ? window : globalThis);
