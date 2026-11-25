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
            text: '当场撕毁婚书，立下三年之约', hint: '神识+5 声望+15 修为+60',
            action: () => {
              G.flags.divorceEvent = true;
              G.flags.divorceBranch = 'vow';
              G.sense += 5; G.fame += 15;
              const g = gainExp(60);
              showToast(`立下三年之约（第3年·冬赴约），修为 +${g}，神识 +5。`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '“按两家旧约折算一百灵石立据画押，从此两不相欠。”', hint: '灵石+100 神识+2',
            action: () => {
              G.flags.divorceEvent = true;
              G.flags.divorceBranch = 'money';
              G.stone += 100; G.sense += 2;
              showToast('双方立据画押，获补偿灵石 100 枚，神识 +2。');
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
                  showToast('击退柳家护卫，对方遗落一枚【宁心温玉佩】。');
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
                    G.fame += 45; G.sense += 8;
                    addItem('eq_ancient_ring', 1);
                    showToast('三年之约大胜！东洲震动，声望 +45，得绝世孤品【太虚洞天戒】。');
                  }
                });
              }
            },
            {
              text: '“三年已过，你我各自问道即可，不必徒增伤亡。”', hint: '神识+8 声望+20',
              action: () => {
                G.flags.divorceResolved = true;
                G.sense += 8; G.fame += 20;
                const g = gainExp(110);
                showToast(`淡然化干戈，修为 +${g}，神识 +8。`);
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
                G.stone += 160; G.fame += 25; G.sense += 3;
                addItem('eq_qiankun_ring', 1);
                showToast('与柳家平辈论交，获灵石 160 与【乾坤须弥戒】。');
                setDialogue(null); saveGame('auto', true); renderAll();
              }
            },
            {
              text: '趁机提议合股经营东洲丹药商路', hint: '神识>=14 灵石+260',
              action: () => {
                if (G.sense < 14) return showToast('神识需达到 14 方能谈妥合股条款。');
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
                    showToast('击败柳家真传，恩怨彻底了结，缴获【戊土玄圭宝甲】！');
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
              showToast('正式拜入青云剑宗！获【青云制式剑】与外物法宝【青霜子母飞剑】。');
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
              G.stone += earn; G.sense += 1;
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
                showToast('护山大功告成！获封青云内门真传，赐【戊土玄圭宝甲】。');
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
            G.stone += 180; G.sense += 3;
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
              G.sense += 2; G.luck += 1;
              addItem('eq_merchant_jade', 1);
              showToast('眼力过关！获万宝楼验货令与【聚宝灵佩】，解锁鬼市高阶装备坊。');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '“真假固然重要，但若把做旧那块卖给爱面子的世家公子，利润更高。”', hint: '反套路商道 灵石+65 聚宝灵佩',
            action: () => {
              G.factions.wanbao = 1;
              G.stone += 65; G.sense += 3;
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
          text: `“岁末鉴宝大拍定于第 1 年·冬（第 10 月，尚余 ${10 - G.month} 月）。届时会流出古修戊土玄圭宝甲与高阶心法残卷，你不妨先多备些灵石。”`,
          choices: [
            { text: '前往鬼市装备坊挑拣货色', hint: '装备交易', action: () => ctx.openEquipShop() },
            { text: '改日再来', action: () => { setDialogue(null); renderAll(); } }
          ]
        });
        return;
      }

      setDialogue({
        speaker: '鬼市岁末鉴宝大拍', asset: ASSETS.sister,
        text: '第 1 年·冬，鬼市石窟灯火通明。沈云舒轻敲紫檀木槌，三件压轴拍品依次呈上：玄品【戊土玄圭宝甲】、万宝楼秘传《万宝凝神录》配【乾坤储物袋】，以及一只被世家子弟盯上的疑似假古匣。',
        choices: [
          {
            text: '以 110 灵石拍下玄品【戊土玄圭宝甲】', hint: '原价155 护体极佳',
            action: () => {
              if (G.stone < 110) return showToast('灵石不足 110 枚。');
              advanceTime(1); G.stone -= 110; G.factions.wanbao = 2;
              addItem('eq_xuan_armor', 1);
              showToast('拍得【戊土玄圭宝甲】！已存入乾坤行囊。');
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
              G.stone += 135; G.sense += 3;
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
              G.sense = Math.max(1, G.sense - 2);
              if (!G.ownedHeartArts.includes('nether_sutra')) G.ownedHeartArts.push('nether_sutra');
              if (!G.skills.includes('blood_cleave')) G.skills.push('blood_cleave');
              const g = gainExp(75);
              showToast(`踏入幽冥暗线！习得《幽冥血煞诀》与《血煞裂空斩》，修为 +${g}。`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '假意敷衍，套出魔宗行踪后索要封口灵石', hint: '神识+2 灵石+45',
            action: () => {
              G.sense += 2; G.stone += 45;
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
                  G.fame += 20; G.sense += 3;
                  showToast('击退墨离化身，东洲正道声望 +20，神识 +3。');
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
        text: '“既入幽冥门下，须过夺魂试炼。击败这座煞气傀儡，宗内便赐你镇魂法宝【太古摄魂金铃】与玄品兵甲。”',
        choices: [
          {
            text: '迎战夺魂煞傀', hint: '得【太古摄魂金铃】+【幽冥噬魂刃】',
            action: () => {
              startBattle({
                name: '幽冥夺魂煞傀', asset: ASSETS.wolf_boss, bg: 'market',
                hp: 255, maxHp: 255, atk: 25, talkDef: 999, expReward: 145, stoneReward: 100,
                onWin: () => {
                  G.factions.nether = 2;
                  addItem('tr_soul_bell', 1);
                  addItem('eq_nether_blade', 1);
                  showToast('通过夺魂试炼！获外物法宝【太古摄魂金铃】与【幽冥噬魂刃】。');
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
              G.stone += 160; G.fame += 25; G.sense += 3;
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
              showToast(`巧破古阵！修为 +${g}，得绝世孤品【破妄妖瞳玉】与【太虚洞天戒】！`);
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
              showToast('强破古阵略受震荡，成功夺得绝世孤品【破妄妖瞳玉】与【太虚洞天戒】！');
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
  },

  // ===== 6. 筑基长线：东洲宗门大比（三轮淘汰 Boss 战）=====
  runGrandTourney(ctx) {
    const { G, ASSETS, setDialogue, startBattle, gainExp, addItem, showToast, saveGame, renderAll } = ctx;
    const round = G.flags.tourneyRound || 0;
    if (round >= 3) {
      setDialogue({
        speaker: '东洲大比执事', asset: ASSETS.elder,
        text: '“陈道友已在东洲宗门大比力压群雄夺得魁首，如今演武台尚可供你与各宗真传切磋磨砺仙道造诣。”',
        choices: [
          {
            text: '登台与各宗真传切磋（磨砺招式熟练度）', hint: '实战切磋',
            action: () => {
              startBattle({
                name: '东洲真传·剑影', asset: ASSETS.sister_fierce, bg: 'sect_plaza',
                hp: 420, maxHp: 420, atk: 34, expReward: 160, stoneReward: 95,
                onWin: () => showToast('演武台切磋获胜！招式熟练度精进，获灵石 95。')
              });
            }
          },
          { text: '暂不登台', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return;
    }

    const opponents = [
      {
        title: '初赛 · 玄天宗剑子「顾惊鸿」',
        intro: '青云演武台上剑气纵横。玄天宗真传顾惊鸿负手而立：“青云门下久不出奇才，今日大比初战，且让我称称你的斤两。”',
        enemy: { name:'玄天剑子·顾惊鸿', asset:ASSETS.sister_fierce, bg:'sect_plaza', hp:320, maxHp:320, atk:28, expReward:160, stoneReward:90 },
        reward: () => { addItem('eq_qingyun_crown', 1); showToast('大比初赛胜出！获【紫金太白道冠】与 90 灵石！'); }
      },
      {
        title: '半决 · 焚天谷刀魁「厉狂砂」',
        intro: '半决赛擂台上热浪滚滚，焚天谷刀魁厉狂砂扛着赤铁重刀大步登台：“少拿花哨剑招糊弄老子，接我三刀不退再谈魁首！”',
        enemy: { name:'焚天刀魁·厉狂砂', asset:ASSETS.elder, bg:'sect_plaza', hp:460, maxHp:460, atk:36, expReward:230, stoneReward:140 },
        reward: () => { addItem('tr_flying_sword', 1); showToast('力克焚天刀魁晋级决赛！获玄品外物法宝【青霜子母飞剑】！'); }
      },
      {
        title: '决战 · 东洲魁首「剑尊亲传·陆沉舟」',
        intro: '云海钟鸣三声，东洲百宗齐聚观礼。上届魁首陆沉舟剑未出鞘已压得台下众人屏息：“你一路连克强敌，值得我出全剑。”',
        enemy: { name:'剑尊亲传·陆沉舟', asset:ASSETS.sister_fierce, bg:'sect_plaza', hp:640, maxHp:640, atk:44, expReward:360, stoneReward:260 },
        reward: () => {
          G.fame += 60; G.sense += 4;
          addItem('eq_uniq_sky_rod', 1);
          if (!G.skills.includes('star_sword_rain')) {
            G.skills.push('star_sword_rain');
            G.skillProf.star_sword_rain = { lv: 1, exp: 0 };
          }
          showToast('夺得东洲宗门大比魁首！声望 +60，神识 +4，得孤品【乾坤量天尺】并领悟【离火燎原剑气】！');
        }
      }
    ];
    const cur = opponents[round];
    setDialogue({
      speaker: cur.title, asset: cur.enemy.asset,
      text: `${cur.intro}（推荐境界：炼气九层～筑基期 · 当前进度 ${round + 1}/3）`,
      choices: [
        {
          text: `登台迎战【${cur.enemy.name}】`, hint: `HP ${cur.enemy.hp} · 攻 ${cur.enemy.atk}`,
          action: () => {
            startBattle({
              ...cur.enemy,
              onWin: () => {
                G.flags.tourneyRound = round + 1;
                cur.reward();
                saveGame('auto', true);
              }
            });
          }
        },
        { text: '暂作整备，稍后再战', action: () => { setDialogue(null); renderAll(); } }
      ]
    });
  },

  // ===== 7. 金丹长线：幽冥魔潮入侵（多路线策略 + 血魔将 Boss）=====
  runDemonTide(ctx) {
    const { G, ASSETS, setDialogue, startBattle, gainExp, addItem, advanceTime, showToast, saveGame, renderAll } = ctx;
    const stage = G.flags.demonTideStage || 0;
    if (stage >= 2) {
      showToast('万妖古林深处的幽冥血祭大阵已被彻底摧毁，东洲魔患暂平。');
      return;
    }

    if (stage === 0) {
      setDialogue({
        speaker: '万妖古林 · 血雾警讯', asset: ASSETS.wolf_boss,
        text: '古林深处冲起三道暗红血柱，幽冥魔宗借秘境潮汐强开血祭大阵，数头妖兽发狂奔逃。你须择一策破局（推荐境界：筑基～金丹期）：',
        choices: [
          {
            text: '以高超神识潜入阵眼，暗中毁去血祭灵旗', hint: '神识>=22 削弱Boss两成血量',
            action: () => {
              if ((G.sense || 10) < 22) return showToast('神识需达到 22 方能避开魔修巡哨潜入阵眼。');
              advanceTime(1); G.flags.demonTideStage = 1; G.flags.demonWeakened = true;
              const g = gainExp(140);
              showToast(`神识潜行成功！毁去三面血旗，血魔将实力大损，修为 +${g}！`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '直闯外围血坛，强杀幽冥魔宗先锋队', hint: '正面硬闯 实战',
            action: () => {
              startBattle({
                name: '幽冥血卫统领', asset: ASSETS.elder, bg: 'forest',
                hp: 520, maxHp: 520, atk: 42, expReward: 240, stoneReward: 150,
                onWin: () => {
                  G.flags.demonTideStage = 1;
                  addItem('tr_soul_bell', 1);
                  showToast('击溃幽冥先锋！缴获外物法宝【太古摄魂金铃】，直逼血魔将主坛！');
                  saveGame('auto', true);
                }
              });
            }
          },
          { text: '暂避锋芒，先提升修为', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return;
    }

    // stage === 1: 决战幽冥血魔将
    const weakened = Boolean(G.flags.demonWeakened);
    const bossHp = weakened ? 740 : 920;
    setDialogue({
      speaker: '幽冥血魔将 · 噬渊', asset: ASSETS.wolf_boss,
      text: `血雾翻腾的古祭坛中央，身披玄铁魔甲的血魔将缓缓起身：“敢坏我幽冥玄宗百年大计${weakened ? '，还敢暗毁我血旗' : ''}——拿命来填阵吧！”`,
      choices: [
        {
          text: '联手道友与灵兽，正面力斩幽冥血魔将！', hint: `金丹级Boss · HP ${bossHp}`,
          action: () => {
            startBattle({
              name: '幽冥血魔将·噬渊', asset: ASSETS.wolf_boss, bg: 'forest',
              hp: bossHp, maxHp: bossHp, atk: weakened ? 48 : 56, expReward: 480, stoneReward: 340,
              onWin: () => {
                G.flags.demonTideStage = 2;
                G.fame += 80; G.sense += 5;
                addItem('eq_uniq_undying', 1);
                addItem('marrow_pill', 2);
                showToast('斩杀幽冥血魔将！东洲举宗同庆，声望 +80，神识 +5，得孤品【涅槃不灭衣】与洗髓丹×2！');
                saveGame('auto', true);
              }
            });
          }
        },
        { text: '暂退整备丹药与构筑', action: () => { setDialogue(null); renderAll(); } }
      ]
    });
  },

  // ===== 8. 元婴长线：九霄太古秘境（终极双 Boss 试炼）=====
  runAncientRealm(ctx) {
    const { G, ASSETS, setDialogue, startBattle, addItem, showToast, saveGame, renderAll } = ctx;
    const stage = G.flags.ancientRealmStage || 0;
    if (stage >= 2) {
      showToast('九霄太古秘境已被你彻底通关，太古剑意常驻丹田，可随时前往渡劫台飞升结算。');
      return;
    }

    if (stage === 0) {
      setDialogue({
        speaker: '九霄太古秘境 · 天枢守卫', asset: ASSETS.elder,
        text: '渡劫台穹顶裂开一道星河古门，一尊通体玄金的太古剑傀步出星雾：“凡尘修士欲踏元婴大道，须先过我天枢剑阵。”（推荐境界：金丹～元婴期）',
        choices: [
          {
            text: '拔兵迎战【太古剑傀·天枢】', hint: '终极试炼·壹 (HP 1180)',
            action: () => {
              startBattle({
                name: '太古剑傀·天枢', asset: ASSETS.elder, bg: 'world_map',
                hp: 1180, maxHp: 1180, atk: 62, expReward: 620, stoneReward: 420,
                onWin: () => {
                  G.flags.ancientRealmStage = 1;
                  G.body += 4; G.speed += 4; G.sense += 4;
                  addItem('eq_ancient_ring', 1);
                  showToast('击碎太古剑傀！根骨/遁速/神识各 +4，得【太虚洞天戒】，太古核心已开启！');
                  saveGame('auto', true);
                }
              });
            }
          },
          { text: '尚需闭关沉淀，改日再来', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return;
    }

    setDialogue({
      speaker: '九霄雷劫化身 · 太古天意', asset: ASSETS.wolf_boss,
      text: '秘境最深处雷海翻涌，九霄天雷凝聚为万丈法相：“破此法相，东洲再无敌手，诸天大道任尔逍遥！”',
      choices: [
        {
          text: '以平生所学六道神通，迎战九霄雷劫化身！', hint: '终极试炼·贰 (HP 1680)',
          action: () => {
            startBattle({
              name: '九霄雷劫化身', asset: ASSETS.wolf_boss, bg: 'world_map',
              hp: 1680, maxHp: 1680, atk: 74, expReward: 950, stoneReward: 680,
              onWin: () => {
                G.flags.ancientRealmStage = 2;
                G.fame += 150;
                addItem('eq_uniq_venom_eye', 1);
                addItem('condense_pill', 3);
                showToast('斩破九霄雷劫化身！威震诸天，声望 +150，获孤品【破妄妖瞳玉】与破境凝元丹×3！');
                saveGame('auto', true);
              }
            });
          }
        },
        { text: '暂退调息', action: () => { setDialogue(null); renderAll(); } }
      ]
    });
  },

  // ===== 9. 九州四域宏大世界秘境、悟道古碑与跨州试炼总路由 =====
  runWorldHotspot(hid, ctx) {
    const { G, D, ASSETS, setDialogue, startBattle, gainExp, addItem, advanceTime, getCatMastery, showToast, saveGame, renderAll, buyItem } = ctx;
    G.daoBase = G.daoBase || {};

    const addDaoPts = (cid, pts) => {
      const cur = getCatMastery ? getCatMastery(cid) : (G.daoBase[cid] || 0);
      if (cur >= 100) {
        showToast(`【${D.SKILL_CATS[cid].name}】已达 100 圆满化境！`);
        return false;
      }
      const mul = G.daoBody === 'innate_dao_fetus' ? 1.45 : 1.0;
      const realPts = Math.max(2, Math.round(pts * mul * (1 + (G.wit || 10) * 0.02)));
      G.daoBase[cid] = Math.min(100, Math.max(G.daoBase[cid] || 0, cur) + realPts);
      return realPts;
    };

    // --- 南疆：万蛊毒谷 ---
    if (hid === 'south_dao_soul') {
      if (window.REINCARNATION) window.REINCARNATION.tryDiscoverRelicAt(ctx, 'south_venom');
      const cur = getCatMastery('soul');
      setDialogue({
        speaker: '万蛊毒谷 · 上古巫碑', asset: ASSETS.elder,
        text: `墨绿石碑上铭刻太古噬魂巫纹。当前【魂蛊】大道领悟：${cur}/100（大道本源随轮回永存真灵）。`,
        choices: [
          {
            text: '耗费 3 月与 40 灵石静参【魂蛊大道】', hint: '魂蛊大道 +8~14',
            action: () => {
              if (G.stone < 40) return showToast('灵石不足 40 枚。');
              G.stone -= 40; advanceTime(3);
              const g = addDaoPts('soul', 9);
              if (g) showToast(`参悟上古巫碑三月，【魂蛊】大道领悟 +${g}（当前 ${getCatMastery('soul')}/100）！`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          { text: '暂离毒碑', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return true;
    }
    if (hid === 'south_trial_gu') {
      startBattle({
        name: '百蛊窟·六翼金蚕王', asset: ASSETS.wolf_boss, bg: 'forest', enemyType: 'beast',
        hp: 580, maxHp: 580, atk: 42, expReward: 260, stoneReward: 165,
        onWin: () => {
          addItem('eq_venom_sachet', 1);
          showToast('斩杀六翼金蚕王！获玄品【百虫育蛊囊】与 165 灵石！');
        }
      });
      return true;
    }

    // --- 南疆：焚天古火脉 ---
    if (hid === 'south_dao_body') {
      if (window.REINCARNATION) window.REINCARNATION.tryDiscoverRelicAt(ctx, 'south_fire');
      setDialogue({
        speaker: '焚天古火脉 · 地肺真炎', asset: ASSETS.hero,
        text: `狂暴地火可淬炼肉身或印证天地火法（当前【体道】${getCatMastery('body')}/100 ·【法道】${getCatMastery('spell')}/100）。`,
        choices: [
          {
            text: '引地火淬炼金身，参悟【体道】本源', hint: '40灵石 +3月 · 根骨+1',
            action: () => {
              if (G.stone < 40) return showToast('灵石不足 40 枚。');
              G.stone -= 40; G.body += 1; advanceTime(3);
              const g = addDaoPts('body', 9);
              showToast(`地火淬体三月，根骨 +1${g ? `，【体道】+${g}` : ''}！`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '观摩地肺炎流，参悟【法道】本源', hint: '40灵石 +3月',
            action: () => {
              if (G.stone < 40) return showToast('灵石不足 40 枚。');
              G.stone -= 40; advanceTime(3);
              const g = addDaoPts('spell', 9);
              if (g) showToast(`观火悟道三月，【法道】领悟 +${g}（当前 ${getCatMastery('spell')}/100）！`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          { text: '退回火脉外围', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return true;
    }
    if (hid === 'south_fire_lotus') {
      startBattle({
        name: '地肺炎魔蛟', asset: ASSETS.wolf_boss, bg: 'world_map', enemyType: 'beast',
        hp: 720, maxHp: 720, atk: 50, expReward: 340, stoneReward: 210,
        onWin: () => {
          G.elements.fire = Math.min(100, (G.elements.fire || 20) + 6);
          addItem('marrow_pill', 1);
          showToast('击败炎魔蛟夺得赤炎莲子！火灵根资质 +6，获【易经洗髓灵丹】！');
        }
      });
      return true;
    }

    // --- 南疆：万灵栖兽岭 ---
    if (hid === 'south_dao_pact') {
      setDialogue({
        speaker: '万灵栖兽岭 · 万灵图腾', asset: ASSETS.elder,
        text: `古峰石壁刻满上古先民与真灵缔契之法（当前【灵契】大道：${getCatMastery('pact')}/100）。`,
        choices: [
          {
            text: '献祭 40 灵石坐悟【灵契大道】三月', hint: '灵契大道 +9~14',
            action: () => {
              if (G.stone < 40) return showToast('灵石不足 40 枚。');
              G.stone -= 40; advanceTime(3);
              const g = addDaoPts('pact', 9);
              if (g) showToast(`参悟万灵图腾，【灵契】大道 +${g}（当前 ${getCatMastery('pact')}/100）！`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          { text: '离开图腾柱', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return true;
    }
    if (hid === 'south_beast_hunt') {
      advanceTime(2);
      addItem('beast_fruit', 2);
      const e = gainExp(85);
      showToast(`深入栖兽秘岭历练两月，采得【赤灵朱果】×2，修为 +${e}！`);
      saveGame('auto', true); renderAll();
      return true;
    }

    // --- 北冥：玄冰宫 ---
    if (hid === 'north_dao_sword_array') {
      if (window.REINCARNATION) window.REINCARNATION.tryDiscoverRelicAt(ctx, 'north_ice');
      setDialogue({
        speaker: '北冥玄冰宫 · 万载剑阵壁', asset: ASSETS.sister,
        text: `冰壁之上万千剑痕交织成阵（当前【剑道】${getCatMastery('sword')}/100 ·【符阵】${getCatMastery('array')}/100）。`,
        choices: [
          {
            text: '参悟冰壁【剑道】法则（60灵石 · 3月）', hint: '剑道 +11~16',
            action: () => {
              if (G.stone < 60) return showToast('灵石不足 60 枚。');
              G.stone -= 60; advanceTime(3);
              const g = addDaoPts('sword', 11);
              if (g) showToast(`玄冰悟剑三月，【剑道】领悟 +${g}（当前 ${getCatMastery('sword')}/100）！`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '参悟冰壁【符阵】法则（60灵石 · 3月）', hint: '符阵 +11~16',
            action: () => {
              if (G.stone < 60) return showToast('灵石不足 60 枚。');
              G.stone -= 60; advanceTime(3);
              const g = addDaoPts('array', 11);
              if (g) showToast(`推演寒冰古阵三月，【符阵】领悟 +${g}（当前 ${getCatMastery('array')}/100）！`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          { text: '转身离去', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return true;
    }
    if (hid === 'north_ice_trial') {
      startBattle({
        name: '北冥玄冰剑卫', asset: ASSETS.sister_fierce, bg: 'sect_plaza', enemyType: 'cultivator',
        hp: 1050, maxHp: 1050, atk: 58, expReward: 460, stoneReward: 260,
        onWin: () => {
          addItem('eq_frost_blade', 1);
          showToast('击败北冥玄冰剑卫！获玄品飞剑【北冥寒魄剑】与 260 灵石！');
        }
      });
      return true;
    }

    // --- 北冥：上古坠仙战场 ---
    if (hid === 'north_scavenge') {
      if (window.REINCARNATION) window.REINCARNATION.tryDiscoverRelicAt(ctx, 'north_battle');
      advanceTime(2);
      const roll = Math.random() + (G.luck || 10) * 0.006;
      if (roll > 0.88) {
        addItem('dao_tea', 1);
        showToast('神识扫过坠仙残墟，竟寻得一片无上仙珍【悟道古茶树叶】！');
      } else if (roll > 0.55) {
        G.stone += 150; addItem('condense_pill', 1);
        showToast('在古修士残骸旁拾得 150 灵石与一枚【破境凝元丹】！');
      } else {
        const g = gainExp(120);
        G.sense += 1;
        showToast(`在坠仙煞气中磨砺神识两月，神识 +1，修为 +${g}。`);
      }
      saveGame('auto', true); renderAll();
      return true;
    }
    if (hid === 'north_war_soul') {
      startBattle({
        name: '太古战魂·破军将', asset: ASSETS.elder, bg: 'world_map', enemyType: 'cultivator',
        hp: 1380, maxHp: 1380, atk: 66, expReward: 640, stoneReward: 380,
        onWin: () => {
          addDaoPts('sword', 6); addDaoPts('body', 6);
          showToast('斩灭太古战魂！吸收不灭战意，【剑道】与【体道】本源各精进！');
        }
      });
      return true;
    }

    // --- 北冥：天星跨海阁（售卖延寿蟠桃与悟道茶！）---
    if (hid === 'north_sea_shop') {
      setDialogue({
        speaker: '天星跨海阁大掌柜', asset: ASSETS.elder,
        text: '巨舟甲板上星光流转，掌柜微笑道：“海外蓬莱仙岛三年方通航一次，延寿仙桃与悟道茶叶皆是逆天改命之物，有缘者得之。”',
        choices: [
          { text: '购入【千年延寿蟠桃】(寿元上限+40载)', hint: '220 灵石', action: () => buyItem('longevity_peach') },
          { text: '购入【悟道古茶树叶】(任选大道+15)',   hint: '180 灵石', action: () => buyItem('dao_tea') },
          { text: '购入【易经洗髓灵丹】(五维+灵根洗练)', hint: '95 灵石',  action: () => buyItem('marrow_pill') },
          { text: '购入【九宫避劫阵盘】(替身渡雷劫)',     hint: '80 灵石',  action: () => buyItem('lightning_plate') },
          { text: '走下星舟', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return true;
    }

    // --- 北冥：幽冥魔宗总坛 ---
    if (hid === 'north_raid_demon') {
      startBattle({
        name: '幽冥老祖·玄煞魔尊', asset: ASSETS.elder, bg: 'forest', enemyType: 'cultivator',
        hp: 2150, maxHp: 2150, atk: 82, expReward: 1100, stoneReward: 750,
        onWin: () => {
          G.fame += 180;
          addItem('dao_tea', 2);
          showToast('荡平幽冥魔宗总坛，诛灭化神老魔！声望 +180，缴获【悟道古茶树叶】×2！');
        }
      });
      return true;
    }

    // --- 中州：万仙城天骄榜 ---
    if (hid === 'central_arena') {
      startBattle({
        name: '中州圣子·太虚道人', asset: ASSETS.sister_fierce, bg: 'inn', enemyType: 'cultivator',
        hp: 2600, maxHp: 2600, atk: 92, expReward: 1350, stoneReward: 880,
        onWin: () => {
          G.fame += 220; G.sense += 5;
          addItem('longevity_peach', 1);
          showToast('登顶中州天骄榜首！获仙盟赏赐【千年延寿蟠桃】×1，神识 +5！');
        }
      });
      return true;
    }

    // --- 中州：钧天悟道神碑（全六道参悟至 100 圆满圣地！）---
    if (hid === 'central_comprehend_dao') {
      if (window.REINCARNATION) window.REINCARNATION.tryDiscoverRelicAt(ctx, 'central_stele');
      const choices = Object.values(D.SKILL_CATS).map(c => {
        const cur = getCatMastery(c.id);
        return {
          text: `坐忘参悟【${c.name}】本源（当前 ${cur}/100）`,
          hint: cur >= 100 ? '已证道圆满' : '90灵石 +4月 · 大道+14~22',
          action: () => {
            if (cur >= 100) return showToast(`【${c.name}】已臻 100 圆满，可改修其他大道冲击满大道仙帝！`);
            if (G.stone < 90) return showToast('钧天神碑开启护道灵阵需耗费 90 枚灵石。');
            G.stone -= 90; advanceTime(4);
            const g = addDaoPts(c.id, 15);
            if (g) showToast(`坐忘天碑四月，【${c.name}】本源暴涨 +${g}（当前 ${getCatMastery(c.id)}/100）！`);
            saveGame('auto', true);
            D.EVENTS.runWorldHotspot('central_comprehend_dao', ctx);
          }
        };
      });
      choices.push({ text: '起身离碑', action: () => { setDialogue(null); renderAll(); } });
      setDialogue({
        speaker: '中钧天洲 · 钧天悟道神碑', asset: ASSETS.elder,
        text: '万丈无字天碑映照诸天法则。欲破入【合道圣君】须至少参透 1 条圆满大道（100）；若历经轮回将【六条大道全部修满 100】，即可引动混沌劫雷登临最强境界【万道仙帝】！',
        choices
      });
      return true;
    }

    const passDays = (d) => {
      if (window.WORLD_SIM) window.WORLD_SIM.advanceDays(ctx, d, { seclusion: false });
      else advanceTime(Math.max(1, Math.round(d / 30)));
    };

    // --- 中钧天洲：大乾仙朝 & 千年世家 ---
    if (hid === 'faction_daqian') {
      const curYear = window.WORLD_SIM ? window.WORLD_SIM.getCal(G.totalDays).year : 1;
      const canClaimStipend = G.realmIdx >= 3 && G.flags.lastDaqianStipendYear !== curYear;
      setDialogue({
        speaker: '大乾仙都 · 礼部供奉司与崔氏宗祠', asset: ASSETS.elder,
        text: `皇都龙气浩荡，千年修仙世家门阀林立。当前世家香火恩义：${G.nobleClanBond || 0}/50（满 50 点后，下一世转生将直接投胎为中洲千年世家嫡子！）。`,
        choices: [
          {
            text: canClaimStipend ? '支取本年度大乾客卿供奉俸禄（+160 灵石 · 耗2日）' : '受封客卿支俸（需筑基修为，每年限领一次）',
            hint: canClaimStipend ? '+160 灵石' : '未达条件/已领',
            action: () => {
              if (G.realmIdx < 3) return showToast('需踏入筑基期方可受封大乾仙朝客卿供奉。');
              if (!canClaimStipend) return showToast('本年度供奉俸禄已支取，请待明年再来。');
              passDays(2);
              G.flags.lastDaqianStipendYear = curYear;
              G.stone += 160;
              G.factionRep.daqian = (G.factionRep.daqian || 0) + 15;
              showToast('支取大乾仙朝年度供奉 160 枚灵石，皇朝声望 +15！');
              saveGame('auto', true); D.EVENTS.runWorldHotspot('faction_daqian', ctx);
            }
          },
          {
            text: '向清河崔氏宗祠供奉 180 灵石缔结跨世香火契', hint: '世家恩义 +30 (耗3日)',
            action: () => {
              if (G.stone < 180) return showToast('灵石不足 180 枚。');
              G.stone -= 180; passDays(3);
              G.nobleClanBond = (G.nobleClanBond || 0) + 30;
              G.factionRep.daqian = (G.factionRep.daqian || 0) + 20;
              showToast(`缔结崔氏香火契！世家恩义升至 ${G.nobleClanBond}（满50下世转生直接投胎世家嫡系）！`);
              saveGame('auto', true); D.EVENTS.runWorldHotspot('faction_daqian', ctx);
            }
          },
          {
            text: '请皇朝【天机暗卫】全图锁定轮回盘持有者与死敌精确坐标', hint: '50 灵石 · 耗1日',
            action: () => {
              if (G.stone < 50) return showToast('需 50 灵石打点天机暗卫。');
              G.stone -= 50; passDays(1);
              if (window.REINCARNATION) window.REINCARNATION.ensureWorldRelic(G);
              const rLocObj = D.LOCATIONS.find(l => l.id === G.worldRelic?.loc);
              let report = G.worldRelic?.holder === 'player'
                ? '造化轮回盘已在你怀中。'
                : (G.worldRelic?.holder === 'npc'
                  ? `绝密卷宗：【造化轮回盘】现藏于【${G.worldRelic.npcName}】身上，此人目前正在【${rLocObj ? rLocObj.name : '未知海域'}】！`
                  : `天机罗盘直指：【造化轮回盘】目前隐匿于【${rLocObj ? rLocObj.name : '深海'}】！`);
              if (G.nemesis) {
                const nLoc = D.LOCATIONS.find(l => l.id === G.nemesis.loc);
                report += ` 前世死敌【${G.nemesis.name}】现盘踞于【${nLoc ? nLoc.name : '外域'}】！`;
              }
              showToast(report);
              setDialogue({ speaker: '皇朝天机暗卫统领', asset: ASSETS.elder, text: report, choices: [{ text: '记下了', action: () => { setDialogue(null); renderAll(); } }] });
              saveGame('auto', true); renderAll();
            }
          },
          { text: '离开皇都官署', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return true;
    }

    // --- 南赤瘴洲：隐世丹鼎神谷（求延寿圣药 & 天工重铸法器）---
    if (hid === 'faction_danding') {
      const mul = (G.worldState && G.worldState.priceMul) || 1.0;
      const peachPrice = Math.round(210 * mul);
      const refLv = G.weaponRefineLv || 0;
      const refCost = 140 + refLv * 90;
      setDialogue({
        speaker: '隐世丹鼎神谷 · 药王与天工长老', asset: ASSETS.elder,
        text: `云雾灵谷中丹香四溢（当前五洲灵材市价倍率：${mul.toFixed(2)}x）。本源法器当前天工精炼：+${refLv} 阶（每阶额外提升全神通基础威力 +8）。`,
        choices: [
          {
            text: `求购丹谷秘制【千年延寿蟠桃】(+40载寿元 · 耗5日)`, hint: `${peachPrice} 灵石`,
            action: () => {
              if (G.stone < peachPrice) return showToast(`灵石不足 ${peachPrice} 枚。`);
              G.stone -= peachPrice; passDays(5);
              addItem('longevity_peach', 1);
              G.factionRep.danding = (G.factionRep.danding || 0) + 12;
              showToast('购得【千年延寿蟠桃】×1，丹谷声望 +12！');
              saveGame('auto', true); D.EVENTS.runWorldHotspot('faction_danding', ctx);
            }
          },
          {
            text: `请天工大宗师重铸淬炼随身法器（当前 +${refLv} → +${refLv + 1} · 耗15日）`, hint: `${refCost} 灵石`,
            action: () => {
              if (refLv >= 8) return showToast('随身法器已达八转天工极致！');
              if (G.stone < refCost) return showToast(`灵石不足 ${refCost} 枚。`);
              G.stone -= refCost; passDays(15);
              G.weaponRefineLv = refLv + 1;
              G.body += 1;
              showToast(`天工地火重铸十五日，随身法器晋升 +${G.weaponRefineLv} 阶！`);
              saveGame('auto', true); D.EVENTS.runWorldHotspot('faction_danding', ctx);
            }
          },
          { text: '辞别神谷', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return true;
    }

    // --- 沧溟近海：碎星散修岛 ---
    if (hid === 'sea_free_port') {
      setDialogue({
        speaker: '碎星散修盟 · 盟主风不羁', asset: ASSETS.elder,
        text: '海风咸腥的礁石自由港内，各路散修与转生重修者互通有无：“在碎星岛不问出身正邪，能从外海活着带回海妖内丹便是好汉！”',
        choices: [
          {
            text: '接取近海巡猎海妖悬赏（实战 · 耗8日）', hint: '赏金丰厚',
            action: () => {
              passDays(8);
              startBattle({
                name: '近海赤甲狂鲨', asset: ASSETS.wolf_boss, bg: 'market', enemyType: 'beast',
                hp: 460, maxHp: 460, atk: 36, expReward: 210, stoneReward: 155,
                onWin: () => {
                  G.seaHostility = (G.seaHostility || 0) + 10;
                  G.factionRep.penglai = (G.factionRep.penglai || 0) + 15;
                  showToast('完成猎鲨悬赏！获 155 灵石，海族敌意微增。');
                }
              });
            }
          },
          {
            text: '耗费 60 灵石洗去周身魔道【业煞】（暗港改头换面 · 耗5日）', hint: `当前业煞 ${G.karma || 0}`,
            action: () => {
              if ((G.karma || 0) <= 0) return showToast('你身上并无业煞缠身。');
              if (G.stone < 60) return showToast('灵石不足 60 枚。');
              G.stone -= 60; passDays(5);
              G.karma = Math.max(0, (G.karma || 0) - 30);
              showToast(`隐姓埋名化解因果，业煞降至 ${G.karma}！`);
              saveGame('auto', true); D.EVENTS.runWorldHotspot('sea_free_port', ctx);
            }
          },
          { text: '离开散修港', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return true;
    }

    // --- 沧溟近海：丹霞灵鳌岛（人妖海陆制衡！）---
    if (hid === 'sea_hunt_turtle') {
      setDialogue({
        speaker: '丹霞灵鳌岛 · 珊瑚浅滩', asset: ASSETS.wolf_boss,
        text: `碧波之上浮现一头受伤的百年玄鳌（当前海族敌意：${G.seaHostility || 0}；敌意 ≥ 40 将引发外海兽潮封港！）。`,
        choices: [
          {
            text: '出手斩杀玄鳌剖取妖丹换灵石（海族敌意+18 · 耗6日）', hint: '+190 灵石',
            action: () => {
              passDays(6);
              startBattle({
                name: '丹霞百年玄鳌', asset: ASSETS.wolf_boss, bg: 'bamboo', enemyType: 'beast',
                hp: 540, maxHp: 540, atk: 38, expReward: 220, stoneReward: 190,
                onWin: () => {
                  G.seaHostility = (G.seaHostility || 0) + 18;
                  showToast('斩获玄鳌内丹售得 190 灵石！（沧溟海族对你的敌意上升了）');
                }
              });
            }
          },
          {
            text: '赠予一枚回春丹救治放生灵鳌（化解海族敌意 · 结海族善缘）', hint: '消耗百草回春丹',
            action: () => {
              if ((G.bag.heal_pill || 0) < 1) return showToast('行囊中暂无【百草回春丹】。');
              G.bag.heal_pill--; if (G.bag.heal_pill <= 0) delete G.bag.heal_pill;
              passDays(3);
              G.seaHostility = Math.max(0, (G.seaHostility || 0) - 25);
              G.factionRep.longting = (G.factionRep.longting || 0) + 22;
              const g = gainExp(95);
              showToast(`灵鳌感激拜谢潜入深海！海族敌意大减，龙庭声望 +22，修为 +${g}！`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          { text: '静观海潮离去', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return true;
    }

    // --- 沧溟外海：雷鸣沉船墓 ---
    if (hid === 'sea_explore_wreck') {
      if (window.REINCARNATION) window.REINCARNATION.tryDiscoverRelicAt(ctx, 'sea_wreck');
      passDays(12);
      const r = Math.random() + (G.sense || 10) * 0.005;
      if (r > 0.78) {
        addItem('tr_flying_sword', 1);
        G.stone += 180;
        showToast('潜入雷鸣古沉船耗十二日，寻得古修遗留【青霜子母飞剑】与 180 灵石！');
      } else {
        startBattle({
          name: '沉船守宝电鳗妖王', asset: ASSETS.wolf_boss, bg: 'forest', enemyType: 'beast',
          hp: 920, maxHp: 920, atk: 54, expReward: 420, stoneReward: 260,
          onWin: () => showToast('击毙沉船电鳗妖王，搜得船舱秘银灵石 260 枚！')
        });
        return true;
      }
      saveGame('auto', true); renderAll();
      return true;
    }

    // --- 沧溟深海：苍渊海族龙庭 ---
    if (hid === 'faction_longting') {
      const friendly = (G.seaHostility || 0) <= 15 && (G.factionRep.longting || 0) >= 20;
      setDialogue({
        speaker: '深海 · 苍渊水晶龙庭', asset: ASSETS.sister,
        text: `万丈深海之下水晶宫阙辉映（你的海族声望：${G.factionRep.longting || 0} · 海族敌意：${G.seaHostility || 0}）。`,
        choices: [
          {
            text: friendly ? '受龙庭礼遇，换取【通海龙珠】与【千年延寿蟠桃】(150灵石)' : '请求朝觐换取【通海龙珠】（需龙庭声望≥20且海族敌意≤15）',
            hint: friendly ? '可获通海龙珠' : '可在灵鳌岛结善缘',
            action: () => {
              if (!friendly) return showToast('海族卫士冷哼：尔等人族少杀我沧溟海兽，再来谈通海龙珠！');
              if (G.stone < 150) return showToast('需 150 灵石作为朝觐贺礼。');
              G.stone -= 150; passDays(5);
              G.flags.hasDragonPearl = true;
              addItem('longevity_peach', 1);
              showToast('获赐海族至宝【通海龙珠】（自此无视深海重水限制）与【千年延寿蟠桃】！');
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          {
            text: '强闯苍渊水晶宝库，硬撼元婴大妖【覆海蛟王】！', hint: 'HP 1650 · 极险',
            action: () => {
              startBattle({
                name: '苍渊覆海蛟王', asset: ASSETS.wolf_boss, bg: 'sect_plaza', enemyType: 'beast',
                hp: 1650, maxHp: 1650, atk: 72, expReward: 820, stoneReward: 560,
                onWin: () => {
                  G.seaHostility = (G.seaHostility || 0) + 45;
                  addItem('longevity_peach', 1);
                  addItem('dao_tea', 1);
                  showToast('洗劫水晶宝库！夺得【千年延寿蟠桃】与【悟道古茶树叶】，海族震怒！');
                }
              });
            }
          },
          { text: '浮出深海', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return true;
    }

    // --- 沧溟极渊：归墟无底海眼 ---
    if (hid === 'sea_abyss_gaze') {
      if (window.REINCARNATION) window.REINCARNATION.tryDiscoverRelicAt(ctx, 'sea_abyss');
      setDialogue({
        speaker: '极渊 · 归墟无底海眼', asset: ASSETS.hero,
        text: '万顷黑水在此倾泻入无尽虚空，时空法则裸露在外。在此枯坐二十日观摩归墟生灭，可随机参悟两条仙道法则！',
        choices: [
          {
            text: '悬空凝视归墟漩涡（耗 20 日 · 60 灵石护体）', hint: '随机双大道精进',
            action: () => {
              if (G.stone < 60) return showToast('需 60 灵石维持护体灵光抵御归墟吸力。');
              G.stone -= 60; passDays(20);
              const keys = Object.keys(D.SKILL_CATS);
              const k1 = keys[Math.floor(Math.random() * keys.length)];
              const k2 = keys[(keys.indexOf(k1) + 2) % keys.length];
              addDaoPts(k1, 10); addDaoPts(k2, 10);
              showToast(`归墟观道二十日，【${D.SKILL_CATS[k1].name}】与【${D.SKILL_CATS[k2].name}】本源大幅精进！`);
              setDialogue(null); saveGame('auto', true); renderAll();
            }
          },
          { text: '退离海眼边缘', action: () => { setDialogue(null); renderAll(); } }
        ]
      });
      return true;
    }

    // --- 第五独立孤洲：东极瀛洲 · 古神遗族与先天道果母树 ---
    if (hid === 'yingzhou_ancient_clan') {
      if (window.REINCARNATION) window.REINCARNATION.tryDiscoverRelicAt(ctx, 'yingzhou_tree');
      const hasMasterDao = Object.keys(D.SKILL_CATS).some(k => getCatMastery(k) >= 60);
      if (!hasMasterDao) {
        setDialogue({
          speaker: '东极瀛洲 · 古神遗族守山长老', asset: ASSETS.elder,
          text: '身躯伟岸的古神族人横戈拦路：“四洲来的外乡修士，你连一条 60 宗师境的大道都未曾修成，尚无资格踏入【先天道果母树】圣坛！”',
          choices: [{ text: '抱拳退去，待宗师境再来', action: () => { setDialogue(null); renderAll(); } }]
        });
        return true;
      }
      const choices = Object.values(D.SKILL_CATS).map(c => {
        const cur = getCatMastery(c.id);
        return {
          text: `在先天道果母树下灌顶参悟【${c.name}】（当前 ${cur}/100）`,
          hint: cur >= 100 ? '已臻100圆满' : '120灵石 · 耗60日 · 大道+22~30',
          action: () => {
            if (cur >= 100) return showToast(`【${c.name}】已达 100 圆满！`);
            if (G.stone < 120) return showToast('献予母树灵泉需 120 灵石。');
            G.stone -= 120; passDays(60);
            const g = addDaoPts(c.id, 22);
            if (g) showToast(`道果母树垂落仙辉，【${c.name}】本源暴涨 +${g}（当前 ${getCatMastery(c.id)}/100）！`);
            saveGame('auto', true);
            D.EVENTS.runWorldHotspot('yingzhou_ancient_clan', ctx);
          }
        };
      });
      choices.push({ text: '辞别古神圣殿', action: () => { setDialogue(null); renderAll(); } });
      setDialogue({
        speaker: '彼岸第五洲 · 先天道果母树', asset: ASSETS.elder,
        text: '跨越十万里绝灵黑水洋方抵此太古孤陆！遮天蔽日的母树每一片道叶皆蕴含天地至理，在此参悟可助你早日达成【六道全满·万道仙帝】！',
        choices
      });
      return true;
    }

    return false;
  }
};
