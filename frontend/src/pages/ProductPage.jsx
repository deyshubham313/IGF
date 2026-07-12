import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProduct, getProducts } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../components/Toast';

function formatPrice(n) { return '₹' + n.toLocaleString('en-IN'); }

function StarRating({ rating = 4.7 }) {
  return (
    <span style={{ color: '#fbbf24', fontSize: '1rem', letterSpacing: 1 }}>
      {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
    </span>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('description');
  const [activeImg, setActiveImg] = useState(0);
  const [pincode, setPincode] = useState('');
  const [pinResult, setPinResult] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setActiveImg(0);
    getProduct(id)
      .then(res => {
        setProduct(res.data.product);
        return getProducts({ category: res.data.product.category, limit: 6 });
      })
      .then(res => setSimilar((res.data.products || []).filter(p => p.id !== id).slice(0, 5)))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="page-loading">
      <div className="spin-ring" />
      <div className="page-loading-text">LOADING PRODUCT...</div>
    </div>
  );
  if (!product) return null;

  const wished = isInWishlist(product.id || product._id);
  const galleryImages = [product.image, ...(product.images || [])].filter(Boolean);

  const handleAddToCart = () => { addToCart(product); showToast(`${product.name} added to enquiry cart!`, 'success'); };
  const handleWishlist = () => {
    if (wished) { removeFromWishlist(product.id || product._id); showToast('Removed from wishlist', 'info'); }
    else { addToWishlist(product); showToast(`${product.name} added to wishlist!`, 'success'); }
  };
  const handlePinCheck = () => {
    if (!pincode || pincode.length < 6) { setPinResult('Please enter a valid 6-digit PIN code'); return; }
    setPinResult('✅ Delivery available to this area. ETA: 5–7 working days.');
  };

  const getImageSrc = (img) => {
    if (!img) return '/assets/logo2-scaled.png';
    if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/')) return img;
    return `/${img}`;
  };

  const stockConfig = {
    'in-stock': { label: 'IN STOCK', color: '#4ade80' },
    'low-stock': { label: 'LOW STOCK', color: '#fbbf24' },
    'out-of-stock': { label: 'OUT OF STOCK', color: '#ef4444' },
    'pre-order': { label: 'PRE-ORDER', color: '#a78bfa' },
  };
  const stock = stockConfig[product.stock] || stockConfig['in-stock'];

  return (
    <>
      <style>{`
        .pp-root { padding-top: 70px; }
        .pp-breadcrumb {
          padding: 18px 5%; display: flex; align-items: center; gap: 8px;
          font-family: 'Orbitron', sans-serif; font-size: 0.5rem; letter-spacing: 0.12em;
          color: rgba(255,240,234,0.3); border-bottom: 1px solid rgba(255,87,34,0.07);
          background: rgba(10,6,4,0.6); backdrop-filter: blur(8px);
          position: sticky; top: 70px; z-index: 10;
        }
        .pp-breadcrumb a { color: rgba(255,240,234,0.3); text-decoration: none; transition: color 0.2s; }
        .pp-breadcrumb a:hover { color: var(--igf-orange); }
        .pp-breadcrumb .active { color: var(--igf-orange); }
        .pp-main {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 56px; padding: 48px 5% 64px;
          max-width: 1400px; margin: 0 auto; align-items: start;
        }
        /* Image gallery */
        .pp-gallery {}
        .pp-main-img-wrap {
          position: relative; border-radius: 14px; overflow: hidden;
          background: rgba(15,8,5,0.8); border: 1px solid rgba(255,87,34,0.12);
          aspect-ratio: 4/3; margin-bottom: 14px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .pp-main-img {
          width: 100%; height: 100%; object-fit: contain;
          transition: opacity 0.3s, transform 0.4s;
          padding: 10px;
        }
        .pp-img-tag {
          position: absolute; top: 14px; left: 14px;
          background: var(--igf-orange); color: #0d0705;
          font-family: 'Orbitron', sans-serif; font-size: 0.48rem;
          font-weight: 700; letter-spacing: 0.18em; padding: 4px 10px; border-radius: 4px;
        }
        .pp-thumb-row { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
        .pp-thumb-row::-webkit-scrollbar { height: 2px; }
        .pp-thumb-row::-webkit-scrollbar-thumb { background: rgba(255,87,34,0.2); }
        .pp-thumb {
          width: 72px; height: 72px; border-radius: 8px; overflow: hidden;
          flex-shrink: 0; cursor: pointer; transition: all 0.25s;
          background: rgba(15,8,5,0.8);
        }
        .pp-thumb.active { box-shadow: 0 0 0 2px var(--igf-orange), 0 0 12px rgba(255,87,34,0.3); }
        .pp-thumb:not(.active) { border: 1px solid rgba(255,87,34,0.15); opacity: 0.7; }
        .pp-thumb:hover:not(.active) { opacity: 1; border-color: rgba(255,87,34,0.35); }
        .pp-thumb img { width: 100%; height: 100%; object-fit: cover; }
        /* Info panel */
        .pp-info {}
        .pp-cat-label {
          font-family: 'Orbitron', sans-serif; font-size: 0.52rem; letter-spacing: 0.22em;
          color: var(--igf-orange); margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .pp-cat-label::before { content: ''; width: 20px; height: 1px; background: var(--igf-orange); opacity: 0.5; }
        .pp-title {
          font-family: 'Orbitron', sans-serif;
          font-size: clamp(1.2rem, 2.8vw, 1.9rem);
          font-weight: 900; color: var(--text-primary);
          line-height: 1.25; margin-bottom: 14px;
        }
        .pp-rating-row { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
        .pp-rating-label { font-family: 'DM Sans', sans-serif; font-size: 0.82rem; color: rgba(255,240,234,0.45); }
        .pp-stock-badge {
          font-family: 'Orbitron', sans-serif; font-size: 0.48rem; letter-spacing: 0.14em;
          padding: 4px 12px; border-radius: 20px;
        }
        .pp-desc {
          font-family: 'DM Sans', sans-serif; font-size: 0.92rem;
          color: rgba(255,240,234,0.55); line-height: 1.85;
          margin-bottom: 24px; border-left: 2px solid rgba(255,87,34,0.2);
          padding-left: 16px;
        }
        .pp-price { margin-bottom: 24px; }
        .pp-price-main {
          font-family: 'Orbitron', sans-serif; font-size: 2.2rem;
          font-weight: 900; color: var(--igf-orange);
          text-shadow: 0 0 20px rgba(255,87,34,0.3); line-height: 1;
        }
        .pp-price-old { font-family: 'DM Sans', sans-serif; font-size: 0.92rem; color: rgba(255,240,234,0.25); text-decoration: line-through; margin-right: 8px; }
        .pp-price-off { font-family: 'Orbitron', sans-serif; font-size: 0.58rem; color: #4ade80; background: rgba(74,222,128,0.1); padding: 3px 10px; border-radius: 20px; }
        .pp-price-note { font-family: 'DM Sans', sans-serif; font-size: 0.75rem; color: rgba(255,240,234,0.25); margin-top: 6px; }
        .pp-actions { display: flex; gap: 10px; margin-bottom: 28px; flex-wrap: wrap; }
        .pp-btn-cart {
          flex: 2; min-width: 150px; padding: 14px 20px;
          background: linear-gradient(135deg, var(--igf-red), var(--igf-orange));
          color: #fff; border: none; border-radius: 8px; cursor: pointer;
          font-family: 'Orbitron', sans-serif; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.14em;
          transition: all 0.3s; clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
        }
        .pp-btn-cart:hover { box-shadow: 0 0 30px rgba(255,87,34,0.5); transform: translateY(-1px); }
        .pp-btn-wish {
          flex: 1; min-width: 100px; padding: 14px 16px;
          background: transparent; border-radius: 8px; cursor: pointer;
          font-family: 'Orbitron', sans-serif; font-size: 0.65rem; transition: all 0.25s;
        }
        .pp-btn-buy {
          flex: 2; min-width: 150px; padding: 14px 20px;
          background: transparent; border: 1px solid rgba(255,171,64,0.4);
          color: var(--igf-amber); border-radius: 8px; cursor: pointer;
          font-family: 'Orbitron', sans-serif; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.14em;
          transition: all 0.25s;
        }
        .pp-btn-buy:hover { background: rgba(255,171,64,0.08); border-color: var(--igf-amber); transform: translateY(-1px); }
        /* PIN check */
        .pp-pin { margin-bottom: 24px; }
        .pp-pin-label {
          font-family: 'Orbitron', sans-serif; font-size: 0.48rem; letter-spacing: 0.18em;
          color: rgba(255,240,234,0.35); margin-bottom: 10px; text-transform: uppercase;
        }
        .pp-pin-row { display: flex; gap: 10px; }
        .pp-pin-input {
          flex: 1; padding: 11px 14px;
          background: rgba(255,87,34,0.03); border: 1px solid rgba(255,87,34,0.12);
          border-radius: 7px; color: var(--text-primary);
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem; outline: none;
          transition: border-color 0.25s;
        }
        .pp-pin-input:focus { border-color: rgba(255,87,34,0.4); }
        .pp-pin-btn {
          padding: 11px 18px; background: rgba(255,87,34,0.08);
          border: 1px solid rgba(255,87,34,0.25); color: var(--igf-orange);
          border-radius: 7px; cursor: pointer; font-family: 'Orbitron', sans-serif;
          font-size: 0.52rem; letter-spacing: 0.1em; transition: all 0.25s; white-space: nowrap;
        }
        .pp-pin-btn:hover { background: rgba(255,87,34,0.14); }
        /* Quick specs */
        .pp-quick-specs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .pp-spec-chip {
          background: rgba(255,87,34,0.04); border: 1px solid rgba(255,87,34,0.1);
          border-radius: 8px; padding: 12px 14px;
        }
        .pp-spec-chip-label { font-family: 'Orbitron', sans-serif; font-size: 0.45rem; letter-spacing: 0.14em; color: var(--igf-orange); margin-bottom: 4px; }
        .pp-spec-chip-val { font-family: 'Syne', sans-serif; font-size: 0.84rem; font-weight: 600; color: var(--text-primary); }
        /* Tabs */
        .pp-tabs-section { padding: 0 5% 64px; max-width: 1400px; margin: 0 auto; }
        .pp-tab-bar { display: flex; border-bottom: 1px solid rgba(255,87,34,0.12); margin-bottom: 32px; gap: 0; }
        .pp-tab-btn {
          padding: 14px 28px; background: transparent; cursor: pointer;
          font-family: 'Orbitron', sans-serif; font-size: 0.58rem; letter-spacing: 0.12em;
          text-transform: uppercase; border: none;
          border-bottom: 2px solid transparent;
          color: rgba(255,240,234,0.4); transition: all 0.25s;
        }
        .pp-tab-btn:hover { color: rgba(255,240,234,0.7); }
        .pp-tab-btn.active { border-bottom-color: var(--igf-orange); color: var(--igf-orange); }
        .pp-tab-body { animation: panelIn 0.3s ease both; }
        .pp-desc-text { font-family: 'DM Sans', sans-serif; font-size: 0.92rem; color: rgba(255,240,234,0.55); line-height: 1.9; max-width: 860px; }
        .pp-spec-table { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 10px; max-width: 900px; }
        .pp-spec-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; border-radius: 8px; border: 1px solid rgba(255,87,34,0.08);
          gap: 12px;
        }
        .pp-spec-row:nth-child(odd) { background: rgba(255,87,34,0.03); }
        .pp-spec-key { font-family: 'Orbitron', sans-serif; font-size: 0.48rem; letter-spacing: 0.1em; color: rgba(255,240,234,0.4); }
        .pp-spec-val { font-family: 'Syne', sans-serif; font-size: 0.88rem; font-weight: 600; color: var(--text-primary); text-align: right; }
        .pp-features-list { display: flex; flex-direction: column; gap: 12px; max-width: 700px; }
        .pp-feature {
          display: flex; align-items: flex-start; gap: 12px;
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: rgba(255,240,234,0.6); line-height: 1.6;
        }
        .pp-feature-icon { color: var(--igf-orange); flex-shrink: 0; margin-top: 3px; font-size: 0.8rem; }
        /* Similar products */
        .pp-similar { padding: 0 5% 80px; max-width: 1400px; margin: 0 auto; }
        .pp-similar-header { margin-bottom: 32px; }
        .pp-similar-tag { font-family: 'Orbitron', sans-serif; font-size: 0.52rem; letter-spacing: 0.2em; color: var(--igf-orange); margin-bottom: 8px; }
        .pp-similar-title { font-family: 'Orbitron', sans-serif; font-size: clamp(1.2rem, 3vw, 1.6rem); font-weight: 900; color: var(--text-primary); }
        .pp-similar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .pp-similar-card {
          background: rgba(15,8,5,0.8); border: 1px solid rgba(255,87,34,0.1);
          border-radius: 10px; overflow: hidden; cursor: pointer;
          transition: all 0.35s;
        }
        .pp-similar-card:hover { border-color: rgba(255,87,34,0.35); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
        .pp-similar-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; filter: brightness(0.8); transition: all 0.4s; }
        .pp-similar-card:hover .pp-similar-img { filter: brightness(0.95); transform: scale(1.04); }
        .pp-similar-body { padding: 14px 16px; }
        .pp-similar-cat { font-family: 'Orbitron', sans-serif; font-size: 0.44rem; letter-spacing: 0.14em; color: var(--igf-orange); margin-bottom: 4px; }
        .pp-similar-name { font-family: 'Syne', sans-serif; font-size: 0.88rem; font-weight: 700; color: var(--text-primary); line-height: 1.3; }
        /* Responsive */
        @media (max-width: 900px) {
          .pp-main { grid-template-columns: 1fr; gap: 32px; padding: 32px 5% 48px; }
          .pp-quick-specs { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 520px) {
          .pp-actions { flex-direction: column; }
          .pp-btn-cart, .pp-btn-wish, .pp-btn-buy { flex: none; width: 100%; }
        }
      `}</style>

      <div className="pp-root">
        {/* Breadcrumb */}
        <div className="pp-breadcrumb">
          <Link to="/">HOME</Link>
          <span>›</span>
          <Link to="/#products">PRODUCTS</Link>
          <span>›</span>
          <span className="active">{product.name}</span>
        </div>

        {/* Main product section */}
        <div className="pp-main">
          {/* Image Gallery */}
          <div className="pp-gallery">
            <div className="pp-main-img-wrap">
              <img
                key={activeImg}
                className="pp-main-img"
                src={getImageSrc(galleryImages[activeImg])}
                alt={product.name}
                onError={e => { e.target.src = '/assets/logo2-scaled.png'; }}
              />
              {product.tag && <div className="pp-img-tag">{product.tag.toUpperCase()}</div>}
            </div>
            {galleryImages.length > 1 && (
              <div className="pp-thumb-row">
                {galleryImages.map((img, i) => (
                  <div key={i} className={`pp-thumb${activeImg === i ? ' active' : ''}`} onClick={() => setActiveImg(i)}>
                    <img src={getImageSrc(img)} alt="" onError={e => { e.target.src = '/assets/logo2-scaled.png'; }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="pp-info">
            <div className="pp-cat-label">{product.categoryName || product.category}</div>
            <h1 className="pp-title">{product.name}</h1>
            <div className="pp-rating-row">
              <StarRating />
              <span className="pp-rating-label">Highly Rated</span>
              <span className="pp-stock-badge" style={{ color: stock.color, background: `${stock.color}18`, border: `1px solid ${stock.color}44` }}>
                {stock.label}
              </span>
            </div>
            <p className="pp-desc">{product.shortDesc || product.fullDesc?.slice(0, 220)}</p>

            {/* Price */}
            {product.price > 0 && (
              <div className="pp-price">
                <div className="pp-price-main">{formatPrice(product.price)}</div>
                {product.discountPct > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span className="pp-price-old">{formatPrice(Math.round(product.price / (1 - product.discountPct / 100)))}</span>
                    <span className="pp-price-off">{product.discountPct}% OFF</span>
                  </div>
                )}
                <div className="pp-price-note">* Exclusive of GST. Price may vary based on configuration.</div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pp-actions">
              <button className="pp-btn-cart" onClick={handleAddToCart}>🛒 ADD TO ENQUIRY</button>
              <button
                className="pp-btn-wish"
                onClick={handleWishlist}
                style={{
                  border: `1px solid ${wished ? '#ef4444' : 'rgba(255,87,34,0.25)'}`,
                  color: wished ? '#ef4444' : 'rgba(255,240,234,0.5)',
                  background: wished ? 'rgba(239,68,68,0.08)' : 'transparent',
                }}
              >
                {wished ? '♥ SAVED' : '♡ WISHLIST'}
              </button>
              <button className="pp-btn-buy" onClick={() => navigate('/payment', { state: { product } })}>
                ⚡ BUY NOW
              </button>
            </div>

            {/* PIN check */}
            <div className="pp-pin">
              <div className="pp-pin-label">Check Delivery Availability</div>
              <div className="pp-pin-row">
                <input
                  className="pp-pin-input" type="text"
                  placeholder="Enter 6-digit PIN code"
                  value={pincode}
                  onChange={e => { setPincode(e.target.value.replace(/\D/g,'').slice(0,6)); setPinResult(''); }}
                />
                <button className="pp-pin-btn" onClick={handlePinCheck}>CHECK</button>
              </div>
              {pinResult && (
                <div style={{ marginTop: 8, fontFamily: 'DM Sans,sans-serif', fontSize: '0.82rem', color: pinResult.startsWith('✅') ? '#4ade80' : '#ef4444' }}>
                  {pinResult}
                </div>
              )}
            </div>

            {/* Quick specs */}
            {product.specs?.length > 0 && (
              <div className="pp-quick-specs">
                {product.specs.slice(0, 4).map((spec, i) => (
                  <div key={i} className="pp-spec-chip">
                    <div className="pp-spec-chip-label">{spec.label}</div>
                    <div className="pp-spec-chip-val">{spec.val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="pp-tabs-section">
          <div className="pp-tab-bar">
            {['description', 'specifications', 'features'].map(t => (
              <button key={t} className={`pp-tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
          <div className="pp-tab-body">
            {tab === 'description' && (
              <div className="pp-desc-text">
                {product.fullDesc || product.shortDesc || 'No description available for this product.'}
              </div>
            )}
            {tab === 'specifications' && (
              <div className="pp-spec-table">
                {product.specs?.length > 0 ? product.specs.map((spec, i) => (
                  <div key={i} className="pp-spec-row">
                    <div className="pp-spec-key">{spec.label}</div>
                    <div className="pp-spec-val">{spec.val}</div>
                  </div>
                )) : <div style={{ color: 'rgba(255,240,234,0.35)', fontFamily: 'DM Sans,sans-serif', fontSize: '0.9rem' }}>No specifications available.</div>}
              </div>
            )}
            {tab === 'features' && (
              <div className="pp-features-list">
                {product.features?.length > 0 ? product.features.map((feat, i) => (
                  <div key={i} className="pp-feature">
                    <span className="pp-feature-icon">▸</span>
                    {feat}
                  </div>
                )) : <div style={{ color: 'rgba(255,240,234,0.35)', fontFamily: 'DM Sans,sans-serif', fontSize: '0.9rem' }}>No features listed.</div>}
              </div>
            )}
          </div>
        </div>

        {/* Similar Products */}
        {similar.length > 0 && (
          <div className="pp-similar">
            <div className="pp-similar-header">
              <div className="pp-similar-tag">SIMILAR PRODUCTS</div>
              <h2 className="pp-similar-title">You May Also Like</h2>
            </div>
            <div className="pp-similar-grid">
              {similar.map(prod => (
                <div key={prod.id || prod._id} className="pp-similar-card" onClick={() => navigate(`/products/${prod.id || prod._id}`)}>
                  <img
                    className="pp-similar-img"
                    src={prod.image?.startsWith('http') ? prod.image : `/${prod.image}`}
                    alt={prod.name}
                    onError={e => { e.target.src = '/assets/logo2-scaled.png'; }}
                  />
                  <div className="pp-similar-body">
                    <div className="pp-similar-cat">{prod.categoryName}</div>
                    <div className="pp-similar-name">{prod.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
