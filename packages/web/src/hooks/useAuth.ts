import { useState, useEffect } from 'react';

const TOKEN_KEY = 'taskflow_token';

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Read token from localStorage on mount
    const savedToken = localStorage.getItem(TOKEN_KEY);
    setTokenState(savedToken);
    setIsReady(true);
  }, []);

  const setToken = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setTokenState(newToken);
  };

  const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
  };

  const isAuthenticated = !!token;

  return {
    token,
    isAuthenticated,
    isReady,
    setToken,
    clearToken
  };
}
