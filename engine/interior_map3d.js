/* ============================================================================
 * 《沧溟界》v10.2.0 3A HD-2D 室内精细实景引擎 (engine/interior_map3d.js)
 * ----------------------------------------------------------------------------
 * 三层无缝空间的最内层：【洞府石室】 / 【仙缘茶馆】 / 【宗门大殿】
 * - 真实中式室内建筑细节：地砖/红毯/木地板、屏风字画、青铜丹炉、聚灵蒲团、
 *   高台掌门宝座、香炉青烟、红木茶桌、书架遗物供案、暖色摇曳烛火点光源
 * - 完整沿用 WASD / 点击地面行走 / E 交互 / 圆形罗盘小地图
 * ============================================================================ */
(function (root) {
  'use strict';

  let state = null;

  function makeFloorTex(roomType) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
    const ctx = cv.getContext('2d');
    if (roomType === 'cave') {
      ctx.fillStyle = '#242d33'; ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = 'rgba(111,211,168,0.22)'; ctx.lineWidth = 2;
      for (let i = 0; i <= 512; i += 64) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
      }
      // 中央八卦聚灵阵刻纹
      ctx.strokeStyle = 'rgba(111,211,168,0.65)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(256, 230, 92, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(256, 230, 56, 0, Math.PI * 2); ctx.stroke();
    } else if (roomType === 'teahouse') {
      ctx.fillStyle = '#4a3323'; ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 2;
      for (let y = 0; y < 512; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
      ctx.fillStyle = 'rgba(145,42,34,0.65)';
      ctx.fillRect(216, 120, 80, 392);
    } else {
      // sect_hall: 汉白玉地砖 + 中轴朱红御毯
      ctx.fillStyle = '#4b4944'; ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = 'rgba(212,184,122,0.2)'; ctx.lineWidth = 2;
      for (let i = 0; i <= 512; i += 64) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
      }
      ctx.fillStyle = '#7d201c'; ctx.fillRect(196, 40, 120, 472);
      ctx.strokeStyle = '#d4b87a'; ctx.lineWidth = 4; ctx.strokeRect(196, 40, 120, 472);
    }
    return new THREE.CanvasTexture(cv);
  }

  function makeLabel(title, sub, col) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 60;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, 'rgba(8,10,14,0)'); g.addColorStop(0.16, 'rgba(8,11,16,0.86)');
    g.addColorStop(0.84, 'rgba(8,11,16,0.86)'); g.addColorStop(1, 'rgba(8,10,14,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 6, 256, 48);
    ctx.strokeStyle = col || '#d4b87a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(28, 7); ctx.lineTo(228, 7); ctx.moveTo(28, 53); ctx.lineTo(228, 53); ctx.stroke();
    ctx.fillStyle = '#f6e7c1'; ctx.font = 'bold 20px "Songti SC",serif'; ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 10), 128, sub ? 30 : 38);
    if (sub) { ctx.fillStyle = '#9ff2cf'; ctx.font = '13px sans-serif'; ctx.fillText(sub.slice(0, 18), 128, 48); }
    const tex = new THREE.CanvasTexture(cv); tex.needsUpdate = true; return tex;
  }

  function makeChar(imgUrl, name, sub, tintHex) {
    const group = new THREE.Group();
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.48, 18), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false }));
    sh.rotateX(-Math.PI / 2); sh.position.y = 0.03; group.add(sh);

    const cv = document.createElement('canvas'); cv.width = 160; cv.height = 220;
    const ctx = cv.getContext('2d');
    const hexStr = '#' + tintHex.toString(16).padStart(6, '0');
    ctx.fillStyle = hexStr; ctx.beginPath(); ctx.moveTo(80, 62); ctx.lineTo(126, 205); ctx.lineTo(34, 205); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f5dec2'; ctx.beginPath(); ctx.arc(80, 44, 22, 0, Math.PI * 2); ctx.fill();
    const tex = new THREE.CanvasTexture(cv);
    if (imgUrl) {
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, 160, 220);
        const asp = img.width / img.height;
        let dw = 156, dh = 156 / asp;
        if (dh < 210) { dh = 210; dw = dh * asp; }
        ctx.drawImage(img, (160 - dw) / 2, 4, dw, dh);
        ctx.globalCompositeOperation = 'destination-in';
        const rad = ctx.createRadialGradient(80, 96, 36, 80, 108, 82);
        rad.addColorStop(0, 'rgba(255,255,255,1)'); rad.addColorStop(0.75, 'rgba(255,255,255,0.92)'); rad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = rad; ctx.fillRect(0, 0, 160, 220);
        ctx.globalCompositeOperation = 'source-over';
        tex.needsUpdate = true;
      };
      img.src = imgUrl;
    }
    const body = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    body.scale.set(1.5, 2.05, 1); body.position.y = 1.05; group.add(body);
    if (name) {
      const np = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeLabel(name, sub, hexStr), transparent: true, depthTest: false }));
      np.scale.set(2.3, 0.56, 1); np.position.y = 2.48; group.add(np);
    }
    return { group, body };
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

  function mount(container, world, hero, plate, roomType, opts) {
    dispose();
    if (!window.THREE || !container) return false;
    opts = opts || {};
    const THREE = window.THREE;
    const W = Math.max(480, container.clientWidth || window.innerWidth || 960);
    const H = Math.max(360, container.clientHeight || window.innerHeight || 640);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(roomType === 'cave' ? 0x091217 : 0x120d0a);
    scene.fog = new THREE.FogExp2(roomType === 'cave' ? 0x091217 : 0x120d0a, 0.022);

    const camera = new THREE.PerspectiveCamera(40, W / H, 0.3, 90);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = ''; container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(roomType === 'cave' ? 0x7cb8b0 : 0xd4a97d, 0.72));
    const mainLight = new THREE.PointLight(roomType === 'cave' ? 0x80f0cc : 0xffb86c, 1.8, 32);
    mainLight.position.set(0, 7, -1); scene.add(mainLight);

    const RW = 22, RH = 18;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(RW, RH),
      new THREE.MeshStandardMaterial({ map: makeFloorTex(roomType), roughness: 0.85 })
    );
    floor.rotation.x = -Math.PI / 2; scene.add(floor);

    // 三面古风室内墙壁（北墙 + 东西侧墙，南侧敞开方便镜头俯视）
    const wallMat = new THREE.MeshStandardMaterial({ color: roomType === 'cave' ? 0x26333a : 0x3b281d, roughness: 0.9 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(RW + 0.6, 5.5, 0.5), wallMat);
    backWall.position.set(0, 2.75, -RH / 2); scene.add(backWall);
    [-RW / 2, RW / 2].forEach(wx => {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.5, RH), wallMat);
      sw.position.set(wx, 2.75, 0); scene.add(sw);
    });

    // 朱红立柱 & 暖光烛台 + 北墙书法挂轴屏风
    const pMat = new THREE.MeshStandardMaterial({ color: 0x7d231d, roughness: 0.6 });
    const cMat = new THREE.MeshBasicMaterial({ color: 0xffb35c });
    [[-8, -7], [8, -7], [-8, 3], [8, 3]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 5.5, 8), pMat);
      col.position.set(px, 2.75, pz); scene.add(col);
      const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), cMat);
      flame.position.set(px + (px < 0 ? 0.65 : -0.65), 2.1, pz); scene.add(flame);
    });
    // 北墙中堂宣纸水墨挂轴
    const scrollCv = document.createElement('canvas'); scrollCv.width = 256; scrollCv.height = 128;
    const sctx = scrollCv.getContext('2d');
    sctx.fillStyle = '#d8ccb2'; sctx.fillRect(0, 0, 256, 128);
    sctx.strokeStyle = '#6b4a2b'; sctx.lineWidth = 8; sctx.strokeRect(4, 4, 248, 120);
    sctx.fillStyle = '#231f1b'; sctx.font = 'bold 42px "Songti SC","Kaiti SC",serif'; sctx.textAlign = 'center';
    sctx.fillText(roomType === 'cave' ? '道 法 自 然' : (roomType === 'teahouse' ? '清 茶 论 道' : '仙 门 正 统'), 128, 78);
    const scrollMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(scrollCv) }));
    scrollMesh.position.set(0, 3.2, -RH / 2 + 0.32); scene.add(scrollMesh);

    const interactables = [];
    const clickMeshes = [];
    const animProps = [];
    const poisForMini = [];

    const addPropPoi = (x, z, mesh, title, sub, type, data, col) => {
      mesh.position.set(x, 0, z);
      scene.add(mesh);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeLabel(title, sub, col), transparent: true, depthTest: false }));
      sp.scale.set(2.8, 0.68, 1); sp.position.set(x, 2.7, z);
      sp.userData = { interactIdx: interactables.length };
      scene.add(sp); clickMeshes.push(sp);
      poisForMini.push({ x, z, label: title, type });
      interactables.push({ type, id: type + '_' + x, label: `${title}`, sub, x, z: z + 1.1, obj: sp, data });
    };

    const roomTitles = { cave: '灵脉洞府·石室', teahouse: '仙缘茶馆·雅间', sect_hall: '宗门大殿·正堂' };

    if (roomType === 'cave') {
      // 1. 中央聚灵蒲团
      const cg = new THREE.Group();
      const cush = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.1, 0.25, 16), new THREE.MeshStandardMaterial({ color: 0xb8893c }));
      cush.position.y = 0.12; cg.add(cush);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.6, 28), new THREE.MeshBasicMaterial({ color: 0x6fd3a8, side: THREE.DoubleSide }));
      ring.rotateX(-Math.PI / 2); ring.position.y = 0.04; cg.add(ring); animProps.push(ring);
      addPropPoi(0, -1.5, cg, '聚灵蒲团·打坐', `洞府${hero.caveLv || 1}阶加成`, 'meditate', plate, '#6fd3a8');

      // 2. 左侧青铜炼丹炉
      const fg = new THREE.Group();
      const pot = new THREE.Mesh(new THREE.SphereGeometry(0.78, 12, 10), new THREE.MeshStandardMaterial({ color: 0x4b5c52, metalness: 0.7, roughness: 0.35 }));
      pot.position.y = 1.05; fg.add(pot);
      const fire = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), new THREE.MeshBasicMaterial({ color: 0xff7733 }));
      fire.position.y = 0.35; fg.add(fire); animProps.push(fire);
      addPropPoi(-6.2, -3.5, fg, '青铜炼丹炉', '开炉炼丹 / 锻造法宝', 'open_alchemy', plate, '#ff9d5c');

      // 3. 右侧遗物供案与功法书架
      const sg = new THREE.Group();
      const desk = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 1.0), new THREE.MeshStandardMaterial({ color: 0x5c3c28 }));
      desk.position.y = 0.55; sg.add(desk);
      const jade = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), new THREE.MeshBasicMaterial({ color: 0x7ef7d4 }));
      jade.position.set(0, 1.45, 0); sg.add(jade); animProps.push(jade);
      addPropPoi(6.2, -3.5, sg, '遗物供案·书架', '参悟功法 / 观想遗物稳道心', 'cave_relics', plate, '#70b8f0');
    } else if (roomType === 'teahouse') {
      // 说书高台 + 说书人
      const stg = new THREE.Group();
      const plat = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.5, 2.4), new THREE.MeshStandardMaterial({ color: 0x6b3e26 }));
      plat.position.y = 0.25; stg.add(plat);
      const teller = makeChar('assets/chars/elder.webp', '', '', 0xf2daa0);
      teller.group.position.set(0, 0.5, 0); stg.add(teller.group);
      addPropPoi(0, -5.2, stg, '听评书·打听史话', '知晓本世界真实1200年大事', 'teahouse', { plate }, '#f2daa0');

      // 茶客桌（放两张红木茶桌 + 一名散修茶客）
      [-5.8, 5.8].forEach((tx, idx) => {
        const tg = new THREE.Group();
        const tb = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 1.6), new THREE.MeshStandardMaterial({ color: 0x593622 }));
        tb.position.y = 0.42; tg.add(tb);
        if (idx === 0) {
          const ag = (world.agents || []).find(a => a.alive) || { id: 'a0', name: '青衫散修', realm: '炼气圆满' };
          const guest = makeChar('assets/chars/sister_full.webp', '', '', 0x70b8f0);
          guest.group.position.set(0, 0, -1.2); tg.add(guest.group);
          addPropPoi(tx, -1.5, tg, `结交【${ag.name}】`, `${ag.realm} · 煮茶论道`, 'npc', ag, '#70b8f0');
        } else {
          addPropPoi(tx, -1.5, tg, '灵茶雅座·小憩', '恢复气血与灵力', 'tea_rest', plate, '#6fd3a8');
        }
      });
    } else {
      // 宗门大殿：高台掌门宝座 + 议事玉碑
      const mainFac = (plate.holdings && plate.holdings.length) ? world.factions.find(f => f.id === plate.holdings[0].factionId) : null;
      const thg = new THREE.Group();
      const dais = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.7, 3.0), new THREE.MeshStandardMaterial({ color: 0x6b645c }));
      dais.position.y = 0.35; thg.add(dais);
      const chair = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 1.1), new THREE.MeshStandardMaterial({ color: 0x8c2820 }));
      chair.position.set(0, 1.7, -0.4); thg.add(chair);
      addPropPoi(0, -5.5, thg, mainFac ? `${mainFac.name}·掌门宝座` : '无主仙殿·立道统', mainFac ? '宗门事务 / 势力博弈' : '可在此开宗立派', 'sect_panel', { plate, fac: mainFac }, '#f2daa0');

      const bg = new THREE.Group();
      const stele = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.35), new THREE.MeshStandardMaterial({ color: 0x3b4a54 }));
      stele.position.y = 1.2; bg.add(stele);
      addPropPoi(-6.0, -2.0, bg, '宗门悬赏玉简', '查看本地制度与遗迹情报', 'open_world_tab', plate, '#6fd3a8');
    }

    // 南侧出口光门（返回城镇大街！）
    const exg = new THREE.Group();
    const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), new THREE.MeshBasicMaterial({ color: 0xf2daa0, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
    doorGlow.rotation.x = -Math.PI / 2; doorGlow.position.y = 0.04; exg.add(doorGlow);
    addPropPoi(0, 7.6, exg, '推门离开·返回大街', `回到【${plate.name}】实景`, 'exit_interior', plate, '#f2daa0');

    // 主角
    const heroPos = { x: 0, z: 5.5, tx: null, tz: null, facing: 1, walkPhase: 0 };
    const heroActor = makeChar('assets/chars/hero_full.webp', hero.masked ? hero.maskName : hero.name, hero.realm, 0x6fd3a8);
    heroActor.group.position.set(heroPos.x, 0, heroPos.z); scene.add(heroActor.group);

    const camState = { yaw: 0, pitch: 0.6, dist: 12.5, cx: 0, cz: 2.5 };
    const updateCam = () => {
      camera.position.set(
        camState.cx + Math.sin(camState.yaw) * Math.cos(camState.pitch) * camState.dist,
        Math.sin(camState.pitch) * camState.dist + 1.0,
        camState.cz + Math.cos(camState.yaw) * Math.cos(camState.pitch) * camState.dist
      );
      camera.lookAt(camState.cx, 1.0, camState.cz);
    };
    updateCam();

    const keys = {};
    let nearbyTarget = null, pendingInteract = null;
    const onKeyDown = e => {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      const k = e.key.toLowerCase(); keys[k] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
      if (k === 'e' && nearbyTarget && opts.onInteract) opts.onInteract(nearbyTarget);
    };
    const onKeyUp = e => { keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);

    const dom = renderer.domElement;
    const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
    const onClick = e => {
      if (e.button !== 0) return;
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hitEnt = raycaster.intersectObjects(clickMeshes);
      if (hitEnt.length) {
        const tg = interactables[hitEnt[0].object.userData.interactIdx];
        if (tg) {
          if (Math.hypot(tg.x - heroPos.x, tg.z - heroPos.z) < 3.2 && opts.onInteract) opts.onInteract(tg);
          else { heroPos.tx = tg.x; heroPos.tz = tg.z; pendingInteract = tg; }
          return;
        }
      }
      const hitF = raycaster.intersectObject(floor);
      if (hitF.length) {
        heroPos.tx = Math.max(-RW / 2 + 1.2, Math.min(RW / 2 - 1.2, hitF[0].point.x));
        heroPos.tz = Math.max(-RH / 2 + 1.5, Math.min(RH / 2 - 1.0, hitF[0].point.z));
        pendingInteract = null;
      }
    };
    const onResize = () => {
      if (!state) return;
      const nw = container.clientWidth || window.innerWidth, nh = container.clientHeight || window.innerHeight;
      camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
    };
    dom.addEventListener('click', onClick); window.addEventListener('resize', onResize);

    let lastTime = performance.now(), t = 0, proxTick = 0;
    const animate = now => {
      if (!state) return;
      state.raf = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now; t += dt;

      let ix = 0, iz = 0;
      if (keys.w || keys.arrowup) iz -= 1; if (keys.s || keys.arrowdown) iz += 1;
      if (keys.a || keys.arrowleft) ix -= 1; if (keys.d || keys.arrowright) ix += 1;
      let moving = false;
      if (Math.abs(ix) > 0.05 || Math.abs(iz) > 0.05) {
        heroPos.tx = null; heroPos.tz = null; pendingInteract = null;
        const len = Math.hypot(ix, iz); ix /= len; iz /= len;
        heroPos.x = Math.max(-RW / 2 + 1.2, Math.min(RW / 2 - 1.2, heroPos.x + ix * 5.6 * dt));
        heroPos.z = Math.max(-RH / 2 + 1.5, Math.min(RH / 2 - 1.0, heroPos.z + iz * 5.6 * dt));
        moving = true; if (Math.abs(ix) > 0.1) heroPos.facing = ix > 0 ? 1 : -1;
      } else if (heroPos.tx !== null) {
        const dx = heroPos.tx - heroPos.x, dz = heroPos.tz - heroPos.z, d = Math.hypot(dx, dz);
        if (d < (pendingInteract ? 2.2 : 0.25)) {
          heroPos.tx = null; heroPos.tz = null;
          if (pendingInteract && opts.onInteract) { const tg = pendingInteract; pendingInteract = null; opts.onInteract(tg); }
        } else {
          const step = Math.min(d, 5.6 * dt);
          heroPos.x += (dx / d) * step; heroPos.z += (dz / d) * step; moving = true;
          if (Math.abs(dx) > 0.05) heroPos.facing = dx > 0 ? 1 : -1;
        }
      }

      if (moving) heroPos.walkPhase += dt * 12;
      heroActor.group.position.set(heroPos.x, 0, heroPos.z);
      heroActor.body.position.y = 1.05 + (moving ? Math.abs(Math.sin(heroPos.walkPhase)) * 0.14 : 0);
      heroActor.body.scale.x = 1.5 * heroPos.facing;

      camState.cx += (heroPos.x * 0.45 - camState.cx) * Math.min(1, dt * 6);
      camState.cz += (heroPos.z * 0.45 - camState.cz) * Math.min(1, dt * 6);
      updateCam();

      animProps.forEach((p, i) => { p.rotation.y = t * (1.2 + i * 0.3); });

      proxTick += dt;
      if (proxTick >= 0.1) {
        proxTick = 0;
        let bestT = null, bestD = 3.2;
        for (let i = 0; i < interactables.length; i++) {
          const it = interactables[i];
          const d = Math.hypot(it.x - heroPos.x, it.z - heroPos.z);
          if (d < bestD) { bestD = d; bestT = it; }
        }
        if (bestT !== nearbyTarget) { nearbyTarget = bestT; if (opts.onNearbyChange) opts.onNearbyChange(bestT); }
      }
      renderer.render(scene, camera);
    };

    const cleanup = () => {
      window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
    };

    state = {
      renderer, scene, camera, raf: null, cleanup, heroPos, opts, RW, RH,
      roomTitle: roomTitles[roomType] || '室内', poisForMini,
      getNearby: () => nearbyTarget
    };
    animate(performance.now());
    return true;
  }

  function triggerInteract() { if (state && state.getNearby() && state.opts.onInteract) state.opts.onInteract(state.getNearby()); }
  function walkTo(x, z) { if (state) { state.heroPos.tx = Math.max(-state.RW / 2 + 1.2, Math.min(state.RW / 2 - 1.2, x)); state.heroPos.tz = Math.max(-state.RH / 2 + 1.5, Math.min(state.RH / 2 - 1.0, z)); } }
  function getMinimapData() {
    if (!state) return null;
    return {
      mode: 'local', title: state.roomTitle, w: state.RW, h: state.RH,
      hero: { x: state.heroPos.x, z: state.heroPos.z },
      pois: state.poisForMini, npcs: [], beasts: []
    };
  }

  const InteriorMap3D = { mount, dispose, triggerInteract, walkTo, getMinimapData };
  if (typeof module !== 'undefined' && module.exports) module.exports = InteriorMap3D;
  root.InteriorMap3D = InteriorMap3D;
})(typeof window !== 'undefined' ? window : globalThis);
