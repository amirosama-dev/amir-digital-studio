import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, MoveVertical, RotateCcw } from 'lucide-react';
import TiltCard from './TiltCard';
import Magnetic from './Magnetic';
import ScrambleText from './ScrambleText';
import { soundEngine } from '../utils/soundEngine';

gsap.registerPlugin(ScrollTrigger);

export default function HorizontalShowcase({
  projects,
  sectionMeta,
  onAccentShift,
}) {
  const sectionRef = useRef(null);
  const [previewId, setPreviewId] = useState(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      projects.forEach((p, idx) => {
        const el = document.querySelector(`[data-project-idx="${idx}"]`);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: 'top 58%',
          end: 'bottom 42%',
          onEnter: () => onAccentShift?.(p.accent, p.accentRgb),
          onEnterBack: () => onAccentShift?.(p.accent, p.accentRgb),
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [projects]);

  return (
    <section id="work" className="showcase-section" ref={sectionRef}>
      <div className="container">
        <div className="section-head reveal-up">
          <div>
            <span className="section-tag">{sectionMeta.tag}</span>
            <h2 className="section-title">
              <ScrambleText text={sectionMeta.title} />
            </h2>
          </div>
          <p className="section-desc">{sectionMeta.desc}</p>
        </div>

        <div className="showcase-stack">
          {projects.map((p, idx) => {
            const isPreviewing = previewId === p.id;
            return (
              <div
                key={p.id}
                data-project-idx={idx}
                className="showcase-item reveal-up"
              >
                <TiltCard
                  className="showcase-card"
                  accent={p.accent}
                  accentRgb={p.accentRgb}
                  cursorText="VIEW ↗"
                  onHoverAccent={onAccentShift}
                >
                  <div className={`showcase-card-grid ${idx % 2 === 1 ? 'reversed' : ''}`}>
                    {/* Full-Page Auto-Scrolling 3D Browser Window (Hover on Desktop + Tap Toggle on Mobile) */}
                    <div className={`browser-mockup fullpage-mockup ${isPreviewing ? 'is-previewing' : ''}`}>
                      <div className="browser-bar" dir="ltr">
                        <span className="b-dot" style={{ background: '#ff5f56' }} />
                        <span className="b-dot" style={{ background: '#ffbd2e' }} />
                        <span className="b-dot" style={{ background: '#27c93f' }} />
                        <span className="browser-url">
                          {p.url.replace('https://', '')}
                        </span>
                        <button
                          type="button"
                          className={`fullpage-pill ${isPreviewing ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            soundEngine.playClick();
                            setPreviewId((prev) => (prev === p.id ? null : p.id));
                          }}
                          aria-label={isPreviewing ? sectionMeta.previewStop : sectionMeta.previewStart}
                        >
                          {isPreviewing ? <RotateCcw size={11} /> : <MoveVertical size={11} />}
                          {isPreviewing ? sectionMeta.previewStop : sectionMeta.previewStart}
                        </button>
                      </div>

                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="fullpage-viewport"
                        aria-label={`${sectionMeta.liveBtn}: ${p.name}`}
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="fullpage-img"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="fullpage-hint">
                          <span>{sectionMeta.scrollTip}</span>
                        </div>
                      </a>
                    </div>

                    {/* Editorial Info Column */}
                    <div className="showcase-info">
                      <div>
                        <div className="project-meta-row" style={{ marginBottom: 16 }}>
                          <span className="project-num">PROJECT / {p.num}</span>
                          <span className="project-cat">{p.category}</span>
                        </div>
                        <h3 className="project-name">{p.name}</h3>
                        <p className="project-desc">{p.desc}</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="tech-pills">
                          {p.tech.map((tech) => (
                            <span key={tech} className="tech-pill">
                              {tech}
                            </span>
                          ))}
                        </div>

                        <div className="showcase-actions-row">
                          <Magnetic strength={0.28}>
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-primary"
                              style={{
                                background: p.accent,
                                boxShadow: `0 0 28px rgba(${p.accentRgb}, 0.35)`,
                              }}
                            >
                              {sectionMeta.liveBtn}
                              <ArrowUpRight size={17} />
                            </a>
                          </Magnetic>

                          <button
                            type="button"
                            className="btn-ghost mobile-preview-toggle"
                            onClick={() => {
                              soundEngine.playClick();
                              setPreviewId((prev) => (prev === p.id ? null : p.id));
                            }}
                          >
                            {isPreviewing ? <RotateCcw size={15} /> : <MoveVertical size={15} />}
                            {isPreviewing ? sectionMeta.previewStop : sectionMeta.previewStart}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
