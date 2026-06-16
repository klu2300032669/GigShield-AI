import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [worker, setWorker] = useState(() => {
    const saved = localStorage.getItem('gigshield_worker');
    return saved ? JSON.parse(saved) : null;
  });

  const [tokens, setTokens] = useState(() => {
    const accessToken = localStorage.getItem('gigshield_access_token');
    const refreshToken = localStorage.getItem('gigshield_refresh_token');
    return accessToken ? { accessToken, refreshToken } : null;
  });

  const login = useCallback((authResponse) => {
    // authResponse = { accessToken, refreshToken, tokenType, expiresIn, user }
    const { accessToken, refreshToken, user } = authResponse;
    setWorker(user);
    setTokens({ accessToken, refreshToken });
    localStorage.setItem('gigshield_worker', JSON.stringify(user));
    localStorage.setItem('gigshield_access_token', accessToken);
    localStorage.setItem('gigshield_refresh_token', refreshToken);
  }, []);

  const logout = useCallback(() => {
    setWorker(null);
    setTokens(null);
    localStorage.removeItem('gigshield_worker');
    localStorage.removeItem('gigshield_access_token');
    localStorage.removeItem('gigshield_refresh_token');
  }, []);

  const updateTokens = useCallback((newAccessToken, newRefreshToken) => {
    setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    localStorage.setItem('gigshield_access_token', newAccessToken);
    localStorage.setItem('gigshield_refresh_token', newRefreshToken);
  }, []);

  // Listen for session-expired events from the API interceptor
  // This prevents full page reloads on auth failure
  useEffect(() => {
    const handleSessionExpired = () => {
      setWorker(null);
      setTokens(null);
    };
    window.addEventListener('gigshield:session-expired', handleSessionExpired);
    return () => window.removeEventListener('gigshield:session-expired', handleSessionExpired);
  }, []);

  const isAuthenticated = !!worker && !!tokens?.accessToken;
  const isAdmin = worker?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{
      worker, tokens, login, logout, updateTokens,
      isAuthenticated, isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
