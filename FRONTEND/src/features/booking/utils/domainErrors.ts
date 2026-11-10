import type { ApiError } from '../../../shared/api/types';

/**
 * Traduce errores de dominio o red provenientes del interceptor de Axios
 * a mensajes claros en lenguaje del cliente, conservando detalles útiles.
 */
export function translateBookingError(error: ApiError): string {
  switch (error.tipoError) {
    case 'EmpalmeReservacionError':
      return 'El horario seleccionado ya está reservado por otra persona. Por favor elige otro bloque libre.';
    case 'BloqueoAdministrativoError':
      return 'Este espacio tiene un bloqueo temporal en la fecha y hora indicadas (mantenimiento o evento privado).';
    case 'FueraDeHorarioError':
      return error.message || 'El horario solicitado está fuera del horario de atención disponible para este espacio.';
    case 'FechaPasadaError':
      return 'No puedes reservar ni consultar fechas anteriores al día de hoy.';
    case 'HoraInvalidaError':
      return 'La hora de fin debe ser estrictamente posterior a la hora de inicio.';
    case 'CapacidadExcedidaError':
      return error.message || 'La cantidad de personas excede la capacidad máxima del espacio.';
    case 'CantidadPersonasInvalidaError':
      return error.message || 'Debes indicar al menos 1 persona para la reservación.';
    case 'DuracionBloqueInvalidaError':
      return error.message || 'La duración debe coincidir con los bloques configurados del espacio.';
    case 'MinimoHorasReservaError':
      return error.message || 'La reserva no alcanza el mínimo de horas requerido para este espacio.';
    case 'MaximoHorasReservaError':
      return error.message || 'La reserva excede el máximo de horas permitido para este espacio.';
    case 'FechasReservaRequeridasError':
      return error.message || 'Selecciona al menos una fecha válida para continuar.';
    case 'RangoFechasInvalidoError':
      return error.message || 'El rango de fechas seleccionado no es válido.';
    case 'EspacioInactivoError':
      return 'Este espacio se encuentra temporalmente deshabilitado para nuevas reservaciones.';
    case 'EstadoReservacionInvalidoError':
      return error.message || 'Esta reservación ya no puede modificarse en su estado actual.';
    default:
      return error.message;
  }
}

export function normalizeApiError(cause: unknown, fallbackMessage: string): ApiError {
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

