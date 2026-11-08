import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import type { LoginRequest } from '../../shared/api-contracts.js';

export class LoginDto implements LoginRequest {
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  correo: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  contrasena: string;
}
