import { formatoFecha, hoy, sumarDias } from '../common/utils/fecha.util.js';

export function proximaFecha(dia: number, saltarSemanas = 0): string {
  let f = sumarDias(hoy(), 1);
  while (f.getUTCDay() !== dia) f = sumarDias(f, 1);
  return formatoFecha(sumarDias(f, 7 * saltarSemanas));
}

export const NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];