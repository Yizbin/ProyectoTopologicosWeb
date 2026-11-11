import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../shared/api/client';
import type { ApiError, CancelarReservacionResponse, Espacio, EstadoReservacion, Reservacion, } from '../../../shared/api/types';
import { AsyncStateContainer } from '../../../shared/components/AsyncStateContainer';
import { useSession } from '../../auth/SessionProvider';
import { PaymentModal } from '../components/PaymentModal';
import { normalizeApiError, translateBookingError, } from '../utils/domainErrors';

const STATUS_BADGE_CLASSES: Record<EstadoReservacion, string> = {
  pendiente: 'bg-amber-100 text-amber-900 ring-amber-200',
  confirmada: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  completada: 'bg-sky-100 text-sky-900 ring-sky-200',
  cancelada: 'bg-stone-200 text-stone-700 ring-stone-300',
};

const STATUS_LABELS: Record<EstadoReservacion, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

function formatDate(value: Date | string): string {
  const iso =
    typeof value === 'string'
      ? value.slice(0, 10)
      : value.toISOString().slice(0, 10);
  const [year, month, day] = iso.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(utcDate);
}

function getIsoDateOnly(value: Date | string): string {
  return typeof value === 'string'
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
}

function getEffectiveEstado(reservacion: Reservacion): EstadoReservacion {
  return reservacion.estado;
}

export function MyBookingsPage() {
  const { user } = useSession();

  const [reservaciones, setReservaciones] = useState<Reservacion[]>([]);
  const [espaciosMap, setEspaciosMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [statusFilter, setStatusFilter] = useState<'todas' | EstadoReservacion>(
    'todas',
  );
  const [dateFilter, setDateFilter] = useState('');

  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedReservationForPayment, setSelectedReservationForPayment] =
    useState<Reservacion | null>(null);
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const [bookingsResult, spacesResult] = await Promise.allSettled([
        apiClient.get<Reservacion[]>(
          `/reservaciones/cliente/${encodeURIComponent(user.id)}`,
        ),
        apiClient.get<Espacio[]>('/espacios', { params: { activo: false } }),
      ]);

      if (bookingsResult.status === 'rejected') {
        throw bookingsResult.reason;
      }

      setReservaciones(bookingsResult.value);

      if (spacesResult.status === 'fulfilled') {
        const lookup: Record<string, string> = {};
        for (const space of spacesResult.value) {
          lookup[space.id] = space.nombre;
        }
        setEspaciosMap(lookup);
      }
    } catch (cause) {
      setError(
        normalizeApiError(
          cause,
          'No pudimos cargar tu historial de reservaciones.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const handleCancelReservation = async (id: string) => {
    setActionError(null);
    setActionSuccess(null);
    setCancellingId(id);

    try {
      const response = await apiClient.patch<CancelarReservacionResponse>(
        `/reservaciones/${encodeURIComponent(id)}/cancelar`,
      );

      setReservaciones((prev) =>
        prev.map((item) =>
          item.id === id
            ? (response.reservacion ?? { ...item, estado: 'cancelada' })
            : item,
        ),
      );
      setConfirmCancelId(null);
      setActionSuccess(
        response.mensaje ||
          'Reservación cancelada. El horario ya quedó liberado.',
      );
    } catch (cause) {
      setActionError(
        normalizeApiError(cause, 'No pudimos cancelar la reservación.'),
      );
    } finally {
      setCancellingId(null);
    }
  };

  const filteredReservations = useMemo(() => {
    return reservaciones.filter((item) => {
      if (statusFilter !== 'todas' && getEffectiveEstado(item) !== statusFilter) {
        return false;
      }
      if (dateFilter && getIsoDateOnly(item.fecha) !== dateFilter) {
        return false;
      }
      return true;
    });
  }, [reservaciones, statusFilter, dateFilter]);

  const hasActiveFilters = statusFilter !== 'todas' || dateFilter !== '';

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#526e5c]">
            Tu agenda personal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Mis reservaciones
          </h1>
          <p className="mt-1.5 text-sm text-stone-600">
            Consulta el estado de tus citas y cancela reservas activas cuando
            cambien tus planes.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#23312b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#354b42]"
        >
          Explorar espacios
        </Link>
      </div>

      {actionSuccess && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          <span>{actionSuccess}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950"
          >
            ×
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          <div className="flex flex-wrap items-center gap-2">
            <strong className="font-semibold">
              No se pudo cancelar la reservación
            </strong>
            <span className="rounded-full bg-red-100 px-2 py-0.5 font-mono text-xs text-red-800">
              {actionError.tipoError}
            </span>
          </div>
          <p className="mt-1 text-red-800">
            {translateBookingError(actionError)}
          </p>
        </div>
      )}

      <AsyncStateContainer
        isLoading={isLoading}
        error={error}
        hasData={reservaciones.length > 0}
        loadingMessage="Cargando tu historial de reservaciones…"
        emptyTitle="Sin reservaciones registradas"
        emptyMessage="Aún no tienes reservaciones. ¡Explora nuestros espacios!"
        onRetry={() => void loadBookings()}
        emptyAction={
          <Link
            to="/"
            className="inline-flex items-center rounded-xl bg-[#23312b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#354b42]"
          >
            Ver catálogo de espacios
          </Link>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="filter-status"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-600"
              >
                Filtrar por estado
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as 'todas' | EstadoReservacion,
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#526e5c]"
              >
                <option value="todas">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="filter-date"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-600"
              >
                Filtrar por fecha
              </label>
              <input
                id="filter-date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#526e5c]"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('todas');
                  setDateFilter('');
                }}
                className="rounded-xl border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {filteredReservations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
              <h2 className="text-base font-semibold text-stone-800">
                Ninguna reservación coincide con tu filtro
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Prueba quitando el filtro de fecha o cambiando el estado
                seleccionado.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('todas');
                  setDateFilter('');
                }}
                className="mt-4 inline-flex items-center rounded-xl bg-[#23312b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#354b42]"
              >
                Mostrar todas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredReservations.map((reservacion) => {
                const spaceName =
                  espaciosMap[reservacion.espacioId] ??
                  `Espacio #${reservacion.espacioId.slice(0, 8)}`;
                const effectiveEstado = getEffectiveEstado(reservacion);
                const hasPayment = Boolean(reservacion.pagoId);
                const canPay = effectiveEstado === 'pendiente' && !hasPayment;
                const canCancel =
                  effectiveEstado === 'pendiente' ||
                  effectiveEstado === 'confirmada';
                const isConfirming = confirmCancelId === reservacion.id;
                const isCancelling = cancellingId === reservacion.id;

                return (
                  <article
                    key={reservacion.id}
                    className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-xs transition hover:border-stone-300"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                              STATUS_BADGE_CLASSES[effectiveEstado]
                            }`}
                          >
                            {STATUS_LABELS[effectiveEstado]}
                          </span>
                          {hasPayment && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-700 ring-1 ring-inset ring-stone-200">
                              <svg
                                aria-hidden="true"
                                className="h-3 w-3 text-emerald-600"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Pago registrado
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-xs text-stone-400">
                          #{reservacion.id.slice(0, 8)}
                        </span>
                      </div>

                      <h2 className="mt-4 text-lg font-semibold text-stone-900">
                        <Link
                          to={`/espacios/${encodeURIComponent(reservacion.espacioId)}`}
                          className="hover:text-[#526e5c] hover:underline"
                        >
                          {spaceName}
                        </Link>
                      </h2>

                      <div className="mt-3 space-y-1.5 text-sm text-stone-600">
                        <p className="flex items-center gap-2">
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4 text-stone-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="18"
                              rx="2"
                            />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>{formatDate(reservacion.fecha)}</span>
                        </p>

                        <p className="flex items-center gap-2">
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4 text-stone-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>
                            {reservacion.horaInicio} – {reservacion.horaFin} ·{' '}
                            {reservacion.cantidadPersonas}{' '}
                            {reservacion.cantidadPersonas === 1
                              ? 'persona'
                              : 'personas'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
                      <div>
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                          Subtotal
                        </span>
                        <strong className="text-lg font-bold text-[#23312b]">
                          ${reservacion.subtotal} MXN
                        </strong>
                      </div>

                      {(canPay || canCancel) && (
                        <div>
                          {isConfirming ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isCancelling}
                                onClick={() =>
                                  void handleCancelReservation(reservacion.id)
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                              >
                                {isCancelling
                                  ? 'Cancelando…'
                                  : 'Sí, cancelar'}
                              </button>
                              <button
                                type="button"
                                disabled={isCancelling}
                                onClick={() => setConfirmCancelId(null)}
                                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100"
                              >
                                Volver
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {canPay && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionError(null);
                                    setActionSuccess(null);
                                    setConfirmCancelId(null);
                                    setSelectedReservationForPayment(
                                      reservacion,
                                    );
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
                                >
                                  <svg
                                    aria-hidden="true"
                                    className="h-3.5 w-3.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <rect
                                      x="2"
                                      y="5"
                                      width="20"
                                      height="14"
                                      rx="2"
                                    />
                                    <line x1="2" y1="10" x2="22" y2="10" />
                                  </svg>
                                  Pagar en línea
                                </button>
                              )}

                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionError(null);
                                    setActionSuccess(null);
                                    setConfirmCancelId(reservacion.id);
                                  }}
                                  className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                                >
                                  Cancelar reservación
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </AsyncStateContainer>

      <PaymentModal
        isOpen={selectedReservationForPayment !== null}
        reservacion={selectedReservationForPayment}
        spaceName={
          selectedReservationForPayment
            ? espaciosMap[selectedReservationForPayment.espacioId]
            : undefined
        }
        onClose={() => setSelectedReservationForPayment(null)}
        onPaymentSuccess={() => {
          setActionError(null);
          setActionSuccess(
            'Pago registrado con éxito. Consulta el estado actual de tu reservación.',
          );
          void loadBookings();
        }}
      />
    </section>
  );
}

