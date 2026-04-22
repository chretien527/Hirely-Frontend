'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import api from '../lib/api';

const Ctx = createContext(null);
const clearToken = () => {
  Cookies.remove('token');
  Cookies.remove('token', { path: '/' });
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(d => setUser(d.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password, role) => {
    const data = await api.post('/auth/login', { email, password, role });
    Cookies.set('token', data.token, { expires: 7, path: '/' });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.post('/auth/register', payload);
    Cookies.set('token', data.token, { expires: 7, path: '/' });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (payload) => {
    const data = await api.put('/auth/profile', payload);
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
