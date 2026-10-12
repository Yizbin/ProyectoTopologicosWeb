export enum EstadoReservacion { PENDIENTE = "pendiente", CONFIRMADA = "confirmada", CANCELADA = "cancelada", COMPLETADA = "completada" }

export class Reservacion {
    constructor(
        public id: string,
        public fecha: Date,
        public horaInicio: string,
        public horaFin: string,
        public estado: EstadoReservacion,
        public espacioId: string,
        public usuarioId: string,        
        public pagoId: string,          
        public cantidadPersonas: number, 
        public subtotal: number          
    ) {}
}