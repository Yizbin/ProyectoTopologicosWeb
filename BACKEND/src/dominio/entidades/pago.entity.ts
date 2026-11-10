export enum MetodoPago { EFECTIVO = "EFECTIVO", TARJETA = "TARJETA" }
export enum EstadoPago { PENDIENTE = "PENDIENTE", COMPLETADO = "COMPLETADO", REEMBOLSADO = "REEMBOLSADO" }

export class Pago {
    constructor(
        public id: string,
        public montoTotal: number,
        public estado: EstadoPago,
        public metodo?: MetodoPago,
        public referencia?: string
    ) {}
}