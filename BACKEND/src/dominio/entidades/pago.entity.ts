import type { Pago as PagoContrato } from '../../shared/api-contracts.js';

export enum MetodoPago { EFECTIVO = "EFECTIVO", TARJETA = "TARJETA" }
export enum EstadoPago { PENDIENTE = "PENDIENTE", COMPLETADO = "COMPLETADO", REEMBOLSADO = "REEMBOLSADO" }

export class Pago implements PagoContrato {
    constructor(
        public id: string,
        public montoTotal: number,
        public estado: EstadoPago,
        public metodo?: MetodoPago,
        public referencia?: string
    ) {}
}