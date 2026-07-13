import { useEffect } from 'react';
// Trigger Vercel rebuild to apply env variables
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './index.css';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { SiteProvider } from './context/SiteContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import PaymentPage from './pages/PaymentPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AdminPage from './pages/AdminPage';

// Scroll reveal observer — runs on every route change
function ScrollReveal() {
  const location = useLocation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    }, 150);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [location.pathname]);

  return null;
}

// Layout wrapper for main site pages (with Navbar + Footer)
function SiteLayout({ children }) {
  return (
    <>
      <div className="grid-bg" />
      <Navbar />
      <main style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <SiteProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
                {/* Custom cursor always rendered */}
                <CustomCursor />
                {/* Scroll reveal on route change */}
                <ScrollReveal />
                <Routes>
                  {/* Admin — no Navbar/Footer */}
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/*" element={<AdminPage />} />

                  {/* Main site */}
                  <Route path="/" element={<SiteLayout><HomePage /></SiteLayout>} />
                  <Route path="/products/:id" element={<SiteLayout><ProductPage /></SiteLayout>} />
                  <Route path="/payment" element={<SiteLayout><PaymentPage /></SiteLayout>} />
                  <Route path="/order-tracking" element={<SiteLayout><OrderTrackingPage /></SiteLayout>} />

                  {/* 404 */}
                  <Route path="*" element={
                    <SiteLayout>
                      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, textAlign: 'center', padding: '0 5%' }}>
                        <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '6rem', fontWeight: 900, color: 'rgba(255,87,34,0.3)', lineHeight: 1 }}>404</div>
                        <h1 style={{ fontFamily: 'Orbitron,sans-serif', fontSize: '1.8rem', color: 'var(--text-primary)' }}>PAGE NOT FOUND</h1>
                        <p style={{ color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.7 }}>The page you are looking for doesn't exist or has been moved.</p>
                        <a href="/" className="btn-primary">← BACK TO HOME</a>
                      </div>
                    </SiteLayout>
                  } />
                </Routes>
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </SiteProvider>
  );
}
