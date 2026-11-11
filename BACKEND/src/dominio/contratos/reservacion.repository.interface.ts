import { Reservacion, EstadoReservacion } from '../entidades/reservacion.entity.js';

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
}
