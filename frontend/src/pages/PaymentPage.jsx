import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  createRazorpayOrder,
  validateCoupon,
  createOrder,
  confirmUpiPayment,
  verifyPayment,
} from '../services/api';
import { useSite } from '../context/SiteContext';
import { useToast } from '../components/Toast';

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi',
];

// Load Razorpay script dynamically
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function SecureStrip() {
  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(192,57,43,0.1), rgba(255,87,34,0.08), rgba(192,57,43,0.1))',
      borderTop: '1px solid rgba(255,87,34,0.1)', borderBottom: '1px solid rgba(255,87,34,0.1)',
      padding: '8px 5%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 24, flexWrap: 'wrap', marginTop: 72, position: 'relative', zIndex: 1,
    }}>
      {['SSL SECURED', 'POWERED BY RAZORPAY', 'PCI DSS COMPLIANT', 'INSTANT CONFIRMATION'].map((item) => (
        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Orbitron,sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
          {item}
        </div>
      ))}
    </div>
  );
}

function SuccessScreen({ data, onReset }) {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5%', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: 24, filter: 'drop-shadow(0 0 20px rgba(74,222,128,0.6))' }}>✅</div>
      <h1 style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: '#4ade80', marginBottom: 12 }}>PAYMENT INITIATED</h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: 500, lineHeight: 1.8, marginBottom: 32 }}>
        Your order has been placed. You will receive confirmation shortly.
      </p>
      <div style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, padding: '24px 32px', marginBottom: 32, minWidth: 280 }}>
        <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(74,222,128,0.6)', marginBottom: 8 }}>ORDER ID</div>
        <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '1.1rem', color: '#4ade80', letterSpacing: '0.1em' }}>{data.orderId}</div>
        {data.amount && (
          <>
            <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(74,222,128,0.6)', marginBottom: 8, marginTop: 16 }}>AMOUNT</div>
            <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '1rem', color: '#fff0ea' }}>₹{data.amount.toLocaleString('en-IN')}</div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/order-tracking" className="btn-primary">📦 TRACK ORDER</Link>
        <button onClick={onReset} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid rgba(255,87,34,0.3)', color: 'var(--text-muted)', borderRadius: 8, cursor: 'pointer', fontFamily: 'Orbitron,sans-serif', fontSize: '0.65rem', letterSpacing: '0.12em' }}>
          MAKE ANOTHER PAYMENT
        </button>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  const location = useLocation();
  const productState = location.state?.product;
  const { settings } = useSite();
  const { showToast } = useToast();

  const presets = settings?.payment?.presetAmounts || [
    { amount: 500, label: '₹500' },
    { amount: 1000, label: '₹1,000' },
    { amount: 2500, label: '₹2,500' },
    { amount: 5000, label: '₹5,000' },
    { amount: 10000, label: '₹10,000' },
  ];

  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', pan: '', aadhaar: '', city: '', pinCode: '', state: '', message: '' });
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUpi, setShowUpi] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState({});
  const [utr, setUtr] = useState('');
  const [utrLoading, setUtrLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('razorpay'); // 'razorpay' | 'upi'

  useEffect(() => {
    if (productState) {
      setForm((f) => ({ ...f, message: `Interested in: ${productState.name}` }));
    }
  }, []);

  const getBaseAmount = () => selectedAmount || parseFloat(customAmount) || 0;
  const getAmount = () => {
    const base = getBaseAmount();
    if (!couponApplied) return base;
    return Math.round(base * (1 - couponApplied.discount / 100));
  };
  const getDiscountAmt = () => {
    const base = getBaseAmount();
    return couponApplied ? Math.round(base * couponApplied.discount / 100) : 0;
  };

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return showToast('Please enter a coupon code', 'warning');
    setCouponLoading(true);
    try {
      const res = await validateCoupon(coupon);
      setCouponApplied(res.data);
      showToast(res.data.message, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid coupon code', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const validate = useCallback(() => {
    if (!getAmount()) { showToast('Please select or enter an amount', 'warning'); return false; }
    if (getAmount() < 1) { showToast('Minimum payment amount is ₹1', 'warning'); return false; }
    if (!form.name.trim()) { showToast('Please enter your full name', 'warning'); return false; }
    if (!form.email.trim()) { showToast('Please enter your email address', 'warning'); return false; }
    if (!form.phone.trim()) { showToast('Please enter your phone number', 'warning'); return false; }
    return true;
  }, [form, selectedAmount, customAmount, couponApplied]);

  const buildOrderPayload = (paymentMethod, ref) => ({
    customer: form,
    product: productState
      ? { id: productState.id, name: productState.name, image: productState.image, category: productState.categoryName || productState.category }
      : {},
    amount: getAmount(),
    discountAmount: getDiscountAmt(),
    couponCode: couponApplied?.code || '',
    paymentMethod,
    paymentStatus: paymentMethod === 'razorpay' ? 'paid' : 'pending',
    razorpayOrderId: ref || '',
    status: 'confirmed',
  });

  // Razorpay payment flow
  const handleRazorpayPay = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast('Failed to load Razorpay. Please check your internet connection.', 'error');
        setLoading(false);
        return;
      }

      const rzpRes = await createRazorpayOrder(getAmount());
      const { order: rzpOrder, key, mock } = rzpRes.data;

      if (mock) {
        // Mock mode — simulate success
        const orderRes = await createOrder(buildOrderPayload('razorpay', rzpOrder.id));
        setSuccessData({ orderId: orderRes.data.order.orderId, amount: getAmount() });
        setShowSuccess(true);
        showToast('Payment successful! (Test mode)', 'success');
        setLoading(false);
        return;
      }

      const options = {
        key,
        amount: rzpOrder.amount,
        currency: 'INR',
        name: settings?.payment?.businessName || 'Indian Game Factory',
        description: productState ? `Payment for ${productState.name}` : 'Indian Game Factory Payment',
        order_id: rzpOrder.id,
        handler: async (response) => {
          try {
            // Create order in DB
            const orderRes = await createOrder(buildOrderPayload('razorpay', rzpOrder.id));
            const orderId = orderRes.data.order.orderId;

            // Verify signature
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });

            setSuccessData({ orderId, amount: getAmount() });
            setShowSuccess(true);
            showToast('Payment verified successfully!', 'success');
          } catch (err) {
            showToast('Payment received but verification failed. Contact support.', 'warning');
          }
        },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#ff5722' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            showToast('Payment cancelled', 'info');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to initiate payment. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // UPI payment flow
  const handleUpiOrder = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const orderRes = await createOrder(buildOrderPayload('upi', ''));
      setSuccessData({ orderId: orderRes.data.order.orderId, amount: getAmount() });
      setShowUpi(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create order. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUtrSubmit = async () => {
    if (!utr.trim() || utr.trim().length < 10) {
      showToast('Please enter a valid UTR number (min 10 characters)', 'warning');
      return;
    }
    setUtrLoading(true);
    try {
      await confirmUpiPayment({ orderId: successData.orderId, utrNumber: utr.trim() });
      setShowSuccess(true);
      setShowUpi(false);
      showToast('UTR submitted! Your payment will be verified within 2–4 hours.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit UTR. Please try again.', 'error');
    } finally {
      setUtrLoading(false);
    }
  };

  if (showSuccess) {
    return <SuccessScreen data={successData} onReset={() => { setShowSuccess(false); setSelectedAmount(null); setCustomAmount(''); setCouponApplied(null); setForm({ name: '', email: '', phone: '', pan: '', aadhaar: '', city: '', pinCode: '', state: '', message: '' }); }} />;
  }

  const inputStyle = { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,87,34,0.15)', borderRadius: 8, color: '#fff0ea', fontFamily: 'DM Sans,sans-serif', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };
  const focusInput = (e) => { e.target.style.borderColor = '#ff5722'; };
  const blurInput = (e) => { e.target.style.borderColor = 'rgba(255,87,34,0.15)'; };

  return (
    <>
      <SecureStrip />

      <div style={{ padding: '60px 5%', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--igf-orange)', marginBottom: 8 }}>
            SECURE PAYMENT PORTAL
          </div>
          <h1 style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: 'var(--text-primary)', margin: 0 }}>
            Complete Your <span style={{ color: 'var(--igf-orange)' }}>Payment</span>
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(280px, 380px)', gap: 32, alignItems: 'start' }}>
          {/* LEFT — Main form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Amount Selection */}
            <div style={{ background: 'rgba(255,87,34,0.03)', border: '1px solid rgba(255,87,34,0.12)', borderRadius: 14, padding: '28px' }}>
              <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.62rem', letterSpacing: '0.18em', color: 'var(--igf-orange)', marginBottom: 20 }}>
                SELECT AMOUNT
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {presets.map((p) => (
                  <button
                    key={p.amount}
                    onClick={() => { setSelectedAmount(p.amount); setCustomAmount(''); }}
                    style={{
                      padding: '10px 20px', borderRadius: 8, fontFamily: 'Orbitron,sans-serif', fontSize: '0.65rem', fontWeight: 700,
                      border: selectedAmount === p.amount ? '1px solid var(--igf-orange)' : '1px solid rgba(255,87,34,0.2)',
                      background: selectedAmount === p.amount ? 'rgba(255,87,34,0.15)' : 'transparent',
                      color: selectedAmount === p.amount ? 'var(--igf-orange)' : 'var(--text-muted)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '1rem', color: 'var(--text-muted)', flexShrink: 0 }}>₹</span>
                <input
                  type="number"
                  placeholder="Enter custom amount"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  style={{ ...inputStyle, flex: 1 }}
                  min="1"
                  onFocus={focusInput} onBlur={blurInput}
                />
              </div>

              {/* Coupon */}
              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Coupon code (e.g. IGF10)"
                  value={coupon}
                  onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponApplied(null); }}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={focusInput} onBlur={blurInput}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                  style={{ padding: '12px 20px', background: 'rgba(255,87,34,0.1)', border: '1px solid rgba(255,87,34,0.3)', color: 'var(--igf-orange)', borderRadius: 8, cursor: 'pointer', fontFamily: 'Orbitron,sans-serif', fontSize: '0.58rem', letterSpacing: '0.1em', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                >
                  {couponLoading ? '...' : 'APPLY'}
                </button>
              </div>
              {couponApplied && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, fontFamily: 'DM Sans,sans-serif', fontSize: '0.84rem', color: '#4ade80' }}>
                  ✅ {couponApplied.discount}% discount applied! You save ₹{getDiscountAmt().toLocaleString('en-IN')}
                </div>
              )}
            </div>

            {/* Personal Details */}
            <div style={{ background: 'rgba(255,87,34,0.03)', border: '1px solid rgba(255,87,34,0.12)', borderRadius: 14, padding: '28px' }}>
              <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.62rem', letterSpacing: '0.18em', color: 'var(--igf-orange)', marginBottom: 20 }}>
                PERSONAL DETAILS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'FULL NAME *', key: 'name', type: 'text', placeholder: 'Your full name', required: true },
                  { label: 'PHONE *', key: 'phone', type: 'tel', placeholder: '+91 98765 43210', required: true },
                  { label: 'EMAIL *', key: 'email', type: 'email', placeholder: 'you@company.com', required: true },
                  { label: 'CITY', key: 'city', type: 'text', placeholder: 'Your city', required: false },
                  { label: 'PIN CODE', key: 'pinCode', type: 'text', placeholder: '110001', required: false },
                  { label: 'PAN (OPTIONAL)', key: 'pan', type: 'text', placeholder: 'ABCDE1234F', required: false },
                ].map(({ label, key, type, placeholder, required }) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'rgba(255,240,234,0.45)' }}>{label}</label>
                    <input
                      required={required}
                      type={type}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      style={inputStyle}
                      onFocus={focusInput} onBlur={blurInput}
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'rgba(255,240,234,0.45)' }}>STATE</label>
                  <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} style={{ ...inputStyle }}>
                    <option value="">Select State</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'rgba(255,240,234,0.45)' }}>MESSAGE / NOTES</label>
                  <textarea
                    placeholder={productState ? `Interested in: ${productState.name}` : 'Any notes or specific requirements...'}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                    onFocus={focusInput} onBlur={blurInput}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div style={{ background: 'rgba(255,87,34,0.03)', border: '1px solid rgba(255,87,34,0.12)', borderRadius: 14, padding: '28px' }}>
              <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.62rem', letterSpacing: '0.18em', color: 'var(--igf-orange)', marginBottom: 20 }}>
                PAYMENT METHOD
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                {[
                  { key: 'razorpay', label: '⚡ Razorpay / Card / UPI' },
                  { key: 'upi', label: '📱 Direct UPI / QR' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      flex: 1, padding: '12px', fontFamily: 'Syne,sans-serif', fontSize: '0.84rem', fontWeight: 600,
                      border: activeTab === tab.key ? '1px solid var(--igf-orange)' : '1px solid rgba(255,87,34,0.15)',
                      borderRadius: 8,
                      background: activeTab === tab.key ? 'rgba(255,87,34,0.12)' : 'transparent',
                      color: activeTab === tab.key ? 'var(--igf-orange)' : 'var(--text-muted)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'razorpay' && (
                <div>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.7 }}>
                    Pay securely via Razorpay — supports Credit/Debit Cards, Net Banking, UPI, Wallets, and EMI.
                  </p>
                  <button
                    onClick={handleRazorpayPay}
                    disabled={loading}
                    style={{
                      width: '100%', padding: '16px', background: loading ? 'rgba(255,87,34,0.4)' : 'var(--igf-orange)',
                      color: '#0d0705', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: 'Orbitron,sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em',
                      transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {loading ? 'PROCESSING...' : `⚡ PAY ₹${getAmount().toLocaleString('en-IN')} VIA RAZORPAY`}
                  </button>
                </div>
              )}

              {activeTab === 'upi' && !showUpi && (
                <div>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap' }}>
                    <div>
                      <img
                        src={`/${settings?.payment?.qrPath || 'assets/upi-qr.png'}`}
                        alt="UPI QR Code"
                        style={{ width: 160, height: 160, objectFit: 'contain', background: '#fff', padding: 8, borderRadius: 10 }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'var(--igf-orange)', marginBottom: 8 }}>UPI ID</div>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, wordBreak: 'break-all' }}>
                        {settings?.payment?.upiId || '9262260376@ptsbi'}
                      </div>
                      <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'var(--igf-orange)', marginBottom: 8 }}>AMOUNT TO PAY</div>
                      <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '1.4rem', fontWeight: 900, color: '#ffab40' }}>
                        ₹{getAmount().toLocaleString('en-IN')}
                      </div>
                      <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.7 }}>
                        Scan QR or pay via UPI ID. After payment, enter your UTR/transaction number below.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleUpiOrder}
                    disabled={loading}
                    style={{
                      width: '100%', padding: '14px', background: 'rgba(255,171,64,0.1)',
                      border: '1px solid rgba(255,171,64,0.4)', color: '#ffab40',
                      borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: 'Orbitron,sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em',
                      transition: 'all 0.2s',
                    }}
                  >
                    {loading ? 'PLACING ORDER...' : '📱 I HAVE PAID — ENTER UTR'}
                  </button>
                </div>
              )}

              {activeTab === 'upi' && showUpi && (
                <div style={{ padding: '20px 0' }}>
                  <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: '#4ade80', marginBottom: 8 }}>
                    ✅ ORDER PLACED — ID: {successData.orderId}
                  </div>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.7 }}>
                    Please enter the UTR / Transaction Reference Number from your UPI app for quick verification.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      type="text"
                      placeholder="UTR / Transaction Reference No."
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                      onFocus={focusInput} onBlur={blurInput}
                    />
                    <button
                      onClick={handleUtrSubmit}
                      disabled={utrLoading}
                      style={{ padding: '12px 20px', background: '#4ade80', color: '#0d0705', border: 'none', borderRadius: 8, cursor: utrLoading ? 'not-allowed' : 'pointer', fontFamily: 'Orbitron,sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}
                    >
                      {utrLoading ? '...' : 'SUBMIT'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Order Summary */}
          <div style={{ background: 'rgba(255,87,34,0.03)', border: '1px solid rgba(255,87,34,0.12)', borderRadius: 14, padding: '28px', position: 'sticky', top: 90 }}>
            <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.62rem', letterSpacing: '0.18em', color: 'var(--igf-orange)', marginBottom: 20 }}>
              ORDER SUMMARY
            </div>

            {productState && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, padding: '14px', background: 'rgba(255,87,34,0.06)', borderRadius: 10 }}>
                <img
                  src={productState.image?.startsWith('http') ? productState.image : `/${productState.image}`}
                  alt={productState.name}
                  style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                  onError={(e) => { e.target.src = '/assets/logo2-scaled.png'; }}
                />
                <div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{productState.name}</div>
                  <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '0.5rem', letterSpacing: '0.12em', color: 'var(--igf-orange)', marginTop: 2 }}>{productState.categoryName || productState.category}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Sans,sans-serif', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span>₹{getBaseAmount().toLocaleString('en-IN') || '—'}</span>
              </div>
              {couponApplied && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Sans,sans-serif', fontSize: '0.86rem', color: '#4ade80' }}>
                  <span>Discount ({couponApplied.code})</span>
                  <span>-₹{getDiscountAmt().toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ height: 1, background: 'rgba(255,87,34,0.1)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Orbitron,sans-serif', fontSize: '1rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--text-primary)' }}>Total</span>
                <span style={{ color: 'var(--igf-orange)' }}>₹{getAmount().toLocaleString('en-IN') || '—'}</span>
              </div>
            </div>

            {/* Trust badges */}
            <div style={{ borderTop: '1px solid rgba(255,87,34,0.1)', paddingTop: 20 }}>
              {[
                { icon: '🔒', text: '256-bit SSL Encryption' },
                { icon: '⚡', text: 'Powered by Razorpay' },
                { icon: '🇮🇳', text: 'RBI Compliant' },
                { icon: '📞', text: settings?.payment?.contactPhone || '+91 92622 60376' },
              ].map((b) => (
                <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontFamily: 'DM Sans,sans-serif', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>

            <Link to="/order-tracking" style={{ display: 'block', marginTop: 16, textAlign: 'center', fontFamily: 'Orbitron,sans-serif', fontSize: '0.55rem', letterSpacing: '0.12em', color: 'var(--igf-amber)', textDecoration: 'none', padding: '10px', border: '1px solid rgba(255,171,64,0.2)', borderRadius: 8, transition: 'all 0.2s' }}>
              📦 TRACK EXISTING ORDER
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
