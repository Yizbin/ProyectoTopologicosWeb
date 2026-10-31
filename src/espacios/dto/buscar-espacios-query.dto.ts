import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TipoEspacio } from '../../dominio/entidades/espacio.entity.js';

export class BuscarEspaciosQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'fecha debe tener formato ISO (YYYY-MM-DD).' })
  fecha?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'capacidad debe ser un número entero.' })
  @Min(1, { message: 'capacidad debe ser al menos 1.' })
  capacidad?: number;

  @IsOptional()
  @IsEnum(TipoEspacio, { message: 'tipo debe ser Sala, Cubiculo o PC.' })
  tipo?: TipoEspacio;

  @IsOptional()
  @IsString()
  sedeId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean({ message: 'activo debe ser true o false.' })
  activo?: boolean;
}

export class DisponibilidadQueryDto {
  @IsDateString({}, { message: 'fecha es obligatoria y debe tener formato ISO (YYYY-MM-DD).' })
  fecha!: string;
}