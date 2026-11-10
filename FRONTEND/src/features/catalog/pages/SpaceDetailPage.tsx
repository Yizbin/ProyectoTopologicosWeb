import { useEffect, useState } from 'react';
import type { SpaceSummary } from '../../../shared/api/contracts.js';
import { api, ApiClientError } from '../../../shared/api/client.js';
import {
  ErrorState,
  LoadingState,
} from '../../../shared/components/AsyncStates.js';
import { Link } from '../../../app/navigation-link.js';

export function SpaceDetailPage({ id }: { id: string }) {
  const [space, setSpace] = useState<SpaceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <Link
            to="/login?returnTo=%2Freservations"
            className="button button-dark button-full"
          >
            Iniciar una reserva <span>↗</span>
          </Link>
        </aside>
      </div>
    </section>
  );
}
