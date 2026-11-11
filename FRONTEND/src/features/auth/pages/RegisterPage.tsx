import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../shared/api/client';
import type {
  ApiError,
  LoginResponse,
  RegistroRequest,
} from '../../../shared/api/types';

interface RegisterFieldErrors {
  nombre?: string;
  correo?: string;
  telefono?: string;
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
    message: 'No pudimos completar tu registro. Inténtalo nuevamente.',
    tipoError: 'UnexpectedError',
  };
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegistroRequest>({
    nombre: '',
    correo: '',
    telefono: '',
    contrasena: '',
  });
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof RegistroRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const errors: RegisterFieldErrors = {};

    if (!form.nombre.trim()) {
      errors.nombre = 'El nombre completo es obligatorio.';
    }
    if (!form.correo.trim()) {
      errors.correo = 'El correo electrónico es obligatorio.';
    } else if (!EMAIL_REGEX.test(form.correo.trim())) {
      errors.correo = 'Ingresa un correo electrónico válido.';
    }
    if (!form.telefono.trim()) {
      errors.telefono = 'El teléfono de contacto es obligatorio.';
    } else if (form.telefono.replace(/\D/g, '').length < 7) {
      errors.telefono = 'Ingresa un teléfono válido (mínimo 7 dígitos).';
    }
    if (!form.contrasena) {
      errors.contrasena = 'Crea una contraseña para tu cuenta.';
    } else if (form.contrasena.length < 6) {
      errors.contrasena = 'La contraseña debe tener al menos 6 caracteres.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);

    if (!validate()) return;

    const payload: RegistroRequest = {
      nombre: form.nombre.trim(),
      correo: form.correo.trim(),
      telefono: form.telefono.trim(),
      contrasena: form.contrasena,
    };

    setIsSubmitting(true);
    try {
      await apiClient.post<LoginResponse>('/auth/registro', payload);
      navigate('/login', {
        replace: true,
        state: {
          registeredSuccess: true,
          registeredEmail: payload.correo,
        },
      });
    } catch (cause) {
      const parsed = normalizeApiError(cause);
      if (parsed.statusCode === 409) {
        setApiError({
          ...parsed,
          message:
            'Ya existe una cuenta registrada con ese correo electrónico. Prueba iniciando sesión.',
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
        <div className="flex flex-col justify-between bg-[#526e5c] p-8 text-[#f6f5f0] lg:col-span-5 lg:p-10">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-stone-200 transition hover:text-white"
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

            <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
              Casa Norte · Nueva Cuenta
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Empieza a reservar hoy.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-stone-100/90">
              Crea tu cuenta de cliente en segundos para consultar horarios
              disponibles y gestionar todas tus reservas desde un solo lugar.
            </p>
          </div>

          <ul className="mt-8 space-y-2.5 text-xs text-stone-100/90">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-200" />
              Disponibilidad actualizada por espacio y fecha
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-200" />
              Historial y cancelación directa desde tu portal
            </li>
          </ul>
        </div>

        <div className="p-8 sm:p-10 lg:col-span-7">
          <h2 className="text-2xl font-semibold text-stone-900">
            Crear cuenta de cliente
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Completa tus datos de contacto para registrarte.
          </p>

          {apiError && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
            >
              <div className="flex flex-wrap items-center gap-2">
                <strong className="font-semibold">
                  No se pudo crear la cuenta
                </strong>
              </div>
              <p className="mt-1 text-red-800">{apiError.message}</p>
            </div>
          )}

          <form
            noValidate
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="register-name"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                Nombre completo
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                placeholder="Ej. Ana Sofía López"
                value={form.nombre}
                onChange={(e) => updateField('nombre', e.target.value)}
                aria-invalid={Boolean(fieldErrors.nombre)}
                className={`mt-1.5 w-full rounded-xl border bg-stone-50/70 px-4 py-3 text-sm text-stone-900 outline-none transition focus:bg-white focus:ring-2 ${
                  fieldErrors.nombre
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-stone-300 focus:border-[#526e5c] focus:ring-emerald-100'
                }`}
              />
              {fieldErrors.nombre && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.nombre}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                Correo electrónico
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={form.correo}
                onChange={(e) => updateField('correo', e.target.value)}
                aria-invalid={Boolean(fieldErrors.correo)}
                className={`mt-1.5 w-full rounded-xl border bg-stone-50/70 px-4 py-3 text-sm text-stone-900 outline-none transition focus:bg-white focus:ring-2 ${
                  fieldErrors.correo
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
                htmlFor="register-phone"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                Teléfono
              </label>
              <input
                id="register-phone"
                type="tel"
                autoComplete="tel"
                placeholder="644 123 4567"
                value={form.telefono}
                onChange={(e) => updateField('telefono', e.target.value)}
                aria-invalid={Boolean(fieldErrors.telefono)}
                className={`mt-1.5 w-full rounded-xl border bg-stone-50/70 px-4 py-3 text-sm text-stone-900 outline-none transition focus:bg-white focus:ring-2 ${
                  fieldErrors.telefono
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-stone-300 focus:border-[#526e5c] focus:ring-emerald-100'
                }`}
              />
              {fieldErrors.telefono && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {fieldErrors.telefono}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="register-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  Contraseña
                </label>
                <span className="text-xs text-stone-500">
                  Mínimo 6 caracteres
                </span>
              </div>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                placeholder="Crea una contraseña segura"
                value={form.contrasena}
                onChange={(e) => updateField('contrasena', e.target.value)}
                aria-invalid={Boolean(fieldErrors.contrasena)}
                className={`mt-1.5 w-full rounded-xl border bg-stone-50/70 px-4 py-3 text-sm text-stone-900 outline-none transition focus:bg-white focus:ring-2 ${
                  fieldErrors.contrasena
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
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#23312b] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#354b42] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creando cuenta…
                </>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-600">
            ¿Ya tienes una cuenta?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#526e5c] underline-offset-4 hover:underline"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

