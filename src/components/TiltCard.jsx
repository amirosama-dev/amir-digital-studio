import { useRef } from 'react';
import { soundEngine } from '../utils/soundEngine';

export default function TiltCard({
  children,
  className = '',
  accent = '#C8FF00',
  accentRgb = '200, 255, 0',
  cursorText = '',
  holo = false,
  onHoverAccent,
  onClick,
}) {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const holoRef = useRef(null);

  const handleMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const rotateY = (px - 0.5) * 14;
    const rotateX = (0.5 - py) * 14;

    el.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(560px circle at ${px * 100}% ${py * 100}%, rgba(${accentRgb}, 0.28), transparent 55%)`;
    }
    if (holo && holoRef.current) {
      const angle = Math.atan2(py - 0.5, px - 0.5) * (180 / Math.PI) + 135;
      holoRef.current.style.background = `linear-gradient(${angle}deg, rgba(200,255,0,0.22), rgba(0,240,255,0.22), rgba(226,185,111,0.22), rgba(168,85,247,0.2))`;
      holoRef.current.style.backgroundPosition = `${px * 100}% ${py * 100}%`;
    }
  };

  const handleEnter = () => {
    soundEngine.playHover();
    onHoverAccent?.(accent, accentRgb);
  };

  const handleLeave = () => {
    const el = cardRef.current;
    if (el) {
      el.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
  };

  return (
    <div
      ref={cardRef}
      className={`tilt-card ${holo ? 'holo-card' : ''} ${className}`}
      data-cursor={cursorText}
      style={{
        '--card-accent': accent,
        '--card-accent-rgb': accentRgb,
        transition: 'transform 0.2s ease-out, border-color 0.35s ease, box-shadow 0.4s ease',
      }}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={() => {
        if (onClick) {
          soundEngine.playClick();
          onClick();
        }
      }}
    >
      <div ref={glareRef} className="tilt-glare" aria-hidden="true" />
      {holo && <div ref={holoRef} className="holo-foil" aria-hidden="true" />}
      {children}
    </div>
  );
}
