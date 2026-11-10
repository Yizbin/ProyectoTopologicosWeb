import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../../shared/api/client';
import type {
  ApiError,
  CrearPagoRequest,
  RegistroPagoResponse,
  Reservacion,
} from '../../../shared/api/types';
import {
  normalizeApiError,
  translateBookingError,
} from '../utils/domainErrors';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservacion: Reservacion | null;
  onPaymentSuccess: (response: RegistroPagoResponse) => void;
  spaceName?: string;
}

interface SimulatedCardOption {
  id: string;
  label: string;
  subtitle: string;
}

const SIMULATED_CARDS: SimulatedCardOption[] = [
  {
    id: 'visa-1234',
    label: 'Tarjeta de Crédito/Débito terminada en **** 1234',
    subtitle: 'Visa · Pago inmediato en línea',
  },
  {
    id: 'mc-5678',
    label: 'Tarjeta Digital terminada en **** 5678',
    subtitle: 'Mastercard · Validación instantánea',
  },
];

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

export function PaymentModal({
  isOpen,
  onClose,
  reservacion,
  onPaymentSuccess,
  spaceName,
}: PaymentModalProps) {
  const [selectedCardId, setSelectedCardId] = useState(SIMULATED_CARDS[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCardId(SIMULATED_CARDS[0].id);
      setPaymentError(null);
      setIsProcessing(false);
    }
  }, [isOpen, reservacion?.id]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen || !reservacion) {
    return null;
  }

  const resolvedSpaceName =
    spaceName ?? `Espacio #${reservacion.espacioId.slice(0, 8)}`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isProcessing) return;

    setPaymentError(null);
    setIsProcessing(true);

    const payload: CrearPagoRequest = {
      reservacionIds: [reservacion.id],
      metodo: 'TARJETA',
      referencia: 'SIMULACION_WEB',
    };

    try {
      const response = await apiClient.post<RegistroPagoResponse>(
        '/pagos',
        payload,
      );
      onClose();
      onPaymentSuccess(response);
    } catch (cause) {
      setPaymentError(
        normalizeApiError(
          cause,
          'No pudimos procesar tu pago en este momento. Inténtalo nuevamente.',
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs"
      onClick={() => {
        if (!isProcessing) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 bg-stone-50/70 px-6 py-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#526e5c]">
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              Checkout
            </span>
            <h2
              id="payment-modal-title"
              className="mt-1 text-xl font-semibold tracking-tight text-stone-900"
            >
              Confirmar y pagar reservación
            </h2>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            aria-label="Cerrar modal de pago"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="rounded-xl border border-stone-200 bg-stone-50/90 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Resumen de tu reservación
            </p>
            <h3 className="mt-1 text-base font-semibold text-stone-900">
              {resolvedSpaceName}
            </h3>

            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-stone-600">Fecha</dt>
                <dd className="font-medium text-stone-900">
                  {formatDate(reservacion.fecha)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-stone-600">Horario</dt>
                <dd className="font-medium text-stone-900">
                  {reservacion.horaInicio} – {reservacion.horaFin}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-stone-200/80 pt-2.5">
                <dt className="font-semibold text-stone-800">
                  Monto total a pagar
                </dt>
                <dd className="text-lg font-bold text-[#23312b]">
                  ${reservacion.subtotal} MXN
                </dd>
              </div>
            </dl>
          </div>

          <fieldset className="space-y-2.5" disabled={isProcessing}>
            <legend className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Método de pago
            </legend>

            <div className="space-y-2">
              {SIMULATED_CARDS.map((card) => {
                const isSelected = selectedCardId === card.id;
                return (
                  <label
                    key={card.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600/30'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60'
                      }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={card.id}
                      checked={isSelected}
                      onChange={() => setSelectedCardId(card.id)}
                      className="mt-1 h-4 w-4 accent-emerald-600"
                    />
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                      <div>
                        <span className="block text-sm font-semibold text-stone-900">
                          {card.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-stone-500">
                          {card.subtitle}
                        </span>
                      </div>
                      <svg
                        aria-hidden="true"
                        className={`h-5 w-5 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-stone-400'
                          }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                        <line x1="6" y1="15" x2="10" y2="15" />
                      </svg>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {paymentError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-900"
            >
              <div className="flex flex-wrap items-center gap-2">
                <strong className="font-semibold">
                  No se pudo procesar el pago
                </strong>
                <span className="rounded-full bg-red-100 px-2 py-0.5 font-mono text-[11px] font-medium text-red-800">
                  {paymentError.tipoError}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-red-800">
                {translateBookingError(paymentError)}
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2.5 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Procesando pago...
                </>
              ) : (
                <>
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
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  {`Pagar $${reservacion.subtotal} MXN`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
