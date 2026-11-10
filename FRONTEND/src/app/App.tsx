import { useLocation, navigate, safeReturnTo } from './navigation.js';
import { useEffect, type ReactNode } from 'react';
import { SiteLayout } from './SiteLayout.js';
import { useSession } from './SessionProvider.js';
import { CatalogPage } from '../features/catalog/pages/CatalogPage.js';
import { SpaceDetailPage } from '../features/catalog/pages/SpaceDetailPage.js';
import { LoginPage, RegisterPage } from '../features/auth/pages/AuthPages.js';
import {
  AccountPage,
  ReservationsPage,
} from '../features/account/pages/AccountPages.js';

function RequireSession({
  children,
  currentLocation,
}: {
  children: ReactNode;
  currentLocation: string;
}) {
  const { user } = useSession();
  useEffect(() => {
    if (!user)
      navigate(`/login?returnTo=${encodeURIComponent(currentLocation)}`, true);
  }, [user, currentLocation]);
  if (!user)
    return (
      <div className="page-wrap">
        <p className="quiet-message">Te llevamos a iniciar sesión…</p>
      </div>
    );
  return <>{children}</>;
}

function NotFoundPage() {
  return (
    <section className="not-found page-wrap">
      <span className="eyebrow eyebrow-muted">ERROR 404</span>
      <h1>Este lugar no aparece en el mapa.</h1>
      <p>
        Puede que el enlace haya cambiado o que el espacio ya no esté
        disponible.
      </p>
      <button className="button button-dark" onClick={() => navigate('/')}>
        Volver al inicio
      </button>
    </section>
  );
}

export function App() {
  const location = useLocation();
  const { user } = useSession();
  const [path, query = ''] = location.split('?');
  const params = new URLSearchParams(query.split('#')[0]);
  const currentLocation = location;
  let page: React.ReactNode;

  if (path === '/' || path === '/spaces') page = <CatalogPage />;
  else if (path === '/login')
    page = user ? (
      <Redirect to={safeReturnTo(params.get('returnTo'))} />
    ) : (
      <LoginPage returnTo={params.get('returnTo')} />
    );
  else if (path === '/register') page = <RegisterPage />;
  else if (path === '/account')
    page = (
      <RequireSession currentLocation={currentLocation}>
        <AccountPage />
      </RequireSession>
    );
  else if (path === '/reservations')
    page = (
      <RequireSession currentLocation={currentLocation}>
        <ReservationsPage />
      </RequireSession>
    );
  else {
    const detail = path.match(/^\/spaces\/([^/]+)$/);
    page = detail ? (
      <SpaceDetailPage id={decodeURIComponent(detail[1])} />
    ) : (
      <NotFoundPage />
    );
  }

  return <SiteLayout>{page}</SiteLayout>;
}

function Redirect({ to }: { to: string }) {
  useEffect(() => navigate(to, true), [to]);
  return (
    <div className="page-wrap">
      <p className="quiet-message">Abriendo tu espacio…</p>
    </div>
  );
}
