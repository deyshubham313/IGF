import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import Drawer from './Drawer';
import AuthModal from './AuthModal';

const IGFLogo = () => {
  const { settings } = useSite();
  return (
    <Link to="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0 }}>
      <div style={{ position: 'relative', width: 42, height: 42 }}>
        <svg style={{ width: 42, height: 42 }} viewBox="0 0 100 120" fill="none">
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
      </div>
      <div style={{ fontFamily: 'Orbitron, sans-serif', lineHeight: 1.15 }}>
        <span style={{ display: 'block', color: 'var(--igf-orange)', fontSize: '1rem', fontWeight: 900, letterSpacing: '0.06em', textShadow: '0 0 18px rgba(255,87,34,0.7)' }}>
          {settings?.identity?.brandName1 || 'INDIAN'}
        </span>
        <span style={{ display: 'block', color: 'rgba(255,240,234,0.75)', fontSize: '0.58rem', letterSpacing: '0.32em', fontWeight: 400 }}>
          {settings?.identity?.brandName2 || 'GAME FACTORY'}
        </span>
      </div>
    </Link>
  );
};

const NavLink = ({ href, to, children, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const base = {
    color: hovered ? 'var(--igf-orange)' : 'rgba(255,240,234,0.65)',
    textDecoration: 'none',
    fontSize: '0.78rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    transition: 'color 0.25s',
    fontFamily: 'Syne, sans-serif',
    fontWeight: 600,
    position: 'relative',
    paddingBottom: 2,
  };
  const underline = {
    position: 'absolute', bottom: -2, left: 0,
    width: hovered ? '100%' : '0%',
    height: 1,
    background: 'var(--igf-orange)',
    transition: 'width 0.3s cubic-bezier(0.23,1,0.32,1)',
    boxShadow: '0 0 8px rgba(255,87,34,0.6)',
  };
  const inner = <><span>{children}</span><span style={underline}/></>;
  if (to) return <Link to={to} style={base} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onClick}>{inner}</Link>;
  return <a href={href} style={base} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onClick}>{inner}</a>;
};

const IconBtn = ({ onClick, title, badge, children }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick} title={title} aria-label={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', background: hov ? 'rgba(255,87,34,0.1)' : 'transparent',
        border: `1px solid ${hov ? 'var(--igf-orange)' : 'rgba(255,87,34,0.22)'}`,
        color: hov ? 'var(--igf-orange)' : 'rgba(255,240,234,0.6)',
        width: 38, height: 38, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: '1rem', transition: 'all 0.25s', flexShrink: 0,
      }}
    >
      {children}
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: -5, right: -5,
          background: 'var(--igf-orange)', color: '#fff',
          fontFamily: 'Orbitron, sans-serif', fontSize: '0.42rem', fontWeight: 700,
          minWidth: 17, height: 17, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid var(--bg-void)', padding: '0 3px',
        }}>
          {badge}
        </span>
      )}
    </button>
  );
};

export default function Navbar() {
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [signInHov, setSignInHov] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [location]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => { if (!e.target.closest('[data-user-menu]')) setUserMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const isHomePage = location.pathname === '/';

  return (
    <>
      <style>{`
        .igf-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 5%; height: 70px;
          background: rgba(10,6,4,0.9);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255,87,34,0.15);
          transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
        }
        .igf-nav.scrolled {
          background: rgba(8,4,2,0.97);
          border-bottom-color: rgba(255,87,34,0.22);
          box-shadow: 0 4px 40px rgba(0,0,0,0.6), 0 1px 0 rgba(255,87,34,0.12);
        }
        .igf-nav::after {
          content: '';
          position: absolute; bottom: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,87,34,0.35), rgba(192,57,43,0.25), transparent);
          opacity: ${scrolled ? 1 : 0};
          transition: opacity 0.4s;
        }
        .igf-nav-links { display: flex; gap: 2rem; list-style: none; align-items: center; }
        .igf-nav-cta-primary {
          padding: 9px 22px;
          background: linear-gradient(135deg, var(--igf-red), var(--igf-orange));
          color: #fff; border: none;
          font-family: 'Orbitron', sans-serif;
          font-size: 0.62rem; font-weight: 700; letter-spacing: 0.18em;
          cursor: pointer; text-decoration: none; white-space: nowrap;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
          transition: all 0.3s; display: inline-flex; align-items: center; gap: 5px;
        }
        .igf-nav-cta-primary:hover { box-shadow: 0 0 30px rgba(255,87,34,0.5), 0 0 60px rgba(255,87,34,0.2); transform: translateY(-1px); }
        .igf-nav-cta-ghost {
          padding: 8px 18px;
          background: transparent;
          border: 1px solid rgba(255,87,34,0.3);
          color: var(--igf-orange);
          font-family: 'Orbitron', sans-serif;
          font-size: 0.62rem; letter-spacing: 0.15em;
          cursor: pointer; text-decoration: none; white-space: nowrap;
          transition: all 0.3s; display: inline-block; border-radius: 2px;
        }
        .igf-nav-cta-ghost:hover { background: rgba(255,87,34,0.1); box-shadow: 0 0 20px rgba(255,87,34,0.2); border-color: var(--igf-orange); }
        .igf-hamburger {
          display: none; flex-direction: column; gap: 5px;
          background: transparent; border: 1px solid rgba(255,87,34,0.25);
          padding: 9px 10px; border-radius: 4px; cursor: pointer;
        }
        .igf-hamburger span {
          display: block; width: 22px; height: 1.5px;
          background: var(--igf-orange); border-radius: 1px;
          transition: all 0.3s cubic-bezier(0.23,1,0.32,1);
          transform-origin: center;
        }
        .igf-mobile-menu {
          position: fixed; top: 70px; left: 0; right: 0; z-index: 999;
          background: rgba(8,4,2,0.98);
          border-bottom: 1px solid rgba(255,87,34,0.15);
          backdrop-filter: blur(24px);
          display: flex; flex-direction: column; gap: 2px;
          padding: 12px 5% 20px;
          transform: translateY(-110%);
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.23,1,0.32,1), opacity 0.3s;
          pointer-events: none;
        }
        .igf-mobile-menu.open { transform: translateY(0); opacity: 1; pointer-events: all; }
        .igf-mobile-menu a, .igf-mobile-menu button {
          display: block; padding: 12px 8px;
          color: rgba(255,240,234,0.65); text-decoration: none;
          font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 600;
          border-bottom: 1px solid rgba(255,87,34,0.06);
          background: transparent; border-left: none; border-right: none; border-top: none;
          text-align: left; width: 100%; cursor: pointer;
          transition: color 0.2s, padding-left 0.2s;
        }
        .igf-mobile-menu a:hover, .igf-mobile-menu button:hover { color: var(--igf-orange); padding-left: 16px; }
        @media (max-width: 900px) {
          .igf-nav-links, .igf-nav-ctas { display: none !important; }
          .igf-hamburger { display: flex !important; }
        }
        @media (max-width: 480px) {
          .igf-nav { padding: 0 4%; }
        }
      `}</style>

      <nav className={`igf-nav${scrolled ? ' scrolled' : ''}`}>
        <IGFLogo />

        {/* Desktop nav links */}
        <ul className="igf-nav-links" style={{ margin: 0, padding: 0 }}>
          {isHomePage ? (
            <>
              <li><NavLink href="#about">About</NavLink></li>
              <li><NavLink href="#products">Products</NavLink></li>
              <li><NavLink href="#showcase">Gallery</NavLink></li>
              <li><NavLink href="#why">Why IGF</NavLink></li>
              <li><NavLink href="#contact">Contact</NavLink></li>
            </>
          ) : (
            <li><NavLink to="/">← Back to Home</NavLink></li>
          )}
        </ul>

        {/* Right-side actions */}
        <div className="igf-nav-ctas" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconBtn onClick={() => setWishOpen(true)} title="Wishlist" badge={wishlist.length}>❤</IconBtn>
          <IconBtn onClick={() => setCartOpen(true)} title="Enquiry Cart" badge={cartCount}>🛒</IconBtn>

          {user ? (
            <div style={{ position: 'relative' }} data-user-menu="true">
              <button
                data-user-menu="true"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  padding: '8px 14px', borderRadius: 4, cursor: 'pointer',
                  background: userMenuOpen ? 'rgba(255,87,34,0.12)' : 'transparent',
                  border: `1px solid ${userMenuOpen ? 'var(--igf-orange)' : 'rgba(255,87,34,0.25)'}`,
                  color: userMenuOpen ? 'var(--igf-orange)' : 'rgba(255,240,234,0.65)',
                  fontFamily: 'Orbitron, sans-serif', fontSize: '0.58rem',
                  letterSpacing: '0.12em', transition: 'all 0.25s',
                }}
              >
                👤 {user.name?.split(' ')[0]?.toUpperCase() || 'ACCOUNT'}
              </button>
              {userMenuOpen && (
                <div data-user-menu="true" style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: 'rgba(14,7,4,0.98)', border: '1px solid rgba(255,87,34,0.2)',
                  borderRadius: 8, padding: '8px 0', minWidth: 190,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,87,34,0.08)',
                  backdropFilter: 'blur(16px)',
                }}>
                  <div style={{ padding: '8px 16px 10px', fontFamily: 'Orbitron,sans-serif', fontSize: '0.44rem', color: 'var(--text-dim)', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,87,34,0.1)' }}>
                    {user.email}
                  </div>
                  {[{ to: '/order-tracking', label: '📦 Track Orders' }].map(({ to, label }) => (
                    <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                      style={{ display: 'block', padding: '10px 16px', color: 'rgba(255,240,234,0.65)', textDecoration: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: '0.85rem', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,87,34,0.08)'; e.currentTarget.style.color = 'var(--igf-orange)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,240,234,0.65)'; }}>
                      {label}
                    </Link>
                  ))}
                  <button onClick={() => { logout(); setUserMenuOpen(false); }}
                    style={{ display: 'block', width: '100%', padding: '10px 16px', color: '#ef4444', background: 'transparent', border: 'none', fontFamily: 'DM Sans,sans-serif', fontSize: '0.85rem', textAlign: 'left', cursor: 'pointer', marginTop: 2, transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    ⏻ Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              onMouseEnter={() => setSignInHov(true)}
              onMouseLeave={() => setSignInHov(false)}
              style={{
                background: signInHov ? 'rgba(255,87,34,0.1)' : 'transparent',
                border: '1px solid rgba(255,87,34,0.3)', color: 'var(--igf-orange)',
                padding: '8px 16px', borderRadius: 4,
                fontFamily: 'Orbitron, sans-serif', fontSize: '0.62rem',
                letterSpacing: '0.12em', cursor: 'pointer', transition: 'all 0.25s',
              }}>
              👤 SIGN IN
            </button>
          )}

          <Link to="/payment" className="igf-nav-cta-primary">Pay Now ⚡</Link>
          <a href={isHomePage ? '#contact' : '/#contact'} className="igf-nav-cta-ghost">Get Quote</a>

          {/* Hamburger */}
          <button
            className="igf-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span style={{ transform: mobileOpen ? 'rotate(45deg) translate(4px, 5px)' : 'none' }} />
            <span style={{ opacity: mobileOpen ? 0 : 1, transform: mobileOpen ? 'scaleX(0)' : 'none' }} />
            <span style={{ transform: mobileOpen ? 'rotate(-45deg) translate(4px, -5px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`igf-mobile-menu${mobileOpen ? ' open' : ''}`}>
        {isHomePage ? (
          <>
            <a href="#about" onClick={() => setMobileOpen(false)}>About</a>
            <a href="#products" onClick={() => setMobileOpen(false)}>Products</a>
            <a href="#showcase" onClick={() => setMobileOpen(false)}>Gallery</a>
            <a href="#why" onClick={() => setMobileOpen(false)}>Why IGF</a>
            <a href="#contact" onClick={() => setMobileOpen(false)}>Contact</a>
          </>
        ) : (
          <Link to="/" onClick={() => setMobileOpen(false)}>← Back to Home</Link>
        )}
        <Link to="/payment" onClick={() => setMobileOpen(false)} style={{ color: 'var(--igf-amber) !important', fontWeight: 700 }}>⚡ Pay Now</Link>
        <Link to="/order-tracking" onClick={() => setMobileOpen(false)}>📦 Track Order</Link>
        {user
          ? <button onClick={() => { logout(); setMobileOpen(false); }} style={{ color: '#ef4444' }}>⏻ Sign Out</button>
          : <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }} style={{ color: 'var(--igf-orange)' }}>👤 Sign In / Register</button>
        }
      </div>

      <Drawer type="wishlist" open={wishOpen} onClose={() => setWishOpen(false)} />
      <Drawer type="cart" open={cartOpen} onClose={() => setCartOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
