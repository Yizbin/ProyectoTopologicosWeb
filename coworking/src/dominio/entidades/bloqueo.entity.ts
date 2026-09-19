export class Bloqueo {
    constructor(
        public id: string,
        public fecha: Date,
        public horaInicio: string,
        public horaFin: string,
        public motivo: string,
        public espacioId: string,
        public activo: boolean
    ) {}
}