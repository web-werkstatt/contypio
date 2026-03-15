import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { User } from '@/types/cms';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('cms_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data);
    } catch {
      localStorage.removeItem('cms_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('cms_token', res.data.access_token);
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem('cms_token');
    setUser(null);
    window.location.href = '/login';
  };

  return { user, isLoading, isAuthenticated: !!user, login, logout };
}
