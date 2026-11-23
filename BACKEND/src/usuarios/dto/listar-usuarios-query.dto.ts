import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RolUsuario } from '../../dominio/entidades/usuario.entity.js';

export class ListarUsuariosQueryDto {
  @IsOptional()
  @IsEnum(RolUsuario, { message: 'rol debe ser ADMIN o CLIENTE.' })
  rol?: RolUsuario;

  @IsOptional()
  @IsString()
  busqueda?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un número entero.' })
  @Min(1, { message: 'page debe ser al menos 1.' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero.' })
  @Min(1, { message: 'limit debe ser al menos 1.' })
  @Max(100, { message: 'limit no puede exceder 100.' })
  limit?: number;
}
