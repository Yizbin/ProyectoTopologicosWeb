import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { EspaciosService } from './espacios.service.js';
import { CrearEspacioDto } from './dto/crear-espacio.dto.js';
import { CrearBloqueoDto } from './dto/crear-bloqueo.dto.js';
import { Espacio } from '../dominio/entidades/espacio.entity.js';
import { HorarioAtencion } from '../dominio/entidades/horario-atencion.entity.js';
import { Bloqueo } from '../dominio/entidades/bloqueo.entity.js';
import { RolUsuario } from '../dominio/entidades/usuario.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('espacios')
export class EspaciosController {
  constructor(private readonly espaciosService: EspaciosService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async crearEspacio(@Body() dto: CrearEspacioDto): Promise<Espacio> {
    return this.espaciosService.crearEspacio(dto);
  }

  @Post(':id/bloqueos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async crearBloqueo(
    @Param('id') id: string,
    @Body() dto: CrearBloqueoDto,
  ): Promise<Bloqueo> {
    return this.espaciosService.crearBloqueo(id, dto);
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
