import axios from 'axios';

const getDefaultApiUrl = () => {
  if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) {
    return process.env.REACT_APP_API_URL.trim();
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api';
  }

  // Production: asume mismo host + ruta /api
  return '/api';
};

const rawUrl = getDefaultApiUrl();
const API_URL = rawUrl.endsWith('/api') ? rawUrl : rawUrl.replace(/\/+$/, '') + '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 14000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  console.debug('API request:', config.method?.toUpperCase(), config.baseURL + config.url);
  return config;
}, (error) => {
  console.error('API request config error:', error);
  return Promise.reject(error);
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
