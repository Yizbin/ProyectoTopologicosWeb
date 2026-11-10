import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IPagoRepository, PagoConReservacion } from '../../dominio/contratos/pago.repository.interface.js';
import { Pago, EstadoPago, MetodoPago } from '../../dominio/entidades/pago.entity.js';
import type {
  EstadoPago as PrismaEstadoPago,
  MetodoPago as PrismaMetodoPago,
} from '../../generated/prisma/enums.js';

@Injectable()
export class PagoPrismaRepository implements IPagoRepository {
  constructor(private readonly prisma: PrismaService) { }

  async guardarConReservaciones(items: PagoConReservacion[]): Promise<void> {
    await this.prisma.$transaction(
      items.flatMap(({ pago, reservacionId }) => [
        this.prisma.pago.create({
          data: {
            id: pago.id,
            montoTotal: pago.montoTotal,
            estado: pago.estado as unknown as PrismaEstadoPago,
            metodo: (pago.metodo as unknown as PrismaMetodoPago) ?? null,
            referencia: pago.referencia ?? null,
          },
        }),
        this.prisma.reservacion.update({
          where: { id: reservacionId },
          data: { pagoId: pago.id },
        }),
      ]),
    );
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