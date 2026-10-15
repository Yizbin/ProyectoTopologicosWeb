import { Injectable } from '@nestjs/common/decorators/core/index.js';
import { IReservacionRepository } from '../../dominio/contratos/reservacion.repository.interface.js';
import { Reservacion } from '../../dominio/entidades/reservacion.entity.js';

@Injectable()
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

    async obtenerPorUsuarioId(usuarioId: string): Promise<Reservacion[]> {
        return this.reservaciones.filter(r => r.usuarioId === usuarioId);
    }

    async obtenerTodas(): Promise<Reservacion[]> {
        return [...this.reservaciones];
    }

    async obtenerPorRangoFechas(fechaInicio: Date, fechaFin: Date, espacioId?: string): Promise<Reservacion[]> {
        const tInicio = fechaInicio.getTime();
        const tFin = fechaFin.getTime();
        return this.reservaciones.filter(r => {
            const t = r.fecha.getTime();
            const coincideEspacio = espacioId ? r.espacioId === espacioId : true;
            return coincideEspacio && t >= tInicio && t <= tFin;
        });
    }
}