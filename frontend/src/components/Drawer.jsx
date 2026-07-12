import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNavigate } from 'react-router-dom';

export default function Drawer({ type, open, onClose }) {
  const { cart, removeFromCart } = useCart();
  const { wishlist, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();

  const items = type === 'cart' ? cart : wishlist;
  const title = type === 'cart' ? '🛒 ENQUIRY CART' : '♥ WISHLIST';

  const removeItem = (id) => {
    if (type === 'cart') removeFromCart(id);
    else removeFromWishlist(id);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 15000,
          background: 'rgba(0,0,0,0.7)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 0.3s',
          backdropFilter: open ? 'blur(4px)' : 'none',
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 15001,
          width: 'min(400px, 95vw)',
          background: 'linear-gradient(180deg, #170b07 0%, #0d0705 100%)',
          borderLeft: '1px solid rgba(255,87,34,0.2)',
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.23,1,0.32,1)',
          boxShadow: open ? '-20px 0 60px rgba(0,0,0,0.5)' : 'none',
        }}
        role="dialog"
        aria-label={title}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,87,34,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.72rem', letterSpacing: '0.15em', color: 'var(--igf-orange)' }}>{title}</div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid rgba(255,87,34,0.2)',
              color: 'var(--text-muted)', width: 34, height: 34, borderRadius: '50%',
              cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            aria-label="Close"
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--igf-orange)'; e.currentTarget.style.color = 'var(--igf-orange)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,87,34,0.2)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.3 }}>{type === 'cart' ? '🛒' : '♥'}</div>
              <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.62rem', letterSpacing: '0.1em' }}>
                {type === 'cart' ? 'YOUR CART IS EMPTY' : 'YOUR WISHLIST IS EMPTY'}
              </div>
              <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.82rem', marginTop: 12, lineHeight: 1.6 }}>
                Browse our products and add items here
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId || item._id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 0', borderBottom: '1px solid rgba(255,87,34,0.06)',
                }}
              >
                <img
                  src={item.productImage || item.image || '/assets/logo2-scaled.png'}
                  alt={item.productName || item.name}
                  style={{
                    width: 62, height: 62, objectFit: 'cover', borderRadius: 6,
                    background: 'rgba(255,87,34,0.05)', border: '1px solid rgba(255,87,34,0.1)',
                    flexShrink: 0,
                  }}
                  onError={(e) => { e.target.src = '/assets/logo2-scaled.png'; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.productName || item.name}
                  </div>
                  <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.5rem', letterSpacing: '0.12em', color: 'var(--igf-orange)' }}>
                    {item.category}
                  </div>
                  {item.quantity && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>Qty: {item.quantity}</div>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.productId || item._id)}
                  style={{
                    background: 'transparent', border: '1px solid rgba(255,87,34,0.15)',
                    color: 'var(--text-muted)', width: 28, height: 28, borderRadius: '50%',
                    cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.2s',
                  }}
                  aria-label="Remove"
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,87,34,0.15)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Action */}
        {items.length > 0 && type === 'cart' && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,87,34,0.12)', flexShrink: 0 }}>
            <button
              onClick={() => { onClose(); navigate('/payment'); }}
              style={{
                display: 'block', width: '100%', padding: 14,
                background: 'var(--igf-orange)', color: '#0d0705',
                fontFamily: 'Orbitron,sans-serif', fontSize: '0.65rem', letterSpacing: '0.12em',
                textAlign: 'center', border: 'none', cursor: 'pointer', borderRadius: 8,
                fontWeight: 700, transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e64a19'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--igf-orange)'; }}
            >
              PROCEED TO PAYMENT →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
