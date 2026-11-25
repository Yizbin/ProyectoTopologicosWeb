import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from './dashboard.service.js';
import { formatoFecha, hoy, sumarDias } from '../common/utils/fecha.util.js';
import { TipoEspacio } from '../dominio/entidades/espacio.entity.js';
import { EstadoReservacion } from '../dominio/entidades/reservacion.entity.js';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockPrisma: any;

  beforeEach(() => {
    const fechaHoy = hoy();
    const fechaEn3Dias = sumarDias(fechaHoy, 3);
    const fechaEn20Dias = sumarDias(fechaHoy, 20);

    mockPrisma = {
      espacio: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'e1', nombre: 'Sala Magna', tipo: 'SALA', activo: true },
          { id: 'e2', nombre: 'Cubículo 1', tipo: 'CUBICULO', activo: false },
        ]),
      },
      reservacion: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'r-20d',
            fecha: fechaEn20Dias,
            horaInicio: '09:00',
            horaFin: '11:00',
            estado: 'PENDIENTE',
            subtotal: 300,
            espacio: { id: 'e1', nombre: 'Sala Magna', tipo: 'SALA' },
            usuario: { id: 'u1', nombre: 'Ana', correo: 'ana@test.com' },
            pago: null,
          },
          {
            id: 'r-3d',
            fecha: fechaEn3Dias,
            horaInicio: '14:00',
            horaFin: '16:00',
            estado: 'CONFIRMADA',
            subtotal: 400,
            espacio: { id: 'e1', nombre: 'Sala Magna', tipo: 'SALA' },
            usuario: { id: 'u1', nombre: 'Ana', correo: 'ana@test.com' },
            pago: { id: 'p1', estado: 'COMPLETADO', montoTotal: 400 },
          },
          {
            id: 'r-hoy',
            fecha: fechaHoy,
            horaInicio: '10:00',
            horaFin: '12:00',
            estado: 'COMPLETADA',
            subtotal: 200,
            espacio: { id: 'e2', nombre: 'Cubículo 1', tipo: 'CUBICULO' },
            usuario: { id: 'u2', nombre: 'Luis', correo: 'luis@test.com' },
            pago: { id: 'p2', estado: 'PENDIENTE', montoTotal: 200 },
          },
          {
            id: 'r-canc',
            fecha: fechaHoy,
            horaInicio: '18:00',
            horaFin: '19:00',
            estado: 'CANCELADA',
            subtotal: 150,
            espacio: { id: 'e1', nombre: 'Sala Magna', tipo: 'SALA' },
            usuario: { id: 'u1', nombre: 'Ana', correo: 'ana@test.com' },
            pago: null,
          },
        ]),
      },
      pago: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'p1', montoTotal: 400, estado: 'COMPLETADO' },
          { id: 'p2', montoTotal: 200, estado: 'PENDIENTE' },
        ]),
      },
      usuario: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'u1', rol: 'CLIENTE' },
          { id: 'u2', rol: 'CLIENTE' },
          { id: 'u3', rol: 'ADMIN' },
        ]),
      },
    };

    service = new DashboardService(mockPrisma);
  });

  it('calcula métricas reales consolidadas para el tablero administrativo', async () => {
    const resumen = await service.obtenerResumen();

    expect(resumen.espacios).toEqual({ total: 2, activos: 1, inactivos: 1 });
    expect(resumen.reservaciones).toEqual({
      total: 4,
      pendientes: 1,
      confirmadas: 1,
      completadas: 1,
      canceladas: 1,
      hoy: 1,
      proximos7Dias: 2,
    });
    expect(resumen.ingresos).toEqual({
      acumulados: 400,
      pendientesPorCobrar: 500,
      pagosCompletados: 1,
      pagosPendientes: 1,
    });
    expect(resumen.usuarios).toEqual({ total: 3, clientes: 2, admins: 1 });

    expect(resumen.topEspacios).toEqual([
      {
        espacioId: 'e1',
        nombre: 'Sala Magna',
        tipo: TipoEspacio.SALA,
        totalReservaciones: 2,
        ingresosGenerados: 400,
      },
      {
        espacioId: 'e2',
        nombre: 'Cubículo 1',
        tipo: TipoEspacio.CUBICULO,
        totalReservaciones: 1,
        ingresosGenerados: 0,
      },
    ]);

    expect(resumen.ultimasReservaciones).toHaveLength(4);
    expect(resumen.ultimasReservaciones[0]).toMatchObject({
      id: 'r-20d',
      fecha: formatoFecha(sumarDias(hoy(), 20)),
      estado: EstadoReservacion.PENDIENTE,
      espacio: { id: 'e1', nombre: 'Sala Magna', tipo: TipoEspacio.SALA },
      cliente: { id: 'u1', nombre: 'Ana', correo: 'ana@test.com' },
    });
  });

  it('rechaza rangos incompletos, invertidos o demasiado extensos antes de consultar', async () => {
    await expect(service.obtenerResumen({ fechaInicio: '2030-01-01' })).rejects.toThrow('fechaInicio y fechaFin');
    await expect(service.obtenerResumen({ fechaInicio: '2030-01-02', fechaFin: '2030-01-01' })).rejects.toThrow('período');
    await expect(service.obtenerResumen({ fechaInicio: '2030-01-01', fechaFin: '2032-01-01' })).rejects.toThrow('período');
    expect(mockPrisma.reservacion.findMany).not.toHaveBeenCalled();
  });

  it('aplica el mismo período a reservas y pagos vinculados', async () => {
    await service.obtenerResumen({ fechaInicio: '2030-01-01', fechaFin: '2030-01-31' });
    const rango = { gte: new Date('2030-01-01'), lt: new Date('2030-02-01') };
    expect(mockPrisma.reservacion.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { fecha: rango } }));
    expect(mockPrisma.pago.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { reservacion: { is: { fecha: rango } } } }));
  });
});
