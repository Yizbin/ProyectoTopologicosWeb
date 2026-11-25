import { IsBoolean } from 'class-validator';

export class CambiarEstadoUsuarioDto {
  @IsBoolean({ message: 'activo debe ser verdadero o falso.' })
  activo: boolean;
}
