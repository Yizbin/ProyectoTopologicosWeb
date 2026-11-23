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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EspaciosService } from './espacios.service.js';
import type { EspacioBuscado } from './espacios.service.js';
import { CrearEspacioDto } from './dto/crear-espacio.dto.js';
import { CrearBloqueoDto } from './dto/crear-bloqueo.dto.js';
import { ActualizarEspacioDto } from './dto/actualizar-espacio.dto.js';
import { ReemplazarHorariosDto } from './dto/horario-atencion.dto.js';
import {
  BuscarEspaciosQueryDto,
  DisponibilidadQueryDto,
  ListarBloqueosQueryDto,
} from './dto/buscar-espacios-query.dto.js';
import type { DisponibilidadDia } from './disponibilidad.service.js';
import { parseFecha } from '../common/utils/fecha.util.js';
import { paginarLista, type ResultadoPaginado } from '../common/utils/paginacion.util.js';
import { Espacio } from '../dominio/entidades/espacio.entity.js';
import { HorarioAtencion } from '../dominio/entidades/horario-atencion.entity.js';
import { Bloqueo } from '../dominio/entidades/bloqueo.entity.js';
import { RolUsuario } from '../dominio/entidades/usuario.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Espacios')
@Controller('espacios')
export class EspaciosController {
  constructor(private readonly espaciosService: EspaciosService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo espacio (Solo ADMIN)' })
  async crearEspacio(@Body() dto: CrearEspacioDto): Promise<Espacio> {
    return this.espaciosService.crearEspacio(dto);
  }

  @Post(':id/bloqueos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un bloqueo administrativo en un espacio (Solo ADMIN)' })
  async crearBloqueo(
    @Param('id') id: string,
    @Body() dto: CrearBloqueoDto,
  ): Promise<Bloqueo> {
    return this.espaciosService.crearBloqueo(id, dto);
  }

  @Patch(':id/bloqueos/:bloqueoId/desactivar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar un bloqueo administrativo (Solo ADMIN)' })
  async desactivarBloqueo(
    @Param('id') id: string,
    @Param('bloqueoId') bloqueoId: string,
  ): Promise<{ mensaje: string; bloqueo: Bloqueo }> {
    const bloqueo = await this.espaciosService.desactivarBloqueo(id, bloqueoId);
    return { mensaje: 'Bloqueo desactivado exitosamente', bloqueo };
  }

  @Get()
  @ApiOperation({ summary: 'Listar o buscar espacios con filtros y paginación opcional' })
  async listarEspacios(
    @Query() query: BuscarEspaciosQueryDto,
  ): Promise<EspacioBuscado[] | ResultadoPaginado<EspacioBuscado>> {
    const lista = await this.espaciosService.buscarEspacios({
      fecha: query.fecha ? parseFecha(query.fecha) : undefined,
      capacidad: query.capacidad,
      tipo: query.tipo,
      sedeId: query.sedeId,
      activoSolo: query.activo ?? true,
      busqueda: query.busqueda ?? query.q,
      estadoActivo: query.estadoActivo,
    });

    if (query.page !== undefined || query.limit !== undefined) {
      return paginarLista(lista, query.page, query.limit);
    }

    return lista;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un espacio por ID' })
  async obtenerPorId(@Param('id') id: string): Promise<Espacio> {
    return this.espaciosService.obtenerEspacioPorId(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar datos o estado activo de un espacio (Solo ADMIN)' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reemplazar el horario semanal de un espacio (Solo ADMIN)' })
  async reemplazarHorarios(
    @Param('id') id: string,
    @Body() dto: ReemplazarHorariosDto,
  ): Promise<HorarioAtencion[]> {
    return this.espaciosService.reemplazarHorarios(id, dto.horarios);
  }

  @Get(':id/disponibilidad')
  @ApiOperation({ summary: 'Consultar bloques libres y ocupados por fecha' })
  async obtenerDisponibilidad(
    @Param('id') id: string,
    @Query() query: DisponibilidadQueryDto,
  ): Promise<DisponibilidadDia> {
    return this.espaciosService.obtenerDisponibilidad(id, parseFecha(query.fecha));
  }

  @Get(':id/horarios')
  @ApiOperation({ summary: 'Listar horarios de atención configurados del espacio' })
  async obtenerHorarios(
    @Param('id') id: string,
    @Query('diaSemana', new ParseIntPipe({ optional: true })) diaSemana?: number,
  ): Promise<HorarioAtencion[]> {
    return this.espaciosService.obtenerHorarios(id, diaSemana);
  }

  @Get(':id/bloqueos')
  @ApiOperation({ summary: 'Listar bloqueos del espacio (todos o filtrados por fecha)' })
  async obtenerBloqueos(
    @Param('id') id: string,
    @Query() query: ListarBloqueosQueryDto,
  ): Promise<Bloqueo[]> {
    const fechaDate = query.fecha ? parseFecha(query.fecha) : undefined;
    return this.espaciosService.obtenerBloqueos(id, fechaDate, query.soloActivos);
  }
}
