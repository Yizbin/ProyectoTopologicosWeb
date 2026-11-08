import type { SpaceSummary } from '../../shared/api-contracts.js';

export enum TipoEspacio { SALA = "Sala", CUBICULO = "Cubiculo", PC = "PC" }

export class Espacio implements SpaceSummary {
    constructor(
        public id: string,
        public nombre: string,
        public descripcion: string,
        public tipo: TipoEspacio,
        public costoPorHora: number,
        public activo: boolean,
        public duracionMinutos: number,
        public sedeId: string,           
        public capacidadMaxima: number,  
        public amenidades: string[],     
        public minimoHorasReserva: number, 
        public maximoHorasReserva: number  
    ) {}
}
