export enum EstadoReservacion {
    PENDIENTE = "pendiente",
    CONFIRMADA = "confirmada",
    CANCELADA = "cancelada",
    COMPLETADA = "completada"
}

export class Reservacion {
    constructor(
        public id: string,
        public fecha: Date,
        public horaInicio: string, // "HH:mm"
        public horaFin: string,    //  "HH:mm"
        public estado: EstadoReservacion,
        public clienteId: string, 
        public espacioId: string   
    ) {}
}