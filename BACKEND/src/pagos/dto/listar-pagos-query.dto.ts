import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoPago, MetodoPago } from '../../dominio/entidades/pago.entity.js';

export class ListarPagosQueryDto {
  @IsOptional()
  @IsEnum(EstadoPago, { message: 'estado debe ser PENDIENTE, COMPLETADO o REEMBOLSADO.' })
  estado?: EstadoPago;

  @IsOptional()
  @IsEnum(MetodoPago, { message: 'metodo debe ser EFECTIVO o TARJETA.' })
  metodo?: MetodoPago;

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
