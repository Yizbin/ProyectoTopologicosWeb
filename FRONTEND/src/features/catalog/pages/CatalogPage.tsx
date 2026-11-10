import { useCallback, useEffect, useState } from 'react';
import type { SpaceSummary } from '../../../shared/api/contracts.js';
import { api, ApiClientError } from '../../../shared/api/client.js';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/AsyncStates.js';
import { Link } from '../../../app/navigation-link.js';

export function CatalogPage() {
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSpaces(await api.get<SpaceSummary[]>('/espacios'));
    } catch (cause) {
      setError(
        cause instanceof ApiClientError
          ? cause.message
          : 'Inténtalo de nuevo en un momento.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">
            <span className="eyebrow-dot" /> LUGARES PARA HACER QUE PASE
          </span>
          <h1>
            Un buen espacio
            <br />
            cambia <em>todo.</em>
          </h1>
          <p>
            Encuentra el lugar perfecto para reunirte, concentrarte o crear algo
            nuevo.
          </p>
          <a className="button button-light hero-button" href="#spaces">
            Explorar espacios <span aria-hidden="true">↓</span>
          </a>
          <div className="hero-note">
            <span className="note-stars">★★★★★</span>
            <span>Espacios listos para tus ideas</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-sun" />
          <div className="art-frame">
            <div className="art-window" />
            <div className="art-table" />
            <div className="art-chair" />
            <div className="art-plant">
              <i />
              <i />
              <i />
              <b />
            </div>
            <div className="art-lamp" />
          </div>
          <span className="art-label">01 / ENCUENTRA TU LUGAR</span>
        </div>
        <div className="hero-side-label">
          DISEÑADO PARA TU PRÓXIMO GRAN MOMENTO
        </div>
      </section>

      <section className="catalog-section" id="spaces">
        <div className="section-heading">
          <div>
            <span className="eyebrow eyebrow-muted">EL CATÁLOGO</span>
            <h2>Espacios para cada plan</h2>
          </div>
          <span className="section-caption">Encuentra el tuyo</span>
        </div>
        {loading ? (
          <LoadingState label="Buscando espacios disponibles…" />
        ) : error ? (
          <ErrorState message={error} retry={() => void load()} />
        ) : spaces.length === 0 ? (
          <EmptyState
            title="Aún no hay espacios disponibles"
            message="Vuelve pronto; estamos preparando nuevos lugares para ti."
          />
        ) : (
          <div className="space-grid">
            {spaces.map((space, index) => (
              <article className="space-card" key={space.id}>
                <Link
                  to={`/spaces/${encodeURIComponent(space.id)}`}
                  className={`space-image space-image-${index % 3}`}
                  aria-label={`Ver ${space.nombre}`}
                >
                  <span className="space-type">{space.tipo}</span>
                  <span className="space-image-number">0{index + 1}</span>
                  <span className="space-image-art" aria-hidden="true">
                    {index % 3 === 1 ? '▱' : index % 3 === 2 ? '⌘' : '⌂'}
                  </span>
                </Link>
                <div className="space-card-body">
                  <div>
                    <h3>{space.nombre}</h3>
                    <p>
                      {space.capacidadMaxima} personas · {space.duracionMinutos}{' '}
                      min por bloque
                    </p>
                  </div>
                  <strong className="space-price">
                    ${space.costoPorHora}
                    <small>/hora</small>
                  </strong>
                </div>
                <div className="space-card-bottom">
                  <span>
                    {space.amenidades.slice(0, 2).join(' · ') ||
                      'Un espacio listo para ti'}
                  </span>
                  <Link
                    to={`/spaces/${encodeURIComponent(space.id)}`}
                    className="round-arrow"
                    aria-label={`Ver detalles de ${space.nombre}`}
                  >
                    ↗
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="closing-banner">
        <div>
          <span className="eyebrow">TU SIGUIENTE CAPÍTULO</span>
          <h2>
            Las buenas ideas
            <br />
            merecen un buen lugar.
          </h2>
        </div>
        <Link to="/register" className="button button-light">
          Empieza aquí <span>↗</span>
        </Link>
      </section>
    </>
  );
}
