import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  AuthenticatedCustomer,
  LoginResponse,
  RegistrationRequest,
} from '../shared/api/contracts.js';
import { navigate } from './navigation.js';
import {
  api,
  API_SESSION_EXPIRED_EVENT,
  setAccessTokenReader,
} from '../shared/api/client.js';

interface Session {
  token: string;
  user: AuthenticatedCustomer;
}

interface SessionContextValue {
  user: AuthenticatedCustomer | null;
  notice: string | null;
  signIn(correo: string, contrasena: string): Promise<void>;
  signUp(input: RegistrationRequest): Promise<void>;
  signOut(): void;
  clearNotice(): void;
}

const storageKey = 'reservas.customer-session';
const SessionContext = createContext<SessionContextValue | null>(null);

function readStoredSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const value = JSON.parse(raw) as Session;
    return value.token && value.user?.id ? value : null;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession);
  const [notice, setNotice] = useState<string | null>(null);

  useLayoutEffect(() => {
    setAccessTokenReader(() => session?.token ?? null);
  }, [session]);

  useLayoutEffect(() => {
    const onExpired = () => {
      if (!session?.token) return;
      window.localStorage.removeItem(storageKey);
      setSession(null);
      setNotice('Tu sesión terminó. Inicia sesión para continuar.');
      const current = `${window.location.pathname}${window.location.search}`;
      if (window.location.pathname !== '/login') {
        navigate(`/login?returnTo=${encodeURIComponent(current)}`);
      }
    };
    window.addEventListener(API_SESSION_EXPIRED_EVENT, onExpired);
    return () =>
      window.removeEventListener(API_SESSION_EXPIRED_EVENT, onExpired);
  }, [session]);

  const saveSession = useCallback((result: LoginResponse) => {
    const nextSession = { token: result.access_token, user: result.usuario };
    window.localStorage.setItem(storageKey, JSON.stringify(nextSession));
    setSession(nextSession);
    setNotice(null);
  }, []);

  const signIn = useCallback(
    async (correo: string, contrasena: string) => {
      saveSession(
        await api.post<LoginResponse>('/auth/login', { correo, contrasena }),
      );
    },
    [saveSession],
  );

  const signUp = useCallback(
    async (input: RegistrationRequest) => {
      saveSession(await api.post<LoginResponse>('/auth/registro', input));
    },
    [saveSession],
  );

  const signOut = useCallback(() => {
    window.localStorage.removeItem(storageKey);
    setSession(null);
    setNotice(null);
    navigate('/');
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user: session?.user ?? null,
      notice,
      signIn,
      signUp,
      signOut,
      clearNotice: () => setNotice(null),
    }),
    [session, notice, signIn, signOut, signUp],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value)
    throw new Error('useSession debe usarse dentro de SessionProvider.');
  return value;
}
