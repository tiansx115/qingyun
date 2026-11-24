# 《青云问道录》v5.3 完整资产扩展与批量替换规范（RTX 5080 出图清单）

本版本已完成全部核心系统与玩法框架（6 格自由装备、三大势力与跨年因果链、5 位伙伴 5 态情绪状态机、炼丹炉控火、鬼市实时竞价、多结局二周目传承、离线古风 BGM 与一键预缓存）。

后续使用本地 **Windows + RTX 5080** 按统一电影写实画风批量生成资产后，直接按以下命名放入 `assets/` 并在 `data/world.js` 的 `ASSETS_MAP` 中登记（音频放入 `assets/audio/` 自动识别），即可无缝替换生效：

## 1. 场景实景图 (`assets/scenes/*.webp`，16:9 建议 1280×720 / 1920×1080)
- 已就绪：`world_map.webp`, `sect_plaza.webp`, `inn.webp`, `market.webp`, `forest.webp`, `bamboo.webp`
- 推荐补全：`cliff.webp`（后山思过崖）, `altar.webp`（九霄渡劫台）, `ruin_inner.webp`（古修洞府内殿）, `nether_alley.webp`（幽冥暗巷）

## 2. 人物全身像与 5 态情绪差分 (`assets/chars/*.webp`，透明抠图 RGBA WebP)
情绪键名规范：`normal`（全身常态） / `smile`（浅笑） / `fierce`（凌厉） / `shy`（微羞） / `injured`（战损）
- **林清霜 (`sister`)**：`sister_full`, `sister_smile`, `sister_fierce`, 待补 `sister_shy`, `sister_injured`
- **玄虚子 (`elder`)**：`elder`, 待补 `elder_smile`, `elder_fierce`, `elder_shy`, `elder_injured`
- **沈云舒 (`shen`)**：待补 `shen_full`, `shen_smile`, `shen_fierce`, `shen_shy`, `shen_injured`
- **柳若云 (`liu`)**：待补 `liu_full`, `liu_smile`, `liu_fierce`, `liu_shy`, `liu_injured`
- **墨离 (`moli`)**：待补 `moli_full`, `moli_smile`, `moli_fierce`, `moli_shy`, `moli_injured`

## 3. 装备与道具图标 (`assets/items/*.webp`，透明抠图 256×256 WebP)
- 已就绪：`spirit_stone`, `elixir_pill`, `jade_ring`, `frost_sword`, `lightning_disk`, `osmanthus_cake`
- 推荐补全：飞剑/利刃、道袍/内甲/血煞袍、灵靴/步履、乾坤袋/紫金丹葫、破境凝元丹/洗髓丹等专属图标

## 4. 古风离线 BGM (`assets/audio/*.mp3`，放入即自动淡入淡出播放，缺文件静默降级)
- `bgm_world.mp3`（东洲大舆图）
- `bgm_sect.mp3`（青云剑宗）
- `bgm_inn.mp3`（天机阁茶肆）
- `bgm_market.mp3`（鬼市黑坊）
- `bgm_forest.mp3`（万妖古林）
- `bgm_bamboo.mp3`（伙伴/暮色竹林）
- `bgm_combat.mp3`（横屏斗法战斗）

## 5. 离线缓存更新规范
批量放入新资产并更新 `ASSETS_MAP` 后，递增 `sw.js` 与 `engine/minigames.js` 中的 `CACHE_NAME` 并 `git push origin main`，在 iPhone「卷宗」中点击「一键预缓存」即可全量落盘离线畅玩。
