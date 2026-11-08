import { useState, type FormEvent, type ReactNode } from 'react';
import { useSession } from '../../../app/SessionProvider.js';
import { Link } from '../../../app/navigation-link.js';
import { navigate, safeReturnTo } from '../../../app/navigation.js';
import { ApiClientError } from '../../../shared/api/client.js';

function AuthShell({
  children,
  title,
  subtitle,
  note,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  note: ReactNode;
}) {
  return (
    <section className="auth-page">
      <div className="auth-illustration">
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
        <div className="auth-illustration-center">CN</div>
        <span className="auth-illustration-caption">
          UN ESPACIO PARA VOLVER A TI
        </span>
      </div>
      <div className="auth-form-wrap">
        <Link to="/" className="back-link">
          ← Volver al inicio
        </Link>
        <span className="eyebrow eyebrow-muted">CASA NORTE · TU CUENTA</span>
        <h1>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
        <p className="auth-switch">{note}</p>
      </div>
    </section>
  );
}

function friendlyMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 401)
      return 'El correo o la contraseña no coinciden. Revísalos e inténtalo otra vez.';
    if (error.status === 409)
      return 'Ese correo ya tiene una cuenta. Prueba iniciando sesión.';
    return error.message;
  }
  return 'No pudimos completar tu solicitud. Inténtalo de nuevo.';
}

export function LoginPage({ returnTo }: { returnTo: string | null }) {
  const { signIn, notice, clearNotice } = useSession();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(correo, contrasena);
      navigate(safeReturnTo(returnTo), true);
    } catch (cause) {
      setError(friendlyMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Qué bueno verte."
      subtitle="Inicia sesión para continuar con tus planes."
      note={
        <>
          ¿Aún no tienes cuenta? <Link to="/register">Crea una aquí</Link>
        </>
      }
    >
      {notice && (
        <div className="form-notice" role="status">
          {notice}
          <button type="button" aria-label="Cerrar aviso" onClick={clearNotice}>
            ×
          </button>
        </div>
      )}
      <form className="auth-form" onSubmit={submit}>
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
          required
        />
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={contrasena}
          onChange={(event) => setContrasena(event.target.value)}
          required
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button button-dark button-full auth-submit"
          disabled={submitting}
        >
          {submitting ? 'Entrando…' : 'Iniciar sesión'} <span>↗</span>
        </button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { signUp } = useSession();
  const [fields, setFields] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    contrasena: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signUp(fields);
      navigate('/spaces', true);
    } catch (cause) {
      setError(friendlyMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: keyof typeof fields, value: string) =>
    setFields((current) => ({ ...current, [field]: value }));

  return (
    <AuthShell
      title="Empieza por aquí."
      subtitle="Crea tu cuenta para guardar tus planes y reservar tu espacio."
      note={
        <>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={submit}>
        <label htmlFor="name">Nombre</label>
        <input
          id="name"
          autoComplete="name"
          placeholder="Tu nombre"
          value={fields.nombre}
          onChange={(event) => update('nombre', event.target.value)}
          required
        />
        <label htmlFor="register-email">Correo electrónico</label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={fields.correo}
          onChange={(event) => update('correo', event.target.value)}
          required
        />
        <label htmlFor="phone">Teléfono</label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="614 000 0000"
          value={fields.telefono}
          onChange={(event) => update('telefono', event.target.value)}
          required
        />
        <label htmlFor="register-password">
          Contraseña <span className="field-hint">6 caracteres mínimo</span>
        </label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          placeholder="Crea una contraseña"
          value={fields.contrasena}
          onChange={(event) => update('contrasena', event.target.value)}
          required
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button button-dark button-full auth-submit"
          disabled={submitting}
        >
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'} <span>↗</span>
        </button>
      </form>
    </AuthShell>
  );
}
