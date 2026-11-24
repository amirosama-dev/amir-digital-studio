import { useEffect, useRef, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*';

export default function ScrambleText({ text, trigger = true, className = '' }) {
  const [display, setDisplay] = useState(text);
  const intervalRef = useRef(null);

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const runDecode = () => {
    stopTimer();
    // Only scramble ASCII/Latin strings nicely; Arabic renders cleanly without breaking ligatures
    if (/[\u0600-\u06FF]/.test(text)) {
      setDisplay(text);
      return;
    }

    let iteration = 0;
    intervalRef.current = setInterval(() => {
      setDisplay(
        text
          .split('')
          .map((ch, idx) => {
            if (ch === ' ') return ' ';
            if (idx < iteration) return text[idx];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );
      iteration += 0.45;
      if (iteration >= text.length) {
        setDisplay(text);
        stopTimer();
      }
    }, 28);
  };

  useEffect(() => {
    if (!trigger) {
      setDisplay(text);
      return;
    }
    runDecode();
    return stopTimer;
  }, [text, trigger]);

  return (
    <span className={className} onMouseEnter={runDecode}>
      {display}
    </span>
  );
}
