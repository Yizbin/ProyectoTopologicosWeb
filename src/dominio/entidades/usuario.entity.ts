export enum RolUsuario { CLIENTE = "CLIENTE", ADMIN = "ADMIN" }

export class Usuario {
    constructor(
        public id: string,
        public nombre: string,
        public correo: string,
        public telefono: string,
        public contrasena: string,
        public rol: RolUsuario
    ) {}
}