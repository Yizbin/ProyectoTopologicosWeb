import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../shared/api/client';
import type {
  ApiError,
  LoginRequest,
  LoginResponse,
} from '../../../shared/api/types';
import { useSession } from '../SessionProvider';

interface LoginLocationState {
  from?: string;
  registeredSuccess?: boolean;
  registeredEmail?: string;
}

interface LoginFieldErrors {
  correo?: string;
  contrasena?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeApiError(cause: unknown): ApiError {
  if (
    cause &&
    typeof cause === 'object' &&
    'message' in cause &&
    'tipoError' in cause
  ) {
    return cause as ApiError;
  }
  return {
    message: 'No pudimos iniciar sesión. Inténtalo nuevamente.',
    tipoError: 'UnexpectedError',
  };
}

export function LoginPage() {
  const { login, sessionNotice, clearSessionNotice } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LoginLocationState | null) ?? null;

  const [correo, setCorreo] = useState(state?.registeredEmail ?? '');
  const [contrasena, setContrasena] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const errors: LoginFieldErrors = {};
    const trimmedEmail = correo.trim();

    if (!trimmedEmail) {
      errors.correo = 'Ingresa tu correo electrónico.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.correo = 'El correo electrónico no tiene un formato válido.';
    }

    if (!contrasena) {
      errors.contrasena = 'Ingresa tu contraseña.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    clearSessionNotice();

    if (!validate()) return;

    const payload: LoginRequest = {
      correo: correo.trim(),
      contrasena,
    };

    setIsSubmitting(true);
    try {
      const response = await apiClient.post<LoginResponse>(
        '/auth/login',
        payload,
      );
      login(response.access_token, response.usuario);
      const destination =
      state?.from && state.from.startsWith('/') && !state.from.startsWith('//')
        ? state.from
        : '/';
      navigate(destination, { replace: true });
    } catch (cause) {
      const parsed = normalizeApiError(cause);
      if (parsed.statusCode === 401) {
        setApiError({
          ...parsed,
          message:
            'El correo o la contraseña son incorrectos. Verifica tus datos e inténtalo de nuevo.',
        });
      } else {
        setApiError(parsed);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="grid overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm lg:grid-cols-12">
        <div className="flex flex-col justify-between bg-[#23312b] p-8 text-[#f6f5f0] lg:col-span-5 lg:p-10">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-stone-300 transition hover:text-white"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Volver al catálogo
            </Link>

            <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e4b390]">
              Casa Norte · Portal del Cliente
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Qué bueno verte de nuevo.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-stone-300">
              Inicia sesión con tu cuenta para reservar salas, cubículos y
              estaciones de trabajo en tiempo real.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-stone-300">
            Tu historial de reservaciones queda sincronizado con tu perfil de
            cliente.
          </div>
        </div>

        <div className="p-8 sm:p-10 lg:col-span-7">
          <h2 className="text-2xl font-semibold text-stone-900">
            Iniciar sesión
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Ingresa tus credenciales para continuar.
          </p>

          {state?.registeredSuccess && (
            <div
              role="status"
              className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
            >
              <svg
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>
                ¡Cuenta creada con éxito! Ahora inicia sesión con tu correo y
                contraseña.
              </span>
            </div>
          )}

          {sessionNotice && (
            <div
              role="status"
              className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              <span>{sessionNotice}</span>
              <button
                type="button"
                aria-label="Cerrar aviso"
                onClick={clearSessionNotice}
                className="text-amber-700 hover:text-amber-950"
              >
                ×
              </button>
            </div>
          )}

          {apiError && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
            >
              <div className="flex flex-wrap items-center gap-2">
                <strong className="font-semibold">
                  No se pudo iniciar sesión
                </strong>
              </div>
              <p className="mt-1 text-red-800">{apiError.message}</p>
            </div>
          )}

          <form
            noValidate
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value);
                  if (fieldErrors.correo) {
                    setFieldErrors((prev) => ({ ...prev, correo: undefined }));
                  }
                }}
                aria-invalid={Boolean(fieldErrors.correo)}
                className={`mt-1.5 w-full rounded-xl border bg-stone-50/70 px-4 py-3 text-sm text-stone-900 outline-none transition focus:bg-white focus:ring-2 ${fieldErrors.correo
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-stone-300 focus:border-[#526e5c] focus:ring-emerald-100'
                  }`}
              />
              {fieldErrors.correo && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.correo}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => {
                  setContrasena(e.target.value);
                  if (fieldErrors.contrasena) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      contrasena: undefined,
                    }));
                  }
                }}
                aria-invalid={Boolean(fieldErrors.contrasena)}
                className={`mt-1.5 w-full rounded-xl border bg-stone-50/70 px-4 py-3 text-sm text-stone-900 outline-none transition focus:bg-white focus:ring-2 ${fieldErrors.contrasena
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-stone-300 focus:border-[#526e5c] focus:ring-emerald-100'
                  }`}
              />
              {fieldErrors.contrasena && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.contrasena}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#23312b] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#354b42] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Verificando…
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-600">
            ¿Aún no tienes cuenta?{' '}
            <Link
              to="/registro"
              className="font-semibold text-[#526e5c] underline-offset-4 hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

