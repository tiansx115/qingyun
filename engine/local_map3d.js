/* ============================================================================
 * 《沧溟界》v10.0.0 3A HD-2D 实景山海城镇 + 饥荒风无缝即时战斗引擎 (engine/local_map3d.js)
 * ----------------------------------------------------------------------------
 * - 360° 远景水墨层峦远山环 + 动态波光灵溪与荷叶 + 真实拱形石木桥 + 高空盘旋白鹤群
 * - 重檐翘角中式仙侠建筑（石阶/朱柱/雕花暖窗/双层飞檐/鎏金宝顶/随风飘动竖幡旗）
 * - 三层叠叶古松与灵花树 + 中央广场太极灵阵与摇曳青铜火盆 + 昼/暮/夜实时光影
 * - 饥荒风无缝即时战斗（红圈前摇闪避 / 3D剑气天雷灵盾特效 / 实时冷却遥测）
 * ============================================================================ */
(function (root) {
  'use strict';

  let state = null;

  function makeGroundTexture(biome) {
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 1024;
    const ctx = cv.getContext('2d');
    const pal = {
      ice:     { base: '#adc5d8', grass: '#92afc4', road: '#6f7b87', border: '#d8e8f5', bank: '#7b8d9c' },
      volcano: { base: '#45302a', grass: '#59392d', road: '#6b5950', border: '#9c6b4e', bank: '#3b251f' },
      fire:    { base: '#574133', grass: '#6b4e39', road: '#7b6856', border: '#aa8f6c', bank: '#4a362a' },
      wood:    { base: '#2f4c38', grass: '#253f2d', road: '#7a7261', border: '#b0a287', bank: '#524b3f' },
      island:  { base: '#38425e', grass: '#2d354f', road: '#726f80', border: '#a89fc4', bank: '#4b475c' },
      ocean:   { base: '#2c4c5e', grass: '#223f50', road: '#7c7462', border: '#b8aa8c', bank: '#544e41' },
      earth:   { base: '#43543a', grass: '#36452e', road: '#827762', border: '#b8a98a', bank: '#595143' }
    }[biome] || { base: '#43543a', grass: '#36452e', road: '#827762', border: '#b8a98a', bank: '#595143' };

    ctx.fillStyle = pal.base;
    ctx.fillRect(0, 0, 1024, 1024);

    // 细腻水墨地皮层次与草木斑块
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = i % 3 === 0 ? pal.grass : (i % 3 === 1 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)');
      ctx.beginPath();
      ctx.arc((i * 197) % 1024, (i * 353) % 1024, 10 + (i % 30), 0, Math.PI * 2);
      ctx.fill();
    }

    // 灵溪石砌河岸（水面由独立动态透明网格渲染）
    ctx.fillStyle = pal.bank;
    ctx.fillRect(0, 704, 1024, 114);
    ctx.fillStyle = biome === 'volcano' ? '#6e2310' : '#103447';
    ctx.fillRect(0, 718, 1024, 86);

    // 青石板十字御道（带错缝砖纹与金玉镶边）
    const drawStoneRoad = (x, y, w, h) => {
      ctx.fillStyle = pal.road; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = pal.border; ctx.lineWidth = 5; ctx.strokeRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1.5;
      for (let gy = y; gy < y + h; gy += 24) {
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
        const off = ((gy / 24) % 2) * 14;
        for (let gx = x + off; gx < x + w; gx += 28) {
          ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, Math.min(y + h, gy + 24)); ctx.stroke();
        }
      }
    };
    drawStoneRoad(454, 68, 116, 892);
    drawStoneRoad(76, 444, 872, 102);

    // 中央八角太极灵阵广场
    ctx.save();
    ctx.translate(512, 495);
    ctx.fillStyle = pal.road;
    ctx.beginPath(); ctx.arc(0, 0, 122, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d4b87a'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = 'rgba(111,211,168,0.55)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 92, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 52, 0, Math.PI * 2); ctx.stroke();
    // 八卦方位射线
    ctx.strokeStyle = 'rgba(212,184,122,0.35)'; ctx.lineWidth = 2;
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 52, Math.sin(a) * 52); ctx.lineTo(Math.cos(a) * 92, Math.sin(a) * 92); ctx.stroke();
    }
    ctx.restore();

    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    return tex;
  }

  // 雅致细长古风半透明匾额（彻底告别巨大蓝方框！）
  function makeSlimLabel(title, sub, accentHex) {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 64;
    const ctx = cv.getContext('2d');
    const grd = ctx.createLinearGradient(0, 0, 256, 0);
    grd.addColorStop(0, 'rgba(8,10,14,0)');
    grd.addColorStop(0.16, 'rgba(8,11,16,0.82)');
    grd.addColorStop(0.84, 'rgba(8,11,16,0.82)');
    grd.addColorStop(1, 'rgba(8,10,14,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 8, 256, 48);

    ctx.strokeStyle = accentHex || 'rgba(212,184,122,0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(32, 9); ctx.lineTo(224, 9);
    ctx.moveTo(32, 55); ctx.lineTo(224, 55);
    ctx.stroke();

    ctx.fillStyle = '#f5e6c4';
    ctx.font = 'bold 21px "Songti SC","Noto Serif SC",serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 10), 128, sub ? 32 : 40);
    if (sub) {
      ctx.fillStyle = '#a8d9c4';
      ctx.font = '13px sans-serif';
      ctx.fillText(sub.slice(0, 18), 128, 50);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;
    return tex;
  }

  function makeHpBarTexture(hp, maxHp, name) {
    const cv = document.createElement('canvas');
    cv.width = 220; cv.height = 50;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = 'rgba(10,12,18,0.82)';
    ctx.beginPath(); ctx.roundRect(12, 4, 196, 42, 6); ctx.fill();
    ctx.fillStyle = '#ffd0c7';
    ctx.font = 'bold 16px "Songti SC",serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${name} ${Math.max(0, Math.round(hp))}/${maxHp}`, 110, 22);
    ctx.fillStyle = '#241418'; ctx.fillRect(22, 29, 176, 10);
    const pct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
    ctx.fillStyle = pct > 0.35 ? '#d94c42' : '#ff9138';
    ctx.fillRect(22, 29, Math.round(176 * pct), 10);
    ctx.strokeStyle = 'rgba(212,184,122,0.75)'; ctx.lineWidth = 1.2;
    ctx.strokeRect(22, 29, 176, 10);
    const tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;
    return tex;
  }

  function makeBubbleTexture(text) {
    const cv = document.createElement('canvas');
    cv.width = 320; cv.height = 58;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = 'rgba(10,13,18,0.88)';
    ctx.strokeStyle = 'rgba(212,184,122,0.75)';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.roundRect(8, 6, 304, 42, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f8ecd0';
    ctx.font = '16px "Songti SC","Noto Serif SC",serif';
    ctx.textAlign = 'center';
    ctx.fillText(text.slice(0, 17), 160, 33);
    const tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;
    return tex;
  }

  // 柔和贴地接触阴影贴图（零性能损耗让建筑/树木扎实落地！）
  let _softShadowTex = null;
  function getSoftShadowTex() {
    if (_softShadowTex) return _softShadowTex;
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 12, 64, 64, 62);
    g.addColorStop(0, 'rgba(0,0,0,0.52)');
    g.addColorStop(0.65, 'rgba(0,0,0,0.22)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    _softShadowTex = new THREE.CanvasTexture(cv);
    return _softShadowTex;
  }

  // 构建真实中式横脊歇山顶（正脊横梁 + 前后坡面 + 鎏金鸱吻 + 四角翘起飞檐）
  function buildChineseRoof(w, d, roofHex) {
    const g = new THREE.Group();
    const rMat = new THREE.MeshStandardMaterial({ color: roofHex || 0x1e3345, roughness: 0.48, metalness: 0.24 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xe2be6b, metalness: 0.78, roughness: 0.28 });
    const eaveW = w + 1.4, eaveD = d + 1.25;
    const slopeLen = eaveD * 0.58;
    const slopeH = 1.05;

    // 屋檐下深色斗拱木椽阴影带
    const soffit = new THREE.Mesh(new THREE.BoxGeometry(eaveW - 0.15, 0.22, eaveD - 0.15), new THREE.MeshStandardMaterial({ color: 0x2b1d17, roughness: 0.88 }));
    soffit.position.y = 0.08; g.add(soffit);

    // 前后坡面黛瓦屋顶
    const slopeGeo = new THREE.BoxGeometry(eaveW, 0.14, slopeLen);
    const frontSlope = new THREE.Mesh(slopeGeo, rMat);
    frontSlope.position.set(0, slopeH * 0.56, eaveD * 0.24);
    frontSlope.rotation.x = 0.44;
    g.add(frontSlope);

    const backSlope = new THREE.Mesh(slopeGeo, rMat);
    backSlope.position.set(0, slopeH * 0.56, -eaveD * 0.24);
    backSlope.rotation.x = -0.44;
    g.add(backSlope);

    // 两侧山墙封顶三角楔（用梯形盒填充）
    const core = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, slopeH * 0.78, d * 0.65), rMat);
    core.position.y = slopeH * 0.48; g.add(core);

    // 横向鎏金正脊横梁 + 左右上翘鸱吻兽首
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(eaveW * 0.92, 0.2, 0.24), goldMat);
    ridge.position.y = slopeH + 0.06; g.add(ridge);
    [-eaveW * 0.46, eaveW * 0.46].forEach(rx => {
      const chiwen = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.26), goldMat);
      chiwen.position.set(rx, slopeH + 0.24, 0);
      chiwen.rotation.z = rx > 0 ? -0.35 : 0.35;
      g.add(chiwen);
    });

    // 四角微微上翘的飞檐翼角
    const cornerGeo = new THREE.BoxGeometry(0.55, 0.1, 0.55);
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => {
      const tip = new THREE.Mesh(cornerGeo, rMat);
      tip.position.set(sx * (eaveW * 0.48), 0.32, sz * (eaveD * 0.46));
      tip.rotation.z = sx * 0.38;
      tip.rotation.x = -sz * 0.32;
      g.add(tip);
    });
    return g;
  }

  // 3A 重檐歇山顶中式仙侠殿阁（石阶/朱柱/雕花暖窗/双层横脊飞檐/飘动竖幡旗/贴地接触阴影）
  function buildGrandHall(w, h, d, roofHex, wallHex, bannerColor, flagsOut) {
    const g = new THREE.Group();
    // 贴地柔和接触阴影
    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 3.4, d + 3.2),
      new THREE.MeshBasicMaterial({ map: getSoftShadowTex(), transparent: true, depthWrite: false })
    );
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02; g.add(sh);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x737069, roughness: 0.9 });
    const base1 = new THREE.Mesh(new THREE.BoxGeometry(w + 1.1, 0.32, d + 1.1), stoneMat);
    base1.position.y = 0.16; g.add(base1);
    const base2 = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.26, d + 0.5), stoneMat);
    base2.position.y = 0.45; g.add(base2);
    for (let s = 0; s < 3; s++) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(2.2 + s * 0.2, 0.16, 0.45), stoneMat);
      st.position.set(0, 0.48 - s * 0.16, d / 2 + 0.45 + s * 0.32); g.add(st);
    }

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: wallHex || 0xd8cdb8, roughness: 0.82 }));
    body.position.y = 0.58 + h / 2; g.add(body);

    const pMat = new THREE.MeshStandardMaterial({ color: 0x8a241e, roughness: 0.55 });
    const pGeo = new THREE.CylinderGeometry(0.11, 0.13, h + 0.08, 8);
    [[-w/2, d/2+0.12], [-w/5, d/2+0.12], [w/5, d/2+0.12], [w/2, d/2+0.12], [-w/2, -d/2], [w/2, -d/2]].forEach(([px, pz]) => {
      const p = new THREE.Mesh(pGeo, pMat); p.position.set(px, 0.58 + h / 2, pz); g.add(p);
    });

    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffe09a });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.35, Math.min(1.85, h * 0.76)), glowMat);
    door.position.set(0, 0.58 + Math.min(1.85, h * 0.76) / 2, d / 2 + 0.02); g.add(door);
    [-w * 0.34, w * 0.34].forEach(wx => {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.95), glowMat);
      win.position.set(wx, 0.58 + h * 0.55, d / 2 + 0.02); g.add(win);
    });

    // 一层宽大歇山顶
    const roof1 = buildChineseRoof(w, d, roofHex);
    roof1.position.y = 0.58 + h;
    g.add(roof1);

    // 二层重檐楼阁 + 横脊歇山顶
    const upperWall = new THREE.Mesh(new THREE.BoxGeometry(w * 0.64, h * 0.42, d * 0.64), new THREE.MeshStandardMaterial({ color: 0x6e241e, roughness: 0.7 }));
    upperWall.position.y = 0.58 + h + 1.12; g.add(upperWall);
    const roof2 = buildChineseRoof(w * 0.64, d * 0.64, roofHex);
    roof2.position.y = 0.58 + h + 1.38;
    g.add(roof2);

    // 檐角红灯笼
    const lMat = new THREE.MeshBasicMaterial({ color: 0xff7043 });
    [-w * 0.38, w * 0.38].forEach(lx => {
      const lan = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8), lMat);
      lan.position.set(lx, 0.58 + h - 0.1, d / 2 + 0.42); g.add(lan);
    });

    if (bannerColor) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.6, 6), pMat);
      pole.position.set(w / 2 + 0.65, 1.8, d / 2 + 0.35); g.add(pole);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1.85), new THREE.MeshStandardMaterial({ color: bannerColor, side: THREE.DoubleSide, roughness: 0.7 }));
      flag.position.set(w / 2 + 1.0, 2.55, d / 2 + 0.35); g.add(flag);
      if (flagsOut) flagsOut.push(flag);
    }
    return g;
  }

  // 三层叠叶仙侠古松/灵花树（带贴地柔和树荫）
  function buildLayeredTree(biome, isBlossom) {
    const g = new THREE.Group();
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), new THREE.MeshBasicMaterial({ map: getSoftShadowTex(), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02; g.add(sh);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 1.35, 6), new THREE.MeshStandardMaterial({ color: 0x4a3425, roughness: 0.92 }));
    tr.position.y = 0.68; g.add(tr);
    const leafCol = isBlossom ? 0xd98ca3
      : (biome === 'ice' ? 0xb8d4e8 : (biome === 'volcano' ? 0x6e3a28 : 0x22543d));
    const lfMat = new THREE.MeshStandardMaterial({ color: leafCol, roughness: 0.85, flatShading: true });
    [
      { r: 1.15, h: 1.3, y: 1.55 },
      { r: 0.92, h: 1.2, y: 2.35 },
      { r: 0.62, h: 1.0, y: 3.05 }
    ].forEach((tier, idx) => {
      const c = new THREE.Mesh(new THREE.ConeGeometry(tier.r, tier.h, 7), lfMat);
      c.position.y = tier.y; c.rotation.y = idx * 0.7; g.add(c);
    });
    return g;
  }

  // 青铜火盆（广场氛围灯火）
  function buildBrazier(flamesOut) {
    const g = new THREE.Group();
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.85, 8), new THREE.MeshStandardMaterial({ color: 0x3c4540, metalness: 0.6, roughness: 0.5 }));
    stand.position.y = 0.42; g.add(stand);
    const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), new THREE.MeshBasicMaterial({ color: 0xff8c38 }));
    flame.position.y = 1.05; g.add(flame);
    if (flamesOut) flamesOut.push(flame);
    return g;
  }

  function buildLanternPost() {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.7, 6), new THREE.MeshStandardMaterial({ color: 0x4d3426 }));
    pole.position.y = 1.35;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.08), new THREE.MeshStandardMaterial({ color: 0x4d3426 }));
    arm.position.set(0.28, 2.65, 0);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffb35c }));
    orb.position.set(0.55, 2.4, 0);
    g.add(pole, arm, orb);
    return g;
  }

  function buildMarketStall(awningHex) {
    const g = new THREE.Group();
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.72, 1.0), new THREE.MeshStandardMaterial({ color: 0x7a5638 }));
    table.position.y = 0.36;
    const awning = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.14, 1.35), new THREE.MeshStandardMaterial({ color: awningHex || 0x9c3229 }));
    awning.position.set(0, 1.88, 0); awning.rotation.x = 0.18;
    const pGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.88, 6);
    const pMat = new THREE.MeshStandardMaterial({ color: 0x523926 });
    [[-1.05,-0.45],[1.05,-0.45],[-1.05,0.45],[1.05,0.45]].forEach(([px, pz]) => {
      const p = new THREE.Mesh(pGeo, pMat); p.position.set(px, 0.94, pz); g.add(p);
    });
    g.add(table, awning);
    return g;
  }

  function buildArchway() {
    const g = new THREE.Group();
    const pMat = new THREE.MeshStandardMaterial({ color: 0x7d2922, roughness: 0.6 });
    const rMat = new THREE.MeshStandardMaterial({ color: 0x1e3345, roughness: 0.5 });
    [-2.2, 2.2].forEach(px => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 3.8, 8), pMat);
      col.position.set(px, 1.9, 0); g.add(col);
    });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.48, 0.52), pMat); beam.position.set(0, 3.35, 0);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.38, 1.35), rMat); roof.position.set(0, 3.82, 0);
    g.add(beam, roof);
    return g;
  }

  function makeHumanSprite(imgUrl, name, sub, tintHex, scaleW, scaleH, isHostile) {
    const group = new THREE.Group();
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.52, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false }));
    sh.rotateX(-Math.PI / 2); sh.position.y = 0.03; group.add(sh);

    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.56, 24), new THREE.MeshBasicMaterial({ color: tintHex, side: THREE.DoubleSide, transparent: true, opacity: 0.78 }));
    ring.rotateX(-Math.PI / 2); ring.position.y = 0.05; group.add(ring);

    const cv = document.createElement('canvas'); cv.width = 160; cv.height = 220;
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
        const aspect = img.width / img.height;
        let dw = 156, dh = 156 / aspect;
        if (dh < 210) { dh = 210; dw = dh * aspect; }
        ctx.drawImage(img, (160 - dw) / 2, 4, dw, dh);
        // 柔和边缘与底部水墨羽化融合（告别粗边框椭圆棋子！）
        ctx.globalCompositeOperation = 'destination-in';
        const rad = ctx.createRadialGradient(80, 96, 36, 80, 108, 82);
        rad.addColorStop(0, 'rgba(255,255,255,1)');
        rad.addColorStop(0.72, 'rgba(255,255,255,0.92)');
        rad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = rad;
        ctx.fillRect(0, 0, 160, 220);
        ctx.globalCompositeOperation = 'source-over';
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
      hpSprite.scale.set(2.3, 0.54, 1);
      hpSprite.position.y = (scaleH || 1.8) + 0.42;
      group.add(hpSprite);
    } else if (name) {
      const np = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeSlimLabel(name, sub, hexStr), transparent: true, depthTest: false }));
      np.scale.set(2.35, 0.6, 1);
      np.position.y = (scaleH || 2.05) + 0.46;
      group.add(np);
    }

    const bubbleSp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false, opacity: 0 }));
    bubbleSp.scale.set(3.3, 0.62, 1);
    bubbleSp.position.y = (scaleH || 2.05) + 1.15;
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
    const skyMap = { ice: 0x1a2d42, volcano: 0x26130f, wood: 0x132626, island: 0x181830 };
    const baseSky = skyMap[plate.biome] || 0x152536;
    scene.background = new THREE.Color(baseSky);
    scene.fog = new THREE.FogExp2(baseSky, 0.0125);

    const camera = new THREE.PerspectiveCamera(38, W / H, 0.3, 180);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (THREE.ACESFilmicToneMapping !== undefined) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
    }
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 360° 电影级水墨渐变天空穹顶（随昼/暮/夜实时切换，告别单色纯背景！）
    const makeSkyTex = (topCol, midCol, botCol) => {
      const scv = document.createElement('canvas'); scv.width = 16; scv.height = 256;
      const sctx = scv.getContext('2d');
      const g = sctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, topCol); g.addColorStop(0.52, midCol); g.addColorStop(1, botCol);
      sctx.fillStyle = g; sctx.fillRect(0, 0, 16, 256);
      return new THREE.CanvasTexture(scv);
    };
    const skyTexDay = makeSkyTex('#162c44', '#2a4d5c', '#5b7876');
    const skyTexDusk = makeSkyTex('#181326', '#5e2f2e', '#c96f3b');
    const skyTexNight = makeSkyTex('#050812', '#0b1629', '#16283b');
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTexDay, side: THREE.BackSide, fog: false, depthWrite: false });
    const skyDome = new THREE.Mesh(new THREE.SphereGeometry(125, 24, 14), skyMat);
    scene.add(skyDome);

    const ambient = new THREE.AmbientLight(0xbfd2e8, 0.88);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffe9c2, 1.2);
    sun.position.set(18, 30, 20);
    scene.add(sun);

    const nightLights = [];
    const addNightLight = (x, y, z, col, dist) => {
      const pl = new THREE.PointLight(col || 0xffaa55, 0.25, dist || 14);
      pl.position.set(x, y, z); scene.add(pl); nightLights.push(pl);
    };

    // 1. 360° 远景水墨层峦远山环（彻底消除“地图悬在黑虚空”！）
    const mtnColor = plate.biome === 'ice' ? 0x5c7a94 : (plate.biome === 'volcano' ? 0x3b221c : 0x1f3640);
    const mtnMat = new THREE.MeshStandardMaterial({ color: mtnColor, roughness: 0.95, flatShading: true });
    for (let i = 0; i < 28; i++) {
      const ang = (i / 28) * Math.PI * 2;
      const rad = 36 + (i % 3) * 7;
      const h = 11 + (i % 5) * 4.5;
      const r = 8 + (i % 4) * 2.5;
      const peak = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), mtnMat);
      peak.position.set(Math.cos(ang) * rad, h * 0.42 - 1.5, Math.sin(ang) * rad);
      peak.rotation.y = i * 1.1;
      scene.add(peak);
    }

    // 2. 无缝外延山谷地皮（180×180 直连远山脚下，彻底消灭边缘黑缝！）+ 核心城镇地面
    const outerCol = { ice: 0x9ab4c7, volcano: 0x3b2620, fire: 0x4d392d, wood: 0x26402f, island: 0x2f374f, ocean: 0x1e4054, earth: 0x384730 }[plate.biome] || 0x384730;
    const outerGround = new THREE.Mesh(
      new THREE.PlaneGeometry(180, 180),
      new THREE.MeshStandardMaterial({ color: outerCol, roughness: 0.96 })
    );
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.position.y = -0.05;
    scene.add(outerGround);

    const MAP_W = 52, MAP_H = 46;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_W, MAP_H),
      new THREE.MeshStandardMaterial({ map: makeGroundTexture(plate.biome), roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    const riverWater = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_W, 3.85, 24, 4),
      new THREE.MeshStandardMaterial({
        color: plate.biome === 'volcano' ? 0xd94e22 : 0x1f7c99,
        transparent: true, opacity: 0.72, roughness: 0.18, metalness: 0.4
      })
    );
    riverWater.rotation.x = -Math.PI / 2;
    riverWater.position.set(0, 0.04, 11.15);
    scene.add(riverWater);

    // 灵溪荷叶浮萍
    if (plate.biome !== 'volcano') {
      const padMat = new THREE.MeshBasicMaterial({ color: 0x2e7d52, side: THREE.DoubleSide });
      const padGeo = new THREE.CircleGeometry(0.42, 12);
      [-18, -11, -6, 6, 8.5, 17, 20].forEach(lx => {
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(lx, 0.07, 10.6 + (Math.abs(lx) % 2) * 0.9);
        scene.add(pad);
      });
    }

    // 拱形石木桥（中轴主桥 + 东侧副桥）
    const addBridge = (bx, bw) => {
      const br = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.34, 5.4), new THREE.MeshStandardMaterial({ color: 0x875d3e, roughness: 0.8 }));
      br.position.set(bx, 0.22, 11.1); scene.add(br);
      [-bw / 2 + 0.12, bw / 2 - 0.12].forEach(ox => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 5.4), new THREE.MeshStandardMaterial({ color: 0x7a241d, roughness: 0.65 }));
        rail.position.set(bx + ox, 0.6, 11.1); scene.add(rail);
      });
    };
    addBridge(0, 4.6); addBridge(13.0, 2.8);

    // 广场青铜火盆 & 街边灯笼柱
    const flames = [];
    [[-4.2, -3.5], [4.2, -3.5], [-4.2, 3.8], [4.2, 3.8]].forEach(([bx, bz]) => {
      const br = buildBrazier(flames); br.position.set(bx, 0, bz); scene.add(br);
      addNightLight(bx, 1.5, bz, 0xff9d47, 11);
    });
    [[-3.6, -9.2], [3.6, -9.2], [-8.5, 2.8], [8.5, 2.8]].forEach(([lx, lz]) => {
      const lp = buildLanternPost(); lp.position.set(lx, 0, lz); scene.add(lp);
      addNightLight(lx, 2.6, lz, 0xffb35c, 13);
    });

    // 3. 3A 建筑群 & 交互池
    const colliders = [];
    const interactables = [];
    const clickMeshes = [];
    const buildingsForMini = [];
    const flags = [];

    const addBuildingPoi = (x, z, w, h, d, roofHex, wallHex, bannerHex, title, sub, type, data, borderCol) => {
      const b = buildGrandHall(w, h, d, roofHex, wallHex, bannerHex, flags);
      b.position.set(x, 0, z); scene.add(b);
      colliders.push({ minX: x - w / 2 - 0.5, maxX: x + w / 2 + 0.5, minZ: z - d / 2 - 0.5, maxZ: z + d / 2 + 0.5 });
      addNightLight(x, h + 1.0, z + d / 2 + 1.2, type === 'black_market' ? 0xb56eff : 0xffb35c, 16);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeSlimLabel(title, sub, borderCol), transparent: true, depthTest: false }));
      sp.scale.set(3.2, 0.82, 1); sp.position.set(x, h + 3.6, z);
      sp.userData = { interactIdx: interactables.length };
      scene.add(sp); clickMeshes.push(sp);
      buildingsForMini.push({ x, z, label: title, type });
      interactables.push({ type, id: type + '_' + x, label: `进入【${title}】`, sub, x, z: z + d / 2 + 1.45, obj: sp, data });
    };

    const mainFac = (plate.holdings && plate.holdings.length) ? world.factions.find(f => f.id === plate.holdings[0].factionId) : null;
    const localInsts = (world.institutions || []).filter(i => i.plateId === plate.id);
    const localRuins = (world.ruins || []).filter(r => r.plateId === plate.id);

    addBuildingPoi(0, -15.2, 7.6, 3.4, 4.8, 0x1b474a, 0xd8cbb4, 0x2a8068,
      mainFac ? `${mainFac.name}·主殿` : `${plate.name}·议事堂`,
      mainFac ? `掌门:${mainFac.leader}` : '可开宗立派',
      'sect_hall', { plate, fac: mainFac }, '#6fd3a8');

    addBuildingPoi(-12.8, -4.4, 5.6, 2.7, 4.2, 0x383252, 0xd9ceba, 0x3b6ca8,
      localInsts.length ? localInsts[0].name : `${plate.name}·万宝坊市`,
      `丹×${plate.priceIndex.pill} 矿×${plate.priceIndex.mineral}`,
      'market', { plate, inst: localInsts[0] || null }, '#70b8f0');

    const stall1 = buildMarketStall(0x9c3229); stall1.position.set(-7.5, 0, -4.6); scene.add(stall1);
    colliders.push({ minX: -8.8, maxX: -6.2, minZ: -5.4, maxZ: -3.8 });
    const stall2 = buildMarketStall(0x286357); stall2.position.set(7.5, 0, -4.6); scene.add(stall2);
    colliders.push({ minX: 6.2, maxX: 8.8, minZ: -5.4, maxZ: -3.8 });

    addBuildingPoi(12.8, -4.4, 5.4, 2.6, 4.0, 0x5c3424, 0xdfd3be, 0xc97b38,
      '仙缘茶馆', '江湖史话 · 秘境风声', 'teahouse', { plate }, '#f2daa0');
    addBuildingPoi(-14.6, 5.2, 4.4, 2.2, 3.5, 0x231d29, 0x5c5563, 0x7b3e96,
      '幽影黑市', `暗森 ${plate.darkForestIdx || 0} · 易容销赃`, 'black_market', { plate }, '#e06258');

    // 聚灵蒲团
    const cx = 13.5, cz = 4.6;
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0xb8893c, roughness: 0.7 }));
    cushion.position.set(cx, 0.11, cz); scene.add(cushion);
    const medRing = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.48, 32), new THREE.MeshBasicMaterial({ color: 0x6fd3a8, side: THREE.DoubleSide, transparent: true, opacity: 0.75 }));
    medRing.rotateX(-Math.PI / 2); medRing.position.set(cx, 0.05, cz); scene.add(medRing);
    const cSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeSlimLabel('聚灵蒲团', `灵脉${plate.leyline} · 打坐`, '#6fd3a8'), transparent: true, depthTest: false }));
    cSp.scale.set(2.5, 0.65, 1); cSp.position.set(cx, 2.1, cz); cSp.userData = { interactIdx: interactables.length };
    scene.add(cSp); clickMeshes.push(cSp);
    buildingsForMini.push({ x: cx, z: cz, label: '打坐', type: 'meditate' });
    interactables.push({ type: 'meditate', id: 'meditate_spot', label: '盘膝打坐 · 吐纳灵气', sub: `灵脉${plate.leyline}加成`, x: cx, z: cz, obj: cSp, data: plate });

    // 野生灵草
    const gx = 16.5, gz = -13.2;
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), new THREE.MeshStandardMaterial({ color: 0x6fd3a8, emissive: 0x268560, emissiveIntensity: 0.75 }));
    crystal.position.set(gx, 0.9, gz); crystal.userData = { interactIdx: interactables.length };
    scene.add(crystal); clickMeshes.push(crystal);
    const gSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeSlimLabel('野生灵脉草', '按 E 采集', '#6fd3a8'), transparent: true, depthTest: false }));
    gSp.scale.set(2.4, 0.62, 1); gSp.position.set(gx, 2.2, gz); scene.add(gSp);
    buildingsForMini.push({ x: gx, z: gz, label: '灵草', type: 'gather' });
    interactables.push({ type: 'gather', id: 'local_gather', label: `采集【${plate.name}灵草】`, sub: `灵脉${plate.leyline}`, x: gx, z: gz, obj: crystal, data: plate });

    // 古修遗迹
    if (localRuins.length) {
      const r = localRuins[0];
      const rx = -16.5, rz = -13.5;
      const mono = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 0.7), new THREE.MeshStandardMaterial({ color: 0x384859, emissive: 0x1d3b4d, emissiveIntensity: 0.6 }));
      mono.position.set(rx, 1.6, rz); mono.userData = { interactIdx: interactables.length };
      scene.add(mono); clickMeshes.push(mono);
      const rSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeSlimLabel('古修遗迹', r.name.slice(0, 10), '#f7d070'), transparent: true, depthTest: false }));
      rSp.scale.set(2.7, 0.7, 1); rSp.position.set(rx, 4.0, rz); scene.add(rSp);
      buildingsForMini.push({ x: rx, z: rz, label: '遗迹', type: 'ruin' });
      interactables.push({ type: 'ruin', id: r.id, label: `闯入古遗迹【${r.name}】`, sub: `阵法${r.sealStrength}`, x: rx, z: rz + 1.2, obj: rSp, data: r });
    }

    // 城门牌坊
    const arch = buildArchway(); arch.position.set(0, 0, 18.8); scene.add(arch);
    const exSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeSlimLabel('山门出口', '前往五洲七海大洲图', '#f2daa0'), transparent: true, depthTest: false }));
    exSp.scale.set(2.9, 0.75, 1); exSp.position.set(0, 4.7, 18.8); exSp.userData = { interactIdx: interactables.length };
    scene.add(exSp); clickMeshes.push(exSp);
    buildingsForMini.push({ x: 0, z: 18.8, label: '城门', type: 'exit' });
    interactables.push({ type: 'exit_world', id: 'exit_gate', label: '走出山门 · 前往五洲七海大洲图', sub: '跨洲御剑远行', x: 0, z: 17.5, obj: exSp, data: plate });

    // 中央广场西侧：仙城悬赏榜 & 跨洲商行货栈告示牌
    const bBoard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 0.25), new THREE.MeshStandardMaterial({ color: 0x5c3c24, roughness: 0.85 }));
    bBoard.position.set(-5.6, 1.1, 2.2); scene.add(bBoard);
    const bbSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeSlimLabel('悬赏榜·商行', '接悬赏 / 跨洲跑商套利', '#f7d070'), transparent: true, depthTest: false }));
    bbSp.scale.set(2.7, 0.68, 1); bbSp.position.set(-5.6, 2.8, 2.2); bbSp.userData = { interactIdx: interactables.length };
    scene.add(bbSp); clickMeshes.push(bbSp);
    buildingsForMini.push({ x: -5.6, z: 2.2, label: '悬赏', type: 'bounty' });
    interactables.push({ type: 'bounty_board', id: 'bounty_board', label: '查看【悬赏榜 · 跨洲商行】', sub: '接赏金 / 倒卖差价商货', x: -5.6, z: 3.3, obj: bbSp, data: plate });

    // 城南桥畔：落魄流民（可施舍积德或招入宗门）
    const refSp = makeHumanSprite('assets/chars/hero.webp', '落魄流民', '饥寒交迫', 0x9d9586, 1.2, 1.7, false);
    refSp.group.position.set(-4.6, 0, 14.2); refSp.body.userData = { interactIdx: interactables.length };
    scene.add(refSp.group); clickMeshes.push(refSp.body);
    interactables.push({ type: 'refugee', id: 'refugee_1', label: '救助【落魄流民】', sub: '施舍积德 / 招入宗门', x: -4.6, z: 14.2, obj: refSp.group, data: plate });

    // 三层叠叶古松 & 灵花树
    [[-21,-17],[-19,-8],[-21,2],[-20,15],[-9,-17],[9,-17],[21,-16],[20,-6],[21,4],[19,16],[-8,6],[8,6],[-10,16],[8,16],[16,1],[-17,1]].forEach(([tx, tz], idx) => {
      const tree = buildLayeredTree(plate.biome, idx % 4 === 0 && (plate.biome === 'wood' || plate.biome === 'earth'));
      tree.position.set(tx, 0, tz);
      tree.scale.setScalar(0.85 + (idx % 3) * 0.16);
      scene.add(tree);
    });

    // 高空盘旋白鹤群
    const cranes = [];
    const craneMat = new THREE.MeshBasicMaterial({ color: 0xf4f7fa, side: THREE.DoubleSide });
    for (let i = 0; i < 4; i++) {
      const cg = new THREE.Group();
      const lw = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.35), craneMat); lw.position.x = -0.45; lw.rotation.x = -Math.PI / 2;
      const rw = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.35), craneMat); rw.position.x = 0.45; rw.rotation.x = -Math.PI / 2;
      cg.add(lw, rw);
      scene.add(cg);
      cranes.push({ g: cg, lw, rw, rad: 14 + i * 3.5, speed: 0.22 + i * 0.04, ang: i * 1.6, y: 11 + i * 1.5 });
    }

    // 街道 NPC
    const ambientLines = [
      `听说了吗？本地丹药价涨到 ×${plate.priceIndex.pill} 了！`,
      mainFac && mainFac.hasServantSystem ? `唉，${mainFac.name}杂役月俸又被执事克扣了…` : '散修难当，还是早日找个靠山安稳。',
      '城南河边妖兽横行，出城记得走位躲红圈！',
      localRuins.length ? `西北城外那座【${localRuins[0].name.slice(0,6)}】昨夜竟有雷光！` : '哪天能撞上一座古修洞府就好了…',
      world.chronicles && world.chronicles[0] ? world.chronicles[0].text.slice(0, 16) + '…' : '沧溟灵潮起伏，不知又能出几位大能。'
    ];
    const npcActors = [];
    const allPeople = (world.people || world.agents || []).filter(a => a.alive);
    const localAgents = allPeople.filter(a => (a.plateId || a.locId) === plate.id);
    const fallbackAgents = allPeople.slice(0, 6);
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

    // 饥荒风无缝即时战斗敌怪群
    const hostileActors = [];
    const rScale = 1 + ((hero && hero.realmIdx) || 0) * 0.55;
    const bName = plate.biome === 'ice' ? '寒渊冰蛟' : (plate.biome === 'volcano' ? '赤炎妖猿' : '幽林妖狼');
    const enemySpawns = [
      { x: 14.8, z: 15.6, name: bName, avatar: 'assets/chars/wolf_boss.webp', hp: Math.round(95 * rScale), atk: Math.round(14 * rScale), rewardStones: 36, rewardExp: 32, drop: `${bName}妖丹`, isEnforcer: false },
      { x: -13.5, z: 15.8, name: bName + '头领', avatar: 'assets/chars/wolf_boss.webp', hp: Math.round(135 * rScale), atk: Math.round(18 * rScale), rewardStones: 55, rewardExp: 48, drop: `${bName}妖丹`, isEnforcer: false },
      { x: -16.5, z: -8.5, name: '暗森劫修', avatar: 'assets/chars/elder.webp', hp: Math.round(115 * rScale), atk: Math.round(16 * rScale), rewardStones: 62, rewardExp: 42, drop: '劫修储物袋', isEnforcer: false }
    ];
    if (hero && ((hero.wanted || 0) > 0 || (hero.life && hero.life.reputation && hero.life.reputation.demonic >= 15))) {
      enemySpawns.push({ x: 5.5, z: -9.5, name: '宗门执法执事', avatar: 'assets/chars/elder.webp', hp: Math.round(155 * rScale), atk: Math.round(20 * rScale), rewardStones: 80, rewardExp: 55, drop: '执法令牌', isEnforcer: true });
    }

    enemySpawns.forEach((spDef, idx) => {
      const sp = makeHumanSprite(spDef.avatar, spDef.name, '', 0xe05248, 1.5, 1.75, true);
      sp.group.position.set(spDef.x, 0, spDef.z);
      sp.hpSprite.material.map = makeHpBarTexture(spDef.hp, spDef.hp, spDef.name);
      sp.hpSprite.material.needsUpdate = true;
      const warnRing = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 2.35, 28),
        new THREE.MeshBasicMaterial({ color: 0xff3b30, side: THREE.DoubleSide, transparent: true, opacity: 0 })
      );
      warnRing.rotateX(-Math.PI / 2); warnRing.position.y = 0.08;
      sp.group.add(warnRing);
      const en = {
        id: 'en_' + idx, sp, warnRing, name: spDef.name, homeX: spDef.x, homeZ: spDef.z,
        x: spDef.x, z: spDef.z, tx: spDef.x, tz: spDef.z,
        hp: spDef.hp, maxHp: spDef.hp, atk: spDef.atk,
        rewardStones: spDef.rewardStones, rewardExp: spDef.rewardExp, drop: spDef.drop, isEnforcer: !!spDef.isEnforcer,
        alive: true, respawnTimer: 0, aiState: 'patrol', aiTimer: 1.0, hitFlash: 0, speed: 2.85
      };
      sp.body.userData = { hostileRef: en };
      scene.add(sp.group); clickMeshes.push(sp.body);
      hostileActors.push(en);
    });

    // 主角
    const heroPos = { x: 0, z: 1.5, tx: null, tz: null, flying: false, facing: 1, walkPhase: 0, attackTarget: null };
    const heroActor = makeHumanSprite(
      'assets/chars/hero_full.webp',
      (hero && hero.masked ? hero.maskName : (hero && hero.name)) || '青云道友',
      (hero && hero.realm) || '炼气一层', 0x6fd3a8, 1.55, 2.15, false
    );
    const swordMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 1.65), new THREE.MeshBasicMaterial({ color: 0x8ef7da }));
    swordMesh.visible = false; heroActor.group.add(swordMesh);
    const shieldDome = new THREE.Mesh(
      new THREE.SphereGeometry(1.35, 18, 14),
      new THREE.MeshBasicMaterial({ color: 0x6fd3a8, transparent: true, opacity: 0.25, wireframe: true })
    );
    shieldDome.position.y = 1.1; shieldDome.visible = false; heroActor.group.add(shieldDome);
    heroActor.group.position.set(heroPos.x, 0, heroPos.z); scene.add(heroActor.group);

    // 3D 特效池
    const vfxList = [];
    const spawnFloatText = (x, y, z, text, color) => {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
      const ctx = cv.getContext('2d');
      ctx.font = 'bold 30px "Songti SC",serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 5; ctx.strokeStyle = '#090c12'; ctx.strokeText(text, 128, 44);
      ctx.fillStyle = color || '#ffeb99'; ctx.fillText(text, 128, 44);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
      sp.scale.set(2.8, 0.72, 1); sp.position.set(x, y, z); scene.add(sp);
      vfxList.push({ mesh: sp, life: 0.95, maxLife: 0.95, vy: 1.9, expand: 0 });
    };
    const spawnSlashVfx = (x, z, angle, isFinisher) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(isFinisher ? 1.1 : 0.9, isFinisher ? 2.85 : 2.1, 18, 1, isFinisher ? -1.3 : -0.9, isFinisher ? 2.6 : 1.8),
        new THREE.MeshBasicMaterial({ color: isFinisher ? 0xffe066 : 0x7ef7d4, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
      );
      ring.rotateX(-Math.PI / 2); ring.rotation.z = -angle; ring.position.set(x, 1.0, z); scene.add(ring);
      vfxList.push({ mesh: ring, life: isFinisher ? 0.34 : 0.24, maxLife: isFinisher ? 0.34 : 0.24, vy: 0, expand: isFinisher ? 2.8 : 2.2 });
    };
    const spawnLightningVfx = (x, z) => {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.65, 11, 10), new THREE.MeshBasicMaterial({ color: 0xffe478, transparent: true, opacity: 0.92 }));
      bolt.position.set(x, 5.5, z); scene.add(bolt);
      vfxList.push({ mesh: bolt, life: 0.36, maxLife: 0.36, vy: 0, expand: -0.6 });
      const shock = new THREE.Mesh(new THREE.RingGeometry(0.4, 3.4, 28), new THREE.MeshBasicMaterial({ color: 0xa8d4ff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
      shock.rotateX(-Math.PI / 2); shock.position.set(x, 0.14, z); scene.add(shock);
      vfxList.push({ mesh: shock, life: 0.42, maxLife: 0.42, vy: 0, expand: 3.5 });
    };

    const combatState = { cdStrike: 0, cdSpell: 0, cdShield: 0, shieldTime: 0, cdDash: 0, comboStep: 0, comboTimer: 0, counterReady: false };
    let camShake = 0;

    // 实时敌怪锁定准星环（清晰标示 F/2 即将命中的目标！）
    const lockRing = new THREE.Mesh(
      new THREE.RingGeometry(0.75, 0.96, 24),
      new THREE.MeshBasicMaterial({ color: 0xf7d070, side: THREE.DoubleSide, transparent: true, opacity: 0 })
    );
    lockRing.rotateX(-Math.PI / 2); lockRing.position.y = 0.07;
    scene.add(lockRing);

    // 实景掉落战利品光球池（击杀敌怪当场爆落地面，走近磁吸拾取！）
    const lootOrbs = [];
    const spawnLootOrb = (x, z, en) => {
      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32, 0),
        new THREE.MeshBasicMaterial({ color: 0xf7d070 })
      );
      orb.position.set(x, 0.55, z);
      scene.add(orb);
      lootOrbs.push({ mesh: orb, x, z, en, phase: Math.random() * 6 });
    };

    // 伴生灵宠实体（若主角已驯服灵宠，实时跟在主角身边跑！）
    let petActor = null;
    if (hero && hero.pets && hero.pets.length > 0) {
      const pSp = makeHumanSprite('assets/chars/wolf_boss.webp', hero.pets[0], '伴生灵宠', 0x6fd3a8, 1.05, 1.15, false);
      pSp.group.position.set(heroPos.x - 1.6, 0, heroPos.z + 1.0);
      scene.add(pSp.group);
      petActor = { sp: pSp, x: heroPos.x - 1.6, z: heroPos.z + 1.0, phase: 0 };
    }

    const damageEnemy = (en, dmg, isCrit, knockDirX, knockDirZ) => {
      if (!en.alive) return;
      en.hp = Math.max(0, en.hp - dmg);
      en.hitFlash = 0.18;
      if (isCrit) camShake = Math.max(camShake, 0.22);
      en.x = Math.max(-23, Math.min(23, en.x + knockDirX * 0.65));
      en.z = Math.max(-20, Math.min(20, en.z + knockDirZ * 0.65));
      en.sp.hpSprite.material.map = makeHpBarTexture(en.hp, en.maxHp, en.name);
      en.sp.hpSprite.material.needsUpdate = true;
      spawnFloatText(en.x, 2.4, en.z, isCrit ? `暴击 -${dmg}` : `-${dmg}`, isCrit ? '#ff9138' : '#ffe899');
      if (en.aiState === 'patrol') en.aiState = 'chase';
      if (en.hp <= 0) {
        en.alive = false; en.respawnTimer = 22.0; en.sp.group.visible = false; en.warnRing.material.opacity = 0;
        if (heroPos.attackTarget === en) heroPos.attackTarget = null;
        camShake = Math.max(camShake, 0.3);
        spawnLootOrb(en.x, en.z, en);
        spawnFloatText(en.x, 2.7, en.z, `击杀! 掉落【${en.drop}】`, '#f7d070');
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
      const ab = (window.LifeModules && window.LifeModules.getArtBonus && hero)
        ? window.LifeModules.getArtBonus(hero)
        : { atkMul: 1, spellMul: 1, weaponAtk: 0 };
      const baseAtk = Math.round((20 + rIdx * 16 + ((hero && hero.bonusAtk) || 0) + ab.weaponAtk) * ab.atkMul);
      const spellBaseAtk = Math.round((20 + rIdx * 16 + ((hero && hero.bonusAtk) || 0) + ab.weaponAtk) * ab.spellMul);
      if (slot === 'strike') {
        if (combatState.cdStrike > 0) return;
        combatState.cdStrike = 0.42;
        combatState.comboStep = (combatState.comboTimer > 0) ? ((combatState.comboStep % 3) + 1) : 1;
        combatState.comboTimer = 1.6;
        const isThird = combatState.comboStep === 3;
        const isCounter = combatState.counterReady;
        combatState.counterReady = false;
        const isBig = isThird || isCounter;

        const tg = findNearestHostile(isBig ? 4.8 : 4.2);
        const ang = tg ? Math.atan2(tg.z - heroPos.z, tg.x - heroPos.x) : (heroPos.facing > 0 ? 0 : Math.PI);
        if (tg) heroPos.facing = tg.x >= heroPos.x ? 1 : -1;
        spawnSlashVfx(heroPos.x, heroPos.z, ang, isBig);
        if (window.SFX && window.SFX.play) { try { window.SFX.play('click'); } catch {} }
        if (tg) {
          const crit = isBig || Math.random() < 0.22;
          const mult = isCounter ? 1.75 : (isThird ? 1.55 : (crit ? 1.45 : (0.92 + Math.random() * 0.22)));
          const dmg = Math.round(baseAtk * mult);
          const d = Math.max(0.1, Math.hypot(tg.x - heroPos.x, tg.z - heroPos.z));
          damageEnemy(tg, dmg, crit, (tg.x - heroPos.x) / d, (tg.z - heroPos.z) / d);
          if (isCounter) spawnFloatText(heroPos.x, 2.7, heroPos.z, '破绽反击!', '#ffe066');
          else if (isThird) spawnFloatText(heroPos.x, 2.6, heroPos.z, '三式·破空斩!', '#ffe066');
          if (hero) { hero.qi = Math.min(hero.maxQi || 80, (hero.qi || 0) + (isThird ? 16 : 10)); if (opts.onHeroStatsChange) opts.onHeroStatsChange(); }
        }
        return;
      }
      if (slot === 'spell') {
        if (combatState.cdSpell > 0) return;
        if (hero && (hero.qi || 0) < 25) { if (opts.onToast) opts.onToast('灵力不足 25'); return; }
        const tg = findNearestHostile(11.0);
        if (!tg) { if (opts.onToast) opts.onToast('附近无敌怪，请过桥前往城外河岸'); return; }
        if (hero) { hero.qi = Math.max(0, (hero.qi || 0) - 25); if (opts.onHeroStatsChange) opts.onHeroStatsChange(); }
        combatState.cdSpell = 3.8;
        spawnLightningVfx(tg.x, tg.z);
        hostileActors.forEach(en => {
          if (!en.alive) return;
          if (Math.hypot(en.x - tg.x, en.z - tg.z) < 4.0) damageEnemy(en, Math.round(spellBaseAtk * 1.95), true, (en.x - heroPos.x) * 0.2, (en.z - heroPos.z) * 0.2);
        });
        return;
      }
      if (slot === 'shield') {
        if (combatState.cdShield > 0) return;
        if (hero && (hero.qi || 0) < 18) { if (opts.onToast) opts.onToast('灵力不足 18'); return; }
        if (hero) { hero.qi = Math.max(0, (hero.qi || 0) - 18); if (opts.onHeroStatsChange) opts.onHeroStatsChange(); }
        combatState.cdShield = 8.0; combatState.shieldTime = 5.0; shieldDome.visible = true;
        spawnFloatText(heroPos.x, 2.5, heroPos.z, '玄玉灵盾 5s', '#6fd3a8');
        return;
      }
      if (slot === 'pill' && opts.onUseQuickPill && opts.onUseQuickPill()) {
        spawnFloatText(heroPos.x, 2.5, heroPos.z, '吞丹回血+气', '#6fd3a8');
      }
    };

    const isBlocked = (nx, nz) => {
      if (heroPos.flying) return false;
      if (nz > 9.3 && nz < 12.9) {
        if (!((nx > -2.3 && nx < 2.3) || (nx > 11.6 && nx < 14.4))) return true;
      }
      for (let i = 0; i < colliders.length; i++) {
        const c = colliders[i];
        if (nx > c.minX && nx < c.maxX && nz > c.minZ && nz < c.maxZ) return true;
      }
      return false;
    };

    const clickRing = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.52, 24), new THREE.MeshBasicMaterial({ color: 0x6fd3a8, side: THREE.DoubleSide, transparent: true, opacity: 0 }));
    clickRing.rotateX(-Math.PI / 2); scene.add(clickRing);
    let clickRingLife = 0;

    const pCol = plate.biome === 'ice' ? 0xe8f6ff : (plate.biome === 'volcano' ? 0xff7b42 : 0xd8f7e8);
    const pGeo = new THREE.BufferGeometry();
    const pArr = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) { pArr[i * 3] = (Math.random() - 0.5) * MAP_W; pArr[i * 3 + 1] = 0.5 + Math.random() * 8; pArr[i * 3 + 2] = (Math.random() - 0.5) * MAP_H; }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: pCol, size: 0.15, transparent: true, opacity: 0.68 }));
    scene.add(particles);

    const camState = { yaw: 0, pitch: 0.54, dist: 14.2, tYaw: 0, tPitch: 0.54, tDist: 14.2, cx: heroPos.x, cz: heroPos.z };
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
        skyMat.map = skyTexDay; skyMat.needsUpdate = true;
        ambient.color.setHex(0xbfd2e8); ambient.intensity = 0.88;
        sun.color.setHex(0xffe9c2); sun.intensity = 1.2; sun.position.set(18, 30, 20);
        nightLights.forEach(pl => { pl.intensity = 0.25; });
      } else if (mode === 'dusk') {
        scene.background.setHex(0x2e1a1d); scene.fog.color.setHex(0x2e1a1d);
        skyMat.map = skyTexDusk; skyMat.needsUpdate = true;
        ambient.color.setHex(0xd4967a); ambient.intensity = 0.68;
        sun.color.setHex(0xff8a47); sun.intensity = 1.28; sun.position.set(-28, 11, 14);
        nightLights.forEach(pl => { pl.intensity = 1.2; });
      } else {
        scene.background.setHex(0x070c17); scene.fog.color.setHex(0x070c17);
        skyMat.map = skyTexNight; skyMat.needsUpdate = true;
        ambient.color.setHex(0x4c6b99); ambient.intensity = 0.44;
        sun.color.setHex(0x7aa4e0); sun.intensity = 0.45; sun.position.set(-14, 24, -16);
        nightLights.forEach(pl => { pl.intensity = 2.15; });
      }
    };
    applyTimeOfDay('day');

    const keys = {}; const joyVec = { x: 0, z: 0 };
    let nearbyTarget = null, pendingInteract = null;

    const onKeyDown = e => {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      const md = document.getElementById('life-sim-modal');
      if (md && md.classList.contains('open')) return;
      const k = e.key.toLowerCase();
      keys[k] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (k === ' ') { heroPos.flying = !heroPos.flying; swordMesh.visible = heroPos.flying; if (opts.onFlyToggle) opts.onFlyToggle(heroPos.flying); }
      if (k === 'e' && nearbyTarget && opts.onInteract) opts.onInteract(nearbyTarget);
      if (k === 'f' || k === '1') castSkill('strike');
      if (k === '2') castSkill('spell');
      if (k === '3') castSkill('shield');
      if (k === '4') castSkill('pill');
      if (k === 'shift' && combatState.cdDash <= 0) {
        combatState.cdDash = 2.4;
        const dx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
        const dz = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
        const len = Math.hypot(dx, dz) || 1;
        const ux = dx || dz ? dx / len : heroPos.facing;
        const uz = dx || dz ? dz / len : 0;
        for (let s = 0; s < 5; s++) tryMoveHero(ux * 0.72, uz * 0.72);
        spawnFloatText(heroPos.x, 2.3, heroPos.z, '缩地闪避', '#9ff2cf');
        if (window.SFX && window.SFX.play) { try { window.SFX.play('click'); } catch {} }
      }
    };
    const onKeyUp = e => { keys[e.key.toLowerCase()] = false; };
    const onBlur = () => { for (const k in keys) keys[k] = false; rDrag = false; };
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp); window.addEventListener('blur', onBlur);

    const dom = renderer.domElement;
    const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
    let rDrag = false, moved = false, lx = 0, ly = 0;

    const onPointerDown = e => { lx = e.clientX; ly = e.clientY; moved = false; if (e.button === 2) rDrag = true; };
    const onPointerMove = e => {
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      lx = e.clientX; ly = e.clientY;
      if (rDrag) { camState.tYaw -= dx * 0.0065; camState.tPitch = Math.max(0.32, Math.min(1.15, camState.tPitch + dy * 0.005)); }
    };
    const onPointerUp = () => { rDrag = false; };
    const onContextMenu = e => e.preventDefault();
    const onWheel = e => { e.preventDefault(); camState.tDist = Math.max(8, Math.min(28, camState.tDist + e.deltaY * 0.015)); };
    const onClick = e => {
      if (moved || e.button !== 0) return;
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hitEnt = raycaster.intersectObjects(clickMeshes);
      if (hitEnt.length) {
        const ud = hitEnt[0].object.userData;
        if (ud.hostileRef && ud.hostileRef.alive) {
          const en = ud.hostileRef;
          if (Math.hypot(en.x - heroPos.x, en.z - heroPos.z) < 3.6) castSkill('strike');
          else { heroPos.attackTarget = en; heroPos.tx = null; heroPos.tz = null; clickRing.position.set(en.x, 0.08, en.z); clickRingLife = 1.0; }
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
        heroPos.tx = Math.max(-23, Math.min(23, pt.x)); heroPos.tz = Math.max(-20, Math.min(20, pt.z));
        pendingInteract = null;
        clickRing.position.set(heroPos.tx, 0.08, heroPos.tz); clickRingLife = 1.0;
      }
    };
    const onResize = () => {
      if (!state) return;
      const nw = container.clientWidth || window.innerWidth, nh = container.clientHeight || window.innerHeight;
      camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
    };

    dom.addEventListener('pointerdown', onPointerDown); window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp); dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('wheel', onWheel, { passive: false }); dom.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);

    const tryMoveHero = (dx, dz) => {
      const nx = Math.max(-23, Math.min(23, heroPos.x + dx)), nz = Math.max(-20, Math.min(20, heroPos.z + dz));
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

      if (combatState.cdStrike > 0) combatState.cdStrike = Math.max(0, combatState.cdStrike - dt);
      if (combatState.cdSpell > 0) combatState.cdSpell = Math.max(0, combatState.cdSpell - dt);
      if (combatState.cdShield > 0) combatState.cdShield = Math.max(0, combatState.cdShield - dt);
      if (combatState.cdDash > 0) combatState.cdDash = Math.max(0, combatState.cdDash - dt);
      if (combatState.comboTimer > 0) combatState.comboTimer = Math.max(0, combatState.comboTimer - dt);
      // 更新目标锁定金圈
      const lockTg = findNearestHostile(11.0);
      if (lockTg) {
        lockRing.position.set(lockTg.x, 0.07, lockTg.z);
        lockRing.material.opacity = 0.55 + Math.sin(t * 7) * 0.25;
        lockRing.rotation.z = t * 1.6;
      } else {
        lockRing.material.opacity = 0;
      }
      if (combatState.shieldTime > 0) {
        combatState.shieldTime -= dt; shieldDome.rotation.y = t * 1.8;
        if (combatState.shieldTime <= 0) shieldDome.visible = false;
      }

      regenTick += dt;
      if (regenTick >= 1.0 && hero) {
        regenTick = 0;
        let changed = false;
        if ((hero.qi || 0) < (hero.maxQi || 80)) { hero.qi = Math.min(hero.maxQi || 80, (hero.qi || 0) + 4); changed = true; }
        // 中央广场青铜火盆安全区：受伤回到广场烤火自动缓慢回血（饥荒营火体验！）
        if ((hero.hp || 0) < (hero.maxHp || 120) && Math.hypot(heroPos.x, heroPos.z) < 5.8) {
          hero.hp = Math.min(hero.maxHp || 120, (hero.hp || 0) + 6);
          spawnFloatText(heroPos.x, 2.3, heroPos.z, '+6 气血', '#6fd3a8');
          changed = true;
        }
        if (changed && opts.onHeroStatsChange) opts.onHeroStatsChange();
        if (hero.pets && hero.pets.length > 0) {
          const nearEn = findNearestHostile(6.5);
          if (nearEn && nearEn.aiState !== 'patrol') {
            const pDmg = Math.round(12 + (hero.realmIdx || 0) * 8);
            damageEnemy(nearEn, pDmg, false, 0, 0);
            spawnFloatText(nearEn.x, 3.0, nearEn.z, `灵宠 -${pDmg}`, '#9ff2cf');
          }
        }
      }

      let ix = joyVec.x, iz = joyVec.z;
      if (keys.w || keys.arrowup) iz -= 1; if (keys.s || keys.arrowdown) iz += 1;
      if (keys.a || keys.arrowleft) ix -= 1; if (keys.d || keys.arrowright) ix += 1;

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
        if (d < 2.9) castSkill('strike');
        else { const step = Math.min(d, speed * dt); moving = tryMoveHero((dx / d) * step, (dz / d) * step); if (Math.abs(dx) > 0.05) heroPos.facing = dx > 0 ? 1 : -1; }
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

      // 键盘 Q / R 平滑旋转视角（笔记本触控板福音）
      if (keys.q) camState.tYaw += dt * 1.45;
      if (keys.r) camState.tYaw -= dt * 1.45;
      const damp = Math.min(1, dt * 10);
      camState.yaw += (camState.tYaw - camState.yaw) * damp;
      camState.pitch += (camState.tPitch - camState.pitch) * damp;
      camState.dist += (camState.tDist - camState.dist) * damp;
      camState.cx += (heroPos.x - camState.cx) * Math.min(1, dt * 7.5);
      camState.cz += (heroPos.z - camState.cz) * Math.min(1, dt * 7.5);
      updateCam();
      if (camShake > 0) {
        camShake = Math.max(0, camShake - dt * 1.6);
        camera.position.x += (Math.random() - 0.5) * camShake * 1.1;
        camera.position.y += (Math.random() - 0.5) * camShake * 0.8;
      }

      // 伴生灵宠实时跟随主角
      if (petActor) {
        const pdx = (heroPos.x - 1.5 * heroPos.facing) - petActor.x;
        const pdz = (heroPos.z + 0.9) - petActor.z;
        const pd = Math.hypot(pdx, pdz);
        if (pd > 0.6) {
          petActor.x += (pdx / pd) * Math.min(pd, 6.0 * dt);
          petActor.z += (pdz / pd) * Math.min(pd, 6.0 * dt);
          petActor.phase += dt * 11;
          petActor.sp.body.position.y = 0.62 + Math.abs(Math.sin(petActor.phase)) * 0.14;
        }
        petActor.sp.group.position.set(petActor.x, 0, petActor.z);
      }

      // 地面战利品光球旋转 & 走近自动磁吸拾取
      for (let i = lootOrbs.length - 1; i >= 0; i--) {
        const lo = lootOrbs[i];
        lo.mesh.rotation.y = t * 3.0 + lo.phase;
        lo.mesh.position.y = 0.55 + Math.sin(t * 4.0 + lo.phase) * 0.16;
        const ld = Math.hypot(heroPos.x - lo.x, heroPos.z - lo.z);
        if (ld < 3.4) {
          lo.x += ((heroPos.x - lo.x) / Math.max(0.1, ld)) * 9.5 * dt;
          lo.z += ((heroPos.z - lo.z) / Math.max(0.1, ld)) * 9.5 * dt;
          lo.mesh.position.x = lo.x; lo.mesh.position.z = lo.z;
          if (ld < 0.9) {
            scene.remove(lo.mesh);
            lootOrbs.splice(i, 1);
            if (window.SFX && window.SFX.play) { try { window.SFX.play('click'); } catch {} }
            spawnFloatText(heroPos.x, 2.7, heroPos.z, `+${lo.en.rewardStones}石 +${lo.en.rewardExp}修`, '#6fd3a8');
            if (opts.onEnemyKilled) opts.onEnemyKilled(lo.en);
          }
        }
      }

      if (clickRingLife > 0) {
        clickRingLife -= dt * 1.5; clickRing.material.opacity = Math.max(0, clickRingLife * 0.9);
        const sc = 1 + (1 - clickRingLife) * 1.4; clickRing.scale.set(sc, sc, 1);
      }

      // 敌怪即时 AI
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
        if (en.hitFlash > 0) { en.hitFlash -= dt; en.sp.body.material.color.setHex(en.hitFlash > 0 ? 0xff6666 : 0xffffff); }
        const dHero = Math.hypot(heroPos.x - en.x, heroPos.z - en.z);
        const dHome = Math.hypot(en.x - en.homeX, en.z - en.homeZ);

        if (en.aiState === 'patrol') {
          en.warnRing.material.opacity = 0;
          const disguisedFromEnforcer = en.isEnforcer && hero && hero.masked;
          if (dHero < 6.4 && !heroPos.flying && !disguisedFromEnforcer) { en.aiState = 'chase'; spawnFloatText(en.x, 2.5, en.z, en.isEnforcer ? '站住! 通缉犯!' : '发现猎物', '#ff7b72'); }
          else {
            en.aiTimer -= dt;
            if (en.aiTimer <= 0) { en.aiTimer = 2.0 + Math.random() * 2.5; en.tx = en.homeX + (Math.random() - 0.5) * 6; en.tz = en.homeZ + (Math.random() - 0.5) * 5; }
            const dx = en.tx - en.x, dz = en.tz - en.z, d = Math.hypot(dx, dz);
            if (d > 0.3) { en.x += (dx / d) * 1.5 * dt; en.z += (dz / d) * 1.5 * dt; }
          }
        } else if (en.aiState === 'chase') {
          en.warnRing.material.opacity = 0;
          if (dHero > 12.0 || dHome > 13.5 || heroPos.flying) en.aiState = 'patrol';
          else if (dHero < 2.35) { en.aiState = 'windup'; en.aiTimer = 0.68; }
          else { en.x += ((heroPos.x - en.x) / dHero) * en.speed * dt; en.z += ((heroPos.z - en.z) / dHero) * en.speed * dt; }
        } else if (en.aiState === 'windup') {
          en.aiTimer -= dt;
          const p = 1 - Math.max(0, en.aiTimer / 0.68);
          en.warnRing.material.opacity = 0.3 + p * 0.55; en.warnRing.scale.setScalar(0.55 + p * 0.55);
          if (en.aiTimer <= 0) {
            en.warnRing.material.opacity = 0;
            if (dHero < 2.55 && !heroPos.flying) {
              const dmg = Math.max(2, Math.round(en.atk * (combatState.shieldTime > 0 ? 0.38 : 1.0)));
              if (hero) {
                hero.hp = Math.max(0, (hero.hp || 120) - dmg);
                camShake = Math.max(camShake, 0.28);
                spawnFloatText(heroPos.x, 2.5, heroPos.z, combatState.shieldTime > 0 ? `格挡 -${dmg}` : `-${dmg}`, '#ff6b63');
                if (hero.hp <= 0) {
                  hero.hp = Math.max(20, Math.round((hero.maxHp || 120) * 0.25));
                  heroPos.x = 0; heroPos.z = 1.5; heroPos.tx = null; heroPos.tz = null; heroPos.attackTarget = null;
                  if (opts.onHeroDefeated) opts.onHeroDefeated(en);
                }
                if (opts.onHeroStatsChange) opts.onHeroStatsChange();
              }
            } else {
              // 饥荒式极限闪避奖励：躲开红圈扑击，立刻回灵气 +15 并赋予下一次剑诀必暴反击！
              combatState.counterReady = true;
              if (hero) { hero.qi = Math.min(hero.maxQi || 80, (hero.qi || 0) + 15); if (opts.onHeroStatsChange) opts.onHeroStatsChange(); }
              spawnFloatText(heroPos.x, 2.5, heroPos.z, '极限闪避! 气+15·破绽!', '#ffe066');
            }
            en.aiState = 'recover'; en.aiTimer = 0.95;
          }
        } else if (en.aiState === 'recover') {
          en.aiTimer -= dt; if (en.aiTimer <= 0) en.aiState = 'chase';
        }
        en.sp.group.position.set(en.x, 0, en.z);
      });

      // VFX 更新
      for (let i = vfxList.length - 1; i >= 0; i--) {
        const v = vfxList[i]; v.life -= dt;
        if (v.life <= 0) { scene.remove(v.mesh); vfxList.splice(i, 1); continue; }
        v.mesh.position.y += v.vy * dt;
        if (v.expand) { const s = Math.max(0.1, 1 + (1 - v.life / v.maxLife) * v.expand); v.mesh.scale.set(s, s, 1); }
        v.mesh.material.opacity = Math.max(0, v.life / v.maxLife);
      }

      // 街道活人 NPC 彼此相遇对话（不再是各自闭眼瞎走的木偶！）
      bubbleTick += dt;
      if (bubbleTick >= 3.2 && npcActors.length) {
        bubbleTick = 0;
        let paired = false;
        for (let i = 0; i < npcActors.length && !paired; i++) {
          for (let j = i + 1; j < npcActors.length; j++) {
            const a = npcActors[i], b = npcActors[j];
            if (Math.hypot(a.x - b.x, a.z - b.z) < 4.2 && a.bubbleLife <= 0 && b.bubbleLife <= 0) {
              const pairs = [
                [`道友，本地丹药涨到 ×${plate.priceIndex.pill} 了！`, '唉，散修日子愈发难熬喽…'],
                ['刚听说城外那头妖兽又伤人了！', '可不是嘛，出城千万记得躲红圈！'],
                ['不知哪家大宗又要开十年大比了？', '咱们还是先多攒点灵石稳妥。']
              ];
              const pr = pairs[Math.floor(Math.random() * pairs.length)];
              a.wait = 3.0; b.wait = 3.0; // 停下脚步寒暄！
              a.sp.bubbleSp.material.map = makeBubbleTexture(pr[0]); a.sp.bubbleSp.material.needsUpdate = true; a.bubbleLife = 3.2;
              b.sp.bubbleSp.material.map = makeBubbleTexture(pr[1]); b.sp.bubbleSp.material.needsUpdate = true; b.bubbleLife = 3.4;
              paired = true; break;
            }
          }
        }
        if (!paired) {
          const pick = npcActors[Math.floor(Math.random() * npcActors.length)];
          pick.sp.bubbleSp.material.map = makeBubbleTexture(ambientLines[Math.floor(Math.random() * ambientLines.length)]);
          pick.sp.bubbleSp.material.needsUpdate = true; pick.bubbleLife = 3.2;
        }
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

      // 环境生机动画（灵溪波光、幡旗飘动、火盆跳动、白鹤盘旋）
      riverWater.position.y = 0.04 + Math.sin(t * 2.2) * 0.015;
      flags.forEach((f, idx) => { f.rotation.y = Math.sin(t * 2.8 + idx) * 0.25; });
      flames.forEach((fl, idx) => { fl.scale.setScalar(0.85 + Math.sin(t * 9 + idx * 2) * 0.18); fl.rotation.y = t * 2; });
      cranes.forEach(c => {
        c.ang += c.speed * dt;
        c.g.position.set(Math.cos(c.ang) * c.rad, c.y + Math.sin(t * 1.4 + c.ang) * 0.6, Math.sin(c.ang) * c.rad);
        c.g.rotation.y = -c.ang;
        const flap = Math.sin(t * 5.5 + c.ang) * 0.35;
        c.lw.rotation.z = flap; c.rw.rotation.z = -flap;
      });
      crystal.rotation.y = t * 1.4;
      medRing.rotation.z = t * 0.8;
      particles.rotation.y = t * 0.025;

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
      window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('blur', onBlur);
      window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
    };

    state = {
      renderer, scene, camera, raf: null, cleanup,
      heroPos, swordMesh, joyVec, opts, plate, MAP_W, MAP_H,
      buildingsForMini, npcActors, hostileActors, clickMeshes, applyTimeOfDay, castSkill, combatState,
      getTimeMode: () => timeMode,
      getNearby: () => nearbyTarget,
      playBreakthroughVfx: (success, realmName) => {
        // 九霄天劫雷柱 + 金色飞升光环特效！
        camShake = 0.55;
        spawnLightningVfx(heroPos.x, heroPos.z);
        setTimeout(() => { if (state) { camShake = 0.45; spawnLightningVfx(heroPos.x + 0.6, heroPos.z - 0.4); } }, 180);
        const halo = new THREE.Mesh(
          new THREE.RingGeometry(0.5, 4.2, 32),
          new THREE.MeshBasicMaterial({ color: success ? 0xffe066 : 0xe05248, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
        );
        halo.rotateX(-Math.PI / 2); halo.position.set(heroPos.x, 0.16, heroPos.z);
        scene.add(halo);
        vfxList.push({ mesh: halo, life: 1.1, maxLife: 1.1, vy: 0.8, expand: 3.2 });
        spawnFloatText(heroPos.x, 3.1, heroPos.z, success ? `破境成功 · ${realmName}!` : '渡劫受挫 · 心魔反噬!', success ? '#ffe066' : '#ff6b63');
        // 破境气浪震退周遭敌怪
        hostileActors.forEach(en => {
          if (!en.alive) return;
          const d = Math.hypot(en.x - heroPos.x, en.z - heroPos.z);
          if (d < 8.0) { en.x += ((en.x - heroPos.x) / Math.max(0.1, d)) * 3.5; en.z += ((en.z - heroPos.z) / Math.max(0.1, d)) * 3.5; }
        });
      },
      spawnDuelNpc: (npc, isLethal) => {
        const rIdx = npc.realmIdx || 1;
        const hp = Math.round(120 + rIdx * 95);
        const atk = Math.round(15 + rIdx * 10);
        const sx = Math.max(-18, Math.min(18, heroPos.x + 4.5));
        const sz = Math.max(-14, Math.min(14, heroPos.z + 1.2));
        const sp = makeHumanSprite('assets/chars/elder.webp', npc.name, '', 0xe05248, 1.5, 2.0, true);
        sp.group.position.set(sx, 0, sz);
        sp.hpSprite.material.map = makeHpBarTexture(hp, hp, `${npc.name}(${npc.realm || '修士'})`);
        sp.hpSprite.material.needsUpdate = true;
        const warnRing = new THREE.Mesh(
          new THREE.RingGeometry(0.3, 2.45, 28),
          new THREE.MeshBasicMaterial({ color: 0xff3b30, side: THREE.DoubleSide, transparent: true, opacity: 0 })
        );
        warnRing.rotateX(-Math.PI / 2); warnRing.position.y = 0.08;
        sp.group.add(warnRing);
        const en = {
          id: 'duel_' + npc.id + '_' + Date.now(), sp, warnRing,
          name: npc.name, homeX: sx, homeZ: sz, x: sx, z: sz, tx: sx, tz: sz,
          hp, maxHp: hp, atk,
          rewardStones: 85 + rIdx * 45, rewardExp: 55 + rIdx * 35,
          drop: isLethal ? `${npc.name}储物袋` : '切磋心得玉简',
          isEnforcer: false, isDuel: true, isLethal: !!isLethal, npcRef: npc,
          alive: true, respawnTimer: 99999, aiState: 'chase', aiTimer: 0.5, hitFlash: 0, speed: 3.1
        };
        sp.body.userData = { hostileRef: en };
        scene.add(sp.group); clickMeshes.push(sp.body);
        hostileActors.push(en);
        spawnFloatText(sx, 2.8, sz, isLethal ? '拔剑死战!' : '请赐教!', '#ff9138');
      }
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
  function getCombatHudState() {
    if (!state) return null;
    return {
      cdStrike: state.combatState.cdStrike,
      cdSpell: state.combatState.cdSpell,
      cdShield: state.combatState.cdShield,
      shieldTime: state.combatState.shieldTime,
      flying: state.heroPos.flying
    };
  }
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
      mode: 'local', title: state.plate.name, w: state.MAP_W, h: state.MAP_H,
      hero: { x: state.heroPos.x, z: state.heroPos.z },
      pois: state.buildingsForMini,
      npcs: state.npcActors.map(a => ({ x: a.x, z: a.z })),
      beasts: state.hostileActors.filter(b => b.alive).map(b => ({ x: b.x, z: b.z }))
    };
  }

  function spawnDuelNpc(npc, isLethal) { if (state && state.spawnDuelNpc) state.spawnDuelNpc(npc, isLethal); }
  function playBreakthroughVfx(success, realmName) { if (state && state.playBreakthroughVfx) state.playBreakthroughVfx(success, realmName); }

  const LocalMap3D = { mount, dispose, toggleFly, setJoystick, triggerInteract, walkTo, castSkill, getCombatHudState, cycleTimeOfDay, getMinimapData, spawnDuelNpc, playBreakthroughVfx };
  if (typeof module !== 'undefined' && module.exports) module.exports = LocalMap3D;
  root.LocalMap3D = LocalMap3D;
})(typeof window !== 'undefined' ? window : globalThis);
