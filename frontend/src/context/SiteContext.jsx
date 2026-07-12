import { createContext, useContext, useState, useEffect } from 'react';

const SiteContext = createContext(null);

export const DEFAULT_SETTINGS = {
  identity: {
    brandName1: 'INDIAN',
    brandName2: 'GAME FACTORY',
    brandTagline: "India's #1 Gaming Equipment Manufacturer",
    footerAbout: "India's most comprehensive gaming & amusement equipment manufacturer. We help entrepreneurs and malls build thriving entertainment destinations with world-class solutions.",
    footerCopyright: '© 2026 Indian Game Factory',
    footerTagline: "Made with ⚡ for India's gaming entrepreneurs",
  },
  design: {
    colorPrimaryHex: '#ff5722',
    colorSecondaryHex: '#c0392b',
    colorAccentHex: '#ffab40',
    colorBgHex: '#0d0705',
    fontHeading: 'Orbitron',
    fontSub: 'Syne',
    fontBody: 'DM Sans',
  },
  hero: {
    heroBadge: "India's #1 Gaming Equipment Manufacturer",
    heroTitle1: 'POWER UP YOUR',
    heroTitle2: 'GAMING EMPIRE',
    heroSub: 'From hyper-immersive VR arenas to classic redemption machines — we supply, install and maintain premium amusement equipment for entertainment hubs, malls, and family entertainment centers across India.',
    heroBtnPrimary: 'Explore Products',
    heroBtnSecondary: 'Request a Demo',
    stats: [
      { label: 'Installations', value: '500+' },
      { label: 'Years Experience', value: '15+' },
      { label: 'Product Lines', value: '50+' },
    ],
  },
  about: {
    aboutTag: 'Who We Are',
    aboutCta: 'Partner With Us',
    aboutTitle: "India's Most Trusted Amusement Equipment Partner",
    aboutDesc: "We're not just suppliers — we're experience architects. From concept to commissioning, our team ensures every installation delivers maximum engagement and return on investment.",
    aboutFeatures: [
      'Widest product range in India — 50+ equipment categories',
      'End-to-end project support: layout planning to installation',
      'Dedicated after-sales service & maintenance contracts',
      'Certified quality — international safety standards',
      'Custom branding & white-label solutions available',
    ],
    aboutBadgeNum: '15+',
    aboutBadgeLabel: 'Years in Business',
    aboutImgPath: 'assets/girl-playing-computer-game-in-e-sport-club-2025-03-18-12-43-19-utc-scaled.jpg',
  },
  gallery: [
    { id: '1', title: 'VR Simulator Center', sub: 'Immersive 9D Experience', tags: 'VR, Simulator', url: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?auto=format&fit=crop&q=80&w=800' },
    { id: '2', title: 'Bumper Car Arena', sub: 'Indoor Amusement Setup', tags: 'Bumper Cars', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800' },
    { id: '3', title: 'Soft Play Zone', sub: 'Active Play for Kids', tags: 'Soft Play', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800' },
  ],
  testimonials: [
    { id: '1', name: 'Arjun Malhotra', role: 'Owner — GameZone Delhi', quote: 'Outstanding product quality and their team was with us every step — from floor planning to launch day. Our arcade has been running flawlessly for two years.', stars: '★★★★★', avatar: 'AM' },
    { id: '2', name: 'Priya Sharma', role: 'Director — FunWorld Franchise', quote: 'We opened three FECs in a year — their pricing, support, and product range is unmatched in the market. True partners.', stars: '★★★★★', avatar: 'PS' },
    { id: '3', name: 'Vikram Kapoor', role: 'GM — Phoenix Palladium Mumbai', quote: 'The VR installation became the most talked-about attraction in our mall. ROI was achieved within 5 months. Highly recommend.', stars: '★★★★★', avatar: 'VK' },
  ],
  ticker: [
    '🔥 VR 9D Simulator — New Stock Arrived',
    '⚡ Up to 15% Off on Bulk Orders',
    '🛠 PAN India Installation Support',
    '📦 Ready to Ship Inventory Available',
  ],
  contact: {
    contactAddress: '123 Industrial Zone, Sector 44, Gurugram, Haryana 122003',
    contactPhone: '+91 92622 60376',
    contactWA: '919262260376',
    contactEmail: 'sales@indiangamefactory.in',
    contactHours: 'Mon–Sat: 9 AM – 7 PM',
    ctaTitle1: 'Ready to Build Your',
    ctaTitle2: 'Ultimate Game Zone?',
    ctaSub: 'Get a free layout consultation and product recommendations tailored to your space.',
  },
  whyUs: {
    whyTag: 'Our Edge',
    whyTitle: 'Why Businesses Choose Us',
    whyDesc: "We've built a reputation on reliability, innovation and being genuine partners in your success.",
    whyQuoteText: '"Indian Game Factory completely transformed our FEC. Their machines are rugged, visually stunning, and highly profitable."',
    whyQuoteAuthor: 'Manoj K. — Operations Director',
    whyCards: [
      { icon: '/assets/Biggest-Showroom-in-India-1.svg', title: 'Largest Showroom in India', text: 'Visit our massive 10,000 sq.ft physical experience center. Test all machines live before making a decision.' },
      { icon: '/assets/Quality-Safety-First-1.svg', title: 'Quality & Safety Certified', text: 'All machines adhere to strict international safety and quality standards (CE & ISO Certified).' },
      { icon: '/assets/Reliable-Service-Delivery-1.svg', title: 'Pan-India Support & Logistics', text: 'We guarantee secure, timely delivery anywhere in India, backed by expert installation teams and 24/7 service support.' },
    ],
  },
  payment: {
    razorpayKey: '',
    businessName: 'Indian Game Factory',
    upiId: '9262260376@ptsbi',
    contactPhone: '+91 92622 60376',
    qrPath: 'assets/upi-qr.png',
    presetAmounts: [
      { amount: 500, label: '₹500' },
      { amount: 1000, label: '₹1,000' },
      { amount: 2500, label: '₹2,500' },
      { amount: 5000, label: '₹5,000' },
      { amount: 10000, label: '₹10,000' },
    ],
  },
  visibility: {
    hero: true,
    ticker: true,
    about: true,
    categories: true,
    showcase: true,
    why: true,
    cta: true,
    testimonials: true,
    contact: true,
    wa: true,
  },
  seo: {
    metaTitle: 'Indian Game Factory — Premium Gaming & Amusement Solutions',
    metaDesc: "India's most trusted amusement equipment manufacturer. Air Hockey, Bumper Cars, VR, Trampoline Parks and more.",
  },
};

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        // Deep merge: server data overrides defaults but keeps defaults for missing keys
        setSettings((prev) => deepMerge(prev, data));
      }
    } catch (err) {
      console.warn('Could not fetch site settings, using defaults:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Apply design tokens to CSS variables
  useEffect(() => {
    if (!settings?.design) return;
    const { colorPrimaryHex, colorSecondaryHex, colorAccentHex, colorBgHex, fontHeading, fontSub, fontBody } = settings.design;
    const root = document.documentElement;
    if (colorPrimaryHex) root.style.setProperty('--igf-orange', colorPrimaryHex);
    if (colorSecondaryHex) root.style.setProperty('--igf-red', colorSecondaryHex);
    if (colorAccentHex) root.style.setProperty('--igf-amber', colorAccentHex);
    if (colorBgHex) root.style.setProperty('--bg-void', colorBgHex);
    if (fontHeading) root.style.setProperty('--font-heading', `'${fontHeading}', sans-serif`);
    if (fontSub) root.style.setProperty('--font-sub', `'${fontSub}', sans-serif`);
    if (fontBody) root.style.setProperty('--font-body', `'${fontBody}', sans-serif`);

    // Dynamic Google Fonts
    const fonts = [fontHeading, fontSub, fontBody].filter(Boolean);
    if (fonts.length) {
      const linkId = 'dynamic-cms-google-fonts';
      let link = document.getElementById(linkId);
      if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = `https://fonts.googleapis.com/css2?family=${fonts.map((f) => f.replace(/\s+/g, '+')).join('&family=')}&display=swap`;
    }
  }, [settings]);

  return (
    <SiteContext.Provider value={{ settings, loading, refetchSettings: fetchSettings, setSettings }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}

// Deep merge helper
function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
