import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT token automatically ───────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('igf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Handle 401 — auto-logout ──────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/');
      if (!isAuthRoute) {
        localStorage.removeItem('igf_token');
        localStorage.removeItem('igf_user');
        if (!window.location.pathname.includes('/admin')) {
          window.dispatchEvent(new Event('igf_logout'));
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Products ──────────────────────────────────────────────────
export const getProducts = (params = {}) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const getCategories = () => api.get('/products/categories');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Image upload — sends multipart/form-data, returns base64 URL stored in MongoDB
export const uploadProductImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return axios.post(`${BASE_URL}/products/upload-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('igf_token')}`,
    },
    timeout: 60000, // images can take longer
  });
};

export const uploadProductImages = (files) => {
  const formData = new FormData();
  Array.from(files).forEach((f) => formData.append('images', f));
  return axios.post(`${BASE_URL}/products/upload-images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('igf_token')}`,
    },
    timeout: 120000,
  });
};

// ─── Orders ───────────────────────────────────────────────────
export const createOrder = (data) => api.post('/orders', data);
export const trackOrder = (orderId) => api.get(`/orders/track/${orderId}`);
export const getOrders = (params = {}) => api.get('/orders', { params });
export const getOrderStats = () => api.get('/orders/stats');
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status });
export const cancelOrder = (orderId) => api.put(`/orders/${orderId}/cancel`);

// ─── Auth ─────────────────────────────────────────────────────
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const adminLogin = (data) => api.post('/auth/admin/login', data);
export const getMe = () => api.get('/auth/me');
export const updateCart = (cart) => api.post('/auth/update-cart', { cart });
export const updateWishlist = (wishlist) => api.post('/auth/update-wishlist', { wishlist });

// ─── Inquiries ────────────────────────────────────────────────
export const submitInquiry = (data) => api.post('/inquiries', data);
export const getInquiries = (params = {}) => api.get('/inquiries', { params });
export const updateInquiryStatus = (id, status) => api.put(`/inquiries/${id}/status`, { status });
export const deleteInquiry = (id) => api.delete(`/inquiries/${id}`);

// ─── Payments ─────────────────────────────────────────────────
export const validateCoupon = (code) => api.post('/payments/validate-coupon', { code });
export const createRazorpayOrder = (amount) => api.post('/payments/create-razorpay-order', { amount });
export const verifyPayment = (data) => api.post('/payments/verify', data);
export const confirmUpiPayment = (data) => api.post('/payments/upi-confirm', data);

// ─── Settings ─────────────────────────────────────────────────
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.post('/settings', data);

// ─── Razorpay Config (admin only) ─────────────────────────────
export const getRazorpayStatus = () => api.get('/settings/razorpay-status');
export const getRazorpayKeysRaw = () => api.get('/settings/razorpay-keys-raw');
export const saveRazorpayKeys = (data) => api.post('/settings/razorpay-keys', data);

export default api;
