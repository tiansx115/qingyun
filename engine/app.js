const D = window.GAME_DATA;
const ASSETS = D.ASSETS_MAP;
const IC = window.ICONS;

let G = null;
let currentLocationId = null;
let activePanel = null; // null | 'status' | 'allies' | 'save'
let statusSubTab = 'mingge'; // 'mingge' | 'skills' | 'bag'
let selectedAllyId = 'sister';
let allySubMode = 'ally'; // 'ally' | 'beast'
let selectedBeastId = 'wolf';
let selectedBagItem = null;
let selectedEquipSlot = null;
let bagFilter = 'all'; // 'all' | 'equip' | 'treasure' | 'other'
let allyExprMap = { sister: 'normal', elder: 'normal', shen: 'normal', liu: 'normal', moli: 'normal' };
let activeDialogue = null;

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2200);
}
function triggerShake() {
  const el = document.getElementById('app');
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
}

function defaultState() {
  return {
    name: '陈清安', realmIdx: 0,
    hp: 130, maxHp: 130, qi: 85, maxQi: 85, exp: 0,
    body: 10, wit: 10, speed: 10, luck: 10, sense: 10, fame: 0,
    elements: { gold: 72, wood: 52, water: 58, fire: 46, earth: 54 },
    root: '五行灵根', talent: '残魂相伴', sect: '散修',
    age: 18, maxAge: 100, month: 1, stone: 85,
    heartArt: 'turtle_breath',
    ownedHeartArts: ['turtle_breath', 'qingyun_breath'],
    passives: ['p_crit_edge'],
    ownedPassives: ['p_crit_edge', 'p_heavy_force', 'p_venom_mist', 'p_thorns_shell', 'p_beast_bond', 'p_blood_fury'],
    skills: ['basic_sword', 'evade_step', 'venom_dart', 'sweep_staff'],
    skillProf: {
      basic_sword: { lv: 1, exp: 0 },
      evade_step:  { lv: 1, exp: 0 },
      venom_dart:  { lv: 1, exp: 0 },
      sweep_staff: { lv: 1, exp: 0 }
    },
    equipment: {
      weapon: 'eq_iron_sword',
      clothes: 'eq_cloth_robe',
      head: 'eq_wood_pin',
      boots: 'eq_straw_boots',
      wristL: 'eq_leather_wrist',
      wristR: null,
      acc1: 'eq_clear_jade',
      acc2: null,
      ring: 'eq_wood_ring'
    },
    treasures: [null, null],
    beasts: {},
    activeBeast: null,
    factions: { qingyun: 0, wanbao: 0, nether: 0 },
    activeAlly: null,
    bag: {
      heal_pill: 3, qi_pill: 2, beast_fruit: 2, osmanthus_cake: 2,
      mystery_box: 1, eq_qingyun_sword: 1, tr_poison_needle: 1
    },
    allies: buildInitialAllies(),
    flags: {}
  };
}

function buildInitialAllies() {
  const res = {};
  Object.values(D.ALLY_DEFS || {}).forEach(def => {
    res[def.id] = {
      id: def.id,
      unlocked: Boolean(def.unlockedByDefault),
      bond: def.baseBond,
      power: def.power
    };
  });
  return res;
}

function getAllyDef(id) {
  return (D.ALLY_DEFS && D.ALLY_DEFS[id]) || D.ALLY_DEFS.sister;
}

function syncUnlockedAllies() {
  if (!G || !G.allies) return;
  if ((G.factions?.wanbao || 0) >= 1 && G.allies.shen) G.allies.shen.unlocked = true;
  if (G.flags?.divorceBranch && G.allies.liu) G.allies.liu.unlocked = true;
  if ((G.factions?.nether || 0) >= 1 && G.allies.moli) G.allies.moli.unlocked = true;
}

function getAllyAsset(id, forceExpr) {
  const def = getAllyDef(id);
  const exKey = forceExpr || allyExprMap[id] || 'normal';
  const found = def.exprs.find(e => e.key === exKey) || def.exprs[0];
  return ASSETS[found.asset] || ASSETS[found.fallback] || ASSETS.elder;
}
function getItemIcon(id) {
  if (D.ITEMS[id]?.icon) return ASSETS[D.ITEMS[id].icon];
  return ASSETS.item_spirit_stone;
}

const PROF_NAMES = ['', '初窥', '小成', '大成', '圆满'];

function gainSkillProf(skillId, pts = 15) {
  G.skillProf = G.skillProf || {};
  if (!G.skillProf[skillId]) G.skillProf[skillId] = { lv: 1, exp: 0 };
  const p = G.skillProf[skillId];
  if (p.lv < 4) {
    const bonusPts = Math.round(pts * (1 + (G.wit || 10) * 0.03));
    p.exp += bonusPts;
    const need = p.lv * 45;
    if (p.exp >= need) {
      p.exp -= need;
      p.lv = Math.min(4, p.lv + 1);
      showToast(`【${D.SKILLS[skillId]?.name || skillId}】突破至「${PROF_NAMES[p.lv]}」！`);
    }
  }
  return p;
}

function getCatMastery(catId) {
  if (!G || !G.skills) return 0;
  let total = 0;
  G.skills.forEach(sid => {
    const sk = D.SKILLS[sid];
    if (!sk || sk.cat !== catId) return;
    const p = (G.skillProf && G.skillProf[sid]) || { lv: 1, exp: 0 };
    const contrib = Math.min(22, (p.lv - 1) * 7 + Math.min(6, Math.floor((p.exp || 0) / 10)) + 1);
    total += contrib;
  });
  return Math.min(100, total);
}

function normalizeState(st) {
  const def = defaultState();
  if (typeof st.speed !== 'number') st.speed = st.mind || 10;
  if (typeof st.sense !== 'number') st.sense = st.talk || 10;
  st.factions = Object.assign({ qingyun: 0, wanbao: 0, nether: 0 }, st.factions || {});
  st.flags = st.flags || {};
  st.bag = st.bag || {};
  st.beasts = st.beasts || {};
  st.treasures = Array.isArray(st.treasures) ? [st.treasures[0] || null, st.treasures[1] || null] : def.treasures.slice();
  st.passives = Array.isArray(st.passives) ? st.passives.filter(p => D.PASSIVES[p]).slice(0, 3) : def.passives.slice();
  st.ownedPassives = Array.isArray(st.ownedPassives) && st.ownedPassives.length ? st.ownedPassives : def.ownedPassives.slice();
  st.skills = (st.skills || def.skills).filter(sid => D.SKILLS[sid]);
  if (!st.skills.length) st.skills = def.skills.slice();
  st.skillProf = st.skillProf || {};
  st.skills.forEach(sid => { if (!st.skillProf[sid]) st.skillProf[sid] = { lv: 1, exp: 0 }; });

  const oldEq = st.equipment || {};
  if (!('clothes' in oldEq) || !('ring' in oldEq)) {
    st.equipment = {
      weapon: typeof oldEq.weapon === 'string' && D.ITEMS[oldEq.weapon] ? oldEq.weapon : 'eq_iron_sword',
      clothes: typeof oldEq.robe === 'string' && D.ITEMS[oldEq.robe] ? oldEq.robe : 'eq_cloth_robe',
      head: 'eq_wood_pin',
      boots: typeof oldEq.boots === 'string' && D.ITEMS[oldEq.boots] ? oldEq.boots : 'eq_straw_boots',
      wristL: 'eq_leather_wrist',
      wristR: null,
      acc1: typeof oldEq.pendant === 'string' && D.ITEMS[oldEq.pendant] ? oldEq.pendant : 'eq_clear_jade',
      acc2: null,
      ring: 'eq_wood_ring'
    };
  }

  const mergedAllies = buildInitialAllies();
  Object.keys(mergedAllies).forEach(k => {
    if (st.allies && st.allies[k]) {
      mergedAllies[k].bond = typeof st.allies[k].bond === 'number' ? st.allies[k].bond : mergedAllies[k].bond;
      if (st.allies[k].unlocked) mergedAllies[k].unlocked = true;
    }
  });
  st.allies = mergedAllies;
  if ((st.factions.wanbao || 0) >= 1 && st.allies.shen) st.allies.shen.unlocked = true;
  if (st.flags.divorceBranch && st.allies.liu) st.allies.liu.unlocked = true;
  if ((st.factions.nether || 0) >= 1 && st.allies.moli) st.allies.moli.unlocked = true;
  return st;
}

function getActiveSets() {
  const cnt = {};
  if (!G || !G.equipment) return cnt;
  D.EQUIP_SLOTS.forEach(s => {
    const id = G.equipment[s.key];
    const it = id && D.ITEMS[id];
    if (it && it.set) cnt[it.set] = (cnt[it.set] || 0) + 1;
  });
  return cnt;
}

function getEquipStats() {
  const sum = {
    atk: 0, def: 0, hpMax: 0, qiMax: 0, crit: 0, dodge: 0,
    expRate: 0, healBonus: 0, body: 0, speed: 0, luck: 0, sense: 0,
    bagCap: 15, uniqueEffects: []
  };
  if (!G || !G.equipment) return sum;
  D.EQUIP_SLOTS.forEach(s => {
    const id = G.equipment[s.key];
    const it = id && D.ITEMS[id];
    if (!it) return;
    if (it.uniqueEffect) sum.uniqueEffects.push(it.uniqueEffect);
    if (!it.stats) return;
    for (const [k, v] of Object.entries(it.stats)) {
      if (k === 'bagCap') sum.bagCap = Math.max(sum.bagCap, v);
      else sum[k] = (sum[k] || 0) + v;
    }
  });
  return sum;
}

function formatStatSummary(stats) {
  if (!stats) return '纯外物（不加个人属性）';
  const labels = {
    atk: v => `攻击 ${v >= 0 ? '+' : ''}${v}`,
    def: v => `防御 ${v >= 0 ? '+' : ''}${v}`,
    hpMax: v => `气血 ${v >= 0 ? '+' : ''}${v}`,
    qiMax: v => `灵力 ${v >= 0 ? '+' : ''}${v}`,
    crit: v => `暴击 +${Math.round(v * 100)}%`,
    dodge: v => `闪避 +${Math.round(v * 100)}%`,
    expRate: v => `修炼 +${Math.round(v * 100)}%`,
    healBonus: v => `丹效 +${Math.round(v * 100)}%`,
    body: v => `根骨 +${v}`,
    speed: v => `遁速 +${v}`,
    luck: v => `气运 +${v}`,
    sense: v => `神识 +${v}`,
    bagCap: v => `储物 ${v} 格`
  };
  return Object.entries(stats)
    .filter(([k, v]) => labels[k] && v !== 0)
    .map(([k, v]) => labels[k](v))
    .join(' · ') || '无基础属性';
}

function recalcDerivedStats(fullHeal = false) {
  if (!G) return;
  const realm = D.REALMS[G.realmIdx] || D.REALMS[0];
  const ha = D.HEART_ARTS[G.heartArt] || {};
  const eq = getEquipStats();
  const sets = getActiveSets();
  const prevMaxHp = G.maxHp || realm.maxHp;
  const prevMaxQi = G.maxQi || realm.maxQi;
  G.maxHp = Math.max(50, realm.maxHp + ((G.body || 10) + eq.body) * 5 + (ha.hpBonus || 0) + eq.hpMax + (sets.iron >= 2 ? 80 : 0));
  G.maxQi = Math.max(40, realm.maxQi + ((G.sense || 10) + eq.sense) * 3 + (ha.qiBonus || 0) + eq.qiMax);
  if (fullHeal) {
    G.hp = G.maxHp; G.qi = G.maxQi;
  } else {
    if (G.maxHp > prevMaxHp) G.hp += (G.maxHp - prevMaxHp);
    if (G.maxQi > prevMaxQi) G.qi += (G.maxQi - prevMaxQi);
    G.hp = Math.max(1, Math.min(G.maxHp, G.hp));
    G.qi = Math.max(0, Math.min(G.maxQi, G.qi));
  }
}

function addItem(id, cnt = 1) {
  G.bag[id] = (G.bag[id] || 0) + cnt;
}

function getUnlockedTreasureSlots() {
  if (!G) return 0;
  const eq = getEquipStats();
  const totalSense = (G.sense || 10) + (eq.sense || 0);
  if (totalSense >= 32 || (G.realmIdx || 0) >= 4) return 2;
  if (totalSense >= 18 || (G.realmIdx || 0) >= 3) return 1;
  return 0;
}

function equipItem(id) {
  const it = D.ITEMS[id];
  if (!it || (G.bag[id] || 0) <= 0) return;

  // Pure external treasure (unlocked by 神识: 0 -> 1 at 神识>=18/筑基, 2 at 神识>=32/金丹)
  if (it.type === 'treasure') {
    const eq = getEquipStats();
    const totalSense = (G.sense || 10) + (eq.sense || 0);
    const unlocked = getUnlockedTreasureSlots();
    if (unlocked <= 0) {
      return showToast(`神识尚浅（当前 ${totalSense}，需神识 18 或筑基境），尚无法驾驭任何体外法宝！`);
    }
    G.treasures = G.treasures || [null, null];
    let targetIdx = 0;
    if (unlocked === 2) {
      targetIdx = G.treasures[0] === null ? 0 : (G.treasures[1] === null ? 1 : 0);
    }
    const prev = G.treasures[targetIdx];
    G.bag[id] -= 1; if (G.bag[id] <= 0) delete G.bag[id];
    if (prev) addItem(prev, 1);
    G.treasures[targetIdx] = id;
    selectedBagItem = null;
    SFX.play('click');
    showToast(`已以神识御物，装配体外法宝【${it.name}】至槽位 ${targetIdx + 1}。`);
    saveGame('auto', true); renderAll();
    return;
  }

  if (it.type !== 'equip' || !it.slot) return;
  let targetSlot = it.slot;
  if (it.slot === 'wrist') targetSlot = !G.equipment.wristL ? 'wristL' : (!G.equipment.wristR ? 'wristR' : 'wristL');
  else if (it.slot === 'acc') targetSlot = !G.equipment.acc1 ? 'acc1' : (!G.equipment.acc2 ? 'acc2' : 'acc1');

  const prevId = G.equipment[targetSlot];
  G.bag[id] -= 1;
  if (G.bag[id] <= 0) delete G.bag[id];
  if (prevId && D.ITEMS[prevId]) addItem(prevId, 1);
  G.equipment[targetSlot] = id;
  recalcDerivedStats(false);
  selectedEquipSlot = targetSlot;
  selectedBagItem = null;
  SFX.play('click');
  showToast(prevId ? `已替换穿戴【${it.name}】。` : `已穿戴【${it.name}】。`);
  saveGame('auto', true);
  renderAll();
}

function unequipSlot(slot) {
  if (slot.startsWith('tr_')) {
    const idx = Number(slot.split('_')[1]);
    const cur = G.treasures && G.treasures[idx];
    if (!cur) return;
    G.treasures[idx] = null;
    addItem(cur, 1);
    selectedEquipSlot = null; selectedBagItem = cur;
    SFX.play('click');
    showToast(`已收回外物法宝【${D.ITEMS[cur]?.name || cur}】。`);
    saveGame('auto', true); renderAll();
    return;
  }
  const curId = G.equipment[slot];
  if (!curId) return;
  const it = D.ITEMS[curId];
  G.equipment[slot] = null;
  addItem(curId, 1);
  recalcDerivedStats(false);
  selectedEquipSlot = null;
  selectedBagItem = curId;
  SFX.play('click');
  showToast(`已卸下【${it ? it.name : curId}】，放回乾坤行囊。`);
  saveGame('auto', true);
  renderAll();
}
function getDateStr() {
  const y = Math.floor((G.month - 1) / 12) + 1;
  const s = ['春','春','春','夏','夏','夏','秋','秋','秋','冬','冬','冬'][(G.month - 1) % 12];
  return `第${y}年·${s}`;
}
function getNextTimelineText() {
  const active = D.TIMELINE.find(t => {
    if (G.month < t.month) return false;
    if (t.loc === 'sect' && (G.factions?.qingyun || 0) < 2) return true;
    if (t.loc === 'market' && (G.factions?.wanbao || 0) < 2) return true;
    if (t.loc === 'forest' && (G.flags?.forestRuinStage || 0) < 2) return true;
    if (t.loc === 'cliff' && !G.flags?.divorceResolved) return true;
    return false;
  });
  if (active) return `正在发生：${active.title}`;
  const next = D.TIMELINE.find(t => t.month > G.month);
  return next ? `${next.title}（余${next.month - G.month}月）` : '东洲风云变幻，大道可期';
}
function advanceTime(months = 1) {
  G.month += months;
  if (G.month % 12 === 1) G.age += 1;
  if (G.age >= G.maxAge && window.MINIGAMES) {
    window.MINIGAMES.openEnding(getEventCtx());
  }
}
function gainExp(amt) {
  const ha = D.HEART_ARTS[G.heartArt] || { expBonus: 0 };
  const eq = getEquipStats();
  const bonus = Math.floor(amt * (1 + G.wit * 0.03 + (ha.expBonus || 0) + (eq.expRate || 0)));
  G.exp += bonus;
  const need = D.REALMS[G.realmIdx].exp;
  if (G.exp >= need && !D.REALMS[G.realmIdx + 1]?.tribulation) tryRealmUp(false);
  return bonus;
}
function tryRealmUp(fromAltar) {
  const next = D.REALMS[G.realmIdx + 1];
  if (!next) return showToast('已至当前版本最高境界。');
  if (G.exp < D.REALMS[G.realmIdx].exp) return showToast('修为尚未圆满。');
  if (next.tribulation && !fromAltar) return showToast('大境界突破需前往【九霄渡劫台】引雷破境。');
  G.exp -= D.REALMS[G.realmIdx].exp;
  G.realmIdx++;
  G.maxAge += next.ageBonus;
  recalcDerivedStats(true);
  SFX.play('levelup'); FX.burst('235,210,155', 40, 0.5, 0.5);
  showToast(`突破成功！踏入【${next.name}】，寿元增至 ${G.maxAge} 岁。`);
}

// Dynamic SVG Five-Element Star Chart
function buildRadarSvg(el) {
  const cx = 75, cy = 75, R = 50;
  const labels = [
    { k:'gold', t:'金', a:-90, c:'#ebd29b' },
    { k:'earth', t:'土', a:-18, c:'#d6a874' },
    { k:'fire', t:'火', a:54, c:'#e07060' },
    { k:'water', t:'水', a:126, c:'#6cc4f0' },
    { k:'wood', t:'木', a:198, c:'#74d49e' }
  ];
  const pt = (r, deg) => {
    const rad = deg * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const outer = labels.map(l => pt(R, l.a).join(',')).join(' ');
  const inner = labels.map(l => pt(R * 0.55, l.a).join(',')).join(' ');
  const valPts = labels.map(l => pt(R * Math.min(1, (el[l.k] || 50) / 100), l.a).join(',')).join(' ');
  const starLines = [0,1,2,3,4].map(i => {
    const a = pt(R, labels[i].a), b = pt(R, labels[(i+2)%5].a);
    return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="rgba(212,184,122,0.18)" stroke-width="0.8"/>`;
  }).join('');
  const lblHtml = labels.map(l => {
    const p = pt(R + 14, l.a);
    return `<text x="${p[0]}" y="${p[1]+4}" text-anchor="middle" fill="${l.c}" font-size="11" font-family="Songti SC, serif">${l.t}</text>`;
  }).join('');
  return `
    <svg class="radar-svg" viewBox="0 0 150 150">
      <circle cx="75" cy="75" r="${R}" fill="none" stroke="rgba(212,184,122,0.16)" stroke-width="0.8"/>
      <polygon points="${outer}" fill="none" stroke="rgba(212,184,122,0.35)" stroke-width="0.9"/>
      <polygon points="${inner}" fill="none" stroke="rgba(212,184,122,0.18)" stroke-width="0.7"/>
      ${starLines}
      <polygon points="${valPts}" fill="rgba(235,210,155,0.22)" stroke="#ebd29b" stroke-width="1.4"/>
      ${lblHtml}
    </svg>
  `;
}

function startQuiz() {
  if (window.COMBAT) window.COMBAT.stop();
  G = defaultState();
  const leg = window.LEGACY ? window.LEGACY.load() : { runs: 0, points: 0, endings: [] };
  if (leg.points > 0) {
    const statBonus = Math.min(6, leg.points);
    G.body += statBonus; G.wit += statBonus; G.speed += statBonus; G.luck += statBonus; G.sense += statBonus;
    G.stone += leg.points * 25;
  }
  currentLocationId = null; activePanel = null; activeDialogue = null;
  let step = 0;
  const root = document.getElementById('title-root');
  root.style.display = 'flex';
  root.style.backgroundImage = `url("${ASSETS.ui3a_title_bg}")`;

  function renderStep() {
    if (step === 0 && !G._introDone) {
      const legNote = leg.points > 0
        ? `<div class="legacy-banner">前世传承（第 ${leg.runs + 1} 世 · ${leg.points} 点）：六维 +${Math.min(6, leg.points)} · 灵石 +${leg.points * 25}</div>`
        : '';
      root.innerHTML = `
        <div class="home-layout">
          <div class="home-brand">
            <img class="home-logo-art" src="${ASSETS.ui3a_logo}" alt="青云问道录" />
            <div class="home-tagline">东洲修仙志 · 3A 写实横屏独立版</div>
            ${legNote}
          </div>
          <div class="home-plaques">
            <button class="plaque-btn primary" id="btn-new">踏入仙途</button>
            <button class="plaque-btn" id="btn-load-auto">续读旧档</button>
            <button class="plaque-btn" id="btn-codex">山河图鉴</button>
            <button class="plaque-btn" id="btn-sys">系统设置</button>
          </div>
        </div>
      `;
      document.getElementById('btn-new').onclick = () => { SFX.play('click'); G._introDone = true; root.style.backgroundImage = `url("${ASSETS.world_map}")`; renderStep(); };
      document.getElementById('btn-load-auto').onclick = () => {
        SFX.play('click');
        if (loadGame('auto')) { root.style.display = 'none'; renderAll(); }
        else showToast('尚无旧档，请点击「踏入仙途」开启新局。');
      };
      document.getElementById('btn-codex').onclick = () => {
        SFX.play('click');
        let cTab = 'locs';
        const renderCodex = () => {
          const body = window.MINIGAMES._mountShell('山河图鉴 · 东洲名录', `已收录结局 ${leg.endings.length} / ${(D.ENDINGS||[]).length}`);
          body.innerHTML = `
            <div class="gp-tabs" style="margin-bottom:4px;">
              <button class="gp-tab ${cTab==='locs'?'active':''}" data-ct="locs">东洲地标</button>
              <button class="gp-tab ${cTab==='ends'?'active':''}" data-ct="ends">天命结局录</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
              ${cTab === 'locs'
                ? D.LOCATIONS.map(l => `<div class="glass-card"><div><h4>${l.name}</h4><p>${l.desc}</p></div></div>`).join('')
                : (D.ENDINGS || []).map(e => {
                    const got = leg.endings.includes(e.id);
                    return `<div class="glass-card ${got?'active':''}"><div><h4>${got ? e.title : '？？？（未解锁）'}</h4><p>${got ? e.desc : '尚待有缘人于东洲历练中证得此局。'}</p></div><span style="font-size:10.5px;color:${got?'var(--jade)':'var(--muted)'};flex-shrink:0;">${got?'已收录':'未解锁'}</span></div>`;
                  }).join('')
              }
            </div>
          `;
          body.querySelectorAll('[data-ct]').forEach(b => {
            b.onclick = () => { SFX.play('click'); cTab = b.dataset.ct; renderCodex(); };
          });
        };
        renderCodex();
      };
      document.getElementById('btn-sys').onclick = () => {
        SFX.play('click');
        root.style.display = 'none';
        activePanel = 'status'; statusSubTab = 'save';
        renderAll();
      };
      return;
    }

    if (step < D.QUIZ.length) {
      const q = D.QUIZ[step];
      const cnNum = ['壹', '贰', '叁'];
      const stepsHtml = D.QUIZ.map((_, idx) => `<span class="quiz-step-pill ${idx===step?'active':(idx<step?'done':'')}">第${cnNum[idx]||idx+1}问</span>`).join('');
      root.innerHTML = `
        <div class="title-box">
          <div class="quiz-steps">${stepsHtml}</div>
          <h2 class="title-main" style="font-size:18px;letter-spacing:3px;">问道初测</h2>
          <p style="font-size:13.5px;line-height:1.76;color:#f0ebe1;margin:8px 0 14px;">${q.q}</p>
          <div id="q-opts"></div>
        </div>
      `;
      const box = document.getElementById('q-opts');
      q.opts.forEach((o, idx) => {
        const b = document.createElement('button'); b.className = 'quiz-btn';
        b.innerHTML = `<span class="quiz-idx">0${idx + 1}</span><span>${o.t}</span>`;
        b.onclick = () => {
          SFX.play('click');
          for (const [k,v] of Object.entries(o.eff)) {
            if (k === 'root' || k === 'talent') G[k] = v;
            else if (k === 'skill') { if (!G.skills.includes(v)) G.skills.push(v); }
            else G[k] = (G[k] || 0) + v;
          }
          step++; renderStep();
        };
        box.appendChild(b);
      });
    } else {
      root.innerHTML = `
        <div class="title-box">
          <h2 class="title-main" style="font-size:19px;letter-spacing:4px;">命格已定 · 启程东洲</h2>
          <div style="display:flex;align-items:center;gap:18px;margin:10px 0 14px;">
            ${buildRadarSvg(G.elements)}
            <div style="flex:1;font-size:12.5px;line-height:1.85;color:#dfd6c6;">
              <div><b style="color:#ebd29b;">灵根资质：</b>${G.root}</div>
              <div><b style="color:#ebd29b;">先天气运：</b>${G.talent}</div>
              <div><b style="color:#ebd29b;">核心五维：</b>根骨 ${G.body} · 悟性 ${G.wit} · 遁速 ${G.speed} · 气运 ${G.luck} · 神识 ${G.sense}</div>
              <div><b style="color:#ebd29b;">初始盘缠：</b>${G.stone} 灵石</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--gold-hair);">
            <span style="font-size:12.5px;color:var(--muted);">赐立道号：</span>
            <input id="inp-name" value="${G.name}" maxlength="8" style="background:rgba(8,10,12,0.85);border:1px solid var(--gold);color:#ebd29b;padding:7px 12px;font-family:inherit;font-size:13px;" />
            <button class="sleek-btn" id="btn-enter">踏入青云界</button>
          </div>
        </div>
      `;
      document.getElementById('btn-enter').onclick = () => {
        const val = document.getElementById('inp-name').value.trim();
        if (val) G.name = val;
        recalcDerivedStats(true);
        SFX.play('levelup'); root.style.display = 'none';
        saveGame('auto', true); renderAll();
      };
    }
  }
  renderStep();
}

function enterLocation(locId) {
  SFX.play('click'); currentLocationId = locId; activePanel = null; activeDialogue = null; renderAll();
}

function interactNpc(npcId) {
  SFX.play('click');
  if (npcId === 'sister') {
    const bonded = G.allies.sister.bond;
    const choices = [];
    if (G.sect === '散修') {
      choices.push({
        text: '行拜师礼，正式拜入青云剑宗', hint: '获心法与青霜剑胚',
        action: () => {
          G.sect = '青云剑宗'; G.factions.qingyun = Math.max(G.factions.qingyun || 0, 1);
          G.allies.sister.bond += 15; G.fame += 10;
          if (!G.ownedHeartArts.includes('qingyun_breath')) G.ownedHeartArts.push('qingyun_breath');
          if (!G.skills.includes('sister_frost')) G.skills.push('sister_frost');
          G.artifacts.frost_embryo = G.artifacts.frost_embryo || 1; G.artifactId = 'frost_embryo';
          addItem('eq_qingyun_sword', 1);
          allyExprMap.sister = 'smile';
          activeDialogue = {
            speaker: '林清霜', asset: ASSETS.sister_smile,
            text: '她微微颔首，唇角露出一丝难得的浅笑：“既入青云门下，日后便是我师弟了。这柄青云制式剑、寒霜剑胚与吐纳心法，你且收好。”',
            choices: [{ text:'多谢师姐照拂', action:()=>{ activeDialogue=null; saveGame('auto',true); renderAll(); } }]
          };
          renderAll();
        }
      });
    }
    choices.push({
      text: '请大师姐演武拆招', hint: '实战切磋',
      action: () => { allyExprMap.sister = 'fierce'; startBattle({ name:'林清霜（压制境界）', asset:ASSETS.sister_fierce, bg:'sect_plaza', hp:155, maxHp:155, atk:18, talkDef:20, expReward:65, stoneReward:25 }); }
    });
    if ((G.bag.osmanthus_cake || 0) > 0) {
      choices.push({
        text: '赠予【云州桂花糕】', hint: '交情+20',
        action: () => {
          G.bag.osmanthus_cake--; G.allies.sister.bond += 20; allyExprMap.sister = 'smile';
          activeDialogue = {
            speaker: '林清霜', asset: ASSETS.sister_smile,
            text: '她接过食盒，眼底寒意顿时化开，轻声一笑：“你倒是有心，竟知我偏爱云州桂花糕。”（交情 +20）',
            choices: [{ text:'师姐喜欢便好', action:()=>{ activeDialogue=null; saveGame('auto',true); renderAll(); } }]
          };
          renderAll();
        }
      });
    }
    choices.push({ text:'打开伙伴详情与交互面板', hint:'鉴赏/同行', action:()=>{ activeDialogue=null; selectedAllyId='sister'; activePanel='allies'; renderAll(); } });
    choices.push({ text:'拱手告辞', action:()=>{ activeDialogue=null; renderAll(); } });
    activeDialogue = {
      speaker: '林清霜', asset: getAllyAsset('sister'),
      text: G.sect === '散修'
        ? '演武场上剑风猎猎。林清霜收剑入鞘，抬眸望向你：“外门今秋正缺守山弟子，你既来青云，可是有意拜入山门？”'
        : '“今日云海灵气尚佳。你是要与我拆招试剑，还是另有要事相商？”',
      choices
    };
  } else if (npcId === 'elder') {
    const choices = [
      {
        text: '以 15 灵石温养残魂，求教《玄虚剑经》与指诀', hint: '修为+55 交情+12',
        action: () => {
          if (G.stone < 15) return showToast('灵石不足 15 枚。');
          G.stone -= 15; G.allies.elder.bond += 12;
          if (!G.skills.includes('grandpa_finger')) G.skills.push('grandpa_finger');
          if (!G.ownedHeartArts.includes('xuanxu_sutra')) G.ownedHeartArts.push('xuanxu_sutra');
          const g = gainExp(55);
          showToast(`修为 +${g}，习得《玄虚一指》与心法《玄虚剑经·残篇》。`);
          activeDialogue = null; saveGame('auto', true); renderAll();
        }
      },
      {
        text: '请玄虚前辈幻化剑影切磋', hint: '实战试炼',
        action: () => startBattle({ name:'玄虚子（残魂剑影）', asset:ASSETS.elder, bg:'world_map', hp:185, maxHp:185, atk:21, talkDef:18, expReward:90, stoneReward:40 })
      },
      { text: '暂且退下', action: () => { activeDialogue = null; renderAll(); } }
    ];
    activeDialogue = {
      speaker: '玄虚子', asset: ASSETS.elder,
      text: '银须老者虚影在崖风中凝而不散：“小友，修真界重利亦重剑。若肯以灵石温养老夫神魂，老夫便将昔年剑经拆解予你。”',
      choices
    };
  } else if (npcId === 'wolf') {
    activeDialogue = {
      speaker: '赤瞳妖狼', asset: ASSETS.wolf_boss,
      text: '妖狼伏在古修洞府石门前，幽青灵雾自鬃毛间升腾，赤红双瞳死死盯着踏入领地的不速之客。',
      choices: [
        { text: '拔剑迎战赤瞳妖狼', hint: '修为+90 灵石+60', action: () => startBattle({ name:'护洞赤瞳妖狼', asset:ASSETS.wolf_boss, bg:'forest', hp:175, maxHp:175, atk:20, talkDef:12, expReward:90, stoneReward:60 }) },
        { text: '缓步退回林外', action: () => { activeDialogue = null; renderAll(); } }
      ]
    };
  } else if (npcId === 'merchant') { handleHotspot('market_shop'); return; }
  else if (npcId === 'innkeeper') { handleHotspot('inn_rumor'); return; }
  else if (npcId === 'shen') { handleHotspot('market_faction'); return; }
  else if (npcId === 'liu') { handleHotspot('cliff_event'); return; }
  else if (npcId === 'moli') { handleHotspot('nether_path'); return; }
  renderAll();
}

function getEventCtx() {
  return {
    G, D, ASSETS,
    setDialogue: d => { activeDialogue = d; },
    startBattle, addItem, gainExp, advanceTime, showToast, saveGame, renderAll, buyItem, openEquipShop,
    getItemIcon, formatStatSummary, startQuiz,
    setAllyExpr: (id, expr) => { allyExprMap[id] = expr; }
  };
}

function openEquipShop() {
  const unlockedHigh = (G.factions?.wanbao || 0) >= 1;
  const stockIds = unlockedHigh
    ? ['eq_frost_blade', 'eq_iron_staff', 'eq_xuan_armor', 'eq_venom_circlet', 'eq_iron_wrist', 'eq_venom_sachet', 'eq_qiankun_ring', 'tr_flying_sword', 'tr_soul_bell']
    : ['eq_qingyun_sword', 'eq_cloud_robe', 'eq_qingyun_crown', 'eq_wind_boots', 'eq_iron_wrist', 'eq_qiankun_ring', 'tr_poison_needle', 'tr_spirit_banner'];
  const choices = stockIds.map(id => {
    const it = D.ITEMS[id];
    return {
      text: `购入【${it.name}】(${it.tier})`,
      hint: `${it.price}灵石 · ${it.type === 'treasure' ? (it.mode === 'auto' ? '悬浮法宝' : '主动法宝') : formatStatSummary(it.stats)}`,
      action: () => buyItem(id)
    };
  });
  choices.push({ text: '离开装备坊', action: () => { activeDialogue = null; renderAll(); } });
  activeDialogue = {
    speaker: '鬼市装备坊', asset: ASSETS.elder,
    text: unlockedHigh
      ? '凭万宝楼验货令入内，玄黑木架上陈列着宗门套装、玄品护腕/头饰/储物戒与外物法宝：“看中哪件直接点货，银货两讫。”'
      : '灯影摇曳的装备摊上摆着各部位灵品装备与外物法宝：“初来乍到先看外摊货色，若想见玄品重宝与孤品，可逛拍卖会或拿万宝楼验货令。”',
    choices
  };
  renderAll();
}

function openLibraryModal() {
  const unlearned = Object.values(D.SKILLS).filter(s => !G.skills.includes(s.id));
  const choices = unlearned.slice(0, 5).map(s => ({
    text: `研习【${s.name}】(${D.SKILL_CATS[s.cat].name} · 集气${s.atbCost})`,
    hint: '25灵石 +1月',
    action: () => {
      if (G.stone < 25) return showToast('灵石不足 25 枚。');
      G.stone -= 25; advanceTime(1);
      G.skills.push(s.id);
      G.skillProf[s.id] = { lv: 1, exp: 0 };
      showToast(`习得招式【${s.name}】！多练同系招式可堆高【${D.SKILL_CATS[s.cat].name}】总造诣。`);
      activeDialogue = null; saveGame('auto', true); renderAll();
    }
  }));
  choices.push({
    text: '静心演武，提升当前出战 4 招熟练度与修为', hint: '+1月 悟性+1',
    action: () => {
      advanceTime(1); G.wit += 1;
      G.skills.slice(0, 4).forEach(sid => gainSkillProf(sid, 24));
      const g = gainExp(48);
      recalcDerivedStats(false);
      showToast(`藏经阁演武一月，修为 +${g}，悟性 +1，出战招式熟练度精进！`);
      activeDialogue = null; saveGame('auto', true); renderAll();
    }
  });
  choices.push({ text: '离开藏经阁', action: () => { activeDialogue = null; renderAll(); } });
  activeDialogue = {
    speaker: '藏经阁长老', asset: ASSETS.elder,
    text: '“武学之道贵在博采众长。单练一招至圆满难成宗师，唯有同系招式皆融会贯通，方能将门类总造诣推至百点化境。”',
    choices
  };
  renderAll();
}

function openBeastTameModal() {
  const choices = Object.values(D.BEAST_DEFS).map(b => {
    const owned = Boolean(G.beasts && G.beasts[b.id]);
    return {
      text: owned ? `已收养【${b.name}】(${b.role})` : `驯化收养【${b.name}】(${b.role})`,
      hint: owned ? '前往灵兽页培养' : `${b.adoptCost}灵石`,
      action: () => {
        if (owned) { activeDialogue = null; activePanel = 'allies'; allySubMode = 'beast'; selectedBeastId = b.id; renderAll(); return; }
        if (G.stone < b.adoptCost) return showToast(`灵石不足 ${b.adoptCost} 枚。`);
        G.stone -= b.adoptCost;
        G.beasts[b.id] = { id: b.id, lv: 1, exp: 0, stage: 0, bond: 20 };
        if (!G.activeBeast) G.activeBeast = b.id;
        SFX.play('levelup');
        showToast(`成功驯化【${b.name}】！已设为主战灵兽，可在「伙伴→灵兽」中喂养进化。`);
        activeDialogue = null; saveGame('auto', true); renderAll();
      }
    };
  });
  choices.push({ text: '暂不驯兽', action: () => { activeDialogue = null; renderAll(); } });
  activeDialogue = {
    speaker: '万妖林御兽契', asset: ASSETS.wolf_boss,
    text: '古林灵雾深处蛰伏着数头灵智初开的幼兽。以灵石与神识结下御兽契，便可收养培养并同屏参战。',
    choices
  };
  renderAll();
}

function handleHotspot(hid) {
  SFX.play('click');
  if (hid === 'sect_trial') {
    D.EVENTS.runSectTrial(getEventCtx());
    renderAll();
  } else if (hid === 'sect_library') {
    openLibraryModal();
  } else if (hid === 'sect_alchemy') {
    window.MINIGAMES.openAlchemy(getEventCtx());
  } else if (hid === 'cliff_event') {
    D.EVENTS.runCliffEvent(getEventCtx());
    renderAll();
  } else if (hid === 'inn_tea') {
    if (G.stone < 10) return showToast('囊中灵石不足 10 枚。');
    advanceTime(1); G.stone -= 10; G.wit += 1; recalcDerivedStats(true);
    showToast('在天机阁品茶歇息，气血灵力圆满，悟性 +1。');
    saveGame('auto', true); renderAll();
  } else if (hid === 'inn_rumor') {
    const rumorExtra = G.flags.divorceBranch && !G.flags.divorceResolved && G.month >= 18
      ? ' 另外，玄天宗那边传出风声，柳若云已快破入筑基，第 3 年·冬思过崖怕是有场好戏。'
      : '';
    activeDialogue = {
      speaker: '天机掌柜', asset: ASSETS.elder,
      text: `掌柜擦着青瓷茶壶低声道：“近来万妖古林洞府异动，鬼市深处也常有幽冥玄宗的人出没。对了，青云大师姐私下偏爱云州桂花糕。”${rumorExtra}`,
      choices: [
        { text:'购一盒【云州桂花糕】', hint:'20 灵石', action: () => buyItem('osmanthus_cake') },
        { text:'多谢掌柜指点', action: () => { activeDialogue = null; renderAll(); } }
      ]
    };
    renderAll();
  } else if (hid === 'market_shop') {
    activeDialogue = {
      speaker: '黑坊掌柜', asset: ASSETS.elder,
      text: '幽暗灯笼下，木案上排开丹药、未启封古修遗匣与避雷阵盘：“货真价实，概不赊账。”',
      choices: [
        { text:'购入【桂花回春丹】', hint:'15 灵石', action: () => buyItem('heal_pill') },
        { text:'购入【冰泉聚气散】', hint:'15 灵石', action: () => buyItem('qi_pill') },
        { text:'购入【赤灵妖果】(灵兽口粮)', hint:'25 灵石', action: () => buyItem('beast_fruit') },
        { text:'购入【古修遗匣】', hint:'30 灵石', action: () => buyItem('mystery_box') },
        { text:'购入【避雷引灵阵盘】', hint:'80 灵石', action: () => buyItem('lightning_plate') },
        { text:'离开摊位', action: () => { activeDialogue = null; renderAll(); } }
      ]
    };
    renderAll();
  } else if (hid === 'market_equip') {
    openEquipShop();
  } else if (hid === 'market_auction') {
    window.MINIGAMES.openAuction(getEventCtx());
  } else if (hid === 'market_faction') {
    D.EVENTS.runMarketFaction(getEventCtx());
    renderAll();
  } else if (hid === 'nether_path') {
    D.EVENTS.runNetherPath(getEventCtx());
    renderAll();
  } else if (hid === 'market_trade') {
    const eq = getEquipStats();
    advanceTime(1); const earn = 35 + Math.floor(((G.sense || 10) + eq.sense) * 1.6); G.stone += earn; G.sense += 1;
    showToast(`凭借神识眼力做成一笔鉴宝买卖，净赚 ${earn} 灵石，神识 +1。`);
    saveGame('auto', true); renderAll();
  } else if (hid === 'forest_stall') {
    const eq = getEquipStats();
    advanceTime(1); const earn = 75 + eq.luck * 2; G.stone += earn; G.luck += 1;
    showToast(`在古林谷口设摊售药，半日售罄，净赚 ${earn} 灵石，气运 +1。`);
    saveGame('auto', true); renderAll();
  } else if (hid === 'forest_tame') {
    openBeastTameModal();
  } else if (hid === 'forest_ruin') {
    D.EVENTS.runForestRuin(getEventCtx());
    renderAll();
  } else if (hid === 'altar_break') {
    const next = D.REALMS[G.realmIdx + 1];
    if (!next) return showToast('你已至元婴之境。');
    if (G.exp < D.REALMS[G.realmIdx].exp) return showToast(`修为尚浅（${G.exp}/${D.REALMS[G.realmIdx].exp}）。`);
    if (next.tribulation) {
      activeDialogue = {
        speaker: '九霄雷劫', asset: ASSETS.hero,
        text: `乌云压顶，紫电翻涌！踏入【${next.name}】前须渡过此重天劫。`,
        choices: [
          { text:'以自身修为硬撼天劫', hint:'渡劫战', action: () => startBattle({ name:`${next.name}·九霄雷劫`, asset:ASSETS.wolf_boss, bg:'world_map', hp:220 + G.realmIdx*65, maxHp:220 + G.realmIdx*65, atk:24 + G.realmIdx*6, talkDef:999, expReward:0, stoneReward:85, isTribulation:true }) },
          { text:'祭出【避雷引灵阵盘】分化天雷破境', hint:'消耗阵盘', action: () => {
            if (!G.bag.lightning_plate || G.bag.lightning_plate <= 0) return showToast('行囊中无避雷引灵阵盘。');
            G.bag.lightning_plate--; SFX.play('thunder'); tryRealmUp(true);
            activeDialogue = null; saveGame('auto', true); renderAll();
          }},
          { text:'暂不引雷', action: () => { activeDialogue = null; renderAll(); } }
        ]
      };
      renderAll();
    } else { tryRealmUp(true); renderAll(); }
  } else if (hid === 'altar_ascend') {
    const canEnd = G.realmIdx >= 3 || (G.factions?.qingyun || 0) >= 3 || (G.factions?.wanbao || 0) >= 3 || (G.factions?.nether || 0) >= 3 || Object.values(G.allies || {}).some(a => (a.bond || 0) >= 85);
    if (!canEnd) return showToast('需踏入筑基、任一势力圆满(3/3)或道友羁绊达 85 方可结算结局。');
    window.MINIGAMES.openEnding(getEventCtx());
  }
}

function buyItem(id) {
  const it = D.ITEMS[id];
  if (G.stone < it.price) return showToast('灵石不足。');
  G.stone -= it.price;
  if (it.type === 'box') {
    const r = Math.random();
    if (r < 0.45) { G.stone += 65; showToast('启封遗匣，内藏 65 枚下品灵石。'); }
    else if (r < 0.8) { const g = gainExp(55); showToast(`遗匣中藏有前人心得，修为 +${g}。`); }
    else showToast('遗匣灵气已散，只余碎石。');
  } else { G.bag[id] = (G.bag[id] || 0) + 1; showToast(`购得【${it.name}】×1。`); }
  saveGame('auto', true); renderAll();
}

// Combat (delegated to v6 Real-Time ATB engine/combat.js)
function startBattle(enemy) {
  activeDialogue = null; activePanel = null;
  window.COMBAT.start(enemy, {
    G, D, ASSETS,
    getEquipStats, getActiveSets, getUnlockedTreasureSlots, gainSkillProf, getCatMastery,
    getAllyDef, getAllyAsset, gainExp, tryRealmUp, saveGame,
    setAllyExpr: (id, ex) => { allyExprMap[id] = ex; },
    onBattleStart: () => renderAll(),
    onBattleEnd: () => {
      const cl = document.getElementById('combat-root');
      if (cl) cl.innerHTML = '';
      renderAll();
    }
  });
}

// Save/Load
function saveGame(slot = 'auto', silent = false) {
  try {
    localStorage.setItem('qingyun_v5_save_' + slot, JSON.stringify({ savedAt: new Date().toLocaleString(), data: G }));
    if (!silent) showToast(`已保存至【${slot === 'auto' ? '自动存档' : '卷宗 ' + slot}】。`);
  } catch {}
}
function loadGame(slot = 'auto') {
  try {
    const raw = localStorage.getItem('qingyun_v5_save_' + slot);
    if (!raw) return false;
    if (window.COMBAT) window.COMBAT.stop();
    G = normalizeState(JSON.parse(raw).data);
    recalcDerivedStats(false);
    activeDialogue = null; activePanel = null;
    showToast('读取旧档成功。'); return true;
  } catch { return false; }
}
window.exportSaveCode = () => {
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(G))));
  const box = document.getElementById('save-code-box');
  if (box) { box.value = code; box.select(); }
  if (navigator.clipboard) navigator.clipboard.writeText(code).catch(()=>{});
  showToast('存档码已生成并尝试复制。');
};
window.importSaveCode = () => {
  const box = document.getElementById('save-code-box');
  if (!box || !box.value.trim()) return showToast('请先粘贴存档码。');
  try {
    if (window.COMBAT) window.COMBAT.stop();
    G = normalizeState(JSON.parse(decodeURIComponent(escape(atob(box.value.trim())))));
    recalcDerivedStats(false);
    activeDialogue = null; activePanel = null; saveGame('auto', true);
    showToast('存档码导入成功。'); renderAll();
  } catch { showToast('存档码格式无效。'); }
};

// Render Full-Screen System Overlays (v5.1: Full-Body on Status/Allies; Dual-Panels on Bag/Skills/Save)
function renderSplitPanel() {
  const host = document.getElementById('panel-root');
  host.innerHTML = '';
  if (!activePanel) return;

  const realm = D.REALMS[G.realmIdx];
  const curTab = activePanel === 'allies' ? 'allies' : statusSubTab;
  const sc = document.createElement('div');
  sc.className = 'sys-screen';
  sc.style.backgroundImage = `url("${curTab === 'allies' ? ASSETS.bamboo : ASSETS.world_map}")`;

  const navItems = [
    { k:'mingge', l:'命格' },
    { k:'skills', l:'功法法宝' },
    { k:'bag', l:'行囊装备' },
    { k:'allies', l:'伙伴' },
    { k:'save', l:'卷宗' }
  ];
  const navHtml = navItems.map(n => `<button class="gp-tab ${curTab===n.k?'active':''}" data-nav="${n.k}">${n.l}</button>`).join('');

  sc.innerHTML = `
    <div class="sys-topbar">
      <button class="sleek-btn ghost" id="sp-close">← 返回东洲</button>
      <div class="sys-nav">${navHtml}</div>
      <div class="glass-pill" style="padding:4px 12px;font-size:11px;">
        <img class="mini-ico" src="${ASSETS.item_spirit_stone}"/><b>${G.stone}</b>
      </div>
    </div>
    <div class="sys-main" id="sys-main"></div>
  `;

  sc.querySelector('#sp-close').onclick = () => { SFX.play('click'); activePanel = null; renderAll(); };
  sc.querySelectorAll('[data-nav]').forEach(b => {
    b.onclick = () => {
      SFX.play('click');
      const k = b.dataset.nav;
      if (k === 'allies') activePanel = 'allies';
      else { activePanel = 'status'; statusSubTab = k; }
      renderAll();
    };
  });

  const main = sc.querySelector('#sys-main');

  // 1. 命格页：左侧完整全身像 + 右侧五维、五行星图、门类总造诣(0~100)与修为
  if (curTab === 'mingge') {
    const expPct = Math.min(100, Math.round((G.exp / Math.max(1, realm.exp)) * 100));
    const canBreak = G.exp >= realm.exp && D.REALMS[G.realmIdx + 1];
    const eq = getEquipStats();
    const statItems = [
      ['根骨', (G.body || 10) + (eq.body || 0)],
      ['悟性', G.wit || 10],
      ['遁速', (G.speed || 10) + (eq.speed || 0)],
      ['气运', (G.luck || 10) + (eq.luck || 0)],
      ['神识', (G.sense || 10) + (eq.sense || 0)],
      ['声望', G.fame || 0]
    ];
    const catHtml = Object.values(D.SKILL_CATS).map(c => {
      const m = getCatMastery(c.id);
      return `<div class="cat-pill"><span>${c.name}</span><b>${m}/100</b><div class="stat-mini-bar"><i style="width:${m}%"></i></div></div>`;
    }).join('');

    main.innerHTML = `
      <div class="fullbody-col">
        <div class="fullbody-wrap">
          <img class="full-char" src="${ASSETS.hero_full}" />
          <div class="dantian-waist"></div>
          <div class="lifespan-ring">寿元 ${G.age} / ${G.maxAge} 岁</div>
        </div>
      </div>
      <div class="glass-panel">
        <div class="sec-head"><span>${G.name} · ${realm.name}</span><span style="font-size:11px;color:var(--muted);">${G.root}</span></div>
        <div class="gp-body">
          <div class="radar-wrap">
            ${buildRadarSvg(G.elements)}
            <div style="display:flex;gap:8px;align-items:flex-start;">
              <span class="vermilion-seal">${realm.name}</span>
              <span class="vermilion-seal">${G.talent}</span>
              <span class="vermilion-seal">${G.sect}</span>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:11.5px;">
            ${statItems.map(([lbl, val]) => `
              <div class="glass-card" style="padding:5px 9px;flex-direction:column;align-items:stretch;gap:0;">
                <div style="display:flex;justify-content:space-between;"><span>${lbl}</span><b style="color:#ebd29b;">${val}</b></div>
                <div class="stat-mini-bar"><i style="width:${Math.min(100, val * 2.5)}%"></i></div>
              </div>
            `).join('')}
          </div>
          <div style="font-size:10.5px;color:var(--muted);letter-spacing:1px;">兵器与大道总造诣（博采众长堆至 100 威力翻倍）</div>
          <div class="cat-grid">${catHtml}</div>
          <div class="glass-card">
            <div style="flex:1;min-width:0;">
              <h4>修为进度（${G.exp} / ${realm.exp}）</h4>
              <div class="exp-track"><div class="exp-fill" style="width:${expPct}%"></div></div>
              <p>气血 ${G.hp}/${G.maxHp} · 灵力 ${Math.floor(G.qi)}/${G.maxQi} · 主战灵兽：${G.activeBeast ? D.BEAST_DEFS[G.activeBeast].name : '未出战'}</p>
            </div>
            <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0;">
              <button class="sleek-btn" id="btn-med">静室吐纳 (+1月)</button>
              ${canBreak ? `<button class="sleek-btn" id="btn-break" style="color:var(--jade);">破境突破</button>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
    main.querySelector('#btn-med').onclick = () => {
      SFX.play('click'); advanceTime(1); recalcDerivedStats(true);
      const g = gainExp(38); showToast(`静修一月，状态圆满，修为 +${g}。`);
      saveGame('auto', true); renderAll();
    };
    const brk = main.querySelector('#btn-break');
    if (brk) brk.onclick = () => { tryRealmUp(false); renderAll(); };
  }
  // 2. 行囊装备页：无立绘！左侧 9 格身上穿戴 + 2 格纯外物法宝 + 套装激活；右侧戒指扩容行囊
  else if (curTab === 'bag') {
    const eq = G.equipment || {};
    const eqStats = getEquipStats();
    const ha = D.HEART_ARTS[G.heartArt] || {};
    const sets = getActiveSets();
    const bagCap = eqStats.bagCap || 15;

    const eqHtml = D.EQUIP_SLOTS.map(d => {
      const isSel = selectedEquipSlot === d.key;
      const itemId = eq[d.key];
      const it = itemId && D.ITEMS[itemId];
      return `
        <div class="equip-slot compact ${it ? 'filled' : ''} ${it?.unique ? 'uniq' : ''} ${isSel ? 'selected' : ''}" data-eq-slot="${d.key}">
          ${it ? `<img src="${getItemIcon(itemId)}"/>` : `<div class="eq-empty">空</div>`}
          <div class="eq-meta">
            <div class="eq-type">${d.label}${it && it.tier ? ` · <em class="tier-tag t-${it.tier}">${it.tier}</em>` : ''}</div>
            <div class="eq-name">${it ? it.name : '未穿戴'}</div>
          </div>
        </div>
      `;
    }).join('');

    const unlockedTr = getUnlockedTreasureSlots();
    const totalSense = (G.sense || 10) + (eqStats.sense || 0);
    const trReqs = ['需神识18/筑基', '需神识32/金丹'];
    const trHtml = [0, 1].map(idx => {
      const slotKey = `tr_${idx}`;
      const locked = idx >= unlockedTr;
      const tid = G.treasures && G.treasures[idx];
      const it = tid && D.ITEMS[tid];
      const isSel = selectedEquipSlot === slotKey;
      return `
        <div class="equip-slot compact ${it && !locked ? 'filled' : ''} ${isSel ? 'selected' : ''}" data-eq-slot="${slotKey}" style="${locked ? 'opacity:0.52;' : ''}">
          ${locked ? `<div class="eq-empty">未开</div>` : (it ? `<img src="${getItemIcon(tid)}"/>` : `<div class="eq-empty">外物</div>`)}
          <div class="eq-meta">
            <div class="eq-type">体外法宝 ${idx + 1}${locked ? ` · ${trReqs[idx]}` : (it ? ` · ${it.mode === 'auto' ? '悬浮' : '主动'}` : '')}</div>
            <div class="eq-name">${locked ? '神识不足无法驾驭' : (it ? it.name : '空置可装配')}</div>
          </div>
        </div>
      `;
    }).join('');

    const activeSetStr = Object.entries(sets)
      .filter(([, n]) => n >= 2)
      .map(([sid, n]) => `${D.SETS[sid].name}(${n}件)`).join(' · ') || '未激活套装（可自由混搭孤品）';

    const allOwned = Object.entries(G.bag).filter(([id, c]) => c > 0 && D.ITEMS[id]);
    const owned = allOwned.filter(([id]) => {
      if (bagFilter === 'equip') return D.ITEMS[id].type === 'equip';
      if (bagFilter === 'treasure') return D.ITEMS[id].type === 'treasure';
      if (bagFilter === 'other') return D.ITEMS[id].type !== 'equip' && D.ITEMS[id].type !== 'treasure';
      return true;
    });
    if (!selectedEquipSlot && (!selectedBagItem || !owned.some(([id]) => id === selectedBagItem))) {
      selectedBagItem = owned.length ? owned[0][0] : null;
    }

    let leftActionHtml = '';
    if (selectedEquipSlot) {
      const isTr = selectedEquipSlot.startsWith('tr_');
      const curId = isTr ? (G.treasures && G.treasures[Number(selectedEquipSlot.split('_')[1])]) : eq[selectedEquipSlot];
      const sit = curId && D.ITEMS[curId];
      if (sit) {
        leftActionHtml = `
          <div class="eq-action-bar">
            <div class="eq-act-info"><b>${sit.name}（${sit.tier || ''}）</b><span>${isTr ? sit.desc : formatStatSummary(sit.stats)}</span></div>
            <button class="sleek-btn ghost" id="eq-unequip">卸下</button>
          </div>
        `;
      } else {
        leftActionHtml = `<div class="eq-action-bar"><div class="eq-act-info"><span>该槽位空置，请在右侧行囊点选装备或外物法宝装配。</span></div></div>`;
      }
    }

    main.innerHTML = `
      <div class="dual-left">
        <div class="sec-head"><span>身上穿戴 (9格)</span><span style="font-size:10px;color:var(--jade);">${activeSetStr}</span></div>
        <div class="equip-grid grid-3">${eqHtml}</div>
        <div style="font-size:10px;color:var(--muted);margin:6px 0 4px;">体外法宝 (已开 ${unlockedTr}/2 格 · 当前神识 ${totalSense} · 纯外物不加属性)</div>
        <div class="equip-grid" style="flex:0 0 auto;">${trHtml}</div>
        ${leftActionHtml}
        <div class="eq-summary-bar">
          <span>攻 +${eqStats.atk + (ha.atkBonus || 0)}</span>
          <span>防 +${eqStats.def + (ha.defBonus || 0)}</span>
          <span>暴击 ${Math.round((0.08 + (G.luck||10)*0.01 + eqStats.crit)*100)}%</span>
          <span>闪避 ${Math.round(eqStats.dodge * 100)}%</span>
          <span>储物 ${bagCap}格</span>
        </div>
      </div>
      <div class="dual-right">
        <div class="sec-head">
          <span>乾坤行囊 <em style="font-style:normal;font-size:10px;color:var(--muted);">(${allOwned.length}/${bagCap})</em></span>
          <div class="filter-pills">
            <button class="filter-pill ${bagFilter==='all'?'active':''}" data-bf="all">全部</button>
            <button class="filter-pill ${bagFilter==='equip'?'active':''}" data-bf="equip">装备</button>
            <button class="filter-pill ${bagFilter==='treasure'?'active':''}" data-bf="treasure">法宝</button>
            <button class="filter-pill ${bagFilter==='other'?'active':''}" data-bf="other">丹药</button>
          </div>
        </div>
        <div class="bag-grid-5" id="bag-grid-5"></div>
        <div class="bag-detail" id="bag-detail"></div>
      </div>
    `;

    main.querySelectorAll('[data-bf]').forEach(b => {
      b.onclick = () => { SFX.play('click'); bagFilter = b.dataset.bf; selectedBagItem = null; renderAll(); };
    });
    main.querySelectorAll('[data-eq-slot]').forEach(el => {
      el.onclick = () => {
        SFX.play('click');
        selectedEquipSlot = el.dataset.eqSlot;
        selectedBagItem = null;
        renderAll();
      };
    });
    const unBtn = main.querySelector('#eq-unequip');
    if (unBtn) unBtn.onclick = () => unequipSlot(selectedEquipSlot);

    const grid = main.querySelector('#bag-grid-5');
    for (let i = 0; i < bagCap; i++) {
      const cell = document.createElement('div');
      if (i < owned.length) {
        const [id, cnt] = owned[i];
        const it = D.ITEMS[id];
        cell.className = 'bag-cell has-item' + (selectedBagItem === id ? ' selected' : '') + (it.tier ? ` tier-b-${it.tier}` : '');
        cell.innerHTML = `
          ${it.tier ? `<span class="b-tier t-${it.tier}">${it.unique ? '孤' : it.tier[0]}</span>` : ''}
          <img src="${getItemIcon(id)}"/>
          <span class="b-cnt">×${cnt}</span>
        `;
        cell.onclick = () => { SFX.play('click'); selectedBagItem = id; selectedEquipSlot = null; renderAll(); };
      } else {
        cell.className = 'bag-cell';
      }
      grid.appendChild(cell);
    }

    const det = main.querySelector('#bag-detail');
    if (selectedBagItem && D.ITEMS[selectedBagItem]) {
      const it = D.ITEMS[selectedBagItem];
      if (it.type === 'equip' || it.type === 'treasure') {
        det.innerHTML = `
          <div style="min-width:0;flex:1;">
            <div style="font-size:12.5px;color:#ebd29b;font-weight:600;">
              ${it.name} ${it.tier ? `<span class="tier-tag t-${it.tier}">${it.tier}</span>` : ''}
              ${it.set && D.SETS[it.set] ? `<span style="font-size:10px;color:var(--jade);">· ${D.SETS[it.set].name}</span>` : ''}
            </div>
            <div style="font-size:10.5px;color:#6fd3a8;margin-top:2px;">${it.type === 'treasure' ? (it.mode === 'auto' ? '【悬浮自动出击 · 纯外物】' : '【主动祭出 · 纯外物】') : formatStatSummary(it.stats)}</div>
            <div style="font-size:10.5px;color:var(--muted);margin-top:2px;">${it.desc}</div>
          </div>
          <button class="sleek-btn" id="bag-equip" style="flex-shrink:0;">${it.type === 'treasure' ? '装配法宝' : '穿戴'}</button>
        `;
        det.querySelector('#bag-equip').onclick = () => equipItem(selectedBagItem);
      } else {
        det.innerHTML = `
          <div style="min-width:0;flex:1;">
            <div style="font-size:13px;color:#ebd29b;font-weight:600;">${it.name} <span style="font-size:11px;color:var(--muted);">×${G.bag[selectedBagItem]}</span></div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">${it.desc}</div>
          </div>
          ${(it.type==='consumable'||it.type==='box') ? `<button class="sleek-btn" id="bag-use" style="flex-shrink:0;">使用</button>` : `<span style="font-size:11px;color:var(--muted);flex-shrink:0;">特定场合使用</span>`}
        `;
        const ub = det.querySelector('#bag-use');
        if (ub) ub.onclick = () => {
          G.bag[selectedBagItem]--;
          if (G.bag[selectedBagItem] <= 0) delete G.bag[selectedBagItem];
          const mul = 1 + (eqStats.healBonus || 0);
          if (it.hp) G.hp = Math.min(G.maxHp, G.hp + Math.round(it.hp * mul));
          if (it.qi) G.qi = Math.min(G.maxQi, G.qi + Math.round(it.qi * mul));
          if (it.fullRestore) { G.hp = G.maxHp; G.qi = G.maxQi; }
          if (it.marrow) {
            const ks = [['body','根骨'], ['wit','悟性'], ['speed','遁速'], ['sense','神识']];
            const pick = ks[Math.floor(Math.random() * ks.length)];
            G[pick[0]] += 2; recalcDerivedStats(false);
            const g = gainExp(it.exp || 130);
            showToast(`服下【${it.name}】，${pick[1]} +2，修为 +${g}！`);
          } else if (it.exp) {
            const g = gainExp(it.exp);
            showToast(`服下【${it.name}】，修为 +${g}，状态圆满！`);
          } else if (it.type === 'box') {
            const r = Math.random();
            if (r < 0.35) { addItem('eq_iron_wrist', 1); showToast('启封遗匣，得一件【玄铁震腕】！'); }
            else if (r < 0.75) { G.stone += 65; showToast('启封遗匣，得 65 灵石。'); }
            else { const g = gainExp(55); showToast(`遗匣中藏有武学心得，修为 +${g}。`); }
          } else {
            showToast(`使用了【${it.name}】。`);
          }
          saveGame('auto', true); renderAll();
        };
      }
    } else {
      det.innerHTML = '<span style="font-size:11.5px;color:var(--muted);">点选上方物品查看详情，或前往鬼市装备坊 / 拍卖会置办套装与孤品。</span>';
    }
  }
  // 3. 功法流派页：左侧主修心法 + 3辅修流派被动 + 4出战招式槽；右侧心法/被动/全招式库
  else if (curTab === 'skills') {
    const curHa = D.HEART_ARTS[G.heartArt] || D.HEART_ARTS.turtle_breath;
    main.innerHTML = `
      <div class="dual-left">
        <div class="sec-head"><span>流派构筑与出战配置</span><span style="font-size:10px;color:var(--jade);">${curHa.style}</span></div>
        <div class="gp-body">
          <div style="font-size:10.5px;color:var(--muted);">当前主修心法</div>
          <div class="glass-card active"><div><h4>${curHa.name}</h4><p>${curHa.desc}</p></div></div>
          <div style="font-size:10.5px;color:var(--muted);">辅修流派被动（已装 ${G.passives.length}/3）</div>
          <div style="display:flex;flex-direction:column;gap:5px;">
            ${G.passives.map(pid => `<div class="glass-card active" style="padding:6px 10px;"><div><h4>${D.PASSIVES[pid].name} <span style="font-size:10px;color:var(--jade);">[${D.PASSIVES[pid].style}]</span></h4><p>${D.PASSIVES[pid].desc}</p></div></div>`).join('') || '<div class="glass-card"><p>点击右侧辅修被动装配（最多 3 门）</p></div>'}
          </div>
          <div style="font-size:10.5px;color:var(--muted);">出战招式槽（实时集气释放 · 4 招）</div>
          <div style="display:flex;flex-direction:column;gap:5px;">
            ${G.skills.slice(0, 4).map((sid, idx) => {
              const s = D.SKILLS[sid]; const p = (G.skillProf && G.skillProf[sid]) || { lv: 1 };
              return `<div class="glass-card" style="padding:5px 10px;"><span>槽${idx+1} · <b style="color:#ebd29b;">${s.name}</b> <em style="font-style:normal;font-size:10px;color:var(--jade);">[${PROF_NAMES[p.lv]}]</em></span><span style="font-size:10px;color:var(--muted);">集气${s.atbCost} · 灵${s.qiCost}</span></div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="dual-right">
        <div class="sec-head"><span>心法 · 辅修被动 · 招式典籍</span><button class="filter-pill active" id="btn-learn-more">藏经阁习招</button></div>
        <div class="gp-body">
          <div style="font-size:11px;color:#ebd29b;">主修心法（点击切换）</div>
          <div id="ha-wrap" style="display:flex;flex-direction:column;gap:5px;"></div>
          <div style="font-size:11px;color:#ebd29b;margin-top:4px;">辅修流派被动（点击装配 / 卸下，最多 3 门）</div>
          <div id="pa-wrap" style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;"></div>
          <div style="font-size:11px;color:#ebd29b;margin-top:4px;">全部已学招式（点击置顶出战 · 同系多练堆 100 造诣）</div>
          <div id="sk-wrap" style="display:flex;flex-direction:column;gap:5px;"></div>
        </div>
      </div>
    `;
    main.querySelector('#btn-learn-more').onclick = () => { activePanel = null; openLibraryModal(); };
    const hw = main.querySelector('#ha-wrap');
    G.ownedHeartArts.forEach(hid => {
      const ha = D.HEART_ARTS[hid]; if (!ha) return;
      const c = document.createElement('div'); c.className = 'glass-card' + (G.heartArt === hid ? ' active' : '');
      c.style.cursor = 'pointer';
      c.innerHTML = `<div><h4>${ha.name} <span style="font-size:10px;color:var(--jade);">[${ha.style}]</span> ${G.heartArt === hid ? '[主修]' : ''}</h4><p>${ha.desc}</p></div>`;
      c.onclick = () => { G.heartArt = hid; recalcDerivedStats(false); SFX.play('click'); showToast(`切换主修心法：${ha.name}`); saveGame('auto', true); renderAll(); };
      hw.appendChild(c);
    });
    const pw = main.querySelector('#pa-wrap');
    (G.ownedPassives || []).forEach(pid => {
      const pa = D.PASSIVES[pid]; if (!pa) return;
      const on = G.passives.includes(pid);
      const c = document.createElement('div'); c.className = 'glass-card' + (on ? ' active' : '');
      c.style.cursor = 'pointer'; c.style.padding = '6px 9px';
      c.innerHTML = `<div><h4>${pa.name} <span style="font-size:9.5px;color:var(--jade);">[${pa.style}]</span></h4><p>${pa.desc}</p></div>`;
      c.onclick = () => {
        SFX.play('click');
        if (on) G.passives = G.passives.filter(x => x !== pid);
        else {
          if (G.passives.length >= 3) G.passives.shift();
          G.passives.push(pid);
        }
        saveGame('auto', true); renderAll();
      };
      pw.appendChild(c);
    });
    const sw = main.querySelector('#sk-wrap');
    G.skills.forEach((sid, idx) => {
      const s = D.SKILLS[sid]; if (!s) return;
      const p = (G.skillProf && G.skillProf[sid]) || { lv: 1, exp: 0 };
      const inBattle = idx < 4;
      const c = document.createElement('div'); c.className = 'glass-card' + (inBattle ? ' active' : '');
      c.style.cursor = 'pointer';
      c.innerHTML = `<div><h4>${s.name} <span style="font-size:10px;color:var(--muted);">(${D.SKILL_CATS[s.cat].name}·${PROF_NAMES[p.lv]})</span> ${inBattle ? `<span style="font-size:10px;color:var(--jade);">[出战${idx+1}]</span>` : ''}</h4><p>${s.desc}</p></div><span style="font-size:10.5px;color:#ebd29b;flex-shrink:0;">集气${s.atbCost}</span>`;
      c.onclick = () => {
        if (idx === 0) return;
        G.skills.splice(idx, 1); G.skills.unshift(sid);
        SFX.play('click'); showToast(`已将【${s.name}】置入出战招式首位。`);
        saveGame('auto', true); renderAll();
      };
      sw.appendChild(c);
    });
  }
  // 4. 伙伴 / 灵兽页：支持顶部切换「道友 | 灵兽」
  else if (curTab === 'allies') {
    syncUnlockedAllies();
    if (allySubMode === 'beast') {
      const bDef = D.BEAST_DEFS[selectedBeastId] || D.BEAST_DEFS.wolf;
      const bObj = G.beasts && G.beasts[bDef.id];
      const isActB = G.activeBeast === bDef.id;
      const bTabs = Object.values(D.BEAST_DEFS).map(b => `<button class="gp-tab ${selectedBeastId===b.id?'active':''}" data-beast="${b.id}">${b.name}${G.beasts?.[b.id] ? '' : '(未收)'}</button>`).join('');
      main.innerHTML = `
        <div class="fullbody-col">
          <div class="fullbody-wrap">
            <img class="full-char" src="${ASSETS[bDef.asset]}" />
            <div class="lifespan-ring">${bObj ? `${bDef.stages[Math.min(3, bObj.stage || 0)]} · Lv.${bObj.lv}` : '尚未驯化'}</div>
          </div>
        </div>
        <div class="glass-panel">
          <div class="sec-head">
            <div class="filter-pills">
              <button class="filter-pill" id="mode-ally">同行道友</button>
              <button class="filter-pill active" id="mode-beast">灵兽御契</button>
            </div>
            <span style="font-size:10.5px;color:var(--jade);">${bDef.role}</span>
          </div>
          <div class="gp-tabs" style="overflow-x:auto;">${bTabs}</div>
          <div class="gp-body">
            <div style="font-size:20px;font-weight:700;color:#ebd29b;letter-spacing:3px;">${bDef.name} ${isActB ? '<span style="font-size:11px;color:var(--jade);">[主战中]</span>' : ''}</div>
            <p style="font-size:12px;color:var(--muted);line-height:1.6;margin:0;">${bDef.desc}</p>
            <div class="glass-card">
              <div><h4>专属战技 · ${bDef.skillName}</h4><p>基础攻势 ${bDef.baseAtk} · 基础遁速 ${bDef.baseSpeed}（实时独立集气，同屏参战）</p></div>
            </div>
            ${bObj ? `
              <div class="glass-card">
                <div><h4>当前血脉：${bDef.stages[Math.min(3, bObj.stage || 0)]}（Lv.${bObj.lv}）</h4><p>亲密度 ${bObj.bond || 20} / 100 · 经验 ${bObj.exp || 0}/${bObj.lv * 40}</p></div>
              </div>
              <div class="ally-actions" style="grid-template-columns:repeat(3,1fr);">
                <button class="sleek-btn ghost" id="bs-feed">喂赤灵妖果</button>
                <button class="sleek-btn ghost" id="bs-evolve">血脉突破(50灵石)</button>
                <button class="sleek-btn" id="bs-act">${isActB ? '收回灵兽' : '设为主战'}</button>
              </div>
            ` : `
              <button class="sleek-btn" id="bs-adopt" style="margin-top:auto;">结下御兽契驯化收养（消耗 ${bDef.adoptCost} 灵石）</button>
            `}
          </div>
        </div>
      `;
      main.querySelector('#mode-ally').onclick = () => { SFX.play('click'); allySubMode = 'ally'; renderAll(); };
      main.querySelectorAll('[data-beast]').forEach(b => { b.onclick = () => { SFX.play('click'); selectedBeastId = b.dataset.beast; renderAll(); }; });
      const adBtn = main.querySelector('#bs-adopt');
      if (adBtn) adBtn.onclick = () => {
        if (G.stone < bDef.adoptCost) return showToast(`灵石不足 ${bDef.adoptCost} 枚。`);
        G.stone -= bDef.adoptCost;
        G.beasts[bDef.id] = { id: bDef.id, lv: 1, exp: 0, stage: 0, bond: 25 };
        if (!G.activeBeast) G.activeBeast = bDef.id;
        SFX.play('levelup'); showToast(`成功收养灵兽【${bDef.name}】！`);
        saveGame('auto', true); renderAll();
      };
      const fdBtn = main.querySelector('#bs-feed');
      if (fdBtn) fdBtn.onclick = () => {
        if ((G.bag.beast_fruit || 0) <= 0) return showToast('行囊中暂无【赤灵妖果】，可在鬼市购买。');
        G.bag.beast_fruit--; if (G.bag.beast_fruit <= 0) delete G.bag.beast_fruit;
        bObj.bond = Math.min(100, (bObj.bond || 20) + 12);
        bObj.exp = (bObj.exp || 0) + 45;
        while (bObj.exp >= bObj.lv * 40) { bObj.exp -= bObj.lv * 40; bObj.lv++; }
        SFX.play('levelup'); showToast(`喂食赤灵妖果，${bDef.name} 升至 Lv.${bObj.lv}，亲密 +12！`);
        saveGame('auto', true); renderAll();
      };
      const evBtn = main.querySelector('#bs-evolve');
      if (evBtn) evBtn.onclick = () => {
        if ((bObj.stage || 0) >= 3) return showToast('已进化至终极圣兽血脉！');
        if (G.stone < 50) return showToast('血脉突破需 50 灵石。');
        G.stone -= 50; bObj.stage = (bObj.stage || 0) + 1; bObj.lv += 1;
        SFX.play('levelup'); showToast(`血脉蜕变！进化为【${bDef.stages[bObj.stage]}】！`);
        saveGame('auto', true); renderAll();
      };
      const acBtn = main.querySelector('#bs-act');
      if (acBtn) acBtn.onclick = () => {
        G.activeBeast = isActB ? null : bDef.id;
        SFX.play('click'); showToast(G.activeBeast ? `${bDef.name} 已设为主战灵兽！` : '已收回灵兽。');
        saveGame('auto', true); renderAll();
      };
    } else {
    const unlockedIds = Object.keys(D.ALLY_DEFS).filter(id => G.allies[id]?.unlocked);
    if (!unlockedIds.includes(selectedAllyId)) selectedAllyId = unlockedIds[0] || 'sister';
    const a = G.allies[selectedAllyId];
    const def = getAllyDef(selectedAllyId);
    const isAct = G.activeAlly === def.id;
    const exprHtml = def.exprs.map(ex => `
      <div class="expr-thumb ${(allyExprMap[def.id]||'normal')===ex.key?'active':''}" data-ex="${ex.key}">
        <img src="${ASSETS[ex.asset] || ASSETS[ex.fallback] || ASSETS.elder}" /><span>${ex.label}</span>
      </div>
    `).join('');
    const tabsHtml = unlockedIds.map(id => {
      const d = getAllyDef(id);
      return `<button class="gp-tab ${selectedAllyId===id?'active':''}" data-ally="${id}">${d.name}</button>`;
    }).join('');
    const canQuest = def.quest && a.bond >= def.quest.reqBond && !G.flags[def.quest.flag];

    main.innerHTML = `
      <div class="fullbody-col">
        <div class="fullbody-wrap">
          <img class="full-char" src="${getAllyAsset(def.id)}" />
          <div class="expr-strip">${exprHtml}</div>
        </div>
      </div>
      <div class="glass-panel">
        <div class="sec-head">
          <div class="filter-pills">
            <button class="filter-pill active" id="mode-ally">同行道友</button>
            <button class="filter-pill" id="mode-beast">灵兽御契</button>
          </div>
          <span style="font-size:10.5px;color:var(--muted);">已结交 ${unlockedIds.length} 人</span>
        </div>
        <div class="gp-tabs" style="overflow-x:auto;gap:4px;">${tabsHtml}</div>
        <div class="gp-body">
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="vermilion-seal">${def.seal}</span>
            <div style="flex:1;">
              <div style="font-size:21px;font-weight:700;color:#ebd29b;letter-spacing:3px;">${def.name}</div>
              <div style="font-size:11.5px;color:var(--muted);">${def.title}${isAct ? ' · 当前同行中' : ''}</div>
              <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--muted);margin-top:6px;">
                <span>道友羁绊</span><b style="color:#ebd29b;">${a.bond} / 100</b>
              </div>
              <div class="bond-bar"><div class="bond-fill" style="width:${Math.min(100,a.bond)}%"></div></div>
            </div>
          </div>
          <div class="radar-wrap">
            ${buildRadarSvg(def.elements)}
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
              <span style="font-size:11px;color:var(--muted);">随身佩剑 / 法器</span>
              <div class="item-slot featured" style="width:74px;height:74px;">
                <img src="${ASSETS[def.weaponIcon]}" /><span class="s-lbl">${def.weaponName}</span>
              </div>
            </div>
          </div>
          <p style="font-size:12px;color:var(--muted);line-height:1.6;margin:0;">${def.desc}</p>
          ${canQuest ? `<button class="sleek-btn" id="al-quest" style="width:100%;">开启专属支线：${def.quest.title}</button>` : ''}
          <div class="ally-actions">
            <button class="sleek-btn ghost" id="al-talk">交谈</button>
            <button class="sleek-btn ghost" id="al-gift">赠礼</button>
            <button class="sleek-btn ghost" id="al-spar">切磋</button>
            <button class="sleek-btn" id="al-join">${isAct ? '暂离' : '同行'}</button>
          </div>
        </div>
      </div>
    `;
    main.querySelector('#mode-beast').onclick = () => { SFX.play('click'); allySubMode = 'beast'; renderAll(); };
    main.querySelectorAll('[data-ally]').forEach(b => { b.onclick = () => { SFX.play('click'); selectedAllyId = b.dataset.ally; renderAll(); }; });
    main.querySelectorAll('[data-ex]').forEach(t => { t.onclick = () => { SFX.play('click'); allyExprMap[def.id] = t.dataset.ex; renderAll(); }; });
    main.querySelector('#al-talk').onclick = () => { activePanel = null; interactNpc(def.id); };
    main.querySelector('#al-gift').onclick = () => {
      const giftId = def.favGift || 'osmanthus_cake';
      const giftItem = D.ITEMS[giftId];
      if ((G.bag[giftId] || 0) <= 0) return showToast(`行囊中暂无【${giftItem.name}】，可前往坊市购置。`);
      G.bag[giftId]--; if (G.bag[giftId] <= 0) delete G.bag[giftId];
      a.bond = Math.min(100, a.bond + 20);
      allyExprMap[def.id] = a.bond >= 70 ? 'shy' : 'smile';
      SFX.play('levelup'); showToast(`赠予【${giftItem.name}】，${def.name}神色微动，羁绊 +20！`);
      saveGame('auto', true); renderAll();
    };
    main.querySelector('#al-spar').onclick = () => {
      allyExprMap[def.id] = 'fierce';
      startBattle({ name:`${def.name}（切磋）`, asset:getAllyAsset(def.id, 'fierce'), bg:'bamboo', hp:165 + def.power * 2, maxHp:165 + def.power * 2, atk:18 + Math.floor(def.power * 0.2), expReward:75, stoneReward:35 });
    };
    main.querySelector('#al-join').onclick = () => {
      if (a.bond < 45 && !isAct) return showToast(`需羁绊达到 45 方可邀${def.name}同行（当前 ${a.bond}）。`);
      G.activeAlly = isAct ? null : def.id; SFX.play('click');
      showToast(G.activeAlly ? `${def.name}已加入同行队伍。` : `${def.name}已暂离队伍。`);
      renderAll();
    };
    const qBtn = main.querySelector('#al-quest');
    if (qBtn) qBtn.onclick = () => {
      const q = def.quest;
      activePanel = null;
      activeDialogue = {
        speaker: def.name, asset: getAllyAsset(def.id, 'smile'),
        text: q.text,
        choices: q.choices.map(ch => ({
          text: ch.text, hint: ch.hint,
          action: () => {
            G.flags[q.flag] = true;
            const ef = ch.eff || {};
            if (ef.bond) a.bond = Math.min(100, a.bond + ef.bond);
            if (ef.exp) gainExp(ef.exp);
            if (ef.stone) G.stone += ef.stone;
            if (ef.wit) G.wit += ef.wit;
            if (ef.body) G.body += ef.body;
            if (ef.mind) G.sense += ef.mind;
            if (ef.talk) G.sense += ef.talk;
            if (ef.luck) G.luck += ef.luck;
            if (ef.fame) G.fame += ef.fame;
            if (ef.expr) allyExprMap[def.id] = ef.expr;
            recalcDerivedStats(false);
            SFX.play('levelup');
            showToast(ef.toast || '完成专属支线！');
            activeDialogue = null; saveGame('auto', true); renderAll();
          }
        }))
      };
      renderAll();
    };
    }
  }
  // 5. 卷宗存档页：无立绘！左右双联（本地存档/音频设置/离线预缓存 + 存档码与传承）
  else if (curTab === 'save') {
    const leg = window.LEGACY ? window.LEGACY.load() : { runs: 0, points: 0, endings: [] };
    main.innerHTML = `
      <div class="dual-left">
        <div class="sec-head"><span>本地离线卷宗与音画</span></div>
        <div class="gp-body">
          <div class="glass-card"><div><h4>卷宗一</h4><p>手动独立存档位</p></div><div style="display:flex;gap:6px;"><button class="sleek-btn" onclick="saveGame('1')">存入</button><button class="sleek-btn ghost" onclick="if(loadGame('1')) renderAll(); else showToast('卷宗一为空。');">读取</button></div></div>
          <div class="glass-card"><div><h4>卷宗二</h4><p>手动独立存档位</p></div><div style="display:flex;gap:6px;"><button class="sleek-btn" onclick="saveGame('2')">存入</button><button class="sleek-btn ghost" onclick="if(loadGame('2')) renderAll(); else showToast('卷宗二为空。');">读取</button></div></div>
          <div class="glass-card" style="flex-direction:column;align-items:stretch;gap:7px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:11.5px;color:#ebd29b;">古风配乐 BGM 与音效</span>
              <div style="display:flex;gap:6px;">
                <button class="sleek-btn ghost" id="sv-bgm" style="padding:4px 10px;font-size:11px;">${BGM.enabled?'配乐：开':'配乐：关'}</button>
                <button class="sleek-btn ghost" id="sv-sfx" style="padding:4px 10px;font-size:11px;">${SFX.enabled?'音效：开':'音效：关'}</button>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;font-size:10.5px;color:var(--muted);">
              <span>配乐音量</span>
              <input id="sv-vol" type="range" min="0" max="100" value="${Math.round(BGM.volume*100)}" style="flex:1;accent-color:#ebd29b;" />
              <span id="sv-vol-txt">${Math.round(BGM.volume*100)}%</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="sleek-btn ghost" onclick="startQuiz()" style="flex:1;">重入轮回（新局）</button>
          </div>
        </div>
      </div>
      <div class="dual-right">
        <div class="sec-head"><span>防丢档存档码 · 离线资源包</span><span style="font-size:10.5px;color:var(--muted);">传承 ${leg.points} 点 · 已收录 ${leg.endings.length}/${(D.ENDINGS||[]).length} 结局</span></div>
        <div class="gp-body">
          <p style="font-size:11px;color:var(--muted);margin:0;">更新版本或换机前可导出存档码备份，随时粘贴恢复进度。</p>
          <textarea id="save-code-box" rows="3" style="width:100%;background:rgba(5,7,9,0.75);border:1px solid var(--gold-hair);color:var(--text);padding:7px;font-size:11px;"></textarea>
          <div style="display:flex;gap:8px;">
            <button class="sleek-btn" onclick="exportSaveCode()">导出存档码</button>
            <button class="sleek-btn ghost" onclick="importSaveCode()">导入存档码</button>
          </div>
          <div class="glass-card" style="margin-top:4px;flex-direction:column;align-items:stretch;gap:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div><h4>iPhone 离线资源包管理</h4><p id="cache-status">检测本地缓存中…</p></div>
              <button class="sleek-btn" id="btn-precache" style="flex-shrink:0;">一键预缓存</button>
            </div>
            <div class="bond-bar" style="margin:0;"><div class="bond-fill" id="cache-bar" style="width:0%"></div></div>
          </div>
        </div>
      </div>
    `;
    main.querySelector('#sv-sfx').onclick = () => { SFX.enabled = !SFX.enabled; renderAll(); };
    main.querySelector('#sv-bgm').onclick = () => { BGM.toggle(); renderAll(); };
    const vol = main.querySelector('#sv-vol');
    if (vol) vol.oninput = () => {
      BGM.setVolume(Number(vol.value) / 100);
      const t = main.querySelector('#sv-vol-txt');
      if (t) t.textContent = vol.value + '%';
    };
    const stEl = main.querySelector('#cache-status');
    const barEl = main.querySelector('#cache-bar');
    if (window.OFFLINE_CACHE) {
      window.OFFLINE_CACHE.getStats().then(s => {
        if (stEl) stEl.textContent = s.supported ? `当前已缓存 ${s.count} 项离线资源（支持 100MB+ 断网畅玩）` : '当前浏览环境未启用离线缓存';
      });
      const pcBtn = main.querySelector('#btn-precache');
      if (pcBtn) pcBtn.onclick = async () => {
        pcBtn.disabled = true; pcBtn.textContent = '缓存中…';
        const res = await window.OFFLINE_CACHE.precacheAll((cur, tot, okCnt) => {
          if (barEl) barEl.style.width = Math.round((cur / tot) * 100) + '%';
          if (stEl) stEl.textContent = `正在预缓存离线资产：${cur}/${tot}（成功 ${okCnt}）`;
        });
        pcBtn.disabled = false; pcBtn.textContent = '一键预缓存';
        showToast(`离线资源同步完成，已缓存 ${res.cached} 项资产。`);
      };
    }
  }

  host.appendChild(sc);
}

function renderAll() {
  if (!G) return;
  syncUnlockedAllies();
  const realm = D.REALMS[G.realmIdx];
  document.getElementById('hud-realm-txt').textContent = realm.name;
  document.getElementById('hud-date').textContent = getDateStr();
  document.getElementById('hud-stone').textContent = G.stone;
  document.getElementById('hud-age').textContent = `${G.age}/${G.maxAge}岁`;
  document.getElementById('hud-timeline').textContent = getNextTimelineText();

  // Update 3A Dual-Arc SVG + Micro HP/Qi Bars
  const hpRatio = Math.max(0, Math.min(1, G.hp / G.maxHp));
  const qiRatio = Math.max(0, Math.min(1, G.qi / G.maxQi));
  const arcHp = document.getElementById('arc-hp'); if (arcHp) arcHp.setAttribute('stroke-dashoffset', String(92 * (1 - hpRatio)));
  const arcQi = document.getElementById('arc-qi'); if (arcQi) arcQi.setAttribute('stroke-dashoffset', String(92 * (1 - qiRatio)));
  const bhp = document.getElementById('bar-hp'); if (bhp) bhp.style.width = Math.round(hpRatio * 100) + '%';
  const bqi = document.getElementById('bar-qi'); if (bqi) bqi.style.width = Math.round(qiRatio * 100) + '%';
  const bhpt = document.getElementById('bar-hp-txt'); if (bhpt) bhpt.textContent = `${G.hp}/${G.maxHp}`;
  const bqit = document.getElementById('bar-qi-txt'); if (bqit) bqit.textContent = `${G.qi}/${G.maxQi}`;

  const inBattle = Boolean(window.COMBAT && window.COMBAT.state);
  const locObj = D.LOCATIONS.find(l => l.id === currentLocationId);
  const bgKey = inBattle ? window.COMBAT.state.enemy.bg : (locObj ? locObj.sceneBg : 'world_map');
  document.getElementById('world-viewport').style.backgroundImage = `url("${ASSETS[bgKey] || ASSETS.world_map}")`;
  if (window.BGM) {
    const bgmKey = inBattle ? 'combat' : (activePanel === 'allies' ? 'bamboo' : (locObj ? locObj.id : 'world_map'));
    BGM.playScene(bgmKey);
  }

  const hideHud = Boolean(inBattle || activeDialogue || activePanel);
  document.getElementById('hud-tl').style.display = hideHud ? 'none' : 'flex';
  document.getElementById('hud-tr').style.display = hideHud ? 'none' : 'flex';
  document.getElementById('hud-br').style.display = hideHud ? 'none' : 'flex';
  document.getElementById('hud-bl').style.display = (hideHud || !locObj) ? 'none' : 'flex';
  const tc = document.getElementById('hud-tc');
  if (tc) {
    tc.style.display = hideHud ? 'none' : 'flex';
    tc.innerHTML = locObj
      ? `<div class="region-title">${locObj.name}</div><div class="region-sub">${locObj.desc}</div>`
      : `<div class="region-title">东洲 · 山河舆图</div><div class="region-sub">择一地标御剑前往</div>`;
  }

  // Render World Map or Full-Screen Scene
  const wl = document.getElementById('world-layer'); wl.innerHTML = '';
  const bl = document.getElementById('hud-bl'); bl.innerHTML = '';

  if (!inBattle && !activePanel) {
    if (!locObj) {
      // Constellation travel lines SVG
      const pairs = [['sect','inn'], ['sect','cliff'], ['cliff','market'], ['inn','market'], ['inn','altar'], ['market','forest'], ['forest','altar']];
      const byId = Object.fromEntries(D.LOCATIONS.map(l => [l.id, l]));
      const lines = pairs.map(([a,b]) => `<line x1="${byId[a].x}%" y1="${byId[a].y}%" x2="${byId[b].x}%" y2="${byId[b].y}%" stroke="rgba(235,210,155,0.32)" stroke-width="1" stroke-dasharray="3 4"/>`).join('');
      wl.innerHTML = `<svg id="map-lines-svg">${lines}</svg>`;
      const activeLocs = new Set(D.TIMELINE.filter(t => {
        if (G.month < t.month) return false;
        if (t.loc === 'sect' && (G.factions?.qingyun || 0) < 2) return true;
        if (t.loc === 'market' && (G.factions?.wanbao || 0) < 2) return true;
        if (t.loc === 'forest' && (G.flags?.forestRuinStage || 0) < 2) return true;
        if (t.loc === 'cliff' && !G.flags?.divorceResolved) return true;
        return false;
      }).map(t => t.loc));
      D.LOCATIONS.forEach(loc => {
        const m = document.createElement('div');
        m.className = 'map-pin' + (activeLocs.has(loc.id) ? ' has-event' : '');
        m.style.left = loc.x + '%'; m.style.top = loc.y + '%';
        m.innerHTML = `<div class="pin-vlabel">${loc.name}</div><div class="pin-dot"></div>`;
        m.onclick = () => enterLocation(loc.id);
        wl.appendChild(m);
      });
    } else {
      locObj.npcs.forEach(npc => {
        const n = document.createElement('div'); n.className = 'scene-npc'; n.style.left = npc.left;
        const imgSrc = npc.id === 'sister' ? getAllyAsset('sister') : ASSETS[npc.char];
        n.innerHTML = `<img src="${imgSrc}" /><div class="npc-caption"><b>${npc.name}</b><span>${npc.title}</span></div>`;
        n.onclick = () => interactNpc(npc.id);
        wl.appendChild(n);
      });
      const back = document.createElement('button'); back.className = 'sleek-btn ghost'; back.textContent = '← 东洲舆图';
      back.onclick = () => { SFX.play('click'); currentLocationId = null; renderAll(); };
      bl.appendChild(back);
      locObj.hotspots.forEach(h => {
        const b = document.createElement('button'); b.className = 'sleek-btn'; b.textContent = h.label;
        b.onclick = () => handleHotspot(h.id);
        bl.appendChild(b);
      });
    }
  }

  // Render Dialogue (3A Frosted-Obsidian Cinema Subtitle Bar)
  const dl = document.getElementById('dialogue-root'); dl.innerHTML = '';
  if (activeDialogue && !inBattle) {
    const wrap = document.createElement('div'); wrap.className = 'dlg-layer';
    wrap.innerHTML = `
      <img class="dlg-portrait" src="${activeDialogue.asset || ASSETS.hero}" />
      <div class="dlg-choices-float" id="dlg-ch"></div>
      <div class="dlg-bar">
        <div class="dlg-speaker-name">${activeDialogue.speaker}</div>
        <div class="dlg-text">${activeDialogue.text}</div>
      </div>
    `;
    const ch = wrap.querySelector('#dlg-ch');
    activeDialogue.choices.forEach(c => {
      const b = document.createElement('button'); b.className = 'dlg-choice';
      b.innerHTML = `<span>${c.text}</span>${c.hint ? `<em>${c.hint}</em>` : ''}`;
      b.onclick = () => { SFX.play('click'); c.action(); };
      ch.appendChild(b);
    });
    dl.appendChild(wrap);
  }

  if (!inBattle) {
    const cl = document.getElementById('combat-root');
    if (cl) cl.innerHTML = '';
  }

  renderSplitPanel();
}

function initHud() {
  document.getElementById('hud-tl').onclick = () => { SFX.play('click'); activePanel = 'status'; statusSubTab = 'mingge'; renderAll(); };
  const dock = document.getElementById('hud-br');
  const btns = [
    { label:'舆图', img:'ui3a_ico_map',   fn:()=>{ currentLocationId=null; activePanel=null; renderAll(); } },
    { label:'命格', img:'ui3a_ico_char',  fn:()=>{ activePanel='status'; statusSubTab='mingge'; renderAll(); } },
    { label:'功法', img:'ui3a_ico_skill', fn:()=>{ activePanel='status'; statusSubTab='skills'; renderAll(); } },
    { label:'行囊', img:'ui3a_ico_bag',   fn:()=>{ activePanel='status'; statusSubTab='bag'; renderAll(); } },
    { label:'伙伴', img:'ui3a_ico_ally',  fn:()=>{ activePanel='allies'; renderAll(); } },
    { label:'卷宗', img:'ui3a_ico_save',  fn:()=>{ activePanel='status'; statusSubTab='save'; renderAll(); } }
  ];
  btns.forEach(b => {
    const el = document.createElement('button'); el.className = 'dock-btn';
    el.innerHTML = `<img src="${ASSETS[b.img]}" alt="${b.label}"/><span>${b.label}</span>`;
    el.onclick = () => { SFX.play('click'); b.fn(); };
    dock.appendChild(el);
  });
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
FX.init();
initHud();
startQuiz();