import type { AuthenticatedCustomer } from '../../shared/api-contracts.js';

export enum RolUsuario { CLIENTE = "CLIENTE", ADMIN = "ADMIN" }

export class Usuario implements AuthenticatedCustomer {
    constructor(
        public id: string,
        public nombre: string,
        public correo: string,
        public telefono: string,
        public contrasena: string,
        public rol: RolUsuario
    ) {}
}
