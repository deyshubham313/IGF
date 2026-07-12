import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

const FooterLink = ({ href, to, children }) => {
  const [hov, setHov] = useState(false);
  const style = {
    color: hov ? 'var(--igf-orange)' : 'rgba(255,240,234,0.5)',
    textDecoration: 'none',
    fontSize: '0.84rem',
    fontFamily: 'DM Sans, sans-serif',
    lineHeight: 1.4,
    transition: 'color 0.25s',
    paddingLeft: hov ? 6 : 0,
    display: 'block',
    borderLeft: hov ? '2px solid var(--igf-orange)' : '2px solid transparent',
    transitionProperty: 'color, padding-left, border-left-color',
    transitionDuration: '0.25s',
  };
  if (to) return <Link to={to} style={style} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>{children}</Link>;
  return <a href={href} style={style} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>{children}</a>;
};

const SocialBtn = ({ href, icon, label }) => {
  const [hov, setHov] = useState(false);
  return (
    <a href={href} title={label} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 38, height: 38, border: `1px solid ${hov ? 'var(--igf-orange)' : 'rgba(255,87,34,0.2)'}`,
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hov ? 'var(--igf-orange)' : 'rgba(255,240,234,0.5)', textDecoration: 'none',
        fontSize: '0.85rem', transition: 'all 0.25s',
        background: hov ? 'rgba(255,87,34,0.08)' : 'transparent',
        boxShadow: hov ? '0 0 14px rgba(255,87,34,0.25)' : 'none',
      }}>
      {icon}
    </a>
  );
};

export default function Footer() {
  const { settings } = useSite();
  const phone = settings?.contact?.contactPhone || '+91 92622 60376';
  const email = settings?.contact?.contactEmail || 'sales@indiangamefactory.in';
  const address = settings?.contact?.contactAddress || 'India';
  const hours = settings?.contact?.contactHours || 'Mon–Sat: 9 AM – 7 PM';
  const wa = settings?.contact?.contactWA || '919262260376';

  return (
    <>
      <style>{`
        .igf-footer { background: #080402; border-top: 1px solid rgba(255,87,34,0.1); position: relative; z-index: 1; overflow: hidden; }
        .igf-footer::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,87,34,0.4), rgba(192,57,43,0.3), rgba(255,171,64,0.2), transparent);
        }
        .igf-footer-glow {
          position: absolute; top: -80px; left: 50%; transform: translateX(-50%);
          width: 600px; height: 200px;
          background: radial-gradient(ellipse, rgba(255,87,34,0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .igf-footer-inner { padding: 70px 5% 36px; max-width: 1400px; margin: 0 auto; position: relative; z-index: 1; }
        .igf-footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1.1fr;
          gap: 48px;
          margin-bottom: 56px;
        }
        .igf-footer-col-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.52rem; letter-spacing: 0.3em;
          color: var(--igf-orange); text-transform: uppercase;
          margin-bottom: 20px; padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,87,34,0.12);
          display: flex; align-items: center; gap: 8px;
        }
        .igf-footer-col-title::before {
          content: '';
          width: 3px; height: 14px;
          background: var(--igf-orange); border-radius: 1px;
          box-shadow: 0 0 8px rgba(255,87,34,0.6);
        }
        .igf-footer-links { display: flex; flex-direction: column; gap: 10px; }
        .igf-footer-bottom {
          border-top: 1px solid rgba(255,87,34,0.08);
          padding-top: 28px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 14px;
        }
        .igf-footer-contact-row {
          display: flex; align-items: flex-start; gap: 12px;
          margin-bottom: 12px;
        }
        .igf-footer-contact-icon {
          font-size: 0.9rem; flex-shrink: 0; margin-top: 2px;
          width: 28px; height: 28px;
          background: rgba(255,87,34,0.08);
          border: 1px solid rgba(255,87,34,0.15);
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .igf-wa-btn {
          position: fixed; bottom: 28px; right: 28px; z-index: 200;
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, #1da851, #25d366);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(37,211,102,0.4), 0 0 0 0 rgba(37,211,102,0.4);
          text-decoration: none; font-size: 1.55rem;
          transition: transform 0.3s, box-shadow 0.3s;
          animation: waPulse 3s infinite;
        }
        .igf-wa-btn:hover { transform: scale(1.12); box-shadow: 0 8px 32px rgba(37,211,102,0.6); }
        @keyframes waPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(37,211,102,0.4), 0 0 0 0 rgba(37,211,102,0.35); }
          50% { box-shadow: 0 4px 20px rgba(37,211,102,0.4), 0 0 0 12px rgba(37,211,102,0); }
        }
        @media (max-width: 900px) {
          .igf-footer-grid { grid-template-columns: 1fr 1fr; gap: 36px; }
        }
        @media (max-width: 560px) {
          .igf-footer-grid { grid-template-columns: 1fr; gap: 28px; }
          .igf-footer-inner { padding: 44px 5% 28px; }
        }
      `}</style>

      <footer className="igf-footer">
        <div className="igf-footer-glow" />
        <div className="igf-footer-inner">
          <div className="igf-footer-grid">

            {/* Brand column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <svg style={{ width: 42, height: 50, flexShrink: 0 }} viewBox="0 0 100 120" fill="none">
                  <rect x="18" y="28" width="64" height="36" rx="3" fill="#c0392b" stroke="#1a1a1a" strokeWidth="3"/>
                  <rect x="24" y="20" width="12" height="12" rx="1" fill="#c0392b" stroke="#1a1a1a" strokeWidth="2.5"/>
                  <rect x="44" y="16" width="12" height="16" rx="1" fill="#c0392b" stroke="#1a1a1a" strokeWidth="2.5"/>
                  <rect x="64" y="20" width="12" height="12" rx="1" fill="#c0392b" stroke="#1a1a1a" strokeWidth="2.5"/>
                  <rect x="30" y="34" width="8" height="8" rx="1" fill="#1a1a1a" opacity="0.6"/>
                  <rect x="46" y="34" width="8" height="8" rx="1" fill="#1a1a1a" opacity="0.6"/>
                  <rect x="62" y="34" width="8" height="8" rx="1" fill="#1a1a1a" opacity="0.6"/>
                  <rect x="12" y="54" width="76" height="40" rx="20" fill="#c0392b" stroke="#1a1a1a" strokeWidth="3"/>
                  <rect x="25" y="67" width="6" height="14" rx="1" fill="#1a1a1a"/>
                  <rect x="21" y="71" width="14" height="6" rx="1" fill="#1a1a1a"/>
                  <circle cx="69" cy="68" r="3.5" fill="#1a1a1a"/>
                  <circle cx="76" cy="74" r="3.5" fill="#1a1a1a"/>
                  <circle cx="62" cy="74" r="3.5" fill="#1a1a1a"/>
                </svg>
                <div style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  <div style={{ color: 'var(--igf-orange)', fontSize: '1rem', fontWeight: 900, letterSpacing: '0.06em', textShadow: '0 0 20px rgba(255,87,34,0.6)' }}>
                    {settings?.identity?.brandName1 || 'INDIAN'}
                  </div>
                  <div style={{ color: 'rgba(255,240,234,0.55)', fontSize: '0.56rem', letterSpacing: '0.32em' }}>
                    {settings?.identity?.brandName2 || 'GAME FACTORY'}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.83rem', color: 'rgba(255,240,234,0.45)', lineHeight: 1.8, marginBottom: 24, fontFamily: 'DM Sans, sans-serif' }}>
                {settings?.identity?.footerAbout || "India's premier arcade & amusement equipment manufacturer. Serving FECs, malls, and entertainment centers nationwide."}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <SocialBtn href="#" icon="f" label="Facebook" />
                <SocialBtn href="#" icon="▶" label="YouTube" />
                <SocialBtn href="#" icon="in" label="LinkedIn" />
                <SocialBtn href={`https://wa.me/${wa}`} icon="💬" label="WhatsApp" />
              </div>
              <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', flexShrink: 0, animation: 'pulse 2s infinite' }} />
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.48rem', color: '#4ade80', letterSpacing: '0.15em' }}>SHOWROOM OPEN TODAY</span>
              </div>
            </div>

            {/* Products */}
            <div>
              <div className="igf-footer-col-title">Products</div>
              <div className="igf-footer-links">
                {['Air Hockey Tables','VR Simulators','Bumper Cars','Basketball Machines','Bowling Alleys','Trampoline Parks','Kiddy Rides','Redemption Games'].map(p => (
                  <FooterLink key={p} href="/#products">{p}</FooterLink>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <div className="igf-footer-col-title">Services</div>
              <div className="igf-footer-links">
                {['FEC Setup Consulting','Installation & Training','Annual Maintenance','Spare Parts Supply','Custom Game Zones','Game Zone Design','Project Financing','Demo Visits'].map(s => (
                  <span key={s} style={{ color: 'rgba(255,240,234,0.45)', fontSize: '0.84rem', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4, display: 'block' }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <div className="igf-footer-col-title">Contact</div>
              <div style={{ marginBottom: 20 }}>
                <div className="igf-footer-contact-row">
                  <div className="igf-footer-contact-icon">📍</div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,240,234,0.5)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>{address}</div>
                </div>
                <div className="igf-footer-contact-row">
                  <div className="igf-footer-contact-icon">📞</div>
                  <div>
                    <a href={`tel:${phone}`} style={{ color: 'var(--igf-amber)', textDecoration: 'none', fontSize: '0.88rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>{phone}</a>
                  </div>
                </div>
                <div className="igf-footer-contact-row">
                  <div className="igf-footer-contact-icon">✉</div>
                  <div>
                    <a href={`mailto:${email}`} style={{ color: 'var(--igf-amber)', textDecoration: 'none', fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif' }}>{email}</a>
                  </div>
                </div>
                <div className="igf-footer-contact-row">
                  <div className="igf-footer-contact-icon">🕐</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,240,234,0.4)', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>{hours}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link to="/order-tracking" style={{
                  fontFamily: 'Orbitron, sans-serif', fontSize: '0.52rem', letterSpacing: '0.12em',
                  color: 'var(--igf-orange)', textDecoration: 'none', padding: '8px 14px',
                  border: '1px solid rgba(255,87,34,0.3)', borderRadius: 4, transition: 'all 0.25s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,87,34,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  📦 TRACK ORDER
                </Link>
                <Link to="/admin" style={{
                  fontFamily: 'Orbitron, sans-serif', fontSize: '0.52rem', letterSpacing: '0.12em',
                  color: 'rgba(255,240,234,0.35)', textDecoration: 'none', padding: '8px 14px',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, transition: 'all 0.25s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,87,34,0.3)'; e.currentTarget.style.color = 'var(--igf-orange)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,240,234,0.35)'; }}>
                  ⚙️ ADMIN
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="igf-footer-bottom">
            <div style={{ color: 'rgba(255,240,234,0.25)', fontSize: '0.75rem', fontFamily: 'DM Sans, sans-serif' }}>
              {settings?.identity?.footerCopyright || `© ${new Date().getFullYear()} Indian Game Factory. All rights reserved.`}
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map(l => (
                <a key={l} href="#" style={{ color: 'rgba(255,240,234,0.25)', textDecoration: 'none', fontSize: '0.72rem', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--igf-orange)'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,240,234,0.25)'}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp floating button */}
      {settings?.visibility?.wa !== false && (
        <a
          href={`https://wa.me/${wa}?text=Hi! I'm interested in your gaming equipment.`}
          target="_blank" rel="noopener noreferrer"
          className="igf-wa-btn"
          title="Chat on WhatsApp"
        >
          💬
        </a>
      )}
    </>
  );
}
