import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { EspaciosService } from './espacios.service.js';
import { CrearEspacioDto } from './dto/crear-espacio.dto.js';
import { Espacio } from '../dominio/entidades/espacio.entity.js';
import { HorarioAtencion } from '../dominio/entidades/horario-atencion.entity.js';
import { Bloqueo } from '../dominio/entidades/bloqueo.entity.js';

@Controller('espacios')
export class EspaciosController {
  constructor(private readonly espaciosService: EspaciosService) {}

  @Post()
  async crearEspacio(@Body() dto: CrearEspacioDto): Promise<Espacio> {
    return this.espaciosService.crearEspacio(dto);
  }

  @Get()
  async listarEspacios(
    @Query('activo') activo?: string,
  ): Promise<Espacio[]> {
    const activoSolo = activo === undefined ? true : activo === 'true';
    return this.espaciosService.listarEspacios(activoSolo);
  }

  @Get(':id')
  async obtenerPorId(@Param('id') id: string): Promise<Espacio> {
    return this.espaciosService.obtenerEspacioPorId(id);
  }

  @Get(':id/horarios')
  async obtenerHorarios(
    @Param('id') id: string,
    @Query('diaSemana', ParseIntPipe) diaSemana: number,
  ): Promise<HorarioAtencion[]> {
    return this.espaciosService.obtenerHorarios(id, diaSemana);
  }

  @Get(':id/bloqueos')
  async obtenerBloqueos(
    @Param('id') id: string,
    @Query('fecha') fecha: string,
  ): Promise<Bloqueo[]> {
    const fechaDate = fecha ? new Date(fecha) : new Date();
    return this.espaciosService.obtenerBloqueos(id, fechaDate);
  }
}
