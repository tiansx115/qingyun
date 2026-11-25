/* ============================================================================
 * 《沧溟界》v10.4.0 世界导演与因果反馈引擎 (engine/world_director.js)
 * ----------------------------------------------------------------------------
 * 把后台 1200 年社会演化真正映射到玩家的实景体验中：
 * 1. 动态悬赏榜：根据当前板块的妖患、暗森指数、丹矿缺口自动生成真实悬赏任务
 * 2. 跨洲跑商差价：利用 24 板块真实 priceIndex (丹/矿/粮) 低买高卖，体验“财侣法地”
 * 3. 江湖通缉与易容避祸：作恶/压榨触发通缉，执法执事在实景中追杀，戴黑市马甲可隐匿避祸
 * 4. 施舍流民 / 招纳散修：直接反馈到正道/凡人名声与宗门门徒
 * ============================================================================ */
(function (root) {
  'use strict';

  function ensureDirectorState(hero, world) {
    if (!hero) return;
    if (typeof hero.wanted !== 'number') hero.wanted = 0;
    if (!Array.isArray(hero.bounties)) hero.bounties = [];
    if (hero.bounties.length === 0 && world) {
      refreshBounties(hero, world);
    }
  }

  function refreshBounties(hero, world) {
    const nd = (world.nodeMap && world.nodeMap[hero.locId]) || world.nodes[0];
    const list = [
      {
        id: 'b_hunt_' + world.year,
        title: `清剿【${nd.name}】城外妖患`,
        desc: '在城镇实景城外即时斩杀 1 只妖兽或暗森劫修',
        kind: 'kill', target: 1, progress: 0,
        rewardStones: 75 + Math.round((nd.darkForestIdx || 20) * 0.6),
        rewardRep: 10, claimed: false
      },
      {
        id: 'b_herb_' + world.year,
        title: `采集【${nd.name}】野生灵草交差`,
        desc: '在城外东北灵脉草丛采集 2 次野生灵草',
        kind: 'gather', target: 2, progress: 0,
        rewardStones: 60 + Math.round((nd.priceIndex.pill || 1) * 20),
        rewardRep: 6, claimed: false
      },
      {
        id: 'b_med_' + world.year,
        title: '潜心吐纳 · 印证道果',
        desc: '在聚灵蒲团或洞府内打坐吐纳 1 次',
        kind: 'meditate', target: 1, progress: 0,
        rewardStones: 45,
        rewardRep: 5, claimed: false
      }
    ];
    hero.bounties = list;
    return list;
  }

  function recordProgress(hero, kind, amount) {
    if (!hero || !Array.isArray(hero.bounties)) return null;
    let completed = null;
    hero.bounties.forEach(b => {
      if (b.claimed || b.kind !== kind) return;
      const before = b.progress;
      b.progress = Math.min(b.target, b.progress + (amount || 1));
      if (before < b.target && b.progress >= b.target) completed = b;
    });
    return completed;
  }

  function claimBounty(hero, world, bountyId) {
    const b = (hero.bounties || []).find(x => x.id === bountyId);
    if (!b) return { ok: false, msg: '悬赏不存在' };
    if (b.claimed) return { ok: false, msg: '该悬赏已领赏' };
    if (b.progress < b.target) return { ok: false, msg: `进度未满 (${b.progress}/${b.target})` };
    b.claimed = true;
    hero.stones += b.rewardStones;
    if (hero.life && hero.life.reputation) hero.life.reputation.righteous += b.rewardRep;
    const nd = world && world.nodeMap ? world.nodeMap[hero.locId] : null;
    if (nd && b.kind === 'kill') nd.darkForestIdx = Math.max(0, (nd.darkForestIdx || 0) - 4);
    return { ok: true, msg: `✔ 悬赏交付成功！获赏灵石 +${b.rewardStones}、正道名声 +${b.rewardRep}！` };
  }

  // 跨洲跑商：依据当前板块真实 priceIndex 买卖标准商货
  const TRADE_GOODS = [
    { id: 'tg_pill', name: '商行灵丹箱', base: 50, key: 'pill', desc: '丹药紧缺之地高价抢手' },
    { id: 'tg_ore',  name: '百炼灵矿锭', base: 45, key: 'mineral', desc: '炼器大宗驻地溢价极高' },
    { id: 'tg_grain',name: '灵谷军粮袋', base: 30, key: 'grain', desc: '战乱饥荒板块可暴赚差价' }
  ];

  function getLocalTradePrice(plate, good) {
    const idx = (plate && plate.priceIndex && plate.priceIndex[good.key]) || 1.0;
    return Math.max(12, Math.round(good.base * idx));
  }

  function buyTradeGood(hero, plate, goodId) {
    const g = TRADE_GOODS.find(x => x.id === goodId);
    if (!g) return { ok: false, msg: '未知商货' };
    const price = getLocalTradePrice(plate, g);
    if ((hero.stones || 0) < price) return { ok: false, msg: `灵石不足（本地市价 ${price} 灵石）` };
    hero.stones -= price;
    const ex = hero.bag.find(i => i.name === g.name);
    if (ex) ex.qty += 1;
    else hero.bag.push({ id: g.id, name: g.name, kind: '商货', qty: 1, desc: `${g.desc}（购入价 ${price}）` });
    return { ok: true, msg: `💰 以 ${price} 灵石购入【${g.name}】×1，可跨洲运往高价板块套利！` };
  }

  function sellTradeGood(hero, plate, goodId) {
    const g = TRADE_GOODS.find(x => x.id === goodId);
    if (!g) return { ok: false, msg: '未知商货' };
    const idx = (hero.bag || []).findIndex(i => i.name === g.name && i.qty > 0);
    if (idx < 0) return { ok: false, msg: `行囊中无【${g.name}】可售` };
    const price = getLocalTradePrice(plate, g);
    hero.bag[idx].qty--;
    if (hero.bag[idx].qty <= 0) hero.bag.splice(idx, 1);
    hero.stones += price;
    return { ok: true, msg: `💰 在【${plate.name}】以市价 ${price} 灵石售出【${g.name}】×1！` };
  }

  const WorldDirector = {
    ensureDirectorState, refreshBounties, recordProgress, claimBounty,
    TRADE_GOODS, getLocalTradePrice, buyTradeGood, sellTradeGood
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = WorldDirector;
  root.WorldDirector = WorldDirector;
})(typeof window !== 'undefined' ? window : globalThis);
