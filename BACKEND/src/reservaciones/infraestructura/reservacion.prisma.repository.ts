import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IReservacionRepository } from '../../dominio/contratos/reservacion.repository.interface.js';
import { Reservacion, EstadoReservacion as DominioEstadoReservacion } from '../../dominio/entidades/reservacion.entity.js';
import type { EstadoReservacion as PrismaEstadoReservacion } from '../../generated/prisma/enums.js';
import { parseFecha, sumarDias } from '../../common/utils/fecha.util.js';

@Injectable()
export class ReservacionPrismaRepository implements IReservacionRepository {
  constructor(private readonly prisma: PrismaService) { }

  private datosCreacion(reservacion: Reservacion) {
    return {
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
    };
  }

  async guardar(reservacion: Reservacion): Promise<void> {
    await this.prisma.reservacion.create({ data: this.datosCreacion(reservacion) });
  }

  async guardarVarias(reservaciones: Reservacion[]): Promise<void> {
    await this.prisma.$transaction(
      reservaciones.map((r) => this.prisma.reservacion.create({ data: this.datosCreacion(r) })),
    );
  }

  async obtenerPorPagoId(pagoId: string): Promise<Reservacion | null> {
    const row = await this.prisma.reservacion.findUnique({ where: { pagoId } });
    return row ? this.mapearAReservacion(row) : null;
  }

  async obtenerPorEspacioYFecha(espacioId: string, fecha: Date): Promise<Reservacion[]> {
    // Las fechas de reservación son días de calendario guardados como medianoche UTC.
    const inicioDia = parseFecha(fecha);
    const finDia = sumarDias(inicioDia, 1);

    const rows = await this.prisma.reservacion.findMany({
      where: {
        espacioId,
        fecha: { gte: inicioDia, lt: finDia },
        estado: { not: 'CANCELADA' },
      },
    });

    return rows.map((r: any) => this.mapearAReservacion(r));
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
      orderBy: { fecha: 'desc' },
    });
    return rows.map((r) => this.mapearAReservacion(r));
  }

  async obtenerTodas(): Promise<Reservacion[]> {
    const rows = await this.prisma.reservacion.findMany({
      orderBy: { fecha: 'desc' },
    });
    return rows.map((r) => this.mapearAReservacion(r));
  }

  async obtenerPorRangoFechas(fechaInicio: Date, fechaFin: Date, espacioId?: string): Promise<Reservacion[]> {
    const rows = await this.prisma.reservacion.findMany({
      where: {
        espacioId: espacioId || undefined,
        fecha: {
          gte: parseFecha(fechaInicio),
          lt: sumarDias(parseFecha(fechaFin), 1), // el día final se incluye completo
        },
      },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
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