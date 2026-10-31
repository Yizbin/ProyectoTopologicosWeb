import { Injectable } from '@nestjs/common';
import type { IPagoRepository, PagoConReservacion } from '../../dominio/contratos/pago.repository.interface.js';
import type { IReservacionRepository } from '../../dominio/contratos/reservacion.repository.interface.js';
import { Pago } from '../../dominio/entidades/pago.entity.js';

@Injectable()
export class PagoMemoryRepository implements IPagoRepository {
    public pagos: Pago[] = [];

    constructor(private readonly reservacionRepo?: IReservacionRepository) {}

    async guardarConReservaciones(items: PagoConReservacion[]): Promise<void> {
        for (const { pago, reservacionId } of items) {
            this.pagos.push(pago);
            const reservacion = await this.reservacionRepo?.obtenerPorId(reservacionId);
            if (reservacion && this.reservacionRepo) {
                reservacion.pagoId = pago.id;
                await this.reservacionRepo.actualizar(reservacion);
            }
        }
    }

    async obtenerPorId(id: string): Promise<Pago | null> {
        return this.pagos.find(p => p.id === id) || null;
    }

    async actualizar(pago: Pago): Promise<void> {
        const index = this.pagos.findIndex(p => p.id === pago.id);
        if (index !== -1) this.pagos[index] = pago;
    }
}