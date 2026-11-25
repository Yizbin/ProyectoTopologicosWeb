import { describe, it, expect } from 'vitest';
import { calcularOcupacion } from './ocupacion.util.js';
import { parseFecha } from '../common/utils/fecha.util.js';

describe('Ocupación del período', () => {
  const fecha = parseFecha('2030-01-07'); // lunes
  const espacio = {
    id: 'e1', activo: true,
    horarios: [{ diaSemana: 1, horaApertura: '08:00', horaCierre: '18:00' }],
    sede: { horaAperturaGeneral: '09:00', horaCierreGeneral: '17:00' },
    bloqueos: [{ fechaInicio: fecha, fechaFin: fecha, horaInicio: '12:00', horaFin: '13:00', activo: true }],
  };
  const reserva = (inicio: string, fin: string, estado = 'CONFIRMADA') => ({
    espacioId: 'e1', fecha, horaInicio: inicio, horaFin: fin, estado,
  });

  it('descuenta bloqueos, respeta la sede y no duplica reservas empalmadas', () => {
    expect(calcularOcupacion([espacio], [
      reserva('08:00', '11:00'), reserva('10:00', '14:00'), reserva('15:00', '17:00', 'CANCELADA'),
    ], fecha, fecha)).toEqual({ minutosDisponibles: 420, minutosOcupados: 240, porcentaje: 57.14 });
  });

  it('devuelve cero sin horarios o con espacios inactivos', () => {
    expect(calcularOcupacion([{ ...espacio, activo: false }], [], fecha, fecha).porcentaje).toBe(0);
    expect(calcularOcupacion([{ ...espacio, horarios: [] }], [], fecha, fecha).minutosDisponibles).toBe(0);
  });
});
