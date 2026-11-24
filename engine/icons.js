window.ICONS = {
  map: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z"/><path d="M9 4v14M15 6v14"/></svg>`,
  char: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>`,
  sword: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 3l-9 9-3-1-4 4 2 2 4-4-1-3 9-9 2 2z"/><path d="M5 19l-2 2"/></svg>`,
  bag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 8V6a5 5 0 0 1 10 0v2"/><rect x="4" y="8" width="16" height="13" rx="2"/><path d="M9 12h6"/></svg>`,
  ally: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="8" r="3.2"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M3 19c1-3.2 3.5-4.8 6-4.8s5 1.6 6 4.8"/><path d="M15 14.8c2 .3 4 1.5 5 4.2"/></svg>`,
  scroll: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 4h11a3 3 0 0 1 0 6H7a3 3 0 0 0 0 6h11"/><path d="M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12"/></svg>`,
  stone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 20 9 12 22 4 9 12 2"/><path d="M12 2v20M4 9h16"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polygon points="13 2 4 14 11 14 10 22 20 10 13 10 13 2"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/></svg>`,
  retreat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 14l-4-4 4-4"/><path d="M5 10h10a4 4 0 0 1 0 8h-3"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="16" r="1.2" fill="currentColor"/></svg>`,
  bagua: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.1"><polygon points="32,4 52,12 60,32 52,52 32,60 12,52 4,32 12,12"/><circle cx="32" cy="32" r="16"/><path d="M32 16a8 8 0 0 1 0 16 8 8 0 0 0 0 16"/><circle cx="32" cy="24" r="2" fill="currentColor"/><circle cx="32" cy="40" r="2"/></svg>`
};

// ===== v6.1 专属技能 / 外物法宝 / 战斗动作 3A 哑光金纹图标库 =====
window.SKILL_ICONS = {
  // 剑法
  basic_sword: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M25 5L11 19"/><path d="M25 5l-5 1.5L13 13.5"/><path d="M9 17l6 6"/><path d="M11 21l-5 5"/><path d="M6 12c3-4 8-6 13-6" opacity="0.55"/></svg>`,
  sister_frost: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M16 3v26M5 9.5l22 13M27 9.5l-22 13"/><path d="M13 6l3 3 3-3M13 26l3-3 3 3"/><circle cx="16" cy="16" r="3.5"/></svg>`,
  grandpa_finger: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3l3 10-3 15-3-15 3-10z"/><path d="M9 15l7-4 7 4"/><path d="M6 22c4-2 16-2 20 0" opacity="0.6"/></svg>`,
  // 刀法
  swift_blade: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M25 6c-2 8-8 14-16 17l3-7c5-2 9-6 13-10z"/><path d="M7 21l4 4"/><path d="M5 27l4-4"/><path d="M6 11c4-3 9-4 14-3" opacity="0.5"/></svg>`,
  blood_cleave: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 25C10 13 18 7 27 5c-2 9-8 17-18 22z"/><path d="M11 8l3 4M18 19l5 3"/><path d="M5 14c3-5 8-8 14-9" opacity="0.6"/></svg>`,
  // 棍法
  sweep_staff: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 26L27 6"/><path d="M9 9c6-2 13 1 16 7" stroke-width="1.3" opacity="0.65"/><path d="M7 18c4 5 11 7 17 5" stroke-width="1.3" opacity="0.65"/></svg>`,
  sky_smash_staff: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4v18"/><path d="M12 7h8M12 19h8"/><path d="M5 26l6-4 5 4 5-4 6 4"/><path d="M9 12l-4-2M23 12l4-2" opacity="0.65"/></svg>`,
  // 掌拳
  evade_step: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="11" opacity="0.45"/><path d="M16 7v10M12 10v7M20 11v6M10 17c0 4 2.5 7 6 7s6-3 6-7"/></svg>`,
  iron_counter: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4l10 4v8c0 6-4.5 10-10 12-5.5-2-10-6-10-12V8l10-4z"/><path d="M11 15l5-4 5 4-5 6-5-6z"/></svg>`,
  // 术法毒功
  venom_dart: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6l-9 9M27 12l-9 9M18 5l-9 9"/><circle cx="8" cy="24" r="2.2"/><circle cx="14" cy="26" r="1.4" opacity="0.7"/></svg>`,
  venom_burst: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="16" cy="16" r="5"/><path d="M16 4v4M16 24v4M4 16h4M24 16h4M7.5 7.5l3 3M21.5 21.5l3 3M24.5 7.5l-3 3M10.5 21.5l-3 3"/></svg>`,
  mind_strike: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 5c4 5 7 9 7 13a7 7 0 0 1-14 0c0-4 3-8 7-13z"/><path d="M16 12v10M11 17h10"/></svg>`,
  // 战斗核心动作与外物法宝
  counter: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="16" cy="16" r="10.5"/><path d="M16 5.5a5.25 5.25 0 0 1 0 10.5 5.25 5.25 0 0 0 0 10.5"/><circle cx="16" cy="10.8" r="1.4" fill="currentColor"/><circle cx="16" cy="21.2" r="1.4"/></svg>`,
  tr_flying_sword: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M26 6L10 22"/><path d="M8 20l4 4M6 26l3-3"/><path d="M6 12c4-5 12-6 18-3" opacity="0.6"/><path d="M14 26c6 0 11-4 13-10" opacity="0.6"/></svg>`,
  tr_poison_needle: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 26L25 7M12 26L27 11M6 20L21 5"/><circle cx="25" cy="7" r="1.5" fill="currentColor"/></svg>`,
  tr_soul_bell: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 5v3"/><path d="M9 18c0-5 3-9 7-9s7 4 7 9l2 4H7l2-4z"/><circle cx="16" cy="25" r="2"/><path d="M4 14c1-2 2-3 3-4M28 14c-1-2-2-3-3-4" opacity="0.6"/></svg>`,
  tr_spirit_banner: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v24"/><path d="M9 6h14l-3 5 3 5H9"/><path d="M13 11h4"/></svg>`,
  retreat: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l-6-6 6-6"/><path d="M6 13h14a6 6 0 0 1 0 12h-4"/></svg>`
};

// 9 格装备槽位极简暗金线框轮廓
window.SLOT_ICONS = {
  weapon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M19 4L9 14M7 12l5 5M5 19l3-3"/></svg>`,
  clothes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 4l4 3 4-3 4 4-3 3v9H7v-9L4 8l4-4z"/></svg>`,
  head: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 16l2-8 5 3 5-3 2 8H5z"/><path d="M5 19h14"/></svg>`,
  boots: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 4h5v10l5 2v3H7V4h1z"/></svg>`,
  wristL: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="6" y="7" width="12" height="10" rx="3"/><path d="M9 7v10M15 7v10"/></svg>`,
  wristR: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="6" y="7" width="12" height="10" rx="3"/><path d="M9 7v10M15 7v10"/></svg>`,
  acc1: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="14" r="6"/><circle cx="12" cy="14" r="2"/><path d="M12 4v4"/></svg>`,
  acc2: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><polygon points="12,4 18,12 12,20 6,12"/><circle cx="12" cy="12" r="2"/></svg>`,
  ring: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="14" r="6"/><polygon points="12,4 15,8 12,10 9,8"/></svg>`
};

// 4 大灵兽切换缩略徽标
window.BEAST_ICONS = {
  wolf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 19l2-7 2-6 3 3 3-3 2 6 2 7-7-3-7 3z"/><circle cx="10" cy="12" r="0.8" fill="currentColor"/><circle cx="14" cy="12" r="0.8" fill="currentColor"/></svg>`,
  turtle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="13" rx="7" ry="5"/><path d="M12 8v10M7 11l10 4M17 11l-10 4"/><circle cx="12" cy="6" r="2"/></svg>`,
  snake: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 18c0-3 10-3 10-6s-10-3-10-6c0-2 3-3 6-2"/><circle cx="15" cy="5" r="1.2" fill="currentColor"/></svg>`,
  crane: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 15c4-4 9-5 16-8-3 5-5 8-9 10l-3 3-1-4-3-1z"/><path d="M12 12l-5-6"/></svg>`
};

window.getSkillIconHtml = function (id, cls = 'sk-ico') {
  const svg = window.SKILL_ICONS[id] || window.ICONS.spark;
  return `<span class="${cls}">${svg}</span>`;
};
