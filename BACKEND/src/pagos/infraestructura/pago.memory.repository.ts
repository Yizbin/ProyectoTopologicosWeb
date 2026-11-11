import { Injectable } from '@nestjs/common';
import type { IPagoRepository, PagoConReservacion } from '../../dominio/contratos/pago.repository.interface.js';
import type { IReservacionRepository } from '../../dominio/contratos/reservacion.repository.interface.js';
import { Pago, EstadoPago } from '../../dominio/entidades/pago.entity.js';
import { EstadoReservacion } from '../../dominio/entidades/reservacion.entity.js';
import { EstadoReservacionInvalidoError, PagoEstadoInvalidoError, PagoNoEncontradoError, ReservacionNoEncontradaError, ReservacionYaPagadaError, } from '../../dominio/errores/dominio.errors.js';

@Injectable()
export class PagoMemoryRepository implements IPagoRepository {
    public pagos: Pago[] = [];

    constructor(private readonly reservacionRepo: IReservacionRepository) {}

    async guardarConReservaciones(items: PagoConReservacion[]): Promise<void> {
        const reservas = await Promise.all(
            items.map(({ reservacionId }) => this.reservacionRepo.obtenerPorId(reservacionId)),
        );
        const ids = new Set<string>();
        for (const reserva of reservas) {
            if (!reserva) throw new ReservacionNoEncontradaError();
            if (reserva.pagoId || ids.has(reserva.id)) throw new ReservacionYaPagadaError();
            if (reserva.estado === EstadoReservacion.CANCELADA) {
                throw new EstadoReservacionInvalidoError('La reservación está cancelada.');
            }
            ids.add(reserva.id);
        }
        // El repositorio de reservas en memoria devuelve referencias compartidas.
        // Validar todo y enlazar sin await evita intercalar dos pagos.
        for (let i = 0; i < items.length; i++) {
            reservas[i]!.pagoId = items[i]!.pago.id;
            this.pagos.push(items[i]!.pago);
        }
    }

    async completarSiReservacionVigente(id: string): Promise<Pago> {
        const reserva = await this.reservacionRepo.obtenerPorPagoId(id);
        const pago = this.pagos.find(p => p.id === id);
        if (!pago) throw new PagoNoEncontradoError();
        if (pago.estado !== EstadoPago.PENDIENTE) {
            throw new PagoEstadoInvalidoError('Solo se pueden completar pagos pendientes.');
        }
        if (!reserva || reserva.estado === EstadoReservacion.CANCELADA) {
            throw new EstadoReservacionInvalidoError(
                'No se puede completar el pago de una reservación cancelada o inexistente.',
            );
        }
        pago.estado = EstadoPago.COMPLETADO;
        return pago;
    }

    async obtenerPorId(id: string): Promise<Pago | null> {
        return this.pagos.find(p => p.id === id) || null;
    }

    async actualizar(pago: Pago): Promise<void> {
        const index = this.pagos.findIndex(p => p.id === pago.id);
        if (index !== -1) this.pagos[index] = pago;
    }
}
