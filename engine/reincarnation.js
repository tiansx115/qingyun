// v6.3 天地唯一【造化轮回盘】转生、1~100 灵根资质公式、个人洞府遗蜕 与 妖兽看守/仇敌搜身因果引擎
window.REINCARNATION = (function () {
  const RELIC_LOCS = [
    { loc: 'forest', name: '万妖古林深处古修洞府', rumor: '万妖古林深处偶有紫金轮回霞光一闪而逝' },
    { loc: 'market', name: '鬼市黑坊暗标秘匣',     rumor: '鬼市地下暗渠近日流出一件来历不明的太古残盘' },
    { loc: 'sect',   name: '青云剑宗试剑古碑之下', rumor: '青云剑宗演武古碑夜半曾引动异象' },
    { loc: 'cliff',  name: '后山思过崖绝壁石缝',   rumor: '思过崖云海深处似有上古器灵隐匿' },
    { loc: 'altar',  name: '九霄渡劫台星河裂隙',   rumor: '九霄渡劫台雷云之中曾坠落一道轮回流光' }
  ];

  const BEAST_KEYWORDS = ['狼', '妖', '兽', '蟒', '龟', '鹤', '虫', '蝠', '虎', '蛟'];

  function isBeastEnemy(enemy) {
    if (!enemy) return false;
    if (enemy.enemyType) return enemy.enemyType === 'beast';
    if (enemy.isTribulation) return true; // 天劫归为天地异象盘踞原地
    return BEAST_KEYWORDS.some(k => (enemy.name || '').includes(k));
  }

  // ===== 1. 五行灵根资质 (1~100) 与 无属性通用 (none) 修行/施法修正 =====
  function getElemAptitude(G, elem) {
    if (!elem || elem === 'none') {
      return { elem: 'none', val: 50, rate: 1.0, qiMul: 1.0, dmgMul: 1.0, label: '无属性·通用 (1.00x)' };
    }
    const raw = (G.elements && G.elements[elem]) != null ? G.elements[elem] : 20;
    const val = Math.max(1, Math.min(100, Math.round(raw)));
    // 1点资质 => 0.15x 极慢极难；50点 => ~1.16x；100点 => 2.40x 一日千里
    const rate = Number((0.15 + Math.pow((val - 1) / 99, 1.12) * 2.25).toFixed(2));
    const qiMul = val < 15 ? 1.35 : (val < 30 ? 1.15 : (val >= 75 ? 0.78 : (val >= 55 ? 0.90 : 1.0)));
    const dmgMul = Number((1 + Math.max(-0.08, (val - 30) * 0.0035)).toFixed(3));
    const speedDesc = val >= 80 ? '一日千里' : (val >= 50 ? '顺畅契合' : (val >= 25 ? '平庸尚可' : '晦涩极慢'));
    return { elem, val, rate, qiMul, dmgMul, label: `资质${val} · ${rate}x(${speedDesc})` };
  }

  // ===== 2. 全世界强制唯一锁定【造化轮回盘】 =====
  function relocateWorldRelic(G, excludeLoc) {
    const pool = RELIC_LOCS.filter(x => x.loc !== excludeLoc);
    const pick = pool[Math.floor(Math.random() * pool.length)] || RELIC_LOCS[0];
    G.worldRelic = { holder: 'world', loc: pick.loc, placeName: pick.name, rumor: pick.rumor };
    if (G.bag && G.bag.reincarnation_disc) delete G.bag.reincarnation_disc;
  }

  function ensureWorldRelic(G) {
    if (!G.bag) G.bag = {};
    if ((G.bag.reincarnation_disc || 0) > 0) {
      G.bag.reincarnation_disc = 1; // 强制全世界最多 1 个
      G.worldRelic = { holder: 'player', loc: null, placeName: '随身怀揣', rumor: '造化轮回盘已入你手，世间再无第二件' };
      return;
    }
    if (!G.worldRelic || G.worldRelic.holder === 'player' || !G.worldRelic.loc) {
      relocateWorldRelic(G, null);
    }
  }

  function hasRelic(G) {
    ensureWorldRelic(G);
    return Boolean(G.bag && G.bag.reincarnation_disc === 1 && G.worldRelic.holder === 'player');
  }

  // 玩家在对应地点探索/战斗/奇遇时尝试感应寻获唯一至宝
  function tryDiscoverRelicAt(ctx, locId) {
    const { G, showToast, SFX } = ctx;
    ensureWorldRelic(G);
    if (G.worldRelic.holder !== 'world' || G.worldRelic.loc !== locId) return false;
    const chance = Math.min(0.65, 0.16 + ((G.sense || 10) * 0.008) + ((G.luck || 10) * 0.008));
    if (Math.random() < chance) {
      G.bag.reincarnation_disc = 1;
      G.worldRelic = { holder: 'player', loc: null, placeName: '随身怀揣', rumor: '造化轮回盘已认主随身' };
      if (SFX) SFX.play('levelup');
      showToast('【逆天机缘】你神识微动，竟在此地寻获天地唯一至宝【造化轮回盘】！');
      return true;
    }
    return false;
  }

  // 打包身上全部装备、外物法宝、行囊与灵石（轮回盘本体除外，因其会破空飞走）
  function extractAllPossessions(G) {
    const items = {};
    Object.entries(G.equipment || {}).forEach(([k, id]) => {
      if (id) { items[id] = (items[id] || 0) + 1; G.equipment[k] = null; }
    });
    (G.treasures || []).forEach((id, i) => {
      if (id) { items[id] = (items[id] || 0) + 1; G.treasures[i] = null; }
    });
    Object.entries(G.bag || {}).forEach(([id, cnt]) => {
      if (id === 'reincarnation_disc' || cnt <= 0) return;
      items[id] = (items[id] || 0) + cnt;
    });
    G.bag = {};
    const stones = G.stone || 0;
    G.stone = 0;
    return { items, stones };
  }

  function mergeLootToPlayer(G, bundle, addItemFn) {
    if (!bundle) return { itemTypes: 0, stones: 0 };
    let types = 0;
    Object.entries(bundle.items || {}).forEach(([id, cnt]) => {
      if (cnt > 0) { addItemFn(id, cnt); types++; }
    });
    const st = bundle.stones || 0;
    G.stone = (G.stone || 0) + st;
    return { itemTypes: types, stones: st };
  }

  // ===== 3. 轮回转生核心执行（calm: 洞府/寿尽主动从容兵解 vs panic: 战死仓促护主）=====
  function executeReincarnation(ctx, mode, killerEnemy) {
    const { G, D, SFX, recalcDerivedStats, saveGame, renderAll } = ctx;
    const prevLife = (G.lifeCount || 1);
    const prevName = G.name;
    const prevRealm = D.REALMS[G.realmIdx]?.name || '炼气';
    const prevLoc = G.loc === 'map' ? 'sect' : (G.loc || 'sect');
    const inOwnCave = (mode === 'calm' && prevLoc === 'cave' && G.caveOwned);

    // 1) 剥离全身所有道具与灵石
    const bundle = extractAllPossessions(G);

    // 2) 【造化轮回盘】耗尽本世灵机，破空飞走藏入世界随机未知处！
    relocateWorldRelic(G, prevLoc);

    // 3) 处理遗物去向（洞府封存 vs 妖兽盘踞限时30年 vs 强敌修士当场搜身）
    let dropSummary = '';
    if (inOwnCave) {
      if (!G.caveVault) G.caveVault = { items: {}, stones: 0 };
      Object.entries(bundle.items).forEach(([id, c]) => {
        G.caveVault.items[id] = (G.caveVault.items[id] || 0) + c;
      });
      G.caveVault.stones = (G.caveVault.stones || 0) + bundle.stones;
      dropSummary = '全身法器与资粮已封入【云隐仙府】护府大阵，来世归来可完好如初尽数取回！';
    } else if (mode === 'panic' && killerEnemy) {
      if (isBeastEnemy(killerEnemy)) {
        G.worldRemains = {
          loc: prevLoc,
          beastName: killerEnemy.name,
          hp: Math.max(260, killerEnemy.maxHp || 320),
          atk: Math.max(24, killerEnemy.atk || 26),
          dropMonth: G.month,
          deadlineMonths: 360, // 30年 = 360个月
          loot: bundle
        };
        dropSummary = `陨落遗骸与全身宝物散落原处，正被凶兽【${killerEnemy.name}】盘踞看守！须在 30 年内杀回夺回，逾期恐被路过修士斩妖取走！`;
      } else {
        G.nemesis = {
          name: killerEnemy.name,
          loc: prevLoc === 'cave' ? 'market' : prevLoc,
          hp: Math.round((killerEnemy.maxHp || 360) * 1.25),
          atk: Math.round((killerEnemy.atk || 30) * 1.2),
          takenMonth: G.month,
          loot: bundle
        };
        dropSummary = `强敌【${killerEnemy.name}】当场搜身摸尸，夺走了你全身法器与灵石并实力大涨！来世修成后可追杀此獠夺回遗物！`;
      }
    } else {
      // 野外寿尽坐化无阵法保护，等同无主遗骸（20年内可捡）
      G.worldRemains = {
        loc: prevLoc,
        beastName: '盘踞古尸的食腐妖兽',
        hp: 240, atk: 22,
        dropMonth: G.month,
        deadlineMonths: 240,
        loot: bundle
      };
      dropSummary = '你在荒野兵解坐化，遗物散落原地引来妖兽盘踞，须在 20 年内赶回寻取。';
    }

    // 4) 世界时间不停流转！（化婴降生并长至 16 岁重踏仙途）
    const passYears = mode === 'calm' ? 14 : 16;
    G.month += passYears * 12;
    G.lifeCount = prevLife + 1;
    G.age = 16;
    G.realmIdx = 0;
    G.exp = 0;

    // 5) 计算属性、大道造诣与五行灵根资质继承
    if (mode === 'calm') {
      // 从容坐化：高额保留神识/悟性底蕴、保留 55% 招式造诣，且灵根资质大幅跃升！
      G.wit = Math.max(12, 10 + Math.floor((G.wit - 10) * 0.55) + 4);
      G.sense = Math.max(14, 10 + Math.floor((G.sense - 10) * 0.55) + 5);
      G.body = Math.max(11, 10 + Math.floor((G.body - 10) * 0.35) + 2);
      G.speed = Math.max(11, 10 + Math.floor((G.speed - 10) * 0.35) + 2);
      G.luck = Math.max(12, 10 + Math.floor((G.luck - 10) * 0.45) + 2);
      // 找当前最高灵根大幅洗练 +22，其余各 +6
      const sortedEl = Object.entries(G.elements || {}).sort((a, b) => b[1] - a[1]);
      const topKey = sortedEl[0]?.[0] || 'fire';
      Object.keys(G.elements).forEach(k => {
        G.elements[k] = Math.min(100, (G.elements[k] || 10) + (k === topKey ? 22 : 6));
      });
      // 保留 55% 神通熟练度等级感悟
      Object.keys(G.skillProf || {}).forEach(sid => {
        const curLv = G.skillProf[sid].lv || 1;
        G.skillProf[sid] = { lv: Math.max(1, Math.ceil(curLv * 0.6)), exp: 0 };
      });
      G.loc = 'sect';
    } else {
      // 濒死仓促催动：保留极少，且随机抛落东洲荒野
      G.wit = Math.max(10, 10 + Math.floor((G.wit - 10) * 0.15) + 1);
      G.sense = Math.max(11, 10 + Math.floor((G.sense - 10) * 0.18) + 2);
      G.body = 10; G.speed = 10; G.luck = 10;
      const rKey = ['gold', 'wood', 'water', 'fire', 'earth'][Math.floor(Math.random() * 5)];
      G.elements[rKey] = Math.min(100, (G.elements[rKey] || 10) + 6);
      // 仓促间神魂震荡，仅保留基础通用法术与少量宿慧
      G.skills = G.skills.slice(0, 3);
      if (!G.skills.includes('basic_sword')) G.skills.unshift('basic_sword');
      Object.keys(G.skillProf || {}).forEach(sid => {
        G.skillProf[sid] = { lv: 1, exp: 0 };
      });
      const randLocs = ['sect', 'inn', 'market', 'forest', 'cliff'];
      G.loc = randLocs[Math.floor(Math.random() * randLocs.length)];
    }

    // 发放新世起步布衣储物戒
    G.equipment.ring = 'eq_wood_ring';
    G.stone = 25;
    recalcDerivedStats(true);
    if (SFX) SFX.play('levelup');
    saveGame('auto', true);
    renderAll();

    openRebirthSummaryModal({
      lifeCount: G.lifeCount,
      prevName,
      prevRealm,
      mode,
      passYears,
      curYear: Math.floor((G.month - 1) / 12) + 1,
      dropSummary,
      elements: G.elements
    });
  }

  function openRebirthSummaryModal(info) {
    const old = document.getElementById('rebirth-overlay');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.className = 'mini-overlay';
    ov.id = 'rebirth-overlay';
    const elStr = `金${info.elements.gold} · 木${info.elements.wood} · 水${info.elements.water} · 火${info.elements.fire} · 土${info.elements.earth}`;
    ov.innerHTML = `
      <div class="mini-card">
        <div class="sec-head">
          <span>第 ${info.lifeCount} 世 · 宿慧觉醒重踏仙途</span>
          <span class="mini-seal">${info.mode === 'calm' ? '从容兵解' : '濒死护主'}</span>
        </div>
        <div class="mini-body">
          <div class="legacy-banner">
            岁月不居！距前世（${info.prevRealm}）陨落已过 <b>${info.passYears}</b> 载春秋，当前世界已至 <b>第 ${info.curYear} 年</b>。
          </div>
          <div class="auction-log">
            <p style="margin:0 0 6px;">· <b>【造化轮回盘】</b>护持你真灵转世化婴后灵机耗尽，已化作流光破空飞走，重新隐匿于世间某处未知机缘。</p>
            <p style="margin:0 0 6px;">· <b>前世遗物下落</b>：${info.dropSummary}</p>
            <p style="margin:0;">· <b>今生灵根资质（1~100）</b>：<span style="color:var(--gold-bright);">${elStr}</span></p>
          </div>
        </div>
        <div class="mini-foot">
          <span style="font-size:11px;color:var(--muted);">记得重新寻觅【造化轮回盘】，否则本世陨落将真正身死道消！</span>
          <button class="sleek-btn" id="rb-ok">执剑再入红尘</button>
        </div>
      </div>
    `;
    document.getElementById('app').appendChild(ov);
    ov.querySelector('#rb-ok').onclick = () => ov.remove();
  }

  // ===== 4. 无轮回盘 · 真死终局墓志铭 (Permadeath) =====
  function triggerTrueDeath(ctx, deathCause) {
    const { G, D, SFX, startQuiz } = ctx;
    if (SFX) SFX.play('thunder');
    // 清除自动存档（真死不可读自动档悔棋）
    try { localStorage.removeItem('qingyun_v5_save_auto'); } catch (_) {}

    const old = document.getElementById('rebirth-overlay');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.className = 'mini-overlay';
    ov.id = 'rebirth-overlay';
    const curYear = Math.floor((G.month - 1) / 12) + 1;
    const realmName = D.REALMS[G.realmIdx]?.name || '炼气';
    ov.innerHTML = `
      <div class="mini-card">
        <div class="sec-head">
          <span style="color:#f07676;">身死道消 · 仙途终局墓志铭</span>
          <span class="mini-seal">真死结算</span>
        </div>
        <div class="mini-body">
          <div class="auction-log" style="border-left-color:#d95252;">
            <p style="margin:0 0 6px;font-size:14px;color:var(--gold-bright);"><b>「${G.name} · 历 ${G.lifeCount || 1} 世修行，卒于东洲第 ${curYear} 年」</b></p>
            <p style="margin:0 0 6px;">· 陨落缘由：${deathCause}</p>
            <p style="margin:0 0 6px;">· 生前止步境界：<b>${realmName}</b>（享寿 ${G.age} 岁 · 声望 ${G.fame || 0}）</p>
            <p style="margin:0;color:#f09b9b;">· 因本世身无天地唯一至宝【造化轮回盘】护持真灵，神魂彻底消散于天地之间，再无来世。</p>
          </div>
        </div>
        <div class="mini-foot">
          <span style="font-size:11px;color:var(--muted);">大道无情，唯有重开新纪元再争长生。</span>
          <button class="sleek-btn" id="td-new">开启全新纪元</button>
        </div>
      </div>
    `;
    document.getElementById('app').appendChild(ov);
    ov.querySelector('#td-new').onclick = () => {
      ov.remove();
      startQuiz();
    };
  }

  // ===== 5. 个人洞府【云隐仙府】交互 =====
  function openCaveAbode(ctx) {
    const { G, D, ASSETS, setDialogue, advanceTime, gainExp, addItem, recalcDerivedStats, showToast, saveGame, renderAll } = ctx;
    ensureWorldRelic(G);

    if (!G.caveOwned) {
      setDialogue({
        speaker: '云隐灵脉 · 无主石窟', asset: ASSETS.elder,
        text: '云雾深处藏有一处天然聚灵石窟。若耗费 80 枚灵石布下【小周天护府大阵】，即可辟为私人仙府：不仅日常吐纳进境更快，寿尽前更可在府中封存全身宝物从容坐化转生，留待来世取回！',
        choices: [
          {
            text: '布下护府大阵，开辟【云隐仙府】', hint: '80 灵石',
            action: () => {
              if (G.stone < 80) return showToast('灵石不足 80 枚，暂无法布阵开府。');
              G.stone -= 80;
              G.caveOwned = true;
              G.caveVault = G.caveVault || { items: {}, stones: 0 };
              showToast('成功开辟个人洞府【云隐仙府】！护府禁制已成。');
              openCaveAbode(ctx);
            }
          },
          { text: '暂不开辟', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return;
    }

    G.caveVault = G.caveVault || { items: {}, stones: 0 };
    const vaultItemCnt = Object.values(G.caveVault.items || {}).reduce((s, n) => s + n, 0);
    const vaultStones = G.caveVault.stones || 0;
    const holdingRelic = hasRelic(G);

    const choices = [
      {
        text: '在聚灵阵蒲团闭关吐纳（洞府加成 +35%）', hint: '+1月 修为大增',
        action: () => {
          advanceTime(1); recalcDerivedStats(true);
          const g = gainExp(54);
          showToast(`仙府聚灵阵闭关一月，状态圆满，修为 +${g}！`);
          setDialogue(null); saveGame('auto', true); renderAll();
        }
      }
    ];

    if (vaultItemCnt > 0 || vaultStones > 0) {
      choices.push({
        text: `开启护府藏宝室，一键取回封存遗产（宝物 ${vaultItemCnt} 件 · 灵石 ${vaultStones}）`,
        hint: '元神印记开启',
        action: () => {
          const res = mergeLootToPlayer(G, G.caveVault, addItem);
          G.caveVault = { items: {}, stones: 0 };
          showToast(`破开前世元神禁制，取回 ${res.itemTypes} 种宝物与 ${res.stones} 枚灵石！`);
          saveGame('auto', true); openCaveAbode(ctx);
        }
      });
    }

    if (G.stone >= 50) {
      choices.push({
        text: '将 50 枚灵石存入护府藏宝室备用', hint: '跨世不丢',
        action: () => {
          G.stone -= 50;
          G.caveVault.stones = (G.caveVault.stones || 0) + 50;
          showToast('已将 50 枚灵石封入洞府藏宝室。');
          saveGame('auto', true); openCaveAbode(ctx);
        }
      });
    }

    if (holdingRelic) {
      choices.push({
        text: '【轮回兵解台】封存全身宝物于洞府，催动造化轮回盘从容转生！',
        hint: '高额继承资质造诣 · 宝物留府',
        action: () => {
          setDialogue(null);
          executeReincarnation(ctx, 'calm', null);
        }
      });
    }

    choices.push({ text: '离开仙府石室', action: () => { setDialogue(null); renderAll(); } });

    setDialogue({
      speaker: `云隐仙府 · 第 ${G.lifeCount || 1} 世道场`, asset: ASSETS.hero,
      text: `洞府内灵雾氤氲，护府大阵运转不息。当前寿元 ${G.age}/${G.maxAge} 岁；藏宝室封存宝物 ${vaultItemCnt} 件、灵石 ${vaultStones} 枚。${holdingRelic ? '你怀中【造化轮回盘】微放毫光，随时可在此安全兵解转世。' : '（当前尚未寻获【造化轮回盘】，切莫寿尽坐化！）'}`,
      choices
    });
  }

  // ===== 6. 追索前世野外遗骸（妖兽看守30年判定）& 手刃前世宿敌 =====
  function checkRemainsOrNemesisAt(ctx, locId) {
    const { G, D, ASSETS, setDialogue, startBattle, addItem, showToast, saveGame, renderAll } = ctx;

    // A. 检查是否有前世妖兽盘踞遗骸在此地
    if (G.worldRemains && G.worldRemains.loc === locId) {
      const rem = G.worldRemains;
      const elapsed = G.month - rem.dropMonth;
      const expired = elapsed > rem.deadlineMonths;
      if (expired) {
        // 超过年限！已被其他修士斩杀妖兽取走，珍品流入鬼市回购池
        G.stolenMarketPool = G.stolenMarketPool || [];
        Object.entries(rem.loot.items || {}).forEach(([id, cnt]) => {
          const it = D.ITEMS[id];
          if (it && (it.unique || it.tier === '玄品' || it.tier === '地品' || it.type === 'treasure')) {
            G.stolenMarketPool.push(id);
          }
        });
        G.worldRemains = null;
        setDialogue({
          speaker: '前世陨落旧址', asset: ASSETS.elder,
          text: `距你前世陨落已过去 ${Math.floor(elapsed / 12)} 年（超出 ${Math.floor(rem.deadlineMonths / 12)} 年时限）！只见看守妖兽【${rem.beastName}】早已化作枯骨，显然多年前已有路过修士斩妖取走了你的前世遗物……其中珍品或许已流落至【鬼市装备坊】！`,
          choices: [{ text: '叹息离去', action: () => { setDialogue(null); saveGame('auto', true); renderAll(); } }]
        });
        return true;
      }

      const leftYears = Math.max(1, Math.ceil((rem.deadlineMonths - elapsed) / 12));
      setDialogue({
        speaker: `前世遗骸 · ${rem.beastName}盘踞`, asset: ASSETS.wolf_boss,
        text: `你在乱石间发现了自己上一世的枯骨与散落法器！仇兽【${rem.beastName}】正盘踞其上吐纳妖气（距被其他修士发现尚余约 ${leftYears} 年）。`,
        choices: [
          {
            text: `斩杀【${rem.beastName}】，夺回前世全部遗物！`, hint: `HP ${rem.hp} · 攻 ${rem.atk}`,
            action: () => {
              startBattle({
                name: `守尸凶兽·${rem.beastName}`, asset: ASSETS.wolf_boss, bg: 'forest',
                enemyType: 'beast', hp: rem.hp, maxHp: rem.hp, atk: rem.atk, expReward: 150, stoneReward: 40,
                onWin: () => {
                  const res = mergeLootToPlayer(G, rem.loot, addItem);
                  G.worldRemains = null;
                  showToast(`大仇得报！从凶兽爪下完好夺回前世 ${res.itemTypes} 种宝物与 ${res.stones} 枚灵石！`);
                  saveGame('auto', true);
                }
              });
            }
          },
          { text: '实力未复，暂且隐忍', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return true;
    }

    // B. 检查是否有搜走前世遗物的宿敌修士在此地
    if (G.nemesis && G.nemesis.loc === locId) {
      const nem = G.nemesis;
      setDialogue({
        speaker: `前世死敌 · ${nem.name}`, asset: ASSETS.elder,
        text: `冤家路窄！当年杀害你前世并搜走全身身家的【${nem.name}】正现身此地，借你前世资粮其气息愈发强横！`,
        choices: [
          {
            text: `新仇旧恨一并清算！手刃【${nem.name}】夺回前世身家`, hint: `HP ${nem.hp} · 攻 ${nem.atk}`,
            action: () => {
              startBattle({
                name: `前世死敌·${nem.name}`, asset: ASSETS.elder, bg: 'world_map',
                enemyType: 'cultivator', hp: nem.hp, maxHp: nem.hp, atk: nem.atk, expReward: 280, stoneReward: 80,
                onWin: () => {
                  const res = mergeLootToPlayer(G, nem.loot, addItem);
                  G.nemesis = null;
                  G.fame = (G.fame || 0) + 45;
                  showToast(`手刃前世死敌！从其储物袋中悉数搜回前世 ${res.itemTypes} 种遗物与 ${res.stones} 灵石！`);
                  saveGame('auto', true);
                }
              });
            }
          },
          { text: '敛息退避，待神通大成再来诛此獠', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return true;
    }

    return false;
  }

  return {
    getElemAptitude,
    ensureWorldRelic,
    hasRelic,
    tryDiscoverRelicAt,
    executeReincarnation,
    triggerTrueDeath,
    openCaveAbode,
    checkRemainsOrNemesisAt
  };
})();
