export interface AuthenticatedCustomer {
  id: string;
  nombre: string;
  correo: string;
  rol: 'CLIENTE' | 'ADMIN';
}

export interface LoginResponse {
  access_token: string;
  usuario: AuthenticatedCustomer;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface RegistrationRequest extends LoginRequest {
  nombre: string;
  telefono: string;
}