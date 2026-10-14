import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoEspacio } from '../../dominio/entidades/espacio.entity.js';

export class CrearEspacioDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty({ message: 'El nombre del espacio es obligatorio' })
  @IsString()
  nombre!: string;

  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString()
  descripcion!: string;

  @IsNotEmpty({ message: 'El tipo de espacio es obligatorio' })
  @IsEnum(TipoEspacio, { message: 'El tipo debe ser Sala, Cubiculo o PC' })
  tipo!: TipoEspacio;

  @IsNotEmpty({ message: 'El costo por hora es obligatorio' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El costo por hora debe ser un número' })
  @Min(0, { message: 'El costo por hora no puede ser negativo' })
  costoPorHora!: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsNotEmpty({ message: 'La duración en minutos es obligatoria' })
  @Type(() => Number)
  @IsInt({ message: 'La duración en minutos debe ser un número entero' })
  @Min(1, { message: 'La duración debe ser de al menos 1 minuto' })
  duracionMinutos!: number;

  @IsNotEmpty({ message: 'La sede asociada es obligatoria' })
  @IsString()
  sedeId!: string;

  @IsNotEmpty({ message: 'La capacidad máxima es obligatoria' })
  @Type(() => Number)
  @IsInt({ message: 'La capacidad máxima debe ser un número entero' })
  @Min(1, { message: 'La capacidad máxima debe ser de al menos 1 persona' })
  capacidadMaxima!: number;

  @IsArray({ message: 'Las amenidades deben ser una lista' })
  @IsString({ each: true, message: 'Cada amenidad debe ser un texto' })
  amenidades!: string[];

  @IsNotEmpty({ message: 'El mínimo de horas de reserva es obligatorio' })
  @Type(() => Number)
  @IsInt({ message: 'El mínimo de horas debe ser un número entero' })
  @Min(1, { message: 'El mínimo de horas debe ser de al menos 1' })
  minimoHorasReserva!: number;

  @IsNotEmpty({ message: 'El máximo de horas de reserva es obligatorio' })
  @Type(() => Number)
  @IsInt({ message: 'El máximo de horas debe ser un número entero' })
  @Min(1, { message: 'El máximo de horas debe ser de al menos 1' })
  maximoHorasReserva!: number;
}
