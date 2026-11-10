const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})/;

export function parseFecha(valor: string | Date): Date {
  if (typeof valor === 'string') {
    const m = SOLO_FECHA.exec(valor);
    if (m) {
      const year = Number(m[1]);
      const month = Number(m[2]);
      const day = Number(m[3]);

      const fecha = new Date(0);
      fecha.setUTCFullYear(year, month - 1, day);
      fecha.setUTCHours(0, 0, 0, 0);

      if (
        fecha.getUTCFullYear() !== year ||
        fecha.getUTCMonth() + 1 !== month ||
        fecha.getUTCDate() !== day
      ) {
        throw new RangeError('Fecha inválida.');
      }

      return fecha;
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

export function inicioYaPaso(
  fecha: Date,
  horaInicio: string,
  ahora: Date = new Date(),
): boolean {
  const diaReserva = parseFecha(fecha).getTime();
  const diaActual = hoy(ahora).getTime();

  if (diaReserva < diaActual) return true;
  if (diaReserva > diaActual) return false;

  const inicioMilisegundos =
    horaAMinutos(horaInicio) * 60_000;

  const actualMilisegundos =
    ahora.getHours() * 3_600_000 +
    ahora.getMinutes() * 60_000 +
    ahora.getSeconds() * 1_000 +
    ahora.getMilliseconds();

  return inicioMilisegundos <= actualMilisegundos;
}