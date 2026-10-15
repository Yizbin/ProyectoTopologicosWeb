import { describe, it, expect, beforeEach } from 'vitest';
import { EspaciosService } from './espacios.service.js';
import { EspacioMemoryRepository } from './infraestructura/espacio.memory.repository.js';
import { TipoEspacio } from '../dominio/entidades/espacio.entity.js';
import { RangoHorasReservaInvalidoError, HoraInvalidaError, EspacioNoEncontradoError } from '../dominio/errores/dominio.errors.js';

describe('EspaciosService - Reglas de Negocio', () => {
  let service: EspaciosService;
  let repo: EspacioMemoryRepository;
  let mockPrisma: any;

  beforeEach(() => {
    repo = new EspacioMemoryRepository();
    mockPrisma = {
      sede: {
        create: () => Promise.resolve(),
      },
    };
    service = new EspaciosService(repo, mockPrisma);
  });

  it('debe rechazar la creación de espacio si minimoHorasReserva > maximoHorasReserva', async () => {
    await expect(
      service.crearEspacio({
        nombre: 'Espacio Inválido',
        descripcion: 'Desc',
        tipo: TipoEspacio.SALA,
        costoPorHora: 100,
        duracionMinutos: 60,
        sedeId: 'sede-1',
        capacidadMaxima: 10,
        amenidades: ['WiFi'],
        minimoHorasReserva: 5,
        maximoHorasReserva: 2,
      }),
    ).rejects.toThrow(RangoHorasReservaInvalidoError);
  });

  it('debe permitir crear y listar espacios utilizando el contrato IEspacioRepository', async () => {
    const espacio = await service.crearEspacio({
      nombre: 'Sala Nueva',
      descripcion: 'Desc',
      tipo: TipoEspacio.SALA,
      costoPorHora: 150,
      duracionMinutos: 60,
      sedeId: 'sede-1',
      capacidadMaxima: 8,
      amenidades: ['TV'],
      minimoHorasReserva: 1,
      maximoHorasReserva: 4,
    });

    expect(espacio.id).toBeDefined();
    const lista = await service.listarEspacios();
    expect(lista).toHaveLength(1);
    expect(lista[0].nombre).toBe('Sala Nueva');
  });

  it('debe rechazar crear bloqueo en espacio inexistente con EspacioNoEncontradoError', async () => {
    await expect(
      service.crearBloqueo('inexistente', {
        fechaInicio: '2026-11-01',
        fechaFin: '2026-11-01',
        horaInicio: '08:00',
        horaFin: '12:00',
        motivo: 'Pintura',
      }),
    ).rejects.toThrow(EspacioNoEncontradoError);
  });

  it('debe rechazar crear bloqueo con fecha fin anterior a fecha inicio con HoraInvalidaError', async () => {
    const espacio = await service.crearEspacio({
      nombre: 'Sala Test',
      descripcion: 'Desc',
      tipo: TipoEspacio.SALA,
      costoPorHora: 100,
      duracionMinutos: 60,
      sedeId: 'sede-1',
      capacidadMaxima: 5,
      amenidades: [],
      minimoHorasReserva: 1,
      maximoHorasReserva: 4,
    });

    await expect(
      service.crearBloqueo(espacio.id, {
        fechaInicio: '2026-11-05',
        fechaFin: '2026-11-01',
        horaInicio: '08:00',
        horaFin: '12:00',
        motivo: 'Mantenimiento',
      }),
    ).rejects.toThrow(HoraInvalidaError);
  });

  it('debe rechazar crear bloqueo con hora fin <= hora inicio en el mismo día', async () => {
    const espacio = await service.crearEspacio({
      nombre: 'Sala Test 2',
      descripcion: 'Desc',
      tipo: TipoEspacio.SALA,
      costoPorHora: 100,
      duracionMinutos: 60,
      sedeId: 'sede-1',
      capacidadMaxima: 5,
      amenidades: [],
      minimoHorasReserva: 1,
      maximoHorasReserva: 4,
    });

    await expect(
      service.crearBloqueo(espacio.id, {
        fechaInicio: '2026-11-01',
        fechaFin: '2026-11-01',
        horaInicio: '14:00',
        horaFin: '10:00',
        motivo: 'Limpieza',
      }),
    ).rejects.toThrow(HoraInvalidaError);
  });
});
