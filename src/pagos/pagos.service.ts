import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IPagoRepository } from '../dominio/contratos/pago.repository.interface.js';
import type { IReservacionRepository } from '../dominio/contratos/reservacion.repository.interface.js';
import { EstadoPago, MetodoPago, Pago } from '../dominio/entidades/pago.entity.js';
import { EstadoReservacion, Reservacion } from '../dominio/entidades/reservacion.entity.js';
import { RolUsuario } from '../dominio/entidades/usuario.entity.js';
import {
  EstadoReservacionInvalidoError,
  PagoEstadoInvalidoError,
  PagoNoEncontradoError,
  ReservacionNoEncontradaError,
  ReservacionYaPagadaError,
} from '../dominio/errores/dominio.errors.js';
import { PAGO_REPO_TOKEN, RESERVACION_REPO_TOKEN } from '../tokens/tokens.js';
import { CrearPagoDto } from './dto/crear-pago.dto.js';

export interface UsuarioAutenticado {
  id: string;
  rol: RolUsuario;
}

@Injectable()
export class PagosService {
  constructor(
    @Inject(PAGO_REPO_TOKEN) private readonly pagoRepo: IPagoRepository,
    @Inject(RESERVACION_REPO_TOKEN) private readonly reservacionRepo: IReservacionRepository,
  ) { }

  async registrarPago(dto: CrearPagoDto, usuario: UsuarioAutenticado): Promise<Pago[]> {
    const esAdmin = usuario.rol === RolUsuario.ADMIN;
    const estado = esAdmin || dto.metodo === MetodoPago.TARJETA ? EstadoPago.COMPLETADO : EstadoPago.PENDIENTE;

    const items: { pago: Pago; reservacionId: string }[] = [];
    for (const reservacionId of dto.reservacionIds) {
      const reservacion = await this.reservacionRepo.obtenerPorId(reservacionId);
      if (!reservacion) {
        throw new ReservacionNoEncontradaError(`La reservación ${reservacionId} no existe.`);
      }
      if (!esAdmin && reservacion.usuarioId !== usuario.id) {
        throw new ForbiddenException(`No tienes permiso para pagar la reservación ${reservacionId}.`);
      }
      if (reservacion.estado === EstadoReservacion.CANCELADA) {
        throw new EstadoReservacionInvalidoError(`La reservación ${reservacionId} está cancelada y no se puede pagar.`);
      }
      if (reservacion.pagoId) {
        throw new ReservacionYaPagadaError(`La reservación ${reservacionId} ya tiene un pago registrado.`);
      }
      items.push({
        reservacionId,
        pago: new Pago(randomUUID(), reservacion.subtotal, estado, dto.metodo, dto.referencia),
      });
    }

    await this.pagoRepo.guardarConReservaciones(items);
    return items.map((i) => i.pago);
  }

  async obtenerPorId(id: string, usuario: UsuarioAutenticado): Promise<Pago> {
    const pago = await this.pagoRepo.obtenerPorId(id);
    if (!pago) {
      throw new PagoNoEncontradoError(`El pago ${id} no fue encontrado.`);
    }
    if (usuario.rol !== RolUsuario.ADMIN) {
      const reservacion: Reservacion | null = await this.reservacionRepo.obtenerPorPagoId(id);
      if (!reservacion || reservacion.usuarioId !== usuario.id) {
        throw new ForbiddenException('No tienes permiso sobre este pago.');
      }
    }
    return pago;
  }

  /** Admin: confirma un pago en efectivo que estaba PENDIENTE. */
  async completarPago(id: string): Promise<Pago> {
    const pago = await this.pagoRepo.obtenerPorId(id);
    if (!pago) {
      throw new PagoNoEncontradoError(`El pago ${id} no fue encontrado.`);
    }
    if (pago.estado !== EstadoPago.PENDIENTE) {
      throw new PagoEstadoInvalidoError('Solo se pueden completar pagos pendientes.');
    }
    pago.estado = EstadoPago.COMPLETADO;
    await this.pagoRepo.actualizar(pago);
    return pago;
  }
}