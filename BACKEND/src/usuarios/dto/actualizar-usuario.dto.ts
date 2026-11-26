import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { RolUsuario } from '../../dominio/entidades/usuario.entity.js';

export class ActualizarUsuarioDto {
  @ApiPropertyOptional({ description: 'Nombre completo del usuario', example: 'Laura Mendoza' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede quedar vacío.' })
  nombre?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico único', example: 'laura@correo.com' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  correo?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto', example: '5551234567' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El teléfono no puede quedar vacío.' })
  telefono?: string;

  @ApiPropertyOptional({ description: 'Nueva contraseña (mínimo 6 caracteres)' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  contrasena?: string;

  @ApiPropertyOptional({ enum: RolUsuario, description: 'Rol asignado al usuario' })
  @IsOptional()
  @IsEnum(RolUsuario, { message: 'El rol debe ser CLIENTE o ADMIN.' })
  rol?: RolUsuario;
}
