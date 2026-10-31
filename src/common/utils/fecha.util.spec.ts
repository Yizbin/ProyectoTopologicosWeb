import { describe, it, expect } from 'vitest';
import { diaSemana, formatoFecha, hoy, parseFecha, sumarDias } from './fecha.util.js';

describe('fecha.util - fechas de calendario independientes de la zona horaria', () => {
  //Por ejemplo 2026-11-01 es domingo ... 2026-11-07 es sabado
  it.each([
    ['2026-11-01', 0, 'domingo'],
    ['2026-11-02', 1, 'lunes'],
    ['2026-11-03', 2, 'martes'],
    ['2026-11-04', 3, 'miércoles'],
    ['2026-11-05', 4, 'jueves'],
    ['2026-11-06', 5, 'viernes'],
    ['2026-11-07', 6, 'sábado'],
  ])('%s cae en %i (%s) sin importar la zona horaria (TZ=%s)', (fecha, esperado) => {
    expect(diaSemana(parseFecha(fecha))).toBe(esperado);
    expect(formatoFecha(parseFecha(fecha))).toBe(fecha);
  });

  it('reproduce y evita el bug: new Date("2026-11-02").getDay() depende de la TZ, diaSemana() no', () => {
    const ingenuo = new Date('2026-11-02');
    expect(ingenuo.getUTCDay()).toBe(1); 
    expect(diaSemana(ingenuo)).toBe(1);
  });

  it('acepta fecha ISO completa y Date, y los normaliza al mismo día de calendario', () => {
    expect(formatoFecha(parseFecha('2026-11-02T00:00:00.000Z'))).toBe('2026-11-02');
    expect(formatoFecha(parseFecha(new Date('2026-11-02T15:30:00Z')))).toBe('2026-11-02');
  });

  it('rechaza fechas inválidas', () => {
    expect(() => parseFecha('no-es-fecha')).toThrow(RangeError);
  });

  it('sumarDias cruza meses y años sin desfases', () => {
    expect(formatoFecha(sumarDias(parseFecha('2026-12-31'), 1))).toBe('2027-01-01');
    expect(formatoFecha(sumarDias(parseFecha('2026-11-02'), 7))).toBe('2026-11-09');
  });

  it('hoy() es medianoche UTC del día de calendario local', () => {
    const ahora = new Date(2026, 9, 31, 23, 59); 
    expect(formatoFecha(hoy(ahora))).toBe('2026-10-31');
    expect(hoy(ahora).getUTCHours()).toBe(0);
  });
});