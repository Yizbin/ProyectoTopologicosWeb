import { useEffect, useState, type FormEvent } from 'react';
import type { SpaceSummary } from '../../../shared/api/contracts.js';
import { api, ApiClientError } from '../../../shared/api/client.js';
import {
  ErrorState,
  LoadingState,
} from '../../../shared/components/AsyncStates.js';
import { Link } from '../../../app/navigation-link.js';
import { useSession } from '../../../app/SessionProvider.js';
import { navigate } from '../../../app/navigation.js';

export function SpaceDetailPage({ id }: { id: string }) {
  const { user } = useSession();
  const [space, setSpace] = useState<SpaceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario de reserva adaptados al DTO del backend
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('10:00');
  const [personas, setPersonas] = useState(1);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<SpaceSummary>(`/espacios/${encodeURIComponent(id)}`)
      .then((value) => {
        if (active) setSpace(value);
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
  }, [id]);

  const handleBookingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!space) return;
    setBookingError(null);

    if (!user) {
      const returnTo = encodeURIComponent(window.location.pathname);
      navigate(`/login?returnTo=${returnTo}`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reservaciones', {
        espacioId: space.id,
        fecha, // "YYYY-MM-DD"
        horaInicio, // "HH:mm"
        horaFin, // "HH:mm"
        cantidadPersonas: Number(personas),
      });

      navigate('/reservations');
    } catch (cause) {
      if (cause instanceof ApiClientError) {
        if (Array.isArray(cause.message)) {
          setBookingError(cause.message.join(', '));
        } else {
          setBookingError(cause.message);
        }
      } else {
        setBookingError('No se pudo crear la reserva. Inténtalo de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="page-wrap">
        <LoadingState label="Abriendo los detalles del espacio…" />
      </div>
    );
  if (error)
    return (
      <div className="page-wrap">
        <ErrorState message={error} />
      </div>
    );
  if (!space)
    return (
      <div className="page-wrap">
        <ErrorState message="No encontramos ese espacio." />
      </div>
    );

  return (
    <section className="detail-page page-wrap">
      <Link to="/spaces" className="back-link">
        ← Volver a explorar
      </Link>
      <div className="detail-cover">
        <span className="space-type">{space.tipo}</span>
        <span className="detail-cover-art" aria-hidden="true">
          ⌂
        </span>
      </div>
      <div className="detail-content">
        <div>
          <span className="eyebrow eyebrow-muted">UN LUGAR PARA TUS IDEAS</span>
          <h1>{space.nombre}</h1>
          <p className="detail-description">{space.descripcion}</p>
          <div className="detail-facts">
            <span>♧ Hasta {space.capacidadMaxima} personas</span>
            <span>◷ Bloques de {space.duracionMinutos} minutos</span>
          </div>
          <h2>Lo que encontrarás</h2>
          <div className="amenity-list">
            {space.amenidades.map((amenity) => (
              <span key={amenity}>{amenity}</span>
            ))}
          </div>
        </div>
        <aside className="booking-card">
          <span>Desde</span>
          <strong>
            ${space.costoPorHora}
            <small> MXN / hora</small>
          </strong>
          <p>
            La reserva se confirma al elegir el horario que mejor te convenga.
          </p>

          <form onSubmit={handleBookingSubmit} className="booking-form">
            <div className="booking-field">
              <label htmlFor="booking-date">Fecha</label>
              <input
                id="booking-date"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>

            <div className="booking-form-row">
              <div className="booking-field">
                <label htmlFor="booking-start">Hora Inicio</label>
                <input
                  id="booking-start"
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  required
                />
              </div>

              <div className="booking-field">
                <label htmlFor="booking-end">Hora Fin</label>
                <input
                  id="booking-end"
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="booking-field">
              <label htmlFor="booking-people">Personas</label>
              <input
                id="booking-people"
                type="number"
                min={1}
                max={space.capacidadMaxima}
                value={personas}
                onChange={(e) => setPersonas(parseInt(e.target.value, 10) || 1)}
                required
              />
            </div>

            {bookingError && (
              <p className="form-error" role="alert">
                {bookingError}
              </p>
            )}

            <button
              type="submit"
              className="button button-dark button-full"
              disabled={submitting}
            >
              {submitting ? 'Reservando…' : 'Confirmar Reserva'} <span>↗</span>
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}