export type RolUsuario = 'CLIENTE' | 'ADMIN';

export type TipoEspacio = 'Sala' | 'Cubiculo' | 'PC';

export type EstadoReservacion = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';

export type EstadoPago = 'PENDIENTE' | 'COMPLETADO' | 'REEMBOLSADO';

export type MetodoPago = 'EFECTIVO' | 'TARJETA';

export interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  telefonoActivo: string;
  horaAperturaGeneral: string;
  horaCierreGeneral: string;
}

export interface UsuarioPublico {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  rol: RolUsuario;
  /** Ausente en respuestas antiguas: se interpreta como activo. */
  activo?: boolean;
}

export type UsuarioAutenticado = Pick<UsuarioPublico, 'id' | 'nombre' | 'correo' | 'rol'>;

export interface CrearUsuarioRequest {
  nombre: string;
  correo: string;
  telefono: string;
  contrasena: string;
  rol?: RolUsuario;
}

export interface ActualizarUsuarioRequest {
  nombre?: string;
  correo?: string;
  telefono?: string;
  contrasena?: string;
  rol?: RolUsuario;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
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

export interface EspacioBuscado extends Espacio {
  horariosLibres?: BloqueHorario[];
}

export interface HorarioAtencionInput {
  diaSemana: number;
  horaApertura: string;
  horaCierre: string;
}

export interface HorarioAtencion extends HorarioAtencionInput {
  id: string;
  espacioId: string;
}

export interface GuardarHorariosRequest {
  horarios: HorarioAtencionInput[];
}

export interface CrearEspacioDto {
  nombre: string;
  descripcion: string;
  tipo: TipoEspacio;
  costoPorHora: number;
  activo?: boolean;
  duracionMinutos: number;
  sedeId: string;
  capacidadMaxima: number;
  amenidades: string[];
  minimoHorasReserva: number;
  maximoHorasReserva: number;
  horarios?: HorarioAtencionInput[];
}

export type ActualizarEspacioDto = Partial<Omit<CrearEspacioDto, 'horarios'>>;

export interface Bloqueo {
  id: string;
  fechaInicio: string | Date;
  fechaFin: string | Date;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  espacioId: string;
  activo: boolean;
}

export interface CrearBloqueoRequest {
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  activo?: boolean;
}

export interface DesactivarBloqueoResponse {
  mensaje: string;
  bloqueo: Bloqueo;
}

export interface Reservacion {
  id: string;
  fecha: string | Date;
  horaInicio: string;
  horaFin: string;
  estado: EstadoReservacion;
  espacioId: string;
  usuarioId: string;
  pagoId: string;
  cantidadPersonas: number;
  subtotal: number;
}

export interface ReservacionDetallada extends Reservacion {
  usuario: {
    id: string;
    nombre: string;
    correo: string;
    telefono: string;
  } | null;
  espacio: {
    id: string;
    nombre: string;
    tipo: TipoEspacio;
  } | null;
  pago: {
    id: string;
    estado: EstadoPago;
    metodo?: MetodoPago;
    montoTotal: number;
  } | null;
}

export interface CrearReservacionRequest {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  espacioId: string;
  cantidadPersonas: number;
  usuarioId?: string;
}

export interface AccionReservacionResponse {
  mensaje: string;
  reservacion: Reservacion | null;
}

export interface Pago {
  id: string;
  montoTotal: number;
  estado: EstadoPago;
  metodo?: MetodoPago;
  referencia?: string;
}

export interface PagoDetallado extends Pago {
  reservacion: {
    id: string;
    fecha: string | Date;
    horaInicio: string;
    horaFin: string;
    estado: EstadoReservacion;
    espacioId: string;
    usuarioId: string;
    espacioNombre?: string;
    usuarioNombre?: string;
    usuarioCorreo?: string;
  } | null;
}

export interface CrearPagoRequest {
  reservacionIds: string[];
  metodo: MetodoPago;
  referencia?: string;
}

export interface CrearPagoResponse {
  cantidad: number;
  total: number;
  pagos: Pago[];
}

export interface CompletarPagoResponse {
  mensaje: string;
  pago: Pago;
}
