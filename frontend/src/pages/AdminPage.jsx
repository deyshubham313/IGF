import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import {
  adminLogin, getOrders, getOrderStats, updateOrderStatus,
  getInquiries, updateInquiryStatus, deleteInquiry,
  getProducts, getCategories, createProduct, updateProduct, deleteProduct,
  uploadProductImage, uploadProductImages,
  updateSettings, getSettings,
  getRazorpayStatus, getRazorpayKeysRaw, saveRazorpayKeys,
  validateCoupon, createRazorpayOrder,
} from '../services/api';
import { useSite } from '../context/SiteContext';
import './AdminPage.css';

/* ════════════════════════════════════════════════════════════════
   SHARED HELPERS
════════════════════════════════════════════════════════════════ */
const IMG = (src) => {
  if (!src) return '/assets/logo2-scaled.png';
  if (src.startsWith('data:') || src.startsWith('http') || src.startsWith('/')) return src;
  return `/${src}`;
};

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 99999,
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 22px',
      background: 'rgba(14,7,4,0.96)',
      border: `1px solid ${type === 'error' ? 'rgba(239,68,68,0.5)' : 'rgba(74,222,128,0.4)'}`,
      borderRadius: 10,
      fontFamily: 'Orbitron, sans-serif', fontSize: '0.62rem', letterSpacing: '0.08em',
      color: '#fff0ea',
      boxShadow: '0 12px 50px rgba(0,0,0,0.7)',
      animation: 'toastIn 0.3s ease',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: type === 'error' ? '#ef4444' : '#4ade80', boxShadow: `0 0 10px ${type === 'error' ? '#ef4444' : '#4ade80'}` }} />
      {msg.toUpperCase()}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = 'var(--igf-orange)' }) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.44rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ tag, title, accent, desc }) {
  return (
    <div className="panel-header">
      <div className="panel-tag">{tag}</div>
      <div className="panel-title">{title} <span className="accent">{accent}</span></div>
      {desc && <div className="panel-desc">{desc}</div>}
    </div>
  );
}

function GCard({ title, children, style = {} }) {
  return (
    <div className="g-card" style={style}>
      {title && <div className="card-title">{title}</div>}
      {children}
    </div>
  );
}

const INP = {
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,87,34,0.2)',
  borderRadius: 8,
  color: '#fff0ea',
  fontFamily: 'DM Sans,sans-serif',
  fontSize: '0.88rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

/* ════════════════════════════════════════════════════════════════
   LOGIN SCREEN
════════════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    const COUNT = 1400;
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const palette = [new THREE.Color('#ff5722'), new THREE.Color('#c0392b'), new THREE.Color('#ffab40'), new THREE.Color('#ff7043'), new THREE.Color('#e64a19')];
    for (let i = 0; i < COUNT; i++) {
      pos[i*3] = (Math.random()-0.5)*24; pos[i*3+1] = (Math.random()-0.5)*16; pos[i*3+2] = (Math.random()-0.5)*14;
      const c = palette[Math.floor(Math.random()*palette.length)];
      col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color', new THREE.BufferAttribute(col,3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size:0.055, vertexColors:true, transparent:true, opacity:0.8 }));
    scene.add(pts);
    const rings = [[3.5,0.008,80,'#ff5722',0.18,Math.PI/4,0],[2.8,0.006,60,'#c0392b',0.12,-Math.PI/3,Math.PI/5],[4.2,0.004,100,'#ffab40',0.09,Math.PI/6,Math.PI/4]].map(([r,t,s,c,o,rx,ry])=>{
      const m = new THREE.Mesh(new THREE.TorusGeometry(r,t,8,s), new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o}));
      m.rotation.x=rx; m.rotation.y=ry; scene.add(m); return m;
    });
    let tick=0, animId;
    const anim=()=>{ animId=requestAnimationFrame(anim); tick+=0.004; pts.rotation.y=tick*0.09; pts.rotation.x=Math.sin(tick*0.05)*0.12; rings[0].rotation.z+=0.003; rings[1].rotation.z-=0.002; rings[1].rotation.y+=0.001; rings[2].rotation.z+=0.0015; rings[2].rotation.x+=0.0008; renderer.render(scene,camera); };
    anim();
    const onR=()=>{ renderer.setSize(window.innerWidth,window.innerHeight); camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); };
    window.addEventListener('resize',onR);
    return ()=>{ cancelAnimationFrame(animId); window.removeEventListener('resize',onR); renderer.dispose(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await adminLogin(form);
      localStorage.setItem('igf_token', res.data.token);
      onLogin(res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'ACCESS DENIED — INVALID CREDENTIALS');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display:'flex', position:'fixed', inset:0, zIndex:9999, alignItems:'center', justifyContent:'center', background:'#0a0604' }}>
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, zIndex:0 }} />
      <div style={{ position:'relative', zIndex:1 }}>
        <div className="login-card">
          <div className="scan-line" />
          <div className="corner tl"/><div className="corner tr"/>
          <div className="corner bl"/><div className="corner br"/>
          <div className="login-logo">
            <svg width="48" height="58" viewBox="0 0 100 120" fill="none">
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
            <div className="login-logo-text">
              <span className="l1">INDIAN GAME FACTORY</span>
              <span className="l2">ADMIN CONTROL SYSTEM v2</span>
            </div>
          </div>
          <div className="login-divider" />
          <div className="login-system-tag">🔐 Secure Authentication Portal</div>
          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label>Admin ID</label>
              <div className="login-input-wrap">
                <span className="login-field-icon">◈</span>
                <input type="text" placeholder="Enter admin identifier" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required autoComplete="off"/>
              </div>
            </div>
            <div className="login-field">
              <label>Password</label>
              <div className="login-input-wrap">
                <span className="login-field-icon">⬡</span>
                <input type="password" placeholder="Enter secure password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
              </div>
            </div>
            {error && <div className="login-error show">{error}</div>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? '⟳ INITIALIZING ACCESS...' : 'INITIALIZE ACCESS →'}
            </button>
          </form>
          <div className="login-hint"><span className="blink">■</span> AUTHORIZED PERSONNEL ONLY <span className="blink">■</span></div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   IMAGE UPLOAD ZONE
════════════════════════════════════════════════════════════════ */
function ImageUploadZone({ value, onChange, label = 'Product Image', multiple = false, existingImages = [], onAddImages }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      if (multiple && onAddImages) {
        const res = await uploadProductImages(files);
        onAddImages(res.data.urls || []);
      } else {
        const res = await uploadProductImage(files[0]);
        onChange(res.data.url);
      }
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally { setUploading(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      {label && <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', letterSpacing:'0.12em', color:'rgba(255,240,234,0.45)', display:'block', marginBottom:8 }}>{label}</label>}

      {/* Current image preview */}
      {value && !multiple && (
        <div style={{ position:'relative', marginBottom:10, borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,87,34,0.2)' }}>
          <img src={value} alt="preview" style={{ width:'100%', height:160, objectFit:'cover', display:'block' }} onError={e=>{e.target.src='/assets/logo2-scaled.png';}}/>
          <button onClick={()=>onChange('')} style={{ position:'absolute', top:8, right:8, background:'rgba(239,68,68,0.85)', border:'none', color:'#fff', borderRadius:'50%', width:26, height:26, cursor:'pointer', fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>
      )}

      {/* Gallery preview */}
      {multiple && existingImages.length > 0 && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
          {existingImages.map((img,i) => (
            <div key={i} style={{ position:'relative', width:80, height:80, borderRadius:6, overflow:'hidden', border:'1px solid rgba(255,87,34,0.2)', flexShrink:0 }}>
              <img src={IMG(img)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.src='/assets/logo2-scaled.png';}}/>
              <button onClick={()=>onAddImages(existingImages.filter((_,j)=>j!==i))} style={{ position:'absolute', top:2, right:2, background:'rgba(239,68,68,0.9)', border:'none', color:'#fff', borderRadius:'50%', width:18, height:18, cursor:'pointer', fontSize:'0.65rem', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e=>{e.preventDefault();setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={handleDrop}
        onClick={()=>!uploading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--igf-orange)' : 'rgba(255,87,34,0.25)'}`,
          borderRadius: 10,
          padding: '20px 16px',
          textAlign: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          background: dragOver ? 'rgba(255,87,34,0.06)' : 'rgba(255,87,34,0.02)',
          transition: 'all 0.2s',
          userSelect: 'none',
        }}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple={multiple} style={{ display:'none' }} onChange={e=>handleFiles(e.target.files)}/>
        {uploading ? (
          <div>
            <div style={{ fontSize:'1.4rem', marginBottom:6 }}>⟳</div>
            <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.52rem', color:'var(--igf-orange)', letterSpacing:'0.1em' }}>UPLOADING TO MONGODB...</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:'1.6rem', marginBottom:6 }}>📁</div>
            <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.52rem', color:'var(--igf-orange)', letterSpacing:'0.1em', marginBottom:4 }}>
              {multiple ? 'DROP IMAGES OR CLICK TO BROWSE' : 'DROP IMAGE OR CLICK TO BROWSE'}
            </div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>
              {multiple ? 'Multiple images supported • 8MB max each' : 'JPG, PNG, WEBP • 8MB max'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ORDERS TAB
════════════════════════════════════════════════════════════════ */
function OrdersTab({ orders, setOrders, loading, load }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const STATUS_OPTIONS = ['confirmed','processing','dispatched','in-transit','delivered','cancelled'];
  const STATUS_COLORS = { confirmed:'#60a5fa', processing:'#a78bfa', dispatched:'#fbbf24', 'in-transit':'#fb923c', delivered:'#4ade80', cancelled:'#ef4444' };

  const handleStatus = async (id, status) => {
    setUpdating(id);
    try { await updateOrderStatus(id, status); setOrders(prev=>prev.map(o=>o._id===id?{...o,status}:o)); }
    catch(err){ alert('Failed: ' + err.message); }
    finally { setUpdating(null); }
  };

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search) { const s=search.toLowerCase(); return o.orderId?.toLowerCase().includes(s)||o.customer?.name?.toLowerCase().includes(s)||o.customer?.phone?.includes(s); }
    return true;
  });

  return (
    <div>
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <input type="text" placeholder="Search order ID, name, phone..." value={search} onChange={e=>setSearch(e.target.value)} style={{ ...INP, flex:1, minWidth:200 }}/>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ ...INP, width:'auto', fontFamily:'Orbitron,sans-serif', fontSize:'0.52rem', letterSpacing:'0.08em' }}>
          <option value="all">ALL STATUS</option>
          {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>
        <button onClick={load} className="btn btn-secondary" style={{ padding:'10px 18px', fontSize:'0.52rem', fontFamily:'Orbitron,sans-serif' }}>↺ REFRESH</button>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)', fontFamily:'Orbitron,sans-serif', fontSize:'0.6rem' }}>LOADING ORDERS...</div>
      : filtered.length === 0 ? <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)', fontFamily:'Orbitron,sans-serif', fontSize:'0.6rem', letterSpacing:'0.15em' }}>NO ORDERS FOUND</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(order=>(
            <div key={order._id} style={{ background:'rgba(255,87,34,0.03)', border:'1px solid rgba(255,87,34,0.12)', borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', cursor:'pointer' }} onClick={()=>setExpanded(expanded===order._id?null:order._id)}>
                <div style={{ flex:1, minWidth:120 }}>
                  <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.65rem', color:'var(--igf-orange)', marginBottom:2 }}>{order.orderId}</div>
                  <div style={{ fontSize:'0.9rem', fontWeight:600, color:'var(--text-primary)' }}>{order.customer?.name}</div>
                  <div style={{ fontSize:'0.76rem', color:'var(--text-muted)' }}>{order.customer?.phone}</div>
                </div>
                <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.82rem', fontWeight:700, color:'var(--igf-amber)' }}>₹{(order.amount||0).toLocaleString('en-IN')}</div>
                <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.48rem', letterSpacing:'0.1em', color:STATUS_COLORS[order.status]||'#9ca3af', background:`${STATUS_COLORS[order.status]||'#9ca3af'}18`, border:`1px solid ${STATUS_COLORS[order.status]||'#9ca3af'}44`, padding:'4px 12px', borderRadius:20 }}>{order.status?.toUpperCase()}</span>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
                <div style={{ fontSize:'0.6rem', color:'var(--text-dim)' }}>{expanded===order._id?'▲':'▼'}</div>
              </div>

              {expanded===order._id&&(
                <div style={{ padding:'0 20px 20px', borderTop:'1px solid rgba(255,87,34,0.08)' }}>
                  <div style={{ paddingTop:16, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:16 }}>
                    {[['Email',order.customer?.email],['City',order.customer?.city||'—'],['State',order.customer?.state||'—'],['Payment',order.paymentStatus?.toUpperCase()],['Tracking',order.trackingNumber||'—'],['Product',order.product?.name||'—']].map(([l,v])=>(
                      <div key={l}>
                        <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.42rem', letterSpacing:'0.1em', color:'rgba(255,240,234,0.3)', marginBottom:3 }}>{l.toUpperCase()}</div>
                        <div style={{ fontSize:'0.84rem', color:'var(--text-primary)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', color:'var(--text-muted)' }}>UPDATE STATUS:</span>
                    {STATUS_OPTIONS.filter(s=>s!=='cancelled').map(s=>(
                      <button key={s} onClick={()=>handleStatus(order._id,s)} disabled={updating===order._id||order.status===s} style={{ padding:'6px 14px', borderRadius:6, fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', border:order.status===s?`1px solid ${STATUS_COLORS[s]}`:'1px solid rgba(255,87,34,0.15)', background:order.status===s?`${STATUS_COLORS[s]}18`:'transparent', color:order.status===s?STATUS_COLORS[s]:'var(--text-muted)', cursor:updating===order._id||order.status===s?'not-allowed':'pointer', transition:'all 0.2s' }}>
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PRODUCT MANAGEMENT TAB — nested view (Categories -> Products)
════════════════════════════════════════════════════════════════ */
function ProductsTab({ products, setProducts, categories, loading, load, toast, formData, saveAllSettings }) {
  const [showModal, setShowModal] = useState(false);
  const [isCategoryModal, setIsCategoryModal] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  
  // Nested View State
  const [selectedCategory, setSelectedCategory] = useState(null);

  const EMPTY = { id:'', name:'', category:'', categoryName:'', categoryIcon:'', image:'', images:[], shortDesc:'', fullDesc:'', tag:'', price:0, discountPct:0, stock:'in-stock', specs:[], features:[] };
  const [form, setForm] = useState(EMPTY);
  const [specInput, setSpecInput] = useState({ label:'', val:'' });
  const [featInput, setFeatInput] = useState('');

  const openCreateCat = () => {
    setIsCategoryModal(true);
    setEditProd(null);
    setForm(EMPTY);
    setShowModal(true);
  };

  const openCreate = (prefillCat = null) => { 
    setIsCategoryModal(false);
    setEditProd(null); 
    if (prefillCat) {
      setForm({ ...EMPTY, category: prefillCat._id, categoryName: prefillCat.name, categoryIcon: prefillCat.icon || '' });
    } else {
      setForm(EMPTY); 
    }
    setShowModal(true); 
  };

  const openEdit = (p) => {
    setIsCategoryModal(false);
    setEditProd(p);
    setForm({ id:p.id||'', name:p.name||'', category:p.category||'', categoryName:p.categoryName||'', categoryIcon:p.categoryIcon||'', image:p.image||'', images:p.images||[], shortDesc:p.shortDesc||'', fullDesc:p.fullDesc||'', tag:p.tag||'', price:p.price||0, discountPct:p.discountPct||0, stock:p.stock||'in-stock', specs:p.specs||[], features:p.features||[] });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (isCategoryModal) {
      if (!form.category || !form.categoryName) { alert('Category ID and Name are required'); return; }
      setSaving(true);
      try {
        const newCat = { id: form.category, name: form.categoryName, icon: form.categoryIcon };
        const next = { ...formData, customCategories: [...(formData?.customCategories||[]), newCat] };
        if (saveAllSettings) await saveAllSettings(next);
        toast('Category created!');
        
        // Auto-select the newly created category to view it right now
        setSelectedCategory({ _id: newCat.id, name: newCat.name, icon: newCat.icon, count: 0 });
        
        setShowModal(false);
      } catch(err) { toast('Save failed: '+err.message, 'error'); }
      finally { setSaving(false); }
      return;
    }

    if (!form.id || !form.name || !form.category) { alert('Product ID, Name and Category are required'); return; }
    setSaving(true);
    try {
      if (editProd) { await updateProduct(form.id, form); toast('Product updated!'); }
      else { await createProduct(form); toast('Product created!'); }
      setShowModal(false); await load();
    } catch(err) { toast('Save failed: '+(err.response?.data?.message||err.message), 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? (soft delete — can be restored)')) return;
    try { await deleteProduct(id); setProducts(prev=>prev.filter(p=>p.id!==id)); toast('Product deleted'); }
    catch(err) { toast('Delete failed: '+err.message, 'error'); }
  };

  const filteredProducts = products.filter(p => {
    if (selectedCategory && p.category !== selectedCategory._id) return false;
    if (search) return p.name?.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const mergedCategories = [...categories];
  (formData?.customCategories || []).forEach(cc => {
    if (!mergedCategories.find(c => c._id === cc.id)) {
      mergedCategories.push({ _id: cc.id, name: cc.name, icon: cc.icon, count: 0 });
    }
  });

  const STOCK_COLORS = { 'in-stock':'#4ade80', 'low-stock':'#fbbf24', 'out-of-stock':'#ef4444', 'pre-order':'#60a5fa' };

  // View: Categories (Level 1)
  if (!selectedCategory) {
    return (
      <div>
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.8rem', color:'var(--text-primary)', letterSpacing:'0.1em' }}>
            PRODUCT CATEGORIES
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button onClick={()=>openCreateCat()} className="btn btn-primary" style={{ padding:'10px 20px', fontSize:'0.55rem', fontFamily:'Orbitron,sans-serif', fontWeight:700, whiteSpace:'nowrap' }}>+ NEW CATEGORY</button>
            <button onClick={load} className="btn btn-secondary" style={{ padding:'10px 16px', fontSize:'0.55rem', fontFamily:'Orbitron,sans-serif' }}>↺</button>
          </div>
        </div>
        
        {loading ? <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)', fontFamily:'Orbitron,sans-serif', fontSize:'0.6rem' }}>LOADING CATEGORIES...</div>
        : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16 }}>
            {mergedCategories.map(cat => (
              <div 
                key={cat._id} 
                onClick={() => setSelectedCategory(cat)}
                style={{ background:'rgba(255,87,34,0.05)', border:'1px solid rgba(255,87,34,0.15)', borderRadius:14, padding:20, cursor:'pointer', transition:'all 0.2s', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:12 }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(255,87,34,0.4)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,87,34,0.15)'; e.currentTarget.style.transform='translateY(0)'; }}
              >
                <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(255,87,34,0.1)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                  {cat.icon ? <img src={cat.icon} alt={cat.name} style={{ width:32, height:32, objectFit:'contain' }} onError={e=>{e.target.style.display='none'}} /> : <span style={{ fontSize:'1.5rem' }}>📁</span>}
                </div>
                <div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:'1.1rem', fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{cat.name || cat._id}</div>
                  <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.55rem', color:'var(--text-muted)', letterSpacing:'0.1em' }}>{cat.count} PRODUCTS</div>
                </div>
              </div>
            ))}
            {mergedCategories.length === 0 && <div style={{ gridColumn:'1/-1', textAlign:'center', padding:40, color:'var(--text-muted)', fontFamily:'Orbitron,sans-serif', fontSize:'0.6rem' }}>NO CATEGORIES YET</div>}
          </div>
        )}

        {/* Modal for creating a brand new category (and its first product) */}
        {showModal && renderProductModal()}
      </div>
    );
  }

  // View: Products within a Category (Level 2)
  function renderProductModal() {
    return (
      <div style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'20px', overflowY:'auto' }} onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
        <div style={{ background:'#100806', border:'1px solid rgba(255,87,34,0.28)', borderRadius:18, padding:'36px', width:'100%', maxWidth:760, margin:'auto', boxShadow:'0 40px 100px rgba(0,0,0,0.8)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30 }}>
            <h2 style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.85rem', letterSpacing:'0.15em', color:'var(--igf-orange)', margin:0 }}>
              {isCategoryModal ? '+ CREATE CATEGORY' : (editProd?'✏ EDIT PRODUCT':'+ CREATE PRODUCT')}
            </h2>
            <button onClick={()=>setShowModal(false)} style={{ background:'transparent', border:'none', color:'var(--text-muted)', fontSize:'1.5rem', cursor:'pointer', lineHeight:1 }}>×</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            {!isCategoryModal && (
              <>
                {/* Main image upload */}
                <div style={{ gridColumn:'1/-1' }}>
                  <ImageUploadZone value={form.image} onChange={v=>setForm({...form,image:v})} label="PRIMARY PRODUCT IMAGE (from disk → MongoDB)"/>
                </div>

                {/* Gallery images */}
                <div style={{ gridColumn:'1/-1' }}>
                  <ImageUploadZone multiple existingImages={form.images} onAddImages={urls=>{
                    if (Array.isArray(urls[0])) { setForm(f=>({...f,images:urls})); }
                    else { setForm(f=>({...f,images:[...f.images,...urls]})); }
                  }} label="GALLERY IMAGES (multiple — drag & drop or browse)"/>
                </div>
              </>
            )}

            {/* Text fields */}
            {[
              ...(!isCategoryModal ? [
                {label:'Product ID *',key:'id',type:'text',placeholder:'e.g. air-hockey-premium',half:true},
                {label:'Product Name *',key:'name',type:'text',placeholder:'e.g. Air Hockey Premium Table',half:true}
              ] : []),
              
              // Only show Category fields if we are NOT pre-filled from a selected category view
              ...((isCategoryModal || !selectedCategory || (!form.category && !editProd)) ? [
                {label:'Category ID *',key:'category',type:'text',placeholder:'e.g. air-hockey',half:true},
                {label:'Category Name *',key:'categoryName',type:'text',placeholder:'e.g. Air Hockey',half:true},
                {label:'Category Icon URL',key:'categoryIcon',type:'text',placeholder:'/assets/icon.svg',half:true}
              ] : []),
              
              ...(!isCategoryModal ? [
                {label:'Tag',key:'tag',type:'text',placeholder:'NEW, BESTSELLER, HOT',half:true},
                {label:'Price (₹)',key:'price',type:'number',placeholder:'0',half:true},
                {label:'Discount %',key:'discountPct',type:'number',placeholder:'0',half:true}
              ] : []),
            ].map(({label,key,type,placeholder,half})=>(
              <div key={key} style={{ gridColumn:half?'auto':'1/-1', display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', letterSpacing:'0.12em', color:'rgba(255,240,234,0.4)' }}>{label}</label>
                <input type={type} placeholder={placeholder} value={form[key]} onChange={e=>setForm({...form,[key]:type==='number'?Number(e.target.value):e.target.value})} disabled={editProd&&key==='id'} style={{ ...INP, opacity:editProd&&key==='id'?0.5:1 }}/>
              </div>
            ))}

            {!isCategoryModal && (
              <>
                {/* Stock */}
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', letterSpacing:'0.12em', color:'rgba(255,240,234,0.4)' }}>STOCK STATUS</label>
                  <select value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} style={INP}>
                    <option value="in-stock">✅ In Stock</option>
                    <option value="low-stock">⚠️ Low Stock</option>
                    <option value="out-of-stock">❌ Out of Stock</option>
                    <option value="pre-order">📦 Pre-Order</option>
                  </select>
                </div>

                {/* Descriptions */}
                <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:6 }}>
                  <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', letterSpacing:'0.12em', color:'rgba(255,240,234,0.4)' }}>SHORT DESCRIPTION</label>
                  <textarea placeholder="Brief product description (shown on cards)..." value={form.shortDesc} onChange={e=>setForm({...form,shortDesc:e.target.value})} style={{ ...INP, minHeight:70, resize:'vertical' }}/>
                </div>
                <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:6 }}>
                  <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', letterSpacing:'0.12em', color:'rgba(255,240,234,0.4)' }}>FULL DESCRIPTION</label>
                  <textarea placeholder="Full product description..." value={form.fullDesc} onChange={e=>setForm({...form,fullDesc:e.target.value})} style={{ ...INP, minHeight:100, resize:'vertical' }}/>
                </div>

                {/* Specs */}
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', letterSpacing:'0.12em', color:'rgba(255,240,234,0.4)', display:'block', marginBottom:10 }}>TECHNICAL SPECIFICATIONS</label>
                  <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                    <input type="text" placeholder="Label (e.g. Power)" value={specInput.label} onChange={e=>setSpecInput({...specInput,label:e.target.value})} style={{ ...INP, flex:1, minWidth:120 }}/>
                    <input type="text" placeholder="Value (e.g. 220V AC)" value={specInput.val} onChange={e=>setSpecInput({...specInput,val:e.target.value})} style={{ ...INP, flex:1, minWidth:120 }}/>
                    <button onClick={()=>{ if(!specInput.label||!specInput.val)return; setForm(f=>({...f,specs:[...f.specs,{...specInput}]})); setSpecInput({label:'',val:''}); }} className="btn btn-secondary" style={{ padding:'10px 16px', fontSize:'0.5rem', fontFamily:'Orbitron,sans-serif', whiteSpace:'nowrap' }}>+ ADD</button>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {form.specs.map((spec,i)=>(
                      <div key={i} style={{ display:'flex', gap:8, alignItems:'center', padding:'8px 12px', background:'rgba(255,87,34,0.05)', borderRadius:7 }}>
                        <span style={{ fontFamily:'Syne,sans-serif', fontSize:'0.82rem', color:'var(--igf-orange)', minWidth:100 }}>{spec.label}:</span>
                        <span style={{ fontSize:'0.84rem', color:'var(--text-primary)', flex:1 }}>{spec.val}</span>
                        <button onClick={()=>setForm(f=>({...f,specs:f.specs.filter((_,j)=>j!==i)}))} style={{ background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'1rem' }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', letterSpacing:'0.12em', color:'rgba(255,240,234,0.4)', display:'block', marginBottom:10 }}>KEY FEATURES</label>
                  <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                    <input type="text" placeholder="Add a key feature..." value={featInput} onChange={e=>setFeatInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&featInput.trim()){ setForm(f=>({...f,features:[...f.features,featInput.trim()]})); setFeatInput(''); }}} style={{ ...INP, flex:1 }}/>
                    <button onClick={()=>{ if(!featInput.trim())return; setForm(f=>({...f,features:[...f.features,featInput.trim()]})); setFeatInput(''); }} className="btn btn-secondary" style={{ padding:'10px 16px', fontSize:'0.5rem', fontFamily:'Orbitron,sans-serif' }}>+ ADD</button>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {form.features.map((feat,i)=>(
                      <div key={i} style={{ display:'flex', gap:8, alignItems:'center', padding:'8px 12px', background:'rgba(255,87,34,0.05)', borderRadius:7 }}>
                        <span style={{ color:'var(--igf-orange)', fontWeight:'bold' }}>▸</span>
                        <span style={{ fontSize:'0.85rem', color:'var(--text-primary)', flex:1 }}>{feat}</span>
                        <button onClick={()=>setForm(f=>({...f,features:f.features.filter((_,j)=>j!==i)}))} style={{ background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'1rem' }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ display:'flex', gap:12, marginTop:30, justifyContent:'flex-end' }}>
            <button onClick={()=>setShowModal(false)} className="btn btn-secondary" style={{ padding:'12px 24px', fontSize:'0.58rem', fontFamily:'Orbitron,sans-serif' }}>CANCEL</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ padding:'12px 32px', fontSize:'0.62rem', fontFamily:'Orbitron,sans-serif', fontWeight:700, opacity:saving?0.6:1 }}>
              {saving?'💾 SAVING...' : editProd?'💾 UPDATE PRODUCT':'💾 CREATE PRODUCT'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar for Level 2 */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <button onClick={()=>setSelectedCategory(null)} className="btn btn-secondary" style={{ padding:'10px 16px', fontSize:'0.55rem', fontFamily:'Orbitron,sans-serif', background:'rgba(255,255,255,0.05)', color:'var(--text-primary)' }}>
          ← BACK TO CATEGORIES
        </button>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:12, minWidth:200 }}>
          <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.7rem', color:'var(--igf-orange)', fontWeight:700, whiteSpace:'nowrap' }}>
            {(selectedCategory.name || selectedCategory._id).toUpperCase()} PRODUCTS
          </span>
          <div style={{ width:1, height:20, background:'rgba(255,255,255,0.1)' }} />
          <input type="text" placeholder={`Search in ${selectedCategory.name || selectedCategory._id}...`} value={search} onChange={e=>setSearch(e.target.value)} style={{ ...INP, flex:1 }}/>
        </div>
        <button onClick={()=>openCreate(selectedCategory)} className="btn btn-primary" style={{ padding:'10px 20px', fontSize:'0.55rem', fontFamily:'Orbitron,sans-serif', fontWeight:700, whiteSpace:'nowrap' }}>+ ADD PRODUCT</button>
        <button onClick={load} className="btn btn-secondary" style={{ padding:'10px 16px', fontSize:'0.55rem', fontFamily:'Orbitron,sans-serif' }}>↺</button>
      </div>

      {/* Product grid for Level 2 */}
      {loading ? <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)', fontFamily:'Orbitron,sans-serif', fontSize:'0.6rem' }}>LOADING PRODUCTS...</div>
      : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
          {filteredProducts.map(prod=>(
            <div key={prod.id||prod._id} style={{ background:'rgba(255,87,34,0.03)', border:'1px solid rgba(255,87,34,0.12)', borderRadius:14, overflow:'hidden', transition:'border-color 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,87,34,0.3)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,87,34,0.12)'}
            >
              <div style={{ position:'relative', height:170, background:'rgba(255,87,34,0.05)' }}>
                <img src={IMG(prod.image)} alt={prod.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.src='/assets/logo2-scaled.png';}}/>
                {prod.images?.length > 0 && (
                  <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.7)', padding:'3px 8px', borderRadius:10, fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'#fff' }}>
                    +{prod.images.length} IMGS
                  </div>
                )}
                <div style={{ position:'absolute', top:8, left:8, background:`${STOCK_COLORS[prod.stock]||'#9ca3af'}22`, border:`1px solid ${STOCK_COLORS[prod.stock]||'#9ca3af'}55`, padding:'3px 8px', borderRadius:10, fontFamily:'Orbitron,sans-serif', fontSize:'0.42rem', color:STOCK_COLORS[prod.stock]||'#9ca3af' }}>
                  {prod.stock?.toUpperCase()}
                </div>
              </div>
              <div style={{ padding:'14px 16px' }}>
                <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', letterSpacing:'0.1em', color:'var(--igf-orange)', marginBottom:4 }}>{prod.categoryName||prod.category}</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:'0.92rem', fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>{prod.name}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:10, lineHeight:1.5 }}>{prod.shortDesc?.slice(0,70)}{prod.shortDesc?.length>70?'...':''}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.8rem', fontWeight:700, color:'var(--igf-amber)' }}>₹{(prod.price||0).toLocaleString('en-IN')}</span>
                  {prod.discountPct>0 && <span style={{ background:'rgba(255,87,34,0.15)', border:'1px solid rgba(255,87,34,0.3)', padding:'2px 8px', borderRadius:4, fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'var(--igf-orange)' }}>{prod.discountPct}% OFF</span>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>openEdit(prod)} style={{ flex:1, padding:'8px', background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.25)', color:'#60a5fa', borderRadius:7, cursor:'pointer', fontFamily:'Orbitron,sans-serif', fontSize:'0.48rem', letterSpacing:'0.08em', transition:'all 0.2s' }}>✏ EDIT</button>
                  <button onClick={()=>handleDelete(prod.id)} style={{ flex:1, padding:'8px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', borderRadius:7, cursor:'pointer', fontFamily:'Orbitron,sans-serif', fontSize:'0.48rem', letterSpacing:'0.08em', transition:'all 0.2s' }}>🗑 DELETE</button>
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && <div style={{ gridColumn:'1/-1', textAlign:'center', padding:40, color:'var(--text-muted)', fontFamily:'Orbitron,sans-serif', fontSize:'0.6rem' }}>NO PRODUCTS IN THIS CATEGORY</div>}
        </div>
      )}

      {showModal && renderProductModal()}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   RAZORPAY PANEL
════════════════════════════════════════════════════════════════ */
function RazorpayPanel({ orders, toast }) {
  const [status, setStatus] = useState(null);
  const [rawKeys, setRawKeys] = useState({ keyId:'', keySecret:'', testKeyId:'', testKeySecret:'', mode:'test' });
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testAmount, setTestAmount] = useState(100);
  const [testResult, setTestResult] = useState(null);

  useEffect(()=>{ loadStatus(); }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([ getRazorpayStatus(), getRazorpayKeysRaw() ]);
      setStatus(sRes.data);
      setRawKeys({ keyId:rRes.data.keyId||'', keySecret:rRes.data.keySecret||'', testKeyId:rRes.data.testKeyId||'', testKeySecret:rRes.data.testKeySecret||'', mode:rRes.data.mode||'test' });
    } catch(err){ console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (rawKeys.mode === 'test' && (!rawKeys.testKeyId || !rawKeys.testKeySecret)) {
      toast('Both Test Key ID and Test Key Secret are required for Test Mode', 'error'); return;
    }
    if (rawKeys.mode === 'live' && (!rawKeys.keyId || !rawKeys.keySecret)) {
      toast('Both Live Key ID and Live Key Secret are required for Live Mode', 'error'); return;
    }
    setSaving(true);
    try {
      await saveRazorpayKeys(rawKeys);
      toast('Razorpay keys saved!');
      await loadStatus();
    } catch(err){ toast('Save failed: '+err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleTestPayment = async () => {
    setTestResult(null);
    try {
      const res = await createRazorpayOrder(testAmount);
      setTestResult({ success:true, data:res.data });
    } catch(err){
      setTestResult({ success:false, error:err.response?.data?.message||err.message });
    }
  };

  // Payment analytics from orders
  const paymentStats = (() => {
    const paid = orders.filter(o=>o.paymentStatus==='paid');
    const pending = orders.filter(o=>o.paymentStatus==='pending');
    const razorpayPaid = orders.filter(o=>o.paymentMethod==='razorpay'&&o.paymentStatus==='paid');
    const upiPaid = orders.filter(o=>o.paymentMethod==='upi'&&o.paymentStatus==='paid');
    const totalRevenue = paid.reduce((s,o)=>s+(o.amount||0),0);
    const rzRevenue = razorpayPaid.reduce((s,o)=>s+(o.amount||0),0);
    return { paid:paid.length, pending:pending.length, razorpayPaid:razorpayPaid.length, upiPaid:upiPaid.length, totalRevenue, rzRevenue };
  })();

  const recentPayments = orders
    .filter(o=>o.paymentStatus==='paid')
    .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
    .slice(0,10);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Payment Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14 }}>
        <StatCard icon="💳" label="Paid Orders" value={paymentStats.paid} sub="VERIFIED" color="#4ade80"/>
        <StatCard icon="⏳" label="Pending Payments" value={paymentStats.pending} sub="AWAITING" color="#fbbf24"/>
        <StatCard icon="⚡" label="Razorpay Payments" value={paymentStats.razorpayPaid} sub="GATEWAY" color="var(--igf-orange)"/>
        <StatCard icon="📱" label="UPI Payments" value={paymentStats.upiPaid} sub="MANUAL" color="#a78bfa"/>
        <StatCard icon="₹" label="Total Revenue" value={`₹${(paymentStats.totalRevenue/1000).toFixed(0)}K`} sub="FROM PAID ORDERS" color="var(--igf-amber)"/>
        <StatCard icon="🔌" label="Razorpay Revenue" value={`₹${(paymentStats.rzRevenue/1000).toFixed(0)}K`} sub="GATEWAY ONLY" color="var(--igf-orange)"/>
      </div>

      {/* Key Configuration */}
      <GCard title="🔑 Razorpay Key Configuration">
        {loading ? (
          <div style={{ textAlign:'center', padding:30, color:'var(--text-muted)', fontFamily:'Orbitron,sans-serif', fontSize:'0.6rem' }}>LOADING...</div>
        ) : (
          <div>
            {/* Status badge */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, padding:'12px 16px', background:`${status?.isConfigured?'rgba(74,222,128,0.06)':'rgba(239,68,68,0.06)'}`, border:`1px solid ${status?.isConfigured?'rgba(74,222,128,0.2)':'rgba(239,68,68,0.2)'}`, borderRadius:8 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:status?.isConfigured?'#4ade80':'#ef4444', boxShadow:`0 0 12px ${status?.isConfigured?'#4ade80':'#ef4444'}` }}/>
              <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.55rem', letterSpacing:'0.1em', color:'var(--text-primary)' }}>
                {status?.isConfigured ? 'RAZORPAY CONFIGURED' : 'RAZORPAY NOT CONFIGURED'} — {status?.mode?.toUpperCase()||'TEST'} MODE
              </span>
              {status?.keyId && <span style={{ fontFamily:'monospace', fontSize:'0.75rem', color:'var(--text-muted)', marginLeft:'auto' }}>{status.keyId}</span>}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', letterSpacing:'0.12em', color:'rgba(255,240,234,0.4)' }}>PAYMENT MODE</label>
                <select value={rawKeys.mode} onChange={e=>setRawKeys({...rawKeys,mode:e.target.value})} style={{ ...INP, width:'auto', background:'rgba(255,255,255,0.05)' }}>
                  <option value="test">🧪 TEST MODE (Fake Transactions)</option>
                  <option value="live">🚀 LIVE MODE (Real Money)</option>
                </select>
              </div>

              {rawKeys.mode === 'test' ? (
                <>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', letterSpacing:'0.12em', color:'rgba(255,240,234,0.4)' }}>TEST KEY ID</label>
                    <input style={INP} placeholder="rzp_test_xxxxxxxxxxxxxx" value={rawKeys.testKeyId} onChange={e=>setRawKeys({...rawKeys,testKeyId:e.target.value.trim()})}/>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', letterSpacing:'0.12em', color:'rgba(255,240,234,0.4)' }}>TEST KEY SECRET</label>
                    <div style={{ position:'relative' }}>
                      <input type={showSecret?'text':'password'} style={{ ...INP, paddingRight:48 }} placeholder="••••••••••••••••" value={rawKeys.testKeySecret} onChange={e=>setRawKeys({...rawKeys,testKeySecret:e.target.value.trim()})}/>
                      <button onClick={()=>setShowSecret(!showSecret)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.85rem' }}>
                        {showSecret?'🙈':'👁'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', letterSpacing:'0.12em', color:'rgba(255,240,234,0.4)' }}>LIVE KEY ID</label>
                    <input style={INP} placeholder="rzp_live_xxxxxxxxxxxxxx" value={rawKeys.keyId} onChange={e=>setRawKeys({...rawKeys,keyId:e.target.value.trim()})}/>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', letterSpacing:'0.12em', color:'rgba(255,240,234,0.4)' }}>LIVE KEY SECRET</label>
                    <div style={{ position:'relative' }}>
                      <input type={showSecret?'text':'password'} style={{ ...INP, paddingRight:48 }} placeholder="••••••••••••••••" value={rawKeys.keySecret} onChange={e=>setRawKeys({...rawKeys,keySecret:e.target.value.trim()})}/>
                      <button onClick={()=>setShowSecret(!showSecret)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.85rem' }}>
                        {showSecret?'🙈':'👁'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ display:'flex', gap:12, marginTop:18 }}>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ padding:'12px 28px', fontSize:'0.58rem', fontFamily:'Orbitron,sans-serif', fontWeight:700, opacity:saving?0.6:1 }}>
                {saving?'SAVING...':'💾 SAVE KEYS'}
              </button>
              <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:6, padding:'12px 20px', background:'rgba(255,87,34,0.08)', border:'1px solid rgba(255,87,34,0.2)', borderRadius:8, color:'var(--igf-orange)', fontFamily:'Orbitron,sans-serif', fontSize:'0.5rem', letterSpacing:'0.1em', textDecoration:'none' }}>
                ↗ RAZORPAY DASHBOARD
              </a>
            </div>
          </div>
        )}
      </GCard>

      {/* Test Payment */}
      <GCard title="🧪 Test Payment Gateway">
        <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap', marginTop:14 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1, minWidth:120 }}>
            <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', color:'rgba(255,240,234,0.4)' }}>TEST AMOUNT (₹)</label>
            <input type="number" value={testAmount} onChange={e=>setTestAmount(Number(e.target.value))} style={{ ...INP }}/>
          </div>
          <button onClick={handleTestPayment} className="btn btn-secondary" style={{ padding:'12px 24px', fontSize:'0.55rem', fontFamily:'Orbitron,sans-serif' }}>
            ⚡ TEST RAZORPAY ORDER
          </button>
        </div>
        {testResult && (
          <div style={{ marginTop:14, padding:'14px 16px', background:testResult.success?'rgba(74,222,128,0.06)':'rgba(239,68,68,0.06)', border:`1px solid ${testResult.success?'rgba(74,222,128,0.2)':'rgba(239,68,68,0.2)'}`, borderRadius:8 }}>
            {testResult.success ? (
              <div>
                <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.55rem', color:'#4ade80', marginBottom:8 }}>✅ ORDER CREATED {testResult.data?.mock?'(MOCK — no real key set)':''}</div>
                <pre style={{ fontSize:'0.75rem', color:'var(--text-muted)', overflowX:'auto' }}>{JSON.stringify(testResult.data?.order||{}, null, 2)}</pre>
              </div>
            ) : (
              <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.55rem', color:'#ef4444' }}>❌ {testResult.error}</div>
            )}
          </div>
        )}
      </GCard>

      {/* Recent Payments Log */}
      <GCard title="📋 Recent Payment Transactions">
        <div style={{ overflowX:'auto', marginTop:12 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,87,34,0.15)' }}>
                {['ORDER ID','CUSTOMER','AMOUNT','METHOD','STATUS','DATE'].map(h=>(
                  <th key={h} style={{ padding:'10px 12px', fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'var(--text-dim)', textAlign:'left', letterSpacing:'0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPayments.map(o=>(
                <tr key={o._id} style={{ borderBottom:'1px solid rgba(255,87,34,0.06)' }}>
                  <td style={{ padding:'12px', fontFamily:'Orbitron,sans-serif', fontSize:'0.62rem', color:'var(--igf-orange)' }}>{o.orderId}</td>
                  <td style={{ padding:'12px', fontSize:'0.84rem', color:'var(--text-primary)' }}>{o.customer?.name}</td>
                  <td style={{ padding:'12px', fontFamily:'Orbitron,sans-serif', fontSize:'0.72rem', color:'var(--igf-amber)', fontWeight:700 }}>₹{(o.amount||0).toLocaleString('en-IN')}</td>
                  <td style={{ padding:'12px', fontSize:'0.78rem', color:'var(--text-muted)', textTransform:'uppercase' }}>{o.paymentMethod||'—'}</td>
                  <td style={{ padding:'12px' }}>
                    <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'#4ade80', background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.25)', padding:'3px 10px', borderRadius:10 }}>PAID</span>
                  </td>
                  <td style={{ padding:'12px', fontSize:'0.75rem', color:'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {recentPayments.length===0&&(
                <tr><td colSpan={6} style={{ padding:'30px', textAlign:'center', color:'var(--text-muted)', fontFamily:'Orbitron,sans-serif', fontSize:'0.55rem' }}>NO PAYMENTS YET</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GCard>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   INQUIRIES TAB
════════════════════════════════════════════════════════════════ */
function InquiriesTab({ inquiries, setInquiries, loading, load }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const STATUS_COLORS = { new:'#60a5fa', contacted:'#fbbf24', closed:'#4ade80' };
  const filtered = statusFilter==='all'?inquiries:inquiries.filter(i=>i.status===statusFilter);

  const handleStatus = async (id,status) => {
    try { await updateInquiryStatus(id,status); setInquiries(prev=>prev.map(i=>i._id===id?{...i,status}:i)); }
    catch(err){ alert('Failed: '+err.message); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete inquiry?')) return;
    try { await deleteInquiry(id); setInquiries(prev=>prev.filter(i=>i._id!==id)); }
    catch(err){ alert('Failed: '+err.message); }
  };

  return (
    <div>
      <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'center', flexWrap:'wrap' }}>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ ...INP, width:'auto', fontFamily:'Orbitron,sans-serif', fontSize:'0.52rem' }}>
          <option value="all">ALL</option><option value="new">NEW</option><option value="contacted">CONTACTED</option><option value="closed">CLOSED</option>
        </select>
        <button onClick={load} className="btn btn-secondary" style={{ padding:'10px 18px', fontSize:'0.52rem', fontFamily:'Orbitron,sans-serif' }}>↺ REFRESH</button>
        <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.52rem', color:'var(--text-muted)' }}>{filtered.length} INQUIRIES</span>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)', fontFamily:'Orbitron,sans-serif', fontSize:'0.6rem' }}>LOADING...</div>
      : filtered.length===0 ? <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)', fontFamily:'Orbitron,sans-serif', fontSize:'0.6rem' }}>NO INQUIRIES FOUND</div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map(inq=>(
            <div key={inq._id} style={{ background:'rgba(255,87,34,0.03)', border:'1px solid rgba(255,87,34,0.12)', borderRadius:12, padding:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10, marginBottom:10 }}>
                <div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:'0.95rem', fontWeight:700, color:'var(--text-primary)', marginBottom:2 }}>{inq.name}</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{inq.email} | {inq.phone}</div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', color:STATUS_COLORS[inq.status]||'#9ca3af', background:`${STATUS_COLORS[inq.status]}18`, border:`1px solid ${STATUS_COLORS[inq.status]}44`, padding:'3px 10px', borderRadius:10 }}>{inq.status?.toUpperCase()}</span>
                  <span style={{ fontSize:'0.72rem', color:'var(--text-dim)' }}>{new Date(inq.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
              {inq.productInterest&&<div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.48rem', color:'var(--igf-amber)', marginBottom:8 }}>Interest: {inq.productInterest}</div>}
              {inq.message&&<div style={{ fontSize:'0.84rem', color:'var(--text-muted)', lineHeight:1.7, marginBottom:14 }}>{inq.message}</div>}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {['new','contacted','closed'].map(s=>(
                  <button key={s} onClick={()=>handleStatus(inq._id,s)} style={{ padding:'6px 14px', borderRadius:6, fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', border:inq.status===s?`1px solid ${STATUS_COLORS[s]}`:'1px solid rgba(255,87,34,0.15)', background:inq.status===s?`${STATUS_COLORS[s]}18`:'transparent', color:inq.status===s?STATUS_COLORS[s]:'var(--text-muted)', cursor:'pointer', transition:'all 0.2s' }}>{s.toUpperCase()}</button>
                ))}
                <button onClick={()=>handleDelete(inq._id)} style={{ padding:'6px 14px', borderRadius:6, fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.06)', color:'#ef4444', cursor:'pointer', marginLeft:'auto' }}>🗑 DELETE</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SVG BAR CHART
════════════════════════════════════════════════════════════════ */
function SVGBarChart({ data, labels, color = 'var(--igf-orange)' }) {
  const maxVal = Math.max(...data, 1);
  const W = 580, H = 180, PAD_L = 48, PAD_B = 24, INNER_H = H - PAD_B, INNER_W = W - PAD_L;
  const barW = Math.floor(INNER_W / data.length) - 6;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto' }}>
      {[0,0.25,0.5,0.75,1].map((p,i)=>{
        const y = p*(INNER_H-10)+5;
        return <g key={i}><line x1={PAD_L} y1={y} x2={W} y2={y} stroke="rgba(255,87,34,0.06)" strokeDasharray="4 3"/><text x={PAD_L-4} y={y+4} fill="#6a4030" fontSize="9" textAnchor="end" fontFamily="Orbitron,sans-serif">₹{((1-p)*maxVal).toFixed(0)}K</text></g>;
      })}
      {data.map((val,i)=>{
        const bH = ((val/maxVal)*(INNER_H-10));
        const x = PAD_L + i*(INNER_W/data.length) + (INNER_W/data.length - barW)/2;
        const y = INNER_H-bH-PAD_B+5;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bH} fill="rgba(255,87,34,0.18)" stroke={color} strokeWidth="1.5" rx="3"/>
            {val>0&&<text x={x+barW/2} y={y-5} fill="var(--igf-amber)" fontSize="8" textAnchor="middle" fontFamily="Orbitron,sans-serif">₹{val.toFixed(0)}K</text>}
            <text x={x+barW/2} y={H-4} fill="#6a4030" fontSize="8" textAnchor="middle" fontFamily="Orbitron,sans-serif">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN ADMIN PAGE
════════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const [token, setToken] = useState(()=>localStorage.getItem('igf_token'));
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [recentLogs, setRecentLogs] = useState([]);

  // Global data
  const { settings: siteSettings, refetchSettings } = useSite();
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);

  // DB records
  const [orders, setOrders] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [stats, setStats] = useState({ totalOrders:0, totalRevenue:0, pendingOrders:0, deliveredOrders:0 });

  // Content form states
  const [newGallery, setNewGallery] = useState({ title:'', sub:'', tags:'', url:'' });
  const [newTestimonial, setNewTestimonial] = useState({ name:'', role:'', quote:'', stars:'★★★★★', avatar:'' });
  const [newTickerItem, setNewTickerItem] = useState('');
  const [newCoupon, setNewCoupon] = useState({ code:'', pct:10, expiry:'', uses:0, maxUses:100 });
  const [newFeat, setNewFeat] = useState('');

  const toast = useCallback((msg, type='success') => {
    setToastMsg(msg); setToastType(type);
    setRecentLogs(prev=>[{ msg, type, time:new Date().toLocaleTimeString() }, ...prev.slice(0,9)]);
    setTimeout(()=>setToastMsg(''), 3400);
  }, []);

  const loadDB = useCallback(async () => {
    setDbLoading(true);
    try {
      const [oRes, iRes, pRes, cRes] = await Promise.all([
        getOrders({ limit:200 }), getInquiries({ limit:100 }),
        getProducts({ limit:200 }), getCategories(),
      ]);
      setOrders(oRes.data.orders||[]);
      setInquiries(iRes.data.inquiries||[]);
      setProducts(pRes.data.products||[]);
      setCategories(cRes.data.categories||[]);
    } catch(err){ console.error('DB load failed', err); }
    finally { setDbLoading(false); }
  }, []);

  const loadStats = useCallback(async () => {
    try { const res = await getOrderStats(); setStats(res.data.stats||{}); } catch{}
  }, []);

  useEffect(()=>{ if(siteSettings) setFormData(JSON.parse(JSON.stringify(siteSettings))); }, [siteSettings]);
  useEffect(()=>{ if(!token) return; loadDB(); loadStats(); }, [token, loadDB, loadStats]);

  const saveAllSettings = async (data = formData) => {
    setSaving(true);
    try {
      await updateSettings(data);
      await refetchSettings();
      localStorage.setItem('igf_site_data', JSON.stringify(data));
      const bc = window.BroadcastChannel ? new BroadcastChannel('igf_admin') : null;
      if(bc){ bc.postMessage({ type:'fullSave', data, ts:Date.now() }); bc.close(); }
      toast('Settings saved!');
    } catch(err){ toast('Save failed: '+err.message,'error'); }
    finally { setSaving(false); }
  };

  const exportSettings = () => {
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData,null,2));
    a.download = `igf_settings_${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    toast('Settings exported!');
  };

  const importSettings = (e) => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async(ev)=>{ try { const p=JSON.parse(ev.target.result); setFormData(p); await saveAllSettings(p); toast('Settings imported!'); } catch{ toast('Invalid file format','error'); }};
    reader.readAsText(file);
  };

  if (!token) return <LoginScreen onLogin={t=>setToken(t)}/>;
  if (!formData) return <div style={{ display:'flex', minHeight:'100vh', background:'#0a0604', alignItems:'center', justifyContent:'center', color:'#6a4030', fontFamily:'Orbitron,sans-serif', fontSize:'0.7rem', letterSpacing:'0.15em' }}>INITIALIZING ADMIN SYSTEM...</div>;

  // Aggregated analytics
  const monthlyRevenue = (() => {
    const arr = new Array(12).fill(0);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    orders.forEach(o=>{ const d=new Date(o.createdAt); if(d.getFullYear()===new Date().getFullYear()) arr[d.getMonth()] += (o.amount||0)/1000; });
    return { data:arr, labels:months };
  })();

  const aggregatedCustomers = (() => {
    const m = {};
    orders.forEach(o=>{ const k=o.customer?.email||o.customer?.phone||'anon'; if(!m[k]){ m[k]={ name:o.customer?.name||'Anonymous', email:o.customer?.email||'—', phone:o.customer?.phone||'—', city:o.customer?.city||'—', orders:0, spent:0 }; } m[k].orders++; m[k].spent+=(o.amount||0); });
    return Object.values(m).sort((a,b)=>b.spent-a.spent);
  })();

  const NAV = [
    { group:'OVERVIEW', items:[
      { id:'dashboard', icon:'📊', label:'DASHBOARD' },
      { id:'analytics', icon:'📈', label:'ANALYTICS' },
      { id:'orders', icon:'📦', label:'ORDERS', badge: orders.filter(o=>o.status==='confirmed').length || null },
      { id:'inquiries', icon:'📩', label:'INQUIRIES', badge: inquiries.filter(i=>i.status==='new').length || null },
      { id:'customers', icon:'👥', label:'CUSTOMERS' },
      { id:'inventory', icon:'📋', label:'INVENTORY' },
    ]},
    { group:'CATALOG', items:[
      { id:'products', icon:'🎮', label:'PRODUCTS' },
      { id:'coupons', icon:'🏷️', label:'COUPONS' },
    ]},
    { group:'PAYMENTS', items:[
      { id:'razorpay', icon:'💳', label:'RAZORPAY' },
    ]},
    { group:'BRAND & DESIGN', items:[
      { id:'brand', icon:'✨', label:'LOGO & BRAND' },
      { id:'fonts', icon:'🎨', label:'THEME COLORS' },
      { id:'hero', icon:'🏠', label:'HERO SECTION' },
    ]},
    { group:'CONTENT', items:[
      { id:'about', icon:'ℹ️', label:'ABOUT' },
      { id:'gallery', icon:'🖼️', label:'GALLERY' },
      { id:'testimonials', icon:'💬', label:'TESTIMONIALS' },
      { id:'ticker', icon:'📣', label:'TICKER BAR' },
      { id:'contact', icon:'📞', label:'CONTACT' },
      { id:'whychoose', icon:'⭐', label:'WHY CHOOSE US' },
    ]},
    { group:'WEBSITE', items:[
      { id:'payment', icon:'💰', label:'PAYMENT CONFIG' },
      { id:'sections', icon:'🧩', label:'PAGE SECTIONS' },
      { id:'seo', icon:'⚙️', label:'SEO & BACKUP' },
    ]},
  ];

  const currentNavItem = NAV.flatMap(g=>g.items).find(n=>n.id===activeSection);

  return (
    <div className="admin-root">
      <Toast msg={toastMsg} type={toastType}/>
      <div className="grid-bg"/>

      <div style={{ display:'flex', minHeight:'100vh' }}>


        {/* ─── MAIN CONTENT ─── */}
        <div className="main-content">
          {/* Topbar */}
          <div style={{ height:58, background:'rgba(10,6,4,0.92)', borderBottom:'1px solid rgba(255,87,34,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', position:'sticky', top:0, zIndex:100, backdropFilter:'blur(16px)', flexShrink:0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {activeSection !== 'dashboard' && (
                <button
                  onClick={() => setActiveSection('dashboard')}
                  style={{
                    background: 'rgba(255,87,34,0.08)',
                    border: '1px solid rgba(255,87,34,0.3)',
                    color: 'var(--igf-orange)',
                    padding: '6px 14px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '0.6rem',
                    letterSpacing: '0.1em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  🏠 DASHBOARD
                </button>
              )}
              <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.62rem', letterSpacing:'0.14em', color:'var(--text-primary)' }}>
                {currentNavItem?.icon} {currentNavItem?.label}
              </div>
            </div>
            {saving&&<div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.48rem', color:'var(--igf-orange)', letterSpacing:'0.1em', animation:'pulse 1s infinite' }}>⟳ SAVING...</div>}
            
            {/* Quick Section Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                style={{
                  background: 'rgba(10,6,4,0.8)',
                  border: '1px solid rgba(255,87,34,0.25)',
                  color: 'var(--text-primary)',
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.6rem',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {NAV.map(g => (
                  <optgroup key={g.group} label={g.group} style={{ background: '#120805', color: 'var(--text-muted)' }}>
                    {g.items.map(item => (
                      <option key={item.id} value={item.id} style={{ background: '#120805', color: '#fff' }}>
                        {item.icon} {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <button
                onClick={() => { localStorage.removeItem('igf_token'); setToken(null); }}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444',
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.6rem',
                  letterSpacing: '0.08em',
                  cursor: 'pointer'
                }}
              >
                LOGOUT
              </button>
            </div>
          </div>

          {/* Panel area */}
          <div style={{ flex:1, padding:'28px 26px', overflowY:'auto' }}>

            {/* ── DASHBOARD ── */}
            {activeSection==='dashboard'&&(
              <div>
                <SectionHeader tag="Overview" title="System" accent="Dashboard" desc="Real-time statistics, live database metrics, and quick actions."/>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:14, marginBottom:24 }}>
                  <StatCard icon="📦" label="Total Orders" value={stats.totalOrders||0} sub="ALL TIME"/>
                  <StatCard icon="₹" label="Total Revenue" value={`₹${((stats.totalRevenue||0)/1000).toFixed(0)}K`} sub="ALL TIME" color="var(--igf-amber)"/>
                  <StatCard icon="🔄" label="Active Orders" value={stats.pendingOrders||0} sub="IN PROGRESS" color="#60a5fa"/>
                  <StatCard icon="✅" label="Delivered" value={stats.deliveredOrders||0} sub="COMPLETED" color="#4ade80"/>
                  <StatCard icon="🎮" label="Products" value={products.length} sub="CATALOG" color="#a78bfa"/>
                  <StatCard icon="📩" label="New Inquiries" value={inquiries.filter(i=>i.status==='new').length} sub="UNREAD" color="#fbbf24"/>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18, marginBottom:18 }}>
                  <GCard title="Database Sync & Backup">
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:12 }}>
                      <button className="btn btn-secondary" onClick={exportSettings} style={{ flex:1, padding:'12px', fontSize:'0.52rem', fontFamily:'Orbitron,sans-serif' }}>💾 EXPORT</button>
                      <label className="btn btn-secondary" style={{ flex:1, padding:'12px', fontSize:'0.52rem', fontFamily:'Orbitron,sans-serif', textAlign:'center', cursor:'pointer' }}>
                        📥 IMPORT<input type="file" accept=".json" onChange={importSettings} style={{ display:'none' }}/>
                      </label>
                      <button className="btn" onClick={()=>{ if(window.confirm('Reset all settings?')){ localStorage.removeItem('igf_site_data'); window.location.reload(); }}} style={{ flex:1, padding:'12px', fontSize:'0.52rem', fontFamily:'Orbitron,sans-serif', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', borderRadius:8, cursor:'pointer' }}>⚠️ RESET</button>
                    </div>
                  </GCard>

                  <GCard title="Recent Activity Log">
                    <div style={{ marginTop:10 }}>
                      {recentLogs.length===0?<div style={{ fontSize:'0.75rem', color:'var(--text-muted)', textAlign:'center', padding:'8px 0' }}>No activity yet.</div>
                      :recentLogs.map((log,i)=>(
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,87,34,0.06)', fontSize:'0.78rem' }}>
                          <span style={{ color:log.type==='error'?'#ef4444':'#4ade80' }}>{log.msg.slice(0,32)}</span>
                          <span style={{ color:'var(--text-dim)', fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem' }}>{log.time}</span>
                        </div>
                      ))}
                    </div>
                  </GCard>
                </div>

                <div style={{ marginTop:28 }}>
                  <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.65rem', letterSpacing:'0.2em', color:'var(--igf-orange)', marginBottom:20 }}>
                    SYSTEM CONTROL PANEL (QUICK ACTIONS)
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:20 }}>
                    {NAV.map(g => (
                      <GCard key={g.group} title={g.group}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:8, marginTop:14 }}>
                          {g.items.map(item => (
                            <button
                              key={item.id}
                              onClick={() => setActiveSection(item.id)}
                              style={{
                                display:'flex',
                                alignItems:'center',
                                gap:12,
                                padding:'12px 16px',
                                background:'rgba(255,87,34,0.02)',
                                border:'1px solid rgba(255,87,34,0.1)',
                                borderRadius:6,
                                color:'var(--text-primary)',
                                cursor:'pointer',
                                textAlign:'left',
                                transition:'all 0.25s'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255,87,34,0.06)';
                                e.currentTarget.style.borderColor = 'var(--igf-orange)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255,87,34,0.02)';
                                e.currentTarget.style.borderColor = 'rgba(255,87,34,0.1)';
                              }}
                            >
                              <span style={{ fontSize:'1.2rem' }}>{item.icon}</span>
                              <div style={{ flex:1 }}>
                                <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.78rem', fontWeight:600, letterSpacing:'0.05em' }}>
                                  {item.label}
                                </div>
                              </div>
                              {item.badge > 0 && (
                                <span style={{
                                  background:'rgba(255,87,34,0.18)',
                                  border:'1px solid rgba(255,87,34,0.3)',
                                  color:'var(--igf-orange)',
                                  padding:'2px 8px',
                                  fontSize:'0.45rem',
                                  fontFamily:'Orbitron,sans-serif',
                                  borderRadius:4
                                }}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </GCard>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {/* ── ANALYTICS ── */}
            {activeSection==='analytics'&&(
              <div>
                <SectionHeader tag="Insights" title="Sales" accent="Analytics" desc="Monthly revenue patterns and category breakdowns from live order data."/>
                <GCard title={`Monthly Revenue ${new Date().getFullYear()}`} style={{ marginBottom:20 }}>
                  <div style={{ marginTop:16 }}><SVGBarChart data={monthlyRevenue.data} labels={monthlyRevenue.labels}/></div>
                </GCard>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
                  <GCard title="Orders by Status">
                    <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:14 }}>
                      {[['Confirmed','#60a5fa'],['Processing','#a78bfa'],['Dispatched','#fbbf24'],['In-Transit','#fb923c'],['Delivered','#4ade80'],['Cancelled','#ef4444']].map(([s,c])=>{
                        const count = orders.filter(o=>o.status===s.toLowerCase().replace(' ','-')).length;
                        const pct = orders.length ? Math.round((count/orders.length)*100) : 0;
                        return (
                          <div key={s}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ fontSize:'0.82rem', color:'var(--text-primary)' }}>{s}</span>
                              <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.58rem', color:c }}>{count} ({pct}%)</span>
                            </div>
                            <div style={{ height:5, background:'rgba(255,87,34,0.1)', borderRadius:3 }}>
                              <div style={{ width:`${pct}%`, height:'100%', background:c, borderRadius:3, transition:'width 0.5s' }}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GCard>
                  <GCard title="Category Performance">
                    <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:14 }}>
                      {categories.slice(0,6).map(cat=>(
                        <div key={cat._id}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                            <span style={{ fontSize:'0.82rem', color:'var(--text-primary)' }}>{cat.name}</span>
                            <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.58rem', color:'var(--igf-orange)' }}>{cat.count} products</span>
                          </div>
                          <div style={{ height:5, background:'rgba(255,87,34,0.1)', borderRadius:3 }}>
                            <div style={{ width:`${Math.min(100, (cat.count/(Math.max(...categories.map(c=>c.count),1)))*100)}%`, height:'100%', background:'linear-gradient(90deg,#c0392b,#ff5722)', borderRadius:3 }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GCard>
                </div>
              </div>
            )}

            {/* ── ORDERS ── */}
            {activeSection==='orders'&&(
              <div>
                <SectionHeader tag="Sales" title="Order" accent="Management" desc="Manage orders, update shipping statuses, and verify payments."/>
                <OrdersTab orders={orders} setOrders={setOrders} loading={dbLoading} load={loadDB}/>
              </div>
            )}

            {/* ── INQUIRIES ── */}
            {activeSection==='inquiries'&&(
              <div>
                <SectionHeader tag="CRM" title="Customer" accent="Inquiries" desc="Respond to leads and product inquiries from your site."/>
                <InquiriesTab inquiries={inquiries} setInquiries={setInquiries} loading={dbLoading} load={loadDB}/>
              </div>
            )}

            {/* ── CUSTOMERS ── */}
            {activeSection==='customers'&&(
              <div>
                <SectionHeader tag="CRM" title="Customer" accent="Database" desc="Aggregated buyer data from the orders collection."/>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
                  <StatCard icon="👥" label="Total Buyers" value={aggregatedCustomers.length} sub="UNIQUE"/>
                  <StatCard icon="🔁" label="Repeat Buyers" value={aggregatedCustomers.filter(c=>c.orders>1).length} sub="LOYAL" color="var(--igf-amber)"/>
                  <StatCard icon="🏆" label="Top Spender" value={aggregatedCustomers[0]?`₹${(aggregatedCustomers[0].spent/1000).toFixed(0)}K`:'—'} sub={aggregatedCustomers[0]?.name||'—'} color="#4ade80"/>
                </div>
                <GCard>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead><tr style={{ borderBottom:'1px solid rgba(255,87,34,0.15)' }}>
                        {['#','NAME','EMAIL','PHONE','CITY','ORDERS','TOTAL SPENT'].map(h=><th key={h} style={{ padding:'10px 12px', fontFamily:'Orbitron,sans-serif', fontSize:'0.42rem', color:'var(--text-dim)', textAlign:'left' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>{aggregatedCustomers.map((c,i)=>(
                        <tr key={i} style={{ borderBottom:'1px solid rgba(255,87,34,0.05)' }}>
                          <td style={{ padding:'12px', fontSize:'0.78rem', color:'var(--text-dim)' }}>{i+1}</td>
                          <td style={{ padding:'12px', fontSize:'0.86rem', fontWeight:600, color:'var(--text-primary)' }}>{c.name}</td>
                          <td style={{ padding:'12px', fontSize:'0.8rem', color:'var(--text-muted)' }}>{c.email}</td>
                          <td style={{ padding:'12px', fontSize:'0.8rem', color:'var(--text-muted)' }}>{c.phone}</td>
                          <td style={{ padding:'12px', fontSize:'0.8rem', color:'var(--text-muted)' }}>{c.city}</td>
                          <td style={{ padding:'12px', fontFamily:'Orbitron,sans-serif', fontSize:'0.65rem', color:'var(--igf-orange)', textAlign:'center' }}>{c.orders}</td>
                          <td style={{ padding:'12px', fontFamily:'Orbitron,sans-serif', fontSize:'0.72rem', color:'var(--igf-amber)', fontWeight:700, textAlign:'right' }}>₹{c.spent.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </GCard>
              </div>
            )}

            {/* ── INVENTORY ── */}
            {activeSection==='inventory'&&(
              <div>
                <SectionHeader tag="Stock" title="Inventory" accent="Monitor" desc="Live stock availability across all product catalog items."/>
                <GCard title="Stock Levels">
                  <div style={{ marginTop:12 }}>
                    {products.map(prod=>{
                      const SC = {'in-stock':'#4ade80','low-stock':'#fbbf24','out-of-stock':'#ef4444','pre-order':'#60a5fa'};
                      return (
                        <div key={prod._id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:14, alignItems:'center', padding:'12px 0', borderBottom:'1px solid rgba(255,87,34,0.06)' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            <img src={IMG(prod.image)} alt="" style={{ width:40, height:40, borderRadius:6, objectFit:'cover', flexShrink:0 }} onError={e=>{e.target.src='/assets/logo2-scaled.png';}}/>
                            <div>
                              <div style={{ fontWeight:600, fontSize:'0.88rem', color:'var(--text-primary)' }}>{prod.name}</div>
                              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontFamily:'Orbitron,sans-serif' }}>{prod.categoryName}</div>
                            </div>
                          </div>
                          <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.72rem', color:'var(--igf-amber)' }}>₹{(prod.price||0).toLocaleString('en-IN')}</div>
                          <div style={{ textAlign:'right' }}>
                            <span style={{ padding:'4px 12px', borderRadius:20, fontFamily:'Orbitron,sans-serif', fontSize:'0.42rem', color:SC[prod.stock]||'#fff', background:`${SC[prod.stock]||'#fff'}18`, border:`1px solid ${SC[prod.stock]||'#fff'}33` }}>
                              {prod.stock?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {products.length===0&&<div style={{ textAlign:'center', padding:40, color:'var(--text-muted)', fontFamily:'Orbitron,sans-serif', fontSize:'0.6rem' }}>NO PRODUCTS IN DATABASE</div>}
                  </div>
                </GCard>
              </div>
            )}

            {/* ── PRODUCTS ── */}
            {activeSection==='products'&&(
              <div>
                <SectionHeader tag="Catalog" title="Product" accent="Management" desc="Full CRUD with disk image upload → stored as Base64 in MongoDB automatically."/>
                <ProductsTab products={products} setProducts={setProducts} categories={categories} loading={dbLoading} load={loadDB} toast={toast} formData={formData} saveAllSettings={saveAllSettings}/>
              </div>
            )}

            {/* ── COUPONS ── */}
            {activeSection==='coupons'&&(
              <div>
                <SectionHeader tag="Promotions" title="Coupon" accent="Manager" desc="Create and manage promo codes saved in MongoDB settings."/>
                <GCard title="Create New Coupon" style={{ marginBottom:20 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, alignItems:'end', marginTop:14 }}>
                    {[['CODE','text','SUMMER20','code'],['DISCOUNT %','number','10','pct'],['EXPIRY DATE','date','','expiry'],['MAX USES','number','100','maxUses']].map(([label,type,ph,key])=>(
                      <div key={key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>{label}</label>
                        <input type={type} placeholder={ph} style={INP} value={newCoupon[key]} onChange={e=>setNewCoupon({...newCoupon,[key]:type==='number'?Number(e.target.value):key==='code'?e.target.value.toUpperCase().trim():e.target.value})}/>
                      </div>
                    ))}
                    <button className="btn btn-primary" style={{ padding:'10px 14px', fontSize:'0.52rem', fontFamily:'Orbitron,sans-serif' }} onClick={async()=>{
                      if(!newCoupon.code||!newCoupon.pct||!newCoupon.expiry){alert('Code, discount, and expiry are required');return;}
                      const next = {...formData, coupons:[...(formData.coupons||[]),{...newCoupon}]};
                      setFormData(next); await saveAllSettings(next);
                      setNewCoupon({code:'',pct:10,expiry:'',uses:0,maxUses:100}); toast('Coupon created!');
                    }}>+ CREATE</button>
                  </div>
                </GCard>

                <GCard title="Active Coupons">
                  <div style={{ marginTop:12 }}>
                    {(formData.coupons||[]).length===0&&<div style={{ textAlign:'center', padding:30, color:'var(--text-muted)', fontFamily:'Orbitron,sans-serif', fontSize:'0.6rem' }}>NO COUPONS</div>}
                    {(formData.coupons||[]).map((c,i)=>(
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 0.7fr 0.8fr 1.2fr auto', gap:12, alignItems:'center', padding:'14px 0', borderBottom:'1px solid rgba(255,87,34,0.06)' }}>
                        <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.76rem', fontWeight:700, color:'var(--igf-orange)' }}>{c.code}</span>
                        <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.7' + 'rem', color:'var(--igf-amber)' }}>{c.pct}% OFF</span>
                        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Exp: {c.expiry}</span>
                        <div>
                          <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:4 }}>{c.uses}/{c.maxUses} uses</div>
                          <div style={{ height:4, background:'rgba(255,87,34,0.1)', borderRadius:2 }}>
                            <div style={{ width:`${Math.min(100,(c.uses/c.maxUses)*100)}%`, height:'100%', background:'var(--igf-orange)', borderRadius:2 }}/>
                          </div>
                        </div>
                        <button onClick={async()=>{ if(!window.confirm(`Delete ${c.code}?`))return; const next={...formData,coupons:formData.coupons.filter((_,j)=>j!==i)}; setFormData(next); await saveAllSettings(next); toast('Coupon deleted'); }} style={{ padding:'5px 12px', borderRadius:6, fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem', border:'1px solid rgba(239,68,68,0.2)', background:'transparent', color:'#ef4444', cursor:'pointer' }}>DEL</button>
                      </div>
                    ))}
                  </div>
                </GCard>
              </div>
            )}

            {/* ── RAZORPAY ── */}
            {activeSection==='razorpay'&&(
              <div>
                <SectionHeader tag="Payments" title="Razorpay" accent="Configuration" desc="Manage API keys, view payment analytics, and test the gateway."/>
                <RazorpayPanel orders={orders} toast={toast}/>
              </div>
            )}

            {/* ── BRAND ── */}
            {activeSection==='brand'&&(
              <div>
                <SectionHeader tag="Design" title="Logo &" accent="Brand" desc="Edit branding names, taglines, footer text and copyright."/>
                <GCard>
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {[['BRAND NAME 1','identity','brandName1'],['BRAND NAME 2','identity','brandName2'],['BRAND TAGLINE','identity','brandTagline'],['FOOTER COPYRIGHT','identity','footerCopyright'],['FOOTER TAGLINE','identity','footerTagline']].map(([label,section,key])=>(
                      <div key={key} style={{ display:'flex', flexDirection:'column', gap:5 }}>
                        <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>{label}</label>
                        <input style={INP} value={formData[section]?.[key]||''} onChange={e=>setFormData({...formData,[section]:{...formData[section],[key]:e.target.value}})}/>
                      </div>
                    ))}
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                      <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>FOOTER ABOUT DESCRIPTION</label>
                      <textarea style={{ ...INP, minHeight:70, resize:'vertical' }} value={formData.identity?.footerAbout||''} onChange={e=>setFormData({...formData,identity:{...formData.identity,footerAbout:e.target.value}})}/>
                    </div>
                    <button className="btn btn-primary" style={{ padding:'12px', fontSize:'0.6rem', fontFamily:'Orbitron,sans-serif', width:'fit-content' }} onClick={()=>saveAllSettings()}>💾 SAVE BRAND</button>
                  </div>
                </GCard>
              </div>
            )}

            {/* ── FONTS & COLORS ── */}
            {activeSection==='fonts'&&(
              <div>
                <SectionHeader tag="Design" title="Theme" accent="Colors & Fonts"/>
                <GCard title="Color Palette" style={{ marginBottom:20 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginTop:14 }}>
                    {[['PRIMARY (ORANGE)','colorPrimaryHex','#ff5722'],['SECONDARY (RED)','colorSecondaryHex','#c0392b'],['ACCENT (GOLD)','colorAccentHex','#ffab40'],['BACKGROUND','colorBgHex','#0d0705']].map(([label,key,def])=>(
                      <div key={key} style={{ display:'flex', flexDirection:'column', gap:5 }}>
                        <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>{label}</label>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <input type="color" value={formData.design?.[key]||def} onChange={e=>setFormData({...formData,design:{...formData.design,[key]:e.target.value}})} style={{ width:38, height:38, border:'none', background:'transparent', cursor:'pointer' }}/>
                          <input style={INP} value={formData.design?.[key]||''} onChange={e=>setFormData({...formData,design:{...formData.design,[key]:e.target.value}})}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </GCard>
                <GCard title="Typography">
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginTop:14 }}>
                    {[['HEADING FONT','fontHeading'],['SUB-HEADING FONT','fontSub'],['BODY FONT','fontBody']].map(([label,key])=>(
                      <div key={key} style={{ display:'flex', flexDirection:'column', gap:5 }}>
                        <label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>{label}</label>
                        <input style={INP} value={formData.design?.[key]||''} onChange={e=>setFormData({...formData,design:{...formData.design,[key]:e.target.value}})}/>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-primary" style={{ padding:'12px', fontSize:'0.6rem', fontFamily:'Orbitron,sans-serif', width:'fit-content', marginTop:18 }} onClick={()=>saveAllSettings()}>💾 SAVE DESIGN</button>
                </GCard>
              </div>
            )}

            {/* ── HERO ── */}
            {activeSection==='hero'&&(
              <div>
                <SectionHeader tag="Design" title="Hero" accent="Section" desc="Homepage banner headline, subtitle, CTAs, and stats."/>
                <GCard title="Hero Content" style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:14 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>BADGE TEXT</label><input style={INP} value={formData.hero?.heroBadge||''} onChange={e=>setFormData({...formData,hero:{...formData.hero,heroBadge:e.target.value}})}/></div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>TITLE LINE 1</label><input style={INP} value={formData.hero?.heroTitle1||''} onChange={e=>setFormData({...formData,hero:{...formData.hero,heroTitle1:e.target.value}})}/></div>
                      <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>TITLE LINE 2</label><input style={INP} value={formData.hero?.heroTitle2||''} onChange={e=>setFormData({...formData,hero:{...formData.hero,heroTitle2:e.target.value}})}/></div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>SUBTITLE</label><textarea style={{ ...INP, minHeight:70, resize:'vertical' }} value={formData.hero?.heroSub||''} onChange={e=>setFormData({...formData,hero:{...formData.hero,heroSub:e.target.value}})}/></div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>PRIMARY CTA</label><input style={INP} value={formData.hero?.heroBtnPrimary||''} onChange={e=>setFormData({...formData,hero:{...formData.hero,heroBtnPrimary:e.target.value}})}/></div>
                      <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>SECONDARY CTA</label><input style={INP} value={formData.hero?.heroBtnSecondary||''} onChange={e=>setFormData({...formData,hero:{...formData.hero,heroBtnSecondary:e.target.value}})}/></div>
                    </div>
                  </div>
                </GCard>
                <GCard title="Stats Figures">
                  <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:14 }}>
                    {(formData.hero?.stats||[]).map((stat,i)=>(
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr auto', gap:10, alignItems:'center' }}>
                        <input style={INP} placeholder="value" value={stat.value||''} onChange={e=>{ const c=[...formData.hero.stats]; c[i].value=e.target.value; setFormData({...formData,hero:{...formData.hero,stats:c}}); }}/>
                        <input style={INP} placeholder="label" value={stat.label||''} onChange={e=>{ const c=[...formData.hero.stats]; c[i].label=e.target.value; setFormData({...formData,hero:{...formData.hero,stats:c}}); }}/>
                        <button onClick={()=>setFormData({...formData,hero:{...formData.hero,stats:formData.hero.stats.filter((_,j)=>j!==i)}})} style={{ background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'1.1rem' }}>×</button>
                      </div>
                    ))}
                    <button className="btn btn-secondary" style={{ width:'fit-content', fontSize:'0.5rem', fontFamily:'Orbitron,sans-serif', padding:'8px 12px' }} onClick={()=>setFormData({...formData,hero:{...formData.hero,stats:[...(formData.hero?.stats||[]),{label:'New Stat',value:'0+'}]}})}>+ ADD STAT</button>
                    <button className="btn btn-primary" style={{ padding:'12px', fontSize:'0.6rem', fontFamily:'Orbitron,sans-serif', width:'fit-content', marginTop:8 }} onClick={()=>saveAllSettings()}>💾 SAVE HERO</button>
                  </div>
                </GCard>
              </div>
            )}

            {/* ── ABOUT ── */}
            {activeSection==='about'&&(
              <div>
                <SectionHeader tag="Content" title="About" accent="Section"/>
                <GCard style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      {[['SECTION TAG','aboutTag'],['CTA BUTTON','aboutCta'],['BADGE NUMBER','aboutBadgeNum'],['BADGE LABEL','aboutBadgeLabel']].map(([l,k])=>(
                        <div key={k} style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>{l}</label><input style={INP} value={formData.about?.[k]||''} onChange={e=>setFormData({...formData,about:{...formData.about,[k]:e.target.value}})}/></div>
                      ))}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>TITLE</label><input style={INP} value={formData.about?.aboutTitle||''} onChange={e=>setFormData({...formData,about:{...formData.about,aboutTitle:e.target.value}})}/></div>
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>DESCRIPTION</label><textarea style={{ ...INP, minHeight:70, resize:'vertical' }} value={formData.about?.aboutDesc||''} onChange={e=>setFormData({...formData,about:{...formData.about,aboutDesc:e.target.value}})}/></div>

                    {/* About image upload */}
                    <ImageUploadZone
                      value={formData.about?.aboutImgPath?.startsWith('data:')||formData.about?.aboutImgPath?.startsWith('http') ? formData.about?.aboutImgPath : ''}
                      onChange={v=>setFormData({...formData,about:{...formData.about,aboutImgPath:v}})}
                      label="ABOUT SECTION IMAGE (upload from disk)"
                    />
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>OR IMAGE PATH (if not uploaded)</label><input style={INP} value={formData.about?.aboutImgPath||''} onChange={e=>setFormData({...formData,about:{...formData.about,aboutImgPath:e.target.value}})}/></div>
                  </div>
                </GCard>
                <GCard title="Key Features">
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:12 }}>
                    {(formData.about?.aboutFeatures||[]).map((f,i)=>(
                      <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ color:'var(--igf-orange)' }}>▸</span>
                        <input style={INP} value={f} onChange={e=>{ const c=[...formData.about.aboutFeatures]; c[i]=e.target.value; setFormData({...formData,about:{...formData.about,aboutFeatures:c}}); }}/>
                        <button onClick={()=>setFormData({...formData,about:{...formData.about,aboutFeatures:formData.about.aboutFeatures.filter((_,j)=>j!==i)}})} style={{ background:'transparent', border:'none', color:'#ef4444', cursor:'pointer' }}>×</button>
                      </div>
                    ))}
                    <div style={{ display:'flex', gap:8, marginTop:8 }}>
                      <input style={INP} placeholder="Add a feature..." value={newFeat} onChange={e=>setNewFeat(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&newFeat.trim()){ setFormData({...formData,about:{...formData.about,aboutFeatures:[...(formData.about?.aboutFeatures||[]),newFeat.trim()]}}); setNewFeat(''); }}}/>
                      <button className="btn btn-secondary" style={{ whiteSpace:'nowrap', fontSize:'0.5rem', fontFamily:'Orbitron,sans-serif' }} onClick={()=>{ if(newFeat.trim()){ setFormData({...formData,about:{...formData.about,aboutFeatures:[...(formData.about?.aboutFeatures||[]),newFeat.trim()]}}); setNewFeat(''); }}}>ADD</button>
                    </div>
                    <button className="btn btn-primary" style={{ padding:'12px', fontSize:'0.6rem', fontFamily:'Orbitron,sans-serif', width:'fit-content', marginTop:8 }} onClick={()=>saveAllSettings()}>💾 SAVE ABOUT</button>
                  </div>
                </GCard>
              </div>
            )}

            {/* ── GALLERY ── */}
            {activeSection==='gallery'&&(
              <div>
                <SectionHeader tag="Content" title="Gallery" accent="Portfolio" desc="Manage homepage showcase images."/>
                <GCard title="Add Showcase Image" style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:14 }}>
                    <ImageUploadZone value={newGallery.url} onChange={v=>setNewGallery({...newGallery,url:v})} label="GALLERY IMAGE (upload from disk or enter URL below)"/>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
                      {[['TITLE','title'],['SUB-TITLE','sub'],['TAGS (comma-sep)','tags'],['OR IMAGE URL','url']].map(([l,k])=>(
                        <div key={k} style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>{l}</label><input style={INP} placeholder={l} value={newGallery[k]} onChange={e=>setNewGallery({...newGallery,[k]:e.target.value})}/></div>
                      ))}
                    </div>
                    <button className="btn btn-primary" style={{ width:'fit-content', fontSize:'0.52rem', fontFamily:'Orbitron,sans-serif' }} onClick={async()=>{
                      if(!newGallery.title||!newGallery.url){alert('Title and image are required');return;}
                      const next={...formData,gallery:[...(formData.gallery||[]),{...newGallery,id:Date.now().toString()}]};
                      setFormData(next); await saveAllSettings(next);
                      setNewGallery({title:'',sub:'',tags:'',url:''}); toast('Image added!');
                    }}>+ ADD IMAGE</button>
                  </div>
                </GCard>
                <GCard title="Gallery Manager">
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:14, marginTop:14 }}>
                    {(formData.gallery||[]).map((img,i)=>(
                      <div key={img.id||i} style={{ background:'rgba(255,87,34,0.03)', border:'1px solid rgba(255,87,34,0.12)', borderRadius:10, overflow:'hidden' }}>
                        <img src={IMG(img.url)} alt={img.title} style={{ width:'100%', height:120, objectFit:'cover' }} onError={e=>{e.target.src='/assets/logo2-scaled.png';}}/>
                        <div style={{ padding:12 }}>
                          <div style={{ fontWeight:700, fontSize:'0.84rem', color:'var(--text-primary)' }}>{img.title}</div>
                          <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', margin:'2px 0 8px' }}>{img.sub}</div>
                          <button onClick={async()=>{ if(!window.confirm('Delete this image?'))return; const next={...formData,gallery:formData.gallery.filter((_,j)=>j!==i)}; setFormData(next); await saveAllSettings(next); toast('Deleted'); }} style={{ width:'100%', padding:'6px', background:'transparent', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', borderRadius:6, cursor:'pointer', fontFamily:'Orbitron,sans-serif', fontSize:'0.46rem' }}>🗑 DELETE</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </GCard>
              </div>
            )}

            {/* ── TESTIMONIALS ── */}
            {activeSection==='testimonials'&&(
              <div>
                <SectionHeader tag="Content" title="Client" accent="Testimonials"/>
                <GCard title="Add Testimonial" style={{ marginBottom:20 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginTop:14 }}>
                    {[['CLIENT NAME','name'],['ROLE / COMPANY','role'],['AVATAR (initials)','avatar']].map(([l,k])=>(
                      <div key={k} style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>{l}</label><input style={INP} value={newTestimonial[k]} onChange={e=>setNewTestimonial({...newTestimonial,[k]:e.target.value})}/></div>
                    ))}
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>RATING</label><select style={INP} value={newTestimonial.stars} onChange={e=>setNewTestimonial({...newTestimonial,stars:e.target.value})}><option value="★★★★★">5 Stars</option><option value="★★★★☆">4 Stars</option><option value="★★★☆☆">3 Stars</option></select></div>
                    <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>QUOTE</label><textarea style={{ ...INP, minHeight:60 }} value={newTestimonial.quote} onChange={e=>setNewTestimonial({...newTestimonial,quote:e.target.value})}/></div>
                    <button className="btn btn-primary" style={{ width:'fit-content', fontSize:'0.52rem', fontFamily:'Orbitron,sans-serif' }} onClick={async()=>{
                      if(!newTestimonial.name||!newTestimonial.quote){alert('Name and quote required');return;}
                      const next={...formData,testimonials:[...(formData.testimonials||[]),{...newTestimonial,id:Date.now().toString()}]};
                      setFormData(next); await saveAllSettings(next);
                      setNewTestimonial({name:'',role:'',quote:'',stars:'★★★★★',avatar:''}); toast('Review added!');
                    }}>+ ADD REVIEW</button>
                  </div>
                </GCard>
                <GCard title="Testimonials">
                  <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:14 }}>
                    {(formData.testimonials||[]).map((t,i)=>(
                      <div key={t.id||i} style={{ display:'flex', gap:14, padding:14, background:'rgba(255,87,34,0.02)', border:'1px solid rgba(255,87,34,0.08)', borderRadius:8 }}>
                        <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--igf-orange)', color:'#0d0705', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Orbitron,sans-serif', fontWeight:700, fontSize:'0.7rem', flexShrink:0 }}>{t.avatar||t.name?.slice(0,2).toUpperCase()}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:6 }}>
                            <div><span style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'0.9rem' }}>{t.name}</span><span style={{ fontSize:'0.76rem', color:'var(--text-muted)', marginLeft:8 }}>{t.role}</span></div>
                            <span style={{ color:'var(--igf-amber)' }}>{t.stars}</span>
                          </div>
                          <p style={{ fontSize:'0.84rem', color:'var(--text-muted)', fontStyle:'italic', margin:'8px 0 10px', lineHeight:1.6 }}>"{t.quote}"</p>
                          <button onClick={async()=>{ if(!window.confirm('Delete?'))return; const next={...formData,testimonials:formData.testimonials.filter((_,j)=>j!==i)}; setFormData(next); await saveAllSettings(next); toast('Deleted'); }} style={{ padding:'4px 10px', borderRadius:5, fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', border:'1px solid rgba(239,68,68,0.2)', background:'transparent', color:'#ef4444', cursor:'pointer' }}>DELETE</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </GCard>
              </div>
            )}

            {/* ── TICKER ── */}
            {activeSection==='ticker'&&(
              <div>
                <SectionHeader tag="Content" title="Ticker" accent="Bar" desc="Scrolling announcement bar shown at the top of the homepage."/>
                <GCard>
                  <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:14 }}>
                    {(formData.ticker||[]).map((item,i)=>(
                      <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span>📢</span>
                        <input style={INP} value={item||''} onChange={e=>{ const c=[...formData.ticker]; c[i]=e.target.value; setFormData({...formData,ticker:c}); }}/>
                        <button onClick={()=>setFormData({...formData,ticker:formData.ticker.filter((_,j)=>j!==i)})} style={{ background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'1.1rem' }}>×</button>
                      </div>
                    ))}
                    <div style={{ display:'flex', gap:8, marginTop:8 }}>
                      <input style={INP} placeholder="Add ticker message..." value={newTickerItem} onChange={e=>setNewTickerItem(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&newTickerItem.trim()){ setFormData({...formData,ticker:[...(formData.ticker||[]),newTickerItem.trim()]}); setNewTickerItem(''); }}}/>
                      <button className="btn btn-secondary" style={{ whiteSpace:'nowrap', fontSize:'0.5rem', fontFamily:'Orbitron,sans-serif' }} onClick={()=>{ if(newTickerItem.trim()){ setFormData({...formData,ticker:[...(formData.ticker||[]),newTickerItem.trim()]}); setNewTickerItem(''); }}}>ADD</button>
                    </div>
                    <button className="btn btn-primary" style={{ padding:'12px', fontSize:'0.6rem', fontFamily:'Orbitron,sans-serif', width:'fit-content', marginTop:8 }} onClick={()=>saveAllSettings()}>💾 SAVE TICKER</button>
                  </div>
                </GCard>
              </div>
            )}

            {/* ── CONTACT ── */}
            {activeSection==='contact'&&(
              <div>
                <SectionHeader tag="Content" title="Contact" accent="Info"/>
                <GCard>
                  <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:14 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>HEADQUARTERS ADDRESS</label><textarea style={{ ...INP, minHeight:60 }} value={formData.contact?.contactAddress||''} onChange={e=>setFormData({...formData,contact:{...formData.contact,contactAddress:e.target.value}})}/></div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      {[['PHONE','contactPhone'],['WHATSAPP (with country code)','contactWA'],['EMAIL','contactEmail'],['WORKING HOURS','contactHours'],['CTA TITLE 1','ctaTitle1'],['CTA TITLE 2','ctaTitle2']].map(([l,k])=>(
                        <div key={k} style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>{l}</label><input style={INP} value={formData.contact?.[k]||''} onChange={e=>setFormData({...formData,contact:{...formData.contact,[k]:e.target.value}})}/></div>
                      ))}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>CTA SUBTITLE</label><textarea style={{ ...INP, minHeight:60 }} value={formData.contact?.ctaSub||''} onChange={e=>setFormData({...formData,contact:{...formData.contact,ctaSub:e.target.value}})}/></div>
                    <button className="btn btn-primary" style={{ padding:'12px', fontSize:'0.6rem', fontFamily:'Orbitron,sans-serif', width:'fit-content' }} onClick={()=>saveAllSettings()}>💾 SAVE CONTACT</button>
                  </div>
                </GCard>
              </div>
            )}

            {/* ── WHY CHOOSE US ── */}
            {activeSection==='whychoose'&&(
              <div>
                <SectionHeader tag="Content" title="Why Choose" accent="Us"/>
                <GCard style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {[['SECTION TAG','whyTag'],['TITLE','whyTitle'],['QUOTE AUTHOR','whyQuoteAuthor']].map(([l,k])=>(
                      <div key={k} style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>{l}</label><input style={INP} value={formData.whyUs?.[k]||''} onChange={e=>setFormData({...formData,whyUs:{...formData.whyUs,[k]:e.target.value}})}/></div>
                    ))}
                    {[['DESCRIPTION','whyDesc'],['QUOTE TEXT','whyQuoteText']].map(([l,k])=>(
                      <div key={k} style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>{l}</label><textarea style={{ ...INP, minHeight:60, resize:'vertical' }} value={formData.whyUs?.[k]||''} onChange={e=>setFormData({...formData,whyUs:{...formData.whyUs,[k]:e.target.value}})}/></div>
                    ))}
                  </div>
                </GCard>
                <GCard title="Advantage Cards">
                  <div style={{ display:'flex', flexDirection:'column', gap:14, marginTop:14 }}>
                    {(formData.whyUs?.whyCards||[]).map((card,i)=>(
                      <div key={i} style={{ padding:14, background:'rgba(255,87,34,0.03)', border:'1px solid rgba(255,87,34,0.08)', borderRadius:8 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'60px 1fr auto', gap:10, alignItems:'center', marginBottom:8 }}>
                          <input style={INP} placeholder="icon" value={card.icon||''} onChange={e=>{ const c=[...formData.whyUs.whyCards]; c[i].icon=e.target.value; setFormData({...formData,whyUs:{...formData.whyUs,whyCards:c}}); }}/>
                          <input style={INP} placeholder="title" value={card.title||''} onChange={e=>{ const c=[...formData.whyUs.whyCards]; c[i].title=e.target.value; setFormData({...formData,whyUs:{...formData.whyUs,whyCards:c}}); }}/>
                          <button onClick={()=>setFormData({...formData,whyUs:{...formData.whyUs,whyCards:formData.whyUs.whyCards.filter((_,j)=>j!==i)}})} style={{ background:'transparent', border:'none', color:'#ef4444', cursor:'pointer' }}>×</button>
                        </div>
                        <textarea style={{ ...INP, minHeight:50 }} placeholder="description..." value={card.text||''} onChange={e=>{ const c=[...formData.whyUs.whyCards]; c[i].text=e.target.value; setFormData({...formData,whyUs:{...formData.whyUs,whyCards:c}}); }}/>
                      </div>
                    ))}
                    <button className="btn btn-secondary" style={{ width:'fit-content', fontSize:'0.5rem', fontFamily:'Orbitron,sans-serif' }} onClick={()=>setFormData({...formData,whyUs:{...formData.whyUs,whyCards:[...(formData.whyUs?.whyCards||[]),{icon:'🏆',title:'New Advantage',text:'Description...'}]}})}>+ ADD CARD</button>
                    <button className="btn btn-primary" style={{ padding:'12px', fontSize:'0.6rem', fontFamily:'Orbitron,sans-serif', width:'fit-content' }} onClick={()=>saveAllSettings()}>💾 SAVE WHY US</button>
                  </div>
                </GCard>
              </div>
            )}

            {/* ── PAYMENT CONFIG ── */}
            {activeSection==='payment'&&(
              <div>
                <SectionHeader tag="Website" title="Payment" accent="Config" desc="UPI ID, QR code path, and preset checkout amounts."/>
                <GCard style={{ marginBottom:20 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:14 }}>
                    {[['BUSINESS NAME','businessName'],['UPI ID','upiId'],['CONTACT PHONE','contactPhone'],['QR CODE PATH','qrPath']].map(([l,k])=>(
                      <div key={k} style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>{l}</label><input style={INP} value={formData.payment?.[k]||''} onChange={e=>setFormData({...formData,payment:{...formData.payment,[k]:e.target.value}})}/></div>
                    ))}
                  </div>
                </GCard>
                <GCard title="Preset Amounts">
                  <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:14 }}>
                    {(formData.payment?.presetAmounts||[]).map((a,i)=>(
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:10 }}>
                        <input type="number" style={INP} value={a.amount} onChange={e=>{ const c=[...formData.payment.presetAmounts]; c[i].amount=Number(e.target.value); setFormData({...formData,payment:{...formData.payment,presetAmounts:c}}); }}/>
                        <input style={INP} placeholder="label" value={a.label||''} onChange={e=>{ const c=[...formData.payment.presetAmounts]; c[i].label=e.target.value; setFormData({...formData,payment:{...formData.payment,presetAmounts:c}}); }}/>
                        <button onClick={()=>setFormData({...formData,payment:{...formData.payment,presetAmounts:formData.payment.presetAmounts.filter((_,j)=>j!==i)}})} style={{ background:'transparent', border:'none', color:'#ef4444', cursor:'pointer' }}>×</button>
                      </div>
                    ))}
                    <button className="btn btn-secondary" style={{ width:'fit-content', fontSize:'0.5rem', fontFamily:'Orbitron,sans-serif' }} onClick={()=>setFormData({...formData,payment:{...formData.payment,presetAmounts:[...(formData.payment?.presetAmounts||[]),{amount:1000,label:'₹1,000'}]}})}>+ ADD</button>
                    <button className="btn btn-primary" style={{ padding:'12px', fontSize:'0.6rem', fontFamily:'Orbitron,sans-serif', width:'fit-content', marginTop:8 }} onClick={()=>saveAllSettings()}>💾 SAVE PAYMENT</button>
                  </div>
                </GCard>
              </div>
            )}

            {/* ── SECTIONS VISIBILITY ── */}
            {activeSection==='sections'&&(
              <div>
                <SectionHeader tag="Website" title="Page" accent="Sections" desc="Show or hide homepage layout sections."/>
                <GCard>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginTop:14 }}>
                    {Object.keys(formData.visibility||{}).map(key=>(
                      <label key={key} htmlFor={`vis_${key}`} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'rgba(255,87,34,0.04)', border:`1px solid rgba(255,87,34,${formData.visibility[key]!==false?'0.2':'0.08'})`, borderRadius:8, cursor:'pointer', transition:'all 0.2s' }}>
                        <input type="checkbox" id={`vis_${key}`} checked={formData.visibility[key]!==false} onChange={e=>setFormData({...formData,visibility:{...formData.visibility,[key]:e.target.checked}})} style={{ width:18, height:18, accentColor:'var(--igf-orange)', cursor:'pointer' }}/>
                        <span style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.52rem', color:formData.visibility[key]!==false?'var(--text-primary)':'var(--text-muted)', letterSpacing:'0.1em' }}>{key.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                  <button className="btn btn-primary" style={{ padding:'12px', fontSize:'0.6rem', fontFamily:'Orbitron,sans-serif', width:'fit-content', marginTop:20 }} onClick={()=>saveAllSettings()}>💾 SAVE VISIBILITY</button>
                </GCard>
              </div>
            )}

            {/* ── SEO & BACKUP ── */}
            {activeSection==='seo'&&(
              <div>
                <SectionHeader tag="Website" title="SEO &" accent="Backup" desc="Global meta tags, backup, and import/reset controls."/>
                <GCard title="SEO Meta Tags" style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:14 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>GLOBAL META TITLE</label><input style={INP} value={formData.seo?.metaTitle||''} onChange={e=>setFormData({...formData,seo:{...formData.seo,metaTitle:e.target.value}})}/></div>
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontFamily:'Orbitron,sans-serif', fontSize:'0.44rem', color:'rgba(255,240,234,0.4)' }}>GLOBAL META DESCRIPTION</label><textarea style={{ ...INP, minHeight:80, resize:'vertical' }} value={formData.seo?.metaDesc||''} onChange={e=>setFormData({...formData,seo:{...formData.seo,metaDesc:e.target.value}})}/></div>
                    <button className="btn btn-primary" style={{ padding:'12px', fontSize:'0.6rem', fontFamily:'Orbitron,sans-serif', width:'fit-content' }} onClick={()=>saveAllSettings()}>💾 SAVE SEO</button>
                  </div>
                </GCard>
                <GCard title="Database Backup">
                  <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:14 }}>Export all website configuration to JSON, or restore from a previous backup.</p>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    <button className="btn btn-secondary" onClick={exportSettings} style={{ padding:'12px 24px', fontSize:'0.52rem', fontFamily:'Orbitron,sans-serif' }}>💾 EXPORT CONFIG</button>
                    <label className="btn btn-secondary" style={{ padding:'12px 24px', fontSize:'0.52rem', fontFamily:'Orbitron,sans-serif', cursor:'pointer', textAlign:'center' }}>
                      📥 IMPORT CONFIG<input type="file" accept=".json" onChange={importSettings} style={{ display:'none' }}/>
                    </label>
                    <button onClick={()=>{ if(window.confirm('Reset all settings to defaults?')){ localStorage.removeItem('igf_site_data'); window.location.reload(); }}} style={{ padding:'12px 24px', fontSize:'0.52rem', fontFamily:'Orbitron,sans-serif', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', borderRadius:8, cursor:'pointer' }}>⚠️ RESET ALL</button>
                  </div>
                </GCard>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
