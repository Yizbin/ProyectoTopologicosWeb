import { Pago } from '../entidades/pago.entity.js';

export interface PagoConReservacion {
    pago: Pago;
    reservacionId: string;
}

export interface IPagoRepository {
    guardarConReservaciones(items: PagoConReservacion[]): Promise<void>;
    obtenerPorId(id: string): Promise<Pago | null>;
    actualizar(pago: Pago): Promise<void>;
}