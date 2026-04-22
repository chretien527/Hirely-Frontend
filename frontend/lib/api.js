import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API || 'http://localhost:5000/api' });

api.interceptors.request.use(cfg => {
  const token = Cookies.get('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r.data,
  err => Promise.reject(err.response?.data || { message: 'Network error' })
);

export default api;
