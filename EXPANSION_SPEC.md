# 《青云问道录》v3 分包架构与 100MB+ 资产扩展规范

本版本已采用**完全解耦的分包结构**，支持通过本地 RTX 5080 + Codex 无限扩充至上百 MB 精品体量并推送至 GitHub Pages：

## 目录结构
- `index.html` / `styles/main.css`：入口与黑檀鎏金 UI 样式
- `engine/audio_fx.js` / `engine/app.js`：粒子/剑气 VFX 引擎、两级实景探索、战斗与存档系统
- `data/world.js`：东洲大舆图地标、场景内可点 NPC 与建筑热点、动态时间轴事件
- `data/skills_items.js`：境界、心法、主动神通、本命法宝与丹药器物
- `assets/scenes/*.webp`：16:9 电影写实场景图（建议 1280×720 或 1920×1080 WebP）
- `assets/chars/*.webp`：3:4 透明抠图人物/妖兽立绘（RGBA WebP）
- `assets/audio/*.mp3`：古风配乐 BGM 与环境音效

## 离线缓存机制
`sw.js` 采用**核心代码预缓存 + `assets/` 按需动态缓存**，即便未来扩展到 100～300MB，iPhone 打开依然秒进，访问过的场景与立绘会自动落盘离线。
