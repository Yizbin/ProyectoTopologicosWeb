import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSession } from '../features/auth/SessionProvider';

export function SiteLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition ${isActive ? 'text-[#23312b] underline underline-offset-8' : 'text-stone-600 hover:text-[#23312b]'
    }`;

  return (
                  <div className="flex min-h-screen flex-col bg-[#f6f5f0] text-[#23312b]">
                    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#f6f5f0]/95 backdrop-blur-sm">
                      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
                        <Link
                          to="/"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#526e5c]/40 bg-[#e4e9e0] text-xs font-bold tracking-tight text-[#23312b]">
                            CN
                          </span>
                          <div>
                            <span className="block text-base font-bold tracking-tight text-[#23312b]">
                              Casa Norte
                            </span>
                            <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-stone-500">
                              Espacios y reservas
                            </span>
                          </div>
                        </Link>

                        <nav
                          aria-label="Navegación principal"
                          className="hidden items-center gap-7 md:flex"
                        >
                          <NavLink to="/" end className={navLinkClass}>
                            Explorar espacios
                          </NavLink>
                          {user && (
                            <NavLink to="/mis-reservaciones" className={navLinkClass}>
                              Mis Reservaciones
                            </NavLink>
                          )}
                        </nav>

                        <div className="hidden items-center gap-3 md:flex">
                          {user ? (
                            <>
                              <div className="flex items-center gap-2.5 rounded-full border border-stone-200 bg-white px-3 py-1.5">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e4e9e0] text-xs font-bold text-[#526e5c]">
                                  {user.nombre.slice(0, 1).toUpperCase()}
                                </span>
                                  <span className="text-xs font-semibold text-stone-800">
                                    {user.nombre}
                                  </span>
                              </div>

                              <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                              >
                                Cerrar sesión
                              </button>
                            </>
                          ): (
                              <>
                <Link
                            to="/login"
                            className="rounded-xl px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-200/60 hover:text-[#23312b]"
                          >
                            Iniciar Sesión
                          </Link>
                            <Link
                              to="/registro"
                              className="rounded-xl bg-[#23312b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#354b42]"
                            >
                              Registrarse
                            </Link>
                          </>
            )}
                        </div>

                        <button
                          type="button"
                          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                          aria-expanded={mobileMenuOpen}
                          onClick={() => setMobileMenuOpen((prev) => !prev)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-800 md:hidden"
                        >
                          {mobileMenuOpen ? (
                            <svg
                              aria-hidden="true"
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          ) : (
                            <svg
                              aria-hidden="true"
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            >
                              <line x1="3" y1="6" x2="21" y2="6" />
                              <line x1="3" y1="12" x2="21" y2="12" />
                              <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {mobileMenuOpen && (
                        <div className="border-t border-stone-200 bg-white px-4 py-4 md:hidden">
                          <div className="flex flex-col gap-3">
                            <Link
                              to="/"
                              onClick={() => setMobileMenuOpen(false)}
                              className="rounded-xl px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100"
                            >
                              Explorar espacios
                            </Link>
                            {user ? (
                              <>
                                <Link
                                  to="/mis-reservaciones"
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="rounded-xl px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100"
                                >
                                  Mis Reservaciones
                                </Link>
                                <div className="mt-1 flex items-center justify-between border-t border-stone-100 pt-3">
                                  <span className="text-xs font-semibold text-stone-600">
                                    Sesión: {user.nombre}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="rounded-xl border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700"
                                  >
                                    Cerrar sesión
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="mt-1 flex flex-col gap-2 border-t border-stone-100 pt-3">
                                <Link
                                  to="/login"
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="rounded-xl border border-stone-300 px-4 py-2.5 text-center text-sm font-semibold text-stone-800"
                                >
                                  Iniciar Sesión
                                </Link>
                                <Link
                                  to="/registro"
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="rounded-xl bg-[#23312b] px-4 py-2.5 text-center text-sm font-semibold text-white"
                                >
                                  Registrarse
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </header>

                      <main className="flex-1">{children}</main>

                      <footer className="border-t border-stone-200 bg-white/70">
                        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 text-xs text-stone-500 sm:flex-row sm:items-center sm:px-6">
                          <div>
                            <strong className="font-semibold text-[#23312b]">Casa Norte</strong>{' '}
                            · Portal público de reservación de espacios
                          </div>
                          <span>© {new Date().getFullYear()} Casa Norte</span>
                        </div>
                      </footer>
                  </div>
                  );
}
