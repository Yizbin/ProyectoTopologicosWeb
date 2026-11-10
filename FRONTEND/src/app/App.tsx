import type { ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  SessionProvider,
  useSession,
} from '../features/auth';
import { MyBookingsPage } from '../features/booking';
import { CatalogPage, SpaceDetailPage } from '../features/catalog';
import { SiteLayout } from './SiteLayout';

function RequireSession({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const location = useLocation();

  if (!user) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const location = useLocation();

  if (user) {
    const state = location.state as { from?: string } | null;
    const destination =
    state?.from && state.from.startsWith('/') && !state.from.startsWith('//')
      ? state.from
      : '/';
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}

function NotFoundPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <span className="inline-flex items-center rounded-full bg-stone-200 px-3 py-1 font-mono text-xs font-semibold text-stone-700">
        404
      </span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        No encontramos esta página.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        Puede que el enlace haya cambiado o que la dirección no exista en el
        portal.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center rounded-xl bg-[#23312b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#354b42]"
      >
        Volver al catálogo
      </Link>
    </section>
  );
}

export function App() {
  return (
    <SessionProvider>
      <SiteLayout>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route
            path="/login"
            element={
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            }
          />
          <Route
            path="/registro"
            element={
              <GuestOnly>
                <RegisterPage />
              </GuestOnly>
            }
          />
          <Route path="/espacios/:id" element={<SpaceDetailPage />} />
          <Route
            path="/mis-reservaciones"
            element={
              <RequireSession>
                <MyBookingsPage />
              </RequireSession>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </SiteLayout>
    </SessionProvider>
  );
}
