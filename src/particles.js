// High-performance particle engine for neon visuals and impact feedback

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Neon explosion on crash or barricade shatter
  explode(x, y, color = '#ff0055', count = 35) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.015,
        glow: true
      });
    }
  }

  // Energy pickup burst
  burst(x, y, color = '#00f0ff', count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Math.random() * 4 + 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color,
        alpha: 1,
        decay: 0.04,
        glow: true
      });
    }
  }

  // Thruster trail particles
  emitTrail(x, y, boost = false) {
    const spread = boost ? 6 : 3;
    const color = boost ? '#ffea00' : '#00f0ff';
    this.particles.push({
      x: x + (Math.random() - 0.5) * spread,
      y: y + 8,
      vx: (Math.random() - 0.5) * 1.5,
      vy: Math.random() * 4 + (boost ? 8 : 4),
      size: Math.random() * 3 + (boost ? 3 : 1.5),
      color,
      alpha: 0.9,
      decay: boost ? 0.06 : 0.08,
      glow: true
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      if (p.glow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  clear() {
    this.particles = [];
  }
}
