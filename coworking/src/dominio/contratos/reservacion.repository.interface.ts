import { Reservacion } from '../entidades/reservacion.entity';

export interface IReservacionRepository {
    guardar(reservacion: Reservacion): Promise<void>;
    obtenerPorEspacioYFecha(espacioId: string, fecha: Date): Promise<Reservacion[]>;
    obtenerPorId(id: string): Promise<Reservacion | null>;
    actualizar(reservacion: Reservacion): Promise<void>;
}