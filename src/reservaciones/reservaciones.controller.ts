import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ReservacionesService } from './reservaciones.service.js';
import { CrearReservacionDto } from './dto/crear-reservacion.dto.js';
import {
  Reservacion,
  EstadoReservacion,
} from '../dominio/entidades/reservacion.entity.js';

@Controller('reservaciones')
export class ReservacionesController {
  constructor(private readonly reservacionesService: ReservacionesService) {}

  @Post()
  async crearReservacion(@Body() dto: CrearReservacionDto): Promise<Reservacion> {
    const id = dto.id ?? randomUUID();
    const pagoId = dto.pagoId ?? randomUUID();

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
  async obtenerPorId(@Param('id') id: string): Promise<Reservacion> {
    const reservacion = await this.reservacionesService.obtenerPorId(id);
    if (!reservacion) {
      throw new NotFoundException(`La reservación con ID ${id} no fue encontrada.`);
    }
    return reservacion;
  }

  @Get('cliente/:usuarioId')
  async obtenerHistorialCliente(
    @Param('usuarioId') usuarioId: string,
  ): Promise<Reservacion[]> {
    return this.reservacionesService.obtenerHistorialCliente(usuarioId);
  }

  @Patch(':id/confirmar')
  async confirmar(@Param('id') id: string): Promise<{ mensaje: string; reservacion: Reservacion | null }> {
    await this.reservacionesService.confirmarReservacion(id);
    const reservacion = await this.reservacionesService.obtenerPorId(id);
    return {
      mensaje: 'Reservación confirmada exitosamente',
      reservacion,
    };
  }

  @Patch(':id/completar')
  async completar(@Param('id') id: string): Promise<{ mensaje: string; reservacion: Reservacion | null }> {
    await this.reservacionesService.completarReservacion(id);
    const reservacion = await this.reservacionesService.obtenerPorId(id);
    return {
      mensaje: 'Reservación completada exitosamente',
      reservacion,
    };
  }

  @Patch(':id/cancelar')
  async cancelar(@Param('id') id: string): Promise<{ mensaje: string; reservacion: Reservacion | null }> {
    await this.reservacionesService.cancelarReservacion(id);
    const reservacion = await this.reservacionesService.obtenerPorId(id);
    return {
      mensaje: 'Reservación cancelada exitosamente',
      reservacion,
    };
  }
}
