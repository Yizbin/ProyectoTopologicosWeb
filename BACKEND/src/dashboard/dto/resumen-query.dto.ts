import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, Matches } from 'class-validator';

export class ResumenQueryDto {
  @ApiPropertyOptional({
    description: 'Fecha inicial del período (YYYY-MM-DD). Debe enviarse junto con fechaFin.',
    example: '2026-11-01',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  fechaInicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha final del período (YYYY-MM-DD). Debe enviarse junto con fechaInicio.',
    example: '2026-11-30',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  fechaFin?: string;
}
