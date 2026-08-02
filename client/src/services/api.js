import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gsky_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (API_URL && res.data && typeof res.data === 'object') {
      res.data = JSON.parse(JSON.stringify(res.data), (key, value) =>
        typeof value === 'string' && value.startsWith('/uploads/') ? `${API_URL}${value}` : value
      );
    }
    return res;
  },
  (err) => {
    if (err.response && err.response.status === 401 && !err.config.url.includes('/auth/login')) {
      localStorage.removeItem('gsky_token');
      localStorage.removeItem('gsky_user');
    }
    const message =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
