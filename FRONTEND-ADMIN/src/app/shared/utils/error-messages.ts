import type { ApiError } from '../../core/models';

const DOMAIN_ERROR_MESSAGES: Record<string, string> = {
  EmpalmeReservacionError:
    'El horario solicitado se empalma con otra reservación vigente en el mismo espacio.',
  BloqueoAdministrativoError:
    'Existe un bloqueo administrativo activo que impide reservar en la fecha y hora indicadas.',
  FueraDeHorarioError:
    'El horario seleccionado está fuera de la franja de atención configurada para el espacio o la sede.',
  FechaPasadaError:
    'La fecha u hora seleccionada ya pasó; elige una fecha y hora futura.',
  HoraInvalidaError:
    'El rango de horas o fechas es inválido: el fin debe ser estrictamente posterior al inicio.',
  CapacidadExcedidaError:
    'La cantidad de personas supera la capacidad máxima permitida del espacio.',
  CantidadPersonasInvalidaError:
    'La cantidad de personas debe ser de al menos 1.',
  DuracionBloqueInvalidaError:
    'La duración debe coincidir con múltiplos exactos de los bloques configurados para este espacio.',
  MinimoHorasReservaError:
    'La duración de la reservación es menor al mínimo de horas permitido.',
  MaximoHorasReservaError:
    'La duración de la reservación supera el máximo de horas permitido.',
  RangoHorasReservaInvalidoError:
    'El mínimo de horas de reserva no puede ser mayor que el máximo permitido.',
  EspacioInactivoError:
    'El espacio está desactivado actualmente y no admite nuevas reservaciones.',
  EspacioNoEncontradoError:
    'El espacio indicado no existe en el sistema.',
  ReservacionNoEncontradaError:
    'No se encontró la reservación solicitada.',
  EstadoReservacionInvalidoError:
    'La operación no está permitida para el estado actual de la reservación.',
  HorarioAtencionInvalidoError:
    'Uno o más bloques horarios tienen hora de cierre inválida o se traslapan en el mismo día.',
  PagoNoEncontradoError:
    'No se encontró el registro de pago especificado.',
  ReservacionYaPagadaError:
    'Esta reservación ya cuenta con un pago registrado previamente.',
  PagoEstadoInvalidoError:
    'Solo se pueden completar pagos que se encuentran en estado PENDIENTE.',
  SedeNoEncontradaError:
    'La sede especificada no existe o no fue encontrada.',
  BloqueoNoEncontradoError:
    'El bloqueo administrativo indicado no existe para este espacio.',
  UsuarioNoEncontradoError:
    'El usuario especificado para la reservación no existe.',
  FechasReservaRequeridasError:
    'Debes indicar al menos una fecha válida para continuar.',
  RangoFechasInvalidoError:
    'El rango de fechas es inválido: fechaFin no puede ser anterior a fechaInicio.',
  NetworkError:
    'No fue posible conectar con el servidor backend. Verifica que esté activo en el puerto configurado.',
};

export function formatDomainError(error: ApiError): string {
  const rawMessage = error.message?.trim();
  if (rawMessage && error.tipoError !== 'ConflictException') {
    return rawMessage;
  }

  return (
    DOMAIN_ERROR_MESSAGES[error.tipoError] ??
    rawMessage ??
    'Ocurrió un error al procesar la operación solicitada.'
  );
}

export function getDomainErrorTitle(error: ApiError): string {
  if (error.statusCode === 0 || error.tipoError === 'NetworkError') {
    return 'Sin conexión con el servidor';
  }
  if (error.statusCode === 409) {
    return 'Regla de negocio rechazada';
  }
  if (error.statusCode === 400) {
    return 'Datos de entrada inválidos';
  }
  if (error.statusCode === 404) {
    return 'Recurso no encontrado';
  }
  return 'No se pudo completar la operación';
}
