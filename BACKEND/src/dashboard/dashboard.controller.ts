import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ResumenQueryDto } from './dto/resumen-query.dto.js';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService, type DashboardResumen } from './dashboard.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolUsuario } from '../dominio/entidades/usuario.entity.js';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Obtener métricas generales e ingresos del tablero administrativo (Solo ADMIN)' })
  async obtenerResumen(@Query() query: ResumenQueryDto): Promise<DashboardResumen> {
    return this.dashboardService.obtenerResumen(query);
  }
}
