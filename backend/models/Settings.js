const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // Singleton key — always "main"
    key: { type: String, default: 'main', unique: true },
    identity: {
      brandName1: { type: String, default: 'INDIAN' },
      brandName2: { type: String, default: 'GAME FACTORY' },
      brandTagline: { type: String, default: "India's #1 Gaming Equipment Manufacturer" },
      footerAbout: { type: String, default: "India's most comprehensive gaming & amusement equipment manufacturer." },
      footerCopyright: { type: String, default: '© 2026 Indian Game Factory' },
      footerTagline: { type: String, default: "Made with ⚡ for India's gaming entrepreneurs" },
    },
    design: {
      colorPrimaryHex: { type: String, default: '#ff5722' },
      colorSecondaryHex: { type: String, default: '#c0392b' },
      colorAccentHex: { type: String, default: '#ffab40' },
      colorBgHex: { type: String, default: '#0d0705' },
      fontHeading: { type: String, default: 'Orbitron' },
      fontSub: { type: String, default: 'Syne' },
      fontBody: { type: String, default: 'DM Sans' },
    },
    hero: {
      heroBadge: { type: String, default: "India's #1 Gaming Equipment Manufacturer" },
      heroTitle1: { type: String, default: 'POWER UP YOUR' },
      heroTitle2: { type: String, default: 'GAMING EMPIRE' },
      heroSub: { type: String, default: 'From hyper-immersive VR arenas to classic redemption machines — we supply, install and maintain premium amusement equipment for entertainment hubs, malls, and family entertainment centers across India.' },
      heroBtnPrimary: { type: String, default: 'Explore Products' },
      heroBtnSecondary: { type: String, default: 'Request a Demo' },
      stats: {
        type: [{ label: String, value: String }],
        default: [
          { label: 'Installations', value: '500+' },
          { label: 'Years Experience', value: '15+' },
          { label: 'Product Lines', value: '50+' },
        ],
      },
    },
    about: {
      aboutTag: { type: String, default: 'Who We Are' },
      aboutCta: { type: String, default: 'Partner With Us' },
      aboutTitle: { type: String, default: "India's Most Trusted Amusement Equipment Partner" },
      aboutDesc: { type: String, default: "We're not just suppliers — we're experience architects." },
      aboutFeatures: { type: [String], default: ['Widest product range in India — 50+ equipment categories', 'End-to-end project support: layout planning to installation', 'Dedicated after-sales service & maintenance contracts', 'Certified quality — international safety standards', 'Custom branding & white-label solutions available'] },
      aboutBadgeNum: { type: String, default: '15+' },
      aboutBadgeLabel: { type: String, default: 'Years in Business' },
      aboutImgPath: { type: String, default: 'assets/girl-playing-computer-game-in-e-sport-club-2025-03-18-12-43-19-utc-scaled.jpg' },
    },
    gallery: {
      type: [{ id: String, title: String, sub: String, tags: String, url: String }],
      default: [
        { id: '1', title: 'VR Simulator Center', sub: 'Immersive 9D Experience', tags: 'VR, Simulator', url: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?auto=format&fit=crop&q=80&w=800' },
        { id: '2', title: 'Bumper Car Arena', sub: 'Indoor Amusement Setup', tags: 'Bumper Cars', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800' },
        { id: '3', title: 'Soft Play Zone', sub: 'Active Play for Kids', tags: 'Soft Play', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800' },
      ],
    },
    testimonials: {
      type: [{ id: String, name: String, role: String, quote: String, stars: String, avatar: String }],
      default: [
        { id: '1', name: 'Arjun Malhotra', role: 'Owner — GameZone Delhi', quote: 'Outstanding product quality and their team was with us every step — from floor planning to launch day.', stars: '★★★★★', avatar: 'AM' },
        { id: '2', name: 'Priya Sharma', role: 'Director — FunWorld Franchise', quote: "We opened three FECs in a year. Their pricing, support, and product range is unmatched.", stars: '★★★★★', avatar: 'PS' },
        { id: '3', name: 'Vikram Kapoor', role: 'GM — Phoenix Palladium Mumbai', quote: 'The VR installation became the most talked-about attraction in our mall. ROI achieved in 5 months.', stars: '★★★★★', avatar: 'VK' },
      ],
    },
    ticker: {
      type: [String],
      default: [
        '🔥 VR 9D Simulator — New Stock Arrived',
        '⚡ Up to 15% Off on Bulk Orders',
        '🛠 PAN India Installation Support',
        '📦 Ready to Ship Inventory Available',
      ],
    },
    contact: {
      contactAddress: { type: String, default: '123 Industrial Zone, Sector 44, Gurugram, Haryana 122003' },
      contactPhone: { type: String, default: '+91 92622 60376' },
      contactWA: { type: String, default: '919262260376' },
      contactEmail: { type: String, default: 'sales@indiangamefactory.in' },
      contactHours: { type: String, default: 'Mon–Sat: 9 AM – 7 PM' },
      ctaTitle1: { type: String, default: 'Ready to Build Your' },
      ctaTitle2: { type: String, default: 'Ultimate Game Zone?' },
      ctaSub: { type: String, default: 'Get a free layout consultation and product recommendations tailored to your space.' },
    },
    whyUs: {
      whyTag: { type: String, default: 'Our Edge' },
      whyTitle: { type: String, default: 'Why Businesses Choose Us' },
      whyDesc: { type: String, default: "We've built a reputation on reliability, innovation and being genuine partners in your success." },
      whyQuoteText: { type: String, default: '"Indian Game Factory completely transformed our FEC. Their machines are rugged, visually stunning, and highly profitable."' },
      whyQuoteAuthor: { type: String, default: 'Manoj K. — Operations Director' },
      whyCards: {
        type: [{ icon: String, title: String, text: String }],
        default: [
          { icon: '/assets/Biggest-Showroom-in-India-1.svg', title: 'Largest Showroom in India', text: 'Visit our massive 10,000 sq.ft physical experience center. Test all machines live before making a decision.' },
          { icon: '/assets/Quality-Safety-First-1.svg', title: 'Quality & Safety Certified', text: 'All machines adhere to strict international safety and quality standards (CE & ISO Certified).' },
          { icon: '/assets/Reliable-Service-Delivery-1.svg', title: 'Pan-India Support & Logistics', text: 'We guarantee secure, timely delivery anywhere in India, backed by expert installation teams and 24/7 service support.' },
        ],
      },
    },
    payment: {
      razorpayKey: { type: String, default: '' },
      businessName: { type: String, default: 'Indian Game Factory' },
      upiId: { type: String, default: '9262260376@ptsbi' },
      contactPhone: { type: String, default: '+91 92622 60376' },
      qrPath: { type: String, default: 'assets/upi-qr.png' },
      presetAmounts: {
        type: [{ amount: Number, label: String }],
        default: [
          { amount: 500, label: '₹500' },
          { amount: 1000, label: '₹1,000' },
          { amount: 2500, label: '₹2,500' },
          { amount: 5000, label: '₹5,000' },
          { amount: 10000, label: '₹10,000' },
        ],
      },
    },
    visibility: {
      hero: { type: Boolean, default: true },
      ticker: { type: Boolean, default: true },
      about: { type: Boolean, default: true },
      categories: { type: Boolean, default: true },
      showcase: { type: Boolean, default: true },
      why: { type: Boolean, default: true },
      cta: { type: Boolean, default: true },
      testimonials: { type: Boolean, default: true },
      contact: { type: Boolean, default: true },
      wa: { type: Boolean, default: true },
    },
    seo: {
      metaTitle: { type: String, default: 'Indian Game Factory — Premium Gaming & Amusement Solutions' },
      metaDesc: { type: String, default: "India's most trusted amusement equipment manufacturer. Air Hockey, Bumper Cars, VR, Trampoline Parks and more." },
    },
    customCategories: {
      type: [{ id: String, name: String, icon: String }],
      default: []
    },
    coupons: {
      type: [{
        code: { type: String, required: true },
        pct: { type: Number, required: true },
        expiry: { type: String, required: true },
        uses: { type: Number, default: 0 },
        maxUses: { type: Number, default: 100 }
      }],
      default: [
        { code: 'IGF10', pct: 10, expiry: '2026-12-31', uses: 45, maxUses: 100 },
        { code: 'NEXUS20', pct: 20, expiry: '2026-09-30', uses: 12, maxUses: 50 },
        { code: 'WELCOME', pct: 5, expiry: '2026-12-31', uses: 88, maxUses: 200 },
        { code: 'PREMIUM15', pct: 15, expiry: '2026-08-31', uses: 7, maxUses: 30 },
        { code: 'IGF2026', pct: 12, expiry: '2026-12-31', uses: 23, maxUses: 80 }
      ]
    },
    razorpay: {
      keyId: { type: String, default: '' },
      keySecret: { type: String, default: '' },
      testKeyId: { type: String, default: '' },
      testKeySecret: { type: String, default: '' },
      mode: { type: String, enum: ['test', 'live'], default: 'test' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
