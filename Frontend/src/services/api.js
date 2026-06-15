import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://individual-project-grouptraveli.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      const isAuthPage = window.location.pathname.startsWith('/login')
        || window.location.pathname.startsWith('/register');

      if (!isAuthPage) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  },
);

export default api;
