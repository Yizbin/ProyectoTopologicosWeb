export class Sede {
    constructor(
        public id: string,
        public nombre: string,
        public direccion: string,
        public telefonoActivo: string,
        public horaAperturaGeneral: string,
        public horaCierreGeneral: string
    ) {}
}