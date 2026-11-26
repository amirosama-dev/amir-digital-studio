import { useState } from 'react';
import { MessageCircle, ExternalLink, Youtube, Check } from 'lucide-react';
import Magnetic from './Magnetic';
import { soundEngine } from '../utils/soundEngine';

const WHATSAPP_NUMBER = '201158169323';

const BUILDER_COPY = {
  en: {
    step1: '1. What do you want to build?',
    step2: '2. Preferred Timeline',
    services: [
      'Luxury Brand Store (Perfume / Jewelry)',
      'Interactive Café QR Menu',
      '60fps Remotion Motion Ad',
      '3D Interactive Website',
      'YouTube / Podcast Production',
    ],
    timelines: ['Express (48–72 Hours)', 'Standard (1 Week)', 'Monthly Content Partner'],
    sendWa: 'Send Brief on WhatsApp',
    previewLabel: 'LIVE WHATSAPP MESSAGE PREVIEW',
  },
  ar: {
    step1: '1. عايز ننفذ إيه لبراندك؟',
    step2: '2. المدة المطلوبة',
    services: [
      'متجر فاخر (عطور / مجوهرات / ملابس)',
      'مينيو QR تفاعلي لكافيه أو مطعم',
      'إعلان موشن جرافيك 60fps بـ Remotion',
      'موقع 3D تفاعلي',
      'مونتاج يوتيوب / بودكاست',
    ],
    timelines: ['سريع (48 – 72 ساعة)', 'عادي (أسبوع)', 'باقة شهرية مستمرة'],
    sendWa: 'ابعت التفاصيل على واتساب فوراً',
    previewLabel: 'معاينة رسالة الواتساب الجاهزة',
  },
};

export default function ProjectBuilder({ lang, cta }) {
  const copy = BUILDER_COPY[lang];
  const [selectedServices, setSelectedServices] = useState([0]);
  const [timelineIdx, setTimelineIdx] = useState(0);

  const toggleService = (idx) => {
    soundEngine.playClick();
    setSelectedServices((prev) =>
      prev.includes(idx) ? (prev.length > 1 ? prev.filter((i) => i !== idx) : prev) : [...prev, idx]
    );
  };

  const chosenServiceNames = selectedServices.map((i) => copy.services[i] || copy.services[0]);
  const chosenTimeline = copy.timelines[timelineIdx];

  const message =
    lang === 'ar'
      ? `أهلاً أمير، شفت موقعك الشخصي وعايز أبدأ مشروع جديد:\n• المطلوب: ${chosenServiceNames.join(' + ')}\n• المدة المتوقعة: ${chosenTimeline}`
      : `Hi Amir! I just explored your 3D portfolio and would love to discuss a project:\n• Scope: ${chosenServiceNames.join(' + ')}\n• Timeline: ${chosenTimeline}`;

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <div className="builder-wrap">
      <div className="builder-group">
        <span className="builder-label">{copy.step1}</span>
        <div className="builder-chips">
          {copy.services.map((srv, idx) => {
            const active = selectedServices.includes(idx);
            return (
              <button
                key={srv}
                type="button"
                className={`builder-chip ${active ? 'active' : ''}`}
                onClick={() => toggleService(idx)}
              >
                {active && <Check size={14} />}
                {srv}
              </button>
            );
          })}
        </div>
      </div>

      <div className="builder-group">
        <span className="builder-label">{copy.step2}</span>
        <div className="builder-chips">
          {copy.timelines.map((tl, idx) => (
            <button
              key={tl}
              type="button"
              className={`builder-chip ${timelineIdx === idx ? 'active' : ''}`}
              onClick={() => {
                soundEngine.playClick();
                setTimelineIdx(idx);
              }}
            >
              {tl}
            </button>
          ))}
        </div>
      </div>

      <div className="builder-preview">
        <span className="builder-preview-tag">{copy.previewLabel}</span>
        <pre className="builder-preview-text">{message}</pre>
      </div>

      <div className="cta-buttons">
        <Magnetic>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            data-cursor="CHAT"
          >
            <MessageCircle size={18} />
            {copy.sendWa}
          </a>
        </Magnetic>

        <Magnetic>
          <a
            href="https://mostaql.com/u/Amir0sama"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
            data-cursor="HIRE"
          >
            {cta.mostaqlBtn}
            <ExternalLink size={17} />
          </a>
        </Magnetic>

        <Magnetic>
          <a
            href="https://www.youtube.com/watch?v=AEkcVtQL7Tw"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
            data-cursor="WATCH"
          >
            <Youtube size={17} />
            {cta.youtubeBtn}
          </a>
        </Magnetic>
      </div>
    </div>
  );
}
