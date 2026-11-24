import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  ArrowUpRight,
  Play,
  Box,
  Code2,
  Film,
  MousePointerClick,
  Menu,
  X,
  MessageCircle,
  Youtube,
  ExternalLink,
} from 'lucide-react';
import Intro3D from './components/Intro3D';
import Scene3D from './components/Scene3D';
import CustomCursor from './components/CustomCursor';
import TiltCard from './components/TiltCard';
import VideoModal from './components/VideoModal';
import Magnetic from './components/Magnetic';
import ScrambleText from './components/ScrambleText';
import StudioHUD from './components/StudioHUD';
import HorizontalShowcase from './components/HorizontalShowcase';
import ProjectBuilder from './components/ProjectBuilder';
import { soundEngine } from './utils/soundEngine';
import { CONTENT } from './data/content';

gsap.registerPlugin(ScrollTrigger);

const INTRO_SESSION_KEY = 'amir_intro_seen_v1';

function hasSeenIntroInSession() {
  try {
    return sessionStorage.getItem(INTRO_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const seenBefore = hasSeenIntroInSession();

  const [lang, setLang] = useState('en');
  const [accent, setAccent] = useState('#C8FF00');
  const [accentRgb, setAccentRgb] = useState('200, 255, 0');
  const [activeVideo, setActiveVideo] = useState(null);
  const [showIntro, setShowIntro] = useState(!seenBefore);
  const [introDone, setIntroDone] = useState(seenBefore);
  const [introKey, setIntroKey] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollProgressRef = useRef(0);
  const scrollPctElRef = useRef(null);
  const lenisRef = useRef(null);
  const statementRef = useRef(null);
  const marqueeRef = useRef(null);

  const t = CONTENT[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    setTimeout(() => ScrollTrigger.refresh(), 80);
  }, [lang]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-rgb', accentRgb);
  }, [accent, accentRgb]);

  // Lenis Inertial Smooth Scrolling + GSAP ScrollTrigger Sync (zero React re-renders on scroll)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (x) => Math.min(1, 1.001 - Math.pow(2, -10 * x)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', (e) => {
      ScrollTrigger.update();
      const progress = e.progress || 0;
      scrollProgressRef.current = progress;

      if (scrollPctElRef.current) {
        const pctStr = `${String(Math.round(progress * 100)).padStart(2, '0')}%`;
        if (scrollPctElRef.current.textContent !== pctStr) {
          scrollPctElRef.current.textContent = pctStr;
        }
      }

      if (marqueeRef.current) {
        const skew = Math.max(-6, Math.min(6, (e.velocity || 0) * 0.2));
        marqueeRef.current.style.transform = `skewX(${skew}deg)`;
      }
    });

    const tick = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // True scroll lock when Intro3D, Cinema Video Modal, or Mobile Drawer is active
  useEffect(() => {
    const locked = !introDone || Boolean(activeVideo) || mobileMenuOpen;
    if (locked) {
      lenisRef.current?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      lenisRef.current?.start();
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [introDone, activeVideo, mobileMenuOpen]);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, '1');
    } catch {
      // ignore storage restrictions
    }
    setIntroDone(true);
  };

  const handleAccentChange = (hex, rgb) => {
    setAccent(hex);
    setAccentRgb(rgb);
  };

  const handleToggleSound = () => {
    const enabled = soundEngine.toggle();
    setSoundOn(enabled);
  };

  const handleReplayIntro = () => {
    setMobileMenuOpen(false);
    setActiveVideo(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIntroDone(false);
    setShowIntro(true);
    setIntroKey((k) => k + 1);
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  // GSAP Entrance & Scroll Reveal Choreography
  useEffect(() => {
    if (!introDone) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero-anim', {
        y: 44,
        opacity: 0,
        duration: 0.95,
        stagger: 0.1,
        ease: 'power4.out',
      });

      gsap.utils.toArray('.reveal-up').forEach((el) => {
        gsap.from(el, {
          y: 46,
          opacity: 0,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        });
      });

      const words = gsap.utils.toArray('.statement-word');
      if (words.length && statementRef.current) {
        ScrollTrigger.create({
          trigger: statementRef.current,
          start: 'top 78%',
          end: 'bottom 42%',
          scrub: true,
          onUpdate: (self) => {
            const count = Math.floor(self.progress * (words.length + 1));
            words.forEach((w, idx) => {
              if (idx < count) w.classList.add('lit');
              else w.classList.remove('lit');
            });
          },
        });
      }
    });

    return () => ctx.revert();
  }, [introDone, lang]);

  const renderIcon = (name) => {
    if (name === 'cube') return <Box size={24} />;
    if (name === 'code') return <Code2 size={24} />;
    return <Film size={24} />;
  };

  const statementWords = t.statement.split(' ');

  return (
    <>
      {showIntro && (
        <Intro3D
          key={introKey}
          accentHex={accent}
          onComplete={handleIntroComplete}
        />
      )}

      <CustomCursor />
      <Scene3D accentHex={accent} scrollRef={scrollProgressRef} active={introDone} />
      <div className="ambient-backdrop" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />

      <StudioHUD
        accent={accent}
        onPickTheme={handleAccentChange}
        scrollPctRef={scrollPctElRef}
        soundOn={soundOn}
        onToggleSound={handleToggleSound}
        onReplayIntro={handleReplayIntro}
      />

      <div className="site-content">
        {/* Floating Glass Navbar */}
        <header className="navbar">
          <a href="#top" className="nav-logo" data-cursor="TOP" onClick={handleNavClick}>
            <span className="nav-logo-dot" />
            <ScrambleText text="AMIR" trigger={introDone} />
          </a>

          <nav className="nav-links" aria-label="Primary Navigation">
            <a href="#work">{t.nav.work}</a>
            <a href="#videos">{t.nav.videos}</a>
            <a href="#services">{t.nav.services}</a>
            <a href="#process">{t.nav.process}</a>
            <a href="#contact">{t.nav.contact}</a>
          </nav>

          <div className="nav-actions">
            <button
              className="lang-btn"
              onClick={() => {
                soundEngine.playClick();
                setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
              }}
              data-cursor={lang === 'en' ? 'AR' : 'EN'}
            >
              {lang === 'en' ? 'عربي' : 'EN'}
            </button>
            <Magnetic strength={0.28}>
              <a
                href="#contact"
                className="btn-primary nav-cta-desktop"
                style={{ padding: '9px 18px', fontSize: '0.84rem' }}
              >
                {t.nav.cta}
                <ArrowUpRight size={16} />
              </a>
            </Magnetic>
            <button
              type="button"
              className="mobile-menu-btn"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => {
                soundEngine.playClick();
                setMobileMenuOpen((prev) => !prev);
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {/* Glass Mobile Navigation Drawer */}
        <div
          className={`mobile-drawer-backdrop ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden={!mobileMenuOpen}
        >
          <nav
            className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}
            onClick={(e) => e.stopPropagation()}
            aria-label="Mobile Navigation"
          >
            <a href="#work" onClick={handleNavClick}>{t.nav.work}</a>
            <a href="#videos" onClick={handleNavClick}>{t.nav.videos}</a>
            <a href="#services" onClick={handleNavClick}>{t.nav.services}</a>
            <a href="#process" onClick={handleNavClick}>{t.nav.process}</a>
            <a href="#contact" onClick={handleNavClick}>{t.nav.contact}</a>
            <a href="#contact" className="btn-primary" style={{ justifyContent: 'center', marginTop: 8 }} onClick={handleNavClick}>
              {t.nav.cta}
              <ArrowUpRight size={16} />
            </a>
          </nav>
        </div>

        {/* UNOBSTRUCTED 3D HERO STAGE */}
        <section id="top" className="hero">
          <div className="container hero-open-layout">
            <div className="hero-copy">
              <div className="status-pill hero-anim">
                <img
                  src="/assets/amir_avatar.webp"
                  alt="Amir Osama"
                  className="status-avatar"
                  width="30"
                  height="30"
                />
                <span className="pulse-dot" />
                <span>{t.hero.status}</span>
              </div>

              <h1 className="hero-title hero-anim">
                <span className="line">
                  <ScrambleText text={t.hero.line1} trigger={introDone} />
                </span>
                <span className="line accent-word">
                  <ScrambleText text={t.hero.line2} trigger={introDone} />
                </span>
                <span className="line">
                  <ScrambleText text={t.hero.line3} trigger={introDone} />
                </span>
              </h1>

              <p className="hero-subtitle hero-anim">{t.hero.subtitle}</p>

              <div className="hero-cta hero-anim">
                <Magnetic>
                  <a href="#work" className="btn-primary" data-cursor="WORK">
                    {t.hero.ctaPrimary}
                    <ArrowUpRight size={18} />
                  </a>
                </Magnetic>
                <Magnetic>
                  <button
                    className="btn-ghost"
                    data-cursor="PLAY ▶"
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveVideo(t.videos[0]);
                    }}
                  >
                    <Play size={16} />
                    {t.hero.ctaSecondary}
                  </button>
                </Magnetic>
              </div>

              <div className="hero-metrics hero-anim">
                {t.hero.metrics.map((m, idx) => (
                  <div key={idx}>
                    <div className="metric-val">
                      {m.val}
                      <span>{m.unit}</span>
                    </div>
                    <div className="metric-lbl">{m.lbl}</div>
                  </div>
                ))}
                <div className="click-hint">
                  <MousePointerClick size={15} />
                  <span>
                    {lang === 'ar'
                      ? 'اضغط في أي مكان لموجة 3D'
                      : 'Click anywhere for 3D shockwave'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KINETIC VELOCITY-SKEW MARQUEE */}
        <div className="marquee-wrap" dir="ltr">
          <div className="marquee-track" ref={marqueeRef}>
            {[...t.marquee, ...t.marquee].map((item, i) => (
              <div key={i} className="marquee-item">
                <span>{item}</span>
                <span className="marquee-star">✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* SCROLL TEXT ILLUMINATION STATEMENT */}
        <section className="statement-section">
          <div className="container" ref={statementRef}>
            <p className="statement-text">
              {statementWords.map((word, idx) => (
                <span key={idx} className="statement-word">
                  {word}
                </span>
              ))}
            </p>
          </div>
        </section>

        {/* FULL-PAGE 3D WEB SHOWCASE */}
        <HorizontalShowcase
          projects={t.projects}
          sectionMeta={t.workSection}
          onAccentShift={handleAccentChange}
        />

        {/* CINEMA SHOWREEL & PODCAST THEATER */}
        <section id="videos">
          <div className="container">
            <div className="section-head reveal-up">
              <div>
                <span className="section-tag">{t.videoSection.tag}</span>
                <h2 className="section-title">
                  <ScrambleText text={t.videoSection.title} />
                </h2>
              </div>
              <p className="section-desc">{t.videoSection.desc}</p>
            </div>

            <div className="videos-grid">
              {t.videos.map((v) => (
                <div key={v.id} className="reveal-up">
                  <TiltCard
                    accent={v.accent}
                    accentRgb={v.accentRgb}
                    cursorText="PLAY ▶"
                    onHoverAccent={handleAccentChange}
                    onClick={() => setActiveVideo(v)}
                  >
                    <div className="video-thumb-wrap">
                      <span className="video-badge">{v.badge}</span>
                      <img
                        src={v.thumb}
                        alt={v.title}
                        className="project-img"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="video-play-btn" aria-label={t.videoSection.playBtn}>
                        <Play size={28} fill="currentColor" />
                      </div>
                    </div>

                    <div className="project-body">
                      <div>
                        <h3 className="project-name" style={{ fontSize: '1.45rem' }}>
                          {v.title}
                        </h3>
                        <p className="project-desc">{v.desc}</p>
                      </div>
                      <span className="project-link">
                        {t.videoSection.playBtn}
                        <Play size={15} />
                      </span>
                    </div>
                  </TiltCard>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES BENTO GRID WITH ANIMATED CONIC NEON BORDERS */}
        <section id="services">
          <div className="container">
            <div className="section-head reveal-up">
              <div>
                <span className="section-tag">{t.servicesSection.tag}</span>
                <h2 className="section-title">
                  <ScrambleText text={t.servicesSection.title} />
                </h2>
              </div>
              <p className="section-desc">{t.servicesSection.desc}</p>
            </div>

            <div className="bento-grid">
              {t.services.map((s, idx) => (
                <div
                  key={idx}
                  className="bento-card conic-border reveal-up"
                  onMouseEnter={() => soundEngine.playHover()}
                >
                  <div className="bento-inner">
                    <div className="bento-icon">{renderIcon(s.icon)}</div>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 04 / AGENCY WORKFLOW PROCESS */}
        <section id="process">
          <div className="container">
            <div className="section-head reveal-up">
              <div>
                <span className="section-tag">{t.processSection.tag}</span>
                <h2 className="section-title">
                  <ScrambleText text={t.processSection.title} />
                </h2>
              </div>
              <p className="section-desc">{t.processSection.desc}</p>
            </div>

            <div className="process-grid">
              {t.processSteps.map((step) => (
                <div
                  key={step.num}
                  className="process-card reveal-up"
                  onMouseEnter={() => soundEngine.playHover()}
                >
                  <div className="process-num-row">
                    <span className="process-num">{step.num}</span>
                    <span className="process-line" aria-hidden="true" />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTERACTIVE WHATSAPP PROJECT BUILDER */}
        <section id="contact" style={{ paddingBottom: 110 }}>
          <div className="container">
            <div className="cta-box reveal-up">
              <span className="section-tag">{t.cta.tag}</span>
              <h2 className="cta-title">
                <ScrambleText text={t.cta.title} />
              </h2>
              <p className="cta-sub">{t.cta.sub}</p>

              <ProjectBuilder lang={lang} cta={t.cta} />
            </div>
          </div>
        </section>

        {/* CLEAN EXECUTIVE FOOTER WITH DIRECT SOCIALS */}
        <footer>
          <div className="container footer-inner">
            <div className="footer-brand-col">
              <span>{t.footer.rights}</span>
              <span className="footer-loc">{t.footer.location}</span>
            </div>

            <div className="footer-links">
              <a
                href="https://wa.me/201158169323"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
              >
                <MessageCircle size={15} />
                WhatsApp
              </a>
              <a
                href="https://mostaql.com/u/Amir0sama"
                target="_blank"
                rel="noreferrer"
                aria-label="Mostaql Profile"
              >
                <ExternalLink size={15} />
                Mostaql
              </a>
              <a
                href="https://www.youtube.com/watch?v=AEkcVtQL7Tw"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube Channel"
              >
                <Youtube size={15} />
                YouTube
              </a>
              <a href="#top" className="footer-top-link">
                {t.footer.backTop}
              </a>
            </div>
          </div>
        </footer>
      </div>

      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
    </>
  );
}
