// v7.0 《天命成就录》跨档永久成就系统 + 先天道体 & 先天气运词条库（类鬼谷八荒开局定制与跨档解锁）
window.ACHIEVEMENTS = (function () {
  const STORAGE_KEY = 'qingyun_v7_ach_store';

  // 6 大先天道体（开新档限选 1 具，成就解锁高阶逆天道体）
  const DAO_BODIES = [
    {
      id: 'mortal_body', name: '凡胎道体', tier: '凡品', cost: 0, defaultUnlocked: true,
      desc: '寻常修仙者躯壳，五行无拘，全凭后天勤修苦悟。',
      apply(G) {}
    },
    {
      id: 'pure_yang_fire', name: '离火纯阳体', tier: '玄品', cost: 15, reqAch: 'ach_zhuji',
      desc: '天生火灵根直锁 100（一日千里），其余灵根微弱；初始习得《离火焚天诀》，气血 +40。',
      apply(G) {
        G.elements = { gold: 8, wood: 10, water: 2, fire: 100, earth: 9 };
        G.root = '离火纯阳体'; G.maxHp += 40; G.hp += 40;
        if (!G.skills.includes('flame_saber')) { G.skills.push('flame_saber'); G.skillProf.flame_saber = { lv: 1, exp: 0 }; }
      }
    },
    {
      id: 'taibai_sword_body', name: '太白剑灵体', tier: '玄品', cost: 20, reqAch: 'ach_dao_one_60',
      desc: '天生剑骨，金灵根 +45，【剑道】初始领悟 +20，开局佩【太白分光剑器】。',
      apply(G) {
        G.elements.gold = Math.min(100, (G.elements.gold || 25) + 45);
        G.daoBase.sword = Math.min(100, (G.daoBase.sword || 0) + 20);
        G.equipment.weapon = 'eq_qingyun_sword';
      }
    },
    {
      id: 'ancient_desolate', name: '荒古废灵圣体', tier: '地品', cost: 30, reqAch: 'ach_low_root_master',
      desc: '五行灵根全部锁为 3（修五行法极难），但根骨 +12、气血上限 +120、【体道】领悟 +25，无属性神通威力大增！',
      apply(G) {
        G.elements = { gold: 3, wood: 3, water: 3, fire: 3, earth: 3 };
        G.root = '荒古废灵圣体'; G.body += 12; G.daoBase.body = Math.min(100, (G.daoBase.body || 0) + 25);
        if (!G.skills.includes('sky_smash_staff')) { G.skills.push('sky_smash_staff'); G.skillProf.sky_smash_staff = { lv: 1, exp: 0 }; }
      }
    },
    {
      id: 'innate_dao_fetus', name: '先天道胎', tier: '仙品', cost: 45, reqAch: 'ach_dao_full_1',
      desc: '近道之躯！五维全 +4，六大仙道初始各领悟 +15 点，参悟一切大道事半功倍。',
      apply(G) {
        G.body += 4; G.wit += 6; G.speed += 4; G.luck += 4; G.sense += 6;
        Object.keys(G.daoBase).forEach(k => { G.daoBase[k] = Math.min(100, (G.daoBase[k] || 0) + 15); });
      }
    },
    {
      id: 'samsara_immortal', name: '万劫轮回圣胎', tier: '仙品', cost: 60, reqAch: 'ach_reincarnate_2',
      desc: '历经轮回而不昧真灵！初始寿元上限 +50 岁，神识 +8，开局额外获赠一枚【悟道古茶树叶】。',
      apply(G) {
        G.maxAge += 50; G.sense += 8;
        G.bag.dao_tea = (G.bag.dao_tea || 0) + 1;
      }
    }
  ];

  // 12 条先天气运词条（开新档可用成就天命点最多自由勾选 3 条）
  const DESTINY_TRAITS = [
    { id: 'dt_stone_bag',   name: '散修遗泽',   tier: '凡品', cost: 5,  defaultUnlocked: true, desc: '开局额外携带 120 枚灵石与 2 枚破境凝元丹。', apply(G){ G.stone += 120; G.bag.condense_pill = (G.bag.condense_pill||0)+2; } },
    { id: 'dt_swift_wind',  name: '御风仙姿',   tier: '灵品', cost: 10, defaultUnlocked: true, desc: '遁速 +5，身法集气天生快人一线。', apply(G){ G.speed += 5; } },
    { id: 'dt_sharp_sense', name: '泥丸宫开',   tier: '灵品', cost: 12, defaultUnlocked: true, desc: '神识 +8（更快解锁第一格体外法宝槽！）。', apply(G){ G.sense += 8; } },
    { id: 'dt_lucky_star',  name: '气运之子',   tier: '玄品', cost: 15, defaultUnlocked: true, desc: '气运 +8，寻获【造化轮回盘】与奇遇概率显著提升。', apply(G){ G.luck += 8; } },
    { id: 'dt_cave_deed',   name: '祖传仙府契', tier: '玄品', cost: 18, reqAch: 'ach_open_cave', desc: '开局直接拥有已布阵的【云隐仙府】，且藏宝室预存 100 灵石。', apply(G){ G.caveOwned = true; G.caveVault = { items:{}, stones:100 }; } },
    { id: 'dt_spirit_wolf', name: '伴生灵狼',   tier: '玄品', cost: 20, reqAch: 'ach_tame_beast', desc: '开局直接收养并出战一阶灵兽【赤瞳灵狼】（Lv.2）。', apply(G){ G.beasts.wolf = { id:'wolf', lv:2, exp:0, stage:0, bond:50 }; G.activeBeast = 'wolf'; } },
    { id: 'dt_flying_sword',name: '剑匣藏锋',   tier: '地品', cost: 25, reqAch: 'ach_jindan', desc: '开局行囊自带玄品体外法宝【青霜子母飞剑】与神识 +6。', apply(G){ G.sense += 6; G.bag.tr_flying_sword = (G.bag.tr_flying_sword||0)+1; } },
    { id: 'dt_space_ring',  name: '洞天福缘',   tier: '地品', cost: 25, reqAch: 'ach_tourney_win', desc: '开局直接佩戴地品古宝【太虚洞天戒】（35格空间，修炼+15%）。', apply(G){ G.equipment.ring = 'eq_ancient_ring'; } },
    { id: 'dt_longevity',   name: '松鹤仙寿',   tier: '地品', cost: 22, reqAch: 'ach_age_120', desc: '天生寿元上限 +60 岁，根骨 +5，从容熬死同辈天骄。', apply(G){ G.maxAge += 60; G.body += 5; } },
    { id: 'dt_five_origin', name: '五气朝元',   tier: '仙品', cost: 35, reqAch: 'ach_yuanying', desc: '金木水火土五系灵根资质全部 +20（上限100），悟性 +5。', apply(G){ Object.keys(G.elements).forEach(k=>{ G.elements[k]=Math.min(100,(G.elements[k]||20)+20); }); G.wit += 5; } },
    { id: 'dt_undying_robe',name: '涅槃仙衣',   tier: '仙品', cost: 40, reqAch: 'ach_slay_demon', desc: '开局身披绝世古宝【涅槃不灭衣】（每战免死一次并瞬间满集气）。', apply(G){ G.equipment.clothes = 'eq_uniq_undying'; } },
    { id: 'dt_relic_clue',  name: '轮回眷顾',   tier: '仙品', cost: 55, reqAch: 'ach_huashen', desc: '逆天词条！第一世开局直接怀揣天地唯一至宝【造化轮回盘】！', apply(G){ G.bag.reincarnation_disc = 1; if (window.REINCARNATION) window.REINCARNATION.ensureWorldRelic(G); } }
  ];

  // 18 项修仙与轮回成就定义
  const LIST = [
    { id: 'ach_zhuji',           title: '大道筑基',   pts: 15, rewardTxt: '解锁道体【离火纯阳体】', desc: '成功渡过雷劫踏入筑基初期。', check: G => G.realmIdx >= 3 },
    { id: 'ach_jindan',          title: '金丹大道',   pts: 25, rewardTxt: '解锁气运【剑匣藏锋】',   desc: '凝结金丹，寿增三百载。',   check: G => G.realmIdx >= 4 },
    { id: 'ach_yuanying',        title: '元婴真君',   pts: 35, rewardTxt: '解锁气运【五气朝元】',   desc: '碎丹成婴，位列一方大能。', check: G => G.realmIdx >= 5 },
    { id: 'ach_huashen',         title: '化神尊者',   pts: 50, rewardTxt: '解锁气运【轮回眷顾】',   desc: '元神化道，踏入化神之境。', check: G => G.realmIdx >= 6 },
    { id: 'ach_hedao',           title: '以身合道',   pts: 65, rewardTxt: '天命点巨额馈赠',         desc: '领悟至少一条圆满大道，突破至合道圣君！', check: G => G.realmIdx >= 7 },
    { id: 'ach_wandao_emperor',  title: '万道仙帝',   pts: 120,rewardTxt: '诸天至高荣耀',           desc: '历经轮回将六大仙道全部修至 100 圆满，登临至强【万道仙帝】！', check: G => G.realmIdx >= 8 },
    { id: 'ach_open_cave',       title: '开辟仙府',   pts: 15, rewardTxt: '解锁气运【祖传仙府契】', desc: '在东洲开辟属于自己的【云隐仙府】。', check: G => Boolean(G.caveOwned) },
    { id: 'ach_tame_beast',      title: '灵兽缔契',   pts: 15, rewardTxt: '解锁气运【伴生灵狼】',   desc: '收养并驯化至少一头修仙灵兽。', check: G => Object.keys(G.beasts || {}).length >= 1 },
    { id: 'ach_find_relic',      title: '得获轮回',   pts: 25, rewardTxt: '天命点 +25',             desc: '在茫茫四州寻获天地唯一至宝【造化轮回盘】。', check: G => Boolean(G.bag && G.bag.reincarnation_disc) },
    { id: 'ach_reincarnate_1',   title: '再世为人',   pts: 25, rewardTxt: '天命点 +25',             desc: '催动造化轮回盘完成第一次转生重修。', check: G => (G.lifeCount || 1) >= 2 },
    { id: 'ach_reincarnate_2',   title: '三世宿慧',   pts: 45, rewardTxt: '解锁道体【万劫轮回圣胎】', desc: '累计历经三世以上轮回修行。', check: G => (G.lifeCount || 1) >= 3 },
    { id: 'ach_dao_one_60',      title: '一代宗师',   pts: 20, rewardTxt: '解锁道体【太白剑灵体】', desc: '任意一条仙道造诣达到 60 点宗师境。', check: (G, ctx) => ctx && Object.keys(ctx.D.SKILL_CATS).some(k => ctx.getCatMastery(k) >= 60) },
    { id: 'ach_dao_full_1',      title: '证得大道',   pts: 40, rewardTxt: '解锁道体【先天道胎】',   desc: '将任意一条仙道修至 100 圆满化境！', check: (G, ctx) => ctx && Object.keys(ctx.D.SKILL_CATS).some(k => ctx.getCatMastery(k) >= 100) },
    { id: 'ach_dao_full_6',      title: '六道同证',   pts: 90, rewardTxt: '满大道突破资格达成',     desc: '将剑、法、体、阵、魂、契六条大道全部修至 100 圆满！', check: (G, ctx) => ctx && Object.keys(ctx.D.SKILL_CATS).every(k => ctx.getCatMastery(k) >= 100) },
    { id: 'ach_low_root_master', title: '逆天苦修',   pts: 35, rewardTxt: '解锁道体【荒古废灵圣体】', desc: '在某系灵根资质 ≤ 10 的情况下，硬将该系一门神通苦修至圆满(Lv4)！', check: (G, ctx) => {
      if (!ctx || !G.skillProf) return false;
      return Object.entries(G.skillProf).some(([sid, p]) => {
        const sk = ctx.D.SKILLS[sid];
        return sk && sk.elem && sk.elem !== 'none' && p.lv >= 4 && ((G.elements && G.elements[sk.elem]) || 50) <= 10;
      });
    }},
    { id: 'ach_tourney_win',     title: '东洲魁首',   pts: 25, rewardTxt: '解锁气运【洞天福缘】',   desc: '在东洲宗门大比连胜三轮夺得魁首。', check: G => (G.flags && G.flags.tourneyRound >= 3) },
    { id: 'ach_slay_demon',      title: '荡平魔潮',   pts: 35, rewardTxt: '解锁气运【涅槃仙衣】',   desc: '斩杀幽冥血魔将，平定万妖古林魔潮。', check: G => (G.flags && G.flags.demonTideStage >= 2) },
    { id: 'ach_age_120',         title: '百廿遐龄',   pts: 20, rewardTxt: '解锁气运【松鹤仙寿】',   desc: '单世修行年岁超过 120 岁。', check: G => (G.age || 16) >= 120 }
  ];

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { unlocked: parsed.unlocked || [], totalPts: parsed.totalPts || 0 };
      }
    } catch (_) {}
    return { unlocked: [], totalPts: 15 }; // 初始赠送 15 天命点供新玩家体验词条勾选
  }

  function saveStore(st) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); } catch (_) {}
  }

  function recalcTotalPts(unlockedIds) {
    let pts = 15;
    LIST.forEach(a => { if (unlockedIds.includes(a.id)) pts += a.pts; });
    return pts;
  }

  function checkAll(G, ctx) {
    if (!G) return;
    const st = loadStore();
    let changed = false;
    LIST.forEach(a => {
      if (st.unlocked.includes(a.id)) return;
      try {
        if (a.check(G, ctx)) {
          st.unlocked.push(a.id);
          changed = true;
          if (ctx && ctx.showToast) {
            ctx.showToast(`【成就达成】${a.title}（天命点 +${a.pts} · ${a.rewardTxt}）`);
          }
        }
      } catch (_) {}
    });
    if (changed) {
      st.totalPts = recalcTotalPts(st.unlocked);
      saveStore(st);
    }
  }

  function isBodyUnlocked(b, st) {
    return Boolean(b.defaultUnlocked || (b.reqAch && st.unlocked.includes(b.reqAch)));
  }

  function isTraitUnlocked(t, st) {
    return Boolean(t.defaultUnlocked || (t.reqAch && st.unlocked.includes(t.reqAch)));
  }

  return {
    LIST,
    DAO_BODIES,
    DESTINY_TRAITS,
    loadStore,
    checkAll,
    isBodyUnlocked,
    isTraitUnlocked
  };
})();
