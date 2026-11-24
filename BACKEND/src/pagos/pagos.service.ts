import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  FiltrosListadoPagos,
  IPagoRepository,
  PagoDetallado,
} from '../dominio/contratos/pago.repository.interface.js';
import type { IReservacionRepository } from '../dominio/contratos/reservacion.repository.interface.js';
import { EstadoPago, MetodoPago, Pago } from '../dominio/entidades/pago.entity.js';
import { EstadoReservacion, Reservacion } from '../dominio/entidades/reservacion.entity.js';
import { RolUsuario } from '../dominio/entidades/usuario.entity.js';
import { EstadoReservacionInvalidoError, PagoNoEncontradoError, ReservacionNoEncontradaError, ReservacionYaPagadaError, } from '../dominio/errores/dominio.errors.js';
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
    if (estado === EstadoPago.COMPLETADO) {
      for (const { reservacionId } of items) {
        const reservacion = await this.reservacionRepo.obtenerPorId(reservacionId);
        if (reservacion && reservacion.estado === EstadoReservacion.PENDIENTE) {
          reservacion.estado = EstadoReservacion.CONFIRMADA;
          await this.reservacionRepo.actualizar(reservacion);
        }
      }
    }
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

  async completarPago(id: string): Promise<Pago> {
    const pago = await this.pagoRepo.completarSiReservacionVigente(id);
    const reservacion = await this.reservacionRepo.obtenerPorPagoId(id);
    if (reservacion && reservacion.estado === EstadoReservacion.PENDIENTE) {
      reservacion.estado = EstadoReservacion.CONFIRMADA;
      await this.reservacionRepo.actualizar(reservacion);
    }
    return pago;
  }

  async listarPagos(
    filtros: FiltrosListadoPagos & { busqueda?: string } = {},
  ): Promise<PagoDetallado[]> {
    const lista = await this.pagoRepo.listarTodos({
      estado: filtros.estado,
      metodo: filtros.metodo,
    });
    const termino = filtros.busqueda?.trim().toLowerCase();
    if (!termino) return lista;

    return lista.filter((p) => {
      return (
        p.id.toLowerCase().includes(termino) ||
        (p.referencia?.toLowerCase().includes(termino) ?? false) ||
        (p.reservacion?.id.toLowerCase().includes(termino) ?? false) ||
        (p.reservacion?.usuarioNombre?.toLowerCase().includes(termino) ?? false) ||
        (p.reservacion?.usuarioCorreo?.toLowerCase().includes(termino) ?? false) ||
        (p.reservacion?.espacioNombre?.toLowerCase().includes(termino) ?? false)
      );
    });
  }
}
