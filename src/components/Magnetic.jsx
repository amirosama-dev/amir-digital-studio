import { useRef } from 'react';
import gsap from 'gsap';
import { soundEngine } from '../utils/soundEngine';

export default function Magnetic({ children, strength = 0.34, className = '' }) {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const y = (e.clientY - (rect.top + rect.height / 2)) * strength;
    gsap.to(el, { x, y, duration: 0.35, ease: 'power3.out' });
  };

  const onEnter = () => {
    soundEngine.playHover();
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    gsap.to(el, { x: 0, y: 0, duration: 0.75, ease: 'elastic.out(1, 0.35)' });
  };

  return (
    <span
      ref={ref}
      className={`magnetic-wrap ${className}`}
      style={{ display: 'inline-block' }}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
    </span>
  );
}
