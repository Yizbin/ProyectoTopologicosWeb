import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiClient } from '../../../shared/api/client';
import type {
  ApiError,
  BloqueHorario,
  CrearReservacionRequest,
  Espacio,
  Reservacion,
} from '../../../shared/api/types';
import { useSession } from '../../auth/SessionProvider';
import {
  normalizeApiError,
  translateBookingError,
} from '../utils/domainErrors';

export interface BookingFormProps {
  espacio: Espacio;
  selectedSlot?: BloqueHorario | null;
  selectedDate?: string;
  onBooked?: (reservacion: Reservacion) => void;
}

interface BookingFieldErrors {
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  cantidadPersonas?: string;
}

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function formatReadableDate(value: Date | string): string {
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

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function BookingForm({
  espacio,
  selectedSlot,
  selectedDate,
  onBooked,
}: BookingFormProps) {
  const { user } = useSession();
  const location = useLocation();
  const todayIso = useMemo(() => getTodayIsoDate(), []);

  const [fecha, setFecha] = useState(selectedDate ?? todayIso);
  const [horaInicio, setHoraInicio] = useState(selectedSlot?.horaInicio ?? '09:00');
  const [horaFin, setHoraFin] = useState(selectedSlot?.horaFin ?? '10:00');
  const [cantidadPersonas, setCantidadPersonas] = useState(1);

  const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({});
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReservation, setConfirmedReservation] =
    useState<Reservacion | null>(null);

  useEffect(() => {
    if (selectedDate) {
      setFecha(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedSlot) {
      setHoraInicio(selectedSlot.horaInicio);
      setHoraFin(selectedSlot.horaFin);
      setFieldErrors((prev) => ({
        ...prev,
        horaInicio: undefined,
        horaFin: undefined,
      }));
      setApiError(null);
      setConfirmedReservation(null);
    }
  }, [selectedSlot]);

  const estimatedHours = useMemo(() => {
    if (!TIME_PATTERN.test(horaInicio) || !TIME_PATTERN.test(horaFin)) {
      return 0;
    }
    const diff = timeToMinutes(horaFin) - timeToMinutes(horaInicio);
    return diff > 0 ? diff / 60 : 0;
  }, [horaInicio, horaFin]);

  const estimatedSubtotal = estimatedHours * espacio.costoPorHora;

  if (!user) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
          Acceso requerido
        </span>
        <h3 className="mt-4 text-xl font-semibold text-stone-900">
          Inicia sesión para reservar
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Para agendar{' '}
          <strong className="font-semibold text-stone-800">
            {espacio.nombre}
          </strong>{' '}
          necesitas una cuenta de cliente activa. Así podremos asociar esta
          reserva a tu historial.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/login"
            state={{ from: location.pathname }}
            className="inline-flex items-center justify-center rounded-xl bg-[#23312b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#354b42]"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/registro"
            className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
          >
            Crear una cuenta nueva
          </Link>
        </div>
      </div>
    );
  }

  const validate = (): boolean => {
    const errors: BookingFieldErrors = {};

    if (!fecha) {
      errors.fecha = 'Selecciona una fecha para tu reservación.';
    } else if (fecha < todayIso) {
      errors.fecha = 'No puedes reservar en una fecha anterior a hoy.';
    }

    if (!TIME_PATTERN.test(horaInicio)) {
      errors.horaInicio = 'Indica una hora de inicio válida (HH:mm).';
    }

    if (!TIME_PATTERN.test(horaFin)) {
      errors.horaFin = 'Indica una hora de fin válida (HH:mm).';
    } else if (TIME_PATTERN.test(horaInicio)) {
      const startMin = timeToMinutes(horaInicio);
      const endMin = timeToMinutes(horaFin);
      const durationMin = endMin - startMin;

      if (durationMin <= 0) {
        errors.horaFin = 'La hora de fin debe ser posterior a la de inicio.';
      } else {
        if (durationMin % espacio.duracionMinutos !== 0) {
          errors.horaFin = `El espacio se reserva en bloques exactos de ${espacio.duracionMinutos} minutos.`;
        } else {
          const hours = durationMin / 60;
          if (hours < espacio.minimoHorasReserva) {
            errors.horaFin = `El mínimo para este espacio es de ${espacio.minimoHorasReserva} hora(s).`;
          } else if (hours > espacio.maximoHorasReserva) {
            errors.horaFin = `El máximo permitido para este espacio es de ${espacio.maximoHorasReserva} hora(s).`;
          }
        }
      }
    }

    if (
      !Number.isInteger(cantidadPersonas) ||
      cantidadPersonas < 1
    ) {
      errors.cantidadPersonas = 'Debe haber al menos 1 persona.';
    } else if (cantidadPersonas > espacio.capacidadMaxima) {
      errors.cantidadPersonas = `La capacidad máxima es de ${espacio.capacidadMaxima} personas.`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    setConfirmedReservation(null);

    if (!validate()) return;

    const payload: CrearReservacionRequest = {
      fecha,
      horaInicio,
      horaFin,
      espacioId: espacio.id,
      cantidadPersonas,
    };

    setIsSubmitting(true);
    try {
      const created = await apiClient.post<Reservacion>(
        '/reservaciones',
        payload,
      );
      setConfirmedReservation(created);
      onBooked?.(created);
    } catch (cause) {
      setApiError(
        normalizeApiError(
          cause,
          'No se pudo registrar tu reservación. Inténtalo nuevamente.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmedReservation) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-6 text-emerald-950 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Reservación registrada
            </p>
            <h3 className="text-lg font-semibold text-emerald-950">
              ¡Tu lugar quedó apartado!
            </h3>
          </div>
        </div>

        <dl className="mt-5 space-y-2 rounded-xl border border-emerald-200/80 bg-white/80 p-4 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-stone-600">Fecha</dt>
            <dd className="font-semibold text-stone-900">
              {formatReadableDate(confirmedReservation.fecha)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-stone-600">Horario</dt>
            <dd className="font-semibold text-stone-900">
              {confirmedReservation.horaInicio} – {confirmedReservation.horaFin}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-stone-600">Personas</dt>
            <dd className="font-semibold text-stone-900">
              {confirmedReservation.cantidadPersonas}
            </dd>
          </div>
          <div className="flex justify-between gap-2 border-t border-stone-200 pt-2">
            <dt className="text-stone-600">Subtotal</dt>
            <dd className="font-bold text-[#23312b]">
              ${confirmedReservation.subtotal} MXN
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-col gap-2.5">
          <Link
            to="/mis-reservaciones"
            className="inline-flex items-center justify-center rounded-xl bg-[#23312b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#354b42]"
          >
            Ver mis reservaciones
          </Link>
          <button
            type="button"
            onClick={() => setConfirmedReservation(null)}
            className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100/60"
          >
            Hacer otra reservación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-baseline justify-between gap-2 border-b border-stone-100 pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Tarifa por hora
          </span>
          <p className="mt-0.5 text-2xl font-bold text-[#23312b]">
            ${espacio.costoPorHora}{' '}
            <span className="text-sm font-normal text-stone-500">MXN</span>
          </p>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
          Bloques de {espacio.duracionMinutos} min
        </span>
      </div>

      {!espacio.activo && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-900"
        >
          Este espacio aparece como inactivo actualmente y no admite reservas.
        </div>
      )}

      {apiError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          <div className="flex flex-wrap items-center gap-2">
            <strong className="font-semibold">
              No se pudo completar la reserva
            </strong>
            <span className="rounded-full bg-red-100 px-2 py-0.5 font-mono text-[11px] font-medium text-red-800">
              {apiError.tipoError}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-red-800">
            {translateBookingError(apiError)}
          </p>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="booking-date"
            className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
          >
            Fecha
          </label>
          <input
            id="booking-date"
            type="date"
            min={todayIso}
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              if (fieldErrors.fecha) {
                setFieldErrors((prev) => ({ ...prev, fecha: undefined }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.fecha)}
            className={`mt-1.5 w-full rounded-xl border bg-stone-50/70 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition focus:bg-white focus:ring-2 ${
              fieldErrors.fecha
                ? 'border-red-400 focus:ring-red-200'
                : 'border-stone-300 focus:border-[#526e5c] focus:ring-emerald-100'
            }`}
          />
          {fieldErrors.fecha && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {fieldErrors.fecha}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="booking-start"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
            >
              Hora inicio
            </label>
            <input
              id="booking-start"
              type="time"
              value={horaInicio}
              onChange={(e) => {
                setHoraInicio(e.target.value);
                if (fieldErrors.horaInicio) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    horaInicio: undefined,
                  }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.horaInicio)}
              className={`mt-1.5 w-full rounded-xl border bg-stone-50/70 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition focus:bg-white focus:ring-2 ${
                fieldErrors.horaInicio
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-stone-300 focus:border-[#526e5c] focus:ring-emerald-100'
              }`}
            />
            {fieldErrors.horaInicio && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {fieldErrors.horaInicio}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="booking-end"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
            >
              Hora fin
            </label>
            <input
              id="booking-end"
              type="time"
              value={horaFin}
              onChange={(e) => {
                setHoraFin(e.target.value);
                if (fieldErrors.horaFin) {
                  setFieldErrors((prev) => ({ ...prev, horaFin: undefined }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.horaFin)}
              className={`mt-1.5 w-full rounded-xl border bg-stone-50/70 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition focus:bg-white focus:ring-2 ${
                fieldErrors.horaFin
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-stone-300 focus:border-[#526e5c] focus:ring-emerald-100'
              }`}
            />
            {fieldErrors.horaFin && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {fieldErrors.horaFin}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="booking-guests"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
            >
              Cantidad de personas
            </label>
            <span className="text-xs text-stone-500">
              Máx. {espacio.capacidadMaxima}
            </span>
          </div>
          <input
            id="booking-guests"
            type="number"
            min={1}
            max={espacio.capacidadMaxima}
            value={cantidadPersonas}
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10);
              setCantidadPersonas(Number.isNaN(parsed) ? 0 : parsed);
              if (fieldErrors.cantidadPersonas) {
                setFieldErrors((prev) => ({
                  ...prev,
                  cantidadPersonas: undefined,
                }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.cantidadPersonas)}
            className={`mt-1.5 w-full rounded-xl border bg-stone-50/70 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition focus:bg-white focus:ring-2 ${
              fieldErrors.cantidadPersonas
                ? 'border-red-400 focus:ring-red-200'
                : 'border-stone-300 focus:border-[#526e5c] focus:ring-emerald-100'
            }`}
          />
          {fieldErrors.cantidadPersonas && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {fieldErrors.cantidadPersonas}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-stone-100/80 p-3.5 text-xs text-stone-700">
          <div className="flex items-center justify-between">
            <span>Duración permitida</span>
            <span className="font-medium">
              {espacio.minimoHorasReserva} h – {espacio.maximoHorasReserva} h
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between border-t border-stone-200/80 pt-1.5 text-sm font-semibold text-stone-900">
            <span>Subtotal estimado</span>
            <span>
              {estimatedHours > 0
                ? `$${estimatedSubtotal.toFixed(2)} MXN`
                : '—'}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !espacio.activo}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#23312b] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#354b42] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Confirmando reservación…
            </>
          ) : (
            'Confirmar reservación'
          )}
        </button>
      </form>
    </div>
  );
}

