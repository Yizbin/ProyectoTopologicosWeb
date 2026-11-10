export type RolUsuario = 'CLIENTE' | 'ADMIN';
export type TipoEspacio = 'Sala' | 'Cubiculo' | 'PC';
export type EstadoReservacion = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';

export type EstadoPago = 'PENDIENTE' | 'COMPLETADO' | 'REEMBOLSADO';

export type MetodoPago = 'EFECTIVO' | 'TARJETA';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  rol: RolUsuario;
}

export interface Espacio {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TipoEspacio;
  costoPorHora: number;
  activo: boolean;
  duracionMinutos: number;
  sedeId: string;
  capacidadMaxima: number;
  amenidades: string[];
  minimoHorasReserva: number;
  maximoHorasReserva: number;
}

export interface Reservacion {
  id: string;
  fecha: Date | string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoReservacion;
  espacioId: string;
  usuarioId: string;
  pagoId: string;
  cantidadPersonas: number;
  subtotal: number;
}

export interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  telefonoActivo: string;
  horaAperturaGeneral: string;
  horaCierreGeneral: string;
}

export interface HorarioAtencion {
  id: string;
  diaSemana: number;
  horaApertura: string;
  horaCierre: string;
  espacioId: string;
}

export interface Bloqueo {
  id: string;
  fechaInicio: Date | string;
  fechaFin: Date | string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  espacioId: string;
  activo: boolean;
}

export interface Pago {
  id: string;
  montoTotal: number;
  estado: EstadoPago;
  metodo?: MetodoPago;
  referencia?: string;
}

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

export type TipoErrorDominio =
  | 'EmpalmeReservacionError'
  | 'BloqueoAdministrativoError'
  | 'FueraDeHorarioError'
  | 'FechaPasadaError'
  | 'HoraInvalidaError'
  | 'CapacidadExcedidaError'
  | 'DuracionBloqueInvalidaError'
  | 'MinimoHorasReservaError'
  | 'MaximoHorasReservaError'
  | 'RangoHorasReservaInvalidoError'
  | 'EspacioInactivoError'
  | 'EspacioNoEncontradoError'
  | 'ReservacionNoEncontradaError'
  | 'EstadoReservacionInvalidoError'
  | 'HorarioAtencionInvalidoError'
  | 'PagoNoEncontradoError'
  | 'ReservacionYaPagadaError'
  | 'PagoEstadoInvalidoError'
  | 'SedeNoEncontradaError'
  | 'CantidadPersonasInvalidaError'
  | 'FechasReservaRequeridasError'
  | 'RangoFechasInvalidoError'
  | 'NetworkError'
  | 'TimeoutError'
  | 'UnauthorizedException'
  | 'ForbiddenException'
  | 'ConflictException'
  | 'BadRequestException'
  | 'NotFoundException'
  | (string & {});

export interface ApiError {
  message: string;
  tipoError: TipoErrorDominio;
  statusCode?: number;
}

export type UsuarioAutenticado = Pick<Usuario, 'id' | 'nombre' | 'correo' | 'rol'>;
export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface RegistroRequest extends LoginRequest {
  nombre: string;
  telefono: string;
}
export interface LoginResponse {
  access_token: string;
  usuario: UsuarioAutenticado;
}

export interface BloqueHorario {
  horaInicio: string;
  horaFin: string;
}
export interface OcupacionDia extends BloqueHorario {
  tipo: 'RESERVACION' | 'BLOQUEO';
  estado?: string;
  motivo?: string;
}

export interface DisponibilidadDia {
  espacioId: string;
  fecha: string;
  diaSemana: number;
  abierto: boolean;
  horariosAtencion: { horaApertura: string; horaCierre: string }[];
  ocupados: OcupacionDia[];
  libres: BloqueHorario[];
}

export interface EspacioConDisponibilidad extends Espacio {
  horariosLibres?: BloqueHorario[];
}

export interface BuscarEspaciosParams {
  fecha?: string;
  capacidad?: number;
  tipo?: TipoEspacio;
  sedeId?: string;
  activo?: boolean;
}

export interface CrearReservacionRequest {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  espacioId: string;
  cantidadPersonas: number;
}

export interface CrearReservacionesMultiplesRequest {
  fechas: string[];
  horaInicio: string;
  horaFin: string;
  espacioId: string;
  cantidadPersonas: number;
}

export interface ReservacionesMultiplesResponse {
  cantidad: number;
  total: number;
  reservaciones: Reservacion[];
}

export interface CancelarReservacionResponse {
  mensaje: string;
  reservacion: Reservacion | null;
}
export interface CrearPagoRequest {
  reservacionIds: string[];
  metodo: MetodoPago;
  referencia?: string;
}

export interface RegistroPagoResponse {
  cantidad: number;
  total: number;
  pagos: Pago[];
}

