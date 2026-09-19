import { IReservacionRepository } from '../../dominio/contratos/reservacion.repository.interface';
import { Reservacion } from '../../dominio/entidades/reservacion.entity';

export class ReservacionMemoryRepository implements IReservacionRepository {
    private reservaciones: Reservacion[] = [];

    async guardar(reservacion: Reservacion): Promise<void> {
        this.reservaciones.push(reservacion);
    }

    async obtenerPorEspacioYFecha(espacioId: string, fecha: Date): Promise<Reservacion[]> {
        return this.reservaciones.filter(r => 
            r.espacioId === espacioId && 
            r.fecha.toDateString() === fecha.toDateString() &&
            r.estado !== "cancelada"
        );
    }

    async obtenerPorId(id: string): Promise<Reservacion | null> {
        const reservacion = this.reservaciones.find(r => r.id === id);
        return reservacion || null;
    }

    async actualizar(reservacion: Reservacion): Promise<void> {
        const index = this.reservaciones.findIndex(r => r.id === reservacion.id);
        if (index !== -1) {
            this.reservaciones[index] = reservacion;
        }
    }
}