// 炼丹炉火候控制 / 鬼市拍卖会竞价 / 多结局二周目传承 / 离线资源包预缓存

window.LEGACY = {
  KEY: 'qingyun_v5_legacy',
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { runs: 0, points: 0, endings: [] };
  },
  save(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch {}
  },
  recordEnding(ending) {
    const leg = this.load();
    leg.runs = (leg.runs || 0) + 1;
    if (!leg.endings.includes(ending.id)) {
      leg.endings.push(ending.id);
      leg.points = (leg.points || 0) + (ending.points || 1);
    }
    this.save(leg);
    return leg;
  }
};

window.OFFLINE_CACHE = {
  CACHE_NAME: 'qingyun-v6-0-1',
  async getStats() {
    if (typeof caches === 'undefined') return { supported: false, count: 0 };
    try {
      const cache = await caches.open(this.CACHE_NAME);
      const keys = await cache.keys();
      return { supported: true, count: keys.length };
    } catch { return { supported: false, count: 0 }; }
  },
  async precacheAll(onProgress) {
    if (typeof caches === 'undefined') return { ok: false, cached: 0, total: 0 };
    const D = window.GAME_DATA || {};
    const urls = new Set([
      './', './index.html', './manifest.json', './styles/main.css',
      './data/skills_items.js', './data/world.js', './data/events.js', './data/allies.js',
      './engine/icons.js', './engine/audio_fx.js', './engine/minigames.js', './engine/app.js',
      './assets/icons/icon-192.png', './assets/icons/icon-512.png'
    ]);
    Object.values(D.ASSETS_MAP || {}).forEach(u => urls.add('./' + u));
    Object.values(D.AUDIO_MAP || {}).forEach(u => urls.add('./' + u));
    const list = Array.from(urls);
    const cache = await caches.open(this.CACHE_NAME);
    let cached = 0;
    for (let i = 0; i < list.length; i++) {
      try {
        const resp = await fetch(list[i]);
        if (resp && resp.ok) {
          await cache.put(list[i], resp.clone());
          cached++;
        }
      } catch {}
      if (onProgress) onProgress(i + 1, list.length, cached);
    }
    return { ok: true, cached, total: list.length };
  }
};

window.MINIGAMES = {
  _raf: null,

  closeOverlay() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    const el = document.getElementById('mini-modal-root');
    if (el) el.remove();
  },

  _mountShell(title, sub, onClose) {
    this.closeOverlay();
    const wrap = document.createElement('div');
    wrap.id = 'mini-modal-root';
    wrap.className = 'mini-overlay';
    wrap.innerHTML = `
      <div class="mini-card">
        <div class="sec-head">
          <span>${title}</span>
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:10.5px;color:var(--muted);">${sub}</span>
            <button class="sleek-btn ghost" id="mini-close" style="padding:3px 10px;font-size:11px;">关闭</button>
          </div>
        </div>
        <div id="mini-body" class="mini-body"></div>
      </div>
    `;
    document.getElementById('app').appendChild(wrap);
    wrap.querySelector('#mini-close').onclick = () => {
      SFX.play('click');
      this.closeOverlay();
      if (onClose) onClose();
    };
    return wrap.querySelector('#mini-body');
  },

  // ===== 1. 炼丹炉火候控制小玩法 =====
  openAlchemy(ctx) {
    const { G, D, addItem, advanceTime, showToast, saveGame, renderAll } = ctx;
    const recipes = D.ALCHEMY_RECIPES || [];
    let selectedIdx = 0;
    let state = null; // null | { pos, dir, hits, round, maxRounds, recipe }

    const render = () => {
      const body = this._mountShell('青云丹房 · 炼丹控火', `灵石 ${G.stone} · 丹道熟练 ${G.flags.alchemyLv || 0}`, () => renderAll());
      const rec = recipes[selectedIdx];

      if (!state) {
        const listHtml = recipes.map((r, i) => `
          <div class="glass-card ${i === selectedIdx ? 'active' : ''}" data-rec="${i}" style="cursor:pointer;">
            <div>
              <h4>${r.name}</h4>
              <p>${r.desc}</p>
            </div>
            <span style="font-size:11px;color:#ebd29b;flex-shrink:0;">${r.cost} 灵石</span>
          </div>
        `).join('');
        body.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:7px;max-height:46vh;overflow-y:auto;">${listHtml}</div>
          <div class="mini-foot">
            <span style="font-size:11px;color:var(--muted);">开炉消耗药材灵石并推进 1 月；三轮控火命中翠玉温区可成双倍极品丹。</span>
            <button class="sleek-btn" id="alc-start">开炉引火（${rec.cost} 灵石）</button>
          </div>
        `;
        body.querySelectorAll('[data-rec]').forEach(el => {
          el.onclick = () => { SFX.play('click'); selectedIdx = Number(el.dataset.rec); render(); };
        });
        body.querySelector('#alc-start').onclick = () => {
          if (G.stone < rec.cost) return showToast(`灵石不足 ${rec.cost} 枚。`);
          G.stone -= rec.cost;
          advanceTime(1);
          SFX.play('click');
          state = { pos: 10, dir: 1, hits: 0, round: 1, maxRounds: 3, recipe: rec };
          render();
        };
        return;
      }

      const r = state.recipe;
      const bonusSpan = Math.min(10, Math.floor((G.flags.alchemyLv || 0) * 1.5));
      const tMin = Math.max(15, r.targetMin - bonusSpan / 2);
      const tMax = Math.min(85, r.targetMax + bonusSpan / 2);

      body.innerHTML = `
        <div style="text-align:center;font-size:12.5px;color:#ebd29b;">
          正在炼制【${r.name}】 · 第 ${state.round} / ${state.maxRounds} 轮控火（已精准 ${state.hits} 次）
        </div>
        <div class="furnace-gauge">
          <div class="furnace-zone" style="left:${tMin}%;width:${tMax - tMin}%;"></div>
          <div class="furnace-needle" id="alc-needle" style="left:${state.pos}%;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);">
          <span>文火偏弱</span><span style="color:var(--jade);">最佳丹火温区</span><span>武火过旺</span>
        </div>
        <div class="mini-foot" style="justify-content:center;">
          <button class="sleek-btn" id="alc-lock" style="min-width:180px;">锁火凝丹</button>
        </div>
      `;

      const needle = body.querySelector('#alc-needle');
      const tick = () => {
        if (!state) return;
        state.pos += state.dir * r.speed;
        if (state.pos >= 98) { state.pos = 98; state.dir = -1; }
        if (state.pos <= 2) { state.pos = 2; state.dir = 1; }
        if (needle) needle.style.left = state.pos + '%';
        this._raf = requestAnimationFrame(tick);
      };
      this._raf = requestAnimationFrame(tick);

      body.querySelector('#alc-lock').onclick = () => {
        if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
        const inZone = state.pos >= tMin && state.pos <= tMax;
        if (inZone) {
          state.hits++;
          SFX.play('levelup');
        } else {
          SFX.play('click');
        }
        if (state.round < state.maxRounds) {
          state.round++;
          state.pos = Math.random() > 0.5 ? 10 : 90;
          state.dir = state.pos < 50 ? 1 : -1;
          render();
        } else {
          const hits = state.hits;
          state = null;
          this.closeOverlay();
          if (hits >= 3) {
            addItem(r.id, 2);
            G.flags.alchemyLv = (G.flags.alchemyLv || 0) + 2;
            showToast(`三火合一，极品成丹！获得【${r.name}】×2，丹道熟练 +2。`);
          } else if (hits >= 1) {
            addItem(r.id, 1);
            G.flags.alchemyLv = (G.flags.alchemyLv || 0) + 1;
            showToast(`丹香四溢，获得【${r.name}】×1，丹道熟练 +1。`);
          } else {
            showToast('火候失衡，炉内只余焦丹残渣。');
          }
          saveGame('auto', true);
          renderAll();
        }
      };
    };

    render();
  },

  // ===== 2. 鬼市拍卖会实时竞价小玩法 =====
  openAuction(ctx) {
    const { G, D, addItem, advanceTime, showToast, saveGame, renderAll, formatStatSummary } = ctx;
    const lots = D.AUCTION_LOTS || [];
    const lot = lots[Math.floor(Math.random() * lots.length)];
    const it = D.ITEMS[lot.itemId];
    const rivals = ['玄天宗外门执事', '云州散修富商', '青衫独行剑客'];
    const rivalName = rivals[Math.floor(Math.random() * rivals.length)];
    let curPrice = lot.startPrice;
    let highBidder = '无人出价';
    let rivalActive = true;
    let bluffUsed = false;
    let logMsg = `沈云舒轻敲紫檀木槌：“本场拍品【${it.name}】，起拍价 ${curPrice} 灵石，各位请出价。”`;

    const render = () => {
      const body = this._mountShell('鬼市拍卖会 · 实时竞价', `囊中灵石 ${G.stone}`, () => renderAll());
      body.innerHTML = `
        <div class="glass-card active">
          <div style="display:flex;gap:12px;align-items:center;">
            <img src="${ctx.getItemIcon(it.id)}" style="width:42px;height:42px;object-fit:contain;"/>
            <div>
              <h4>${it.name} ${it.tier ? `<span class="tier-tag t-${it.tier}">${it.tier}</span>` : ''}</h4>
              <p>${it.stats ? formatStatSummary(it.stats) : it.desc}</p>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:10px;color:var(--muted);">当前最高价</div>
            <div style="font-size:17px;color:#ebd29b;font-weight:700;">${curPrice} 灵石</div>
            <div style="font-size:10px;color:var(--jade);">${highBidder}</div>
          </div>
        </div>
        <div class="auction-log">${logMsg}</div>
        <div class="mini-foot" style="flex-wrap:wrap;gap:7px;">
          <button class="sleek-btn" id="auc-b10">加价 +10（${curPrice + 10}）</button>
          <button class="sleek-btn" id="auc-b25">加价 +25（${curPrice + 25}）</button>
          <button class="sleek-btn ghost" id="auc-bluff" ${bluffUsed ? 'disabled style="opacity:0.45;"' : ''}>口才压价 / 虚张声势</button>
          <button class="sleek-btn ghost" id="auc-pass">放弃离席</button>
        </div>
      `;

      const placeBid = inc => {
        const nextP = curPrice + inc;
        if (G.stone < nextP) return showToast(`灵石不足 ${nextP} 枚。`);
        SFX.play('click');
        curPrice = nextP;
        highBidder = G.name;
        const limit = lot.rivalMax + Math.floor(Math.random() * 14 - 7);
        if (rivalActive && curPrice < limit) {
          const rInc = curPrice + 15 <= limit ? 15 : 10;
          curPrice += rInc;
          highBidder = rivalName;
          logMsg = `你出价 ${nextP} 灵石，${rivalName} 毫不相让，立即举牌加至 ${curPrice} 灵石！`;
          render();
        } else {
          // Won!
          G.stone -= curPrice;
          advanceTime(1);
          addItem(it.id, 1);
          SFX.play('levelup');
          this.closeOverlay();
          showToast(`一槌定音！以 ${curPrice} 灵石拍得【${it.name}】（市价 ${lot.marketPrice}）。`);
          saveGame('auto', true);
          renderAll();
        }
      };

      body.querySelector('#auc-b10').onclick = () => placeBid(10);
      body.querySelector('#auc-b25').onclick = () => placeBid(25);
      body.querySelector('#auc-bluff').onclick = () => {
        if (bluffUsed) return;
        bluffUsed = true;
        SFX.play('click');
        if (G.talk >= 12 || Math.random() < 0.55) {
          rivalActive = false;
          logMsg = `你淡淡点出拍品灵纹中的一处微瑕，${rivalName} 顿时迟疑收牌，不再与你争锋！`;
        } else {
          const bonus = 25;
          G.stone += bonus;
          logMsg = `你故意抬价试探，${rivalName} 果然上钩高价接盘，沈云舒暗中分你 ${bonus} 灵石茶水钱。`;
          this.closeOverlay();
          advanceTime(1);
          showToast(`抬价诱敌成功，净赚 ${bonus} 灵石回扣！`);
          saveGame('auto', true);
          renderAll();
          return;
        }
        render();
      };
      body.querySelector('#auc-pass').onclick = () => {
        SFX.play('click');
        this.closeOverlay();
        showToast('你收手观望，未参与本轮竞价。');
        renderAll();
      };
    };

    render();
  },

  // ===== 3. 多结局结算与二周目传承 =====
  openEnding(ctx, forcedEnding) {
    const { G, D, startQuiz } = ctx;
    const ending = forcedEnding || (D.ENDINGS || []).find(e => e.check(G)) || {
      id: 'mortal_dream', title: '红尘问道 · 东洲行纪', points: 1,
      desc: '此生游历东洲，亦算无憾。'
    };
    const leg = window.LEGACY.recordEnding(ending);
    const body = this._mountShell('天命终章 · 问道结算', `第 ${leg.runs} 世轮回`, null);
    body.innerHTML = `
      <div style="text-align:center;padding:8px 6px;">
        <div class="vermilion-seal" style="writing-mode:horizontal-tb;padding:3px 12px;margin-bottom:8px;">已收录结局</div>
        <h2 style="margin:6px 0 8px;font-size:22px;color:#ebd29b;letter-spacing:4px;">${ending.title}</h2>
        <p style="font-size:13px;line-height:1.8;color:var(--text);margin:0 auto 14px;max-width:520px;">${ending.desc}</p>
        <div class="glass-card" style="justify-content:center;gap:20px;margin-bottom:14px;font-size:11.5px;">
          <span>最终境界：<b style="color:#ebd29b;">${D.REALMS[G.realmIdx].name}</b></span>
          <span>历练年月：<b style="color:#ebd29b;">${G.month} 月</b></span>
          <span>累计传承点：<b style="color:var(--jade);">${leg.points} 点（下周目生效）</b></span>
        </div>
        <button class="sleek-btn" id="end-ngplus">携前世传承 · 重入轮回</button>
      </div>
    `;
    body.querySelector('#end-ngplus').onclick = () => {
      SFX.play('levelup');
      this.closeOverlay();
      startQuiz();
    };
  }
};
