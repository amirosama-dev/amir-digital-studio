import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function sampleWordPoints(text, count = 2800) {
  const c = document.createElement('canvas');
  c.width = 920;
  c.height = 290;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#fff';
  ctx.font = '900 212px "Syne", "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width / 2, c.height / 2 + 6);

  const img = ctx.getImageData(0, 0, c.width, c.height).data;
  const candidates = [];
  for (let y = 0; y < c.height; y += 3) {
    for (let x = 0; x < c.width; x += 3) {
      const idx = (y * c.width + x) * 4;
      if (img[idx] > 140) {
        candidates.push([
          (x - c.width / 2) * 0.0118,
          -(y - c.height / 2) * 0.0118,
          (Math.random() - 0.5) * 0.36,
        ]);
      }
    }
  }

  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const pick = candidates[Math.floor(Math.random() * candidates.length)] || [0, 0, 0];
    out[i * 3] = pick[0] + (Math.random() - 0.5) * 0.025;
    out[i * 3 + 1] = pick[1] + (Math.random() - 0.5) * 0.025;
    out[i * 3 + 2] = pick[2];
  }
  return out;
}

export default function Intro3D({ onComplete, accentHex = '#C8FF00' }) {
  const canvasRef = useRef(null);
  const accentHexRef = useRef(accentHex);
  accentHexRef.current = accentHex;

  const [pct, setPct] = useState(0);
  const [phaseLabel, setPhaseLabel] = useState('01 // HYPERSPACE WARP TUNNEL');
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [unmounted, setUnmounted] = useState(false);

  const finishedRef = useRef(false);
  const lastPctRef = useRef(0);
  const lastPhaseRef = useRef('01 // HYPERSPACE WARP TUNNEL');
  const subtitleShownRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finishIntro = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setExiting(true);
    onCompleteRef.current?.();
    setTimeout(() => setUnmounted(true), 850);
  };

  useEffect(() => {
    if (unmounted) return;

    // Respect user reduced-motion accessibility preference
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      finishIntro();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile = window.innerWidth < 768;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030306, 0.042);

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 72 : 60,
      window.innerWidth / window.innerHeight,
      0.1,
      130
    );
    camera.position.set(0, 0, isMobile ? 12.2 : 10.8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x030306, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const accentColor = new THREE.Color(accentHexRef.current);

    // 1. Hyperspace 3D Geometric Warp Rings
    const ringCount = isMobile ? 24 : 38;
    const rings = [];
    const ringGeo = new THREE.TorusGeometry(4.8, 0.024, 8, 6);
    for (let i = 0; i < ringCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? accentColor : 0x3b3f58,
        transparent: true,
        opacity: i % 3 === 0 ? 0.72 : 0.25,
      });
      const ring = new THREE.Mesh(ringGeo, mat);
      ring.position.z = -i * 1.95 + 4;
      ring.rotation.z = i * 0.14;
      scene.add(ring);
      rings.push(ring);
    }

    // 2. Warp Speed Star Streaks
    const starCount = isMobile ? 800 : 1700;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 1.8 + Math.random() * 14.5;
      const theta = Math.random() * Math.PI * 2;
      starPos[i * 3] = Math.cos(theta) * r;
      starPos[i * 3 + 1] = Math.sin(theta) * r;
      starPos[i * 3 + 2] = -Math.random() * 70 + 10;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.062,
      transparent: true,
      opacity: 0.8,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 3. 3D Particle Morph Word "AMIR"
    const pCount = isMobile ? 1400 : 2800;
    const targetPositions = sampleWordPoints('AMIR', pCount);
    const startPositions = new Float32Array(pCount * 3);
    const currentPositions = new Float32Array(pCount * 3);
    const colors = new Float32Array(pCount * 3);
    const burstVelocities = new Float32Array(pCount * 3);

    const white = new THREE.Color('#ffffff');
    for (let i = 0; i < pCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const rad = 8 + Math.random() * 15;
      startPositions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
      startPositions[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
      startPositions[i * 3 + 2] = -16 + (Math.random() - 0.5) * 18;

      currentPositions[i * 3] = startPositions[i * 3];
      currentPositions[i * 3 + 1] = startPositions[i * 3 + 1];
      currentPositions[i * 3 + 2] = startPositions[i * 3 + 2];

      burstVelocities[i * 3] = (Math.random() - 0.5) * 13;
      burstVelocities[i * 3 + 1] = (Math.random() - 0.5) * 9;
      burstVelocities[i * 3 + 2] = 11 + Math.random() * 18;

      const mix = Math.random() > 0.34 ? white : accentColor;
      colors[i * 3] = mix.r;
      colors[i * 3 + 1] = mix.g;
      colors[i * 3 + 2] = mix.b;
    }

    const morphGeo = new THREE.BufferGeometry();
    morphGeo.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    morphGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const morphMat = new THREE.PointsMaterial({
      size: isMobile ? 0.092 : 0.072,
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const morphPoints = new THREE.Points(morphGeo, morphMat);
    scene.add(morphPoints);

    // 4. Dual Shockwave Burst Rings
    const shockGeo = new THREE.TorusGeometry(0.5, 0.048, 12, 64);
    const shockMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const shockRing = new THREE.Mesh(shockGeo, shockMat);
    scene.add(shockRing);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let raf = 0;
    const TOTAL = isMobile ? 4.8 : 6.8;
    const timeScale = 6.8 / TOTAL;

    const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
    const easeInOutCubic = (x) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const rawT = clock.getElapsedTime();
      const dt = Math.min(0.05, clock.getDelta() || 0.016);
      const t = rawT * timeScale;
      const progress = Math.min(1, rawT / TOTAL);

      // Guard React state updates so we never re-render when numbers haven't changed
      const nextPct = Math.round(progress * 100);
      if (nextPct !== lastPctRef.current) {
        lastPctRef.current = nextPct;
        setPct(nextPct);
      }

      const nextPhase =
        t < 1.65
          ? '01 // HYPERSPACE WARP TUNNEL'
          : t < 3.65
            ? '02 // MATERIALIZING AMIR 3D'
            : t < 5.65
              ? '03 // AMIR DIGITAL STUDIO'
              : '04 // LAUNCHING EXPERIENCE';
      if (nextPhase !== lastPhaseRef.current) {
        lastPhaseRef.current = nextPhase;
        setPhaseLabel(nextPhase);
      }

      if (t >= 3.65 && !subtitleShownRef.current) {
        subtitleShownRef.current = true;
        setShowSubtitle(true);
      }

      const tunnelSpeed = t > 5.65 ? 1.05 : t > 3.5 ? 0.22 : 0.42;
      for (const r of rings) {
        r.position.z += tunnelSpeed;
        r.rotation.z += 0.007;
        if (r.position.z > 10.5) r.position.z -= ringCount * 1.95;
      }

      const sArr = starGeo.attributes.position.array;
      const starSpeed = t > 5.65 ? 1.75 : t > 3.5 ? 0.32 : 0.62;
      for (let i = 0; i < starCount; i++) {
        sArr[i * 3 + 2] += starSpeed;
        if (sArr[i * 3 + 2] > 11) sArr[i * 3 + 2] = -60;
      }
      starGeo.attributes.position.needsUpdate = true;

      const posAttr = morphGeo.attributes.position.array;
      const baseZ = isMobile ? 12.2 : 10.8;
      if (t < 5.68) {
        const morphT = easeOutExpo(Math.min(1, Math.max(0, (t - 1.15) / 2.35)));
        for (let i = 0; i < pCount * 3; i++) {
          posAttr[i] = startPositions[i] + (targetPositions[i] - startPositions[i]) * morphT;
        }
        const holdFactor = Math.min(1, Math.max(0, (t - 2.6) / 1.0));
        morphPoints.rotation.y = Math.sin(t * 1.15) * 0.28 * holdFactor;
        morphPoints.rotation.x = Math.cos(t * 0.85) * 0.09 * holdFactor;
        camera.position.z = baseZ - holdFactor * 1.15;
      } else {
        const burstT = Math.min(1, (t - 5.68) / 1.05);
        const e = easeInOutCubic(burstT);
        for (let i = 0; i < pCount; i++) {
          posAttr[i * 3] += burstVelocities[i * 3] * dt * (1 + e * 2.5);
          posAttr[i * 3 + 1] += burstVelocities[i * 3 + 1] * dt * (1 + e * 2.5);
          posAttr[i * 3 + 2] += burstVelocities[i * 3 + 2] * dt * (1.2 + e * 3.4);
        }
        shockRing.scale.setScalar(1 + e * 28);
        shockMat.opacity = (1 - e) * 0.95;
        camera.fov = (isMobile ? 72 : 60) + e * 52;
        camera.position.z = baseZ - 1.15 - e * 6.5;
        camera.updateProjectionMatrix();
      }
      morphGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);

      if (rawT >= TOTAL && !finishedRef.current) {
        finishIntro();
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      ringGeo.dispose();
      rings.forEach((r) => r.material.dispose());
      starGeo.dispose();
      starMat.dispose();
      morphGeo.dispose();
      morphMat.dispose();
      shockGeo.dispose();
      shockMat.dispose();
      renderer.dispose();
    };
  }, [unmounted]);

  if (unmounted) return null;

  return (
    <div className={`intro-3d-overlay ${exiting ? 'exiting' : ''}`} role="presentation">
      <canvas ref={canvasRef} className="intro-3d-canvas" />

      <div className="intro-3d-hud">
        <div className="intro-3d-top">
          <span className="intro-3d-badge">
            <span className="pulse-dot" />
            AMIR STUDIO // WEBGL 3D PRESENTATION
          </span>
          <button className="intro-skip-btn" onClick={finishIntro}>
            SKIP INTRO ⏭
          </button>
        </div>

        <div className={`intro-center-tagline ${showSubtitle ? 'visible' : ''}`}>
          DIGITAL STUDIO • 3D WEB • CINEMA MOTION
        </div>

        <div className="intro-3d-bottom">
          <div className="intro-phase-row">
            <span>{phaseLabel}</span>
            <strong>{String(pct).padStart(2, '0')}%</strong>
          </div>
          <div className="intro-bar-track">
            <div className="intro-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="intro-subline">WEB ARCHITECTURE • 3D MOTION • CINEMA PRODUCTION</p>
        </div>
      </div>
    </div>
  );
}
