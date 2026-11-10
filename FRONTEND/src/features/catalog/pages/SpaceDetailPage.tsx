import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../../shared/api/client';
import type {
  ApiError,
  BloqueHorario,
  DisponibilidadDia,
  Espacio,
  HorarioAtencion,
} from '../../../shared/api/types';
import { AsyncStateContainer } from '../../../shared/components/AsyncStateContainer';
import { BookingForm } from '../../booking/components/BookingForm';

const WEEKDAY_NAMES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeApiError(cause: unknown, fallbackMessage: string): ApiError {
  if (
    cause &&
    typeof cause === 'object' &&
    'message' in cause &&
    'tipoError' in cause
  ) {
    return cause as ApiError;
  }
  return {
    message: fallbackMessage,
    tipoError: 'UnexpectedError',
  };
}

export function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [horarios, setHorarios] = useState<HorarioAtencion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const todayIso = useMemo(() => getTodayIsoDate(), []);
  const requestedDate = searchParams.get('fecha');
  const initialDate =
    requestedDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) &&
      requestedDate >= todayIso
      ? requestedDate
      : todayIso;

  const [availabilityDate, setAvailabilityDate] = useState(initialDate);
  const [disponibilidad, setDisponibilidad] =
    useState<DisponibilidadDia | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<ApiError | null>(
    null,
  );
  const [selectedSlot, setSelectedSlot] = useState<BloqueHorario | null>(null);

  const loadSpaceDetail = useCallback(async () => {
    if (!id) {
      setError({
        message: 'No se especificó el identificador del espacio.',
        tipoError: 'BadRequestException',
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSelectedSlot(null);
    setDisponibilidad(null);
    setAvailabilityError(null);

    try {
      const encodedId = encodeURIComponent(id);
      const [spaceData, scheduleData] = await Promise.all([
        apiClient.get<Espacio>(`/espacios/${encodedId}`),
        apiClient.get<HorarioAtencion[]>(`/espacios/${encodedId}/horarios`),
      ]);
      setEspacio(spaceData);
      setHorarios(scheduleData);
    } catch (cause) {
      setError(
        normalizeApiError(
          cause,
          'No pudimos cargar los detalles del espacio solicitado.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const loadAvailability = useCallback(
    async (fecha: string) => {
      if (!id || !fecha) return;
      setIsLoadingAvailability(true);
      setAvailabilityError(null);

      try {
        const data = await apiClient.get<DisponibilidadDia>(
          `/espacios/${encodeURIComponent(id)}/disponibilidad`,
          { params: { fecha } },
        );
        setDisponibilidad(data);
      } catch (cause) {
        setAvailabilityError(
          normalizeApiError(
            cause,
            'No pudimos consultar la disponibilidad para esa fecha.',
          ),
        );
      } finally {
        setIsLoadingAvailability(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void loadSpaceDetail();
  }, [loadSpaceDetail]);

  useEffect(() => {
    if (espacio) {
      void loadAvailability(availabilityDate);
    }
  }, [espacio, availabilityDate, loadAvailability]);

  const sortedHorarios = useMemo(() => {
    return [...horarios].sort(
      (a, b) =>
        a.diaSemana - b.diaSemana ||
        a.horaApertura.localeCompare(b.horaApertura),
    );
  }, [horarios]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-[#23312b]"
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
      </div>

      <AsyncStateContainer
        isLoading={isLoading}
        error={error}
        hasData={Boolean(espacio)}
        loadingMessage="Cargando detalles y horarios del espacio…"
        emptyTitle="Espacio no disponible"
        emptyMessage="No encontramos información para el espacio solicitado."
        onRetry={() => void loadSpaceDetail()}
        emptyAction={
          <Link
            to="/"
            className="inline-flex items-center rounded-xl bg-[#23312b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#354b42]"
          >
            Explorar otros espacios
          </Link>
        }
      >
        {espacio && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-7">
              <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full bg-[#e4e9e0] px-3 py-1 text-xs font-semibold text-[#23312b]">
                    {espacio.tipo}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      espacio.activo
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {espacio.activo ? 'Disponible para reserva' : 'Inactivo'}
                  </span>
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                  {espacio.nombre}
                </h1>
                <p className="mt-3 text-base leading-relaxed text-stone-600">
                  {espacio.descripcion}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-stone-50 p-3.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                      Capacidad
                    </span>
                    <strong className="mt-1 block text-sm font-semibold text-stone-900">
                      Hasta {espacio.capacidadMaxima} personas
                    </strong>
                  </div>
                  <div className="rounded-2xl bg-stone-50 p-3.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                      Bloque mínimo
                    </span>
                    <strong className="mt-1 block text-sm font-semibold text-stone-900">
                      {espacio.duracionMinutos} minutos
                    </strong>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-stone-50 p-3.5 sm:col-span-1">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                      Rango permitido
                    </span>
                    <strong className="mt-1 block text-sm font-semibold text-stone-900">
                      {espacio.minimoHorasReserva} h –{' '}
                      {espacio.maximoHorasReserva} h
                    </strong>
                  </div>
                </div>

                <div className="mt-8 border-t border-stone-100 pt-6">
                  <h2 className="text-lg font-semibold text-stone-900">
                    Amenidades incluidas
                  </h2>
                  {espacio.amenidades.length === 0 ? (
                    <p className="mt-2 text-sm text-stone-500">
                      Este espacio cuenta con equipamiento estándar.
                    </p>
                  ) : (
                    <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {espacio.amenidades.map((amenidad) => (
                        <li
                          key={amenidad}
                          className="flex items-center gap-2.5 rounded-xl border border-stone-200/80 bg-stone-50/70 px-3.5 py-2.5 text-sm text-stone-800"
                        >
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 text-[#526e5c]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>{amenidad}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs sm:p-8">
                <h2 className="text-lg font-semibold text-stone-900">
                  Horarios de atención
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Días y franjas de apertura y cierre configurados para este
                  espacio.
                </p>

                {sortedHorarios.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
                    Aún no hay horarios de atención configurados para este
                    espacio.
                  </p>
                ) : (
                  <div className="mt-4 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-stone-50/50">
                    {sortedHorarios.map((horario) => (
                      <div
                        key={horario.id}
                        className="flex items-center justify-between px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-stone-800">
                          {WEEKDAY_NAMES[horario.diaSemana] ??
                            `Día ${horario.diaSemana}`}
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#526e5c]">
                          {horario.horaApertura} – {horario.horaCierre}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 border-t border-stone-100 pt-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-stone-900">
                        Bloques libres por fecha
                      </h3>
                      <p className="text-xs text-stone-500">
                        Haz clic en un bloque libre para cargarlo en el
                        formulario de reserva.
                      </p>
                    </div>
                    <input
                      type="date"
                      aria-label="Fecha para consultar disponibilidad"
                      min={todayIso}
                      value={availabilityDate}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) return;
                        setAvailabilityDate(value);
                        setSelectedSlot(null);
                      }}
                      className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#526e5c]"
                    />
                  </div>

                  <div className="mt-4">
                    <AsyncStateContainer
                      isLoading={isLoadingAvailability}
                      error={availabilityError}
                      hasData={Boolean(
                        disponibilidad && disponibilidad.libres.length > 0,
                      )}
                      loadingMessage="Consultando bloques disponibles…"
                      emptyTitle="Sin bloques disponibles"
                      emptyMessage={
                        !espacio.activo
                          ? 'Este espacio se encuentra temporalmente inactivo para nuevas reservaciones.'
                          : disponibilidad && !disponibilidad.abierto
                            ? 'El espacio no abre en el día seleccionado.'
                            : 'Todos los horarios están ocupados o bloqueados para esta fecha.'
                      }
                      onRetry={() => void loadAvailability(availabilityDate)}
                    >
                      {disponibilidad && (
                        <div className="flex flex-wrap gap-2">
                          {disponibilidad.libres.map((bloque) => {
                            const isSelected =
                              selectedSlot?.horaInicio === bloque.horaInicio &&
                              selectedSlot?.horaFin === bloque.horaFin;
                            return (
                              <button
                                key={`${bloque.horaInicio}-${bloque.horaFin}`}
                                type="button"
                                onClick={() => setSelectedSlot(bloque)}
                                className={`rounded-xl border px-3.5 py-2 font-mono text-xs font-semibold transition ${
                                  isSelected
                                    ? 'border-[#23312b] bg-[#23312b] text-white'
                                    : 'border-stone-300 bg-stone-50 text-stone-800 hover:border-[#526e5c] hover:bg-emerald-50'
                                }`}
                              >
                                {bloque.horaInicio} – {bloque.horaFin}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </AsyncStateContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-8">
                <BookingForm
                  espacio={espacio}
                  selectedDate={availabilityDate}
                  selectedSlot={selectedSlot}
                  onBooked={() => {
                    setSelectedSlot(null);
                    void loadAvailability(availabilityDate);
                  }}
                />
              </div>
            </div>
          </div>
        )}
    </AsyncStateContainer>
    </section >
  );
}

