export enum EstadoReservacion {
    PENDIENTE = "pendiente",
    CONFIRMADA = "confirmada",
    CANCELADA = "cancelada",
    COMPLETADA = "completada"
}

export class Espacio {
    constructor(
        public id: string,
        public nombre: string,
        public descripcion: string,
        public duracionEstimada: number,
        public costo: number
    ) {}
}

export class Reservacion {
    constructor(
        public id: string,
        public clienteId: string,
        public espacioId: string,
        public fecha: string, //Para seguir el formato YYYY-MM-DD
        public horaInicio: number,
        public horaFin: number,
        public estado: EstadoReservacion
    ) {}
}

export class BloqueoAdministrativo {
    constructor(
        public espacioId: string,
        public fecha: string,
        public horaInicio: number,
        public horaFin: number
    ) {}
}