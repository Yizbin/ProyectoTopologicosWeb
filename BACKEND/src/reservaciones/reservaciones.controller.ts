import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ReservacionesService } from './reservaciones.service.js';
import { CrearReservacionDto } from './dto/crear-reservacion.dto.js';
import { CrearReservacionesMultiplesDto } from './dto/crear-reservaciones-multiples.dto.js';
import { ListarReservacionesQueryDto } from './dto/listar-reservaciones-query.dto.js';
import { parseFecha } from '../common/utils/fecha.util.js';
import {
  Reservacion,
  EstadoReservacion,
} from '../dominio/entidades/reservacion.entity.js';
import { RolUsuario } from '../dominio/entidades/usuario.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

type UsuarioToken = { id: string; rol: RolUsuario };

@Controller('reservaciones')
export class ReservacionesController {
  constructor(private readonly reservacionesService: ReservacionesService) { }

  private esAdmin(user: UsuarioToken): boolean {
    return user.rol === RolUsuario.ADMIN;
  }

  private async obtenerAutorizada(id: string, user: UsuarioToken): Promise<Reservacion> {
    const reservacion = await this.reservacionesService.obtenerPorId(id);
    if (!reservacion) {
      throw new NotFoundException(`La reservación con ID ${id} no fue encontrada.`);
    }
    if (!this.esAdmin(user) && reservacion.usuarioId !== user.id) {
      throw new ForbiddenException('No tienes permiso sobre esta reservación.');
    }
    return reservacion;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async crearReservacion(
    @Body() dto: CrearReservacionDto,
    @CurrentUser() user: UsuarioToken,
  ): Promise<Reservacion> {
    const id = randomUUID();

    const nuevaReservacion = new Reservacion(
      id,
      parseFecha(dto.fecha),
      dto.horaInicio,
      dto.horaFin,
      EstadoReservacion.PENDIENTE,
      dto.espacioId,
      user.id,
      '',
      dto.cantidadPersonas,
      0,
    );

    await this.reservacionesService.crearReservacion(nuevaReservacion);
    const creada = await this.reservacionesService.obtenerPorId(id);
    return creada ?? nuevaReservacion;
  }

  @Post('multiples')
  @UseGuards(JwtAuthGuard)
  async crearReservacionesMultiples(
    @Body() dto: CrearReservacionesMultiplesDto,
    @CurrentUser() user: UsuarioToken,
  ): Promise<{ cantidad: number; total: number; reservaciones: Reservacion[] }> {
    const reservaciones = await this.reservacionesService.crearReservacionesMultiples({
      ...dto,
      usuarioId: user.id,
      generarId: randomUUID,
    });
    return {
      cantidad: reservaciones.length,
      total: reservaciones.reduce((suma, r) => suma + r.subtotal, 0),
      reservaciones,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async listar(@Query() query: ListarReservacionesQueryDto): Promise<Reservacion[]> {
    if ((query.fechaInicio && !query.fechaFin) || (!query.fechaInicio && query.fechaFin)) {
      throw new BadRequestException('Para filtrar por rango indica fechaInicio y fechaFin.');
    }
    const desde = query.fechaInicio ? parseFecha(query.fechaInicio) : undefined;
    const hasta = query.fechaFin ? parseFecha(query.fechaFin) : undefined;
    if (desde && hasta && hasta < desde) {
      throw new BadRequestException('fechaFin no puede ser anterior a fechaInicio.');
    }

    return this.reservacionesService.listarReservaciones({
      fecha: query.fecha ? parseFecha(query.fecha) : undefined,
      desde,
      hasta,
      espacioId: query.espacioId,
      estado: query.estado,
    });
  }

  @Get('cliente/:usuarioId')
  @UseGuards(JwtAuthGuard)
  async obtenerHistorialCliente(
    @Param('usuarioId') usuarioId: string,
    @CurrentUser() user: UsuarioToken,
  ): Promise<Reservacion[]> {
    if (!this.esAdmin(user) && user.id !== usuarioId) {
      throw new ForbiddenException('No puedes consultar el historial de otro usuario.');
    }
    return this.reservacionesService.obtenerHistorialCliente(usuarioId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async obtenerPorId(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioToken,
  ): Promise<Reservacion> {
    return this.obtenerAutorizada(id, user);
  }

  @Patch(':id/confirmar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async confirmar(@Param('id') id: string): Promise<{ mensaje: string; reservacion: Reservacion | null }> {
    await this.reservacionesService.confirmarReservacion(id);
    const reservacion = await this.reservacionesService.obtenerPorId(id);
    return { mensaje: 'Reservación confirmada exitosamente', reservacion };
  }

  @Patch(':id/completar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async completar(@Param('id') id: string): Promise<{ mensaje: string; reservacion: Reservacion | null }> {
    await this.reservacionesService.completarReservacion(id);
    const reservacion = await this.reservacionesService.obtenerPorId(id);
    return { mensaje: 'Reservación completada exitosamente', reservacion };
  }

  @Patch(':id/cancelar')
  @UseGuards(JwtAuthGuard)
  async cancelar(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioToken,
  ): Promise<{ mensaje: string; reservacion: Reservacion | null }> {
    await this.obtenerAutorizada(id, user);
    await this.reservacionesService.cancelarReservacion(id);
    const reservacion = await this.reservacionesService.obtenerPorId(id);
    return { mensaje: 'Reservación cancelada exitosamente', reservacion };
  }
}