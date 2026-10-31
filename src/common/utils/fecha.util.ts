const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})/;

export function parseFecha(valor: string | Date): Date {
  if (typeof valor === 'string') {
    const m = SOLO_FECHA.exec(valor);
    if (m) {
      return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    }
    valor = new Date(valor);
  }
  if (Number.isNaN(valor.getTime())) {
    throw new RangeError('Fecha inválida.');
  }
  return new Date(Date.UTC(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate()));
}

export function diaSemana(fecha: Date): number {
  return parseFecha(fecha).getUTCDay();
}

export function formatoFecha(fecha: Date): string {
  return parseFecha(fecha).toISOString().slice(0, 10);
}

export function mismaFecha(a: Date, b: Date): boolean {
  return formatoFecha(a) === formatoFecha(b);
}

export function hoy(ahora: Date = new Date()): Date {
  return new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
}

export function sumarDias(fecha: Date, dias: number): Date {
  const base = parseFecha(fecha);
  return new Date(base.getTime() + dias * 24 * 60 * 60 * 1000);
}

export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function minutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60).toString().padStart(2, '0');
  const m = (minutos % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}