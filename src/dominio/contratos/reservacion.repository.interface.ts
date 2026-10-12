import { Reservacion } from '../entidades/reservacion.entity.js';

export interface IReservacionRepository {
    guardar(reservacion: Reservacion): Promise<void>;
    obtenerPorEspacioYFecha(espacioId: string, fecha: Date): Promise<Reservacion[]>;
    obtenerPorId(id: string): Promise<Reservacion | null>;
    obtenerPorUsuarioId(usuarioId: string): Promise<Reservacion[]>;
    actualizar(reservacion: Reservacion): Promise<void>;
}