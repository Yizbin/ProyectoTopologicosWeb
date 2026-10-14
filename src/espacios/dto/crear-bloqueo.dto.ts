import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CrearBloqueoDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsDateString({}, { message: 'fechaInicio debe ser una fecha válida en formato ISO (YYYY-MM-DD).' })
  fechaInicio: string;

  @IsDateString({}, { message: 'fechaFin debe ser una fecha válida en formato ISO (YYYY-MM-DD).' })
  fechaFin: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horaInicio debe tener el formato HH:mm (24 horas)',
  })
  horaInicio: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horaFin debe tener el formato HH:mm (24 horas)',
  })
  horaFin: string;

  @IsString()
  @IsNotEmpty({ message: 'El motivo del bloqueo es obligatorio.' })
  motivo: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
