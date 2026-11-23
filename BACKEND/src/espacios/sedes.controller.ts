import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EspaciosService } from './espacios.service.js';
import { Sede } from '../dominio/entidades/sede.entity.js';

@ApiTags('Sedes')
@Controller('sedes')
export class SedesController {
  constructor(private readonly espaciosService: EspaciosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las sedes disponibles' })
  async listarSedes(): Promise<Sede[]> {
    return this.espaciosService.listarSedes();
  }
}
