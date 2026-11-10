import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
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
}