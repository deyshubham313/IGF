import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timerRefs = useRef({});

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    timerRefs.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timerRefs.current[id];
    }, duration);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    clearTimeout(timerRefs.current[id]);
    delete timerRefs.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const typeConfig = {
    success: { icon: '✅', bg: 'rgba(74,222,128,0.12)', border: '#4ade80', color: '#4ade80' },
    error: { icon: '❌', bg: 'rgba(239,68,68,0.12)', border: '#ef4444', color: '#ef4444' },
    warning: { icon: '⚠️', bg: 'rgba(251,191,36,0.12)', border: '#fbbf24', color: '#fbbf24' },
    info: { icon: 'ℹ️', bg: 'rgba(96,165,250,0.12)', border: '#60a5fa', color: '#60a5fa' },
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 380,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const cfg = typeConfig[toast.type] || typeConfig.info;
          return (
            <div
              key={toast.id}
              onClick={() => dismissToast(toast.id)}
              style={{
                background: 'rgba(18,9,5,0.95)',
                border: `1px solid ${cfg.border}`,
                borderRadius: 10,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 12px ${cfg.border}22`,
                backdropFilter: 'blur(16px)',
                animation: 'slideUp 0.3s ease',
                cursor: 'pointer',
                pointerEvents: 'all',
              }}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{cfg.icon}</span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.88rem', color: '#fff0ea', lineHeight: 1.5, flex: 1 }}>
                {toast.message}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
