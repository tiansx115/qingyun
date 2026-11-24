window.GAME_DATA = window.GAME_DATA || {};

// 灵兽收养、驯化、培养与同屏参战系统（4大经典流派灵兽）
window.GAME_DATA.BEAST_DEFS = {
  wolf: {
    id: 'wolf', name: '赤瞳灵狼', role: '暴击 / 狂战撕裂', asset: 'wolf_boss',
    adoptCost: 60, baseAtk: 24, baseSpeed: 14,
    stages: ['幼狼', '赤瞳灵狼', '幽月妖狼', '天狼神兽'],
    skillName: '赤瞳裂喉',
    skillEffect: { critBonus: 0.25, poiseDmg: 20 },
    desc: '迅猛狠辣的妖狼，极擅暴击撕裂与破定，完美契合暴击/狂战流。'
  },
  turtle: {
    id: 'turtle', name: '玄甲灵龟', role: '叠甲 / 反伤护主', asset: 'wolf_boss',
    adoptCost: 65, baseAtk: 14, baseSpeed: 9,
    stages: ['灵龟雏', '玄甲灵龟', '镇岳妖龟', '玄武圣兽'],
    skillName: '玄甲护主',
    skillEffect: { shield: 55, reflectBoost: 0.15 },
    desc: '沉稳厚重的灵龟，行动时为主角叠加厚重灵盾并强化反伤。'
  },
  snake: {
    id: 'snake', name: '碧鳞毒蟒', role: '叠毒 / 蚀骨折磨', asset: 'wolf_boss',
    adoptCost: 70, baseAtk: 18, baseSpeed: 13,
    stages: ['青鳞蛇', '碧鳞毒蟒', '万毒妖蛟', '腾蛇古兽'],
    skillName: '碧鳞毒牙',
    skillEffect: { poison: 4 },
    desc: '阴冷敏捷的毒蟒，每次出手为敌手叠加 4 层【蚀骨毒】，叠毒流绝配。'
  },
  crane: {
    id: 'crane', name: '青鸾灵鹤', role: '辅助 / 治疗加速', asset: 'sister_full',
    adoptCost: 85, baseAtk: 15, baseSpeed: 15,
    stages: ['灵鹤雏', '青鸾灵鹤', '云霄仙鹤', '九天青鸾'],
    skillName: '青鸾仙音',
    skillEffect: { heal: 55, boostHeroAtb: 22 },
    desc: '灵气盎然的仙禽，战中为主角疗伤并加速集气，辅助/续航流核心。'
  }
};
