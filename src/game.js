import { sound } from './audio.js';
import { ParticleSystem } from './particles.js';

class NeonVelocityGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = new ParticleSystem();

    // Responsive Canvas
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // State
    this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER
    this.score = 0;
    this.distance = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.speed = 12; // base forward velocity
    this.baseSpeed = 12;
    this.maxSpeed = 34;
    this.highScore = parseInt(localStorage.getItem('neon_velocity_highscore') || '0', 10);

    // Player
    this.lanes = 5;
    this.currentLane = 2; // 0, 1, 2, 3, 4
    this.targetX = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.shieldActive = false;
    this.overdriveTimer = 0;

    // Road & perspective
    this.gridOffset = 0;
    this.roadWidth = 440;
    this.horizonY = 0;

    // Spawning
    this.entities = []; // obstacles, collectibles
    this.spawnTimer = 0;
    this.spawnInterval = 50;

    // Screen Shake
    this.shakeAmount = 0;

    // Controls setup
    this.setupInputs();

    // DOM Elements
    this.hudScore = document.getElementById('hudScore');
    this.hudSpeed = document.getElementById('hudSpeed');
    this.hudCombo = document.getElementById('hudCombo');
    this.hudShield = document.getElementById('hudShield');
    this.menuScreen = document.getElementById('menuScreen');
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.finalScoreEl = document.getElementById('finalScore');
    this.highScoreEl = document.getElementById('highScore');
    this.muteBtn = document.getElementById('muteBtn');

    this.muteBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      this.muteBtn.textContent = isMuted ? '🔇' : '🔊';
    });

    document.getElementById('startBtn').addEventListener('click', () => this.startGame());
    document.getElementById('restartBtn').addEventListener('click', () => this.startGame());

    // Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.horizonY = this.canvas.height * 0.38;
    this.roadWidth = Math.min(this.canvas.width * 0.85, 480);
    this.updatePlayerLanePosition(true);
  }

  getLaneX(laneIndex) {
    const laneWidth = this.roadWidth / this.lanes;
    const startX = (this.canvas.width - this.roadWidth) / 2;
    return startX + laneWidth * laneIndex + laneWidth / 2;
  }

  updatePlayerLanePosition(instant = false) {
    this.targetX = this.getLaneX(this.currentLane);
    this.playerY = this.canvas.height * 0.84;
    if (instant) {
      this.playerX = this.targetX;
    }
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (this.state === 'PLAYING') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          this.shiftLane(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          this.shiftLane(1);
        } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          this.togglePause();
        }
      } else if (this.state === 'MENU' && (e.key === ' ' || e.key === 'Enter')) {
        this.startGame();
      } else if (this.state === 'GAMEOVER' && (e.key === ' ' || e.key === 'Enter')) {
        this.startGame();
      }
    });

    // Touch Swipe Detection
    let touchStartX = 0;
    let touchStartY = 0;

    window.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      sound.init();
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.state !== 'PLAYING') return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) this.shiftLane(-1);
        else this.shiftLane(1);
      }
    }, { passive: true });

    // Touch button overlays
    const leftBtn = document.getElementById('mobileLeft');
    const rightBtn = document.getElementById('mobileRight');
    if (leftBtn && rightBtn) {
      leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.shiftLane(-1); });
      rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.shiftLane(1); });
    }
  }

  shiftLane(dir) {
    const nextLane = this.currentLane + dir;
    if (nextLane >= 0 && nextLane < this.lanes) {
      this.currentLane = nextLane;
      sound.playShift();
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  startGame() {
    sound.init();
    sound.startBGM();

    this.state = 'PLAYING';
    this.score = 0;
    this.distance = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.speed = this.baseSpeed;
    this.currentLane = 2;
    this.updatePlayerLanePosition(true);
    this.shieldActive = false;
    this.overdriveTimer = 0;
    this.entities = [];
    this.particles.clear();

    this.menuScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
  }

  gameOver() {
    sound.playCrash();
    sound.stopBGM();
    this.state = 'GAMEOVER';
    this.shakeAmount = 25;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('neon_velocity_highscore', this.highScore.toString());
    }

    this.finalScoreEl.textContent = this.score;
    this.highScoreEl.textContent = this.highScore;
    this.gameOverScreen.classList.remove('hidden');
  }

  spawnEntity() {
    const lane = Math.floor(Math.random() * this.lanes);
    const rand = Math.random();

    let entity;
    if (rand < 0.65) {
      // Data Orb (Points)
      entity = {
        type: 'ORB',
        lane,
        z: 1.0, // 1.0 at horizon, 0.0 at bottom
        color: '#00f0ff',
        radius: 12
      };
    } else if (rand < 0.85) {
      // Barrier Obstacle
      entity = {
        type: 'BARRIER',
        lane,
        z: 1.0,
        color: '#ff0055',
        width: 48,
        height: 22
      };
    } else if (rand < 0.93) {
      // Energy Shield Powerup
      entity = {
        type: 'SHIELD',
        lane,
        z: 1.0,
        color: '#a855f7',
        radius: 14
      };
    } else {
      // Overdrive Turbo Booster
      entity = {
        type: 'OVERDRIVE',
        lane,
        z: 1.0,
        color: '#ffea00',
        radius: 15
      };
    }

    this.entities.push(entity);
  }

  update(delta) {
    if (this.state !== 'PLAYING') return;

    // Overdrive handling
    const isOverdrive = this.overdriveTimer > 0;
    if (isOverdrive) {
      this.overdriveTimer -= delta;
      this.speed = this.maxSpeed;
    } else {
      // Gradual acceleration based on distance
      this.speed = Math.min(this.maxSpeed, this.baseSpeed + Math.floor(this.distance / 120) * 1.5);
    }

    this.distance += Math.floor(this.speed * 0.15);
    this.score += Math.floor(this.combo * (this.speed / 10));

    // Smooth lane shift interpolation
    this.targetX = this.getLaneX(this.currentLane);
    this.playerX += (this.targetX - this.playerX) * 0.22;

    // Thruster trail emitter
    this.particles.emitTrail(this.playerX, this.playerY + 12, isOverdrive);

    // Combo countdown
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
    }

    // Grid animation
    this.gridOffset = (this.gridOffset + this.speed * 0.8) % 60;

    // Spawn entities
    this.spawnTimer += this.speed * 0.05;
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnEntity();
      this.spawnTimer = 0;
      this.spawnInterval = Math.max(22, 50 - Math.floor(this.distance / 250) * 3);
    }

    // Move entities towards player
    const moveRate = (this.speed * 0.00045) * (delta / 16.6);

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      e.z -= moveRate;

      // Projection coordinates
      const p = this.projectZ(e.lane, e.z);

      // Check collision when close to player
      if (e.z <= 0.08 && e.z >= -0.05) {
        const laneX = this.getLaneX(e.lane);
        const distToPlayer = Math.abs(this.playerX - laneX);

        if (distToPlayer < 40) {
          if (e.type === 'ORB') {
            this.combo = Math.min(5, this.combo + 1);
            this.comboTimer = 2200; // 2.2 seconds to maintain combo
            this.score += 150 * this.combo;
            sound.playCollect(this.combo);
            this.particles.burst(p.x, p.y, e.color, 14);
            this.entities.splice(i, 1);
            continue;
          } else if (e.type === 'SHIELD') {
            this.shieldActive = true;
            sound.playPowerup();
            this.particles.burst(p.x, p.y, e.color, 24);
            this.entities.splice(i, 1);
            continue;
          } else if (e.type === 'OVERDRIVE') {
            this.overdriveTimer = 4000; // 4 seconds of overdrive
            sound.playPowerup();
            this.particles.burst(p.x, p.y, e.color, 28);
            this.entities.splice(i, 1);
            continue;
          } else if (e.type === 'BARRIER') {
            if (isOverdrive) {
              // Destroy obstacle in overdrive
              this.score += 300;
              sound.playCollect(3);
              this.particles.explode(p.x, p.y, e.color, 25);
              this.entities.splice(i, 1);
              continue;
            } else if (this.shieldActive) {
              // Shield absorbs crash
              this.shieldActive = false;
              sound.playShieldBreak();
              this.shakeAmount = 14;
              this.particles.explode(p.x, p.y, '#a855f7', 20);
              this.entities.splice(i, 1);
              continue;
            } else {
              // Fatal collision
              this.particles.explode(this.playerX, this.playerY, '#ff0055', 50);
              this.gameOver();
              return;
            }
          }
        }
      }

      // Remove entities behind camera
      if (e.z < -0.15) {
        this.entities.splice(i, 1);
      }
    }

    // Update particles
    this.particles.update();

    // Screen Shake decay
    if (this.shakeAmount > 0) {
      this.shakeAmount *= 0.88;
      if (this.shakeAmount < 0.2) this.shakeAmount = 0;
    }

    // Update HUD
    this.hudScore.textContent = this.score.toLocaleString();
    this.hudSpeed.textContent = `${Math.floor(this.speed * 9)} KM/H`;
    this.hudCombo.textContent = `x${this.combo}`;
    this.hudShield.textContent = this.shieldActive ? 'SHIELD: ON' : (isOverdrive ? 'OVERDRIVE!' : 'SHIELD: OFF');
    this.hudShield.style.color = isOverdrive ? '#ffea00' : (this.shieldActive ? '#a855f7' : '#666');
  }

  // 3D Perspective Projection helper
  projectZ(laneIndex, z) {
    const horizonLaneWidth = (this.roadWidth * 0.12) / this.lanes;
    const baseLaneWidth = this.roadWidth / this.lanes;

    const horizonStartX = (this.canvas.width - this.roadWidth * 0.12) / 2;
    const baseStartX = (this.canvas.width - this.roadWidth) / 2;

    const hX = horizonStartX + horizonLaneWidth * laneIndex + horizonLaneWidth / 2;
    const bX = baseStartX + baseLaneWidth * laneIndex + baseLaneWidth / 2;

    // z goes from 1.0 (horizon) to 0.0 (near player)
    const factor = Math.max(0, Math.min(1, z));
    const x = bX + (hX - bX) * factor;
    const y = this.playerY + (this.horizonY - this.playerY) * factor;
    const scale = 1.0 - factor * 0.85;

    return { x, y, scale };
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();

    // Apply Screen Shake
    if (this.shakeAmount > 0) {
      const sx = (Math.random() - 0.5) * this.shakeAmount;
      const sy = (Math.random() - 0.5) * this.shakeAmount;
      ctx.translate(sx, sy);
    }

    // Sky / Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    bgGrad.addColorStop(0, '#06070c');
    bgGrad.addColorStop(this.horizonY / this.canvas.height, '#120a2a');
    bgGrad.addColorStop(1, '#050508');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Synthwave Sun / Horizon Glow
    const sunGrad = ctx.createRadialGradient(
      this.canvas.width / 2, this.horizonY, 10,
      this.canvas.width / 2, this.horizonY, this.roadWidth * 0.7
    );
    sunGrad.addColorStop(0, 'rgba(255, 0, 128, 0.45)');
    sunGrad.addColorStop(0.5, 'rgba(120, 0, 255, 0.2)');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(this.canvas.width / 2, this.horizonY, this.roadWidth * 0.7, Math.PI, 0);
    ctx.fill();

    // Horizon line
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.horizonY);
    ctx.lineTo(this.canvas.width, this.horizonY);
    ctx.stroke();

    // Road Perspective lines
    this.drawRoad(ctx);

    // Entities (back-to-front rendering)
    const sortedEntities = [...this.entities].sort((a, b) => b.z - a.z);
    for (const e of sortedEntities) {
      this.drawEntity(ctx, e);
    }

    // Particles
    this.particles.draw(ctx);

    // Player Hovercraft
    if (this.state === 'PLAYING' || this.state === 'PAUSED') {
      this.drawPlayer(ctx);
    }

    ctx.restore();
  }

  drawRoad(ctx) {
    const horizonStartX = (this.canvas.width - this.roadWidth * 0.12) / 2;
    const horizonEndX = horizonStartX + this.roadWidth * 0.12;
    const baseStartX = (this.canvas.width - this.roadWidth) / 2;
    const baseEndX = baseStartX + this.roadWidth;

    // Road surface fill
    ctx.fillStyle = 'rgba(15, 10, 30, 0.9)';
    ctx.beginPath();
    ctx.moveTo(horizonStartX, this.horizonY);
    ctx.lineTo(horizonEndX, this.horizonY);
    ctx.lineTo(baseEndX, this.canvas.height);
    ctx.lineTo(baseStartX, this.canvas.height);
    ctx.closePath();
    ctx.fill();

    // Lane divider lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#00f0ff';

    for (let i = 0; i <= this.lanes; i++) {
      const hX = horizonStartX + ((horizonEndX - horizonStartX) / this.lanes) * i;
      const bX = baseStartX + ((baseEndX - baseStartX) / this.lanes) * i;

      ctx.beginPath();
      ctx.moveTo(hX, this.horizonY);
      ctx.lineTo(bX, this.canvas.height);
      ctx.stroke();
    }

    // Moving horizontal grid lines (retro floor sweep)
    ctx.strokeStyle = 'rgba(255, 0, 128, 0.4)';
    const lines = 16;
    for (let i = 0; i < lines; i++) {
      const factor = Math.pow((i + (this.gridOffset / 60)) / lines, 2.2);
      const y = this.horizonY + (this.canvas.height - this.horizonY) * factor;
      const curStartX = horizonStartX + (baseStartX - horizonStartX) * factor;
      const curEndX = horizonEndX + (baseEndX - horizonEndX) * factor;

      ctx.beginPath();
      ctx.moveTo(curStartX, y);
      ctx.lineTo(curEndX, y);
      ctx.stroke();
    }
  }

  drawEntity(ctx, e) {
    const p = this.projectZ(e.lane, e.z);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.scale, p.scale);

    ctx.shadowBlur = 14;
    ctx.shadowColor = e.color;

    if (e.type === 'ORB') {
      // Glowing energy sphere
      const radGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, e.radius);
      radGrad.addColorStop(0, '#ffffff');
      radGrad.addColorStop(0.6, e.color);
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * 1.3, 0, Math.PI * 2);
      ctx.stroke();
    } else if (e.type === 'BARRIER') {
      // Cyber barricade
      ctx.fillStyle = 'rgba(255, 0, 85, 0.85)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(-e.width / 2, -e.height, e.width, e.height, 4);
      ctx.fill();
      ctx.stroke();

      // Warning hazard stripes
      ctx.fillStyle = '#ffe600';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ DANGER', 0, -e.height / 2 + 3);
    } else if (e.type === 'SHIELD') {
      // Violet Shield Orb
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡', 0, 4);
    } else if (e.type === 'OVERDRIVE') {
      // Golden Lightning Booster
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', 0, 4);
    }

    ctx.restore();
  }

  drawPlayer(ctx) {
    ctx.save();
    ctx.translate(this.playerX, this.playerY);

    const isOverdrive = this.overdriveTimer > 0;
    const bodyColor = isOverdrive ? '#ffea00' : '#00f0ff';

    ctx.shadowBlur = 18;
    ctx.shadowColor = bodyColor;

    // Aerodynamic futuristic hover ship
    ctx.fillStyle = '#0a0d18';
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(0, -22); // Nose
    ctx.lineTo(24, 16);  // Right wing
    ctx.lineTo(12, 12);  // Right inset
    ctx.lineTo(0, 8);    // Center back
    ctx.lineTo(-12, 12); // Left inset
    ctx.lineTo(-24, 16); // Left wing
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Cockpit
    ctx.fillStyle = isOverdrive ? '#ffffff' : '#ff0055';
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.ellipse(0, -6, 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shield Aura
    if (this.shieldActive) {
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  gameLoop(timestamp) {
    const delta = Math.min(50, timestamp - this.lastTime);
    this.lastTime = timestamp;

    this.update(delta);
    this.draw();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Boot game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new NeonVelocityGame();
});
