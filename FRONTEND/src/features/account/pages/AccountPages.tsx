import { useEffect, useState } from 'react';
import type { ReservationSummary } from '../../../../../src/shared/api-contracts.js';
import { useSession } from '../../../app/SessionProvider.js';
import { Link } from '../../../app/navigation-link.js';
import { api, ApiClientError } from '../../../shared/api/client.js';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/AsyncStates.js';

export function AccountPage() {
  const { user } = useSession();
  if (!user) return null;
  return (
    <section className="account-page page-wrap">
      <span className="eyebrow eyebrow-muted">TU ESPACIO PERSONAL</span>
      <h1>Hola, {user.nombre.split(' ')[0]}.</h1>
      <p className="account-intro">
        Aquí tienes los datos de tu cuenta en Casa Norte.
      </p>
      <div className="profile-card">
        <span className="avatar avatar-large">
          {user.nombre.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <span className="profile-label">NOMBRE</span>
          <strong>{user.nombre}</strong>
        </div>
        <div>
          <span className="profile-label">CORREO</span>
          <strong>{user.correo}</strong>
        </div>
        <div>
          <span className="profile-label">TELÉFONO</span>
          <strong>Disponible en tu perfil del servicio</strong>
        </div>
      </div>
      <Link to="/reservations" className="button button-dark">
        Ver mis reservas <span>↗</span>
      </Link>
    </section>
  );
}

function formatDate(value: string | Date) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(date);
}

export function ReservationsPage() {
  const { user } = useSession();
  const [reservations, setReservations] = useState<ReservationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    api
      .get<ReservationSummary[]>(
        `/reservaciones/cliente/${encodeURIComponent(user.id)}`,
      )
      .then((value) => {
        if (active) setReservations(value);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof ApiClientError
              ? cause.message
              : 'Inténtalo de nuevo.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <section className="account-page page-wrap">
      <span className="eyebrow eyebrow-muted">TU AGENDA</span>
      <h1>Mis reservas.</h1>
      <p className="account-intro">Tus planes, todos en un mismo lugar.</p>
      {loading ? (
        <LoadingState label="Cargando tus reservas…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : reservations.length === 0 ? (
        <EmptyState
          title="Todavía no tienes reservas"
          message="Explora los espacios y encuentra uno para tu próximo plan."
        />
      ) : (
        <div className="reservation-list">
          {reservations.map((reservation) => (
            <article className="reservation-card" key={reservation.id}>
              <span
                className={`reservation-status status-${reservation.estado}`}
              >
                {reservation.estado}
              </span>
              <h2>
                {reservation.horaInicio} – {reservation.horaFin}
              </h2>
              <p>
                {formatDate(reservation.fecha)} · {reservation.cantidadPersonas}{' '}
                {reservation.cantidadPersonas === 1 ? 'persona' : 'personas'}
              </p>
              <strong>${reservation.subtotal} MXN</strong>
              <span className="reservation-ref">
                Reserva {reservation.id.slice(0, 8)}
              </span>
            </article>
          ))}
        </div>
      )}
      <div className="browse-more">
        <span>¿Buscas otro lugar?</span>
        <Link to="/spaces">Explorar espacios ↗</Link>
      </div>
    </section>
  );
}
