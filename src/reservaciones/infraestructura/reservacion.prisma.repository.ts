import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IReservacionRepository } from '../../dominio/contratos/reservacion.repository.interface.js';
import { Reservacion, EstadoReservacion as DominioEstadoReservacion } from '../../dominio/entidades/reservacion.entity.js';
import type { EstadoReservacion as PrismaEstadoReservacion } from '../../generated/prisma/enums.js';

@Injectable()
export class ReservacionPrismaRepository implements IReservacionRepository {
  constructor(private readonly prisma: PrismaService) { }

  async guardar(reservacion: Reservacion): Promise<void> {
    await this.prisma.reservacion.create({
      data: {
        id: reservacion.id,
        fecha: reservacion.fecha,
        horaInicio: reservacion.horaInicio,
        horaFin: reservacion.horaFin,
        estado: this.mapDominioAPrismaEstado(reservacion.estado),
        espacioId: reservacion.espacioId,
        usuarioId: reservacion.usuarioId,
        pagoId: reservacion.pagoId || null,
        cantidadPersonas: reservacion.cantidadPersonas,
        subtotal: reservacion.subtotal,
      },
    });
  }

  async obtenerPorEspacioYFecha(espacioId: string, fecha: Date): Promise<Reservacion[]> {
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    const margenInicio = new Date(inicioDia.getTime() - 24 * 60 * 60 * 1000);
    const margenFin = new Date(finDia.getTime() + 24 * 60 * 60 * 1000);

    const rows = await this.prisma.reservacion.findMany({
      where: {
        espacioId,
        fecha: {
          gte: margenInicio,
          lte: margenFin,
        },
        estado: {
          not: 'CANCELADA',
        },
      },
    });

    return rows
      .filter((r) => new Date(r.fecha).toDateString() === fecha.toDateString())
      .map((r) => this.mapearAReservacion(r));
  }

  async obtenerPorId(id: string): Promise<Reservacion | null> {
    const row = await this.prisma.reservacion.findUnique({
      where: { id },
    });
    return row ? this.mapearAReservacion(row) : null;
  }

  async obtenerPorUsuarioId(usuarioId: string): Promise<Reservacion[]> {
    const rows = await this.prisma.reservacion.findMany({
      where: { usuarioId },
    });
    return rows.map((r) => this.mapearAReservacion(r));
  }

  async actualizar(reservacion: Reservacion): Promise<void> {
    await this.prisma.reservacion.update({
      where: { id: reservacion.id },
      data: {
        fecha: reservacion.fecha,
        horaInicio: reservacion.horaInicio,
        horaFin: reservacion.horaFin,
        estado: this.mapDominioAPrismaEstado(reservacion.estado),
        espacioId: reservacion.espacioId,
        usuarioId: reservacion.usuarioId,
        pagoId: reservacion.pagoId || null,
        cantidadPersonas: reservacion.cantidadPersonas,
        subtotal: reservacion.subtotal,
      },
    });
  }

  private mapDominioAPrismaEstado(estado: DominioEstadoReservacion): PrismaEstadoReservacion {
    switch (estado) {
      case DominioEstadoReservacion.CONFIRMADA:
        return 'CONFIRMADA';
      case DominioEstadoReservacion.CANCELADA:
        return 'CANCELADA';
      case DominioEstadoReservacion.COMPLETADA:
        return 'COMPLETADA';
      case DominioEstadoReservacion.PENDIENTE:
      default:
        return 'PENDIENTE';
    }
  }

  private mapPrismaADominioEstado(estado: string): DominioEstadoReservacion {
    switch (estado) {
      case 'CONFIRMADA':
      case 'confirmada':
        return DominioEstadoReservacion.CONFIRMADA;
      case 'CANCELADA':
      case 'cancelada':
        return DominioEstadoReservacion.CANCELADA;
      case 'COMPLETADA':
      case 'completada':
        return DominioEstadoReservacion.COMPLETADA;
      case 'PENDIENTE':
      case 'pendiente':
      default:
        return DominioEstadoReservacion.PENDIENTE;
    }
  }

  private mapearAReservacion(row: any): Reservacion {
    return new Reservacion(
      row.id,
      new Date(row.fecha),
      row.horaInicio,
      row.horaFin,
      this.mapPrismaADominioEstado(row.estado),
      row.espacioId,
      row.usuarioId,
      row.pagoId ?? '',
      row.cantidadPersonas,
      row.subtotal
    );
  }
}
