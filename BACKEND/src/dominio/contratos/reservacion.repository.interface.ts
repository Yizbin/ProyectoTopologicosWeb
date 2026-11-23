import { Reservacion, EstadoReservacion } from '../entidades/reservacion.entity.js';
import { TipoEspacio } from '../entidades/espacio.entity.js';
import { EstadoPago, MetodoPago } from '../entidades/pago.entity.js';

export interface ReservacionDetallada {
    id: string;
    fecha: Date;
    horaInicio: string;
    horaFin: string;
    estado: EstadoReservacion;
    espacioId: string;
    usuarioId: string;
    pagoId: string;
    cantidadPersonas: number;
    subtotal: number;
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

export interface FiltrosReservacionesDetalladas {
    desde?: Date;
    hasta?: Date;
    espacioId?: string;
    estado?: EstadoReservacion;
}

export interface IReservacionRepository {
    guardar(reservacion: Reservacion): Promise<void>;
    guardarVarias(reservaciones: Reservacion[]): Promise<void>;
    obtenerPorEspacioYFecha(espacioId: string, fecha: Date): Promise<Reservacion[]>;
    obtenerPorId(id: string): Promise<Reservacion | null>;
    obtenerPorPagoId(pagoId: string): Promise<Reservacion | null>;
    obtenerPorUsuarioId(usuarioId: string): Promise<Reservacion[]>;
    actualizar(reservacion: Reservacion): Promise<void>;
    cambiarEstado(id: string, esperado: EstadoReservacion, nuevo: EstadoReservacion, noIniciadaDesde?: Date): Promise<boolean>;
    obtenerTodas(): Promise<Reservacion[]>;
    obtenerPorRangoFechas(fechaInicio: Date, fechaFin: Date, espacioId?: string): Promise<Reservacion[]>;
    obtenerDetalladas(filtros?: FiltrosReservacionesDetalladas): Promise<ReservacionDetallada[]>;
}
