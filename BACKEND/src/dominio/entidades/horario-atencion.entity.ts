export class HorarioAtencion {
    constructor(
        public id: string,
        public diaSemana: number, // cada numero seria un dia de la semana (0 = domingo, 1= lunes y asi)
        public horaApertura: string, // "HH:mm"
        public horaCierre: string,   // "HH:mm"
        public espacioId: string
    ) {}
}