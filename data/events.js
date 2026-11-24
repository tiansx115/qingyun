window.GAME_DATA = window.GAME_DATA || {};

window.GAME_DATA.FACTIONS = {
  qingyun: { id:'qingyun', name:'青云剑宗', style:'正统剑修', maxStage: 3 },
  wanbao:  { id:'wanbao',  name:'万宝楼·鬼市', style:'鉴宝商道', maxStage: 3 },
  nether:  { id:'nether',  name:'幽冥玄宗', style:'险中求胜', maxStage: 3 }
};

window.GAME_DATA.EVENTS = {
  // ===== 1. 思过崖：退婚与「三年之约」跨年因果链 =====
  runCliffEvent(ctx) {
    const { G, ASSETS, setDialogue, startBattle, gainExp, addItem, showToast, saveGame, renderAll } = ctx;
    const branch = G.flags.divorceBranch;

    // 阶段一：初遇退婚
    if (!branch) {
      setDialogue({
        speaker: '柳若云', asset: ASSETS.sister,
        text: '石桌旁站着一名锦衣女修，将一纸泛黄婚书置于青石之上：“陈公子，昔年祖辈之约已成过往。如今我已入玄天宗内门，仙凡殊途，今日特来解除婚约。”',
        choices: [
          {
            text: '当场撕毁婚书，立下三年之约', hint: '道心+5 声望+15 修为+60',
            action: () => {
              G.flags.divorceEvent = true;
              G.flags.divorceBranch = 'vow';
              G.mind += 5; G.fame += 15;
              const g = gainExp(60);
              showToast(`立下三年之约（第3年·冬赴约），修为 +${g}，道心 +5。`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '“按两家旧约折算一百灵石立据画押，从此两不相欠。”', hint: '灵石+100 口才+2',
            action: () => {
              G.flags.divorceEvent = true;
              G.flags.divorceBranch = 'money';
              G.stone += 100; G.talk += 2;
              showToast('双方立据画押，获补偿灵石 100 枚，口才 +2。');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '“柳家既要毁约，先问过我手中之剑。”', hint: '触发战斗',
            action: () => {
              G.flags.divorceEvent = true;
              G.flags.divorceBranch = 'fight';
              G.fame += 10;
              startBattle({
                name: '柳家护卫统领', asset: ASSETS.elder, bg: 'world_map',
                hp: 140, maxHp: 140, atk: 16, talkDef: 10, expReward: 65, stoneReward: 65,
                onWin: () => {
                  addItem('eq_clear_jade', 1);
                  showToast('击退柳家护卫，对方遗落一枚【清心玉佩】。');
                }
              });
            }
          }
        ]
      });
      return;
    }

    // 阶段三：第 3 年·冬（month >= 36）三年之约赴约
    if (G.month >= 36 && !G.flags.divorceResolved) {
      if (branch === 'vow') {
        setDialogue({
          speaker: '柳若云', asset: ASSETS.sister_fierce,
          text: '三年期至，思过崖上朔风猎猎。柳若云一袭白衣立于石坪之上，周身灵压已近筑基：“陈公子，昔日你撕毁婚书立下三年之约，今日我如期而至。请亮剑吧。”',
          choices: [
            {
              text: '拔剑赴约，以手中之剑了结旧怨', hint: '三年之约决战',
              action: () => {
                startBattle({
                  name: '玄天内门·柳若云', asset: ASSETS.sister_fierce, bg: 'world_map',
                  hp: 340, maxHp: 340, atk: 30, talkDef: 28, expReward: 220, stoneReward: 180,
                  onWin: () => {
                    G.flags.divorceResolved = true;
                    G.fame += 45; G.mind += 8;
                    addItem('eq_ancient_ring', 1);
                    showToast('三年之约大胜！东洲震动，声望 +45，得绝世孤品【太虚古玉戒】。');
                  }
                });
              }
            },
            {
              text: '“三年已过，你我各自问道即可，不必徒增伤亡。”', hint: '道心+8 声望+20',
              action: () => {
                G.flags.divorceResolved = true;
                G.mind += 8; G.fame += 20;
                const g = gainExp(110);
                showToast(`淡然化干戈，修为 +${g}，道心 +8。`);
                setDialogue(null); saveGame('auto', true); renderAll();
              }
            }
          ]
        });
      } else if (branch === 'money') {
        setDialogue({
          speaker: '柳若云', asset: ASSETS.sister_smile,
          text: '石坪上多了两盏温茶。柳若云神色平和：“三年前你干脆利落收下灵石立据画押，家父反倒赞你通透识局。如今你我在东洲各自立足，特备一份薄礼，日后玄天宗与你不妨多作往来。”',
          choices: [
            {
              text: '收下玄天宗客卿玉帖与贺礼', hint: '灵石+160 声望+25 乾坤袋',
              action: () => {
                G.flags.divorceResolved = true;
                G.stone += 160; G.fame += 25; G.talk += 3;
                addItem('eq_qiankun_ring', 1);
                showToast('与柳家平辈论交，获灵石 160 与【乾坤须弥戒】。');
                setDialogue(null); saveGame('auto', true); renderAll();
              }
            },
            {
              text: '趁机提议合股经营东洲丹药商路', hint: '口才>=14 灵石+260',
              action: () => {
                if (G.talk < 14) return showToast('口才需达到 14 方能谈妥合股条款。');
                G.flags.divorceResolved = true;
                G.stone += 260; G.fame += 20;
                showToast('合股契约落定，当场入账 260 枚灵石。');
                setDialogue(null); saveGame('auto', true); renderAll();
              }
            }
          ]
        });
      } else {
        setDialogue({
          speaker: '柳家真传·柳长风', asset: ASSETS.elder,
          text: '三年之期已至，柳家派出内门真传登崖寻晦气：“三年前你伤我柳家护卫，今日便讨个说法！”',
          choices: [
            {
              text: '迎战柳家真传', hint: '实战对决',
              action: () => {
                startBattle({
                  name: '柳家真传·柳长风', asset: ASSETS.elder, bg: 'world_map',
                  hp: 310, maxHp: 310, atk: 28, talkDef: 20, expReward: 200, stoneReward: 160,
                  onWin: () => {
                    G.flags.divorceResolved = true;
                    G.fame += 40;
                    addItem('eq_xuan_armor', 1);
                    showToast('击败柳家真传，恩怨彻底了结，缴获【玄铁内甲】！');
                  }
                });
              }
            },
            { text: '暂避锋芒', action: () => { setDialogue(null); renderAll(); } }
          ]
        });
      }
      return;
    }

    // 阶段二：尚未到三年之约，显示石坪近况
    const remain = Math.max(0, 36 - G.month);
    const tip = G.flags.divorceResolved
      ? '石桌上只余几片青叶，与柳家的三年旧事已尘埃落定。'
      : `石桌上刻痕尚在，距第 3 年·冬旧约期满尚余 ${remain} 月。`;
    showToast(tip);
  },

  // ===== 2. 青云剑宗：正统剑修考核线 =====
  runSectTrial(ctx) {
    const { G, ASSETS, setDialogue, startBattle, advanceTime, gainExp, addItem, showToast, saveGame, renderAll, setAllyExpr } = ctx;
    const stage = G.factions.qingyun || 0;

    if (G.sect !== '青云剑宗' && stage === 0) {
      setDialogue({
        speaker: '林清霜', asset: ASSETS.sister,
        text: '演武场边立着青云剑宗外门试剑碑。林清霜负剑而立：“青云剑宗只重剑心与实绩。若有意入我山门，可先与我行拜师入门之礼，待夏令外门试剑再凭本事争锋。”',
        choices: [
          {
            text: '当即行礼，拜入青云剑宗外门', hint: '获《青云吐纳诀》与制式剑',
            action: () => {
              G.sect = '青云剑宗';
              G.factions.qingyun = 1;
              G.allies.sister.bond += 15; G.fame += 10;
              if (!G.ownedHeartArts.includes('qingyun_breath')) G.ownedHeartArts.push('qingyun_breath');
              if (!G.skills.includes('sister_frost')) G.skills.push('sister_frost');
              addItem('eq_qingyun_sword', 1);
              addItem('tr_flying_sword', 1);
              setAllyExpr('sister', 'smile');
              showToast('正式拜入青云剑宗！获【青云制式剑】与外物法宝【悬浮青霜飞剑】。');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          { text: '暂作散修游历东洲', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return;
    }

    // 阶段一：第 1 年·夏（month >= 4）外门试剑大比
    if (stage <= 1) {
      if (G.month < 4) {
        setDialogue({
          speaker: '青云外门执事', asset: ASSETS.elder,
          text: `演武广场已开始架设剑台。执事核对名册道：“外门试剑大比定于第 1 年·夏（第 4 月，尚余 ${4 - G.month} 月）。眼下你可先在剑台自行练剑热身。”`,
          choices: [
            {
              text: '在演武场潜心练剑一月', hint: '+1月 修为+42 根骨+1',
              action: () => {
                advanceTime(1); G.body += 1;
                const g = gainExp(42);
                showToast(`演武场练剑一月，修为 +${g}，根骨 +1。`);
                setDialogue(null); saveGame('auto', true); renderAll();
              }
            },
            { text: '暂且离开', action: () => { setDialogue(null); renderAll(); } }
          ]
        });
        return;
      }

      setDialogue({
        speaker: '外门试剑大比', asset: ASSETS.sister,
        text: '第 1 年·夏，青云剑宗外门试剑钟声长鸣。演武台上剑气纵横，外门首席执事弟子周铭已连胜三场，台下外门弟子议论纷纷，外围甚至有人暗设盘口。你打算如何应对此次大比？',
        choices: [
          {
            text: '登台亮剑，与外门首席周铭正面决胜', hint: '胜得玄品【寒霜灵剑】',
            action: () => {
              startBattle({
                name: '外门执事弟子·周铭', asset: ASSETS.elder, bg: 'sect_plaza',
                hp: 210, maxHp: 210, atk: 21, talkDef: 16, expReward: 110, stoneReward: 70,
                onWin: () => {
                  G.factions.qingyun = 2;
                  G.fame += 25; G.allies.sister.bond += 12;
                  addItem('eq_frost_blade', 1);
                  setAllyExpr('sister', 'smile');
                  showToast('外门试剑夺魁！晋升内门候补，获赏【寒霜灵剑】！');
                }
              });
            }
          },
          {
            text: '细察周铭剑路破绽，以守代攻稳取前三名次', hint: '悟性>=13 稳拿内门资格',
            action: () => {
              if (G.wit < 13) return showToast('悟性不足 13，一时难以看穿其剑路破绽。');
              advanceTime(1);
              G.factions.qingyun = 2;
              G.fame += 18; G.stone += 75;
              const g = gainExp(95);
              addItem('eq_cloud_robe', 1);
              showToast(`以巧破力位列前三！修为 +${g}，获赏【流云青衫】与 75 灵石。`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '止步八强保留实力，顺手在场外盘口押注自己看好的黑马', hint: '务实反套路 赚灵石',
            action: () => {
              advanceTime(1);
              G.factions.qingyun = 2;
              const earn = 95 + G.luck * 3;
              G.stone += earn; G.talk += 1;
              const g = gainExp(55);
              showToast(`稳进内门候补且盘口大捷，净赚 ${earn} 灵石，修为 +${g}。`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          }
        ]
      });
      return;
    }

    // 阶段二：云海剑阵护山事件（与幽冥玄宗线联动）
    if (stage === 2) {
      const hasNether = (G.factions.nether || 0) >= 1;
      const choices = [
        {
          text: '与林清霜联手布阵，正面迎战幽冥暗探', hint: '青云线终局 获丰厚赏赐',
          action: () => {
            setAllyExpr('sister', 'fierce');
            startBattle({
              name: '幽冥玄宗暗探·黑煞', asset: ASSETS.wolf_boss, bg: 'sect_plaza',
              hp: 280, maxHp: 280, atk: 26, talkDef: 25, expReward: 170, stoneReward: 120,
              onWin: () => {
                G.factions.qingyun = 3;
                G.fame += 35; G.allies.sister.bond += 18;
                addItem('eq_xuan_armor', 1);
                setAllyExpr('sister', 'smile');
                showToast('护山大功告成！获封青云内门真传，赐【玄铁内甲】。');
              }
            });
          }
        }
      ];
      if (hasNether) {
        choices.push({
          text: '【双面暗手】暗中示警令幽冥暗探撤走，同时向青云报功两头收利', hint: '灵石+180 魔道进度+1',
          action: () => {
            advanceTime(1);
            G.factions.qingyun = 3;
            G.factions.nether = Math.max(G.factions.nether || 0, 2);
            G.stone += 180; G.talk += 3;
            showToast('两头周旋滴水不漏，暗得 180 灵石且保住双方信任。');
            setDialogue(null); saveGame('auto', true); renderAll();
          }
        });
      }
      choices.push({ text: '暂先整备再行应对', action: () => { setDialogue(null); renderAll(); } });

      setDialogue({
        speaker: '林清霜', asset: ASSETS.sister_fierce,
        text: '暮色压低云海，护山剑阵边缘灵光忽明忽暗。林清霜按剑低声道：“后山灵脉外发现幽冥玄宗的暗探印记，师尊闭关未出，你可愿随我截杀来敌？”',
        choices
      });
      return;
    }

    showToast('你已是青云剑宗内门真传，剑台之上无人敢轻视。');
  },

  // ===== 3. 万宝楼 / 鬼市：沈云舒鉴宝与岁末大拍线 =====
  runMarketFaction(ctx) {
    const { G, ASSETS, setDialogue, advanceTime, gainExp, addItem, showToast, saveGame, renderAll } = ctx;
    const stage = G.factions.wanbao || 0;

    // 阶段一：结识鬼市女掌柜沈云舒
    if (stage === 0) {
      setDialogue({
        speaker: '沈云舒（万宝楼掌柜）', asset: ASSETS.sister,
        text: '幽暗灯笼下，一位素衣执扇的女修打量着你：“小友近日在鬼市几笔买卖颇有眼力。案上这两块古玉，一块浸过百年阴气，一块是新近药水做旧。若能一眼辨出，万宝楼便给你发一块验货令。”',
        choices: [
          {
            text: '细观玉纹沁色，指出左玉断口灵气自然内敛乃真品', hint: '悟性/口才验货 获聚宝灵佩',
            action: () => {
              G.factions.wanbao = 1;
              G.talk += 2; G.luck += 1;
              addItem('eq_merchant_jade', 1);
              showToast('眼力过关！获万宝楼验货令与【聚宝灵佩】，解锁鬼市高阶装备坊。');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '“真假固然重要，但若把做旧那块卖给爱面子的世家公子，利润更高。”', hint: '反套路商道 灵石+65 聚宝灵佩',
            action: () => {
              G.factions.wanbao = 1;
              G.stone += 65; G.talk += 3;
              addItem('eq_merchant_jade', 1);
              showToast('沈云舒轻笑颔首，赠你【聚宝灵佩】与 65 灵石定金。');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          { text: '拱手辞谢，只做寻常散客', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return;
    }

    // 阶段二：第 1 年·冬（month >= 10）鬼市岁末鉴宝大拍
    if (stage === 1) {
      if (G.month < 10) {
        setDialogue({
          speaker: '沈云舒', asset: ASSETS.sister,
          text: `“岁末鉴宝大拍定于第 1 年·冬（第 10 月，尚余 ${10 - G.month} 月）。届时会流出古修玄铁内甲与高阶心法残卷，你不妨先多备些灵石。”`,
          choices: [
            { text: '前往鬼市装备坊挑拣货色', hint: '装备交易', action: () => ctx.openEquipShop() },
            { text: '改日再来', action: () => { setDialogue(null); renderAll(); } }
          ]
        });
        return;
      }

      setDialogue({
        speaker: '鬼市岁末鉴宝大拍', asset: ASSETS.sister,
        text: '第 1 年·冬，鬼市石窟灯火通明。沈云舒轻敲紫檀木槌，三件压轴拍品依次呈上：玄品【玄铁内甲】、万宝楼秘传《万宝凝神录》配【乾坤储物袋】，以及一只被世家子弟盯上的疑似假古匣。',
        choices: [
          {
            text: '以 110 灵石拍下玄品【玄铁内甲】', hint: '原价155 护体极佳',
            action: () => {
              if (G.stone < 110) return showToast('灵石不足 110 枚。');
              advanceTime(1); G.stone -= 110; G.factions.wanbao = 2;
              addItem('eq_xuan_armor', 1);
              showToast('拍得【玄铁内甲】！已存入乾坤行囊。');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '以 95 灵石拍下《万宝凝神录》与【乾坤储物袋】', hint: '新心法 + 20格行囊',
            action: () => {
              if (G.stone < 95) return showToast('灵石不足 95 枚。');
              advanceTime(1); G.stone -= 95; G.factions.wanbao = 2;
              if (!G.ownedHeartArts.includes('wanbao_manual')) G.ownedHeartArts.push('wanbao_manual');
              addItem('eq_qiankun_ring', 1);
              showToast('习得心法《万宝凝神录》，并获【乾坤须弥戒】！');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '不动声色抬价诱使世家子弟高价买走假匣，按约分成', hint: '反套路 净赚135灵石',
            action: () => {
              advanceTime(1); G.factions.wanbao = 2;
              G.stone += 135; G.talk += 3;
              showToast('世家公子高价接盘，沈云舒按约奉上 135 灵石酬劳。');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          { text: '暂不出手，先逛装备坊', action: () => ctx.openEquipShop() }
        ]
      });
      return;
    }

    // 阶段三：秘境潮汐商路合股
    if (stage === 2) {
      if (G.month < 16) {
        setDialogue({
          speaker: '沈云舒', asset: ASSETS.sister,
          text: `“万妖古林秘境潮汐将在第 2 年·夏（第 16 月，尚余 ${16 - G.month} 月）开启，届时东洲丹药与灵靴必定大涨。现在可先去装备坊备货。”`,
          choices: [
            { text: '逛鬼市装备坊', action: () => ctx.openEquipShop() },
            { text: '告辞', action: () => { setDialogue(null); renderAll(); } }
          ]
        });
        return;
      }

      setDialogue({
        speaker: '沈云舒', asset: ASSETS.sister_smile,
        text: '万妖古林灵潮翻涌，四方散修云集。沈云舒递来一份契约：“万宝楼已备妥三百瓶回春丹与避雷阵盘。你既熟知谷口行情，此番是随我高价放货大赚一笔，还是平价济助散修博个好名声？”',
        choices: [
          {
            text: '合股高价放货，按三成利润分红', hint: '灵石+240 获【幽影步履】',
            action: () => {
              advanceTime(1); G.factions.wanbao = 3;
              G.stone += 240; G.luck += 2;
              addItem('eq_shadow_boots', 1);
              showToast('商路大捷！分红 240 灵石，沈云舒另赠玄品【幽影步履】。');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '平价供给散修丹药，换取东洲人脉与口碑', hint: '声望+40 气运+4 灵石+90',
            action: () => {
              advanceTime(1); G.factions.wanbao = 3;
              G.fame += 40; G.luck += 4; G.stone += 90;
              const g = gainExp(90);
              showToast(`散修齐声称道！声望 +40，气运 +4，修为 +${g}，结余 90 灵石。`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          }
        ]
      });
      return;
    }

    // 终局后直接作为高阶伙伴/商行入口
    setDialogue({
      speaker: '沈云舒', asset: ASSETS.sister_smile,
      text: '“你如今已是万宝楼大客卿，鬼市装备坊随时向你敞开。若有顺手的古修奇物，尽管拿来周转。”',
      choices: [
        { text: '进入鬼市装备坊', action: () => ctx.openEquipShop() },
        { text: '领本月万宝楼分红（+45灵石，+1月）', hint: '客卿权益', action: () => {
          advanceTime(1); G.stone += 45; showToast('领取万宝楼月度分红 45 灵石。');
          setDialogue(null); saveGame('auto', true); renderAll();
        }},
        { text: '告辞', action: () => { setDialogue(null); renderAll(); } }
      ]
    });
  },

  // ===== 4. 幽冥玄宗：险中求胜魔道线 =====
  runNetherPath(ctx) {
    const { G, ASSETS, setDialogue, startBattle, advanceTime, gainExp, addItem, showToast, saveGame, renderAll } = ctx;
    const stage = G.factions.nether || 0;

    if (stage === 0) {
      setDialogue({
        speaker: '墨离（幽冥接引使）', asset: ASSETS.elder,
        text: '鬼市最深处的阴暗石巷里，一名黑袍修士拦住你的去路，指尖绕着一缕幽黑灵火：“名门正派讲资历排辈分，炼气熬到白头也难摸筑基门槛。我幽冥玄宗只论强弱，接下这枚幽冥令，秘传魔功与玄品利刃皆可立得。”',
        choices: [
          {
            text: '接下幽冥令，修习《幽冥噬魂诀》与《幽冥裂魂爪》', hint: '高攻速修 道心-2',
            action: () => {
              G.factions.nether = 1;
              if (G.sect === '散修') G.sect = '幽冥玄宗';
              G.mind = Math.max(1, G.mind - 2);
              if (!G.ownedHeartArts.includes('nether_sutra')) G.ownedHeartArts.push('nether_sutra');
              if (!G.skills.includes('blood_cleave')) G.skills.push('blood_cleave');
              const g = gainExp(75);
              showToast(`踏入幽冥暗线！习得《幽冥血煞诀》与《血煞裂空斩》，修为 +${g}。`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '假意敷衍，套出魔宗行踪后索要封口灵石', hint: '口才+2 灵石+45',
            action: () => {
              G.talk += 2; G.stone += 45;
              showToast('黑袍人冷哼一声抛下 45 灵石隐入暗巷。');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '正邪不两立，当场拔剑驱逐魔修', hint: '战斗 声望+20',
            action: () => {
              startBattle({
                name: '幽冥接引使·墨离', asset: ASSETS.elder, bg: 'market',
                hp: 195, maxHp: 195, atk: 22, talkDef: 18, expReward: 95, stoneReward: 75,
                onWin: () => {
                  G.fame += 20; G.mind += 3;
                  showToast('击退墨离化身，东洲正道声望 +20，道心 +3。');
                }
              });
            }
          }
        ]
      });
      return;
    }

    if (stage === 1) {
      setDialogue({
        speaker: '墨离', asset: ASSETS.elder,
        text: '“既入幽冥门下，须过夺魂试炼。击败这座煞气傀儡，宗内便赐你镇魂法宝【幽冥摄魂铃】与玄品兵甲。”',
        choices: [
          {
            text: '迎战夺魂煞傀', hint: '得【幽冥摄魂铃】+【幽冥噬魂刃】',
            action: () => {
              startBattle({
                name: '幽冥夺魂煞傀', asset: ASSETS.wolf_boss, bg: 'market',
                hp: 255, maxHp: 255, atk: 25, talkDef: 999, expReward: 145, stoneReward: 100,
                onWin: () => {
                  G.factions.nether = 2;
                  addItem('tr_soul_bell', 1);
                  addItem('eq_nether_blade', 1);
                  showToast('通过夺魂试炼！获外物法宝【幽冥摄魂铃】与【幽冥噬魂刃】。');
                }
              });
            }
          },
          { text: '暂先整备装备', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return;
    }

    if (stage === 2) {
      setDialogue({
        speaker: '墨离', asset: ASSETS.elder,
        text: '“宗门已定策夜袭青云外门灵脉核心。若你出手截断灵脉，便晋升幽冥亲传，赏血煞法袍与两百灵石；若你另有盘算，不妨早做决断。”',
        choices: [
          {
            text: '助幽冥玄宗强夺灵脉核心（彻底入魔宗亲传）', hint: '修为+180 血煞法袍 灵石+200',
            action: () => {
              advanceTime(1);
              G.factions.nether = 3;
              G.sect = '幽冥玄宗';
              G.stone += 200; G.fame = Math.max(0, G.fame - 15);
              const g = gainExp(180);
              addItem('eq_blood_cloak', 1);
              showToast(`灵脉核心入手！晋升幽冥亲传，修为 +${g}，获【血煞法袍】。`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '暗中密报青云设伏，借机顺走魔宗物资两头得利', hint: '反套路 灵石+160 声望+25',
            action: () => {
              advanceTime(1);
              G.factions.nether = 3;
              G.stone += 160; G.fame += 25; G.talk += 3;
              addItem('eq_blood_cloak', 1);
              showToast('密报立功且顺走战利品，获 160 灵石与【血煞法袍】。');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          { text: '容我再斟酌一二', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return;
    }

    showToast('幽冥暗巷已尽数归你调遣，可在鬼市深处自行吐纳修魔。');
  },

  // ===== 5. 万妖古林：古修洞府多阶段秘境 =====
  runForestRuin(ctx) {
    const { G, ASSETS, setDialogue, startBattle, advanceTime, gainExp, addItem, showToast, saveGame, renderAll } = ctx;
    const stage = G.flags.forestRuinStage || 0;

    if (stage === 0) {
      setDialogue({
        speaker: '古修洞府石门', asset: ASSETS.wolf_boss,
        text: '古松遮天蔽日，青苔石门前伏着一头赤瞳妖狼。石门缝隙中透出阵阵精纯灵气。',
        choices: [
          {
            text: '拔剑斩杀护洞赤瞳妖狼，打开外殿石门', hint: '胜后解锁石室禁制',
            action: () => {
              startBattle({
                name: '护洞赤瞳妖狼', asset: ASSETS.wolf_boss, bg: 'forest',
                hp: 175, maxHp: 175, atk: 20, talkDef: 12, expReward: 95, stoneReward: 65,
                onWin: () => {
                  G.flags.forestRuinStage = 1;
                  addItem('eq_wind_boots', 1);
                  showToast('击退赤瞳妖狼！石门已开，在外殿拾得【疾风灵靴】。');
                }
              });
            }
          },
          {
            text: '等第 2 年·夏秘境潮汐时趁各派混战偷溜入内', hint: '需第16月后 免战潜入',
            action: () => {
              if (G.month < 16) return showToast(`秘境潮汐尚未至（第 16 月开启，当前第 ${G.month} 月）。`);
              advanceTime(1); G.flags.forestRuinStage = 1; G.luck += 2;
              showToast('趁各派修士与妖兽混战，你悄然潜入洞府外殿！');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          { text: '暂先退回谷口', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return;
    }

    if (stage === 1) {
      setDialogue({
        speaker: '古修内殿·五行禁制', asset: ASSETS.elder,
        text: '洞府深处立着一座青铜丹台，四周铭刻五行流转阵纹。石案之上隐约可见一枚古玉剑佩与一只温玉紫金丹葫，然而阵法尚有余威。',
        choices: [
          {
            text: '以悟性推演五行生克，无伤巧破禁制', hint: '悟性>=14 得剑心佩+紫金丹葫',
            action: () => {
              if (G.wit < 14) return showToast('悟性不足 14，难以看破五行阵眼。');
              advanceTime(1); G.flags.forestRuinStage = 2;
              addItem('eq_uniq_venom_eye', 1);
              addItem('eq_ancient_ring', 1);
              const g = gainExp(120);
              showToast(`巧破古阵！修为 +${g}，得绝世孤品【蚀骨妖瞳】与【太虚古玉戒】！`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '强行以剑气轰破禁制（损耗三成气血）', hint: '无门槛 夺取双玄品',
            action: () => {
              advanceTime(1); G.flags.forestRuinStage = 2;
              G.hp = Math.max(20, Math.floor(G.hp * 0.7));
              addItem('eq_uniq_venom_eye', 1);
              addItem('eq_ancient_ring', 1);
              showToast('强破古阵略受震荡，成功夺得绝世孤品【蚀骨妖瞳】与【太虚古玉戒】！');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          { text: '暂不触动禁制', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return;
    }

    // 探索完毕后可继续在洞府深处采药/切磋
    advanceTime(1);
    const g = gainExp(55);
    G.stone += 40;
    showToast(`在古修洞府残余灵脉中采药静修一月，修为 +${g}，灵石 +40。`);
    saveGame('auto', true); renderAll();
  }
};
