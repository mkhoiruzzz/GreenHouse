import axios from 'axios';

// PERBAIKAN: Gunakan environment variable untuk base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // false untuk development
  timeout: 10000, // PERBAIKAN: Tambahkan timeout
});

// Interceptor untuk menambahkan token ke header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired atau invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // PERBAIKAN: Handle CORS errors
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - mungkin CORS atau server down');
    }
    
    return Promise.reject(error);
  }
);

export default api;