import type { RegistroPagoResponse } from '../shared/api-contracts.js';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PagosService } from './pagos.service.js';
import type { UsuarioAutenticado } from './pagos.service.js';
import { CrearPagoDto } from './dto/crear-pago.dto.js';
import { ListarPagosQueryDto } from './dto/listar-pagos-query.dto.js';
import { paginarLista, type ResultadoPaginado } from '../common/utils/paginacion.util.js';
import type { PagoDetallado } from '../dominio/contratos/pago.repository.interface.js';
import { Pago } from '../dominio/entidades/pago.entity.js';
import { RolUsuario } from '../dominio/entidades/usuario.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Pagos')
@ApiBearerAuth()
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Registrar pago de reservación (ADMIN puede cobrar en efectivo a cualquier cliente)' })
  async registrarPago(
    @Body() dto: CrearPagoDto,
    @CurrentUser() user: UsuarioAutenticado,
  ): Promise<RegistroPagoResponse> {
    const pagos = await this.pagosService.registrarPago(dto, user);
    return {
      cantidad: pagos.length,
      total: pagos.reduce((suma, p) => suma + p.montoTotal, 0),
      pagos,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Listar pagos con filtros por estado, método y búsqueda (Solo ADMIN)' })
  async listarPagos(
    @Query() query: ListarPagosQueryDto,
  ): Promise<PagoDetallado[] | ResultadoPaginado<PagoDetallado>> {
    const lista = await this.pagosService.listarPagos({
      estado: query.estado,
      metodo: query.metodo,
      busqueda: query.busqueda ?? query.q,
    });

    if (query.page !== undefined || query.limit !== undefined) {
      return paginarLista(lista, query.page, query.limit);
    }

    return lista;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Consultar detalle de un pago por ID' })
  async obtenerPorId(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticado,
  ): Promise<Pago> {
    return this.pagosService.obtenerPorId(id, user);
  }

  @Patch(':id/completar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Marcar como completado un pago pendiente en efectivo (Solo ADMIN)' })
  async completar(@Param('id') id: string): Promise<{ mensaje: string; pago: Pago }> {
    const pago = await this.pagosService.completarPago(id);
    return { mensaje: 'Pago completado exitosamente', pago };
  }
}
