import { describe, it, expect } from 'vitest';
import { diaSemana, formatoFecha, hoy, inicioYaPaso, parseFecha, sumarDias } from './fecha.util.js';

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

  it.each([
    '2027-02-30',
    '2027-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-00-10',
  ])('rechaza la fecha inexistente %s', (fecha) => {
    expect(() => parseFecha(fecha)).toThrow(RangeError);
  });

  it('acepta el 29 de febrero en un año bisiesto', () => {
    expect(formatoFecha(parseFecha('2028-02-29')))
      .toBe('2028-02-29');
  });

  it('rechaza inicios pasados de hoy y acepta los futuros', () => {
    const ahora = new Date(2026, 10, 10, 14, 30, 15);
    const fecha = parseFecha('2026-11-10');

    expect(inicioYaPaso(fecha, '14:00', ahora)).toBe(true);
    expect(inicioYaPaso(fecha, '14:30', ahora)).toBe(true);
    expect(inicioYaPaso(fecha, '14:31', ahora)).toBe(false);
  });

  it('rechaza el inicio exactamente igual a la hora actual', () => {
    const ahora = new Date(2026, 10, 10, 14, 30, 0);

    expect(
      inicioYaPaso(parseFecha('2026-11-10'), '14:30', ahora),
    ).toBe(true);
  });

  it('distingue ayer y mañana independientemente de la hora', () => {
    const ahora = new Date(2026, 10, 10, 14, 30);

    expect(
      inicioYaPaso(parseFecha('2026-11-09'), '23:00', ahora),
    ).toBe(true);

    expect(
      inicioYaPaso(parseFecha('2026-11-11'), '00:00', ahora),
    ).toBe(false);
  });
});