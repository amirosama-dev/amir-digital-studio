import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export const STUDIO_THEMES = [
  { id: 'lime', name: 'Acid Lime', hex: '#C8FF00', rgb: '200, 255, 0' },
  { id: 'gold', name: 'Royal Gold', hex: '#E2B96F', rgb: '226, 185, 111' },
  { id: 'cyan', name: 'Cyber Cyan', hex: '#00F0FF', rgb: '0, 240, 255' },
  { id: 'emerald', name: 'Emerald', hex: '#34D399', rgb: '52, 211, 153' },
];

export default function StudioHUD({
  accent,
  onPickTheme,
  scrollPctRef,
  soundOn,
  onToggleSound,
  onReplayIntro,
}) {
  return (
    <div className="studio-hud" role="region" aria-label="Studio Lighting Controls">
      <div className="hud-swatches">
        {STUDIO_THEMES.map((t) => {
          const active = accent.toLowerCase() === t.hex.toLowerCase();
          return (
            <button
              key={t.id}
              className={`hud-swatch ${active ? 'active' : ''}`}
              style={{ '--sw': t.hex }}
              title={t.name}
              aria-label={`Switch studio lighting to ${t.name}`}
              onClick={() => {
                soundEngine.playClick();
                onPickTheme(t.hex, t.rgb);
              }}
            />
          );
        })}
      </div>

      <span className="hud-divider" />

      <span className="hud-scroll" ref={scrollPctRef}>
        00%
      </span>

      <span className="hud-divider" />

      <button
        className={`hud-icon-btn ${soundOn ? 'on' : ''}`}
        onClick={onToggleSound}
        title={soundOn ? 'Mute Studio Audio' : 'Enable Studio Audio'}
        aria-label="Toggle studio sound"
      >
        {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
      </button>

      <button
        className="hud-icon-btn"
        onClick={() => {
          soundEngine.playClick();
          onReplayIntro();
        }}
        title="Replay 3D Warp Intro"
        aria-label="Replay 3D Intro"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
}
