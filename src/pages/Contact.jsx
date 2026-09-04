import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { WhatsappIcon, Mail01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

export default function Contact() {
  return (
    <div className="static-wrap">
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--amber)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
        Get In Touch
      </p>
      <h1 className="static-title">List your event or get help</h1>
      <p className="static-sub">
        Every event on EventMasters is manually verified to ensure quality. Contact us and we'll get your event live within 24 hours.
      </p>

      <a href="https://wa.me/2346730044" target="_blank" rel="noopener noreferrer" className="contact-card">
        <div className="contact-card-icon" style={{ background: 'rgba(16,217,122,0.1)' }}>
          <HugeiconsIcon icon={WhatsappIcon} size={24} color="var(--green)" />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#fff', marginBottom: 6 }}>WhatsApp</h3>
        <p style={{ color: 'var(--slate)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: 10 }}>
          Fastest response. Chat with us directly to list your event or get support.
        </p>
        <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 5 }}>
          +234 673 0044 <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="var(--green)" />
        </span>
      </a>

      <a href="mailto:samuelivere92@gmail.com" className="contact-card">
        <div className="contact-card-icon" style={{ background: 'rgba(255,179,0,0.1)' }}>
          <HugeiconsIcon icon={Mail01Icon} size={24} color="var(--amber)" />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#fff', marginBottom: 6 }}>Email</h3>
        <p style={{ color: 'var(--slate)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: 10 }}>
          Send us your event details and we'll review within 24 hours.
        </p>
        <span style={{ color: 'var(--amber)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 5 }}>
          samuelivere92@gmail.com <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="var(--amber)" />
        </span>
      </a>

      <div style={{ background: 'var(--ink-2)', border: '1.5px solid var(--line)', borderRadius: 14, padding: '20px 18px', marginTop: 8 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#fff', marginBottom: 14 }}>What to include when listing your event</h3>
        {['Event name and full description','Date, time and venue address','State (Lagos, Abuja, Rivers, etc.)','Ticket tiers with prices and quantities e.g. Regular ₦5,000 — 500 tickets, VIP ₦15,000 — 100 tickets','High-quality event banner image (1200×630px recommended)','Your contact number and business name'].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <span style={{ color: 'var(--amber)', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
            <p style={{ color: 'var(--slate)', fontSize: '0.85rem', lineHeight: 1.5 }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
