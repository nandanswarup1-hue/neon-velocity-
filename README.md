# ⚡ Neon Velocity

> High-octane arcade cyber-grid runner built with vanilla Canvas & Web Audio API synthesis. Zero external asset dependencies — loads instantly anywhere!

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Tech](https://img.shields.io/badge/stack-HTML5%20Canvas%20%7C%20WebAudio%20%7C%20Vite-00f0ff.svg)

---

## 🕹 Features

- **⚡ Procedural Web Audio Synth**: Custom synthesized sound effects (engine, chime pickups, basslines, shield shatter, explosion) powered directly by the Web Audio API without needing any external `.mp3` or `.wav` files.
- **🌌 3D Retro-Futuristic Grid**: Dynamic tilted perspective projection with moving horizon and synthwave atmosphere.
- **🚀 Responsive Controls**:
  - **Keyboard**: `A` / `D` or `Left` / `Right` arrows.
  - **Mobile Touch**: Native swipe gesture detection + ergonomic on-screen thumb triggers.
- **🔥 Combo Multiplier**: Chain data orbs consecutively to ramp up multipliers (`x1` ➔ `x5`).
- **🛡 Powerups & Hazards**:
  - 💎 **Data Orbs**: Energy + combo points
  - 🛡 **Shield Pulse**: Absorbs 1 fatal barricade collision
  - ⚡ **Overdrive**: Temporary supersonic speed & obstacle-smashing invulnerability
  - ⚠ **Barricades**: Neon laser barricades that must be dodged
- **🏆 Persistent Records**: High-score tracking via `localStorage`.

---

## 🚀 Quick Start (Local Run)

You can run this project locally with Vite:

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Alternatively, open `index.html` directly in any modern web browser or serve it with any static server.

---

## 📤 Push to GitHub (`nandanswarup1-hue`)

To publish this project to your GitHub profile [github.com/nandanswarup1-hue](https://github.com/nandanswarup1-hue):

1. **Create a new repository** on GitHub named `neon-velocity` (leave it blank without initializing README).
2. **Push the local project**:
   ```bash
   git remote add origin https://github.com/nandanswarup1-hue/neon-velocity.git
   git branch -M main
   git push -u origin main
   ```

---

## 🌐 Deploy to Vercel / GitHub Pages

This project is 100% static and can be deployed with one command:

```bash
# Via Vercel CLI
npx vercel
```
Or connect your GitHub repository directly to [Vercel](https://vercel.com) or enable **GitHub Pages** under `Settings > Pages > Deploy from Branch (main)`.

---

## 📜 License

MIT License. Crafted with ⚡ for high performance and pure arcade fun.
