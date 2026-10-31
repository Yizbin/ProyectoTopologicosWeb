import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CrearReservacionesMultiplesDto {
  @IsArray({ message: 'fechas debe ser una lista de fechas.' })
  @ArrayMinSize(1, { message: 'Debes indicar al menos una fecha.' })
  @ArrayMaxSize(31, { message: 'No puedes reservar más de 31 fechas a la vez.' })
  @ArrayUnique({ message: 'No repitas fechas.' })
  @IsDateString({}, { each: true, message: 'Cada fecha debe tener formato ISO (YYYY-MM-DD).' })
  fechas!: string[];

  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'La hora de inicio debe tener el formato HH:mm (ej. 09:00)' })
  horaInicio!: string;

  @IsNotEmpty({ message: 'La hora de fin es obligatoria' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'La hora de fin debe tener el formato HH:mm (ej. 11:00)' })
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