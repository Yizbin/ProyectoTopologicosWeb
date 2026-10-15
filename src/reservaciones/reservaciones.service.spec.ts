import { describe, it, expect, beforeEach } from 'vitest';
import { ReservacionesService } from './reservaciones.service.js';
import { EspacioMemoryRepository } from '../espacios/infraestructura/espacio.memory.repository.js';
import { ReservacionMemoryRepository } from './infraestructura/reservacion.memory.repository.js';
import { Espacio, TipoEspacio } from '../dominio/entidades/espacio.entity.js';
import { HorarioAtencion } from '../dominio/entidades/horario-atencion.entity.js';
import { Bloqueo } from '../dominio/entidades/bloqueo.entity.js';
import { Sede } from '../dominio/entidades/sede.entity.js';
import { Reservacion, EstadoReservacion } from '../dominio/entidades/reservacion.entity.js';
import {
  FechaPasadaError,
  HoraInvalidaError,
  EspacioNoEncontradoError,
  EspacioInactivoError,
  DuracionBloqueInvalidaError,
  MinimoHorasReservaError,
  MaximoHorasReservaError,
  CapacidadExcedidaError,
  FueraDeHorarioError,
  BloqueoAdministrativoError,
  EmpalmeReservacionError,
  EstadoReservacionInvalidoError,
  ReservacionNoEncontradaError,
} from '../dominio/errores/dominio.errors.js';

describe('ReservacionesService - Reglas de Negocio', () => {
  let espacioRepo: EspacioMemoryRepository;
  let reservacionRepo: ReservacionMemoryRepository;
  let service: ReservacionesService;

  const espacioBase = new Espacio(
    'espacio-1',
    'Sala Magna',
    'Sala ejecutiva',
    TipoEspacio.SALA,
    200,
    true,
    60,
    'sede-1',
    10,
    ['WiFi'],
    1,
    4,
  );

  const sedeBase = new Sede(
    'sede-1',
    'Sede Central',
    'Calle 1',
    '555-0100',
    '08:00',
    '20:00',
  );

  const getFechaFutura = (diasAdelante = 7, diaSemanaDeseado = 1) => {
    const f = new Date();
    f.setDate(f.getDate() + diasAdelante);
    while (f.getDay() !== diaSemanaDeseado) {
      f.setDate(f.getDate() + 1);
    }
    f.setHours(12, 0, 0, 0);
    return f;
  };

  beforeEach(() => {
    espacioRepo = new EspacioMemoryRepository();
    reservacionRepo = new ReservacionMemoryRepository();
    service = new ReservacionesService(reservacionRepo, espacioRepo);

    espacioRepo.espacios.push(espacioBase);
    espacioRepo.sedes.push(sedeBase);
    espacioRepo.horarios.push(new HorarioAtencion('h-1', 1, '09:00', '18:00', 'espacio-1'));
  });

  it('1. Debe rechazar reservación con fecha pasada lanzando FechaPasadaError', async () => {
    const fechaAyer = new Date();
    fechaAyer.setDate(fechaAyer.getDate() - 2);

    const res = new Reservacion('r-1', fechaAyer, '10:00', '12:00', EstadoReservacion.PENDIENTE, 'espacio-1', 'u-1', '', 5, 0);
    await expect(service.crearReservacion(res)).rejects.toThrow(FechaPasadaError);
  });

  it('2. Debe rechazar lógica horaria inválida (fin <= inicio) lanzando HoraInvalidaError', async () => {
    const fecha = getFechaFutura(5, 1);
    const res = new Reservacion('r-1', fecha, '14:00', '10:00', EstadoReservacion.PENDIENTE, 'espacio-1', 'u-1', '', 5, 0);
    await expect(service.crearReservacion(res)).rejects.toThrow(HoraInvalidaError);
  });

  it('3. Debe rechazar si el espacio no existe lanzando EspacioNoEncontradoError', async () => {
    const fecha = getFechaFutura(5, 1);
    const res = new Reservacion('r-1', fecha, '10:00', '12:00', EstadoReservacion.PENDIENTE, 'inexistente', 'u-1', '', 5, 0);
    await expect(service.crearReservacion(res)).rejects.toThrow(EspacioNoEncontradoError);
  });

  it('4. Debe rechazar si el espacio está inactivo lanzando EspacioInactivoError', async () => {
    const espacioInactivo = new Espacio('inactivo-1', 'Sala Off', 'Desc', TipoEspacio.SALA, 100, false, 60, 'sede-1', 5, [], 1, 4);
    espacioRepo.espacios.push(espacioInactivo);

    const fecha = getFechaFutura(5, 1);
    const res = new Reservacion('r-1', fecha, '10:00', '12:00', EstadoReservacion.PENDIENTE, 'inactivo-1', 'u-1', '', 2, 0);
    await expect(service.crearReservacion(res)).rejects.toThrow(EspacioInactivoError);
  });

  it('5. Debe rechazar si no respeta los bloques exactos de minutos lanzando DuracionBloqueInvalidaError', async () => {
    const fecha = getFechaFutura(5, 1);
    const res = new Reservacion('r-1', fecha, '10:00', '11:25', EstadoReservacion.PENDIENTE, 'espacio-1', 'u-1', '', 5, 0);
    await expect(service.crearReservacion(res)).rejects.toThrow(DuracionBloqueInvalidaError);
  });

  it('6. Debe rechazar si no cumple el mínimo de horas de reserva lanzando MinimoHorasReservaError', async () => {
    const espacioMin2 = new Espacio('esp-min2', 'Sala', 'Desc', TipoEspacio.SALA, 100, true, 60, 'sede-1', 10, [], 2, 6);
    espacioRepo.espacios.push(espacioMin2);
    espacioRepo.horarios.push(new HorarioAtencion('h-min', 1, '09:00', '18:00', 'esp-min2'));

    const fecha = getFechaFutura(5, 1);
    const res = new Reservacion('r-1', fecha, '10:00', '11:00', EstadoReservacion.PENDIENTE, 'esp-min2', 'u-1', '', 4, 0);
    await expect(service.crearReservacion(res)).rejects.toThrow(MinimoHorasReservaError);
  });

  it('7. Debe rechazar si excede el máximo de horas de reserva lanzando MaximoHorasReservaError', async () => {
    const fecha = getFechaFutura(5, 1);
    const res = new Reservacion('r-1', fecha, '10:00', '15:00', EstadoReservacion.PENDIENTE, 'espacio-1', 'u-1', '', 4, 0);
    await expect(service.crearReservacion(res)).rejects.toThrow(MaximoHorasReservaError);
  });

  it('8. Debe rechazar si excede la capacidad máxima lanzando CapacidadExcedidaError', async () => {
    const fecha = getFechaFutura(5, 1);
    const res = new Reservacion('r-1', fecha, '10:00', '12:00', EstadoReservacion.PENDIENTE, 'espacio-1', 'u-1', '', 15, 0);
    await expect(service.crearReservacion(res)).rejects.toThrow(CapacidadExcedidaError);
  });

  it('9. Debe rechazar si está fuera del horario de atención lanzando FueraDeHorarioError', async () => {
    const fecha = getFechaFutura(5, 1);
    const res = new Reservacion('r-1', fecha, '07:00', '08:00', EstadoReservacion.PENDIENTE, 'espacio-1', 'u-1', '', 2, 0);
    await expect(service.crearReservacion(res)).rejects.toThrow(FueraDeHorarioError);
  });

  it('10. Debe rechazar si colisiona con un bloqueo administrativo lanzando BloqueoAdministrativoError', async () => {
    const fecha = getFechaFutura(5, 1);
    const fInicio = new Date(fecha);
    const fFin = new Date(fecha);
    espacioRepo.bloqueos.push(new Bloqueo('b-1', fInicio, fFin, '09:00', '13:00', 'Mantenimiento', 'espacio-1', true));

    const res = new Reservacion('r-1', fecha, '10:00', '12:00', EstadoReservacion.PENDIENTE, 'espacio-1', 'u-1', '', 4, 0);
    await expect(service.crearReservacion(res)).rejects.toThrow(BloqueoAdministrativoError);
  });

  it('11. Debe rechazar si colisiona con una reservación existente activa lanzando EmpalmeReservacionError', async () => {
    const fecha = getFechaFutura(5, 1);
    const resExistente = new Reservacion('r-exist', fecha, '10:00', '12:00', EstadoReservacion.CONFIRMADA, 'espacio-1', 'u-otro', '', 4, 400);
    await reservacionRepo.guardar(resExistente);

    const resNueva = new Reservacion('r-nueva', fecha, '11:00', '13:00', EstadoReservacion.PENDIENTE, 'espacio-1', 'u-1', '', 4, 0);
    await expect(service.crearReservacion(resNueva)).rejects.toThrow(EmpalmeReservacionError);
  });

  it('12. Debe calcular el subtotal correctamente y guardar la reservación', async () => {
    const fecha = getFechaFutura(5, 1);
    const res = new Reservacion('r-ok', fecha, '14:00', '16:00', EstadoReservacion.PENDIENTE, 'espacio-1', 'u-1', '', 4, 0);
    await service.crearReservacion(res);

    const guardada = await reservacionRepo.obtenerPorId('r-ok');
    expect(guardada).toBeDefined();
    expect(guardada?.subtotal).toBe(400);
    expect(guardada?.estado).toBe(EstadoReservacion.PENDIENTE);
  });

  describe('Transiciones de estado', () => {
    it('debe confirmar reservación pendiente y rechazar si no es pendiente', async () => {
      const fecha = getFechaFutura(5, 1);
      const res = new Reservacion('r-trans', fecha, '10:00', '12:00', EstadoReservacion.PENDIENTE, 'espacio-1', 'u-1', '', 2, 400);
      await reservacionRepo.guardar(res);

      await service.confirmarReservacion('r-trans');
      const actualizada = await reservacionRepo.obtenerPorId('r-trans');
      expect(actualizada?.estado).toBe(EstadoReservacion.CONFIRMADA);

      await expect(service.confirmarReservacion('r-trans')).rejects.toThrow(EstadoReservacionInvalidoError);
    });

    it('debe rechazar completar si no está confirmada', async () => {
      const fecha = getFechaFutura(5, 1);
      const res = new Reservacion('r-pend', fecha, '10:00', '12:00', EstadoReservacion.PENDIENTE, 'espacio-1', 'u-1', '', 2, 400);
      await reservacionRepo.guardar(res);

      await expect(service.completarReservacion('r-pend')).rejects.toThrow(EstadoReservacionInvalidoError);
    });

    it('debe rechazar cancelar si ya está cancelada o completada', async () => {
      const fecha = getFechaFutura(5, 1);
      const res = new Reservacion('r-canc', fecha, '10:00', '12:00', EstadoReservacion.CANCELADA, 'espacio-1', 'u-1', '', 2, 400);
      await reservacionRepo.guardar(res);

      await expect(service.cancelarReservacion('r-canc')).rejects.toThrow(EstadoReservacionInvalidoError);
    });

    it('debe lanzar ReservacionNoEncontradaError si el ID no existe', async () => {
      await expect(service.confirmarReservacion('inexistente')).rejects.toThrow(ReservacionNoEncontradaError);
    });
  });
});
