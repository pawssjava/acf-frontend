import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { logoutUser } from '../api/auth';

interface AuthUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  photo: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem('access_token', token);
    else localStorage.removeItem('access_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('auth_user', JSON.stringify(user));
    else localStorage.removeItem('auth_user');
  }, [user]);

  const login = (accessToken: string, refreshTokenValue: string, newUser: AuthUser) => {
    localStorage.setItem('refresh_token', refreshTokenValue);
    setToken(accessToken);
    setUser(newUser);
  };

  const logout = async () => {
    const storedRefresh = localStorage.getItem('refresh_token');
    if (storedRefresh) {
      try {
        await logoutUser(storedRefresh);
      } catch {
        // best-effort; clear local state regardless
      }
    }
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
