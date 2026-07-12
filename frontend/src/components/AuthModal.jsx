import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export default function AuthModal({ open, onClose }) {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
        showToast('Welcome back!', 'success');
      } else {
        await register({ name: form.name, email: form.email, password: form.password, phone: form.phone });
        showToast('Account created successfully!', 'success');
      }
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,87,34,0.2)',
    borderRadius: 8,
    color: '#fff0ea',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#120905',
          border: '1px solid rgba(255,87,34,0.2)',
          borderRadius: 16,
          padding: '40px 36px',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,87,34,0.08)',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'rgba(255,240,234,0.4)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}
          aria-label="Close"
        >
          ×
        </button>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '1.1rem', color: '#ff5722', marginBottom: 4 }}>
            INDIAN GAME FACTORY
          </div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', color: 'rgba(255,240,234,0.4)', letterSpacing: '0.2em' }}>
            SECURE ACCOUNT
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 28, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,87,34,0.15)' }}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '10px 0', fontFamily: 'Orbitron, sans-serif',
                fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: mode === m ? 'rgba(255,87,34,0.15)' : 'transparent',
                color: mode === m ? '#ff5722' : 'rgba(255,240,234,0.4)',
                borderBottom: mode === m ? '2px solid #ff5722' : '2px solid transparent',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <>
              <div>
                <label style={{ display: 'block', fontFamily: 'Orbitron, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(255,240,234,0.5)', marginBottom: 8 }}>
                  FULL NAME
                </label>
                <input
                  required
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#ff5722'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,87,34,0.2)'; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'Orbitron, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(255,240,234,0.5)', marginBottom: 8 }}>
                  PHONE (OPTIONAL)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#ff5722'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,87,34,0.2)'; }}
                />
              </div>
            </>
          )}
          <div>
            <label style={{ display: 'block', fontFamily: 'Orbitron, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(255,240,234,0.5)', marginBottom: 8 }}>
              EMAIL ADDRESS
            </label>
            <input
              required
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#ff5722'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,87,34,0.2)'; }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'Orbitron, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(255,240,234,0.5)', marginBottom: 8 }}>
              PASSWORD
            </label>
            <input
              required
              type="password"
              placeholder={mode === 'register' ? 'Min. 6 characters' : 'Enter password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#ff5722'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,87,34,0.2)'; }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', background: loading ? 'rgba(255,87,34,0.4)' : '#ff5722',
              color: '#0d0705', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Orbitron, sans-serif', fontSize: '0.7rem', fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4, transition: 'all 0.2s',
            }}
          >
            {loading ? '...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>
      </div>
    </div>
  );
}
