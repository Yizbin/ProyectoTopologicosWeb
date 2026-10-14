import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ReservacionesService } from './reservaciones.service.js';
import { CrearReservacionDto } from './dto/crear-reservacion.dto.js';
import {
  Reservacion,
  EstadoReservacion,
} from '../dominio/entidades/reservacion.entity.js';
import { RolUsuario } from '../dominio/entidades/usuario.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('reservaciones')
export class ReservacionesController {
  constructor(private readonly reservacionesService: ReservacionesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async crearReservacion(@Body() dto: CrearReservacionDto): Promise<Reservacion> {
    const id = dto.id ?? randomUUID();
    const pagoId = dto.pagoId ?? '';

    const nuevaReservacion = new Reservacion(
      id,
      new Date(dto.fecha),
      dto.horaInicio,
      dto.horaFin,
      EstadoReservacion.PENDIENTE,
      dto.espacioId,
      dto.usuarioId,
      pagoId,
      dto.cantidadPersonas,
      0,
    );

    await this.reservacionesService.crearReservacion(nuevaReservacion);
    const creada = await this.reservacionesService.obtenerPorId(id);
    return creada ?? nuevaReservacion;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async obtenerPorId(@Param('id') id: string): Promise<Reservacion> {
    const reservacion = await this.reservacionesService.obtenerPorId(id);
    if (!reservacion) {
      throw new NotFoundException(`La reservación con ID ${id} no fue encontrada.`);
    }
    return reservacion;
  }

  @Get('cliente/:usuarioId')
  @UseGuards(JwtAuthGuard)
  async obtenerHistorialCliente(
    @Param('usuarioId') usuarioId: string,
  ): Promise<Reservacion[]> {
    return this.reservacionesService.obtenerHistorialCliente(usuarioId);
  }

  @Patch(':id/confirmar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async confirmar(@Param('id') id: string): Promise<{ mensaje: string; reservacion: Reservacion | null }> {
    await this.reservacionesService.confirmarReservacion(id);
    const reservacion = await this.reservacionesService.obtenerPorId(id);
    return {
      mensaje: 'Reservación confirmada exitosamente',
      reservacion,
    };
  }

  @Patch(':id/completar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async completar(@Param('id') id: string): Promise<{ mensaje: string; reservacion: Reservacion | null }> {
    await this.reservacionesService.completarReservacion(id);
    const reservacion = await this.reservacionesService.obtenerPorId(id);
    return {
      mensaje: 'Reservación completada exitosamente',
      reservacion,
    };
  }

  @Patch(':id/cancelar')
  @UseGuards(JwtAuthGuard)
  async cancelar(@Param('id') id: string): Promise<{ mensaje: string; reservacion: Reservacion | null }> {
    await this.reservacionesService.cancelarReservacion(id);
    const reservacion = await this.reservacionesService.obtenerPorId(id);
    return {
      mensaje: 'Reservación cancelada exitosamente',
      reservacion,
    };
  }
}
