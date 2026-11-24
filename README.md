# AMIR Digital Studio — 3D Interactive Portfolio

Live Production Site: **[https://amir-digital-studio.vercel.app](https://amir-digital-studio.vercel.app)**

An interactive 3D WebGL portfolio and creative studio website built with **React 18, Vite, Three.js (custom GLSL shaders), GSAP ScrollTrigger, and Lenis** smooth scrolling.

## Key Features

- **3D Hyperspace Warp & Particle Morph Intro** — Real-time Three.js particle convergence forming `AMIR`, stored per session (`sessionStorage`) with an on-demand replay toggle.
- **Custom GLSL Liquid Chrome Sphere** — Real-time vertex displacement, Fresnel rim reflections, scroll choreography, interactive click shockwaves, and adaptive mobile GPU scaling.
- **Full-Page Interactive Web Showcase** — Auto-scrolling full-page previews on desktop hover and one-tap touch previews on mobile.
- **Cinema Showreel & Podcast Theater** — 1080p studio showreel + YouTube podcast modal with scroll locking.
- **Studio Lighting HUD & Web Audio Engine** — Dynamic theme lighting presets, live scroll indicator, and optional procedural ambient audio.
- **Bilingual (EN / AR RTL)** — Seamless LTR/RTL switching with interactive WhatsApp Project Builder.

## Tech Stack

- **Frontend:** React 18, Vite 6
- **3D / Motion:** Three.js, Custom GLSL Shaders, GSAP + ScrollTrigger, Lenis
- **Icons:** Lucide React
- **Deployment:** Vercel

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```
