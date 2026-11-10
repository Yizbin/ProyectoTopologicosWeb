import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  clearAuthToken,
  getAuthToken,
  SESSION_EXPIRED_EVENT,
  setAuthToken,
} from '../../shared/api/client';
import type { UsuarioAutenticado } from '../../shared/api/types';

const USER_STORAGE_KEY = 'reservas.customer-user';

export interface SessionContextValue {
  user: UsuarioAutenticado | null;
  sessionNotice: string | null;
  login: (token: string, usuario: UsuarioAutenticado) => void;
  logout: () => void;
  clearSessionNotice: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function readStoredUser(): UsuarioAutenticado | null {
  if (typeof window === 'undefined') return null;

  const token = getAuthToken();
  if (!token) {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }

  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UsuarioAutenticado;
    return parsed?.id && parsed?.correo ? parsed : null;
  } catch {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioAutenticado | null>(readStoredUser);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const login = useCallback((token: string, usuario: UsuarioAutenticado) => {
    setAuthToken(token);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario));
    }
    setUser(usuario);
    setSessionNotice(null);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
    setUser(null);
    setSessionNotice(null);
  }, []);

  const clearSessionNotice = useCallback(() => {
    setSessionNotice(null);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
      setUser(null);
      setSessionNotice(
        'Tu sesión ha expirado o ya no es válida. Inicia sesión nuevamente.',
      );

      if (location.pathname !== '/login') {
        const from = `${location.pathname}${location.search}`;
        navigate('/login', { replace: true, state: { from } });
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [location.pathname, location.search, navigate]);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      sessionNotice,
      login,
      logout,
      clearSessionNotice,
    }),
    [user, sessionNotice, login, logout, clearSessionNotice],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe utilizarse dentro de SessionProvider.');
  }
  return context;
}

