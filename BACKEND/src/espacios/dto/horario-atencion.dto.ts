import { ArrayMaxSize, IsArray, IsInt, Matches, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class HorarioAtencionDto {
  @Type(() => Number)
  @IsInt({ message: 'diaSemana debe ser un entero entre 0 (domingo) y 6 (sábado).' })
  @Min(0, { message: 'diaSemana debe estar entre 0 (domingo) y 6 (sábado).' })
  @Max(6, { message: 'diaSemana debe estar entre 0 (domingo) y 6 (sábado).' })
  diaSemana!: number;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'horaApertura debe tener el formato HH:mm (24 horas)' })
  horaApertura!: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'horaCierre debe tener el formato HH:mm (24 horas)' })
  horaCierre!: string;
}

export class ReemplazarHorariosDto {
  @IsArray({ message: 'horarios debe ser una lista.' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => HorarioAtencionDto)
  horarios!: HorarioAtencionDto[];
}