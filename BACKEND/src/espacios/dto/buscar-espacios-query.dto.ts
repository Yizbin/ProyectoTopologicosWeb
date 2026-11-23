import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
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

  @IsOptional()
  @IsString()
  busqueda?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['activos', 'inactivos', 'todos'], {
    message: 'estadoActivo debe ser activos, inactivos o todos.',
  })
  estadoActivo?: 'activos' | 'inactivos' | 'todos';

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

export class DisponibilidadQueryDto {
  @IsDateString({}, { message: 'fecha es obligatoria y debe tener formato ISO (YYYY-MM-DD).' })
  fecha!: string;
}

export class ListarBloqueosQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'fecha debe tener formato ISO (YYYY-MM-DD).' })
  fecha?: string;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean({ message: 'soloActivos debe ser true o false.' })
  soloActivos?: boolean;
}
