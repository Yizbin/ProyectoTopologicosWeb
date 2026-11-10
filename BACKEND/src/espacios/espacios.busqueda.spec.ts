import { describe, it, expect, beforeEach } from 'vitest';
import { EspaciosService } from './espacios.service.js';
import { DisponibilidadService } from './disponibilidad.service.js';
import { EspacioMemoryRepository } from './infraestructura/espacio.memory.repository.js';
import { ReservacionMemoryRepository } from '../reservaciones/infraestructura/reservacion.memory.repository.js';
import { TipoEspacio } from '../dominio/entidades/espacio.entity.js';
import { Sede } from '../dominio/entidades/sede.entity.js';
import { Reservacion, EstadoReservacion } from '../dominio/entidades/reservacion.entity.js';
import { FechaPasadaError, HorarioAtencionInvalidoError, RangoHorasReservaInvalidoError } from '../dominio/errores/dominio.errors.js';
import { parseFecha } from '../common/utils/fecha.util.js';
import { proximaFecha } from '../testing/fechas.js';

describe('Espacios - búsqueda, disponibilidad, edición y horarios', () => {
  let repo: EspacioMemoryRepository;
  let reservaciones: ReservacionMemoryRepository;
  let service: EspaciosService;

  const dtoEspacio = (over: Record<string, unknown> = {}) => ({
    nombre: 'Sala', descripcion: 'd', tipo: TipoEspacio.SALA, costoPorHora: 100, duracionMinutos: 60,
    sedeId: 'sede-1', capacidadMaxima: 10, amenidades: [], minimoHorasReserva: 1, maximoHorasReserva: 4, ...over,
  }) as any;

  beforeEach(() => {
    repo = new EspacioMemoryRepository();
    reservaciones = new ReservacionMemoryRepository();
    service = new EspaciosService(repo, new DisponibilidadService(repo, reservaciones));
    repo.sedes.push(new Sede('sede-1', 'Central', 'Calle 1', '555', '08:00', '20:00'));
  });

  describe('crear y editar con horarios', () => {
    it('crea el espacio junto con su horario semanal', async () => {
      const e = await service.crearEspacio(dtoEspacio({
        horarios: [{ diaSemana: 1, horaApertura: '09:00', horaCierre: '13:00' }, { diaSemana: 1, horaApertura: '15:00', horaCierre: '18:00' }],
      }));
      expect(await service.obtenerHorarios(e.id)).toHaveLength(2);
      expect(await service.obtenerHorarios(e.id, 1)).toHaveLength(2);
      expect(await service.obtenerHorarios(e.id, 2)).toHaveLength(0);
    });

    it('rechaza horarios con cierre <= apertura o traslapados, sin guardar nada', async () => {
      await expect(service.crearEspacio(dtoEspacio({ horarios: [{ diaSemana: 1, horaApertura: '18:00', horaCierre: '09:00' }] }))).rejects.toThrow(HorarioAtencionInvalidoError);
      await expect(service.crearEspacio(dtoEspacio({
        horarios: [{ diaSemana: 2, horaApertura: '09:00', horaCierre: '14:00' }, { diaSemana: 2, horaApertura: '13:00', horaCierre: '18:00' }],
      }))).rejects.toThrow('se traslapan');
      expect(repo.espacios).toHaveLength(0);
    });

    it('PUT de horarios reemplaza todo el horario semanal', async () => {
      const e = await service.crearEspacio(dtoEspacio({ horarios: [{ diaSemana: 1, horaApertura: '09:00', horaCierre: '18:00' }] }));
      const nuevos = await service.reemplazarHorarios(e.id, [{ diaSemana: 6, horaApertura: '10:00', horaCierre: '14:00' }]);
      expect(nuevos.map((h) => h.diaSemana)).toEqual([6]);
    });

    it('PATCH cambia solo los campos enviados y valida el rango de horas contra los valores actuales', async () => {
      const e = await service.crearEspacio(dtoEspacio());
      const editado = await service.actualizarEspacio(e.id, { nombre: 'Sala VIP', costoPorHora: 300, activo: false });
      expect(editado).toMatchObject({ nombre: 'Sala VIP', costoPorHora: 300, activo: false, capacidadMaxima: 10, maximoHorasReserva: 4 });
      await expect(service.actualizarEspacio(e.id, { minimoHorasReserva: 5 })).rejects.toThrow(RangoHorasReservaInvalidoError);
      await expect(service.actualizarEspacio('no-existe', { nombre: 'x' })).rejects.toThrow('no fue encontrado');
    });
  });

  describe('disponibilidad de un día', () => {
    it('lista bloques libres y ocupados (reservaciones activas y bloqueos), sin datos de otros usuarios', async () => {
      const e = await service.crearEspacio(dtoEspacio({ horarios: [{ diaSemana: 3, horaApertura: '09:00', horaCierre: '14:00' }] }));
      const miercoles = proximaFecha(3);
      await reservaciones.guardar(new Reservacion('r1', parseFecha(miercoles), '10:00', '12:00', EstadoReservacion.CONFIRMADA, e.id, 'otro-usuario', '', 2, 0));
      await reservaciones.guardar(new Reservacion('r2', parseFecha(miercoles), '09:00', '10:00', EstadoReservacion.PENDIENTE, e.id, 'otro-usuario', '', 2, 0));
      await service.crearBloqueo(e.id, { fechaInicio: miercoles, fechaFin: miercoles, horaInicio: '13:00', horaFin: '14:00', motivo: 'Limpieza' });

      const dia = await service.obtenerDisponibilidad(e.id, parseFecha(miercoles));
      expect(dia).toMatchObject({ fecha: miercoles, diaSemana: 3, abierto: true });
      expect(dia.libres).toEqual([{ horaInicio: '12:00', horaFin: '13:00' }]);
      expect(dia.ocupados.map((o) => `${o.tipo} ${o.horaInicio}-${o.horaFin}`)).toEqual([
        'RESERVACION 09:00-10:00', 'RESERVACION 10:00-12:00', 'BLOQUEO 13:00-14:00',
      ]);
      expect(JSON.stringify(dia)).not.toContain('otro-usuario');
    });

    it('una reservación cancelada libera su horario y un día sin horario no está abierto', async () => {
      const e = await service.crearEspacio(dtoEspacio({ horarios: [{ diaSemana: 3, horaApertura: '09:00', horaCierre: '11:00' }] }));
      const miercoles = proximaFecha(3);
      await reservaciones.guardar(new Reservacion('r1', parseFecha(miercoles), '09:00', '11:00', EstadoReservacion.CANCELADA, e.id, 'u', '', 2, 0));
      expect((await service.obtenerDisponibilidad(e.id, parseFecha(miercoles))).libres).toHaveLength(2);

      const jueves = await service.obtenerDisponibilidad(e.id, parseFecha(proximaFecha(4)));
      expect(jueves).toMatchObject({ abierto: false, libres: [] });
    });

    it('respeta el horario general de la sede y la duración del bloque', async () => {
      const e = await service.crearEspacio(dtoEspacio({ duracionMinutos: 90, horarios: [{ diaSemana: 2, horaApertura: '07:00', horaCierre: '12:00' }] }));
      const dia = await service.obtenerDisponibilidad(e.id, parseFecha(proximaFecha(2)));
      expect(dia.libres).toEqual([{ horaInicio: '08:00', horaFin: '09:30' }, { horaInicio: '09:30', horaFin: '11:00' }]);
    });

    it('rechaza fechas pasadas y espacios inexistentes', async () => {
      const e = await service.crearEspacio(dtoEspacio());
      await expect(service.obtenerDisponibilidad(e.id, parseFecha('2020-01-01'))).rejects.toThrow(FechaPasadaError);
      await expect(service.obtenerDisponibilidad('x', parseFecha(proximaFecha(1)))).rejects.toThrow('no fue encontrado');
    });
  });

  describe('búsqueda con filtros', () => {
    beforeEach(async () => {
      await service.crearEspacio(dtoEspacio({ id: 'sala', nombre: 'Sala grande', capacidadMaxima: 12, horarios: [{ diaSemana: 1, horaApertura: '09:00', horaCierre: '18:00' }] }));
      await service.crearEspacio(dtoEspacio({ id: 'cub', nombre: 'Cubículo', tipo: TipoEspacio.CUBICULO, capacidadMaxima: 2, horarios: [{ diaSemana: 1, horaApertura: '09:00', horaCierre: '10:00' }, { diaSemana: 2, horaApertura: '09:00', horaCierre: '18:00' }] }));
      await service.crearEspacio(dtoEspacio({ id: 'inactivo', nombre: 'Inactivo', activo: false, horarios: [{ diaSemana: 1, horaApertura: '09:00', horaCierre: '18:00' }] }));
    });

    it('filtra por tipo, capacidad mínima y activo', async () => {
      expect((await service.buscarEspacios({})).map((e) => e.id).sort()).toEqual(['cub', 'sala']);
      expect((await service.buscarEspacios({ tipo: TipoEspacio.CUBICULO })).map((e) => e.id)).toEqual(['cub']);
      expect((await service.buscarEspacios({ capacidad: 5 })).map((e) => e.id)).toEqual(['sala']);
      expect((await service.buscarEspacios({ activoSolo: false })).map((e) => e.id)).toHaveLength(3);
    });

    it('con fecha solo regresa espacios con bloques libres ese día e incluye esos bloques', async () => {
      const lunes = parseFecha(proximaFecha(1));
      const martes = parseFecha(proximaFecha(2));
      const domingo = parseFecha(proximaFecha(0));

      const enLunes = await service.buscarEspacios({ fecha: lunes });
      expect(enLunes.map((e) => e.id).sort()).toEqual(['cub', 'sala']);
      expect(enLunes.find((e) => e.id === 'cub')?.horariosLibres).toEqual([{ horaInicio: '09:00', horaFin: '10:00' }]);

      expect((await service.buscarEspacios({ fecha: martes })).map((e) => e.id)).toEqual(['cub']);
      expect(await service.buscarEspacios({ fecha: domingo })).toEqual([]);

      await reservaciones.guardar(new Reservacion('r', lunes, '09:00', '10:00', EstadoReservacion.PENDIENTE, 'cub', 'u', '', 1, 0));
      expect((await service.buscarEspacios({ fecha: lunes })).map((e) => e.id)).toEqual(['sala']);
      expect((await service.buscarEspacios({ fecha: lunes, tipo: TipoEspacio.CUBICULO, capacidad: 1 }))).toEqual([]);
    });
  });
});