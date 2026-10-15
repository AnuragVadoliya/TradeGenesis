import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('tg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => Promise.reject(error));

// Handle 401 globally
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tg_token');
      localStorage.removeItem('tg_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Strategies ────────────────────────────────────────────────────────────────
export const strategyAPI = {
  create: (data) => api.post('/strategies', data),
  getAll: () => api.get('/strategies'),
  getById: (id) => api.get(`/strategies/${id}`),
  update: (id, data) => api.put(`/strategies/${id}`, data),
  delete: (id) => api.delete(`/strategies/${id}`),
};

// ─── AI ────────────────────────────────────────────────────────────────────────
export const aiAPI = {
  generateStrategy: (data) => api.post('/ai/generate-strategy', data),
  chat: (data) => api.post('/ai/chat', data),
};

// ─── Backtest ──────────────────────────────────────────────────────────────────
export const backtestAPI = {
  run: (data) => api.post('/backtest/run', data),
  getAll: () => api.get('/backtest'),
  getById: (id) => api.get(`/backtest/${id}`),
};

// ─── Paper Trading ─────────────────────────────────────────────────────────────
export const paperAPI = {
  buy: (data) => api.post('/paper/buy', data),
  sell: (data) => api.post('/paper/sell', data),
  getPortfolio: () => api.get('/paper/portfolio'),
  getHistory: () => api.get('/paper/history'),
};

export default api;
