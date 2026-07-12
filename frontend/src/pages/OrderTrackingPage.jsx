import { useState } from 'react';
import { trackOrder, cancelOrder } from '../services/api';
import { useToast } from '../components/Toast';
import { Link } from 'react-router-dom';

const STATUS_STEPS = ['confirmed', 'processing', 'dispatched', 'in-transit', 'delivered'];

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', color: '#60a5fa', icon: '✓' },
  processing: { label: 'Processing', color: '#a78bfa', icon: '⚙' },
  dispatched: { label: 'Dispatched', color: '#fbbf24', icon: '📦' },
  'in-transit': { label: 'In Transit', color: '#fb923c', icon: '🚚' },
  delivered: { label: 'Delivered', color: '#4ade80', icon: '🎉' },
  cancelled: { label: 'Cancelled', color: '#ef4444', icon: '✕' },
};

export default function OrderTrackingPage() {
  const { showToast } = useToast();
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) { setError('Please enter an Order ID'); return; }
    setLoading(true); setError(''); setOrder(null);
    try {
      const res = await trackOrder(orderId.trim().toUpperCase());
      setOrder(res.data.order);
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found. Please check the Order ID.');
    } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!order) return;
    if (!window.confirm('Are you sure you want to request cancellation?')) return;
    setCancelLoading(true);
    try {
      await cancelOrder(order.orderId);
      showToast('Cancellation request submitted. We will contact you within 24 hours.', 'success');
      setOrder(prev => ({ ...prev, cancelRequested: true }));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit cancellation request', 'error');
    } finally { setCancelLoading(false); }
  };

  const activeStepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const cfg = order ? (STATUS_CONFIG[order.status] || { label: order.status, color: '#9ca3af', icon: '?' }) : null;

  return (
    <>
      <style>{`
        .ot-root { padding-top: 70px; min-height: 100vh; }
        .ot-hero {
          padding: 70px 5% 48px; text-align: center;
          background: linear-gradient(to bottom, rgba(255,87,34,0.04), transparent);
          border-bottom: 1px solid rgba(255,87,34,0.08);
          position: relative; overflow: hidden;
        }
        .ot-hero::before {
          content: '';
          position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
          width: 400px; height: 200px;
          background: radial-gradient(ellipse, rgba(255,87,34,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .ot-tag {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Orbitron', sans-serif; font-size: 0.55rem; letter-spacing: 0.3em;
          color: var(--igf-orange); text-transform: uppercase; margin-bottom: 14px;
        }
        .ot-tag::before { content: ''; width: 4px; height: 4px; border-radius: 50%; background: var(--igf-orange); box-shadow: 0 0 8px var(--igf-orange); }
        .ot-title {
          font-family: 'Orbitron', sans-serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 900;
          color: var(--text-primary); margin-bottom: 14px; line-height: 1.1;
        }
        .ot-title span { background: linear-gradient(90deg, #ff5722, #ffab40); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .ot-subtitle { font-family: 'DM Sans', sans-serif; font-size: 0.95rem; color: rgba(255,240,234,0.45); max-width: 480px; margin: 0 auto; line-height: 1.6; }
        /* Search form */
        .ot-search-wrap { max-width: 700px; margin: 0 auto; padding: 40px 5%; }
        .ot-form { display: flex; gap: 12px; }
        .ot-input {
          flex: 1; padding: 15px 18px;
          background: rgba(255,87,34,0.03); border: 1px solid rgba(255,87,34,0.18);
          border-radius: 8px; color: var(--text-primary);
          font-family: 'Orbitron', sans-serif; font-size: 0.72rem; letter-spacing: 0.08em;
          outline: none; transition: border-color 0.3s, box-shadow 0.3s;
        }
        .ot-input:focus { border-color: var(--igf-orange); box-shadow: 0 0 0 3px rgba(255,87,34,0.08); }
        .ot-input::placeholder { color: rgba(255,240,234,0.2); font-size: 0.62rem; letter-spacing: 0.05em; }
        .ot-submit {
          padding: 15px 28px; background: linear-gradient(135deg, var(--igf-red), var(--igf-orange));
          color: #fff; border: none; border-radius: 8px; cursor: pointer;
          font-family: 'Orbitron', sans-serif; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.15em;
          white-space: nowrap; transition: all 0.3s;
          clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px));
        }
        .ot-submit:hover { box-shadow: 0 0 30px rgba(255,87,34,0.4); transform: translateY(-1px); }
        .ot-submit:disabled { opacity: 0.6; transform: none; cursor: not-allowed; }
        .ot-error { padding: 14px 18px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.22); border-radius: 8px; font-family: 'DM Sans',sans-serif; font-size: 0.88rem; color: #ef4444; margin-top: 14px; }
        /* Result section */
        .ot-result { max-width: 860px; margin: 0 auto; padding: 0 5% 80px; display: flex; flex-direction: column; gap: 20px; }
        /* Order header card */
        .ot-card {
          background: rgba(15,8,5,0.85); border: 1px solid rgba(255,87,34,0.14);
          border-radius: 14px; padding: 28px; position: relative; overflow: hidden;
        }
        .ot-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,87,34,0.35), transparent); }
        .ot-order-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
        .ot-order-id-label { font-family: 'Orbitron', sans-serif; font-size: 0.46rem; letter-spacing: 0.18em; color: rgba(255,240,234,0.35); margin-bottom: 5px; }
        .ot-order-id-val { font-family: 'Orbitron', sans-serif; font-size: 1.2rem; color: var(--igf-orange); letter-spacing: 0.08em; }
        .ot-status-pill {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Orbitron', sans-serif; font-size: 0.55rem; letter-spacing: 0.15em;
          padding: 8px 16px; border-radius: 20px;
        }
        .ot-status-dot { width: 7px; height: 7px; border-radius: 50%; }
        .ot-details-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px,1fr)); gap: 18px; }
        .ot-detail { }
        .ot-detail-key { font-family: 'Orbitron', sans-serif; font-size: 0.44rem; letter-spacing: 0.14em; color: rgba(255,240,234,0.3); margin-bottom: 5px; }
        .ot-detail-val { font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
        /* Timeline */
        .ot-timeline-title { font-family: 'Orbitron', sans-serif; font-size: 0.55rem; letter-spacing: 0.22em; color: var(--igf-orange); margin-bottom: 32px; display: flex; align-items: center; gap: 10px; }
        .ot-timeline-title::after { content: ''; flex: 1; height: 1px; background: rgba(255,87,34,0.12); }
        .ot-timeline { position: relative; display: flex; flex-direction: column; gap: 28px; padding-left: 52px; }
        .ot-timeline-line-bg { position: absolute; left: 16px; top: 16px; bottom: 16px; width: 2px; background: rgba(255,87,34,0.1); border-radius: 1px; }
        .ot-timeline-line-fill { position: absolute; left: 16px; top: 16px; width: 2px; background: linear-gradient(to bottom, var(--igf-orange), var(--igf-red)); border-radius: 1px; transition: height 1s ease; box-shadow: 0 0 8px rgba(255,87,34,0.4); }
        .ot-step { position: relative; }
        .ot-step-dot {
          position: absolute; left: -44px; top: 2px;
          width: 20px; height: 20px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.5rem; font-weight: 700; transition: all 0.3s;
        }
        .ot-step-title { font-family: 'Orbitron', sans-serif; font-size: 0.65rem; letter-spacing: 0.1em; margin-bottom: 4px; transition: color 0.3s; }
        .ot-step-desc { font-family: 'DM Sans', sans-serif; font-size: 0.83rem; color: rgba(255,240,234,0.45); line-height: 1.5; }
        .ot-step-date { font-family: 'Orbitron', sans-serif; font-size: 0.5rem; letter-spacing: 0.1em; color: var(--igf-amber); margin-top: 4px; }
        /* Product card */
        .ot-product-card { display: flex; gap: 18px; align-items: center; }
        .ot-product-img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,87,34,0.15); flex-shrink: 0; }
        .ot-product-cat { font-family: 'Orbitron', sans-serif; font-size: 0.46rem; letter-spacing: 0.14em; color: var(--igf-orange); margin-bottom: 5px; }
        .ot-product-name { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: var(--text-primary); }
        /* Cancel warning */
        .ot-cancel-warning { padding: 12px 16px; background: rgba(251,191,36,0.07); border: 1px solid rgba(251,191,36,0.18); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.84rem; color: #fbbf24; margin-top: 16px; }
        .ot-cancel-btn {
          padding: 12px 24px; background: transparent; border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444; border-radius: 8px; cursor: pointer;
          font-family: 'Orbitron', sans-serif; font-size: 0.58rem; letter-spacing: 0.12em;
          transition: all 0.25s;
        }
        .ot-cancel-btn:hover { background: rgba(239,68,68,0.08); border-color: #ef4444; }
        .ot-cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        /* Quick links */
        .ot-quick-links {
          display: flex; gap: 16px; flex-wrap: wrap;
          padding: 0 5% 48px; max-width: 860px; margin: 0 auto;
        }
        .ot-quick-link {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 18px; border: 1px solid rgba(255,87,34,0.15);
          border-radius: 8px; text-decoration: none;
          font-family: 'Orbitron', sans-serif; font-size: 0.52rem; letter-spacing: 0.12em;
          color: rgba(255,240,234,0.55); transition: all 0.25s;
          background: rgba(255,87,34,0.02);
        }
        .ot-quick-link:hover { border-color: var(--igf-orange); color: var(--igf-orange); background: rgba(255,87,34,0.06); }
        @media (max-width: 600px) {
          .ot-form { flex-direction: column; }
          .ot-details-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="ot-root">
        {/* Hero header */}
        <div className="ot-hero">
          <div className="ot-tag">Order Management</div>
          <h1 className="ot-title">Track Your <span>Order</span></h1>
          <p className="ot-subtitle">Enter your Order ID to get real-time updates on your shipment status and delivery timeline.</p>
        </div>

        {/* Search form */}
        <div className="ot-search-wrap">
          <form className="ot-form" onSubmit={handleTrack}>
            <input
              className="ot-input" type="text"
              placeholder="Enter Order ID (e.g. IGF-2026-12345)"
              value={orderId}
              onChange={e => { setOrderId(e.target.value.toUpperCase()); setError(''); }}
            />
            <button className="ot-submit" type="submit" disabled={loading}>
              {loading ? '⟳ SEARCHING...' : '🔍 TRACK ORDER'}
            </button>
          </form>
          {error && <div className="ot-error">⚠ {error}</div>}
        </div>

        {/* Quick links when no order */}
        {!order && !loading && (
          <div className="ot-quick-links">
            <Link to="/" className="ot-quick-link">🏠 BACK TO HOME</Link>
            <Link to="/#contact" className="ot-quick-link">📞 CONTACT SUPPORT</Link>
            <Link to="/payment" className="ot-quick-link">⚡ MAKE PAYMENT</Link>
          </div>
        )}

        {/* Order results */}
        {order && (
          <div className="ot-result">
            {/* Order Header */}
            <div className="ot-card">
              <div className="ot-order-header">
                <div>
                  <div className="ot-order-id-label">ORDER ID</div>
                  <div className="ot-order-id-val">{order.orderId}</div>
                </div>
                <div className="ot-status-pill" style={{ color: cfg.color, background: `${cfg.color}14`, border: `1px solid ${cfg.color}33` }}>
                  <span className="ot-status-dot" style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />
                  {cfg.label.toUpperCase()}
                </div>
              </div>
              <div className="ot-details-grid">
                {[
                  { label: 'CUSTOMER', value: order.customer?.name || '—' },
                  { label: 'PHONE', value: order.customer?.phone || '—' },
                  { label: 'TRACKING NO.', value: order.trackingNumber || '—' },
                  { label: 'ETA', value: order.eta ? new Date(order.eta).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '5–7 days' },
                  { label: 'AMOUNT', value: `₹${(order.amount||0).toLocaleString('en-IN')}` },
                  { label: 'PAYMENT', value: (order.paymentStatus || 'pending').toUpperCase() },
                ].map(item => (
                  <div key={item.label} className="ot-detail">
                    <div className="ot-detail-key">{item.label}</div>
                    <div className="ot-detail-val">{item.value}</div>
                  </div>
                ))}
              </div>
              {order.cancelRequested && (
                <div className="ot-cancel-warning">⚠️ Cancellation requested. Our team will contact you within 24 hours.</div>
              )}
            </div>

            {/* Timeline */}
            {order.status !== 'cancelled' && (
              <div className="ot-card">
                <div className="ot-timeline-title">DELIVERY TIMELINE</div>
                <div className="ot-timeline">
                  <div className="ot-timeline-line-bg" />
                  <div className="ot-timeline-line-fill" style={{ height: `calc(${Math.max(0, activeStepIndex / (STATUS_STEPS.length - 1)) * 100}% - 0px)` }} />
                  {(order.timeline || STATUS_STEPS.map((s, i) => ({
                    title: s.charAt(0).toUpperCase() + s.slice(1),
                    desc: '',
                    date: '',
                    status: i < activeStepIndex ? 'done' : i === activeStepIndex ? 'active' : 'pending',
                  }))).map((step, i) => {
                    const isDone = step.status === 'done';
                    const isActive = step.status === 'active';
                    const stepCfg = STATUS_CONFIG[STATUS_STEPS[i]] || {};
                    return (
                      <div key={i} className="ot-step">
                        <div className="ot-step-dot" style={{
                          background: isActive ? 'var(--igf-orange)' : isDone ? 'rgba(255,87,34,0.5)' : 'rgba(15,8,5,0.9)',
                          border: `2px solid ${isActive || isDone ? 'var(--igf-orange)' : 'rgba(255,87,34,0.2)'}`,
                          boxShadow: isActive ? '0 0 16px rgba(255,87,34,0.6)' : 'none',
                          color: '#fff',
                        }}>
                          {isDone ? '✓' : isActive ? '' : ''}
                          {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'block' }} />}
                        </div>
                        <div className="ot-step-title" style={{ color: isActive ? 'var(--igf-orange)' : isDone ? 'var(--text-primary)' : 'rgba(255,240,234,0.25)' }}>
                          {step.title}
                        </div>
                        {step.desc && <div className="ot-step-desc">{step.desc}</div>}
                        {step.date && <div className="ot-step-date">{step.date}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Product info */}
            {order.product?.name && (
              <div className="ot-card">
                <div className="ot-timeline-title">ORDER ITEM</div>
                <div className="ot-product-card">
                  {order.product.image && (
                    <img
                      className="ot-product-img"
                      src={order.product.image?.startsWith('http') ? order.product.image : `/${order.product.image}`}
                      alt={order.product.name}
                      onError={e => { e.target.src = '/assets/logo2-scaled.png'; }}
                    />
                  )}
                  <div>
                    <div className="ot-product-cat">{order.product.category}</div>
                    <div className="ot-product-name">{order.product.name}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Cancel action */}
            {!order.cancelRequested && order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="ot-cancel-btn" onClick={handleCancel} disabled={cancelLoading}>
                  {cancelLoading ? '⟳ PROCESSING...' : 'REQUEST CANCELLATION'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
