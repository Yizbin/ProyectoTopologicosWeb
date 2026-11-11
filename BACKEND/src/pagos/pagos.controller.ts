import type { RegistroPagoResponse } from '../shared/api-contracts.js';
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PagosService } from './pagos.service.js';
import type { UsuarioAutenticado } from './pagos.service.js';
import { CrearPagoDto } from './dto/crear-pago.dto.js';
import { Pago } from '../dominio/entidades/pago.entity.js';
import { RolUsuario } from '../dominio/entidades/usuario.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async obtenerPorId(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticado,
  ): Promise<Pago> {
    return this.pagosService.obtenerPorId(id, user);
  }

  @Patch(':id/completar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async completar(@Param('id') id: string): Promise<{ mensaje: string; pago: Pago }> {
    const pago = await this.pagosService.completarPago(id);
    return { mensaje: 'Pago completado exitosamente', pago };
  }
}