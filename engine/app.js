const D = window.GAME_DATA;
const ASSETS = D.ASSETS_MAP;
const IC = window.ICONS;

let G = null;
let currentLocationId = null;
let activePanel = null; // null | 'status' | 'allies' | 'save'
let statusSubTab = 'mingge'; // 'mingge' | 'skills' | 'bag'
let selectedAllyId = 'sister';
let selectedBagItem = null;
let allyExprMap = { sister: 'normal', elder: 'normal' };
let activeDialogue = null;
let battleState = null;

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
    hp: 120, maxHp: 120, qi: 80, maxQi: 80, exp: 0,
    body: 10, wit: 10, luck: 10, talk: 10, mind: 10, fame: 0,
    elements: { gold: 72, wood: 48, water: 58, fire: 42, earth: 50 },
    root: '五行灵根', talent: '残魂相伴', sect: '散修',
    age: 18, maxAge: 100, month: 1, stone: 70,
    heartArt: 'turtle_breath',
    ownedHeartArts: ['turtle_breath'],
    skills: ['basic_sword', 'evade_step', 'mind_strike'],
    artifactId: 'jade_ring',
    artifacts: { jade_ring: 1 },
    equipment: {
      weapon: { name:'青钢长剑', icon:'item_frost_sword', bonus:'攻击 +8' },
      robe: { name:'玄青道袍', icon:'item_spirit_stone', bonus:'气血 +30' },
      artifact: { name:'裂纹古玉戒', icon:'item_jade_ring', bonus:'护主剑气' },
      pendant: null,
      boots: null,
      pouch: { name:'寻常布囊', icon:'item_elixir_pill', bonus:'丹药容量 +15' }
    },
    activeAlly: null,
    bag: { heal_pill: 3, qi_pill: 2, osmanthus_cake: 2, mystery_box: 1 },
    allies: {
      sister: {
        id:'sister', name:'林清霜', seal:'青云首徒', title:'青云剑宗大师姐', bond: 30, power: 26,
        weaponName:'寒霜剑', weaponIcon:'item_frost_sword',
        elements: { gold: 85, wood: 40, water: 92, fire: 25, earth: 48 },
        exprs: [
          { key:'normal', label:'全身', asset:'sister_full' },
          { key:'smile', label:'浅笑', asset:'sister_smile' },
          { key:'fierce', label:'凌厉', asset:'sister_fierce' }
        ],
        desc:'青云剑宗首徒，外冷内热，剑法极稳。交情达 45 可邀其同行护道。'
      },
      elder: {
        id:'elder', name:'玄虚子', seal:'古玉残魂', title:'上古剑修残魂', bond: 35, power: 32,
        weaponName:'玄虚古玉', weaponIcon:'item_jade_ring',
        elements: { gold: 95, wood: 55, water: 62, fire: 78, earth: 70 },
        exprs: [
          { key:'normal', label:'淡然', asset:'elder' }
        ],
        desc:'蛰伏古玉的上古剑修残魂。交情达 45 可在战中助阵。'
      }
    },
    flags: {}
  };
}

function getAllyAsset(id, forceExpr) {
  const a = G.allies[id];
  const exKey = forceExpr || allyExprMap[id] || 'normal';
  const found = a.exprs.find(e => e.key === exKey) || a.exprs[0];
  return ASSETS[found.asset];
}
function getItemIcon(id) {
  const m = {
    heal_pill: 'item_elixir_pill', qi_pill: 'item_elixir_pill',
    osmanthus_cake: 'item_osmanthus_cake', mystery_box: 'item_spirit_stone',
    lightning_plate: 'item_lightning_disk',
    jade_ring: 'item_jade_ring', frost_embryo: 'item_frost_sword'
  };
  return ASSETS[m[id] || 'item_spirit_stone'];
}
function getDateStr() {
  const y = Math.floor((G.month - 1) / 12) + 1;
  const s = ['春','春','春','夏','夏','夏','秋','秋','秋','冬','冬','冬'][(G.month - 1) % 12];
  return `第${y}年·${s}`;
}
function getNextTimelineText() {
  const next = D.TIMELINE.find(t => t.month >= G.month);
  return next ? `${next.title}（余${next.month - G.month}月）` : '东洲风云变幻，大道可期';
}
function advanceTime(months = 1) {
  G.month += months;
  if (G.month % 12 === 1) G.age += 1;
  if (G.age >= G.maxAge) {
    activeDialogue = {
      speaker: '岁月无情', asset: ASSETS.hero,
      text: `光阴荏苒，你的寿元已届 ${G.maxAge} 岁大限。一生游历东洲、广结道友，亦算无憾此生。`,
      choices: [{ text:'重入轮回，再续仙途', action: () => startQuiz() }]
    };
  }
}
function gainExp(amt) {
  const ha = D.HEART_ARTS[G.heartArt] || { expBonus: 0 };
  const bonus = Math.floor(amt * (1 + G.wit * 0.03 + (ha.expBonus || 0)));
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
  const ha = D.HEART_ARTS[G.heartArt] || {};
  G.maxHp = next.maxHp + G.body * 4 + (ha.hpBonus || 0);
  G.maxQi = next.maxQi + G.wit * 3;
  G.hp = G.maxHp; G.qi = G.maxQi; G.maxAge += next.ageBonus;
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
  G = defaultState();
  currentLocationId = null; activePanel = null; activeDialogue = null; battleState = null;
  let step = 0;
  const root = document.getElementById('title-root');
  root.style.display = 'flex';
  root.style.backgroundImage = `url("${ASSETS.world_map}")`;

  function renderStep() {
    if (step === 0 && !G._introDone) {
      root.innerHTML = `
        <div class="title-box">
          <h1 class="title-main">青云问道录</h1>
          <p class="title-sub">东洲修仙志 · 电影写实半透明独立版</p>
          <p style="font-size:13px;line-height:1.78;color:#dfd6c6;margin:0 0 18px;">
            天地灵气潮汐将至，东洲各大宗门广收门徒，鬼市暗流涌动，古修洞府接连现世。<br>
            你本是一介凡尘少年，机缘巧合得一枚微光古玉，自此踏入修真界。<br>
            是拜入名门以剑问道，还是在坊市与秘境边缘左右逢源，皆由你自己抉择。
          </p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button class="sleek-btn" id="btn-new">测灵根 · 踏入仙途</button>
            <button class="sleek-btn ghost" id="btn-load-auto">续读旧档</button>
          </div>
        </div>
      `;
      document.getElementById('btn-new').onclick = () => { SFX.play('click'); G._introDone = true; renderStep(); };
      document.getElementById('btn-load-auto').onclick = () => {
        SFX.play('click');
        if (loadGame('auto')) { root.style.display = 'none'; renderAll(); }
        else showToast('尚无旧档，请先开启新途。');
      };
      return;
    }

    if (step < D.QUIZ.length) {
      const q = D.QUIZ[step];
      root.innerHTML = `
        <div class="title-box">
          <h2 class="title-main" style="font-size:18px;letter-spacing:3px;">问道初测 · 第 ${step+1} 问</h2>
          <p style="font-size:13.5px;line-height:1.72;color:#f0ebe1;margin:10px 0 14px;">${q.q}</p>
          <div id="q-opts"></div>
        </div>
      `;
      const box = document.getElementById('q-opts');
      q.opts.forEach(o => {
        const b = document.createElement('button'); b.className = 'quiz-btn'; b.textContent = o.t;
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
          <h2 class="title-main" style="font-size:19px;letter-spacing:3px;">命格已定 · 启程东洲</h2>
          <p style="font-size:13px;line-height:1.8;color:#dfd6c6;margin:10px 0 14px;">
            <b style="color:#ebd29b;">灵根资质：</b>${G.root} &nbsp;&nbsp;|&nbsp;&nbsp; <b style="color:#ebd29b;">初始命格：</b>${G.talent}<br>
            <b style="color:#ebd29b;">六维初始：</b>根骨 ${G.body} · 悟性 ${G.wit} · 气运 ${G.luck} · 口才 ${G.talk} · 道心 ${G.mind}
          </p>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span style="font-size:12.5px;color:var(--muted);">道号：</span>
            <input id="inp-name" value="${G.name}" maxlength="8" style="background:rgba(8,10,12,0.85);border:1px solid var(--gold);color:#ebd29b;padding:7px 12px;font-family:inherit;font-size:13px;" />
            <button class="sleek-btn" id="btn-enter">踏入青云界</button>
          </div>
        </div>
      `;
      document.getElementById('btn-enter').onclick = () => {
        const val = document.getElementById('inp-name').value.trim();
        if (val) G.name = val;
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
          G.sect = '青云剑宗'; G.allies.sister.bond += 15; G.fame += 10;
          if (!G.ownedHeartArts.includes('qingyun_breath')) G.ownedHeartArts.push('qingyun_breath');
          if (!G.skills.includes('sister_frost')) G.skills.push('sister_frost');
          G.artifacts.frost_embryo = 1; G.artifactId = 'frost_embryo';
          allyExprMap.sister = 'smile';
          activeDialogue = {
            speaker: '林清霜', asset: ASSETS.sister_smile,
            text: '她微微颔首，唇角露出一丝难得的浅笑：“既入青云门下，日后便是我师弟了。这柄寒霜剑胚与吐纳心法，你且收好。”',
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
  renderAll();
}

function handleHotspot(hid) {
  SFX.play('click');
  if (hid === 'sect_library') {
    advanceTime(1); const g = gainExp(48); G.wit += 1;
    showToast(`在藏经阁静心研读一月，修为 +${g}，悟性 +1。`);
    saveGame('auto', true); renderAll();
  } else if (hid === 'sect_forge') {
    activePanel = 'status'; statusSubTab = 'skills'; renderAll();
  } else if (hid === 'cliff_event') {
    if (!G.flags.divorceEvent) {
      activeDialogue = {
        speaker: '柳若云', asset: ASSETS.sister,
        text: '石桌旁站着一名锦衣女修，将一纸泛黄婚书置于青石之上：“陈公子，昔年祖辈之约已成过往。如今我已入玄天宗内门，仙凡殊途，今日特来解除婚约。”',
        choices: [
          { text:'当场撕毁婚书，立下三年之约', hint:'道心+5 声望+15 修为+60', action: () => {
            G.flags.divorceEvent = true; G.mind += 5; G.fame += 15; const g = gainExp(60);
            showToast(`立下三年之约，修为 +${g}，道心 +5。`); activeDialogue = null; saveGame('auto', true); renderAll();
          }},
          { text:'“按两家旧约折算一百灵石立据画押，从此两不相欠。”', hint:'灵石+100 口才+2', action: () => {
            G.flags.divorceEvent = true; G.stone += 100; G.talk += 2;
            showToast('双方立据画押，获补偿灵石 100 枚。'); activeDialogue = null; saveGame('auto', true); renderAll();
          }},
          { text:'“柳家既要毁约，先问过我手中之剑。”', hint:'触发战斗', action: () => {
            G.flags.divorceEvent = true; G.fame += 10;
            startBattle({ name:'柳家护卫统领', asset:ASSETS.elder, bg:'world_map', hp:140, maxHp:140, atk:16, talkDef:10, expReward:60, stoneReward:65 });
          }}
        ]
      };
    } else showToast('石桌上只余几片落叶，当年旧约已了结。');
    renderAll();
  } else if (hid === 'inn_tea') {
    if (G.stone < 10) return showToast('囊中灵石不足 10 枚。');
    advanceTime(1); G.stone -= 10; G.hp = G.maxHp; G.qi = G.maxQi; G.wit += 1;
    showToast('在天机阁品茶歇息，气血灵力圆满，悟性 +1。');
    saveGame('auto', true); renderAll();
  } else if (hid === 'inn_rumor') {
    activeDialogue = {
      speaker: '天机掌柜', asset: ASSETS.elder,
      text: '掌柜擦着青瓷茶壶低声道：“近来万妖古林洞府异动，反倒有精明散修在谷口卖回春丹赚得盆满钵满。对了，听说青云大师姐私下偏爱云州桂花糕。”',
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
        { text:'购入【古修遗匣】', hint:'30 灵石', action: () => buyItem('mystery_box') },
        { text:'购入【避雷引灵阵盘】', hint:'80 灵石', action: () => buyItem('lightning_plate') },
        { text:'离开摊位', action: () => { activeDialogue = null; renderAll(); } }
      ]
    };
    renderAll();
  } else if (hid === 'market_trade') {
    advanceTime(1); const earn = 35 + Math.floor(G.talk * 1.6); G.stone += earn; G.talk += 1;
    showToast(`凭借眼力做成一笔鉴宝买卖，净赚 ${earn} 灵石，口才 +1。`);
    saveGame('auto', true); renderAll();
  } else if (hid === 'forest_stall') {
    advanceTime(1); G.stone += 75; G.luck += 1;
    showToast('在古林谷口设摊售药，半日售罄，净赚 75 灵石，气运 +1。');
    saveGame('auto', true); renderAll();
  } else if (hid === 'forest_ruin') {
    startBattle({ name:'护洞赤瞳妖狼', asset:ASSETS.wolf_boss, bg:'forest', hp:175, maxHp:175, atk:20, talkDef:12, expReward:90, stoneReward:60 });
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

// Combat
function startBattle(enemy) {
  battleState = {
    enemy: { ...enemy }, shield: 0, stunned: false, artifactUsed: false,
    ticker: `迎战【${enemy.name}】！${G.activeAlly ? `道友【${G.allies[G.activeAlly].name}】随行助阵！` : ''}`
  };
  activeDialogue = null; activePanel = null; renderAll();
}
function spawnDmg(sel, text) {
  const slot = document.querySelector(sel);
  if (!slot) return;
  const el = document.createElement('div'); el.className = 'dmg-float'; el.textContent = text;
  slot.appendChild(el);
  const img = slot.querySelector('img');
  if (img) { img.classList.remove('hit-flash'); void img.offsetWidth; img.classList.add('hit-flash'); }
  setTimeout(() => el.remove(), 900);
}
function useArtifactInBattle() {
  if (!battleState || battleState.artifactUsed) return showToast('本场战斗已祭出过本命法宝。');
  const art = D.ARTIFACTS[G.artifactId]; const lv = G.artifacts[G.artifactId] || 1;
  const dmg = Math.floor(art.baseDmg * (1 + (lv - 1) * 0.35));
  battleState.artifactUsed = true;
  if (art.shield) battleState.shield += art.shield * lv;
  battleState.enemy.hp = Math.max(0, battleState.enemy.hp - dmg);
  SFX.play('thunder'); FX.slash('#82d2ff', 0.72, 0.45); FX.burst('130,210,255', 30, 0.72, 0.45); triggerShake();
  battleState.ticker = `祭出本命法宝【${art.name} +${lv}】，重创敌手 ${dmg} 点！`;
  finishBattleTurn(dmg);
}
function useBattleSkill(skillId) {
  if (!battleState) return;
  const sk = D.SKILLS[skillId]; const e = battleState.enemy;
  if (G.qi < sk.cost) return showToast('灵力不足。');
  if (sk.stoneCost && G.stone < sk.stoneCost) return showToast(`灵石不足 ${sk.stoneCost}。`);
  G.qi -= sk.cost; if (sk.stoneCost) G.stone -= sk.stoneCost;
  const ha = D.HEART_ARTS[G.heartArt] || {};
  let dmg = Math.floor((G.body * 2.2 + G.wit * 1.4 + (ha.atkBonus || 0)) * sk.power);
  if (sk.talkScale) {
    dmg = Math.floor(G.talk * sk.talkScale + Math.random() * 12);
    if (e.talkDef > 100) dmg = 5;
    else if (sk.stun && Math.random() < 0.6) battleState.stunned = true;
  }
  if (sk.shield) battleState.shield += sk.shield;
  let allyMsg = '';
  if (G.activeAlly && e.hp - dmg > 0) {
    const ally = G.allies[G.activeAlly];
    const ad = Math.floor(ally.power * (0.85 + Math.random() * 0.3));
    dmg += ad; allyMsg = `（${ally.name}合击 +${ad}）`;
  }
  e.hp = Math.max(0, e.hp - dmg);
  SFX.play(sk.id === 'grandpa_finger' ? 'thunder' : 'sword');
  FX.slash(sk.id === 'sister_frost' ? '#82d2ff' : '#ebd29b', 0.72, 0.45);
  FX.burst(sk.id === 'sister_frost' ? '130,210,255' : '235,210,155', 24, 0.72, 0.45);
  triggerShake();
  battleState.ticker = `施展【${sk.name}】，对 ${e.name} 造成 ${dmg} 点伤害${allyMsg}。`;
  finishBattleTurn(dmg);
}
function finishBattleTurn(heroDmg) {
  const e = battleState.enemy;
  if (e.hp <= 0) {
    const wonTrib = e.isTribulation;
    const expG = e.expReward ? gainExp(e.expReward) : 0;
    G.stone += e.stoneReward || 0; G.fame += 5; battleState = null;
    if (wonTrib) tryRealmUp(true);
    else { SFX.play('levelup'); showToast(`得胜！修为 +${expG}，灵石 +${e.stoneReward}。`); }
    saveGame('auto', true); renderAll(); return;
  }
  let eDmg = 0;
  if (battleState.stunned) { battleState.stunned = false; battleState.ticker += ` ${e.name} 心神失守，错失反击！`; }
  else {
    const ha = D.HEART_ARTS[G.heartArt] || {};
    eDmg = Math.max(4, e.atk - Math.floor(G.body * 0.35) - (ha.defBonus || 0) + Math.floor(Math.random()*6));
    if (battleState.shield > 0) { const ab = Math.min(battleState.shield, eDmg); battleState.shield -= ab; eDmg -= ab; }
    G.hp = Math.max(0, G.hp - eDmg);
    battleState.ticker += ` ${e.name} 反击造成 ${eDmg} 点伤害。`;
  }
  if (G.hp <= 0) { G.hp = Math.floor(G.maxHp * 0.5); G.qi = Math.floor(G.maxQi * 0.5); battleState = null; showToast('力竭败退，幸得古玉残魂护持脱身。'); }
  renderAll();
  if (battleState) {
    spawnDmg('.c-actor.enemy', `-${heroDmg}`);
    if (eDmg > 0) setTimeout(() => spawnDmg('.c-actor.hero', `-${eDmg}`), 220);
  }
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
    G = JSON.parse(raw).data; battleState = null; activeDialogue = null; activePanel = null;
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
    G = JSON.parse(decodeURIComponent(escape(atob(box.value.trim()))));
    battleState = null; activeDialogue = null; activePanel = null; saveGame('auto', true);
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

  // 1. 命格页：左侧完整全身像 + 右侧属性面板
  if (curTab === 'mingge') {
    const art = D.ARTIFACTS[G.artifactId]; const lv = G.artifacts[G.artifactId] || 1;
    main.innerHTML = `
      <div class="fullbody-col">
        <div class="fullbody-wrap">
          <img class="full-char" src="${ASSETS.hero_full}" />
          <div class="dantian-waist"></div>
          <div class="lifespan-ring">寿元 ${G.age} / ${G.maxAge} 岁</div>
        </div>
      </div>
      <div class="glass-panel" style="width:55%;max-width:560px;">
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
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;font-size:11.5px;">
            <div class="glass-card" style="padding:6px 10px;"><span>根骨</span><b style="color:#ebd29b;">${G.body}</b></div>
            <div class="glass-card" style="padding:6px 10px;"><span>悟性</span><b style="color:#ebd29b;">${G.wit}</b></div>
            <div class="glass-card" style="padding:6px 10px;"><span>气运</span><b style="color:#ebd29b;">${G.luck}</b></div>
            <div class="glass-card" style="padding:6px 10px;"><span>口才</span><b style="color:#ebd29b;">${G.talk}</b></div>
            <div class="glass-card" style="padding:6px 10px;"><span>道心</span><b style="color:#ebd29b;">${G.mind}</b></div>
            <div class="glass-card" style="padding:6px 10px;"><span>声望</span><b style="color:#ebd29b;">${G.fame}</b></div>
          </div>
          <div class="glass-card">
            <div><h4>修为进度（${G.exp} / ${realm.exp}）</h4><p>气血 ${G.hp}/${G.maxHp} · 灵力 ${G.qi}/${G.maxQi} · 本命法宝：${art.name}+${lv}</p></div>
            <button class="sleek-btn" id="btn-med">静室吐纳 (+1月)</button>
          </div>
        </div>
      </div>
    `;
    main.querySelector('#btn-med').onclick = () => {
      SFX.play('click'); advanceTime(1); G.hp = G.maxHp; G.qi = G.maxQi;
      const g = gainExp(38); showToast(`静修一月，状态圆满，修为 +${g}。`);
      saveGame('auto', true); renderAll();
    };
  }
  // 2. 行囊装备页：无立绘！左侧身上穿戴装备格 + 右侧完整背包大格子
  else if (curTab === 'bag') {
    const eq = G.equipment || defaultState().equipment;
    const art = D.ARTIFACTS[G.artifactId]; const lv = G.artifacts[G.artifactId] || 1;
    eq.artifact = { name:`${art.name} +${lv}`, icon: G.artifactId==='frost_embryo'?'item_frost_sword':'item_jade_ring', bonus:`威力 ${Math.floor(art.baseDmg*(1+(lv-1)*0.35))}` };

    const eqDefs = [
      { k:'weapon', l:'佩剑 / 兵器' },
      { k:'robe', l:'道袍 / 护甲' },
      { k:'artifact', l:'本命法宝' },
      { k:'pendant', l:'随身玉佩' },
      { k:'boots', l:'身法灵靴' },
      { k:'pouch', l:'丹药储物囊' }
    ];
    const eqHtml = eqDefs.map(d => {
      const it = eq[d.k];
      return `
        <div class="equip-slot ${it?'filled':''}">
          ${it ? `<img src="${ASSETS[it.icon]}"/>` : `<div class="eq-empty">空</div>`}
          <div>
            <div class="eq-type">${d.l}</div>
            <div class="eq-name">${it ? it.name : '未穿戴'}</div>
            ${it ? `<div style="font-size:10px;color:#6fd3a8;">${it.bonus}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    const owned = Object.entries(G.bag).filter(([,c]) => c > 0);
    if (!selectedBagItem || !G.bag[selectedBagItem]) {
      selectedBagItem = owned.length ? owned[0][0] : null;
    }

    main.innerHTML = `
      <div class="dual-left">
        <div class="sec-head"><span>身上穿戴</span><span style="font-size:10.5px;color:var(--muted);">已装配槽位</span></div>
        <div class="equip-grid">${eqHtml}</div>
        <div style="margin-top:auto;padding-top:8px;border-top:1px solid var(--gold-hair);font-size:11px;color:var(--muted);display:flex;justify-content:space-between;">
          <span>当前攻击加成：+${8 + (lv-1)*6}</span><span>防御减伤：+${(D.HEART_ARTS[G.heartArt]?.defBonus||0)}</span>
        </div>
      </div>
      <div class="dual-right">
        <div class="sec-head"><span>乾坤行囊</span><span style="font-size:10.5px;color:var(--muted);">${owned.length} / 15 格</span></div>
        <div class="bag-grid-5" id="bag-grid-5"></div>
        <div class="bag-detail" id="bag-detail"></div>
      </div>
    `;

    const grid = main.querySelector('#bag-grid-5');
    for (let i = 0; i < 15; i++) {
      const cell = document.createElement('div');
      if (i < owned.length) {
        const [id, cnt] = owned[i];
        const it = D.ITEMS[id];
        cell.className = 'bag-cell has-item' + (selectedBagItem === id ? ' selected' : '');
        cell.innerHTML = `<img src="${getItemIcon(id)}"/><span class="b-cnt">×${cnt}</span>`;
        cell.onclick = () => { SFX.play('click'); selectedBagItem = id; renderAll(); };
      } else {
        cell.className = 'bag-cell';
      }
      grid.appendChild(cell);
    }

    const det = main.querySelector('#bag-detail');
    if (selectedBagItem && D.ITEMS[selectedBagItem]) {
      const it = D.ITEMS[selectedBagItem];
      det.innerHTML = `
        <div>
          <div style="font-size:13px;color:#ebd29b;font-weight:600;">${it.name} <span style="font-size:11px;color:var(--muted);">×${G.bag[selectedBagItem]}</span></div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px;">${it.desc}</div>
        </div>
        ${(it.type==='consumable'||it.type==='box') ? `<button class="sleek-btn" id="bag-use">使用</button>` : `<span style="font-size:11px;color:var(--muted);">特定场合使用</span>`}
      `;
      const ub = det.querySelector('#bag-use');
      if (ub) ub.onclick = () => {
        G.bag[selectedBagItem]--;
        if (it.hp) G.hp = Math.min(G.maxHp, G.hp + it.hp);
        if (it.qi) G.qi = Math.min(G.maxQi, G.qi + it.qi);
        if (it.type === 'box') { G.stone += 55; showToast('启封遗匣，得 55 灵石。'); }
        else showToast(`使用了【${it.name}】。`);
        saveGame('auto', true); renderAll();
      };
    } else {
      det.innerHTML = '<span style="font-size:11.5px;color:var(--muted);">行囊空空如也，可前往鬼市黑坊购置丹药奇物。</span>';
    }
  }
  // 3. 功法法宝页：无立绘！左侧当前装配与祭炼台 + 右侧功法典籍库
  else if (curTab === 'skills') {
    const art = D.ARTIFACTS[G.artifactId]; const lv = G.artifacts[G.artifactId] || 1; const cost = lv * 35;
    const curHa = D.HEART_ARTS[G.heartArt];
    main.innerHTML = `
      <div class="dual-left">
        <div class="sec-head"><span>本命祭炼与当前装配</span><span style="font-size:10.5px;color:var(--muted);">战前整备</span></div>
        <div class="gp-body">
          <div class="glass-card active">
            <div style="display:flex;gap:10px;align-items:center;">
              <img src="${getItemIcon(G.artifactId)}" style="width:42px;height:42px;object-fit:contain;"/>
              <div><h4>${art.name} (+${lv}阶)</h4><p>${art.desc}</p></div>
            </div>
          </div>
          <button class="sleek-btn" id="btn-ref" style="width:100%;">祭炼本命法宝（消耗 ${cost} 灵石）</button>
          <div style="font-size:11px;color:var(--muted);margin-top:4px;">当前主修心法</div>
          <div class="glass-card active"><div><h4>${curHa.name}</h4><p>${curHa.desc}</p></div></div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px;">出战神通槽（最多 3 门）</div>
          <div style="display:flex;flex-direction:column;gap:5px;">
            ${G.skills.slice(0,3).map((sid,idx)=>`<div class="glass-card" style="padding:6px 10px;"><span>槽位${idx+1} · <b style="color:#ebd29b;">${D.SKILLS[sid].name}</b></span><span style="font-size:10.5px;color:var(--muted);">灵力 ${D.SKILLS[sid].cost}</span></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="dual-right">
        <div class="sec-head"><span>已习得心法与神通典籍</span><span style="font-size:10.5px;color:var(--muted);">点击切换主修</span></div>
        <div class="gp-body">
          <div style="font-size:11px;color:#ebd29b;">心法典籍</div>
          <div id="ha-wrap" style="display:flex;flex-direction:column;gap:6px;"></div>
          <div style="font-size:11px;color:#ebd29b;margin-top:6px;">全部已学神通</div>
          <div id="sk-wrap" style="display:flex;flex-direction:column;gap:6px;"></div>
        </div>
      </div>
    `;
    main.querySelector('#btn-ref').onclick = () => {
      if (G.stone < cost) return showToast(`灵石不足 ${cost} 枚。`);
      G.stone -= cost; G.artifacts[G.artifactId] = lv + 1;
      SFX.play('levelup'); showToast(`${art.name} 祭炼至 +${lv+1} 阶！`);
      saveGame('auto', true); renderAll();
    };
    const hw = main.querySelector('#ha-wrap');
    G.ownedHeartArts.forEach(hid => {
      const ha = D.HEART_ARTS[hid];
      const c = document.createElement('div'); c.className = 'glass-card' + (G.heartArt===hid?' active':'');
      c.style.cursor = 'pointer';
      c.innerHTML = `<div><h4>${ha.name} ${G.heartArt===hid?'[主修中]':''}</h4><p>${ha.desc}</p></div>`;
      c.onclick = () => { G.heartArt = hid; SFX.play('click'); showToast(`切换主修心法：${ha.name}`); renderAll(); };
      hw.appendChild(c);
    });
    const sw = main.querySelector('#sk-wrap');
    G.skills.forEach(sid => {
      const s = D.SKILLS[sid];
      const c = document.createElement('div'); c.className = 'glass-card';
      c.innerHTML = `<div><h4>${s.name}</h4><p>${s.desc}</p></div><span style="font-size:11px;color:#ebd29b;flex-shrink:0;">灵力${s.cost}</span>`;
      sw.appendChild(c);
    });
  }
  // 4. 伙伴页：左侧完整全身像/表情差分 + 右侧伙伴交互面板
  else if (curTab === 'allies') {
    const a = G.allies[selectedAllyId];
    const isAct = G.activeAlly === a.id;
    const exprHtml = a.exprs.map(ex => `
      <div class="expr-thumb ${(allyExprMap[a.id]||'normal')===ex.key?'active':''}" data-ex="${ex.key}">
        <img src="${ASSETS[ex.asset]}" /><span>${ex.label}</span>
      </div>
    `).join('');

    main.innerHTML = `
      <div class="fullbody-col">
        <div class="fullbody-wrap">
          <img class="full-char" src="${getAllyAsset(a.id)}" />
          <div class="expr-strip">${exprHtml}</div>
        </div>
      </div>
      <div class="glass-panel" style="width:55%;max-width:560px;">
        <div class="gp-tabs">
          <button class="gp-tab ${selectedAllyId==='sister'?'active':''}" data-ally="sister">林清霜</button>
          <button class="gp-tab ${selectedAllyId==='elder'?'active':''}" data-ally="elder">玄虚子</button>
        </div>
        <div class="gp-body">
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="vermilion-seal">${a.seal}</span>
            <div style="flex:1;">
              <div style="font-size:21px;font-weight:700;color:#ebd29b;letter-spacing:3px;">${a.name}</div>
              <div style="font-size:11.5px;color:var(--muted);">${a.title}${isAct ? ' · 当前同行中' : ''}</div>
              <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--muted);margin-top:6px;">
                <span>道友羁绊</span><b style="color:#ebd29b;">${a.bond} / 100</b>
              </div>
              <div class="bond-bar"><div class="bond-fill" style="width:${Math.min(100,a.bond)}%"></div></div>
            </div>
          </div>
          <div class="radar-wrap">
            ${buildRadarSvg(a.elements)}
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
              <span style="font-size:11px;color:var(--muted);">随身佩剑 / 法器</span>
              <div class="item-slot featured" style="width:74px;height:74px;">
                <img src="${ASSETS[a.weaponIcon]}" /><span class="s-lbl">${a.weaponName}</span>
              </div>
            </div>
          </div>
          <p style="font-size:12px;color:var(--muted);line-height:1.6;margin:0;">${a.desc}</p>
          <div class="ally-actions">
            <button class="sleek-btn ghost" id="al-talk">交谈</button>
            <button class="sleek-btn ghost" id="al-gift">赠礼</button>
            <button class="sleek-btn ghost" id="al-spar">切磋</button>
            <button class="sleek-btn" id="al-join">${isAct ? '暂离' : '同行'}</button>
          </div>
        </div>
      </div>
    `;
    main.querySelectorAll('[data-ally]').forEach(b => { b.onclick = () => { SFX.play('click'); selectedAllyId = b.dataset.ally; renderAll(); }; });
    main.querySelectorAll('[data-ex]').forEach(t => { t.onclick = () => { SFX.play('click'); allyExprMap[a.id] = t.dataset.ex; renderAll(); }; });
    main.querySelector('#al-talk').onclick = () => { activePanel = null; interactNpc(a.id); };
    main.querySelector('#al-gift').onclick = () => {
      if ((G.bag.osmanthus_cake || 0) <= 0) return showToast('行囊中暂无【云州桂花糕】，可去天机阁购置。');
      G.bag.osmanthus_cake--; a.bond += 20;
      if (a.id === 'sister') allyExprMap.sister = 'smile';
      SFX.play('levelup'); showToast(`赠予【云州桂花糕】，${a.name}展颜浅笑，羁绊 +20！`);
      saveGame('auto', true); renderAll();
    };
    main.querySelector('#al-spar').onclick = () => {
      if (a.id === 'sister') allyExprMap.sister = 'fierce';
      startBattle({ name:`${a.name}（切磋）`, asset:getAllyAsset(a.id, a.id==='sister'?'fierce':'normal'), bg:'bamboo', hp:165, maxHp:165, atk:19, talkDef:20, expReward:70, stoneReward:30 });
    };
    main.querySelector('#al-join').onclick = () => {
      if (a.bond < 45 && !isAct) return showToast(`需羁绊达到 45 方可邀${a.name}同行（当前 ${a.bond}）。`);
      G.activeAlly = isAct ? null : a.id; SFX.play('click');
      showToast(G.activeAlly ? `${a.name}已加入同行队伍。` : `${a.name}已暂离队伍。`);
      renderAll();
    };
  }
  // 5. 卷宗存档页：无立绘！左右双联存档与设置面板
  else if (curTab === 'save') {
    main.innerHTML = `
      <div class="dual-left">
        <div class="sec-head"><span>本地离线卷宗</span></div>
        <div style="display:flex;flex-direction:column;gap:9px;">
          <div class="glass-card"><div><h4>卷宗一</h4><p>手动独立存档位</p></div><div style="display:flex;gap:6px;"><button class="sleek-btn" onclick="saveGame('1')">存入</button><button class="sleek-btn ghost" onclick="if(loadGame('1')) renderAll(); else showToast('卷宗一为空。');">读取</button></div></div>
          <div class="glass-card"><div><h4>卷宗二</h4><p>手动独立存档位</p></div><div style="display:flex;gap:6px;"><button class="sleek-btn" onclick="saveGame('2')">存入</button><button class="sleek-btn ghost" onclick="if(loadGame('2')) renderAll(); else showToast('卷宗二为空。');">读取</button></div></div>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button class="sleek-btn ghost" id="sv-sfx">${SFX.enabled?'音效：开启':'音效：静音'}</button>
            <button class="sleek-btn ghost" onclick="startQuiz()">重入轮回（新局）</button>
          </div>
        </div>
      </div>
      <div class="dual-right">
        <div class="sec-head"><span>防丢档存档码</span><span style="font-size:10.5px;color:var(--muted);">跨版本通用</span></div>
        <p style="font-size:11.5px;color:var(--muted);margin:0 0 8px;">更新游戏版本或更换设备前，可导出下方存档码备份，随时粘贴恢复进度。</p>
        <textarea id="save-code-box" rows="4" style="width:100%;background:rgba(5,7,9,0.75);border:1px solid var(--gold-hair);color:var(--text);padding:8px;font-size:11px;margin-bottom:10px;"></textarea>
        <div style="display:flex;gap:10px;">
          <button class="sleek-btn" onclick="exportSaveCode()">导出当前存档码</button>
          <button class="sleek-btn ghost" onclick="importSaveCode()">导入存档码</button>
        </div>
      </div>
    `;
    main.querySelector('#sv-sfx').onclick = () => { SFX.enabled = !SFX.enabled; renderAll(); };
  }

  host.appendChild(sc);
}

function renderAll() {
  if (!G) return;
  const realm = D.REALMS[G.realmIdx];
  document.getElementById('hud-realm-txt').textContent = `境界 · ${realm.name}`;
  document.getElementById('hud-date').textContent = getDateStr();
  document.getElementById('hud-stone').textContent = G.stone;
  document.getElementById('hud-age').textContent = `${G.age}/${G.maxAge}岁`;
  document.getElementById('hud-timeline').textContent = getNextTimelineText();

  // Update Dual-Arc SVG HP/Qi ring
  const hpPct = Math.max(0, Math.min(1, G.hp / G.maxHp));
  const qiPct = Math.max(0, Math.min(1, G.qi / G.maxQi));
  document.getElementById('arc-hp').setAttribute('stroke-dashoffset', String(92 * (1 - hpPct)));
  document.getElementById('arc-qi').setAttribute('stroke-dashoffset', String(92 * (1 - qiPct)));

  const locObj = D.LOCATIONS.find(l => l.id === currentLocationId);
  const bgKey = battleState ? battleState.enemy.bg : (locObj ? locObj.sceneBg : 'world_map');
  document.getElementById('world-viewport').style.backgroundImage = `url("${ASSETS[bgKey] || ASSETS.world_map}")`;

  const hideHud = Boolean(battleState || activeDialogue || activePanel);
  document.getElementById('hud-tl').style.display = hideHud ? 'none' : 'flex';
  document.getElementById('hud-tr').style.display = hideHud ? 'none' : 'flex';
  document.getElementById('hud-br').style.display = hideHud ? 'none' : 'flex';
  document.getElementById('hud-bl').style.display = (hideHud || !locObj) ? 'none' : 'flex';

  // Render World Map or Full-Screen Scene
  const wl = document.getElementById('world-layer'); wl.innerHTML = '';
  const bl = document.getElementById('hud-bl'); bl.innerHTML = '';

  if (!battleState && !activePanel) {
    if (!locObj) {
      // Constellation travel lines SVG
      const pairs = [['sect','inn'], ['sect','cliff'], ['cliff','market'], ['inn','market'], ['inn','altar'], ['market','forest'], ['forest','altar']];
      const byId = Object.fromEntries(D.LOCATIONS.map(l => [l.id, l]));
      const lines = pairs.map(([a,b]) => `<line x1="${byId[a].x}%" y1="${byId[a].y}%" x2="${byId[b].x}%" y2="${byId[b].y}%" stroke="rgba(235,210,155,0.32)" stroke-width="1" stroke-dasharray="3 4"/>`).join('');
      wl.innerHTML = `<svg id="map-lines-svg">${lines}</svg>`;
      D.LOCATIONS.forEach(loc => {
        const m = document.createElement('div'); m.className = 'map-pin';
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

  // Render Dialogue
  const dl = document.getElementById('dialogue-root'); dl.innerHTML = '';
  if (activeDialogue && !battleState) {
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

  // Render Combat
  const cl = document.getElementById('combat-root'); cl.innerHTML = '';
  if (battleState) {
    const e = battleState.enemy;
    const allyHtml = G.activeAlly ? `<div class="c-actor ally"><img src="${getAllyAsset(G.activeAlly, G.activeAlly==='sister'?'fierce':'normal')}" /></div>` : '';
    const cb = document.createElement('div'); cb.className = 'combat-layer';
    cb.innerHTML = `
      <div class="combat-top">
        <div class="c-side">
          <div class="c-head"><span>${G.name}${G.activeAlly ? ' · ' + G.allies[G.activeAlly].name : ''}</span><span style="color:#6fd3a8;">灵盾 ${battleState.shield}</span></div>
          <div class="c-track"><div class="c-fill-hp" style="width:${(G.hp/G.maxHp)*100}%"></div></div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px;">气血 ${G.hp}/${G.maxHp} · 灵力 ${G.qi}/${G.maxQi}</div>
        </div>
        <div class="c-vs">斗法</div>
        <div class="c-side">
          <div class="c-head"><span style="color:#ff9494;">${e.name}</span><span>${e.hp}/${e.maxHp}</span></div>
          <div class="c-track"><div class="c-fill-hp" style="width:${(e.hp/e.maxHp)*100}%"></div></div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px;text-align:right;">攻势 ~${e.atk}</div>
        </div>
      </div>
      <div class="combat-stage">
        <div class="c-party">
          <div class="c-actor hero"><img src="${ASSETS.hero}" /></div>
          ${allyHtml}
        </div>
        <div class="c-actor enemy"><img src="${e.asset || ASSETS.wolf_boss}" /></div>
      </div>
      <div class="combat-bottom">
        <div class="combat-ticker">${battleState.ticker}</div>
        <div class="talisman-bar" id="talisman-bar"></div>
      </div>
    `;
    const tb = cb.querySelector('#talisman-bar');
    G.skills.slice(0, 3).forEach(sid => {
      const sk = D.SKILLS[sid];
      const b = document.createElement('button'); b.className = 'talisman-btn';
      b.innerHTML = `<span class="t-name">${sk.name}</span><span class="t-sub">灵力 ${sk.cost}</span>`;
      b.onclick = () => useBattleSkill(sid);
      tb.appendChild(b);
    });
    const art = D.ARTIFACTS[G.artifactId];
    const ab = document.createElement('button'); ab.className = 'talisman-btn artifact';
    ab.innerHTML = `<span class="t-name">祭 · ${art.name}</span><span class="t-sub">${battleState.artifactUsed?'已祭出':'本命法宝'}</span>`;
    ab.onclick = () => useArtifactInBattle();
    tb.appendChild(ab);
    const fb = document.createElement('button'); fb.className = 'talisman-btn';
    fb.style.color = 'var(--muted)';
    fb.innerHTML = `<span class="t-name">遁走</span><span class="t-sub">暂避锋芒</span>`;
    fb.onclick = () => { battleState = null; showToast('借地形遁走脱身。'); renderAll(); };
    tb.appendChild(fb);
    cl.appendChild(cb);
  }

  renderSplitPanel();
}

function initHud() {
  document.getElementById('hud-tl').onclick = () => { SFX.play('click'); activePanel = 'status'; statusSubTab = 'mingge'; renderAll(); };
  const dock = document.getElementById('hud-br');
  const btns = [
    { label:'舆图', icon:'map', fn:()=>{ currentLocationId=null; activePanel=null; renderAll(); } },
    { label:'命格', icon:'char', fn:()=>{ activePanel='status'; statusSubTab='mingge'; renderAll(); } },
    { label:'功法', icon:'sword', fn:()=>{ activePanel='status'; statusSubTab='skills'; renderAll(); } },
    { label:'行囊', icon:'bag', fn:()=>{ activePanel='status'; statusSubTab='bag'; renderAll(); } },
    { label:'伙伴', icon:'ally', fn:()=>{ activePanel='allies'; renderAll(); } },
    { label:'卷宗', icon:'scroll', fn:()=>{ activePanel='status'; statusSubTab='save'; renderAll(); } }
  ];
  btns.forEach(b => {
    const el = document.createElement('button'); el.className = 'dock-btn';
    el.innerHTML = `${IC[b.icon]}<span>${b.label}</span>`;
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