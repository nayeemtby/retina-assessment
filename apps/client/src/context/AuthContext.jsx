import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContextInstance.js';
import { authApi } from '../api/client.js';

const TOKEN_KEY = 'admin_token';
const ADMIN_KEY = 'admin_profile';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem(ADMIN_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setToken(null);
    setAdmin(null);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const res = await authApi.login({ email, password });
    const authData = res.value || res.data;
    const newToken = authData.token;
    const newAdmin = authData.admin;

    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(newAdmin));
    setToken(newToken);
    setAdmin(newAdmin);
    return authData;
  }, []);

  const bootstrap = useCallback(async ({ username, email, password }) => {
    const res = await authApi.bootstrap({ username, email, password });
    return res;
  }, []);

  // Validate session on mount asynchronously
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) return;

    let active = true;
    authApi
      .me()
      .then((res) => {
        if (!active) return;
        const profile = res.value || res.data;
        setAdmin(profile);
        localStorage.setItem(ADMIN_KEY, JSON.stringify(profile));
      })
      .catch((err) => {
        if (!active) return;
        if (err.isUnauthorized || err.status === 401) {
          logout();
        }
      });

    return () => {
      active = false;
    };
  }, [logout]);

  const value = {
    token,
    admin,
    isAuthenticated: Boolean(token),
    login,
    logout,
    bootstrap,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
