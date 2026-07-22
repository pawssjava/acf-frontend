import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { logoutUser } from '../api/auth';
import { getMe } from '../api/users';

interface AuthUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isVerified: boolean;
  photo: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('access_token'));

  useEffect(() => {
    if (token) localStorage.setItem('access_token', token);
    else localStorage.removeItem('access_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('auth_user', JSON.stringify(user));
    else localStorage.removeItem('auth_user');
  }, [user]);

  // Re-validate any token restored from localStorage against the server before
  // trusting it — a token that merely exists may have expired while the app was closed.
  useEffect(() => {
    if (!token) { setIsLoading(false); return; }
    getMe()
      .then(({ data }) => {
        setUser({
          id: data.id,
          username: data.username,
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          isAdmin: data.isAdmin,
          isVerified: data.isVerified,
          photo: data.photo,
        });
      })
      .catch(() => {
        localStorage.removeItem('refresh_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
    // Only run once on mount — this validates the session restored from
    // localStorage, not every token change (login/logout set state directly).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (accessToken: string, refreshTokenValue: string, newUser: AuthUser) => {
    localStorage.setItem('refresh_token', refreshTokenValue);
    setToken(accessToken);
    setUser(newUser);
  };

  const updateUser = (patch: Partial<AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...patch } : prev);
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
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
