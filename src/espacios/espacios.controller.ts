import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { EspaciosService } from './espacios.service.js';
import type { EspacioBuscado } from './espacios.service.js';
import { CrearEspacioDto } from './dto/crear-espacio.dto.js';
import { CrearBloqueoDto } from './dto/crear-bloqueo.dto.js';
import { ActualizarEspacioDto } from './dto/actualizar-espacio.dto.js';
import { ReemplazarHorariosDto } from './dto/horario-atencion.dto.js';
import { BuscarEspaciosQueryDto, DisponibilidadQueryDto } from './dto/buscar-espacios-query.dto.js';
import type { DisponibilidadDia } from './disponibilidad.service.js';
import { hoy, parseFecha } from '../common/utils/fecha.util.js';
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
  async listarEspacios(@Query() query: BuscarEspaciosQueryDto): Promise<EspacioBuscado[]> {
    return this.espaciosService.buscarEspacios({
      fecha: query.fecha ? parseFecha(query.fecha) : undefined,
      capacidad: query.capacidad,
      tipo: query.tipo,
      sedeId: query.sedeId,
      activoSolo: query.activo ?? true,
    });
  }

  @Get(':id')
  async obtenerPorId(@Param('id') id: string): Promise<Espacio> {
    return this.espaciosService.obtenerEspacioPorId(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async actualizarEspacio(
    @Param('id') id: string,
    @Body() dto: ActualizarEspacioDto,
  ): Promise<Espacio> {
    return this.espaciosService.actualizarEspacio(id, dto);
  }

  /** Reemplaza el horario semanal completo del espacio. */
  @Put(':id/horarios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async reemplazarHorarios(
    @Param('id') id: string,
    @Body() dto: ReemplazarHorariosDto,
  ): Promise<HorarioAtencion[]> {
    return this.espaciosService.reemplazarHorarios(id, dto.horarios);
  }

  @Get(':id/disponibilidad')
  async obtenerDisponibilidad(
    @Param('id') id: string,
    @Query() query: DisponibilidadQueryDto,
  ): Promise<DisponibilidadDia> {
    return this.espaciosService.obtenerDisponibilidad(id, parseFecha(query.fecha));
  }

  @Get(':id/horarios')
  async obtenerHorarios(
    @Param('id') id: string,
    @Query('diaSemana', new ParseIntPipe({ optional: true })) diaSemana?: number,
  ): Promise<HorarioAtencion[]> {
    return this.espaciosService.obtenerHorarios(id, diaSemana);
  }

  @Get(':id/bloqueos')
  async obtenerBloqueos(
    @Param('id') id: string,
    @Query('fecha') fecha: string,
  ): Promise<Bloqueo[]> {
    const fechaDate = fecha ? parseFecha(fecha) : hoy();
    return this.espaciosService.obtenerBloqueos(id, fechaDate);
  }
}