import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateIf,
} from 'class-validator';
import { MetodoPago } from '../../dominio/entidades/pago.entity.js';

export class CrearPagoDto {
  @IsArray({ message: 'reservacionIds debe ser una lista.' })
  @ArrayMinSize(1, { message: 'Indica al menos una reservación a pagar.' })
  @ArrayMaxSize(31)
  @ArrayUnique({ message: 'No repitas reservaciones.' })
  @IsString({ each: true })
  reservacionIds!: string[];

  @IsEnum(MetodoPago, { message: 'metodo debe ser EFECTIVO o TARJETA.' })
  metodo!: MetodoPago;

  @ValidateIf((o) => o.metodo === MetodoPago.TARJETA || o.referencia !== undefined)
  @IsString()
  @IsNotEmpty({ message: 'La referencia es obligatoria para pagos con tarjeta.' })
  referencia?: string;
}