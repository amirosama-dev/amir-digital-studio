import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const ref = useRef(null);
  const lastLabelRef = useRef('');
  const [label, setLabel] = useState('');

  useEffect(() => {
    // Skip cursor loop completely on touch / coarse pointer devices
    if (window.matchMedia?.('(pointer: coarse)').matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      const target = e.target?.closest?.('[data-cursor]');
      const next = target ? target.getAttribute('data-cursor') || '' : '';
      if (next !== lastLabelRef.current) {
        lastLabelRef.current = next;
        setLabel(next);
      }
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <div ref={ref} className={`custom-cursor ${label ? 'active' : ''}`} aria-hidden="true">
      {label}
    </div>
  );
}
