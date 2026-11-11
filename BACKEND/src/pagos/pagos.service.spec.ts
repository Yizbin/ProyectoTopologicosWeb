import { describe, it, expect, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { PagosService } from './pagos.service.js';
import { PagoMemoryRepository } from './infraestructura/pago.memory.repository.js';
import { ReservacionMemoryRepository } from '../reservaciones/infraestructura/reservacion.memory.repository.js';
import { Reservacion, EstadoReservacion } from '../dominio/entidades/reservacion.entity.js';
import { EstadoPago, MetodoPago } from '../dominio/entidades/pago.entity.js';
import { RolUsuario } from '../dominio/entidades/usuario.entity.js';
import { EstadoReservacionInvalidoError, PagoEstadoInvalidoError, PagoNoEncontradoError, ReservacionNoEncontradaError, ReservacionYaPagadaError, } from '../dominio/errores/dominio.errors.js';
import { parseFecha } from '../common/utils/fecha.util.js';

describe('PagosService', () => {
  let reservaciones: ReservacionMemoryRepository;
  let pagos: PagoMemoryRepository;
  let service: PagosService;
  const cliente = { id: 'cliente-1', rol: RolUsuario.CLIENTE };
  const admin = { id: 'admin-1', rol: RolUsuario.ADMIN };

  const reservacion = (id: string, usuarioId = 'cliente-1', subtotal = 200, estado = EstadoReservacion.PENDIENTE) =>
    new Reservacion(id, parseFecha('2030-01-07'), '10:00', '12:00', estado, `espacio-${id}`, usuarioId, '', 2, subtotal);

  beforeEach(async () => {
    reservaciones = new ReservacionMemoryRepository();
    pagos = new PagoMemoryRepository(reservaciones);
    service = new PagosService(pagos, reservaciones);
    await reservaciones.guardarVarias([reservacion('r1'), reservacion('r2', 'cliente-1', 300), reservacion('ajena', 'otro')]);
  });

  it('cliente paga con TARJETA: pago COMPLETADO por el subtotal y la reservación queda enlazada', async () => {
    const [pago] = await service.registrarPago({ reservacionIds: ['r1'], metodo: MetodoPago.TARJETA, referencia: 'AUT-1' }, cliente);
    expect(pago).toMatchObject({ montoTotal: 200, estado: EstadoPago.COMPLETADO, metodo: MetodoPago.TARJETA, referencia: 'AUT-1' });
    expect((await reservaciones.obtenerPorId('r1'))?.pagoId).toBe(pago.id);
  });

  it('cliente con EFECTIVO queda PENDIENTE y el admin lo completa una sola vez', async () => {
    const [pago] = await service.registrarPago({ reservacionIds: ['r1'], metodo: MetodoPago.EFECTIVO }, cliente);
    expect(pago.estado).toBe(EstadoPago.PENDIENTE);
    expect((await service.completarPago(pago.id)).estado).toBe(EstadoPago.COMPLETADO);
    await expect(service.completarPago(pago.id)).rejects.toThrow(PagoEstadoInvalidoError);
    await expect(service.completarPago('x')).rejects.toThrow(PagoNoEncontradoError);
  });

  it('el admin registra pagos (en cualquier método) de reservaciones de otros: COMPLETADO', async () => {
    const [pago] = await service.registrarPago({ reservacionIds: ['ajena'], metodo: MetodoPago.EFECTIVO }, admin);
    expect(pago.estado).toBe(EstadoPago.COMPLETADO);
  });

  it('paga varias reservaciones a la vez (un pago por reservación)', async () => {
    const lista = await service.registrarPago({ reservacionIds: ['r1', 'r2'], metodo: MetodoPago.TARJETA, referencia: 'AUT-2' }, cliente);
    expect(lista.map((p) => p.montoTotal)).toEqual([200, 300]);
  });

  it('acepta un solo pago entre dos solicitudes simultáneas', async () => {
    const dto = { reservacionIds: ['r1'], metodo: MetodoPago.EFECTIVO };
    const resultados = await Promise.allSettled([
      service.registrarPago(dto, cliente),
      service.registrarPago(dto, cliente),
    ]);
    expect(resultados.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const fallo = resultados.find(r => r.status === 'rejected');
    expect(fallo?.status === 'rejected' && fallo.reason).toBeInstanceOf(ReservacionYaPagadaError);
    expect(pagos.pagos).toHaveLength(1);
    expect((await reservaciones.obtenerPorId('r1'))?.pagoId).toBe(pagos.pagos[0].id);
  });

  it('no completa un pago si la reserva fue cancelada después de registrarlo', async () => {
    const [pago] = await service.registrarPago(
      { reservacionIds: ['r1'], metodo: MetodoPago.EFECTIVO }, cliente,
    );
    const reserva = (await reservaciones.obtenerPorId('r1'))!;
    reserva.estado = EstadoReservacion.CANCELADA;
    await reservaciones.actualizar(reserva);
    await expect(service.completarPago(pago.id)).rejects.toThrow(EstadoReservacionInvalidoError);
    expect(pago.estado).toBe(EstadoPago.PENDIENTE);
  });

  it('un pago registrado no confirma automáticamente la reserva', async () => {
    await service.registrarPago(
      { reservacionIds: ['r1'], metodo: MetodoPago.TARJETA, referencia: 'SIMULACION' }, cliente,
    );
    expect((await reservaciones.obtenerPorId('r1'))?.estado).toBe(EstadoReservacion.PENDIENTE);
  });

  it('solo completa una vez un pago con solicitudes simultáneas', async () => {
    const [pago] = await service.registrarPago(
      { reservacionIds: ['r1'], metodo: MetodoPago.EFECTIVO }, cliente,
    );
    const resultados = await Promise.allSettled([
      service.completarPago(pago.id), service.completarPago(pago.id),
    ]);
    expect(resultados.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(pago.estado).toBe(EstadoPago.COMPLETADO);
  });

  it('un cliente no puede pagar reservaciones ajenas ni ver pagos ajenos', async () => {
    await expect(service.registrarPago({ reservacionIds: ['ajena'], metodo: MetodoPago.EFECTIVO }, cliente)).rejects.toThrow(ForbiddenException);
    const [pago] = await service.registrarPago({ reservacionIds: ['ajena'], metodo: MetodoPago.EFECTIVO }, admin);
    await expect(service.obtenerPorId(pago.id, cliente)).rejects.toThrow(ForbiddenException);
    await expect(service.obtenerPorId(pago.id, admin)).resolves.toMatchObject({ id: pago.id });
  });

  it('rechaza reservaciones inexistentes, canceladas o ya pagadas, sin dejar pagos a medias', async () => {
    await reservaciones.guardar(reservacion('cancelada', 'cliente-1', 100, EstadoReservacion.CANCELADA));
    await expect(service.registrarPago({ reservacionIds: ['nope'], metodo: MetodoPago.EFECTIVO }, cliente)).rejects.toThrow(ReservacionNoEncontradaError);
    await expect(service.registrarPago({ reservacionIds: ['cancelada'], metodo: MetodoPago.EFECTIVO }, cliente)).rejects.toThrow(EstadoReservacionInvalidoError);

    await service.registrarPago({ reservacionIds: ['r1'], metodo: MetodoPago.EFECTIVO }, cliente);
    await expect(service.registrarPago({ reservacionIds: ['r2', 'r1'], metodo: MetodoPago.EFECTIVO }, cliente)).rejects.toThrow(ReservacionYaPagadaError);
    expect((await reservaciones.obtenerPorId('r2'))?.pagoId).toBe(''); // r2 no se pagó porque el lote falló
    expect(pagos.pagos).toHaveLength(1);
  });
});
