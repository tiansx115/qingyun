window.SFX = {
  enabled: true, ctx: null,
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  play(type) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    if (type === 'click') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
      gain.gain.setValueAtTime(0.07, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now); osc.stop(now + 0.07);
    } else if (type === 'sword') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(840, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.16);
      gain.gain.setValueAtTime(0.11, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      osc.start(now); osc.stop(now + 0.18);
    } else if (type === 'thunder') {
      osc.type = 'square'; osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.35);
      gain.gain.setValueAtTime(0.14, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc.start(now); osc.stop(now + 0.37);
    } else if (type === 'levelup') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.08);
      osc.frequency.setValueAtTime(659, now + 0.16);
      gain.gain.setValueAtTime(0.11, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now); osc.stop(now + 0.36);
    }
  }
};

window.FX = {
  canvas: null, ctx: null, particles: [], slashes: [],
  init() {
    this.canvas = document.getElementById('fx-canvas');
    this.ctx = this.canvas.getContext('2d');
    const resize = () => {
      const host = document.getElementById('app');
      this.canvas.width = (host && host.clientWidth) || window.innerWidth;
      this.canvas.height = (host && host.clientHeight) || window.innerHeight;
    };
    window.addEventListener('resize', resize); resize();
    for (let i = 0; i < 28; i++) this.particles.push(this.makeAmbient());
    const loop = () => { this.update(); requestAnimationFrame(loop); };
    loop();
  },
  makeAmbient() {
    return {
      x: Math.random() * (this.canvas.width || 900),
      y: Math.random() * (this.canvas.height || 500),
      vx: (Math.random() - 0.3) * 0.35, vy: -0.22 - Math.random() * 0.38,
      r: 1 + Math.random() * 1.9, alpha: 0.22 + Math.random() * 0.42,
      color: Math.random() > 0.3 ? '243,215,120' : '160,220,255', life: -1
    };
  },
  burst(color = '243,215,120', count = 26, rx = 0.64, ry = 0.46) {
    const cx = this.canvas.width * rx, cy = this.canvas.height * ry;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2.5 + Math.random() * 6.5;
      this.particles.push({ x: cx, y: cy, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, r: 1.5 + Math.random()*3, alpha: 1, color, life: 28 + Math.random()*18 });
    }
  },
  slash(color = '#f3d778', rx = 0.65, ry = 0.45) {
    const cx = this.canvas.width * rx, cy = this.canvas.height * ry;
    this.slashes.push({ x: cx, y: cy, angle: -0.65 + Math.random()*0.6, life: 16, maxLife: 16, color });
  },
  update() {
    const c = this.ctx, w = this.canvas.width, h = this.canvas.height;
    c.clearRect(0, 0, w, h);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.life > 0) {
        p.life--; p.alpha = p.life / 40;
        if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      } else {
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x > w + 10) p.x = -10;
      }
      c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      c.fillStyle = `rgba(${p.color},${Math.max(0, p.alpha)})`; c.fill();
    }
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i]; s.life--;
      const t = s.life / s.maxLife;
      c.save(); c.translate(s.x, s.y); c.rotate(s.angle);
      c.strokeStyle = s.color; c.globalAlpha = t; c.lineWidth = 4 * t + 1;
      c.beginPath(); c.moveTo(-78, -20); c.quadraticCurveTo(0, 10, 82, 24); c.stroke();
      c.restore();
      if (s.life <= 0) this.slashes.splice(i, 1);
    }
  }
};

// 离线古风 BGM 与场景环境音无缝淡入淡出管理器（无 MP3 资产时静默降级，零报错）
window.BGM = {
  enabled: true,
  volume: 0.45,
  currentKey: null,
  audio: null,
  missing: {},
  _fadeTimer: null,
  playScene(key) {
    if (!this.enabled || !key || this.currentKey === key) return;
    const map = window.GAME_DATA && window.GAME_DATA.AUDIO_MAP;
    const src = map && (map[key] || map.world_map);
    if (!src || this.missing[src]) { this.currentKey = key; return; }
    this.currentKey = key;
    if (typeof Audio === 'undefined') return;
    try {
      const next = new Audio(src);
      next.loop = true;
      next.volume = 0;
      next.onerror = () => { this.missing[src] = true; };
      const prev = this.audio;
      this.audio = next;
      const p = next.play();
      if (p && p.catch) p.catch(() => {});
      clearInterval(this._fadeTimer);
      this._fadeTimer = setInterval(() => {
        let done = true;
        if (prev && prev.volume > 0.03) {
          prev.volume = Math.max(0, prev.volume - 0.05);
          done = false;
        } else if (prev) {
          prev.pause();
        }
        if (next && next.volume < this.volume) {
          next.volume = Math.min(this.volume, next.volume + 0.05);
          done = false;
        }
        if (done) clearInterval(this._fadeTimer);
      }, 60);
    } catch {}
  },
  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.audio && this.enabled) this.audio.volume = this.volume;
  },
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled && this.audio) this.audio.pause();
    else if (this.enabled && this.audio) {
      this.audio.volume = this.volume;
      const p = this.audio.play();
      if (p && p.catch) p.catch(() => {});
    }
  }
};