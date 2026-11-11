import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IReservacionRepository } from '../../dominio/contratos/reservacion.repository.interface.js';
import { Reservacion, EstadoReservacion as DominioEstadoReservacion } from '../../dominio/entidades/reservacion.entity.js';
import type { EstadoReservacion as PrismaEstadoReservacion } from '../../generated/prisma/enums.js';
import { hoy, parseFecha, sumarDias } from '../../common/utils/fecha.util.js';
import { EmpalmeReservacionError, EspacioNoEncontradoError,} from '../../dominio/errores/dominio.errors.js';

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
  await this.guardarVarias([reservacion]);
}

  async guardarVarias(reservaciones: Reservacion[]): Promise<void> {
  if (reservaciones.length === 0) return;

  const espacioIds = [
    ...new Set(reservaciones.map((r) => r.espacioId)),
  ].sort();

  await this.prisma.$transaction(
    async (tx) => {
      for (const espacioId of espacioIds) {
        const espacios = await tx.$queryRaw<{ id: string }[]>`
          SELECT id
          FROM espacios
          WHERE id = ${espacioId}
          FOR UPDATE
        `;

        if (espacios.length === 0) {
          throw new EspacioNoEncontradoError(
            `El espacio con ID ${espacioId} no existe.`,
          );
        }
      }

      for (const reservacion of reservaciones) {
        const inicioDia = parseFecha(reservacion.fecha);
        const finDia = sumarDias(inicioDia, 1);

        const conflicto = await tx.reservacion.findFirst({
          where: {
            espacioId: reservacion.espacioId,
            fecha: {
              gte: inicioDia,
              lt: finDia,
            },
            estado: {
              in: ['PENDIENTE', 'CONFIRMADA'],
            },
            horaInicio: {
              lt: reservacion.horaFin,
            },
            horaFin: {
              gt: reservacion.horaInicio,
            },
          },
          select: {
            id: true,
          },
        });

        if (conflicto) {
          throw new EmpalmeReservacionError(
            `El ${inicioDia.toISOString().slice(0, 10)} ya existe una ` +
            `reservación que ocupa el horario solicitado ` +
            `(${reservacion.horaInicio} - ${reservacion.horaFin}).`,
          );
        }

        // Usar tx mantiene la inserción dentro de la transacción.
        await tx.reservacion.create({
          data: this.datosCreacion(reservacion),
        });
      }
    },
    {
      isolationLevel: 'ReadCommitted',
      maxWait: 5_000,
      timeout: 15_000,
    },
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

  async cambiarEstado(
    id: string,
    esperado: DominioEstadoReservacion,
    nuevo: DominioEstadoReservacion,
    noIniciadaDesde?: Date,
  ): Promise<boolean> {
    const dia = noIniciadaDesde ? hoy(noIniciadaDesde) : undefined;
    const hora = noIniciadaDesde
      ? `${String(noIniciadaDesde.getHours()).padStart(2, '0')}:${String(noIniciadaDesde.getMinutes()).padStart(2, '0')}`
      : undefined;
    const resultado = await this.prisma.reservacion.updateMany({
      where: {
        id,
        estado: this.mapDominioAPrismaEstado(esperado),
        ...(dia && hora ? {
          OR: [
            { fecha: { gt: dia } },
            { fecha: dia, horaInicio: { gt: hora } },
          ],
        } : {}),
      },
      data: { estado: this.mapDominioAPrismaEstado(nuevo) },
    });
    return resultado.count === 1;
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
