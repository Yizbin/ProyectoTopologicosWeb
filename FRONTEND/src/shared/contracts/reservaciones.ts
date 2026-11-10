export interface ReservationSummary {
  id: string;
  fecha: string | Date;
  horaInicio: string;
  horaFin: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  espacioId: string;
  usuarioId: string;
  pagoId: string;
  cantidadPersonas: number;
  subtotal: number;
}

export interface TimeBlock {
  horaInicio: string;
  horaFin: string;
}

export interface OccupiedBlock extends TimeBlock {
  tipo: 'RESERVACION' | 'BLOQUEO';
  estado?: string;
  motivo?: string;
}

export interface CreateReservationRequest extends TimeBlock {
  fecha: string;
  espacioId: string;
  cantidadPersonas: number;
}

export interface CancelReservationResponse {
  mensaje: string;
  reservacion: ReservationSummary | null;
}