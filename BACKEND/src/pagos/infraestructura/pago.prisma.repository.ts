import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  FiltrosListadoPagos,
  IPagoRepository,
  PagoConReservacion,
  PagoDetallado,
} from '../../dominio/contratos/pago.repository.interface.js';
import { Pago, EstadoPago, MetodoPago } from '../../dominio/entidades/pago.entity.js';
import { EstadoReservacion } from '../../dominio/entidades/reservacion.entity.js';
import { EstadoReservacionInvalidoError, PagoEstadoInvalidoError, PagoNoEncontradoError, ReservacionYaPagadaError, } from '../../dominio/errores/dominio.errors.js';
import type { EstadoPago as PrismaEstadoPago, MetodoPago as PrismaMetodoPago, } from '../../generated/prisma/enums.js';

@Injectable()
export class PagoPrismaRepository implements IPagoRepository {
  constructor(private readonly prisma: PrismaService) { }

  async guardarConReservaciones(items: PagoConReservacion[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Orden estable para los lotes que comparten reservaciones.
      const ordenados = [...items].sort((a, b) =>
        a.reservacionId.localeCompare(b.reservacionId),
      );
      for (const { pago, reservacionId } of ordenados) {
        await tx.pago.create({
          data: {
            id: pago.id,
            montoTotal: pago.montoTotal,
            estado: pago.estado as unknown as PrismaEstadoPago,
            metodo: (pago.metodo as unknown as PrismaMetodoPago) ?? null,
            referencia: pago.referencia ?? null,
          },
        });
        const resultado = await tx.reservacion.updateMany({
          where: {
            id: reservacionId,
            pagoId: null,
            estado: { not: 'CANCELADA' },
          },
          data: { pagoId: pago.id },
        });
        if (resultado.count !== 1) {
          const reserva = await tx.reservacion.findUnique({ where: { id: reservacionId } });
          if (reserva?.pagoId) throw new ReservacionYaPagadaError();
          throw new EstadoReservacionInvalidoError(
            'La reservación ya no está disponible para registrar el pago.',
          );
        }
      }
    });
  }

  async completarSiReservacionVigente(id: string): Promise<Pago> {
    return this.prisma.$transaction(async (tx) => {
      const resultado = await tx.pago.updateMany({
        where: {
          id,
          estado: 'PENDIENTE',
          reservacion: { is: { estado: { not: 'CANCELADA' } } },
        },
        data: { estado: 'COMPLETADO' },
      });
      const pago = await tx.pago.findUnique({ where: { id } });
      if (!pago) throw new PagoNoEncontradoError();
      if (resultado.count !== 1) {
        if (pago.estado !== 'PENDIENTE') {
          throw new PagoEstadoInvalidoError('Solo se pueden completar pagos pendientes.');
        }
        throw new EstadoReservacionInvalidoError(
          'No se puede completar el pago de una reservación cancelada o inexistente.',
        );
      }
      return this.mapearAPago(pago);
    });
  }

  async obtenerPorId(id: string): Promise<Pago | null> {
    const row = await this.prisma.pago.findUnique({ where: { id } });
    return row ? this.mapearAPago(row) : null;
  }

  async actualizar(pago: Pago): Promise<void> {
    await this.prisma.pago.update({
      where: { id: pago.id },
      data: {
        montoTotal: pago.montoTotal,
        estado: pago.estado as unknown as PrismaEstadoPago,
        metodo: (pago.metodo as unknown as PrismaMetodoPago) ?? null,
        referencia: pago.referencia ?? null,
      },
    });
  }

  private mapearEstadoReservacion(estado: string): EstadoReservacion {
    switch (estado) {
      case 'CONFIRMADA':
      case 'confirmada':
        return EstadoReservacion.CONFIRMADA;
      case 'CANCELADA':
      case 'cancelada':
        return EstadoReservacion.CANCELADA;
      case 'COMPLETADA':
      case 'completada':
        return EstadoReservacion.COMPLETADA;
      case 'PENDIENTE':
      case 'pendiente':
      default:
        return EstadoReservacion.PENDIENTE;
    }
  }

  async listarTodos(filtros: FiltrosListadoPagos = {}): Promise<PagoDetallado[]> {
    const where: Record<string, unknown> = {};
    if (filtros.estado) where.estado = filtros.estado as unknown as PrismaEstadoPago;
    if (filtros.metodo) where.metodo = filtros.metodo as unknown as PrismaMetodoPago;

    const rows = await this.prisma.pago.findMany({
      where,
      include: {
        reservacion: {
          include: {
            espacio: { select: { nombre: true } },
            usuario: { select: { nombre: true, correo: true } },
          },
        },
      },
    });

    return rows
      .map((row) => ({
        id: row.id,
        montoTotal: row.montoTotal,
        estado: row.estado as EstadoPago,
        metodo: (row.metodo as MetodoPago | null) ?? undefined,
        referencia: row.referencia ?? undefined,
        reservacion: row.reservacion
          ? {
              id: row.reservacion.id,
              fecha: new Date(row.reservacion.fecha),
              horaInicio: row.reservacion.horaInicio,
              horaFin: row.reservacion.horaFin,
              estado: this.mapearEstadoReservacion(row.reservacion.estado),
              espacioId: row.reservacion.espacioId,
              usuarioId: row.reservacion.usuarioId,
              espacioNombre: row.reservacion.espacio?.nombre,
              usuarioNombre: row.reservacion.usuario?.nombre,
              usuarioCorreo: row.reservacion.usuario?.correo,
            }
          : null,
      }))
      .sort((a, b) => {
        const fa = a.reservacion ? a.reservacion.fecha.getTime() : 0;
        const fb = b.reservacion ? b.reservacion.fecha.getTime() : 0;
        if (fb !== fa) return fb - fa;
        const ha = a.reservacion?.horaInicio ?? '';
        const hb = b.reservacion?.horaInicio ?? '';
        return hb.localeCompare(ha) || b.id.localeCompare(a.id);
      });
  }

  private mapearAPago(row: any): Pago {
    return new Pago(
      row.id,
      row.montoTotal,
      row.estado as EstadoPago,
      (row.metodo as MetodoPago | null) ?? undefined,
      row.referencia ?? undefined,
    );
  }
}
