'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const sessionVersionRef = useRef(0);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) { setLoading(false); return; }
    const sessionVersion = ++sessionVersionRef.current;
    api.get('/auth/me')
      .then(d => {
        if (sessionVersionRef.current !== sessionVersion) return;
        setUser(d.user);
      })
      .catch(() => {
        if (sessionVersionRef.current !== sessionVersion) return;
        clearToken();
        setUser(null);
      })
      .finally(() => {
        if (sessionVersionRef.current !== sessionVersion) return;
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (email, password, role) => {
    const data = await api.post('/auth/login', { email, password, role });
    sessionVersionRef.current += 1;
    Cookies.set('token', data.token, { expires: 7, path: '/' });
    setUser(data.user);
    setLoading(false);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.post('/auth/register', payload);
    sessionVersionRef.current += 1;
    Cookies.set('token', data.token, { expires: 7, path: '/' });
    setUser(data.user);
    setLoading(false);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    sessionVersionRef.current += 1;
    clearToken();
    setUser(null);
    setLoading(false);
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
