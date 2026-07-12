import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import ProductCard from '../components/ProductCard';
import { useToast } from '../components/Toast';
import { submitInquiry, getProducts, getCategories } from '../services/api';
import { useSite } from '../context/SiteContext';

/* ─────────────────────────────────────────────────────────────
   TICKER STRIP
───────────────────────────────────────────────────────────── */
function Ticker({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="igf-ticker" id="tickerSectionEl">
      <div className="igf-ticker-inner" id="tickerInnerEl">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="igf-ticker-item">
            {item} <span className="igf-ticker-sep">★</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HERO THREE.JS CANVAS
───────────────────────────────────────────────────────────── */
function HeroCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 50;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    const count = 1600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const igfColors = [[1, 0.34, 0.13], [0.75, 0.22, 0.17], [1, 0.67, 0.25], [1, 0.44, 0.26]];
    for (let i = 0; i < count; i++) {
      positions[i*3] = (Math.random()-0.5)*200;
      positions[i*3+1] = (Math.random()-0.5)*200;
      positions[i*3+2] = (Math.random()-0.5)*200;
      const c = igfColors[Math.floor(Math.random()*igfColors.length)];
      colors[i*3]=c[0]; colors[i*3+1]=c[1]; colors[i*3+2]=c[2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size:0.65, vertexColors:true, transparent:true, opacity:0.7 }));
    scene.add(pts);
    [[60,0.18,0xff5722,0.9,0.4],[40,0.12,0xc0392b,0.6,0.3],[25,0.09,0xffab40,0.4,0.5]].forEach(([r,t,c,rx,ry])=>{
      const m = new THREE.Mesh(new THREE.TorusGeometry(r,t,8,60),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.1+Math.random()*0.06,wireframe:true}));
      m.rotation.x = rx; m.rotation.y = ry;
      m.userData = { rotX: 0.0008*(Math.random()+0.5), rotY: 0.0006*(Math.random()+0.5) };
      scene.add(m);
    });
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      scene.children.forEach(obj => { if(obj.userData.rotX){ obj.rotation.x+=obj.userData.rotX; obj.rotation.y+=obj.userData.rotY; } });
      pts.rotation.y += 0.0002;
      renderer.render(scene, camera);
    };
    animate();
    const onResize = () => {
      if(!canvas) return;
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      camera.aspect = canvas.clientWidth/canvas.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); renderer.dispose(); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} id="hero-canvas" />;
}

/* ─────────────────────────────────────────────────────────────
   MAIN HOMEPAGE
───────────────────────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { settings } = useSite();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [loading, setLoading] = useState(true);
  const [catOverlayOpen, setCatOverlayOpen] = useState(false);
  const [activeCatId, setActiveCatId] = useState(null);
  const [form, setForm] = useState({ name:'', phone:'', email:'', productInterest:'', location:'', budget:'', message:'' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pRes, cRes] = await Promise.all([getProducts({ limit:200 }), getCategories()]);
        setProducts(pRes.data.products || []);
        setCategories(cRes.data.categories || []);
      } catch (err) {
        console.error('Failed to load:', err.message);
        showToast('Failed to load products. Please refresh.', 'error');
      } finally { setLoading(false); }
    }
    load();
  }, []);

  let filteredProducts = [...products];
  if (activeFilter !== 'all') filteredProducts = filteredProducts.filter(p => p.category === activeFilter);
  if (searchQuery) {
    const s = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(s) || (p.categoryName && p.categoryName.toLowerCase().includes(s)));
  }
  if (sortBy === 'az') filteredProducts.sort((a,b) => a.name.localeCompare(b.name));
  if (sortBy === 'za') filteredProducts.sort((a,b) => b.name.localeCompare(a.name));

  const handleContactSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true);
    try {
      await submitInquiry(form);
      showToast('Enquiry sent! We\'ll contact you within 24 hours.', 'success');
      setForm({ name:'', phone:'', email:'', productInterest:'', location:'', budget:'', message:'' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send. Please try again.', 'error');
    } finally { setFormLoading(false); }
  };

  const openCatOverlay = (catId) => { setActiveCatId(catId); setCatOverlayOpen(true); };
  const activeCategory = categories.find(c => c._id === activeCatId) || null;
  const overlayProducts = activeCategory ? products.filter(p => p.category === activeCatId) : [];

  return (
    <>
      <style>{`
        /* ── TICKER ── */
        .igf-ticker {
          background: linear-gradient(90deg, #0a0604, rgba(255,87,34,0.05), #0a0604);
          border-top: 1px solid rgba(255,87,34,0.15);
          border-bottom: 1px solid rgba(255,87,34,0.15);
          overflow: hidden; white-space: nowrap;
          padding: 9px 0; position: relative;
        }
        .igf-ticker::before, .igf-ticker::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 80px; z-index: 2;
        }
        .igf-ticker::before { left: 0; background: linear-gradient(90deg, #0a0604, transparent); }
        .igf-ticker::after { right: 0; background: linear-gradient(-90deg, #0a0604, transparent); }
        .igf-ticker-inner { display: inline-flex; animation: tickerRoll 35s linear infinite; }
        .igf-ticker-item {
          display: inline-block; padding: 0 28px;
          font-family: 'Orbitron', sans-serif; font-size: 0.52rem;
          letter-spacing: 0.2em; color: rgba(255,240,234,0.55);
          text-transform: uppercase;
        }
        .igf-ticker-sep { color: var(--igf-orange); margin-left: 28px; }
        @keyframes tickerRoll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        /* ── SECTION ── */
        .hp-section { padding: 100px 5%; max-width: 1400px; margin: 0 auto; }
        .hp-section-header { margin-bottom: 60px; }
        .hp-section-tag {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Orbitron', sans-serif; font-size: 0.55rem;
          letter-spacing: 0.3em; color: var(--igf-orange);
          text-transform: uppercase; margin-bottom: 12px;
        }
        .hp-section-tag::before {
          content: ''; width: 4px; height: 4px; border-radius: 50%;
          background: var(--igf-orange); box-shadow: 0 0 8px var(--igf-orange);
        }
        .hp-section-title {
          font-family: 'Orbitron', sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.8rem);
          font-weight: 900; color: var(--text-primary); line-height: 1.1;
          margin-bottom: 12px;
        }
        .hp-section-title .hi {
          background: linear-gradient(90deg, #ff5722, #ffab40);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hp-section-desc { color: rgba(255,240,234,0.5); font-size: 1rem; line-height: 1.7; max-width: 560px; }

        /* ── ABOUT ── */
        .about-grid {
          display: grid; grid-template-columns: 1fr 1.1fr;
          gap: 64px; align-items: center;
        }
        .about-img-frame {
          position: relative; border-radius: 12px; overflow: hidden;
          background: #0a0604;
          box-shadow: 0 0 0 1px rgba(255,87,34,0.15), 0 40px 80px rgba(0,0,0,0.6);
        }
        .about-img-frame img {
          width: 100%; aspect-ratio: 4/3; object-fit: cover;
          display: block; filter: brightness(0.9) saturate(1.1);
          transition: transform 0.6s ease, filter 0.4s;
        }
        .about-img-frame:hover img { transform: scale(1.03); filter: brightness(1) saturate(1.2); }
        .about-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(45deg, rgba(10,6,4,0.4), transparent);
        }
        .about-badge {
          position: absolute; bottom: 20px; left: 20px;
          background: rgba(10,6,4,0.9); backdrop-filter: blur(10px);
          border: 1px solid rgba(255,87,34,0.3); border-radius: 8px;
          padding: 14px 18px; text-align: center;
        }
        .about-badge-num { font-family: 'Orbitron',sans-serif; font-size: 2rem; font-weight: 900; color: var(--igf-orange); line-height: 1; }
        .about-badge-label { font-size: 0.72rem; color: rgba(255,240,234,0.5); margin-top: 3px; }
        .about-corner { position: absolute; width: 20px; height: 20px; }
        .about-corner.tl { top: -1px; left: -1px; border-top: 2px solid var(--igf-orange); border-left: 2px solid var(--igf-orange); border-radius: 2px 0 0 0; }
        .about-corner.tr { top: -1px; right: -1px; border-top: 2px solid var(--igf-orange); border-right: 2px solid var(--igf-orange); border-radius: 0 2px 0 0; }
        .about-corner.bl { bottom: -1px; left: -1px; border-bottom: 2px solid var(--igf-orange); border-left: 2px solid var(--igf-orange); border-radius: 0 0 0 2px; }
        .about-corner.br { bottom: -1px; right: -1px; border-bottom: 2px solid var(--igf-orange); border-right: 2px solid var(--igf-orange); border-radius: 0 0 2px 0; }
        .about-feat {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 0; border-bottom: 1px solid rgba(255,87,34,0.08);
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: rgba(255,240,234,0.65);
          line-height: 1.5;
        }
        .about-feat::before {
          content: ''; width: 7px; height: 7px; border-radius: 50%;
          background: var(--igf-orange); box-shadow: 0 0 8px rgba(255,87,34,0.5);
          flex-shrink: 0; margin-top: 7px;
        }

        /* ── PRODUCT GRID ── */
        .hp-products-section { padding: 80px 0; }
        .hp-products-inner { max-width: 1400px; margin: 0 auto; padding: 0 5%; }
        .hp-search-bar {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          background: rgba(15,8,5,0.9); border: 1px solid rgba(255,87,34,0.12);
          border-radius: 10px; padding: 14px 18px; margin-bottom: 32px;
        }
        .hp-search-input-wrap { position: relative; flex: 1; min-width: 200px; }
        .hp-search-input {
          width: 100%; background: rgba(255,87,34,0.04);
          border: 1px solid rgba(255,87,34,0.15); color: var(--text-primary);
          padding: 10px 16px 10px 40px; font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
          outline: none; border-radius: 6px; transition: border-color 0.3s, box-shadow 0.3s;
        }
        .hp-search-input:focus { border-color: var(--igf-orange); box-shadow: 0 0 0 3px rgba(255,87,34,0.08); }
        .hp-search-input::placeholder { color: rgba(255,240,234,0.3); }
        .hp-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(255,240,234,0.3); font-size: 0.9rem; pointer-events: none; }
        .hp-filter-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .hp-filter-pill {
          padding: 7px 16px; border: 1px solid rgba(255,87,34,0.18);
          background: transparent; color: rgba(255,240,234,0.45);
          font-family: 'Orbitron', sans-serif; font-size: 0.48rem; letter-spacing: 0.12em;
          cursor: pointer; border-radius: 20px; transition: all 0.25s; white-space: nowrap;
        }
        .hp-filter-pill:hover, .hp-filter-pill.active {
          border-color: var(--igf-orange); color: var(--igf-orange);
          background: rgba(255,87,34,0.08); box-shadow: 0 0 14px rgba(255,87,34,0.15);
        }
        .hp-sort-select {
          background: rgba(255,87,34,0.04); border: 1px solid rgba(255,87,34,0.15);
          color: rgba(255,240,234,0.55); padding: 9px 12px;
          font-family: 'Orbitron', sans-serif; font-size: 0.48rem;
          outline: none; cursor: pointer; border-radius: 6px; transition: border-color 0.3s;
        }
        .hp-sort-select:focus { border-color: var(--igf-orange); }
        .hp-results-count {
          font-family: 'Orbitron', sans-serif; font-size: 0.48rem;
          color: rgba(255,240,234,0.35); letter-spacing: 0.12em; white-space: nowrap; margin-left: auto;
        }
        /* Product category cards */
        .hp-prod-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .hp-cat-card {
          background: rgba(15,8,5,0.8); border: 1px solid rgba(255,87,34,0.1);
          border-radius: 12px; overflow: hidden; cursor: pointer;
          transition: all 0.4s cubic-bezier(0.23,1,0.32,1);
          position: relative;
        }
        .hp-cat-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,87,34,0.06), transparent);
          opacity: 0; transition: opacity 0.4s;
        }
        .hp-cat-card:hover { border-color: rgba(255,87,34,0.4); transform: translateY(-6px); box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 30px rgba(255,87,34,0.1); }
        .hp-cat-card:hover::before { opacity: 1; }
        .hp-cat-thumb { position: relative; height: 200px; overflow: hidden; background: #0a0604; }
        .hp-cat-thumb img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.8) saturate(1.1); transition: transform 0.6s ease, filter 0.4s; display: block; }
        .hp-cat-card:hover .hp-cat-thumb img { transform: scale(1.08); filter: brightness(0.95) saturate(1.3); }
        .hp-cat-thumb-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, rgba(10,6,4,0.85)); }
        .hp-cat-view-pill {
          position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%) translateY(8px);
          background: var(--igf-orange); color: #0d0705;
          font-family: 'Orbitron', sans-serif; font-size: 0.44rem; letter-spacing: 0.2em;
          padding: 5px 14px; border-radius: 20px; white-space: nowrap;
          opacity: 0; transition: all 0.3s;
        }
        .hp-cat-card:hover .hp-cat-view-pill { opacity: 1; transform: translateX(-50%) translateY(0); }
        .hp-cat-body { padding: 18px 20px 20px; }
        .hp-cat-count {
          display: flex; align-items: center; gap: 6px;
          font-family: 'Orbitron', sans-serif; font-size: 0.44rem;
          letter-spacing: 0.18em; color: var(--igf-orange); margin-bottom: 6px;
        }
        .hp-cat-count-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--igf-orange); box-shadow: 0 0 6px var(--igf-orange); }
        .hp-cat-name { font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; line-height: 1.2; }
        .hp-cat-desc { font-family: 'DM Sans', sans-serif; font-size: 0.8rem; color: rgba(255,240,234,0.45); line-height: 1.5; }
        .hp-cat-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,87,34,0.08); }
        .hp-cat-explore { font-family: 'Orbitron', sans-serif; font-size: 0.44rem; letter-spacing: 0.2em; color: var(--igf-orange); }
        .hp-cat-arrow { font-size: 1.2rem; color: var(--igf-orange); transition: transform 0.3s; }
        .hp-cat-card:hover .hp-cat-arrow { transform: translateX(4px); }

        /* ── SHOWCASE ── */
        .showcase-section { padding: 0 5% 100px; max-width: 1400px; margin: 0 auto; }
        .showcase-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .showcase-card {
          border-radius: 12px; overflow: hidden; position: relative;
          cursor: pointer; group: true;
          background: rgba(10,6,4,0.8); border: 1px solid rgba(255,87,34,0.1);
          transition: all 0.4s cubic-bezier(0.23,1,0.32,1);
        }
        .showcase-card:hover { border-color: rgba(255,87,34,0.35); transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
        .showcase-tag {
          position: absolute; top: 14px; left: 14px; z-index: 2;
          font-family: 'Orbitron', sans-serif; font-size: 0.42rem; letter-spacing: 0.22em;
          padding: 5px 12px; background: rgba(10,6,4,0.85); border: 1px solid rgba(255,87,34,0.3);
          color: var(--igf-orange); border-radius: 20px; backdrop-filter: blur(8px);
        }
        .showcase-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; filter: brightness(0.75) saturate(1.1); transition: transform 0.6s, filter 0.4s; }
        .showcase-card:hover .showcase-img { transform: scale(1.05); filter: brightness(0.9) saturate(1.2); }
        .showcase-body { padding: 18px; background: linear-gradient(to bottom, transparent, rgba(10,6,4,0.95)); position: absolute; bottom: 0; left: 0; right: 0; }
        .showcase-cat { font-family: 'Orbitron', sans-serif; font-size: 0.42rem; letter-spacing: 0.18em; color: var(--igf-orange); margin-bottom: 4px; }
        .showcase-name { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: var(--text-primary); }
        .showcase-text { font-family: 'DM Sans', sans-serif; font-size: 0.78rem; color: rgba(255,240,234,0.5); margin-top: 4px; display: none; }
        .showcase-card:hover .showcase-text { display: block; }

        /* ── WHY SECTION ── */
        .why-section { padding: 100px 5%; background: linear-gradient(to right, rgba(255,87,34,0.02), transparent); border-top: 1px solid rgba(255,87,34,0.06); border-bottom: 1px solid rgba(255,87,34,0.06); }
        .why-inner { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 1.1fr 1fr; gap: 64px; align-items: center; }
        .why-cards { display: flex; flex-direction: column; gap: 20px; }
        .why-card-item {
          display: flex; gap: 18px; padding: 22px 24px;
          background: rgba(15,8,5,0.8); border: 1px solid rgba(255,87,34,0.1); border-radius: 10px;
          transition: all 0.35s;
        }
        .why-card-item:hover { border-color: rgba(255,87,34,0.3); background: rgba(22,11,6,0.9); transform: translateX(6px); box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
        .why-card-icon { width: 52px; height: 52px; flex-shrink: 0; border-radius: 8px; background: rgba(255,87,34,0.08); border: 1px solid rgba(255,87,34,0.2); display: flex; align-items: center; justify-content: center; }
        .why-card-icon img { width: 30px; height: 30px; object-fit: contain; filter: brightness(0) saturate(100%) invert(50%) sepia(100%) saturate(800%) hue-rotate(340deg); }
        .why-card-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 5px; }
        .why-card-text { font-family: 'DM Sans', sans-serif; font-size: 0.82rem; color: rgba(255,240,234,0.5); line-height: 1.6; }
        .why-visual-wrap { position: relative; border-radius: 14px; overflow: hidden; }
        .why-visual-img { width: 100%; display: block; border-radius: 14px; filter: brightness(0.7) saturate(1.1); }
        .why-visual-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,6,4,0.9) 0%, rgba(10,6,4,0.2) 50%, transparent); }
        .why-quote-box { position: absolute; bottom: 0; left: 0; right: 0; padding: 28px 24px; }
        .why-quote-text { font-family: 'DM Sans', sans-serif; font-size: 0.92rem; font-style: italic; color: rgba(255,240,234,0.8); line-height: 1.7; margin-bottom: 10px; }
        .why-quote-author { font-family: 'Orbitron', sans-serif; font-size: 0.48rem; letter-spacing: 0.15em; color: var(--igf-orange); }

        /* ── CTA ── */
        .cta-section {
          padding: 90px 5%; position: relative; overflow: hidden;
          background: linear-gradient(135deg, rgba(255,87,34,0.06), rgba(192,57,43,0.04), transparent);
          border-top: 1px solid rgba(255,87,34,0.12); border-bottom: 1px solid rgba(255,87,34,0.12);
        }
        .cta-glow { position: absolute; top: -100px; left: 50%; transform: translateX(-50%); width: 700px; height: 350px; background: radial-gradient(ellipse, rgba(255,87,34,0.12) 0%, transparent 70%); pointer-events: none; }
        .cta-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 40px; flex-wrap: wrap; position: relative; z-index: 1; }
        .cta-title { font-family: 'Orbitron', sans-serif; font-size: clamp(1.6rem,3vw,2.4rem); font-weight: 900; color: var(--text-primary); line-height: 1.15; margin-bottom: 10px; }
        .cta-title .hi { color: var(--igf-orange); text-shadow: 0 0 30px rgba(255,87,34,0.4); }
        .cta-sub { color: rgba(255,240,234,0.5); font-size: 0.95rem; line-height: 1.7; max-width: 420px; }
        .cta-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 14px; }
        .cta-phone { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; font-weight: 900; color: var(--igf-orange); text-decoration: none; text-shadow: 0 0 20px rgba(255,87,34,0.4); transition: all 0.3s; }
        .cta-phone:hover { color: var(--igf-amber); text-shadow: 0 0 30px rgba(255,171,64,0.5); }
        .cta-btn { padding: 14px 36px; background: linear-gradient(135deg, var(--igf-red), var(--igf-orange)); color: #fff; font-family: 'Orbitron', sans-serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.18em; text-decoration: none; clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px)); transition: all 0.3s; display: inline-block; }
        .cta-btn:hover { box-shadow: 0 0 40px rgba(255,87,34,0.5); transform: translateY(-2px); }

        /* ── TESTIMONIALS ── */
        .testi-section { padding: 100px 5%; max-width: 1400px; margin: 0 auto; }
        .testi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .testi-card {
          background: rgba(15,8,5,0.8); border: 1px solid rgba(255,87,34,0.1); border-radius: 12px;
          padding: 28px; display: flex; flex-direction: column; gap: 16px;
          transition: all 0.35s;
        }
        .testi-card:hover { border-color: rgba(255,87,34,0.28); background: rgba(22,11,6,0.9); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
        .testi-stars { color: var(--igf-amber); font-size: 0.9rem; letter-spacing: 2px; }
        .testi-quote-icon { font-size: 2rem; color: rgba(255,87,34,0.2); line-height: 1; margin-bottom: -8px; }
        .testi-text { font-family: 'DM Sans', sans-serif; font-size: 0.88rem; color: rgba(255,240,234,0.6); line-height: 1.8; font-style: italic; flex: 1; }
        .testi-author { display: flex; align-items: center; gap: 12px; margin-top: 4px; border-top: 1px solid rgba(255,87,34,0.08); padding-top: 16px; }
        .testi-avatar { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, var(--igf-red), var(--igf-orange)); display: flex; align-items: center; justify-content: center; font-family: 'Orbitron', sans-serif; font-size: 0.7rem; font-weight: 700; color: #fff; flex-shrink: 0; box-shadow: 0 0 16px rgba(255,87,34,0.3); }
        .testi-name { font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
        .testi-role { font-family: 'Orbitron', sans-serif; font-size: 0.42rem; letter-spacing: 0.12em; color: rgba(255,240,234,0.35); margin-top: 2px; }

        /* ── CONTACT ── */
        .contact-section { padding: 100px 5%; max-width: 1400px; margin: 0 auto; }
        .contact-grid { display: grid; grid-template-columns: 1fr 1.6fr; gap: 56px; }
        .contact-info-col { display: flex; flex-direction: column; gap: 28px; }
        .contact-info-item { display: flex; gap: 14px; }
        .contact-info-icon { width: 44px; height: 44px; border-radius: 8px; background: rgba(255,87,34,0.08); border: 1px solid rgba(255,87,34,0.2); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
        .contact-info-label { font-family: 'Orbitron', sans-serif; font-size: 0.44rem; letter-spacing: 0.2em; color: var(--igf-orange); text-transform: uppercase; margin-bottom: 4px; }
        .contact-info-value { font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: rgba(255,240,234,0.65); line-height: 1.5; }
        .contact-form-box { background: rgba(15,8,5,0.8); border: 1px solid rgba(255,87,34,0.12); border-radius: 14px; padding: 36px; position: relative; overflow: hidden; }
        .contact-form-box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,87,34,0.4), transparent); }
        .contact-form { display: flex; flex-direction: column; gap: 16px; }
        .contact-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .contact-field { display: flex; flex-direction: column; gap: 6px; }
        .contact-field label { font-family: 'Orbitron', sans-serif; font-size: 0.44rem; letter-spacing: 0.2em; color: rgba(255,240,234,0.35); text-transform: uppercase; }
        .contact-field input, .contact-field select, .contact-field textarea {
          background: rgba(255,87,34,0.03); border: 1px solid rgba(255,87,34,0.12);
          color: var(--text-primary); padding: 12px 14px;
          font-family: 'DM Sans', sans-serif; font-size: 0.88rem;
          outline: none; border-radius: 6px; transition: border-color 0.3s, box-shadow 0.3s, background 0.3s;
        }
        .contact-field input:focus, .contact-field select:focus, .contact-field textarea:focus {
          border-color: rgba(255,87,34,0.45); background: rgba(255,87,34,0.05);
          box-shadow: 0 0 0 3px rgba(255,87,34,0.08);
        }
        .contact-field input::placeholder, .contact-field textarea::placeholder { color: rgba(255,240,234,0.2); }
        .contact-field select option { background: #120805; }
        .contact-field textarea { resize: vertical; min-height: 100px; }
        .contact-submit { padding: 14px 36px; background: linear-gradient(135deg, var(--igf-red), var(--igf-orange)); color: #fff; border: none; font-family: 'Orbitron', sans-serif; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.2em; cursor: pointer; clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px)); transition: all 0.3s; align-self: flex-start; }
        .contact-submit:hover { box-shadow: 0 0 40px rgba(255,87,34,0.5); transform: translateY(-2px); }
        .contact-submit:disabled { opacity: 0.6; transform: none; }

        /* ── CATEGORY OVERLAY ── */
        .cat-overlay {
          position: fixed; inset: 0; z-index: 5000;
          background: rgba(5,2,1,0.97); backdrop-filter: blur(8px);
          opacity: 0; pointer-events: none;
          transition: opacity 0.4s cubic-bezier(0.23,1,0.32,1);
          overflow-y: auto;
        }
        .cat-overlay.open { opacity: 1; pointer-events: all; }
        .cat-overlay-inner { max-width: 1100px; margin: 0 auto; padding: 40px 5% 80px; }
        .cat-back-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Orbitron', sans-serif; font-size: 0.55rem; letter-spacing: 0.2em;
          color: var(--igf-orange); background: transparent;
          border: 1px solid rgba(255,87,34,0.25); padding: 10px 20px; border-radius: 4px;
          cursor: pointer; margin-bottom: 36px; transition: all 0.25s;
        }
        .cat-back-btn:hover { background: rgba(255,87,34,0.08); border-color: var(--igf-orange); }
        .cat-hero { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
        .cat-icon-large { width: 60px; height: 60px; border-radius: 10px; background: rgba(255,87,34,0.1); border: 1px solid rgba(255,87,34,0.25); display: flex; align-items: center; justify-content: center; }
        .cat-icon-large img { width: 36px; height: 36px; object-fit: contain; filter: brightness(0) saturate(100%) invert(50%) sepia(100%) saturate(800%) hue-rotate(340deg); }
        .cat-tag-label { font-family: 'Orbitron', sans-serif; font-size: 0.5rem; letter-spacing: 0.2em; color: var(--igf-orange); margin-bottom: 5px; }
        .cat-title { font-family: 'Orbitron', sans-serif; font-size: clamp(1.6rem,3vw,2.6rem); font-weight: 900; color: var(--text-primary); }
        .cat-desc { font-size: 0.9rem; color: rgba(255,240,234,0.45); line-height: 1.7; margin-bottom: 28px; }
        .cat-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,87,34,0.3), transparent); margin-bottom: 28px; }
        .cat-products-label { font-family: 'Orbitron', sans-serif; font-size: 0.5rem; letter-spacing: 0.25em; color: var(--text-muted); margin-bottom: 20px; }
        .cat-products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .cat-prod-card { background: rgba(15,8,5,0.9); border: 1px solid rgba(255,87,34,0.1); border-radius: 10px; overflow: hidden; cursor: pointer; transition: all 0.35s; }
        .cat-prod-card:hover { border-color: rgba(255,87,34,0.35); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
        .cat-prod-img { width: 100%; height: 160px; object-fit: cover; display: block; filter: brightness(0.8); transition: filter 0.3s, transform 0.4s; }
        .cat-prod-card:hover .cat-prod-img { filter: brightness(0.95); transform: scale(1.04); }
        .cat-prod-body { padding: 14px 16px; }
        .cat-prod-name { font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
        .cat-prod-tag { font-family: 'Orbitron', sans-serif; font-size: 0.42rem; letter-spacing: 0.15em; color: var(--igf-orange); margin-top: 4px; }

        /* ── SECTION DIVIDER ── */
        .hp-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,87,34,0.2), rgba(192,57,43,0.15), transparent); margin: 0 5%; }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .about-grid, .why-inner, .contact-grid { grid-template-columns: 1fr; }
          .showcase-grid { grid-template-columns: 1fr 1fr; }
          .contact-form-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .hp-section { padding: 70px 5%; }
          .showcase-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── HERO ── */}
      {settings?.visibility?.hero !== false && (
        <section className="hero">
          <HeroCanvas />
          <div className="hero-content">
            <div className="hero-badge">
              {settings?.hero?.heroBadge || settings?.identity?.brandTagline || "India's #1 Gaming Equipment Manufacturer"}
            </div>
            <h1 className="hero-title" style={{ fontFamily: settings?.design?.fontHeading ? `'${settings.design.fontHeading}', sans-serif` : 'Orbitron, sans-serif' }}>
              <span className="line1">{settings?.hero?.heroTitle1 || 'POWER UP YOUR'}</span>
              <span className="line3">{settings?.hero?.heroTitle2 || 'GAMING EMPIRE'}</span>
            </h1>
            <p className="hero-sub" style={{ fontFamily: settings?.design?.fontBody ? `'${settings.design.fontBody}', sans-serif` : 'DM Sans, sans-serif' }}>
              {settings?.hero?.heroSub || "From hyper-immersive VR arenas to classic redemption machines — we supply, install and maintain premium amusement equipment for entertainment hubs, malls, and family entertainment centers across India."}
            </p>
            <div className="hero-actions">
              <a href="#products" className="btn-primary">{settings?.hero?.heroBtnPrimary || 'Explore Products'}</a>
              <a href="#contact" className="btn-secondary">{settings?.hero?.heroBtnSecondary || 'Request a Demo'}</a>
            </div>
            <div className="hero-stats">
              {(settings?.hero?.stats || [
                { value: '500+', label: 'Installations' },
                { value: '15+', label: 'Years Experience' },
                { value: '50+', label: 'Product Lines' },
              ]).map((s, i) => (
                <div key={i} className="stat-item">
                  <div className="stat-num">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TICKER ── */}
      {settings?.visibility?.ticker !== false && <Ticker items={settings?.ticker} />}

      {/* ── ABOUT ── */}
      {settings?.visibility?.about !== false && (
        <section id="about">
          <div className="hp-section">
            <div className="about-grid">
              <div>
                <div className="about-img-frame">
                  <img
                    src={`/${settings?.about?.aboutImgPath || 'assets/girl-playing-computer-game-in-e-sport-club-2025-03-18-12-43-19-utc-scaled.jpg'}`}
                    alt="Gaming Experience"
                    onError={e => { e.target.src = '/assets/logo2-scaled.png'; }}
                  />
                  <div className="about-img-overlay" />
                  <div className="about-badge">
                    <div className="about-badge-num">{settings?.about?.aboutBadgeNum || '15+'}</div>
                    <div className="about-badge-label">{settings?.about?.aboutBadgeLabel || 'Years in Business'}</div>
                  </div>
                  <div className="about-corner tl" /><div className="about-corner tr" />
                  <div className="about-corner bl" /><div className="about-corner br" />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="hp-section-header" style={{ marginBottom: 28 }}>
                  <div className="hp-section-tag">{settings?.about?.aboutTag || 'Who We Are'}</div>
                  <h2 className="hp-section-title">
                    {settings?.about?.aboutTitle ? (
                      <span dangerouslySetInnerHTML={{ __html: settings.about.aboutTitle.replace(/Amusement|Trusted|Most/, '<span class="hi">$&</span>') }} />
                    ) : (
                      <span>India's Most Trusted <span className="hi">Amusement</span> Equipment Partner</span>
                    )}
                  </h2>
                  {settings?.about?.aboutDesc && <p className="hp-section-desc">{settings.about.aboutDesc}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {(settings?.about?.aboutFeatures || [
                    'Widest product range in India — 50+ equipment categories',
                    'End-to-end project support: layout planning to installation',
                    'Dedicated after-sales service & maintenance contracts',
                    'Certified quality — international safety standards',
                    'Custom branding & white-label solutions available',
                  ]).map((feat, i) => <div key={i} className="about-feat">{feat}</div>)}
                </div>
                <div style={{ marginTop: '2rem' }}>
                  <a href="#contact" className="btn-primary">{settings?.about?.aboutCta || 'Partner With Us'}</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="hp-divider" />

      {/* ── PRODUCTS CATALOG ── */}
      {settings?.visibility?.categories !== false && (
        <section id="products" className="hp-products-section">
          <div className="hp-products-inner">
            <div className="hp-section-header">
              <div className="hp-section-tag">Our Catalog</div>
              <h2 className="hp-section-title">Complete <span className="hi">Product</span> Lineup</h2>
              <p className="hp-section-desc">Every category of amusement equipment, sourced globally and backed by our expertise.</p>
            </div>

            <div className="hp-search-bar">
              <div className="hp-search-input-wrap">
                <span className="hp-search-icon">🔍</span>
                <input
                  className="hp-search-input" type="text"
                  placeholder="Search products, categories..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="hp-filter-pills">
                <button className={`hp-filter-pill${activeFilter === 'all' ? ' active' : ''}`} onClick={() => setActiveFilter('all')}>All</button>
                {categories.map(cat => (
                  <button key={cat._id} className={`hp-filter-pill${activeFilter === cat._id ? ' active' : ''}`} onClick={() => setActiveFilter(cat._id)}>
                    {cat.name}
                  </button>
                ))}
              </div>
              <select className="hp-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="default">Default Order</option>
                <option value="az">A — Z</option>
                <option value="za">Z — A</option>
              </select>
              <span className="hp-results-count">
                {loading ? 'LOADING...' : `${filteredProducts.length} MACHINES`}
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,240,234,0.3)', fontFamily: 'Orbitron,sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em' }}>
                LOADING PRODUCTS...
              </div>
            ) : (
              <div className="hp-prod-grid">
                {categories.map(cat => {
                  const previewProd = products.find(p => p.category === cat._id);
                  const previewImage = previewProd ? previewProd.image : (cat.icon || 'assets/logo2-scaled.png');
                  return (
                    <div key={cat._id} className="hp-cat-card" onClick={() => openCatOverlay(cat._id)}>
                      <div className="hp-cat-thumb">
                        <img
                          src={previewImage.startsWith('http') || previewImage.startsWith('data:') || previewImage.startsWith('/') ? previewImage : `/${previewImage}`}
                          alt={cat.name}
                          onError={e => { e.target.src = '/assets/logo2-scaled.png'; }}
                        />
                        <div className="hp-cat-thumb-overlay" />
                        <div className="hp-cat-view-pill">VIEW PRODUCTS</div>
                      </div>
                      <div className="hp-cat-body">
                        <div className="hp-cat-count"><span className="hp-cat-count-dot" />{cat.count} MODELS</div>
                        <div className="hp-cat-name">{cat.name}</div>
                        <div className="hp-cat-desc">Premium grade machines tailored for high performance and durability.</div>
                        <div className="hp-cat-footer">
                          <span className="hp-cat-explore">EXPLORE →</span>
                          <div className="hp-cat-arrow">›</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SHOWCASE ── */}
      {settings?.visibility?.showcase !== false && (
        <section id="showcase">
          <div className="hp-section">
            <div className="hp-section-header">
              <div className="hp-section-tag">In Action</div>
              <h2 className="hp-section-title">Featured <span className="hi">Installations</span></h2>
            </div>
            <div className="showcase-grid">
              {(settings?.gallery || [
                { tags:'VR / IMMERSIVE', url:'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?auto=format&fit=crop&q=80&w=800', sub:'Virtual Reality', title:'VR Arena Setup', text:'Full motion platform with 6-player configuration and custom game library.' },
                { tags:'SPORTS', url:'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800', sub:'Bowling Alley', title:'Mini Bowling Lane', text:'8-lane setup with cosmic neon lighting and auto-scoring system.' },
                { tags:'ACTIVE PLAY', url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800', sub:'Soft Play', title:'Indoor Soft Play Zone', text:'Multi-level structure with slides, tunnels, and foam play areas.' },
              ]).map((item, idx) => (
                <div key={idx} className="showcase-card">
                  <div className="showcase-tag">{item.tags || item.tag || 'GALLERY'}</div>
                  <img
                    className="showcase-img"
                    src={item.url?.startsWith('http') || item.url?.startsWith('data:') || item.url?.startsWith('/') ? item.url : `/${item.url || item.img}`}
                    alt={item.title || item.name}
                    onError={e => { e.target.src = '/assets/logo2-scaled.png'; }}
                  />
                  <div className="showcase-body">
                    <div className="showcase-cat">{item.sub || item.cat}</div>
                    <div className="showcase-name">{item.title || item.name}</div>
                    <div className="showcase-text">{item.text || item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── WHY CHOOSE US ── */}
      {settings?.visibility?.why !== false && (
        <div id="why" className="why-section">
          <div className="why-inner">
            <div>
              <div className="hp-section-header" style={{ marginBottom: 28 }}>
                <div className="hp-section-tag">{settings?.whyUs?.whyTag || 'Our Advantage'}</div>
                <h2 className="hp-section-title">{settings?.whyUs?.whyTitle || 'Why Choose Indian Game Factory'}</h2>
                {settings?.whyUs?.whyDesc && <p className="hp-section-desc">{settings.whyUs.whyDesc}</p>}
              </div>
              <div className="why-cards">
                {(settings?.whyUs?.whyCards || [
                  { icon:'/assets/Biggest-Showroom-in-India-1.svg', title:'Largest Showroom in India', text:'Visit our massive 10,000 sq.ft physical experience center. Test all machines live before making a decision.' },
                  { icon:'/assets/Quality-Safety-First-1.svg', title:'Quality & Safety Certified', text:'All machines adhere to strict international safety and quality standards (CE & ISO Certified).' },
                  { icon:'/assets/Reliable-Service-Delivery-1.svg', title:'Pan-India Support & Logistics', text:'We guarantee secure, timely delivery anywhere in India, backed by expert installation teams and 24/7 service support.' },
                ]).map((card, i) => (
                  <div key={i} className="why-card-item">
                    <div className="why-card-icon">
                      <img src={card.icon} alt="" onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <div>
                      <div className="why-card-title">{card.title}</div>
                      <div className="why-card-text">{card.text || card.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="why-visual-wrap">
              <img src="/assets/HGR-CTA-2.png" alt="Showroom Display" className="why-visual-img" onError={e => { e.target.src = '/assets/logo2-scaled.png'; }} />
              <div className="why-visual-overlay" />
              <div className="why-quote-box">
                <p className="why-quote-text">{settings?.whyUs?.whyQuoteText || '"Indian Game Factory completely transformed our FEC. Their machines are rugged, visually stunning, and highly profitable."'}</p>
                <div className="why-quote-author">{settings?.whyUs?.whyQuoteAuthor || '— Manoj K., Operations Director'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CTA BANNER ── */}
      {settings?.visibility?.cta !== false && (
        <section className="cta-section">
          <div className="cta-glow" />
          <div className="cta-inner">
            <div>
              <h2 className="cta-title">
                {settings?.contact?.ctaTitle1 || 'Ready to Build Your'}{' '}
                <span className="hi">{settings?.contact?.ctaTitle2 || 'Ultimate Game Zone?'}</span>
              </h2>
              <p className="cta-sub">{settings?.contact?.ctaSub || 'Speak to our arcade consultants today to get a custom quotation.'}</p>
            </div>
            <div className="cta-actions">
              <a href={`tel:${settings?.contact?.contactPhone || '+919262260376'}`} className="cta-phone">
                {settings?.contact?.contactPhone || '+91 92622 60376'}
              </a>
              <a href="#contact" className="cta-btn">GET A QUOTE</a>
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      {settings?.visibility?.testimonials !== false && (
        <section>
          <div className="testi-section">
            <div className="hp-section-header" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 52px' }}>
              <div className="hp-section-tag" style={{ justifyContent: 'center' }}>Client Stories</div>
              <h2 className="hp-section-title">What Our <span className="hi">Partners</span> Say</h2>
            </div>
            <div className="testi-grid">
              {(settings?.testimonials || [
                { stars:'★★★★★', quote:'Outstanding product quality and their team was with us every step — from floor planning to launch day. Our arcade has been running flawlessly for two years.', avatar:'AM', name:'Arjun Malhotra', role:'Owner — GameZone Delhi' },
                { stars:'★★★★★', quote:'We opened three FECs in a year — their pricing, support, and product range is unmatched in the market. True partners.', avatar:'PS', name:'Priya Sharma', role:'Director — FunWorld Franchise' },
                { stars:'★★★★★', quote:'The VR installation became the most talked-about attraction in our mall. ROI was achieved within 5 months. Highly recommend.', avatar:'VK', name:'Vikram Kapoor', role:'GM — Phoenix Palladium Mumbai' },
              ]).map((t, idx) => (
                <div key={idx} className="testi-card">
                  <div className="testi-stars">{t.stars || '★★★★★'}</div>
                  <div className="testi-quote-icon">"</div>
                  <div className="testi-text">{t.quote || t.text}</div>
                  <div className="testi-author">
                    <div className="testi-avatar">{t.avatar || (t.name ? t.name[0] : 'U')}</div>
                    <div>
                      <div className="testi-name">{t.name}</div>
                      <div className="testi-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CONTACT ── */}
      {settings?.visibility?.contact !== false && (
        <section id="contact">
          <div className="contact-section">
            <div className="hp-section-header">
              <div className="hp-section-tag">Let's Talk</div>
              <h2 className="hp-section-title">Request a <span className="hi">Quotation</span></h2>
              <p className="hp-section-desc">Fill out the form below and our team will get back to you within 24 hours with a comprehensive proposal.</p>
            </div>
            <div className="contact-grid">
              <div className="contact-info-col">
                {[
                  { icon: '📍', label: 'MAIN SHOWROOM', value: settings?.contact?.contactAddress || '123 Industrial Zone, Sector 44, Gurugram, Haryana 122003' },
                  { icon: '📞', label: 'DIRECT LINE / WHATSAPP', value: settings?.contact?.contactPhone || '+91 92622 60376', href: `tel:${settings?.contact?.contactPhone || '+919262260376'}` },
                  { icon: '✉️', label: 'EMAIL INQUIRIES', value: settings?.contact?.contactEmail || 'sales@indiangamefactory.in', href: `mailto:${settings?.contact?.contactEmail}` },
                  { icon: '🕐', label: 'WORKING HOURS', value: settings?.contact?.contactHours || 'Mon–Sat: 9 AM – 7 PM' },
                ].map(item => (
                  <div key={item.label} className="contact-info-item">
                    <div className="contact-info-icon">{item.icon}</div>
                    <div>
                      <div className="contact-info-label">{item.label}</div>
                      {item.href
                        ? <a href={item.href} className="contact-info-value" style={{ color: 'var(--igf-amber)', textDecoration: 'none' }}>{item.value}</a>
                        : <div className="contact-info-value">{item.value}</div>
                      }
                    </div>
                  </div>
                ))}
              </div>
              <div className="contact-form-box">
                <form className="contact-form" onSubmit={handleContactSubmit}>
                  <div className="contact-form-row">
                    <div className="contact-field">
                      <label>FULL NAME</label>
                      <input required type="text" placeholder="Enter your name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div className="contact-field">
                      <label>PHONE NUMBER</label>
                      <input required type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    </div>
                  </div>
                  <div className="contact-form-row">
                    <div className="contact-field">
                      <label>EMAIL ADDRESS</label>
                      <input required type="email" placeholder="you@company.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                    <div className="contact-field">
                      <label>PRODUCT INTEREST</label>
                      <select required value={form.productInterest} onChange={e => setForm({...form, productInterest: e.target.value})}>
                        <option value="">Select Category</option>
                        {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                        <option value="Full Setup">Complete FEC Setup</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="contact-field">
                    <label>PROJECT DETAILS / MESSAGE</label>
                    <textarea required placeholder="Describe your requirements, location size, or any specific models..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
                  </div>
                  <button type="submit" className="contact-submit" disabled={formLoading}>
                    {formLoading ? 'SENDING...' : 'SEND INQUIRY →'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORY OVERLAY ── */}
      <div className={`cat-overlay${catOverlayOpen ? ' open' : ''}`}>
        <div className="cat-overlay-inner">
          <button className="cat-back-btn" onClick={() => setCatOverlayOpen(false)}>← BACK TO CATALOG</button>
          {activeCategory && (
            <>
              <div className="cat-hero">
                <div className="cat-icon-large">
                  {activeCategory.icon && <img src={activeCategory.icon.startsWith('/') || activeCategory.icon.startsWith('data:') || activeCategory.icon.startsWith('http') ? activeCategory.icon : `/${activeCategory.icon}`} alt="" onError={e => { e.target.style.display = 'none'; }} />}
                </div>
                <div className="cat-title-group">
                  <div className="cat-tag-label">{activeCategory.count} MODELS</div>
                  <h2 className="cat-title">{activeCategory.name}</h2>
                </div>
              </div>
              <p className="cat-desc">Explore our premium selection of {activeCategory.name} models, designed for durability, player engagement, and high ROI.</p>
              <div className="cat-divider" />
              <div className="cat-products-label">AVAILABLE MODELS</div>
              <div className="cat-products-grid">
                {overlayProducts.map(prod => (
                  <div key={prod.id || prod._id} className="cat-prod-card" onClick={() => navigate(`/products/${prod.id || prod._id}`)}>
                    <img
                      src={prod.image?.startsWith('http') || prod.image?.startsWith('data:') || prod.image?.startsWith('/') ? prod.image : `/${prod.image}`}
                      alt={prod.name} className="cat-prod-img"
                      onError={e => { e.target.src = '/assets/logo2-scaled.png'; }}
                    />
                    <div className="cat-prod-body">
                      <div className="cat-prod-name">{prod.name}</div>
                      <div className="cat-prod-tag">{activeCategory.name}</div>
                    </div>
                  </div>
                ))}
                {overlayProducts.length === 0 && (
                  <div style={{ color: 'rgba(255,240,234,0.35)', padding: '20px 0', fontFamily: 'DM Sans, sans-serif' }}>No products found in this category.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
