import type { ReactNode } from 'react';
import { Link } from './navigation-link.js';
import { useSession } from './SessionProvider.js';

export function SiteLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useSession();

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link to="/" className="brand" aria-label="Casa Norte, inicio">
          <span className="brand-mark">CN</span>
          <span>
            Casa Norte<small>Espacios que inspiran</small>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Navegación principal">
          <Link to="/spaces">Explorar espacios</Link>
          {user && <Link to="/reservations">Mis reservas</Link>}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <Link to="/account" className="account-chip">
                <span className="avatar">
                  {user.nombre.slice(0, 1).toUpperCase()}
                </span>
                <span className="account-name">
                  Hola, {user.nombre.split(' ')[0]}
                </span>
              </Link>
              <button className="text-button" onClick={signOut}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-button sign-in">
                Iniciar sesión
              </Link>
              <Link to="/register" className="button button-dark header-cta">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <Link to="/" className="footer-brand">
          Casa Norte<span>Tu próximo espacio empieza aquí.</span>
        </Link>
        <p>Encuentra el lugar ideal para tus ideas.</p>
        <span className="footer-copy">
          © {new Date().getFullYear()} Casa Norte
        </span>
      </footer>
    </div>
  );
}