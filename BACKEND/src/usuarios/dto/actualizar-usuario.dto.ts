import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { RolUsuario } from '../../dominio/entidades/usuario.entity.js';

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede quedar vacío.' })
  nombre?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  correo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El teléfono no puede quedar vacío.' })
  telefono?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  contrasena?: string;

  @IsOptional()
  @IsEnum(RolUsuario, { message: 'El rol debe ser CLIENTE o ADMIN.' })
  rol?: RolUsuario;
}
