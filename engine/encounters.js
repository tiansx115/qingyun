// ===== v8.3.0 沧溟界·海量经典修仙奇遇、心境感触与江湖百态引擎 =====
window.ENCOUNTERS = (function() {
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  function getDynamicFaction(G, archetype) {
    const facs = G.factionsDyn || [];
    if (archetype) {
      const f = facs.find(x => x.archetype === archetype);
      if (f) return f;
    }
    return facs.length ? pick(facs) : { id: 'juntian', name: '太白仙宗', leaderName: '玄明真人', policyName: '务实通商' };
  }

  function getDynamicMinor(G) {
    const ms = (G.minorOrgs || []).filter(m => m.alive !== false);
    return ms.length ? pick(ms) : { name: '青竹散修会', role: '散修互助', region: 'east' };
  }

  function triggerRandomEncounter(ctx, locId) {
    const { G, D, ASSETS, SFX, setDialogue, startBattle, addItem, gainExp, advanceTime, showToast, saveGame, renderAll } = ctx;
    if (window.WORLD_SIM) window.WORLD_SIM.initWorldState(G);

    const locObj = (D.LOCATIONS || []).find(l => l.id === locId) || { id: 'sect', name: '五洲荒野', region: 'east' };
    const hehuanFac = getDynamicFaction(G, 'hehuan');
    const dynFac = getDynamicFaction(G, 'dynasty');
    const alcFac = getDynamicFaction(G, 'alchemy');
    const randFacA = getDynamicFaction(G);
    const randFacB = (G.factionsDyn || []).find(f => f.id !== randFacA.id) || getDynamicFaction(G, 'nether');
    const minorOrg = getDynamicMinor(G);
    const daoKeys = Object.keys(D.SKILL_CATS || { sword: { name: '剑道' } });

    const pool = [
      // 1. 绝壁古洞·前辈坐化遗书（经典凡人修仙沧桑感触 + 传承）
      () => {
        const daoK = pick(daoKeys);
        const daoName = D.SKILL_CATS[daoK]?.name || '剑道';
        return {
          speaker: '古修坐化遗骸 · 绝笔玉简', asset: ASSETS.elder,
          text: `你在【${locObj.name}】一处藤蔓遮蔽的石缝中发现一具盘膝玉化的骸骨，身旁玉简犹带微光：\n“老夫枯坐三百七十载，历经三场宗门倾轧，亲见师友一个个化作黄土，终究卡死在破境半步之外。长生路漫，步步血泪——后来有缘人，莫信名门大派口中空义，唯有自身修为与手中法宝不欺人！此生所悟【${daoName}】心得与余财尽付于你，替老夫看一眼绝巅风光罢。”`,
          choices: [
            {
              text: '恭敬行三拜大礼，收殓骸骨后参悟玉简（耗 3 日）',
              hint: `${daoName}+6 · 获灵石与古物`,
              action: () => {
                if (window.WORLD_SIM) window.WORLD_SIM.advanceDays(ctx, 3, {});
                G.daoBase[daoK] = Math.min(100, (G.daoBase[daoK] || 0) + 6);
                G.stone += randInt(45, 95);
                addItem(pick(['condense_pill', 'marrow_pill', 'zhuyan_pill', 'mystery_box']), 1);
                SFX.play('levelup');
                showToast(`收殓前辈遗骨，心境澄明！【${daoName}】本源 +6，并获遗泽灵石与灵物！`);
                setDialogue(null); saveGame('auto', true); renderAll();
              }
            },
            {
              text: '只取储物袋便匆匆离去（防备此地暗藏禁制）',
              hint: '稳健苟道 · 灵石+40',
              action: () => {
                G.stone += 40;
                showToast('小心驶得万年船，取了四十枚灵石便悄然退走。');
                setDialogue(null); saveGame('auto', true); renderAll();
              }
            }
          ]
        };
      },

      // 2. 酒肆听风·动态宗门互黑与掌门政局八卦
      () => {
        const rel = window.WORLD_SIM ? window.WORLD_SIM.getDiplomacy(G, randFacA.id, randFacB.id) : 0;
        const gossip = rel < -20
          ? `“听说没？【${randFacA.name}】新近由【${randFacA.leaderName}】掌舵，奉行「${randFacA.policyName}」，嘴上把【${randFacB.name}】骂得狗血淋头，其实还不都是为了抢那几条上等灵脉！”`
          : `“别看【${randFacA.name}】和【${randFacB.name}】在茶楼里互相泼脏水，前日我亲眼看见两家执事在暗巷里一起分赃灵矿呢！这修仙界哪有什么纯粹正邪，全是生意！”`;
        return {
          speaker: '茶肆散修 · 江湖秘闻', asset: ASSETS.elder,
          text: `你在【${locObj.name}】歇脚品茗，邻桌几名走南闯北的散修压低声音议论：\n${gossip}\n听罢这番世态炎凉，你对天下势力格局又多了几分通透。`,
          choices: [
            {
              text: '请他们喝一壶灵酒，顺道打探一桩灵脉商机（耗 15 灵石）',
              hint: '获情报 · 悟性/神识+1 · 灵石回报',
              action: () => {
                if (G.stone < 15) return showToast('灵石不足 15 枚。');
                G.stone -= 15;
                G.sense += 1;
                const earn = randInt(30, 75);
                G.stone += earn;
                showToast(`散修大喜，透露一处低价灵草暗市！神识 +1，转手净赚 ${earn - 15} 灵石！`);
                setDialogue(null); saveGame('auto', true); renderAll();
              }
            },
            {
              text: '淡然一笑，记在心中（耗 1 日）',
              hint: '修为小进',
              action: () => {
                if (window.WORLD_SIM) window.WORLD_SIM.advanceDays(ctx, 1, {});
                const g = gainExp(30);
                showToast(`看透宗门利益纠葛，道心微动，修为 +${g}。`);
                setDialogue(null); saveGame('auto', true); renderAll();
              }
            }
          ]
        };
      },

      // 3. 合欢宗风流奇遇（红尘问道 · 阴阳调和 · 情丝织网）
      () => ({
        speaker: `${hehuanFac.name} · 霓裳仙子`, asset: ASSETS.sister_smile || ASSETS.sister,
        text: `香风拂面，一位身着流纱霓裳的【${hehuanFac.name}】真传弟子在【${locObj.name}】拦住你的去路，眸光流转含笑：\n“世人总骂我【${hehuanFac.name}】惑乱道心，可那些名门老祖暗地里哪个不托人高价求购我宗秘丹？我看道友骨相不俗、灵气精纯，不知愿不愿共品一杯红尘醉，切磋一番阴阳调和之道？”`,
        choices: [
          {
            text: '欣然赴约，共参阴阳调和双修之道（耗 5 日 · 需 35 灵石酒资）',
            hint: `修为暴涨 · ${hehuanFac.name}声望+18 · 神识+1`,
            action: () => {
              if (G.stone < 35) return showToast('囊中灵石不足 35 枚。');
              G.stone -= 35;
              if (window.WORLD_SIM) window.WORLD_SIM.advanceDays(ctx, 5, {});
              const g = gainExp(125 + G.realmIdx * 35);
              G.sense += 1;
              G.factionRep[hehuanFac.id] = (G.factionRep[hehuanFac.id] || 0) + 18;
              G.hp = G.maxHp; G.qi = G.maxQi;
              SFX.play('levelup');
              showToast(`红尘问道五日，阴阳交泰！修为 +${g}，神识 +1，【${hehuanFac.name}】声望 +18！`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '向其求购合欢宗秘传【驻颜定容丹】（70 灵石）',
            hint: '折扣购驻颜丹',
            action: () => {
              if (G.stone < 70) return showToast('灵石不足 70 枚。');
              G.stone -= 70;
              addItem('zhuyan_pill', 1);
              G.factionRep[hehuanFac.id] = (G.factionRep[hehuanFac.id] || 0) + 8;
              showToast(`以 70 灵石购得【驻颜定容丹】一枚，仙子浅笑告辞。`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '道心如铁，拱手谢绝',
            hint: '剑道/魂道微悟',
            action: () => {
              G.daoBase.sword = Math.min(100, (G.daoBase.sword || 0) + 2);
              showToast('不为红尘情丝所动，剑心愈发纯粹，剑道本源 +2！');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          }
        ]
      }),

      // 4. 寒门退婚风波（经典“莫欺少年穷”桥段！）
      () => ({
        speaker: '寒门少年散修 · 演武坪风波', asset: ASSETS.hero,
        text: `【${locObj.name}】街头围满看客：一名来自【${dynFac.name}】的华服骄女正冷冷将一纸退婚书甩在寒门少年脸上，讥讽其灵根驳杂不堪匹配。少年紧握双拳指节泛白，胸口一枚古朴黑戒隐隐发烫，低声嘶吼：“三十年河东，三十年河西——今日之辱，他日必百倍奉还！”`,
        choices: [
          {
            text: '暗中赠他一枚【百草回春丹】与 30 灵石结个善缘',
            hint: '气运+2 · 未来天骄人情',
            action: () => {
              if (G.stone < 30) return showToast('灵石不足 30 枚。');
              G.stone -= 30;
              G.luck += 2;
              G.fame += 10;
              if (window.WORLD_SIM) window.WORLD_SIM.pushNews(G, '奇缘', `传闻一名寒门少年遭退婚后得神秘高人暗助，誓言踏碎世家傲骨！`);
              showToast('少年深深记住你的恩情，抱拳远去！气运 +2，声望 +10！');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '替世家骄女解围，换取【' + dynFac.name + '】赏识',
            hint: `${dynFac.name}声望+16 · 灵石+50`,
            action: () => {
              G.factionRep[dynFac.id] = (G.factionRep[dynFac.id] || 0) + 16;
              G.stone += 50;
              G.nobleClanBond = (G.nobleClanBond || 0) + 12;
              showToast(`世家护卫赠你 50 灵石谢礼，【${dynFac.name}】声望 +16，世家恩义加深！`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '修仙界弱肉强食，冷眼旁观不沾因果',
            hint: '心境沉稳 · 修为+35',
            action: () => {
              const g = gainExp(35);
              showToast(`不涉他人因果，心境无波，修为 +${g}。`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          }
        ]
      }),

      // 5. 凡尘故人·沧海桑田（仙凡殊途哲学感触！）
      () => ({
        speaker: '青石镇旧茶摊 · 沧海桑田', asset: ASSETS.elder,
        text: `途经【${locObj.name}】山脚一处凡俗小镇，正逢一家大户出殡。白发苍苍的凡人老妪拄拐叹息：“人这一辈子呀，睁眼闭眼就七十载过去喽。”\n你驻足良久，看着自己仍值壮盛的双手与漫长仙途——凡人一世荣枯，不过修士一次闭关。仙凡殊途的苍茫孤寂涌上心头，却也让你的道心陡然拔高了一层。`,
        choices: [
          {
            text: '在凡尘茶摊静坐三日，体悟红尘生老病死（耗 3 日）',
            hint: '悟性+2 · 任一大道本源+5',
            action: () => {
              if (window.WORLD_SIM) window.WORLD_SIM.advanceDays(ctx, 3, {});
              G.wit += 2;
              const dk = pick(daoKeys);
              G.daoBase[dk] = Math.min(100, (G.daoBase[dk] || 0) + 5);
              SFX.play('levelup');
              showToast(`红尘炼心三日，大彻大悟！悟性 +2，【${D.SKILL_CATS[dk]?.name || '仙道'}】本源 +5！`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          }
        ]
      }),

      // 6. 坊市地摊·蒙尘古剑捡漏
      () => ({
        speaker: '游方散修 · 荒野地摊', asset: ASSETS.elder,
        text: `一名落魄散修在【${locObj.name}】路边摆了个破草席，其中一块沾满泥垢的铁牌隐隐引动你识海共鸣——摊主自己似乎浑然不觉，只当普通废铁叫卖 45 灵石。`,
        choices: [
          {
            text: '不动声色买下蒙尘铁牌（45 灵石）',
            hint: '大概率捡漏古物或神通心得',
            action: () => {
              if (G.stone < 45) return showToast('灵石不足 45 枚。');
              G.stone -= 45;
              if (Math.random() < 0.72) {
                const prize = pick(['marrow_pill', 'dao_tea', 'tr_flying_sword', 'eq_qiankun_ring', 'manual_zhuyan_art']);
                addItem(prize, 1);
                SFX.play('levelup');
                showToast(`捡到大漏！拂去泥垢竟显出秘宝【${D.ITEMS[prize]?.name || '古宝'}】！`);
              } else {
                const g = gainExp(55);
                showToast(`铁牌虽已灵性散尽，残存剑痕仍助你参悟修为 +${g}。`);
              }
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '怕是江湖骗局，扭头离开',
            action: () => { setDialogue(null); renderAll(); }
          }
        ]
      }),

      // 7. 螳螂捕蝉·野外夺宝两败俱伤
      () => {
        const hp = 210 + G.realmIdx * 110;
        return {
          speaker: '密林血战 · 渔翁之利', asset: ASSETS.elder,
          text: `你在【${locObj.name}】外围撞见两伙修士正为一株千年血灵芝拼得两败俱伤，地上已倒了数具尸体，仅剩一名重伤喘息的独眼狠人握着药匣警惕地盯着你！`,
          choices: [
            {
              text: '趁他病要他命！出手截杀独吞战利品',
              hint: `战斗 HP ${hp} · 业煞+12 · 丰厚战利`,
              action: () => {
                startBattle({
                  name: '重伤夺宝狠人', asset: ASSETS.elder, bg: 'forest', enemyType: 'cultivator',
                  hp, maxHp: hp, atk: 18 + G.realmIdx * 11, expReward: 95 + G.realmIdx * 45, stoneReward: 90 + G.realmIdx * 35,
                  onWin: () => {
                    G.karma = (G.karma || 0) + 12;
                    addItem(pick(['marrow_pill', 'condense_pill', 'longevity_peach']), 1);
                    showToast('杀人夺宝得手！顺走血灵芝灵丹与大批灵石（业煞 +12）！');
                  }
                });
              }
            },
            {
              text: '递上一枚疗伤丹与他平分灵药，不造杀孽',
              hint: '获灵石+45 · 交好散修',
              action: () => {
                G.stone += 45;
                G.fame += 6;
                showToast('独眼修士惊愕片刻，拱手分你一半灵石便迅速远遁。');
                setDialogue(null); saveGame('auto', true); renderAll();
              }
            }
          ]
        };
      },

      // 8. 江湖小组织火并·扶植暗桩
      () => ({
        speaker: `江湖小势力 · ${minorOrg.name}`, asset: ASSETS.elder,
        text: `本地草根小组织【${minorOrg.name}】（专营：${minorOrg.role}）正被大宗门外围爪牙压榨得喘不过气，其头目认出你身手不凡，恳请你出面撑腰立威，愿奉上分红并为你打探五洲暗桩消息！`,
        choices: [
          {
            text: '出面震慑宵小，扶植【' + minorOrg.name + '】（耗 2 日）',
            hint: '获分红灵石+75 · 气运+1 · 小组织效忠',
            action: () => {
              if (window.WORLD_SIM) window.WORLD_SIM.advanceDays(ctx, 2, {});
              G.stone += 75;
              G.luck += 1;
              minorOrg.power = (minorOrg.power || 20) + 15;
              minorOrg.allyPlayer = true;
              if (window.WORLD_SIM) window.WORLD_SIM.pushNews(G, '暗流', `江湖小组织【${minorOrg.name}】得神秘修士撑腰，在【${locObj.name}】声势大振！`);
              showToast(`替【${minorOrg.name}】立威！获分红 75 灵石，日后该组织将为你提供暗线照应！`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '懒得卷入小帮派争端，告辞离去',
            action: () => { setDialogue(null); renderAll(); }
          }
        ]
      }),

      // 9. 古修残魂夺舍诱惑（拼神识反吞百年记忆！）
      () => ({
        speaker: '破损玉佩 · 阴恻残魂', asset: ASSETS.elder,
        text: `你在【${locObj.name}】捡起一枚冰凉古玉，一缕漆黑残魂骤然冲入识海狂笑：“桀桀桀！天赐良躯，老夫被困三千年，今日便借你肉身重生——”\n千钧一发之际，你的泥丸宫神识剧烈震荡！`,
        choices: [
          {
            text: '以自身神识强行反噬炼化残魂！（当前神识 ' + (G.sense || 10) + '）',
            hint: '神识越高越稳 · 成则大获修为与大道记忆',
            action: () => {
              const winChance = Math.min(0.92, 0.45 + (G.sense || 10) * 0.018);
              if (Math.random() < winChance) {
                const dk = pick(daoKeys);
                G.daoBase[dk] = Math.min(100, (G.daoBase[dk] || 0) + 7);
                G.sense += 2;
                const g = gainExp(110 + G.realmIdx * 40);
                SFX.play('levelup');
                showToast(`神识碾压反吞残魂！截获其百年记忆：神识 +2，【${D.SKILL_CATS[dk]?.name}】+7，修为 +${g}！`);
              } else {
                G.hp = Math.max(15, Math.round(G.hp * 0.65));
                showToast('残魂凶悍，虽将其震碎却也被反噬吐血（气血大损）！');
              }
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '果断捏碎古玉，断尾求生',
            hint: '零风险脱身',
            action: () => {
              showToast('当机立断震碎古玉，残魂惨嚎消散。');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          }
        ]
      }),

      // 10. 隐世丹宗游方丹师试药
      () => ({
        speaker: `${alcFac.name} · 游方药师`, asset: ASSETS.elder,
        text: `一位背着青铜药葫芦的【${alcFac.name}】狂热丹师拦住你，两眼放光：“道友！老夫刚按太古残方炼出一炉「未知洗髓异丹」，九成药力温和，一成可能略带火毒——你若替我试药，老夫不仅免费相赠，再补你 60 灵石试药费！”`,
        choices: [
          {
            text: '富贵险中求！一口吞下异丹',
            hint: '75% 洗髓/增寿 · 25% 中毒扣血',
            action: () => {
              G.stone += 60;
              G.factionRep[alcFac.id] = (G.factionRep[alcFac.id] || 0) + 12;
              if (Math.random() < 0.75) {
                G.body += 2;
                G.maxAge += 6;
                SFX.play('levelup');
                showToast(`丹药奇效！根骨 +2，寿元上限 +6 载，获 60 灵石与【${alcFac.name}】好感！`);
              } else {
                G.hp = Math.max(10, Math.round(G.hp * 0.55));
                showToast('火毒攻心口吐黑血（气血折损），好在拿到了 60 灵石与丹宗人情！');
              }
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '拿命试药太冒险，拱手告辞',
            action: () => { setDialogue(null); renderAll(); }
          }
        ]
      })
    ];

    const ev = pick(pool)();
    setDialogue(ev);
    renderAll();
  }

  return { triggerRandomEncounter };
})();
