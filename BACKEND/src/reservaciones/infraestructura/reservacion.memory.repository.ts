import { Injectable } from '@nestjs/common/decorators/core/index.js';
import { IReservacionRepository } from '../../dominio/contratos/reservacion.repository.interface.js';
import { formatoFecha } from '../../common/utils/fecha.util.js';
import { Reservacion, EstadoReservacion, } from '../../dominio/entidades/reservacion.entity.js';
import { EmpalmeReservacionError, } from '../../dominio/errores/dominio.errors.js';

@Injectable()
export class ReservacionMemoryRepository implements IReservacionRepository {
    private reservaciones: Reservacion[] = [];

    async guardar(reservacion: Reservacion): Promise<void> {
        await this.guardarVarias([reservacion]);
    }

    async guardarVarias(reservaciones: Reservacion[]): Promise<void> {
        const verificadas: Reservacion[] = [];

        for (const nueva of reservaciones) {
            const conflicto = [...this.reservaciones, ...verificadas].some(
                (existente) =>
                    existente.espacioId === nueva.espacioId &&
                    formatoFecha(existente.fecha) === formatoFecha(nueva.fecha) &&
                    (
                        existente.estado === EstadoReservacion.PENDIENTE ||
                        existente.estado === EstadoReservacion.CONFIRMADA
                    ) &&
                    existente.horaInicio < nueva.horaFin &&
                    existente.horaFin > nueva.horaInicio,
            );

            if (conflicto) {
                throw new EmpalmeReservacionError();
            }

            verificadas.push(nueva);
        }
        this.reservaciones.push(...verificadas);
    }
    async obtenerPorPagoId(pagoId: string): Promise<Reservacion | null> {
        return this.reservaciones.find(r => r.pagoId === pagoId) || null;
    }

    async obtenerPorEspacioYFecha(espacioId: string, fecha: Date): Promise<Reservacion[]> {
        return this.reservaciones.filter(r =>
            r.espacioId === espacioId &&
            formatoFecha(r.fecha) === formatoFecha(fecha) &&
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
        return this.reservaciones
            .filter(r => r.usuarioId === usuarioId)
            .sort((a, b) => b.fecha.getTime() - a.fecha.getTime() || b.horaInicio.localeCompare(a.horaInicio));
    }

    async obtenerTodas(): Promise<Reservacion[]> {
        return [...this.reservaciones];
    }

    async obtenerPorRangoFechas(fechaInicio: Date, fechaFin: Date, espacioId?: string): Promise<Reservacion[]> {
        const desde = formatoFecha(fechaInicio);
        const hasta = formatoFecha(fechaFin);
        return this.reservaciones.filter(r => {
            const f = formatoFecha(r.fecha);
            const coincideEspacio = espacioId ? r.espacioId === espacioId : true;
            return coincideEspacio && f >= desde && f <= hasta;
        });
    }
}