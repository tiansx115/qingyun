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
    const resize = () => { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; };
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