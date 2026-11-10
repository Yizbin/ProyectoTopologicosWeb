/** Contratos HTTP compartidos entre el servicio NestJS y el storefront. */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  durationMs: number;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  tipoError: string;
  timestamp: string;
  path: string;
}

export interface AuthenticatedCustomer {
  id: string;
  nombre: string;
  correo: string;
  rol: 'CLIENTE' | 'ADMIN';
}

export interface LoginResponse {
  access_token: string;
  usuario: AuthenticatedCustomer;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface RegistrationRequest extends LoginRequest {
  nombre: string;
  telefono: string;
}

export interface SpaceSummary {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'Sala' | 'Cubiculo' | 'PC';
  costoPorHora: number;
  activo: boolean;
  duracionMinutos: number;
  sedeId: string;
  capacidadMaxima: number;
  amenidades: string[];
  minimoHorasReserva: number;
  maximoHorasReserva: number;
}

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
