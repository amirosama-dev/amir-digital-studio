import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uTurbulence;
  uniform float uShock;
  uniform vec2 uMouse;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vDisplace;

  float liquidField(vec3 p, float t) {
    float n = sin(p.x * 2.4 + t * 1.15) * cos(p.y * 2.2 - t * 0.9) * sin(p.z * 2.5 + t * 0.8);
    n += 0.5 * sin(p.x * 4.8 - t * 1.5 + p.y * 3.1) * cos(p.z * 4.2 + t * 1.2);
    n += 0.25 * cos(p.y * 7.0 + p.z * 6.5 - t * 2.1);
    return n;
  }

  void main() {
    vec3 pos = position;
    float baseWave = liquidField(pos, uTime);
    float mousePull = smoothstep(2.2, 0.0, length(pos.xy - uMouse * 1.6)) * 0.22;
    float shockRipple = sin(length(pos) * 14.0 - uTime * 18.0) * uShock * 0.24;

    float disp = (baseWave * uTurbulence) + mousePull + shockRipple;
    vec3 displaced = pos + normal * disp;

    float eps = 0.04;
    float dx = liquidField(pos + vec3(eps, 0.0, 0.0), uTime) - baseWave;
    float dy = liquidField(pos + vec3(0.0, eps, 0.0), uTime) - baseWave;
    float dz = liquidField(pos + vec3(0.0, 0.0, eps), uTime) - baseWave;
    vec3 perturbedNormal = normalize(normal - vec3(dx, dy, dz) * (uTurbulence * 3.8));

    vDisplace = disp;
    vNormal = normalize(normalMatrix * perturbedNormal);
    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vWorldPos = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uAccent;
  uniform float uTime;
  uniform float uShock;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vDisplace;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.7);

    vec3 L1 = normalize(vec3(4.0, 5.0, 6.0));
    vec3 L2 = normalize(vec3(-5.0, -3.0, 4.0));
    vec3 H1 = normalize(L1 + V);
    vec3 H2 = normalize(L2 + V);

    float diff1 = max(dot(N, L1), 0.0);
    float spec1 = pow(max(dot(N, H1), 0.0), 56.0);
    float spec2 = pow(max(dot(N, H2), 0.0), 32.0);

    vec3 iridescence = 0.5 + 0.5 * cos(uTime * 0.7 + vDisplace * 6.0 + vec3(0.0, 2.0, 4.0));

    vec3 baseObsidian = vec3(0.04, 0.045, 0.065);
    vec3 color = baseObsidian;
    color += vec3(0.14, 0.16, 0.22) * diff1;
    color += uAccent * fresnel * (1.25 + uShock * 1.4);
    color += mix(vec3(1.0), uAccent, 0.45) * spec1 * 1.45;
    color += vec3(0.45, 0.48, 1.0) * spec2 * 0.75;
    color += iridescence * fresnel * 0.28;

    gl_FragColor = vec4(color, 0.96);
  }
`;

export default function Scene3D({ accentHex = '#C8FF00', scrollRef, active = true }) {
  const canvasRef = useRef(null);
  const accentTargetRef = useRef(new THREE.Color(accentHex));
  const activeRef = useRef(active);

  useEffect(() => {
    accentTargetRef.current = new THREE.Color(accentHex);
  }, [accentHex]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile = window.innerWidth < 768;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050507, 0.055);

    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, isMobile ? 9.4 : 8.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const activeColor = new THREE.Color(accentHex);

    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Adaptive-Detail GLSL Liquid Chrome Sphere (crisp desktop / battery-friendly mobile)
    const sphereGeo = new THREE.IcosahedronGeometry(1.62, isMobile ? 18 : 34);
    const sphereUniforms = {
      uTime: { value: 0 },
      uTurbulence: { value: 0.24 },
      uShock: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uAccent: { value: activeColor.clone() },
    };
    const sphereMat = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: sphereUniforms,
      transparent: true,
    });
    const liquidSphere = new THREE.Mesh(sphereGeo, sphereMat);
    coreGroup.add(liquidSphere);

    // 2. Architectural Wireframe Matrix Cage
    const cageGeo = new THREE.IcosahedronGeometry(2.65, 2);
    const cageMat = new THREE.MeshBasicMaterial({
      color: activeColor.clone(),
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    coreGroup.add(cageMesh);

    // 3. 3D Cinema Aperture Gyro Rings
    const gyroGroup = new THREE.Group();
    const ringSegs = isMobile ? 72 : 112;
    const ringGeo1 = new THREE.TorusGeometry(2.35, 0.018, 10, ringSegs);
    const ringGeo2 = new THREE.TorusGeometry(2.95, 0.014, 10, ringSegs);
    const ringGeo3 = new THREE.TorusGeometry(3.45, 0.01, 10, ringSegs);
    const ringMatAccent = new THREE.MeshBasicMaterial({
      color: activeColor.clone(),
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
    });
    const ringMatSoft = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
    });
    const gyro1 = new THREE.Mesh(ringGeo1, ringMatAccent);
    const gyro2 = new THREE.Mesh(ringGeo2, ringMatSoft);
    const gyro3 = new THREE.Mesh(ringGeo3, ringMatAccent);
    gyro1.rotation.x = Math.PI * 0.36;
    gyro2.rotation.y = Math.PI * 0.42;
    gyro3.rotation.x = -Math.PI * 0.22;
    gyroGroup.add(gyro1, gyro2, gyro3);
    coreGroup.add(gyroGroup);

    // 4. Floating Metallic Diamonds
    const shards = [];
    const shardCount = isMobile ? 10 : 18;
    const shardGeo = new THREE.OctahedronGeometry(0.14, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.95,
      roughness: 0.1,
    });
    for (let i = 0; i < shardCount; i++) {
      const m = new THREE.Mesh(shardGeo, shardMat);
      m.userData = {
        angle: (i / shardCount) * Math.PI * 2,
        radius: 3.1 + (i % 4) * 0.48,
        speed: 0.22 + (i % 5) * 0.06,
        yOff: (Math.random() - 0.5) * 3.8,
      };
      m.scale.setScalar(0.55 + Math.random() * 0.85);
      coreGroup.add(m);
      shards.push(m);
    }

    // 5. Interactive Click Shockwave Ring Pool
    const clickRipples = [];
    const rippleGeo = new THREE.TorusGeometry(0.45, 0.025, 10, 56);

    // 6. Adaptive Galaxy Vortex Particle Field
    const pCount = isMobile ? 900 : 2000;
    const pPos = new Float32Array(pCount * 3);
    const pCol = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const arm = i % 3;
      const radius = 1.8 + Math.random() * 14.5;
      const angle = (arm / 3) * Math.PI * 2 + radius * 0.45 + (Math.random() - 0.5) * 1.6;
      pPos[i * 3] = Math.cos(angle) * radius;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 13.5;
      pPos[i * 3 + 2] = Math.sin(angle) * radius - 3.0;

      const c = i % 4 === 0 ? activeColor : new THREE.Color(0xdbe2ff);
      pCol[i * 3] = c.r;
      pCol[i * 3 + 1] = c.g;
      pCol[i * 3 + 2] = c.b;
    }
    const galaxyGeo = new THREE.BufferGeometry();
    galaxyGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    galaxyGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const galaxyMat = new THREE.PointsMaterial({
      size: 0.042,
      vertexColors: true,
      transparent: true,
      opacity: 0.68,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
    scene.add(galaxy);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const pLight = new THREE.PointLight(activeColor.clone(), 45, 25);
    pLight.position.set(5, 4, 6);
    scene.add(pLight);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let shock = 0;

    const onMouseMove = (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onPointerDown = (e) => {
      if (!activeRef.current || reducedMotion) return;
      shock = 1.0;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      const vec = new THREE.Vector3(nx, ny, 0.5).unproject(camera);
      const dir = vec.sub(camera.position).normalize();
      const pos = camera.position.clone().add(dir.multiplyScalar(6.2));

      const mat = new THREE.MeshBasicMaterial({
        color: activeColor.clone(),
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(rippleGeo, mat);
      mesh.position.copy(pos);
      mesh.lookAt(camera.position);
      scene.add(mesh);
      clickRipples.push({ mesh, life: 0 });
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('resize', onResize);

    // Render one clean static frame for reduced-motion accessibility users
    if (reducedMotion) {
      coreGroup.position.x = window.innerWidth < 960 ? 0 : 1.75;
      renderer.render(scene, camera);
    }

    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);

      // Pause GPU draw calls while Intro3D covers screen or browser tab is hidden
      if (!activeRef.current || document.hidden) {
        clock.getDelta();
        return;
      }

      const dt = Math.min(0.05, clock.getDelta());
      const t = clock.getElapsedTime();

      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      shock = Math.max(0, shock - dt * 1.45);

      const sp = scrollRef?.current ?? 0;

      activeColor.lerp(accentTargetRef.current, 0.06);
      sphereUniforms.uAccent.value.copy(activeColor);
      cageMat.color.copy(activeColor);
      ringMatAccent.color.copy(activeColor);
      pLight.color.copy(activeColor);

      sphereUniforms.uTime.value = t;
      sphereUniforms.uShock.value = shock;
      sphereUniforms.uMouse.value.set(mouse.x, mouse.y);
      const targetTurb = 0.22 + Math.sin(sp * Math.PI) * 0.16 + shock * 0.18;
      sphereUniforms.uTurbulence.value += (targetTurb - sphereUniforms.uTurbulence.value) * 0.08;

      const narrow = window.innerWidth < 960;
      const targetX = narrow ? 0 : Math.cos(sp * Math.PI * 1.65) * 1.75;
      const targetY = Math.sin(t * 0.7) * 0.15 + Math.sin(sp * Math.PI * 2.0) * 0.45;
      const targetZ = -Math.sin(sp * Math.PI) * 1.4;

      coreGroup.position.x += (targetX - coreGroup.position.x) * 0.05;
      coreGroup.position.y += (targetY - coreGroup.position.y) * 0.05;
      coreGroup.position.z += (targetZ - coreGroup.position.z) * 0.05;

      const cageScale = 1.0 + Math.sin(sp * Math.PI) * 0.65 + shock * 0.15;
      cageMesh.scale.setScalar(cageScale);
      cageMesh.rotation.x = t * 0.08 + sp * 2.4;
      cageMesh.rotation.y = -t * 0.12 - mouse.x * 0.4;

      const videoAlignment = Math.max(0, 1 - Math.abs(sp - 0.68) * 3.5);
      gyro1.rotation.z = t * 0.35 + sp * 3.0;
      gyro1.rotation.x = THREE.MathUtils.lerp(Math.PI * 0.36 + t * 0.12, 0.05, videoAlignment);
      gyro2.rotation.y = THREE.MathUtils.lerp(Math.PI * 0.42 - t * 0.16, 0.05, videoAlignment);
      gyro3.rotation.z = -t * 0.25;
      gyroGroup.scale.setScalar(1 + videoAlignment * 0.35);

      liquidSphere.rotation.y = t * 0.22 + mouse.x * 0.7 + sp * Math.PI * 2;
      liquidSphere.rotation.x = t * 0.14 + mouse.y * 0.5;

      for (const s of shards) {
        const a = s.userData.angle + t * s.userData.speed + sp * 2.5;
        const r = s.userData.radius + shock * 0.55;
        s.position.set(
          Math.cos(a) * r,
          s.userData.yOff + Math.sin(t * 1.1 + a) * 0.32,
          Math.sin(a) * r * 0.7
        );
        s.rotation.x = t * 0.9;
        s.rotation.y = t * 0.6;
      }

      const vortexBoost = 1 + Math.max(0, (sp - 0.65) * 4.5) + shock * 2.0;
      galaxy.rotation.y += dt * 0.055 * vortexBoost;
      galaxy.rotation.z = mouse.x * 0.08 + sp * 0.45;
      galaxy.position.y = sp * 2.6;

      for (let i = clickRipples.length - 1; i >= 0; i--) {
        const r = clickRipples[i];
        r.life += dt * 1.6;
        const s = 1 + r.life * 6.5;
        r.mesh.scale.setScalar(s);
        r.mesh.material.opacity = Math.max(0, 0.85 * (1 - r.life));
        if (r.life >= 1) {
          scene.remove(r.mesh);
          r.mesh.material.dispose();
          clickRipples.splice(i, 1);
        }
      }

      const baseCamZ = narrow ? 9.4 : 8.2;
      const camZ = baseCamZ - Math.sin(sp * Math.PI) * 0.9;
      camera.position.x += (mouse.x * 0.55 - camera.position.x) * 0.045;
      camera.position.y += (mouse.y * 0.4 - camera.position.y) * 0.045;
      camera.position.z += (camZ - camera.position.z) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    if (!reducedMotion) {
      animate();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onResize);
      clickRipples.forEach((r) => r.mesh.material.dispose());
      rippleGeo.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      cageGeo.dispose();
      cageMat.dispose();
      ringGeo1.dispose();
      ringGeo2.dispose();
      ringGeo3.dispose();
      ringMatAccent.dispose();
      ringMatSoft.dispose();
      shardGeo.dispose();
      shardMat.dispose();
      galaxyGeo.dispose();
      galaxyMat.dispose();
      renderer.dispose();
    };
  }, [scrollRef]);

  return <canvas ref={canvasRef} className="scene-3d-canvas" aria-hidden="true" />;
}
