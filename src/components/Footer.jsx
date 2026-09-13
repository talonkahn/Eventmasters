import { Link } from 'react-router-dom';
import Logo from './Logo';

const WA   = 'https://wa.me/2346730044';
const EMAIL= 'mailto:samuelivere92@gmail.com';
const SNAP = 'https://snapchat.com/add/hsprafrique';
const TW   = 'https://twitter.com/hsprafrique';
const IG   = 'https://instagram.com/hsprafrique';

const SOCIAL = [
  { label:'X',  href:TW,   icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  { label:'IG', href:IG,   icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
  { label:'SC', href:SNAP, icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12.166.006C9.813.006 5.54 1.383 5.54 6.75v1.294c-.413.183-.933.239-1.345.239a2.27 2.27 0 0 0-.412.037c-.293.055-.476.293-.476.623 0 .458.358.77 1.017.952.128.037.275.073.422.11.532.128 1.21.293 1.394.751.11.275.073.678-.11 1.228-.018.055-.037.11-.073.165-.78 1.925-2.34 4.301-4.688 4.686a.455.455 0 0 0-.385.44c0 .22.146.422.367.477.844.22 1.723.312 2.65.422.183.018.348.037.532.055.11.018.22.11.293.275.091.22.128.477.165.751.037.238.073.495.165.715.091.22.293.348.532.348.11 0 .22-.018.312-.055.348-.11.697-.165 1.046-.165.293 0 .605.037.898.11.495.128 1.064.568 1.705 1.064.77.605 1.632 1.284 2.797 1.284.11 0 .22-.018.33-.018h.11c.073 0 .165.018.22.018 1.174 0 2.027-.678 2.797-1.284.641-.495 1.21-.936 1.705-1.064.294-.073.605-.11.898-.11.348 0 .697.055 1.046.165.091.037.202.055.312.055.238 0 .44-.128.532-.348.091-.22.128-.477.165-.715.037-.275.073-.532.165-.751.073-.165.183-.257.293-.275.165-.018.348-.037.532-.055.935-.11 1.815-.202 2.65-.422a.484.484 0 0 0 .367-.477.455.455 0 0 0-.385-.44c-2.34-.385-3.9-2.761-4.688-4.686-.018-.055-.055-.11-.073-.165-.183-.55-.22-.953-.11-1.228.183-.458.862-.623 1.394-.751.146-.037.293-.073.422-.11.66-.183 1.017-.494 1.017-.952 0-.33-.183-.568-.476-.623a2.27 2.27 0 0 0-.412-.037c-.412 0-.933-.055-1.345-.239V6.75C18.46 1.32 14.52.006 12.166.006z"/></svg> },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-rainbow" />
      <div className="footer-inner">
        <div className="footer-cta">
          <div>
            <h3>Want to list your event?</h3>
            <p>Contact us — we'll have your event live within 24 hours.</p>
          </div>
          <div className="footer-cta-btns">
            <a href={WA} target="_blank" rel="noopener noreferrer" className="btn btn-green btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <a href={EMAIL} className="btn btn-white btn-sm">Email</a>
          </div>
        </div>

        <div className="footer-grid">
          <div className="footer-brand">
            <Logo variant="lockup" height={26} />
            <p className="footer-brand-desc">Nigeria's premier events ticketing platform. Every concert, comedy show, festival and conference — one place, real tickets.</p>
            <p className="footer-hspr">A product of <strong style={{ color:'var(--amber)' }}>HSPR Technologies Ltd</strong></p>
            <div className="footer-socials">
              {SOCIAL.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title={s.label}>{s.icon}</a>
              ))}
            </div>
          </div>
          <div>
            <p className="footer-col-head">Explore</p>
            <div className="footer-links">
              {[['All Events','/events'],['Concerts','/events?category=concert'],['Comedy','/events?category=comedy-show'],['Festivals','/events?category=festival'],['Parties','/events?category=party'],['Conferences','/events?category=conference-workshop']].map(([l,h]) => (
                <Link key={h} to={h} className="footer-link">{l}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="footer-col-head">Company</p>
            <div className="footer-links">
              {[['About Us','/about'],['List Your Event','/contact'],['My Tickets','/my-tickets'],['Terms','/terms'],['Privacy','/privacy']].map(([l,h]) => (
                <Link key={h} to={h} className="footer-link">{l}</Link>
              ))}
            </div>
            <p className="footer-col-head" style={{ marginTop:20 }}>Follow Us</p>
            <div className="footer-links">
              <a href={TW}   target="_blank" rel="noopener noreferrer" className="footer-link">@hsprafrique on X</a>
              <a href={IG}   target="_blank" rel="noopener noreferrer" className="footer-link">@hsprafrique on IG</a>
              <a href={SNAP} target="_blank" rel="noopener noreferrer" className="footer-link">@hsprafrique on Snapchat</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© {year} EventMasters · All rights reserved · <strong style={{ color:'rgba(255,255,255,0.45)' }}>HSPR Technologies Ltd</strong></p>
          <div className="footer-badges">
            <span className="footer-badge">🔒 Flutterwave</span>
            <span className="footer-badge">✓ SSL</span>
            <span className="footer-badge">🇳🇬 Made in Nigeria</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
