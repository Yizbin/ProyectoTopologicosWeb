import type { CrearReservacionRequest } from '../../shared/api-contracts.js';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CrearReservacionDto implements CrearReservacionRequest {
  @IsNotEmpty({ message: 'La fecha es obligatoria.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener el formato YYYY-MM-DD.',
  })
  @IsDateString(
    { strict: true },
    { message: 'La fecha indicada no existe en el calendario.' },
  )
  fecha!: string;

  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora de inicio debe tener el formato HH:mm (ej. 09:00)',
  })
  horaInicio!: string;

  @IsNotEmpty({ message: 'La hora de fin es obligatoria' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora de fin debe tener el formato HH:mm (ej. 11:00)',
  })
  horaFin!: string;

  @IsNotEmpty({ message: 'El ID del espacio es obligatorio' })
  @IsString()
  espacioId!: string;

  @IsNotEmpty({ message: 'La cantidad de personas es obligatoria' })
  @Type(() => Number)
  @IsInt({ message: 'La cantidad de personas debe ser un número entero' })
  @Min(1, { message: 'La cantidad de personas debe ser al menos 1' })
  cantidadPersonas!: number;
}