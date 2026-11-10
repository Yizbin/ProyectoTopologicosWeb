import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../shared/api/client';
import type {
  ApiError,
  BuscarEspaciosParams,
  EspacioConDisponibilidad,
  TipoEspacio,
} from '../../../shared/api/types';
import { AsyncStateContainer } from '../../../shared/components/AsyncStateContainer';

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
    message: 'No pudimos cargar el catálogo de espacios.',
    tipoError: 'UnexpectedError',
  };
}

function SpaceTypeIcon({ tipo }: { tipo: TipoEspacio }) {
  if (tipo === 'Sala') {
    return (
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
        <path d="M9 9v.01" />
        <path d="M9 12v.01" />
        <path d="M9 15v.01" />
      </svg>
    );
  }
  if (tipo === 'Cubiculo') {
    return (
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="4" width="16" height="14" rx="2" />
        <path d="M9 21h6" />
        <path d="M12 18v3" />
      </svg>
    );
  }
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

export function CatalogPage() {
  const [espacios, setEspacios] = useState<EspacioConDisponibilidad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const todayIso = useMemo(() => getTodayIsoDate(), []);
  const [fechaFilter, setFechaFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'' | TipoEspacio>('');
  const [capacidadFilter, setCapacidadFilter] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<BuscarEspaciosParams>(
    {},
  );

  const loadEspacios = useCallback(async (params: BuscarEspaciosParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const hasParams = Object.keys(params).length > 0;
      const data = await apiClient.get<EspacioConDisponibilidad[]>(
        '/espacios',
        hasParams ? { params } : undefined,
      );
      setEspacios(data);
    } catch (cause) {
      setError(normalizeApiError(cause));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEspacios(appliedFilters);
  }, [appliedFilters, loadEspacios]);

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: BuscarEspaciosParams = {};
    if (fechaFilter) next.fecha = fechaFilter;
    if (tipoFilter) next.tipo = tipoFilter;
    const cap = Number.parseInt(capacidadFilter, 10);
    if (!Number.isNaN(cap) && cap > 0) next.capacidad = cap;
    setAppliedFilters(next);
  };

  const handleClearFilters = () => {
    setFechaFilter('');
    setTipoFilter('');
    setCapacidadFilter('');
    setAppliedFilters({});
  };

  const hasFilters = Object.keys(appliedFilters).length > 0;

  return (
    <div>
      <section className="border-b border-stone-200/80 bg-[#23312b] text-[#f6f5f0]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e4b390]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e4b390]" />
              Espacios disponibles para reservar
            </span>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Un buen espacio cambia{' '}
              <span className="text-[#e4b390]">todo.</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-300">
              Explora nuestras salas de juntas, cubículos privados y estaciones
              de cómputo. Consulta disponibilidad por horario y aparta tu lugar
              en minutos.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#catalogo-espacios"
                className="inline-flex items-center gap-2 rounded-xl bg-[#f4eadc] px-5 py-3 text-sm font-semibold text-[#23312b] transition hover:bg-white"
              >
                Explorar espacios
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
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </a>
            </div>
          </div>

          <div className="hidden lg:col-span-5 lg:block">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wider text-stone-300">
                    Salas equipadas
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    Trabajo en equipo
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wider text-stone-300">
                    Cubículos
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    Enfoque sin ruido
                  </p>
                </div>
                <div className="col-span-2 flex items-center justify-between rounded-2xl border border-white/10 bg-[#526e5c]/40 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#e4b390]">
                      Agenda en tiempo real
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-white">
                      Bloques horarios transparentes y sin empalmes
                    </p>
                  </div>
                  <svg
                    aria-hidden="true"
                    className="h-8 w-8 shrink-0 text-[#e4b390]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path d="m9 16 2 2 4-4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="catalogo-espacios"
        className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14"
      >
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#526e5c]">
              El catálogo
            </p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
              Espacios para cada plan
            </h2>
          </div>

          <form
            onSubmit={handleFilterSubmit}
            className="flex flex-wrap items-end gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xs"
          >
            <div>
              <label
                htmlFor="catalog-date"
                className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600"
              >
                Fecha
              </label>
              <input
                id="catalog-date"
                type="date"
                min={todayIso}
                value={fechaFilter}
                onChange={(e) => setFechaFilter(e.target.value)}
                className="mt-1 rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#526e5c]"
              />
            </div>

            <div>
              <label
                htmlFor="catalog-type"
                className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600"
              >
                Tipo
              </label>
              <select
                id="catalog-type"
                value={tipoFilter}
                onChange={(e) =>
                  setTipoFilter(e.target.value as '' | TipoEspacio)
                }
                className="mt-1 rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#526e5c]"
              >
                <option value="">Todos</option>
                <option value="Sala">Sala</option>
                <option value="Cubiculo">Cubículo</option>
                <option value="PC">PC</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="catalog-capacity"
                className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600"
              >
                Capacidad mín.
              </label>
              <input
                id="catalog-capacity"
                type="number"
                min={1}
                placeholder="Ej. 4"
                value={capacidadFilter}
                onChange={(e) => setCapacidadFilter(e.target.value)}
                className="mt-1 w-28 rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#526e5c]"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[#23312b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#354b42]"
            >
              Filtrar
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              >
                Limpiar
              </button>
            )}
          </form>
        </div>

        <AsyncStateContainer
          isLoading={isLoading}
          error={error}
          hasData={espacios.length > 0}
          loadingMessage="Buscando espacios disponibles…"
          emptyTitle="No hay espacios para mostrar"
          emptyMessage={
            hasFilters
              ? 'No encontramos espacios disponibles con esos filtros. Prueba ampliando la capacidad o cambiando el tipo.'
              : 'Aún no hay espacios activos disponibles en este momento.'
          }
          onRetry={() => void loadEspacios(appliedFilters)}
          emptyAction={
            hasFilters ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center rounded-xl bg-[#23312b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#354b42]"
              >
                Ver todos los espacios
              </button>
            ) : undefined
          }
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {espacios.map((espacio) => (
              <article
                key={espacio.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/90 px-5 py-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#23312b] ring-1 ring-stone-200">
                      <span className="text-[#526e5c]">
                        <SpaceTypeIcon tipo={espacio.tipo} />
                      </span>
                      {espacio.tipo}
                    </span>

                    <span className="text-xs font-medium text-stone-500">
                      Hasta {espacio.capacidadMaxima}{' '}
                      {espacio.capacidadMaxima === 1 ? 'persona' : 'personas'}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-stone-900">
                      {espacio.nombre}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">
                      {espacio.descripcion}
                    </p>

                    {espacio.horariosLibres && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        {espacio.horariosLibres.length}{' '}
                        {espacio.horariosLibres.length === 1
                          ? 'bloque libre ese día'
                          : 'bloques libres ese día'}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {espacio.amenidades.slice(0, 3).map((amenidad) => (
                        <span
                          key={amenidad}
                          className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700"
                        >
                          {amenidad}
                        </span>
                      ))}
                      {espacio.amenidades.length > 3 && (
                        <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
                          +{espacio.amenidades.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-5 py-4">
                  <div>
                    <span className="block text-[11px] font-medium text-stone-500">
                      Bloques de {espacio.duracionMinutos} min
                    </span>
                    <strong className="text-lg font-bold text-[#23312b]">
                      ${espacio.costoPorHora}
                      <span className="text-xs font-normal text-stone-500">
                        {' '}
                        MXN/hora
                      </span>
                    </strong>
                  </div>

                  <Link
                    to={
                      appliedFilters.fecha
                        ? `/espacios/${encodeURIComponent(espacio.id)}?fecha=${encodeURIComponent(appliedFilters.fecha)}`
                        : `/espacios/${encodeURIComponent(espacio.id)}`
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#23312b] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#354b42]"
                  >
                    Ver detalles
                    <svg
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </AsyncStateContainer>
      </section>
    </div>
  );
}

