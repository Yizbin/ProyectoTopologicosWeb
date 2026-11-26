import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { RolUsuario } from '../../dominio/entidades/usuario.entity.js';

export class ListarUsuariosQueryDto {
  @ApiPropertyOptional({ enum: RolUsuario, description: 'Filtrar por rol de usuario' })
  @IsOptional()
  @IsEnum(RolUsuario, { message: 'rol debe ser ADMIN o CLIENTE.' })
  rol?: RolUsuario;

  @ApiPropertyOptional({ description: 'Filtrar por estado activo (true o false)' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean({ message: 'activo debe ser true o false.' })
  activo?: boolean;

  @ApiPropertyOptional({ description: 'Término de búsqueda por nombre, correo o teléfono' })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiPropertyOptional({ description: 'Alias de búsqueda' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Número de página (>= 1)', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un número entero.' })
  @Min(1, { message: 'page debe ser al menos 1.' })
  page?: number;

  @ApiPropertyOptional({ description: 'Límite de resultados por página (1–100)', minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero.' })
  @Min(1, { message: 'limit debe ser al menos 1.' })
  @Max(100, { message: 'limit no puede exceder 100.' })
  limit?: number;
}
