import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { RolUsuario } from '../../dominio/entidades/usuario.entity.js';

export class RegistroDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  correo: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  telefono: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  contrasena: string;

  @IsOptional()
  @IsEnum(RolUsuario, { message: 'El rol debe ser CLIENTE o ADMIN.' })
  rol?: RolUsuario;
}
