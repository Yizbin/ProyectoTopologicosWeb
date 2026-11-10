import { OmitType, PartialType } from '@nestjs/swagger';
import { CrearEspacioDto } from './crear-espacio.dto.js';

export class ActualizarEspacioDto extends PartialType(OmitType(CrearEspacioDto, ['id', 'horarios'] as const)) {}