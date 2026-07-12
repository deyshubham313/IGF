import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, adminLogin as apiAdminLogin, getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('igf_token');
    localStorage.removeItem('igf_user');
    setUser(null);
    setIsAdmin(false);
  }, []);

  // Restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('igf_token');
    if (!token) { setLoading(false); return; }

    getMe()
      .then((res) => {
        const u = res.data.user;
        setUser(u);
        setIsAdmin(u?.role === 'admin');
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  // Listen for igf_logout events from the API interceptor
  useEffect(() => {
    window.addEventListener('igf_logout', logout);
    return () => window.removeEventListener('igf_logout', logout);
  }, [logout]);

  const login = async ({ email, password }) => {
    const res = await apiLogin({ email, password });
    const { token, user: u } = res.data;
    localStorage.setItem('igf_token', token);
    localStorage.setItem('igf_user', JSON.stringify(u));
    setUser(u);
    setIsAdmin(false);
    return u;
  };

  const register = async ({ name, email, password, phone }) => {
    const res = await apiRegister({ name, email, password, phone });
    const { token, user: u } = res.data;
    localStorage.setItem('igf_token', token);
    localStorage.setItem('igf_user', JSON.stringify(u));
    setUser(u);
    setIsAdmin(false);
    return u;
  };

  const adminLogin = async ({ username, password }) => {
    const res = await apiAdminLogin({ username, password });
    const { token } = res.data;
    localStorage.setItem('igf_token', token);
    setUser({ id: 'admin', name: 'Admin', role: 'admin' });
    setIsAdmin(true);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, register, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
