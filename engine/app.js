const D = window.GAME_DATA;
const ASSETS = D.ASSETS_MAP;
const IC = window.ICONS;

let G = null;
let currentLocationId = null;
let currentMapRegion = 'east'; // 'east' | 'south' | 'north' | 'central'
let activePanel = null; // null | 'status' | 'allies' | 'save'
let statusSubTab = 'mingge'; // 'mingge' | 'skills' | 'bag' | 'ach' | 'save'
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
  const st = {
    name: '陈清安', lifeCount: 1, realmIdx: 0, loc: 'map',
    hp: 130, maxHp: 130, qi: 85, maxQi: 85, exp: 0,
    body: 10, wit: 10, speed: 10, luck: 10, sense: 10, fame: 0,
    elements: { gold: 28, wood: 26, water: 28, fire: 25, earth: 27 },
    daoBase: { sword: 0, spell: 0, body: 0, array: 0, soul: 0, pact: 0 },
    daoBody: 'mortal_body',
    destinyTraits: [],
    root: '五行均衡灵根', talent: '宿慧通明', sect: '散修',
    age: 16, maxAge: 100, month: 1, stone: 85,
    caveOwned: false,
    caveVault: { items: {}, stones: 0 },
    worldRelic: null,
    worldRemains: null,
    nemesis: null,
    stolenMarketPool: [],
    heartArt: 'turtle_breath',
    ownedHeartArts: ['turtle_breath', 'qingyun_breath', 'xuanxu_sutra'],
    passives: ['p_crit_edge'],
    ownedPassives: ['p_crit_edge', 'p_heavy_force', 'p_venom_mist', 'p_thorns_shell', 'p_beast_bond', 'p_blood_fury'],
    skills: ['basic_sword', 'silk_palm', 'venom_dart', 'wind_rod'],
    skillProf: {
      basic_sword: { lv: 1, exp: 0 },
      silk_palm:   { lv: 1, exp: 0 },
      venom_dart:  { lv: 1, exp: 0 },
      wind_rod:    { lv: 1, exp: 0 }
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
  if (window.REINCARNATION) window.REINCARNATION.ensureWorldRelic(st);
  st.daoBase = Object.assign({ sword:0, spell:0, body:0, array:0, soul:0, pact:0 }, st.daoBase || {});
  st.daoBody = st.daoBody || 'mortal_body';
  st.destinyTraits = Array.isArray(st.destinyTraits) ? st.destinyTraits : [];
  st.lifeCount = st.lifeCount || 1;
  st.caveOwned = Boolean(st.caveOwned);
  st.caveVault = st.caveVault || { items: {}, stones: 0 };
  st.stolenMarketPool = Array.isArray(st.stolenMarketPool) ? st.stolenMarketPool : [];
  if (window.REINCARNATION) window.REINCARNATION.ensureWorldRelic(st);
  if (window.WORLD_SIM) window.WORLD_SIM.initWorldState(st);
  return st;
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
  if (!G) return 0;
  let total = 0;
  (G.skills || []).forEach(sid => {
    const sk = D.SKILLS[sid];
    if (!sk || sk.cat !== catId) return;
    const p = (G.skillProf && G.skillProf[sid]) || { lv: 1, exp: 0 };
    const contrib = Math.min(22, (p.lv - 1) * 7 + Math.min(6, Math.floor((p.exp || 0) / 10)) + 1);
    total += contrib;
  });
  G.daoBase = G.daoBase || {};
  const best = Math.min(100, Math.max(G.daoBase[catId] || 0, total));
  if (total > (G.daoBase[catId] || 0)) G.daoBase[catId] = best;
  return best;
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
  st.daoBase = Object.assign({ sword:0, spell:0, body:0, array:0, soul:0, pact:0 }, st.daoBase || {});
  st.daoBody = st.daoBody || 'mortal_body';
  st.destinyTraits = Array.isArray(st.destinyTraits) ? st.destinyTraits : [];
  st.lifeCount = st.lifeCount || 1;
  st.caveOwned = Boolean(st.caveOwned);
  st.caveVault = st.caveVault || { items: {}, stones: 0 };
  st.stolenMarketPool = Array.isArray(st.stolenMarketPool) ? st.stolenMarketPool : [];
  if (window.REINCARNATION) window.REINCARNATION.ensureWorldRelic(st);
  if (window.WORLD_SIM) window.WORLD_SIM.initWorldState(st);
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
  if (window.WORLD_SIM) return window.WORLD_SIM.formatDate(G);
  const y = Math.floor((G.month - 1) / 12) + 1;
  const s = ['春','春','春','夏','夏','夏','秋','秋','秋','冬','冬','冬'][(G.month - 1) % 12];
  return `第${y}年·${s}`;
}
function getNextTimelineText() {
  if (G.worldState && G.worldState.lastHeadline) {
    return G.worldState.lastHeadline;
  }
  const next = D.TIMELINE.find(t => t.month > G.month);
  return next ? `${next.title}（余${next.month - G.month}月）` : '五洲风云变幻，大道可期';
}
function advanceTime(months = 1) {
  if (window.WORLD_SIM) {
    window.WORLD_SIM.advanceDays(getEventCtx(), Math.max(1, Math.round(months * 30)), { seclusion: false });
    return;
  }
  const prevYear = Math.floor((G.month - 1) / 12);
  G.month += months;
  const newYear = Math.floor((G.month - 1) / 12);
  if (newYear > prevYear) G.age += (newYear - prevYear);
  if (G.age >= G.maxAge && window.REINCARNATION) {
    G.loc = currentLocationId || 'sect';
    if (window.REINCARNATION.hasRelic(G)) {
      window.REINCARNATION.executeReincarnation(getEventCtx(), 'calm', null);
    } else {
      window.REINCARNATION.triggerTrueDeath(getEventCtx(), '大限已至，寿元耗尽坐化');
    }
  }
}
function gainExp(amt) {
  const ha = D.HEART_ARTS[G.heartArt] || { expBonus: 0, elem: 'none' };
  const apt = window.REINCARNATION ? window.REINCARNATION.getElemAptitude(G, ha.elem) : { rate: 1.0 };
  const eq = getEquipStats();
  const bonus = Math.max(2, Math.floor(amt * apt.rate * (1 + G.wit * 0.03 + (ha.expBonus || 0) + (eq.expRate || 0))));
  G.exp += bonus;
  const need = D.REALMS[G.realmIdx].exp;
  if (G.exp >= need && !D.REALMS[G.realmIdx + 1]?.tribulation) tryRealmUp(false);
  return bonus;
}
function checkRealmDaoGate(next) {
  if (!next) return null;
  const masteries = Object.keys(D.SKILL_CATS).map(k => getCatMastery(k));
  const cnt60 = masteries.filter(m => m >= 60).length;
  const cnt100 = masteries.filter(m => m >= 100).length;
  if (next.reqDao60 && cnt60 < next.reqDao60) {
    return `踏入【${next.name}】须至少将 ${next.reqDao60} 条仙道参悟至 60 宗师境（当前 ${cnt60} 条）！`;
  }
  if (next.reqDao100 && cnt100 < next.reqDao100) {
    if (next.reqDao100 >= 6) {
      return `登临至强【${next.name}】须历经轮回将六条仙道全部修至 100 圆满（当前已满 ${cnt100}/6 条）！`;
    }
    return `突破【${next.name}】须至少完整领悟 ${next.reqDao100} 条圆满大道(100)（当前 ${cnt100} 条，可赴中州悟道碑或借轮回积累）！`;
  }
  return null;
}

function tryRealmUp(fromAltar) {
  const next = D.REALMS[G.realmIdx + 1];
  if (!next) return showToast('你已登临诸天至强【万道仙帝】之境！');
  if (G.exp < D.REALMS[G.realmIdx].exp) return showToast('修为尚未圆满。');
  const gateErr = checkRealmDaoGate(next);
  if (gateErr) return showToast(gateErr);
  if (next.tribulation && !fromAltar) return showToast('大境界突破需前往【中州·九霄雷池渡劫台】引雷破境！');
  G.exp -= D.REALMS[G.realmIdx].exp;
  G.realmIdx++;
  G.maxAge += next.ageBonus;
  recalcDerivedStats(true);
  SFX.play('levelup'); FX.burst('235,210,155', 45, 0.5, 0.5);
  showToast(`突破成功！证道【${next.name}】，寿元上限增至 ${G.maxAge} 岁！`);
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
            else if (k === 'rootPreset') {
              if (v === 'sky_fire') G.elements = { gold: 6, wood: 5, water: 2, fire: 94, earth: 4 };
              else if (v === 'dual_gold_water') G.elements = { gold: 68, wood: 8, water: 64, fire: 3, earth: 7 };
              else G.elements = { gold: 28, wood: 26, water: 28, fire: 25, earth: 27 };
            }
            else if (k === 'skill') {
              if (!G.skills.includes(v)) { G.skills.push(v); G.skillProf[v] = { lv: 1, exp: 0 }; }
            }
            else G[k] = (G[k] || 0) + v;
          }
          step++; renderStep();
        };
        box.appendChild(b);
      });
    } else {
      const achStore = window.ACHIEVEMENTS ? window.ACHIEVEMENTS.loadStore() : { unlocked: [], totalPts: 15 };
      let pickedBody = G._pickedBody || 'mortal_body';
      let pickedTraits = G._pickedTraits || [];

      const calcUsedPts = () => {
        if (!window.ACHIEVEMENTS) return 0;
        const b = window.ACHIEVEMENTS.DAO_BODIES.find(x => x.id === pickedBody);
        const tSum = pickedTraits.reduce((s, tid) => {
          const t = window.ACHIEVEMENTS.DESTINY_TRAITS.find(x => x.id === tid);
          return s + (t ? t.cost : 0);
        }, 0);
        return (b ? b.cost : 0) + tSum;
      };

      const usedPts = calcUsedPts();
      const leftPts = achStore.totalPts - usedPts;
      const bodiesHtml = (window.ACHIEVEMENTS ? window.ACHIEVEMENTS.DAO_BODIES : []).map(b => {
        const unlk = window.ACHIEVEMENTS.isBodyUnlocked(b, achStore);
        const on = pickedBody === b.id;
        return `
          <button class="trait-chip ${on?'active':''} ${!unlk?'locked':''}" data-body="${b.id}" title="${b.desc}">
            <b>${b.name}</b><span>${unlk ? `${b.cost}点` : '未解锁'}</span>
          </button>
        `;
      }).join('');
      const traitsHtml = (window.ACHIEVEMENTS ? window.ACHIEVEMENTS.DESTINY_TRAITS : []).map(t => {
        const unlk = window.ACHIEVEMENTS.isTraitUnlocked(t, achStore);
        const on = pickedTraits.includes(t.id);
        return `
          <button class="trait-chip ${on?'active':''} ${!unlk?'locked':''} t-b-${t.tier}" data-trait="${t.id}" title="${t.desc}">
            <b>${t.name}</b><span>${unlk ? `${t.cost}点` : '成就解锁'}</span>
          </button>
        `;
      }).join('');

      const el = G.elements;
      root.innerHTML = `
        <div class="title-box" style="width:min(820px,92%);max-height:90%;overflow-y:auto;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <h2 class="title-main" style="font-size:18px;letter-spacing:3px;margin:0;">重塑仙胎 · 点选先天道体与气运</h2>
            <span style="font-size:12px;color:var(--gold-bright);">可用天命成就点：<b>${leftPts}</b> / ${achStore.totalPts} 点</span>
          </div>
          <div style="font-size:11px;color:var(--muted);margin:6px 0 4px;">① 选择先天道体（限 1 具 · 悬停或点选查看效果）：</div>
          <div class="trait-grid">${bodiesHtml}</div>
          <div style="font-size:11px;color:var(--muted);margin:8px 0 4px;">② 勾选先天气运词条（最多 3 条 · 完成游戏内成就可永久解锁仙品词条）：</div>
          <div class="trait-grid">${traitsHtml}</div>
          <div id="trait-desc-bar" style="font-size:11px;color:var(--jade);margin:7px 0;min-height:16px;">
            当前初测灵根：${G.root}（金${el.gold} 木${el.wood} 水${el.water} 火${el.fire} 土${el.earth}） · 五维：根${G.body} 悟${G.wit} 速${G.speed} 运${G.luck} 识${G.sense}
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-top:8px;border-top:1px solid var(--gold-hair);">
            <span style="font-size:12px;color:var(--muted);">赐立道号：</span>
            <input id="inp-name" value="${G.name}" maxlength="8" style="background:rgba(8,10,12,0.85);border:1px solid var(--gold);color:#ebd29b;padding:6px 12px;font-family:inherit;font-size:13px;width:130px;" />
            <button class="sleek-btn" id="btn-enter" style="margin-left:auto;">踏入九州修仙界</button>
          </div>
        </div>
      `;
      const descBar = root.querySelector('#trait-desc-bar');
      root.querySelectorAll('[data-body]').forEach(btn => {
        btn.onclick = () => {
          const b = window.ACHIEVEMENTS.DAO_BODIES.find(x => x.id === btn.dataset.body);
          if (!b) return;
          if (!window.ACHIEVEMENTS.isBodyUnlocked(b, achStore)) {
            descBar.textContent = `【未解锁道体 · ${b.name}】${b.desc}（需达成对应天命成就解锁）`;
            return;
          }
          const curBodyObj = window.ACHIEVEMENTS.DAO_BODIES.find(x => x.id === pickedBody);
          const nextUsed = usedPts - (curBodyObj ? curBodyObj.cost : 0) + b.cost;
          if (nextUsed > achStore.totalPts) return showToast(`天命点不足（需 ${b.cost} 点）。`);
          G._pickedBody = b.id;
          SFX.play('click'); renderStep();
          const nb = document.getElementById('trait-desc-bar');
          if (nb) nb.textContent = `【道体 · ${b.name}】${b.desc}`;
        };
      });
      root.querySelectorAll('[data-trait]').forEach(btn => {
        btn.onclick = () => {
          const t = window.ACHIEVEMENTS.DESTINY_TRAITS.find(x => x.id === btn.dataset.trait);
          if (!t) return;
          if (!window.ACHIEVEMENTS.isTraitUnlocked(t, achStore)) {
            descBar.textContent = `【未解锁气运 · ${t.name}】${t.desc}（需达成对应天命成就解锁）`;
            return;
          }
          if (pickedTraits.includes(t.id)) {
            G._pickedTraits = pickedTraits.filter(x => x !== t.id);
          } else {
            if (pickedTraits.length >= 3) return showToast('先天气运最多同时勾选 3 条。');
            if (usedPts + t.cost > achStore.totalPts) return showToast(`天命点不足（需 ${t.cost} 点）。`);
            G._pickedTraits = [...pickedTraits, t.id];
          }
          SFX.play('click'); renderStep();
          const nb = document.getElementById('trait-desc-bar');
          if (nb) nb.textContent = `【气运 · ${t.name}】${t.desc}`;
        };
      });
      document.getElementById('btn-enter').onclick = () => {
        const val = document.getElementById('inp-name').value.trim();
        if (val) G.name = val;
        if (window.ACHIEVEMENTS) {
          const bObj = window.ACHIEVEMENTS.DAO_BODIES.find(x => x.id === (G._pickedBody || 'mortal_body'));
          if (bObj) { G.daoBody = bObj.id; bObj.apply(G); }
          G.destinyTraits = (G._pickedTraits || []).slice();
          G.destinyTraits.forEach(tid => {
            const tObj = window.ACHIEVEMENTS.DESTINY_TRAITS.find(x => x.id === tid);
            if (tObj) tObj.apply(G);
          });
        }
        delete G._pickedBody; delete G._pickedTraits;
        recalcDerivedStats(true);
        SFX.play('levelup'); root.style.display = 'none';
        saveGame('auto', true); renderAll();
      };
    }
  }
  renderStep();
}

function enterLocation(locId, skipTravel) {
  SFX.play('click');
  if (!G) return;
  if (!G.loc || G.loc === 'map') G.loc = 'sect';
  if (skipTravel || G.loc === locId || !window.WORLD_SIM) {
    currentLocationId = locId;
    G.loc = locId || 'sect';
    const lo = D.LOCATIONS.find(l => l.id === locId);
    if (lo && lo.region) currentMapRegion = lo.region;
    activePanel = null; activeDialogue = null; renderAll();
    return;
  }
  activePanel = null;
  window.WORLD_SIM.openTravelModal(getEventCtx(), locId, arrivedId => {
    currentLocationId = arrivedId;
    const lo = D.LOCATIONS.find(l => l.id === arrivedId);
    if (lo && lo.region) currentMapRegion = lo.region;
  });
}

function interactNpc(npcId) {
  SFX.play('click');
  if (npcId === 'sister') {
    const bonded = G.allies.sister.bond;
    const choices = [];
    if (G.sect === '散修') {
      choices.push({
        text: '行拜师礼，正式拜入青云剑宗', hint: '获太白剑典与制式飞剑',
        action: () => {
          G.sect = '青云剑宗'; G.factions.qingyun = Math.max(G.factions.qingyun || 0, 1);
          G.allies.sister.bond += 15; G.fame += 10;
          if (!G.ownedHeartArts.includes('qingyun_breath')) G.ownedHeartArts.push('qingyun_breath');
          if (!G.skills.includes('sister_frost')) {
            G.skills.push('sister_frost');
            G.skillProf.sister_frost = { lv: 1, exp: 0 };
          }
          addItem('eq_qingyun_sword', 1);
          allyExprMap.sister = 'smile';
          activeDialogue = {
            speaker: '林清霜', asset: ASSETS.sister_smile,
            text: '她微微颔首，唇角露出一丝难得的浅笑：“既入青云门下，日后便是我师弟了。这柄太白分光剑器、玄冥寒霜剑阵玉简与剑宗仙典，你且收好。”',
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
    G, D, ASSETS, SFX,
    setDialogue: d => { activeDialogue = d; },
    startBattle, addItem, gainExp, advanceTime, recalcDerivedStats, getEquipStats, getCatMastery, showToast, saveGame, renderAll, buyItem, openEquipShop,
    getItemIcon, formatStatSummary, startQuiz,
    setAllyExpr: (id, expr) => { allyExprMap[id] = expr; }
  };
}

function openEquipShop() {
  const unlockedHigh = (G.factions?.wanbao || 0) >= 1;
  const stockIds = unlockedHigh
    ? ['eq_frost_blade', 'eq_iron_staff', 'eq_xuan_armor', 'eq_venom_circlet', 'eq_iron_wrist', 'eq_venom_sachet', 'eq_qiankun_ring', 'tr_flying_sword', 'tr_soul_bell']
    : ['eq_qingyun_sword', 'eq_cloud_robe', 'eq_qingyun_crown', 'eq_wind_boots', 'eq_iron_wrist', 'eq_qiankun_ring', 'tr_poison_needle', 'tr_spirit_banner'];
  const choices = [];

  // 若前世野外遗骸超30年被路人斩妖取走，珍品会流落至此供高价赎回！
  (G.stolenMarketPool || []).forEach((sid, idx) => {
    const it = D.ITEMS[sid];
    if (!it) return;
    const redeemPrice = Math.round((it.price || 150) * 1.2);
    choices.push({
      text: `【前世流落旧物】赎回【${it.name}】`,
      hint: `${redeemPrice} 灵石`,
      action: () => {
        if (G.stone < redeemPrice) return showToast(`灵石不足 ${redeemPrice} 枚。`);
        G.stone -= redeemPrice;
        G.stolenMarketPool.splice(idx, 1);
        addItem(sid, 1);
        showToast(`赎回了前世遗失旧物【${it.name}】！`);
        saveGame('auto', true); openEquipShop();
      }
    });
  });

  stockIds.forEach(id => {
    const it = D.ITEMS[id];
    choices.push({
      text: `购入【${it.name}】(${it.tier})`,
      hint: `${it.price}灵石 · ${it.type === 'treasure' ? (it.mode === 'auto' ? '悬浮法宝' : '主动法宝') : formatStatSummary(it.stats)}`,
      action: () => buyItem(id)
    });
  });
  choices.push({ text: '离开法器坊', action: () => { activeDialogue = null; renderAll(); } });
  activeDialogue = {
    speaker: '鬼市法器坊', asset: ASSETS.elder,
    text: unlockedHigh
      ? '凭万宝楼验货令入内，玄黑木架上陈列着宗门套装法器、玄品道冠/法镯/须弥戒与体外法宝：“看中哪件直接点货，银货两讫。”'
      : '灯影摇曳的法器摊上摆着各部位灵品法器与体外法宝：“初来乍到先看外摊货色，若想见玄品重宝与绝世古宝，可逛拍卖会或拿万宝楼验货令。”',
    choices
  };
  renderAll();
}

function openLibraryModal(catFilter) {
  if (!catFilter) {
    const choices = Object.values(D.SKILL_CATS).map(c => {
      const catSkills = Object.values(D.SKILLS).filter(s => s.cat === c.id);
      const learned = catSkills.filter(s => G.skills.includes(s.id)).length;
      const m = getCatMastery(c.id);
      return {
        text: `参悟【${c.name}】玉简（已修 ${learned}/${catSkills.length} 门 · 大道造诣 ${m}/100）`,
        hint: c.desc.slice(0, 13),
        action: () => openLibraryModal(c.id)
      };
    });
    choices.push({
      text: '静心推演道法，提升出战 4 门神通熟练度与修为', hint: '+1月 悟性+1',
      action: () => {
        advanceTime(1); G.wit += 1;
        G.skills.slice(0, 4).forEach(sid => {
          const sk = D.SKILLS[sid];
          const apt = window.REINCARNATION ? window.REINCARNATION.getElemAptitude(G, sk?.elem) : { rate: 1 };
          gainSkillProf(sid, Math.max(3, Math.round(28 * apt.rate)));
        });
        const g = gainExp(52);
        recalcDerivedStats(false);
        showToast(`藏经阁推演一月，修为 +${g}，悟性 +1，出战神通按灵根资质精进！`);
        activeDialogue = null; saveGame('auto', true); renderAll();
      }
    });
    choices.push({ text: '离开藏经阁', action: () => { activeDialogue = null; renderAll(); } });
    activeDialogue = {
      speaker: '藏经阁传功长老', asset: ASSETS.elder,
      text: '“仙道浩瀚，六大道门各藏五门神通。无属性通用法术人人可平顺修习；五行真法则极看灵根资质——高资质一日千里，1点低资质亦可强修，只是苦熬数载方有所成！”',
      choices
    };
    renderAll();
    return;
  }

  const cat = D.SKILL_CATS[catFilter];
  const curM = getCatMastery(catFilter);
  const catSkills = Object.values(D.SKILLS).filter(s => s.cat === catFilter);
  const choices = catSkills.map(s => {
    const owned = G.skills.includes(s.id);
    const reqM = s.reqMastery || 0;
    const cost = s.price || 25;
    const elName = (D.ELEM_NAMES && D.ELEM_NAMES[s.elem]) || '通用';
    const apt = window.REINCARNATION ? window.REINCARNATION.getElemAptitude(G, s.elem) : { rate: 1, label: '1.0x' };
    if (owned) {
      const p = (G.skillProf && G.skillProf[s.id]) || { lv: 1, exp: 0 };
      const stepPts = Math.max(3, Math.round(36 * apt.rate));
      return {
        text: `闭关苦修【${s.name}】(${elName} · 当前${PROF_NAMES[p.lv]})`,
        hint: p.lv >= 4 ? '已圆满' : `15灵石 · 效率${apt.rate}x (+${stepPts})`,
        action: () => {
          if (p.lv >= 4) return showToast(`【${s.name}】已臻圆满，请兼修同道其他神通以推高【${cat.name}】造诣！`);
          if (G.stone < 15) return showToast('灵石不足 15 枚。');
          G.stone -= 15; advanceTime(1);
          gainSkillProf(s.id, stepPts);
          showToast(`参悟【${s.name}】一月（效率 ${apt.rate}x），当前【${cat.name}】造诣：${getCatMastery(catFilter)}/100！`);
          saveGame('auto', true); openLibraryModal(catFilter);
        }
      };
    }
    return {
      text: `拓印修习【${s.name}】(${elName} · 集气${s.atbCost})`,
      hint: `${reqM > 0 ? `需${cat.name}${reqM} · ` : ''}${cost}灵石 · 效率${apt.rate}x`,
      action: () => {
        if (curM < reqM) return showToast(`需【${cat.name}】造诣达到 ${reqM}（当前 ${curM}）方可参悟此高阶神通！`);
        if (G.stone < cost) return showToast(`灵石不足 ${cost} 枚。`);
        G.stone -= cost; advanceTime(1);
        G.skills.push(s.id);
        G.skillProf[s.id] = { lv: 1, exp: 0 };
        SFX.play('levelup');
        showToast(`习得【${s.name}】！${s.elem !== 'none' && apt.rate < 0.4 ? '（此系灵根微弱，后续修炼将极为缓慢）' : ''}`);
        saveGame('auto', true); openLibraryModal(catFilter);
      }
    };
  });
  choices.push({ text: '← 返回六道目录', action: () => openLibraryModal(null) });
  activeDialogue = {
    speaker: `藏经阁 · ${cat.name}分阁`, asset: ASSETS.elder,
    text: `【${cat.name}】当前造诣：${curM} / 100（全${cat.name}神通伤害 +${Math.round(curM * 0.45)}%）。${cat.desc}`,
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
  if (hid === 'cave_manage') {
    window.REINCARNATION.openCaveAbode(getEventCtx());
    renderAll();
    return;
  }
  if (hid === 'reclaim_remains') {
    window.REINCARNATION.checkRemainsOrNemesisAt(getEventCtx(), currentLocationId);
    renderAll();
    return;
  }
  if (hid === 'sect_trial') {
    window.REINCARNATION.tryDiscoverRelicAt(getEventCtx(), 'sect');
    D.EVENTS.runSectTrial(getEventCtx());
    renderAll();
  } else if (hid === 'sect_grand_tourney') {
    D.EVENTS.runGrandTourney(getEventCtx());
    renderAll();
  } else if (hid === 'sect_library') {
    openLibraryModal();
  } else if (hid === 'sect_alchemy') {
    window.MINIGAMES.openAlchemy(getEventCtx());
  } else if (hid === 'cliff_event') {
    window.REINCARNATION.tryDiscoverRelicAt(getEventCtx(), 'cliff');
    D.EVENTS.runCliffEvent(getEventCtx());
    renderAll();
  } else if (hid === 'inn_tea') {
    if (G.stone < 10) return showToast('囊中灵石不足 10 枚。');
    if (window.WORLD_SIM) window.WORLD_SIM.advanceDays(getEventCtx(), 2);
    else advanceTime(1);
    G.stone -= 10; G.wit += 1; recalcDerivedStats(true);
    showToast('在天机茶肆品茗调息两日，气血灵力圆满，悟性 +1。');
    saveGame('auto', true); renderAll();
  } else if (hid === 'inn_rumor') {
    window.REINCARNATION.ensureWorldRelic(G);
    const relicRumor = G.worldRelic.holder === 'player'
      ? '【造化轮回盘】此刻正贴身藏于你怀中，世间绝无第二件。'
      : `天机推演显示：天地唯一至宝【造化轮回盘】本世气机似隐现于「${G.worldRelic.rumor}」。`;
    const nemLocObj = G.nemesis && D.LOCATIONS.find(l => l.id === G.nemesis.loc);
    const nemNote = G.nemesis ? ` 另外，夺走你前世身家的死敌【${G.nemesis.name}】近期在【${nemLocObj ? nemLocObj.name : '东洲'}】一带出没！` : '';
    activeDialogue = {
      speaker: '天机掌柜', asset: ASSETS.elder,
      text: `掌柜压低声音道：“${relicRumor}${nemNote}对了，青云大师姐私下偏爱云州灵桂糕。”`,
      choices: [
        { text:'购一盒【云州灵桂糕】', hint:'20 灵石', action: () => buyItem('osmanthus_cake') },
        { text:'多谢掌柜指点天机', action: () => { activeDialogue = null; renderAll(); } }
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
    window.REINCARNATION.tryDiscoverRelicAt(getEventCtx(), 'market');
    D.EVENTS.runMarketFaction(getEventCtx());
    renderAll();
  } else if (hid === 'nether_path') {
    D.EVENTS.runNetherPath(getEventCtx());
    renderAll();
  } else if (hid === 'market_trade') {
    const eq = getEquipStats();
    if (window.WORLD_SIM) window.WORLD_SIM.advanceDays(getEventCtx(), 5);
    else advanceTime(1);
    const earn = 35 + Math.floor(((G.sense || 10) + eq.sense) * 1.6); G.stone += earn; G.sense += 1;
    showToast(`耗时五日凭神识眼力做成鉴宝买卖，净赚 ${earn} 灵石，神识 +1。`);
    saveGame('auto', true); renderAll();
  } else if (hid === 'forest_stall') {
    const eq = getEquipStats();
    if (window.WORLD_SIM) window.WORLD_SIM.advanceDays(getEventCtx(), 10);
    else advanceTime(1);
    const earn = Math.round((75 + eq.luck * 2) * (G.worldState?.priceMul || 1.0)); G.stone += earn; G.luck += 1;
    showToast(`在谷口设摊售药一旬(10日)，乘市价行情净赚 ${earn} 灵石，气运 +1。`);
    saveGame('auto', true); renderAll();
  } else if (hid === 'forest_tame') {
    openBeastTameModal();
  } else if (hid === 'forest_ruin') {
    window.REINCARNATION.tryDiscoverRelicAt(getEventCtx(), 'forest');
    D.EVENTS.runForestRuin(getEventCtx());
    renderAll();
  } else if (hid === 'forest_demon_tide') {
    D.EVENTS.runDemonTide(getEventCtx());
    renderAll();
  } else if (hid === 'altar_ancient_realm') {
    window.REINCARNATION.tryDiscoverRelicAt(getEventCtx(), 'altar');
    D.EVENTS.runAncientRealm(getEventCtx());
    renderAll();
  } else if (hid === 'altar_break') {
    const next = D.REALMS[G.realmIdx + 1];
    if (!next) return showToast('你已登临诸天至强【万道仙帝】之境！');
    if (G.exp < D.REALMS[G.realmIdx].exp) return showToast(`修为尚浅（${G.exp}/${D.REALMS[G.realmIdx].exp}）。`);
    const gateErr = checkRealmDaoGate(next);
    if (gateErr) return showToast(gateErr);
    if (next.tribulation) {
      const tribHp = 240 + G.realmIdx * G.realmIdx * 85;
      const tribAtk = 24 + G.realmIdx * 11;
      activeDialogue = {
        speaker: '九霄混沌雷劫', asset: ASSETS.hero,
        text: `雷池沸腾，诸天法则降临！证道【${next.name}】须渡过此重天劫${next.reqDao100 ? `（大道道果共鸣中）` : ''}。`,
        choices: [
          { text:'以平生道果硬撼天劫', hint:`HP ${tribHp}`, action: () => startBattle({ name:`${next.name}·混沌雷劫`, asset:ASSETS.wolf_boss, bg:'world_map', hp:tribHp, maxHp:tribHp, atk:tribAtk, talkDef:999, expReward:0, stoneReward:120, isTribulation:true }) },
          { text:'祭出【九宫避劫阵盘】分化天雷破境', hint:'消耗阵盘', action: () => {
            if (!G.bag.lightning_plate || G.bag.lightning_plate <= 0) return showToast('行囊中无【九宫避劫阵盘】。');
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
  } else if (D.EVENTS.runWorldHotspot) {
    D.EVENTS.runWorldHotspot(hid, getEventCtx());
    renderAll();
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
  if (G) G.loc = currentLocationId || 'sect';
  window.COMBAT.start(enemy, {
    G, D, ASSETS,
    getFullCtx: getEventCtx,
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

function getStatCompareHtml(newItem) {
  if (!newItem || newItem.type !== 'equip' || !newItem.stats) return '';
  let targetSlot = newItem.slot;
  if (targetSlot === 'wrist') targetSlot = !G.equipment.wristL ? 'wristL' : (!G.equipment.wristR ? 'wristR' : 'wristL');
  else if (targetSlot === 'acc') targetSlot = !G.equipment.acc1 ? 'acc1' : (!G.equipment.acc2 ? 'acc2' : 'acc1');
  const curId = G.equipment && G.equipment[targetSlot];
  const curStats = (curId && D.ITEMS[curId] && D.ITEMS[curId].stats) || {};
  const labels = { atk:'攻', def:'防', hpMax:'血', qiMax:'灵', body:'根骨', speed:'遁速', luck:'气运', sense:'神识', crit:'暴击', dodge:'闪避', expRate:'修炼', bagCap:'行囊' };
  const keys = Array.from(new Set([...Object.keys(newItem.stats), ...Object.keys(curStats)]));
  const parts = [];
  keys.forEach(k => {
    if (!labels[k]) return;
    const nv = newItem.stats[k] || 0;
    const ov = curStats[k] || 0;
    const diff = nv - ov;
    const isPct = k === 'crit' || k === 'dodge' || k === 'expRate';
    const fmt = v => isPct ? `${Math.round(v * 100)}%` : `${v}`;
    if (nv === 0 && diff === 0) return;
    let deltaHtml = '';
    if (curId && diff !== 0) {
      const cls = diff > 0 ? 'delta-up' : 'delta-dn';
      deltaHtml = `<em class="${cls}">(${diff > 0 ? '+' : ''}${fmt(diff)})</em>`;
    }
    parts.push(`<span class="cmp-chip">${labels[k]} <b>${nv >= 0 ? '+' : ''}${fmt(nv)}</b>${deltaHtml}</span>`);
  });
  return parts.join('');
}

// Render Full-Screen System Overlays (v6.1: Unified 3A Smoked-Obsidian Glass & 方案A Card-Stream Bag)
function renderSplitPanel() {
  const host = document.getElementById('panel-root');
  host.innerHTML = '';
  if (!activePanel) return;

  const realm = D.REALMS[G.realmIdx];
  const curTab = activePanel === 'allies' ? 'allies' : statusSubTab;
  const sc = document.createElement('div');
  sc.className = 'sys-screen';
  sc.style.backgroundImage = `url("${curTab === 'allies' ? ASSETS.bamboo : ASSETS.world_map}")`;

  const unreadCnt = (G.letters || []).filter(x => !x.read).length;
  const navItems = [
    { k:'mingge', l:'命格' },
    { k:'skills', l:'功法' },
    { k:'bag', l:'行囊装备' },
    { k:'allies', l:'伙伴灵兽' },
    { k:'news', l: unreadCnt > 0 ? `邸报(${unreadCnt})` : '天下邸报' },
    { k:'ach', l:'天命成就' },
    { k:'save', l:'卷宗' }
  ];
  const navHtml = navItems.map(n => `<button class="gp-tab ${curTab===n.k?'active':''}" data-nav="${n.k}">${n.l}</button>`).join('');

  sc.innerHTML = `
    <div class="sys-topbar">
      <button class="sleek-btn ghost" id="sp-close">← 返回东洲</button>
      <div class="sys-nav">${navHtml}</div>
      <div class="glass-pill" style="padding:5px 14px;font-size:11.5px;">
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

  // 1. 命格页：左侧完整全身像 + 右侧核心五维、五行雷达、百兵武学总熟练度(0~100)与修为
  if (curTab === 'mingge') {
    const expPct = Math.min(100, Math.round((G.exp / Math.max(1, realm.exp)) * 100));
    const canBreak = G.exp >= realm.exp && D.REALMS[G.realmIdx + 1];
    const eq = getEquipStats();
    const ha = D.HEART_ARTS[G.heartArt] || {};
    const unlockedTr = getUnlockedTreasureSlots();
    const totalSense = (G.sense || 10) + (eq.sense || 0);
    const critPct = Math.round((0.08 + (G.luck || 10) * 0.01 + (eq.crit || 0) + (ha.critBonus || 0)) * 100);
    const spdLi = window.WORLD_SIM ? window.WORLD_SIM.getPlayerSpeedLi(G, eq) : 25;
    const coreStats = [
      ['根骨', (G.body || 10) + (eq.body || 0), ''],
      ['悟性', G.wit || 10, ''],
      ['遁速', (G.speed || 10) + (eq.speed || 0), `日行 ${spdLi.toLocaleString()} 里`],
      ['气运', (G.luck || 10) + (eq.luck || 0), ''],
      ['神识', totalSense, `可御 ${unlockedTr}/2 件外物法宝`]
    ];
    const catBarsHtml = Object.values(D.SKILL_CATS).map(c => {
      const m = getCatMastery(c.id);
      const dmgPct = Math.round(m * 0.4);
      return `
        <div class="mastery-row">
          <span class="m-name">${c.name}</span>
          <div class="m-track"><i style="width:${m}%"></i></div>
          <span class="m-val"><b>${m}</b> / 100</span>
          <span class="m-bonus">${dmgPct > 0 ? `+${dmgPct}%威` : '初窥'}</span>
        </div>
      `;
    }).join('');

    const el = G.elements || {};
    const hasRelicNow = window.REINCARNATION && window.REINCARNATION.hasRelic(G);
    main.innerHTML = `
      <div class="fullbody-col">
        <div class="fullbody-wrap">
          <img class="full-char" src="${ASSETS.hero_full}" />
          <div class="dantian-waist"></div>
          <div class="lifespan-ring">第 ${G.lifeCount || 1} 世 · 寿元 ${G.age}/${G.maxAge} 岁 · ${hasRelicNow ? '怀揣轮回盘' : '无轮回至宝'}</div>
        </div>
      </div>
      <div class="glass-panel">
        <div class="mg-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="vermilion-seal">${G.sect || '青云门人'}</span>
            <div>
              <div class="mg-name">${G.name} <span class="mg-realm">${realm.name} · 第${G.lifeCount || 1}世</span></div>
              <div class="mg-sub">${G.root}（金${el.gold} 木${el.wood} 水${el.water} 火${el.fire} 土${el.earth}） · ${G.talent}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0;">
            <button class="sleek-btn" id="btn-med">择期闭关</button>
            ${canBreak ? `<button class="sleek-btn jade" id="btn-break">破境突破</button>` : ''}
          </div>
        </div>
        <div class="mg-exp-box">
          <div class="mg-exp-meta"><span>修为进度</span><b>${G.exp} / ${realm.exp}</b></div>
          <div class="exp-track"><div class="exp-fill" style="width:${expPct}%"></div></div>
        </div>
        <div class="gp-body">
          <div class="mg-top-split">
            <div class="mg-stats-list">
              ${coreStats.map(([lbl, val, note]) => `
                <div class="mg-stat-row">
                  <span class="ms-lbl">${lbl}</span>
                  <b class="ms-val">${val}</b>
                  ${note ? `<span class="ms-note">${note}</span>` : ''}
                </div>
              `).join('')}
            </div>
            <div class="mg-radar-col">
              ${buildRadarSvg(G.elements)}
            </div>
          </div>
          <div class="mg-divider">六大仙道造诣（0–100 · 单门圆满+22，同道兼修诸法方臻化境）</div>
          <div class="mastery-list">${catBarsHtml}</div>
          <div class="mg-foot-strip">
            <span>仙典：<b>${ha.style || '混元修习'}</b></span>
            <span>会心 <b>${critPct}%</b></span>
            <span>气血 <b>${G.hp}/${G.maxHp}</b></span>
            <span>灵力 <b>${Math.floor(G.qi)}/${G.maxQi}</b></span>
            <span>灵兽：<b>${G.activeBeast ? D.BEAST_DEFS[G.activeBeast].name : '未出战'}</b></span>
          </div>
        </div>
      </div>
    `;
    main.querySelector('#btn-med').onclick = () => {
      SFX.play('click');
      activePanel = null;
      if (window.WORLD_SIM) {
        window.WORLD_SIM.openSeclusionModal(getEventCtx(), 38, '静室吐纳');
      } else {
        advanceTime(1); recalcDerivedStats(true);
        const g = gainExp(38); showToast(`静修一月，状态圆满，修为 +${g}。`);
        saveGame('auto', true); renderAll();
      }
    };
    const brk = main.querySelector('#btn-break');
    if (brk) brk.onclick = () => { tryRealmUp(false); renderAll(); };
  }
  // 2. 行囊装备页（v6.1 方案A）：左侧9格对称环绕穿戴 + 中置暗金道纹 + 2格神识外物法宝；右侧图文卡片流 + 独立详情对比卡
  else if (curTab === 'bag') {
    const eq = G.equipment || {};
    const eqStats = getEquipStats();
    const ha = D.HEART_ARTS[G.heartArt] || {};
    const sets = getActiveSets();
    const bagCap = eqStats.bagCap || 15;
    const unlockedTr = getUnlockedTreasureSlots();
    const totalSense = (G.sense || 10) + (eqStats.sense || 0);

    const renderEqSlot = (d) => {
      const isSel = selectedEquipSlot === d.key;
      const itemId = eq[d.key];
      const it = itemId && D.ITEMS[itemId];
      return `
        <div class="sym-slot ${it ? 'filled' : ''} ${it?.unique ? 'uniq' : ''} ${it?.tier ? `tier-b-${it.tier}` : ''} ${isSel ? 'selected' : ''}" data-eq-slot="${d.key}">
          <div class="sym-ico">
            ${it ? `<img src="${getItemIcon(itemId)}"/>` : `<span class="slot-glyph">${window.SLOT_ICONS[d.key] || ''}</span>`}
          </div>
          <div class="sym-meta">
            <div class="sym-lbl">${d.label}${it && it.tier ? ` · <em class="tier-tag t-${it.tier}">${it.unique ? '孤品' : it.tier}</em>` : ''}</div>
            <div class="sym-name">${it ? it.name.replace(/^【孤品】/, '') : '空置'}</div>
          </div>
        </div>
      `;
    };

    const leftSlots = D.EQUIP_SLOTS.slice(0, 4).map(renderEqSlot).join('');
    const rightSlots = D.EQUIP_SLOTS.slice(4, 9).map(renderEqSlot).join('');

    const trReqs = ['需神识 ≥ 18 或 筑基', '需神识 ≥ 32 或 金丹'];
    const trHtml = [0, 1].map(idx => {
      const slotKey = `tr_${idx}`;
      const locked = idx >= unlockedTr;
      const tid = G.treasures && G.treasures[idx];
      const it = tid && D.ITEMS[tid];
      const isSel = selectedEquipSlot === slotKey;
      return `
        <div class="tr-slot ${it && !locked ? 'filled' : ''} ${locked ? 'locked' : ''} ${isSel ? 'selected' : ''}" data-eq-slot="${slotKey}">
          <div class="tr-ico">
            ${locked ? `<span class="lock-glyph">${window.ICONS.lock}</span>` : (it ? window.getSkillIconHtml(tid, 'tr-sk-ico') : `<span class="slot-glyph">${window.ICONS.spark}</span>`)}
          </div>
          <div class="tr-meta">
            <div class="tr-name">${locked ? '未解锁' : (it ? it.name : `外物槽 ${idx + 1} · 空置`)}</div>
            <div class="tr-sub">${locked ? trReqs[idx] : (it ? (it.mode === 'auto' ? '悬浮自动出击 · 纯外物' : '主动祭出 · 纯外物') : '从右侧法宝页签装配')}</div>
          </div>
        </div>
      `;
    }).join('');

    const activeSetStr = Object.entries(sets)
      .filter(([, n]) => n >= 2)
      .map(([sid, n]) => `${D.SETS[sid].name}(${n}/4)`).join(' · ') || '未激活套装（支持套装混搭或绝世孤品）';

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

    const critVal = Math.round((0.08 + (G.luck || 10) * 0.01 + eqStats.crit + (ha.critBonus || 0)) * 100);

    main.innerHTML = `
      <div class="dual-left bag-left">
        <div class="sec-head">
          <span>身上穿戴（9格）</span>
          <span style="font-size:10px;color:var(--jade);">${activeSetStr}</span>
        </div>
        <div class="sym-equip-stage">
          <div class="sym-col">${leftSlots}</div>
          <div class="sym-center">
            <div class="sym-bagua">${window.ICONS.bagua}</div>
            <div class="sym-stat-pills">
              <div><span>攻</span><b>+${eqStats.atk + (ha.atkBonus || 0)}</b></div>
              <div><span>防</span><b>+${eqStats.def + (ha.defBonus || 0)}</b></div>
              <div><span>暴</span><b>${critVal}%</b></div>
              <div><span>闪</span><b>${Math.round(eqStats.dodge * 100)}%</b></div>
            </div>
          </div>
          <div class="sym-col">${rightSlots}</div>
        </div>
        <div class="tr-section">
          <div class="tr-head">
            <span>外物法宝（神识御使 · ${unlockedTr}/2）</span>
            <span style="font-size:10px;color:var(--muted);">当前神识 ${totalSense} · 纯外物不加属性</span>
          </div>
          <div class="tr-grid">${trHtml}</div>
        </div>
      </div>

      <div class="dual-right bag-right">
        <div class="sec-head">
          <span>乾坤行囊 <em style="font-style:normal;font-size:10.5px;color:var(--muted);">(${allOwned.length} / ${bagCap} 格)</em></span>
          <div class="filter-pills">
            <button class="filter-pill ${bagFilter==='all'?'active':''}" data-bf="all">全部</button>
            <button class="filter-pill ${bagFilter==='equip'?'active':''}" data-bf="equip">装备</button>
            <button class="filter-pill ${bagFilter==='treasure'?'active':''}" data-bf="treasure">法宝</button>
            <button class="filter-pill ${bagFilter==='other'?'active':''}" data-bf="other">丹药</button>
          </div>
        </div>
        <div class="bag-list-stream" id="bag-list-stream"></div>
        <div class="bag-detail-card" id="bag-detail"></div>
      </div>
    `;

    main.querySelectorAll('[data-bf]').forEach(b => {
      b.onclick = () => { SFX.play('click'); bagFilter = b.dataset.bf; selectedBagItem = null; selectedEquipSlot = null; renderAll(); };
    });
    main.querySelectorAll('[data-eq-slot]').forEach(el => {
      el.onclick = () => {
        SFX.play('click');
        selectedEquipSlot = el.dataset.eqSlot;
        selectedBagItem = null;
        renderAll();
      };
    });

    // Render sleek 3A Card Stream (no ugly 5x4 box wall!)
    const stream = main.querySelector('#bag-list-stream');
    if (owned.length === 0) {
      stream.innerHTML = `<div class="bag-empty-hint">当前分类下暂无灵物，可前往鬼市装备坊、万宝楼或拍卖会寻宝。</div>`;
    } else {
      owned.forEach(([id, cnt]) => {
        const it = D.ITEMS[id];
        const row = document.createElement('div');
        row.className = `bag-row-card ${selectedBagItem === id ? 'selected' : ''} ${it.tier ? `tier-l-${it.tier}` : ''} ${it.unique ? 'uniq' : ''}`;
        const subLine = it.type === 'equip'
          ? formatStatSummary(it.stats)
          : (it.type === 'treasure' ? (it.mode === 'auto' ? '悬浮自动出击 · 纯外物' : '主动祭出 · 纯外物') : it.desc);
        const setBadge = it.unique
          ? `<span class="mini-seal">孤品</span>`
          : (it.set && D.SETS[it.set] ? `<span class="mini-set">${D.SETS[it.set].name.replace('套', '')}</span>` : '');
        const icoHtml = it.type === 'treasure'
          ? window.getSkillIconHtml(id, 'row-sk-ico')
          : `<img src="${getItemIcon(id)}"/>`;
        row.innerHTML = `
          <div class="row-ico">${icoHtml}</div>
          <div class="row-body">
            <div class="row-top">
              <span class="row-name">${it.name.replace(/^【孤品】/, '')}</span>
              ${it.tier ? `<em class="tier-tag t-${it.tier}">${it.tier}</em>` : ''}
              ${setBadge}
            </div>
            <div class="row-sub">${subLine}</div>
          </div>
          <div class="row-cnt">×${cnt}</div>
        `;
        row.onclick = () => { SFX.play('click'); selectedBagItem = id; selectedEquipSlot = null; renderAll(); };
        stream.appendChild(row);
      });
    }

    // Permanent High-Contrast Detail & Stat-Comparison Card
    const det = main.querySelector('#bag-detail');
    if (selectedEquipSlot) {
      const isTr = selectedEquipSlot.startsWith('tr_');
      const trIdx = isTr ? Number(selectedEquipSlot.split('_')[1]) : -1;
      const curId = isTr ? (G.treasures && G.treasures[trIdx]) : eq[selectedEquipSlot];
      const sit = curId && D.ITEMS[curId];
      if (sit) {
        const icoHtml = isTr ? window.getSkillIconHtml(curId, 'det-sk-ico') : `<img src="${getItemIcon(curId)}"/>`;
        det.innerHTML = `
          <div class="det-ico">${icoHtml}</div>
          <div class="det-info">
            <div class="det-title">
              <b>${sit.name}</b>
              ${sit.tier ? `<span class="tier-tag t-${sit.tier}">${sit.tier}</span>` : ''}
              <span class="mini-set">已穿戴</span>
            </div>
            <div class="det-stats">${isTr ? sit.desc : formatStatSummary(sit.stats)}</div>
            ${!isTr ? `<div class="det-desc">${sit.desc}</div>` : ''}
          </div>
          <button class="sleek-btn ghost" id="eq-unequip" style="flex-shrink:0;">卸下</button>
        `;
        det.querySelector('#eq-unequip').onclick = () => unequipSlot(selectedEquipSlot);
      } else {
        const locked = isTr && trIdx >= unlockedTr;
        det.innerHTML = `<div class="det-empty">${locked ? `该外物法宝槽尚未解锁（${trReqs[trIdx]}），提升神识或破境后可御使。` : '该槽位当前空置，点选上方行囊中的装备或法宝即可装配。'}</div>`;
      }
    } else if (selectedBagItem && D.ITEMS[selectedBagItem]) {
      const it = D.ITEMS[selectedBagItem];
      const icoHtml = it.type === 'treasure' ? window.getSkillIconHtml(selectedBagItem, 'det-sk-ico') : `<img src="${getItemIcon(selectedBagItem)}"/>`;
      if (it.type === 'equip' || it.type === 'treasure') {
        const cmpHtml = it.type === 'equip' ? getStatCompareHtml(it) : `<span class="cmp-chip" style="color:var(--jade);">${it.mode === 'auto' ? '悬浮自动出击 · 纯外物' : '主动祭出 · 纯外物'}</span>`;
        det.innerHTML = `
          <div class="det-ico">${icoHtml}</div>
          <div class="det-info">
            <div class="det-title">
              <b>${it.name}</b>
              ${it.tier ? `<span class="tier-tag t-${it.tier}">${it.tier}</span>` : ''}
              ${it.set && D.SETS[it.set] ? `<span class="mini-set">${D.SETS[it.set].name}</span>` : ''}
              ${it.unique ? `<span class="mini-seal">绝世孤品</span>` : ''}
            </div>
            <div class="det-cmp">${cmpHtml}</div>
            <div class="det-desc">${it.desc}</div>
          </div>
          <button class="sleek-btn" id="bag-equip" style="flex-shrink:0;">${it.type === 'treasure' ? '装配法宝' : '穿戴'}</button>
        `;
        det.querySelector('#bag-equip').onclick = () => equipItem(selectedBagItem);
      } else {
        det.innerHTML = `
          <div class="det-ico">${icoHtml}</div>
          <div class="det-info">
            <div class="det-title"><b>${it.name}</b> <span style="font-size:11px;color:var(--muted);">×${G.bag[selectedBagItem]}</span></div>
            <div class="det-desc">${it.desc}</div>
          </div>
          ${(it.type==='consumable'||it.type==='box'||it.type==='dao_item') ? `<button class="sleek-btn" id="bag-use" style="flex-shrink:0;">${it.type==='dao_item'?'参悟服用':'使用'}</button>` : `<span style="font-size:10.5px;color:var(--muted);flex-shrink:0;">特定场合使用</span>`}
        `;
        const ub = det.querySelector('#bag-use');
        if (ub) ub.onclick = () => {
          if (it.type === 'dao_item') {
            activePanel = null;
            activeDialogue = {
              speaker: '服食悟道古茶树叶', asset: ASSETS.hero,
              text: '清冽道韵直冲泥丸宫！请选择要将这 +15 点大道本源灌注于哪一条仙道（大道本源跨世轮回不灭）：',
              choices: [
                ...Object.values(D.SKILL_CATS).map(c => ({
                  text: `灌注【${c.name}】（当前 ${getCatMastery(c.id)}/100）`,
                  hint: '+15 大道本源',
                  action: () => {
                    if (getCatMastery(c.id) >= 100) return showToast(`【${c.name}】已达 100 圆满，请选择其他大道！`);
                    G.bag[selectedBagItem]--;
                    if (G.bag[selectedBagItem] <= 0) delete G.bag[selectedBagItem];
                    G.daoBase[c.id] = Math.min(100, getCatMastery(c.id) + (it.daoPts || 15));
                    SFX.play('levelup');
                    showToast(`【${c.name}】本源暴涨，当前已达 ${getCatMastery(c.id)}/100！`);
                    activeDialogue = null; saveGame('auto', true); renderAll();
                  }
                })),
                { text: '暂不服用', action: () => { activeDialogue = null; activePanel = 'status'; statusSubTab = 'bag'; renderAll(); } }
              ]
            };
            renderAll();
            return;
          }
          G.bag[selectedBagItem]--;
          if (G.bag[selectedBagItem] <= 0) delete G.bag[selectedBagItem];
          const mul = 1 + (eqStats.healBonus || 0);
          if (it.hp) G.hp = Math.min(G.maxHp, G.hp + Math.round(it.hp * mul));
          if (it.qi) G.qi = Math.min(G.maxQi, G.qi + Math.round(it.qi * mul));
          if (it.addMaxAge) G.maxAge += it.addMaxAge;
          if (it.fullRestore) { G.hp = G.maxHp; G.qi = G.maxQi; }
          if (it.addMaxAge) {
            SFX.play('levelup');
            showToast(`服下【${it.name}】，逆天增补寿元上限 +${it.addMaxAge} 载（当前上限 ${G.maxAge} 岁）！`);
          } else if (it.marrow) {
            const ks = [['body','根骨'], ['wit','悟性'], ['speed','遁速'], ['sense','神识']];
            const pick = ks[Math.floor(Math.random() * ks.length)];
            const eks = [['gold','金'], ['wood','木'], ['water','水'], ['fire','火'], ['earth','土']];
            const ep = eks[Math.floor(Math.random() * eks.length)];
            G[pick[0]] += 2;
            G.elements[ep[0]] = Math.min(100, (G.elements[ep[0]] || 20) + 4);
            recalcDerivedStats(false);
            const g = gainExp(it.exp || 130);
            showToast(`服下【${it.name}】，${pick[1]} +2，${ep[1]}灵根资质 +4，修为 +${g}！`);
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
      det.innerHTML = `<div class="det-empty">点选上方行囊物品或左侧装备槽位查看详情与属性对比。</div>`;
    }
  }
  // 3. 功法神通页：左侧主修仙典 + 3悟道秘印 + 4出战神通（每门带专属图标与灵根契合效率）；右侧仙典/秘印/全神通玉简
  else if (curTab === 'skills') {
    const curHa = D.HEART_ARTS[G.heartArt] || D.HEART_ARTS.turtle_breath;
    const curHaApt = window.REINCARNATION ? window.REINCARNATION.getElemAptitude(G, curHa.elem) : { label: '1.0x' };
    main.innerHTML = `
      <div class="dual-left">
        <div class="sec-head"><span>仙道构筑与出战神通</span><span style="font-size:10.5px;color:var(--jade);">${curHa.style}</span></div>
        <div class="gp-body">
          <div class="sub-cap">当前主修仙典（吐纳效率：${curHaApt.label}）</div>
          <div class="glass-card active"><div><h4>${curHa.name}</h4><p>${curHa.desc}</p></div></div>
          <div class="sub-cap">悟道秘印（已烙 ${G.passives.length}/3 枚）</div>
          <div style="display:flex;flex-direction:column;gap:5px;">
            ${G.passives.map(pid => `<div class="glass-card active" style="padding:6px 10px;"><div><h4>${D.PASSIVES[pid].name} <span style="font-size:10px;color:var(--jade);">[${D.PASSIVES[pid].style}]</span></h4><p>${D.PASSIVES[pid].desc}</p></div></div>`).join('') || '<div class="glass-card"><p>点击右侧悟道秘印烙印（最多 3 枚）</p></div>'}
          </div>
          <div class="sub-cap">出战神通槽（实时集气催动 · 4 门）</div>
          <div style="display:flex;flex-direction:column;gap:5px;">
            ${G.skills.slice(0, 4).map((sid, idx) => {
              const s = D.SKILLS[sid]; const p = (G.skillProf && G.skillProf[sid]) || { lv: 1 };
              const apt = window.REINCARNATION ? window.REINCARNATION.getElemAptitude(G, s.elem) : { rate: 1, qiMul: 1 };
              const elTag = (D.ELEM_NAMES && D.ELEM_NAMES[s.elem]) || '通用';
              return `
                <div class="glass-card sk-slot-row">
                  ${window.getSkillIconHtml(sid, 'sk-ico-badge')}
                  <div style="flex:1;min-width:0;">
                    <h4>槽${idx+1} · ${s.name} <em style="font-style:normal;font-size:10px;color:var(--jade);">[${PROF_NAMES[p.lv]}]</em></h4>
                    <p>${D.SKILL_CATS[s.cat].name} · ${elTag}(${apt.rate}x) · 集气 ${s.atbCost} · 灵 ${Math.max(1, Math.round(s.qiCost * apt.qiMul))}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="dual-right">
        <div class="sec-head"><span>仙典 · 悟道秘印 · 神通玉简</span><button class="filter-pill active" id="btn-learn-more">藏经阁参悟</button></div>
        <div class="gp-body">
          <div class="sub-cap gold">主修仙典（点击运转）</div>
          <div id="ha-wrap" style="display:flex;flex-direction:column;gap:5px;"></div>
          <div class="sub-cap gold" style="margin-top:4px;">悟道秘印（点击装配 / 卸下，最多 3 枚）</div>
          <div id="pa-wrap" style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;"></div>
          <div class="sub-cap gold" style="margin-top:4px;">已悟神通与通用法术（点击置顶出战 · 同道兼修堆 100 造诣）</div>
          <div id="sk-wrap" style="display:flex;flex-direction:column;gap:5px;"></div>
        </div>
      </div>
    `;
    main.querySelector('#btn-learn-more').onclick = () => { activePanel = null; openLibraryModal(); };
    const hw = main.querySelector('#ha-wrap');
    G.ownedHeartArts.forEach(hid => {
      const ha = D.HEART_ARTS[hid]; if (!ha) return;
      const hApt = window.REINCARNATION ? window.REINCARNATION.getElemAptitude(G, ha.elem) : { rate: 1 };
      const c = document.createElement('div'); c.className = 'glass-card' + (G.heartArt === hid ? ' active' : '');
      c.style.cursor = 'pointer';
      c.innerHTML = `<div><h4>${ha.name} <span style="font-size:10px;color:var(--jade);">[${ha.style} · ${hApt.rate}x]</span> ${G.heartArt === hid ? '<span class="mini-seal">主修</span>' : ''}</h4><p>${ha.desc}</p></div>`;
      c.onclick = () => { G.heartArt = hid; recalcDerivedStats(false); SFX.play('click'); showToast(`切换主修仙典：${ha.name}`); saveGame('auto', true); renderAll(); };
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
      const apt = window.REINCARNATION ? window.REINCARNATION.getElemAptitude(G, s.elem) : { rate: 1 };
      const elTag = (D.ELEM_NAMES && D.ELEM_NAMES[s.elem]) || '通用';
      const inBattle = idx < 4;
      const c = document.createElement('div'); c.className = 'glass-card sk-slot-row' + (inBattle ? ' active' : '');
      c.style.cursor = 'pointer';
      c.innerHTML = `
        ${window.getSkillIconHtml(sid, 'sk-ico-badge')}
        <div style="flex:1;min-width:0;">
          <h4>${s.name} <span style="font-size:10px;color:var(--muted);">(${D.SKILL_CATS[s.cat].name}·${elTag}·${apt.rate}x·${PROF_NAMES[p.lv]})</span> ${inBattle ? `<span class="mini-set">出战${idx+1}</span>` : ''}</h4>
          <p>${s.desc}</p>
        </div>
        <span style="font-size:10.5px;color:#ebd29b;flex-shrink:0;">集气 ${s.atbCost}</span>
      `;
      c.onclick = () => {
        if (idx === 0) return;
        G.skills.splice(idx, 1); G.skills.unshift(sid);
        SFX.play('click'); showToast(`已将【${s.name}】置入出战神通首位。`);
        saveGame('auto', true); renderAll();
      };
      sw.appendChild(c);
    });
  }
  // 4. 伙伴 / 灵兽页：支持顶部切换「同行道友 | 灵兽御契」
  else if (curTab === 'allies') {
    syncUnlockedAllies();
    if (allySubMode === 'beast') {
      const bDef = D.BEAST_DEFS[selectedBeastId] || D.BEAST_DEFS.wolf;
      const bObj = G.beasts && G.beasts[bDef.id];
      const isActB = G.activeBeast === bDef.id;
      const curStage = bObj ? Math.min(3, bObj.stage || 0) : 0;
      const nextStage = bDef.stages[Math.min(3, curStage + 1)];
      const bondPct = bObj ? Math.min(100, bObj.bond || 20) : 0;
      const bThumbs = Object.values(D.BEAST_DEFS).map(b => `
        <button class="beast-thumb ${selectedBeastId===b.id?'active':''} ${G.beasts?.[b.id]?'owned':''}" data-beast="${b.id}" title="${b.name}">
          ${window.BEAST_ICONS[b.id] || ''}
          <span>${b.name.slice(0, 2)}</span>
        </button>
      `).join('');
      main.innerHTML = `
        <div class="fullbody-col">
          <div class="fullbody-wrap">
            <img class="full-char" src="${ASSETS[bDef.asset]}" />
            <div class="beast-thumb-strip">${bThumbs}</div>
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
          <div class="gp-body">
            <div style="display:flex;align-items:center;gap:12px;">
              <span class="vermilion-seal">${bObj ? `${curStage+1}阶灵兽` : '野生灵兽'}</span>
              <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:21px;font-weight:700;color:#ebd29b;letter-spacing:3px;">${bDef.name}</span>
                  ${isActB ? '<span class="mini-set">出战中</span>' : ''}
                </div>
                <div style="font-size:11px;color:var(--muted);margin-top:3px;">
                  ${bObj ? `亲密 ${bObj.bond || 20}/100 · 进化：${bDef.stages[curStage]} → ${nextStage}` : '尚未驯化收养'}
                </div>
                <div class="bond-bar"><div class="bond-fill" style="width:${bondPct}%"></div></div>
              </div>
            </div>
            <div class="beast-stat-bar">
              <span>品阶 <b>${bObj ? bDef.stages[curStage] : '未契'}</b></span>
              <span>攻势 <b>${bDef.baseAtk + (bObj ? bObj.lv * 4 + curStage * 10 : 0)}</b></span>
              <span>遁速 <b>${bDef.baseSpeed + (bObj ? curStage * 3 : 0)}</b></span>
              <span>等级 <b>${bObj ? `Lv.${bObj.lv}` : '—'}</b></span>
            </div>
            <div class="glass-card" style="flex-direction:column;align-items:flex-start;gap:4px;">
              <h4>御兽战技 · ${bDef.skillName}</h4>
              <p>${bDef.desc}（战斗中独立实时集气自动出击）</p>
            </div>
            ${bObj ? `
              <div class="ally-actions" style="grid-template-columns:repeat(3,1fr);">
                <button class="sleek-btn ghost" id="bs-feed">喂食灵果</button>
                <button class="sleek-btn ghost" id="bs-evolve">血脉进化(50灵石)</button>
                <button class="sleek-btn" id="bs-act">${isActB ? '休战待命' : '设为出战'}</button>
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
  // 5. 天下邸报 · 飞剑传书 · 九大势力与活跃修士名录
  else if (curTab === 'news') {
    if (window.WORLD_SIM) window.WORLD_SIM.initWorldState(G);
    (G.letters || []).forEach(l => { l.read = true; });
    const powers = window.WORLD_SIM ? window.WORLD_SIM.NINE_POWERS : [];
    const npcs = G.simNpcs || [];
    const newsList = G.worldNews || [];
    const letters = G.letters || [];
    const openRifts = (G.randomRifts || []).filter(rf => rf.expireDay > G.totalDays);

    main.innerHTML = `
      <div class="dual-left">
        <div class="sec-head">
          <span>众生百态 · 限时秘境 · 九大势力</span>
          <span style="font-size:10px;color:var(--jade);">物价 ${(G.worldState?.priceMul || 1).toFixed(2)}x · 业煞 ${G.karma || 0}</span>
        </div>
        <div class="gp-body">
          <div class="glass-card active" style="padding:7px 10px;">
            <div>
              <h4>当前天下大势</h4>
              <p>${G.worldState?.warDesc || '五洲四海风平浪静'}</p>
            </div>
          </div>
          ${openRifts.length ? `<div class="sub-cap gold">天降随机秘境（手慢将被其他修士搬空！）</div>` : ''}
          ${openRifts.map(rf => `
            <div class="glass-card active" style="padding:6px 10px;">
              <div style="flex:1;min-width:0;">
                <h4>${rf.name} <span class="mini-set">余 ${rf.expireDay - G.totalDays} 日</span></h4>
                <p>现世于【${rf.locName}】 · 内蕴机缘：${D.ITEMS[rf.rewardItem]?.name || '古宝'}</p>
              </div>
              <button class="sleek-btn jade" data-goto="${rf.loc}" style="padding:4px 10px;font-size:10.5px;flex-shrink:0;">赶往夺宝</button>
            </div>
          `).join('')}
          ${letters.length ? `<div class="sub-cap gold">万里飞剑传书（${letters.length} 封）</div>` : ''}
          ${letters.map(lt => `
            <div class="glass-card" style="padding:6px 10px;">
              <div style="flex:1;min-width:0;">
                <h4>${lt.title} <span style="font-size:9.5px;color:var(--muted);">${lt.dateStr}</span></h4>
                <p>${lt.text}</p>
              </div>
              ${lt.locId ? `<button class="sleek-btn" data-goto="${lt.locId}" style="padding:4px 10px;font-size:10.5px;flex-shrink:0;">动身前往</button>` : ''}
            </div>
          `).join('')}
          <div class="sub-cap gold">随机众生名录（共 ${npcs.filter(x=>x.alive).length} 人在世 · 每日真实赶路与更替）</div>
          <div style="display:flex;flex-direction:column;gap:5px;">
            ${npcs.slice(0, 26).map(n => {
              const rName = D.REALMS[n.realmIdx]?.name || '炼气';
              const lName = D.LOCATIONS.find(l => l.id === n.loc)?.name || '未知海域';
              const dName = n.destLoc && D.LOCATIONS.find(l => l.id === n.destLoc)?.name;
              const moveTxt = (n.travelDaysLeft > 0 && dName) ? `正赶往【${dName}】(余${n.travelDaysLeft}日)` : `驻留【${lName}】`;
              const holdsRelic = G.worldRelic?.holder === 'npc' && G.worldRelic?.npcId === n.id;
              return `
                <div class="glass-card ${holdsRelic ? 'active' : ''}" style="padding:6px 10px;opacity:${n.alive ? 1 : 0.45};">
                  <div style="flex:1;min-width:0;">
                    <h4>${n.name} <span style="font-size:10px;color:var(--muted);">(${n.title} · ${n.persName || '散修'})</span> ${holdsRelic ? '<span class="mini-seal">怀揣轮回盘!</span>' : ''}</h4>
                    <p>${n.alive ? `${rName} · ${n.age}/${n.maxAge}岁 · ${moveTxt}` : '已于雷劫或寿尽中陨落'}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div class="sub-cap gold" style="margin-top:4px;">九大势力声望与门风</div>
          <div style="display:flex;flex-direction:column;gap:5px;">
            ${powers.map(p => `
              <div class="glass-card" style="padding:6px 10px;">
                <div><h4>${p.name} <span style="font-size:10px;color:var(--jade);">[${p.zone} · 声望 ${G.factionRep?.[p.id] || 0}]</span></h4><p>${p.desc}</p></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="dual-right">
        <div class="sec-head">
          <span>《沧溟风物邸报》编年史</span>
          <span style="font-size:10.5px;color:var(--muted);">每跨满 30 日自动推演天下变局</span>
        </div>
        <div class="gp-body">
          ${newsList.map(nw => `
            <div class="glass-card" style="padding:7px 11px;align-items:flex-start;">
              <span class="mini-set" style="flex-shrink:0;margin-top:2px;">${nw.tag || '风闻'}</span>
              <div style="flex:1;min-width:0;">
                <p style="color:var(--text);font-size:11.5px;">${nw.text}</p>
                <p style="font-size:9.5px;color:var(--muted);margin-top:2px;">${nw.dateStr || ''}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    main.querySelectorAll('[data-goto]').forEach(btn => {
      btn.onclick = () => {
        const tid = btn.dataset.goto;
        activePanel = null;
        enterLocation(tid);
      };
    });
  }
  // 6. 天命成就页（跨档永久留存 · 解锁特殊先天道体与先天气运词条）
  else if (curTab === 'ach') {
    const achSt = window.ACHIEVEMENTS ? window.ACHIEVEMENTS.loadStore() : { unlocked: [], totalPts: 15 };
    const achList = window.ACHIEVEMENTS ? window.ACHIEVEMENTS.LIST : [];
    const bodies = window.ACHIEVEMENTS ? window.ACHIEVEMENTS.DAO_BODIES : [];
    const traits = window.ACHIEVEMENTS ? window.ACHIEVEMENTS.DESTINY_TRAITS : [];
    const curBodyObj = bodies.find(b => b.id === G.daoBody) || bodies[0];

    main.innerHTML = `
      <div class="dual-left">
        <div class="sec-head">
          <span>先天道体 · 先天气运池</span>
          <span style="font-size:11px;color:var(--gold-bright);">累计天命点：<b>${achSt.totalPts}</b></span>
        </div>
        <div class="gp-body">
          <div class="glass-card active">
            <div>
              <h4>本世道体：${curBodyObj ? curBodyObj.name : '凡胎道体'}</h4>
              <p>${curBodyObj ? curBodyObj.desc : ''}</p>
            </div>
          </div>
          <div class="sub-cap gold">已解锁先天道体（开新档时自由选用）</div>
          <div style="display:flex;flex-direction:column;gap:5px;">
            ${bodies.map(b => {
              const ok = window.ACHIEVEMENTS.isBodyUnlocked(b, achSt);
              return `<div class="glass-card ${ok?'active':''}" style="padding:6px 10px;opacity:${ok?1:0.52};"><div><h4>${b.name} <span class="tier-tag t-${b.tier}">${b.tier} · ${b.cost}点</span></h4><p>${b.desc}</p></div><span style="font-size:10px;color:${ok?'var(--jade)':'var(--muted)'};flex-shrink:0;">${ok?'已解锁':'未解锁'}</span></div>`;
            }).join('')}
          </div>
          <div class="sub-cap gold" style="margin-top:4px;">先天气运词条库（共 ${traits.length} 枚）</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:5px;">
            ${traits.map(t => {
              const ok = window.ACHIEVEMENTS.isTraitUnlocked(t, achSt);
              return `<div class="glass-card ${ok?'active':''}" style="padding:6px 8px;opacity:${ok?1:0.5};"><div><h4>${t.name} <span class="tier-tag t-${t.tier}">${t.cost}点</span></h4><p>${t.desc}</p></div></div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="dual-right">
        <div class="sec-head">
          <span>天命成就录</span>
          <span style="font-size:10.5px;color:var(--jade);">已达成 ${achSt.unlocked.length} / ${achList.length} 项</span>
        </div>
        <div class="gp-body">
          ${achList.map(a => {
            const done = achSt.unlocked.includes(a.id);
            return `
              <div class="glass-card ${done?'active':''}" style="padding:8px 11px;">
                <div style="flex:1;min-width:0;">
                  <h4>${a.title} <span style="font-size:10px;color:var(--gold-bright);">[+${a.pts}点 · ${a.rewardTxt}]</span></h4>
                  <p>${a.desc}</p>
                </div>
                ${done ? `<span class="mini-set" style="flex-shrink:0;">已达成</span>` : `<span style="font-size:10px;color:var(--muted);flex-shrink:0;">待证道</span>`}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  // 6. 卷宗存档页：无立绘！左右双联（本地存档/音频设置/离线预缓存 + 存档码与传承）
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
  if (window.ACHIEVEMENTS) {
    window.ACHIEVEMENTS.checkAll(G, { D, getCatMastery, showToast });
  }
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
  const curReg = (D.REGIONS || []).find(r => r.id === currentMapRegion) || { id: 'east', name: '东洲·苍莽域', sub: '择一地标御剑前往', pairs: [] };
  const tc = document.getElementById('hud-tc');
  if (tc) {
    tc.style.display = hideHud ? 'none' : 'flex';
    tc.innerHTML = locObj
      ? `<div class="region-title">${locObj.name}</div><div class="region-sub">${locObj.desc}</div>`
      : `<div class="region-title">九州山河舆图 · ${curReg.name}</div><div class="region-sub">${curReg.sub}</div>`;
  }

  // Render 4-Continent Grand World Map or Full-Screen Scene
  const wl = document.getElementById('world-layer'); wl.innerHTML = '';
  const bl = document.getElementById('hud-bl'); bl.innerHTML = '';

  if (!inBattle && !activePanel) {
    if (!locObj) {
      const regLocs = D.LOCATIONS.filter(l => (l.region || 'east') === curReg.id);
      const byId = Object.fromEntries(regLocs.map(l => [l.id, l]));
      const lines = (curReg.pairs || []).filter(([a,b]) => byId[a] && byId[b])
        .map(([a,b]) => `<line x1="${byId[a].x}%" y1="${byId[a].y}%" x2="${byId[b].x}%" y2="${byId[b].y}%" stroke="rgba(235,210,155,0.34)" stroke-width="1" stroke-dasharray="3 4"/>`).join('');
      wl.innerHTML = `<svg id="map-lines-svg">${lines}</svg>`;

      // Bottom-Left 4-Continent Switcher Compass Bar!
      if (D.REGIONS && D.REGIONS.length > 1) {
        const regBar = document.createElement('div');
        regBar.className = 'map-region-bar';
        D.REGIONS.forEach(r => {
          const hasRift = (G.randomRifts || []).some(rf => rf.expireDay > G.totalDays && D.LOCATIONS.find(l => l.id === rf.loc)?.region === r.id);
          const hasMark = hasRift
            || (G.worldRemains && D.LOCATIONS.find(l => l.id === G.worldRemains.loc)?.region === r.id)
            || (G.nemesis && D.LOCATIONS.find(l => l.id === G.nemesis.loc)?.region === r.id)
            || (G.worldRelic?.holder === 'npc' && D.LOCATIONS.find(l => l.id === G.worldRelic.loc)?.region === r.id);
          const rb = document.createElement('button');
          rb.className = 'reg-tab' + (r.id === curReg.id ? ' active' : '') + (hasMark ? ' alert' : '');
          rb.textContent = r.name.split('(')[0] + (hasRift ? ' · 秘境' : (hasMark ? ' · 异动' : ''));
          rb.onclick = () => { SFX.play('click'); currentMapRegion = r.id; renderAll(); };
          regBar.appendChild(rb);
        });
        wl.appendChild(regBar);
      }

      const activeLocs = new Set(D.TIMELINE.filter(t => {
        if (G.month < t.month) return false;
        if (t.loc === 'sect' && (G.factions?.qingyun || 0) < 2) return true;
        if (t.loc === 'market' && (G.factions?.wanbao || 0) < 2) return true;
        if (t.loc === 'forest' && (G.flags?.forestRuinStage || 0) < 2) return true;
        if (t.loc === 'cliff' && !G.flags?.divorceResolved) return true;
        return false;
      }).map(t => t.loc));
      if (G.worldRemains?.loc) activeLocs.add(G.worldRemains.loc);
      if (G.nemesis?.loc) activeLocs.add(G.nemesis.loc);
      if (G.worldRelic?.holder === 'npc' && G.worldRelic.loc) activeLocs.add(G.worldRelic.loc);
      (G.randomRifts || []).forEach(rf => { if (rf.expireDay > G.totalDays) activeLocs.add(rf.loc); });

      const playerCurLoc = G.loc === 'map' ? 'sect' : (G.loc || 'sect');
      regLocs.forEach(loc => {
        const isHere = loc.id === playerCurLoc;
        const m = document.createElement('div');
        m.className = 'map-pin' + (activeLocs.has(loc.id) || isHere ? ' has-event' : '');
        m.style.left = loc.x + '%'; m.style.top = loc.y + '%';
        m.innerHTML = `<div class="pin-vlabel">${loc.name}${isHere ? '·驻' : ''}</div><div class="pin-dot"></div>`;
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
      const back = document.createElement('button'); back.className = 'sleek-btn ghost'; back.textContent = '← 九州舆图';
      back.onclick = () => { SFX.play('click'); if (locObj.region) currentMapRegion = locObj.region; currentLocationId = null; renderAll(); };
      bl.appendChild(back);
      locObj.hotspots.forEach(h => {
        const b = document.createElement('button'); b.className = 'sleek-btn'; b.textContent = h.label;
        b.onclick = () => handleHotspot(h.id);
        bl.appendChild(b);
      });
      // 动态展示当前正驻留在此地的随机游历修士！
      const localNpcs = window.WORLD_SIM ? window.WORLD_SIM.getLocalNpcs(G, locObj.id) : [];
      if (localNpcs.length > 0) {
        const nb = document.createElement('button');
        nb.className = 'sleek-btn';
        nb.textContent = `在场修士 (${localNpcs.length}人 · 探查/交易/夺宝)`;
        nb.onclick = () => window.WORLD_SIM.openLocalNpcsModal(getEventCtx(), locObj.id, null);
        bl.appendChild(nb);
      }
      // 动态展示当前地点刷出的限时天降随机秘境！
      const localRift = (G.randomRifts || []).find(rf => rf.loc === locObj.id && rf.expireDay > G.totalDays);
      if (localRift) {
        const rfb = document.createElement('button');
        rfb.className = 'sleek-btn jade';
        rfb.textContent = `【限时秘境】${localRift.name}（余${localRift.expireDay - G.totalDays}日）`;
        rfb.onclick = () => window.WORLD_SIM.enterLocalRandomRift(getEventCtx(), locObj.id);
        bl.appendChild(rfb);
      }
      // 若当前地点留有前世妖兽盘踞遗骸、搜身宿敌 或 怀揣造化轮回盘的具名NPC，动态显示按钮！
      const hasRemainsHere = G.worldRemains && G.worldRemains.loc === locObj.id;
      const hasNemesisHere = G.nemesis && G.nemesis.loc === locObj.id;
      const hasRelicNpcHere = G.worldRelic && G.worldRelic.holder === 'npc' && G.worldRelic.loc === locObj.id;
      if (hasRemainsHere || hasNemesisHere || hasRelicNpcHere) {
        const rb = document.createElement('button');
        rb.className = 'sleek-btn jade';
        rb.textContent = hasRemainsHere
          ? `追索前世遗骸（${G.worldRemains.beastName}盘踞）`
          : (hasNemesisHere ? `手刃前世死敌 · ${G.nemesis.name}` : `谋夺【造化轮回盘】(${G.worldRelic.npcName})`);
        rb.onclick = () => handleHotspot('reclaim_remains');
        bl.appendChild(rb);
      }
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