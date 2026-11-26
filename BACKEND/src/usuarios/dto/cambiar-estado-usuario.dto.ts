import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarEstadoUsuarioDto {
  @ApiProperty({
    description: 'Indica si la cuenta de usuario está activa (true) o desactivada (false)',
    example: false,
  })
  @IsBoolean({ message: 'activo debe ser verdadero o falso.' })
  activo: boolean;
}
