export enum TipoEspacio {
    SALA = "Sala",
    CUBICULO = "Cubículo",
    PC = "PC"
}

export class Espacio {
    constructor(
        public id: string,
        public nombre: string,
        public descripcion: string,
        public tipo: TipoEspacio,
        public costoPorHora: number,
        public activo: boolean,
        public duracionMinutos: number // bloques de disponibilidad
    ) {}
}