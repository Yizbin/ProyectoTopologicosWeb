import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoReservacion } from '../../dominio/entidades/reservacion.entity.js';

export class ListarReservacionesQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'fecha debe tener formato ISO (YYYY-MM-DD).' })
  fecha?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fechaInicio debe tener formato ISO (YYYY-MM-DD).' })
  fechaInicio?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fechaFin debe tener formato ISO (YYYY-MM-DD).' })
  fechaFin?: string;

  @IsOptional()
  @IsString()
  espacioId?: string;

  @IsOptional()
  @IsEnum(EstadoReservacion, { message: 'estado debe ser pendiente, confirmada, cancelada o completada.' })
  estado?: EstadoReservacion;

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
