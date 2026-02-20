import axios from 'axios';

// In production (Docker), use relative /api path - nginx proxies to backend
// In development, use full URL from environment variable
const getApiUrl = () => {
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  // If empty, undefined, or contains 'localhost', use relative path
  if (!envUrl || envUrl.trim() === '' || envUrl.includes('localhost')) {
    return '/api';
  }
  return `${envUrl}/api`;
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;