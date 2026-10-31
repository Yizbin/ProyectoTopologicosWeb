import { describe, it, expect, beforeEach } from 'vitest';
import { ReservacionesService } from './reservaciones.service.js';
import { EspaciosService } from '../espacios/espacios.service.js';
import { DisponibilidadService } from '../espacios/disponibilidad.service.js';
import { EspacioMemoryRepository } from '../espacios/infraestructura/espacio.memory.repository.js';
import { ReservacionMemoryRepository } from './infraestructura/reservacion.memory.repository.js';
import { Espacio, TipoEspacio } from '../dominio/entidades/espacio.entity.js';
import { HorarioAtencion } from '../dominio/entidades/horario-atencion.entity.js';
import { Sede } from '../dominio/entidades/sede.entity.js';
import { Reservacion, EstadoReservacion } from '../dominio/entidades/reservacion.entity.js';
import { BloqueoAdministrativoError, FueraDeHorarioError, EmpalmeReservacionError } from '../dominio/errores/dominio.errors.js';
import { diaSemana, parseFecha } from '../common/utils/fecha.util.js';
import { NOMBRES_DIA, proximaFecha } from '../testing/fechas.js';
import { randomUUID } from 'node:crypto';

describe('Reservaciones - día de la semana correcto (bug UTC vs hora local)', () => {
  let espacioRepo: EspacioMemoryRepository;
  let reservacionRepo: ReservacionMemoryRepository;
  let service: ReservacionesService;

  const nuevaReservacion = (fecha: string, ini = '10:00', fin = '12:00') =>
    new Reservacion(randomUUID(), parseFecha(fecha), ini, fin, EstadoReservacion.PENDIENTE, 'espacio-1', 'u-1', '', 2, 0);

  const prepararEspacio = (diasAbiertos: number[]) => {
    espacioRepo.espacios.push(new Espacio('espacio-1', 'Sala', 'desc', TipoEspacio.SALA, 100, true, 60, 'sede-1', 10, [], 1, 4));
    espacioRepo.sedes.push(new Sede('sede-1', 'Central', 'Calle 1', '555', '08:00', '20:00'));
    diasAbiertos.forEach((d) => espacioRepo.horarios.push(new HorarioAtencion(`h-${d}`, d, '09:00', '18:00', 'espacio-1')));
  };

  beforeEach(() => {
    espacioRepo = new EspacioMemoryRepository();
    reservacionRepo = new ReservacionMemoryRepository();
    service = new ReservacionesService(reservacionRepo, espacioRepo);
  });

  describe.each([0, 1, 2, 3, 4, 5, 6])('espacio abierto SOLO el %i', (dia) => {
    it(`acepta una fecha en ${NOMBRES_DIA[dia]} y rechaza todas las demás`, async () => {
      prepararEspacio([dia]);

      for (let d = 0; d <= 6; d++) {
        const fecha = proximaFecha(d);
        expect(diaSemana(parseFecha(fecha))).toBe(d); 
        const intento = service.crearReservacion(nuevaReservacion(fecha));
        if (d === dia) {
          await expect(intento).resolves.toBeUndefined();
        } else {
          await expect(intento).rejects.toThrow(FueraDeHorarioError);
        }
      }
    });
  });

  it('caso reportado: espacio abierto lunes → el lunes se acepta y el sábado/domingo se rechazan', async () => {
    prepararEspacio([1]);
    await expect(service.crearReservacion(nuevaReservacion(proximaFecha(1)))).resolves.toBeUndefined();
    await expect(service.crearReservacion(nuevaReservacion(proximaFecha(6)))).rejects.toThrow(FueraDeHorarioError);
    await expect(service.crearReservacion(nuevaReservacion(proximaFecha(0)))).rejects.toThrow(FueraDeHorarioError);
  });

  it('guarda la fecha como medianoche UTC del día pedido y empalma solo el mismo día', async () => {
    prepararEspacio([1, 2]);
    const lunes = proximaFecha(1);
    const martes = proximaFecha(2);
    await service.crearReservacion(nuevaReservacion(lunes));
    expect((await reservacionRepo.obtenerTodas())[0].fecha.toISOString()).toBe(`${lunes}T00:00:00.000Z`);

    await expect(service.crearReservacion(nuevaReservacion(lunes, '11:00', '13:00'))).rejects.toThrow(EmpalmeReservacionError);
    await expect(service.crearReservacion(nuevaReservacion(martes, '11:00', '13:00'))).resolves.toBeUndefined();
  });

  it('un bloqueo de un solo día afecta únicamente a ese día (lunes), no al domingo ni al martes', async () => {
    prepararEspacio([0, 1, 2]);
    const espacios = new EspaciosService(espacioRepo, {} as any, new DisponibilidadService(espacioRepo, reservacionRepo));
    const lunes = proximaFecha(1);
    await espacios.crearBloqueo('espacio-1', { fechaInicio: lunes, fechaFin: lunes, horaInicio: '09:00', horaFin: '18:00', motivo: 'Mantenimiento' });

    await expect(service.crearReservacion(nuevaReservacion(lunes))).rejects.toThrow(BloqueoAdministrativoError);
    await expect(service.crearReservacion(nuevaReservacion(proximaFecha(0)))).resolves.toBeUndefined();
    await expect(service.crearReservacion(nuevaReservacion(proximaFecha(2)))).resolves.toBeUndefined();
  });
});

describe('Reservaciones de varios días', () => {
  let espacioRepo: EspacioMemoryRepository;
  let reservacionRepo: ReservacionMemoryRepository;
  let service: ReservacionesService;

  beforeEach(() => {
    espacioRepo = new EspacioMemoryRepository();
    reservacionRepo = new ReservacionMemoryRepository();
    service = new ReservacionesService(reservacionRepo, espacioRepo);
    espacioRepo.espacios.push(new Espacio('espacio-1', 'Sala', 'desc', TipoEspacio.SALA, 100, true, 60, 'sede-1', 10, [], 1, 4));
    espacioRepo.sedes.push(new Sede('sede-1', 'Central', 'Calle 1', '555', '08:00', '20:00'));
    for (let d = 1; d <= 5; d++) espacioRepo.horarios.push(new HorarioAtencion(`h-${d}`, d, '09:00', '18:00', 'espacio-1'));
  });

  const solicitud = (fechas: string[]) => ({
    fechas, horaInicio: '10:00', horaFin: '12:00', espacioId: 'espacio-1', usuarioId: 'u-1', cantidadPersonas: 3, generarId: randomUUID,
  });

  it('crea una reservación por fecha (ordenadas, sin repetir) con su subtotal', async () => {
    const lun = proximaFecha(1), mie = proximaFecha(3), vie = proximaFecha(5);
    const creadas = await service.crearReservacionesMultiples(solicitud([vie, lun, mie, lun]));

    expect(creadas.map((r) => r.fecha.toISOString().slice(0, 10))).toEqual([lun, mie, vie].sort());
    expect(creadas.every((r) => r.subtotal === 200 && r.estado === EstadoReservacion.PENDIENTE)).toBe(true);
    expect(await reservacionRepo.obtenerTodas()).toHaveLength(3);
  });

  it('es todo o nada: si una fecha cae en sábado no se guarda ninguna y el error dice cuál', async () => {
    const lun = proximaFecha(1), sab = proximaFecha(6);
    await expect(service.crearReservacionesMultiples(solicitud([lun, sab]))).rejects.toThrow(`Fecha ${sab}`);
    await expect(service.crearReservacionesMultiples(solicitud([lun, sab]))).rejects.toThrow(FueraDeHorarioError);
    expect(await reservacionRepo.obtenerTodas()).toHaveLength(0);
  });

  it('es todo o nada también ante un empalme con una reservación existente', async () => {
    const lun = proximaFecha(1), mar = proximaFecha(2);
    await service.crearReservacion(new Reservacion('r-0', parseFecha(mar), '11:00', '13:00', EstadoReservacion.PENDIENTE, 'espacio-1', 'u-2', '', 1, 0));
    await expect(service.crearReservacionesMultiples(solicitud([lun, mar]))).rejects.toThrow(EmpalmeReservacionError);
    expect(await reservacionRepo.obtenerTodas()).toHaveLength(1);
  });
});

describe('Listado administrativo de reservaciones', () => {
  it('filtra por día, rango, espacio y estado, ordenado por fecha y hora', async () => {
    const espacioRepo = new EspacioMemoryRepository();
    const reservacionRepo = new ReservacionMemoryRepository();
    const service = new ReservacionesService(reservacionRepo, espacioRepo);
    const lun = proximaFecha(1), mar = proximaFecha(2);
    const r = (id: string, f: string, ini: string, fin: string, esp: string, estado = EstadoReservacion.PENDIENTE) =>
      new Reservacion(id, parseFecha(f), ini, fin, estado, esp, 'u', '', 1, 0);
    await reservacionRepo.guardarVarias([
      r('a', mar, '09:00', '10:00', 'e1'), r('b', lun, '14:00', '15:00', 'e1'), r('c', lun, '09:00', '10:00', 'e2'),
      r('d', lun, '11:00', '12:00', 'e1', EstadoReservacion.CONFIRMADA),
    ]);

    expect((await service.listarReservaciones({ fecha: parseFecha(lun) })).map((x) => x.id)).toEqual(['c', 'd', 'b']);
    expect((await service.listarReservaciones({ fecha: parseFecha(lun), espacioId: 'e1' })).map((x) => x.id)).toEqual(['d', 'b']);
    expect((await service.listarReservaciones({ desde: parseFecha(lun), hasta: parseFecha(mar), estado: EstadoReservacion.CONFIRMADA })).map((x) => x.id)).toEqual(['d']);
    expect(await service.listarReservaciones()).toHaveLength(4);
    await expect(service.listarReservaciones({ desde: parseFecha(lun) })).rejects.toThrow('fechaInicio y fechaFin');
  });
});