import { formatoFecha, horaAMinutos, parseFecha, sumarDias } from '../common/utils/fecha.util.js';

type Intervalo = [number, number];
interface EspacioOcupacion {
  id: string;
  activo: boolean;
  horarios?: { diaSemana: number; horaApertura: string; horaCierre: string }[];
  bloqueos?: { fechaInicio: Date; fechaFin: Date; horaInicio: string; horaFin: string; activo: boolean }[];
  sede?: { horaAperturaGeneral: string; horaCierreGeneral: string };
}
interface ReservaOcupacion {
  espacioId: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  estado: string;
}

function unir(intervalos: Intervalo[]): Intervalo[] {
  const resultado: Intervalo[] = [];
  for (const [inicio, fin] of intervalos.filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0])) {
    const ultimo = resultado[resultado.length - 1];
    if (ultimo && inicio <= ultimo[1]) ultimo[1] = Math.max(fin, ultimo[1]);
    else resultado.push([inicio, fin]);
  }
  return resultado;
}

/** Ocupación por tiempo: horarios actuales, descontando bloqueos y uniendo empalmes. */
export function calcularOcupacion(
  espacios: EspacioOcupacion[], reservas: ReservaOcupacion[], desde: Date, hasta: Date,
) {
  let minutosDisponibles = 0;
  let minutosOcupados = 0;
  const porDia = new Map<string, Intervalo[]>();
  for (const r of reservas) {
    if (['CANCELADA', 'cancelada'].includes(r.estado)) continue;
    const clave = `${r.espacioId}:${formatoFecha(r.fecha)}`;
    const lista = porDia.get(clave) ?? [];
    lista.push([horaAMinutos(r.horaInicio), horaAMinutos(r.horaFin)]);
    porDia.set(clave, lista);
  }
  for (let dia = parseFecha(desde); dia <= hasta; dia = sumarDias(dia, 1)) {
    for (const e of espacios.filter(e => e.activo)) {
      let abiertos = unir((e.horarios ?? []).filter(h => h.diaSemana === dia.getUTCDay()).map(h => [
        Math.max(horaAMinutos(h.horaApertura), e.sede ? horaAMinutos(e.sede.horaAperturaGeneral) : 0),
        Math.min(horaAMinutos(h.horaCierre), e.sede ? horaAMinutos(e.sede.horaCierreGeneral) : 1440),
      ]));
      const bloqueos = (e.bloqueos ?? []).filter(b => b.activo && parseFecha(b.fechaInicio) <= dia && parseFecha(b.fechaFin) >= dia);
      for (const b of bloqueos) {
        const inicio = horaAMinutos(b.horaInicio), fin = horaAMinutos(b.horaFin);
        abiertos = abiertos.flatMap(([a, z]): Intervalo[] => {
          if (fin <= a || inicio >= z) return [[a, z]];
          return [[a, Math.min(z, inicio)], [Math.max(a, fin), z]].filter(([x, y]) => y > x) as Intervalo[];
        });
      }
      const ocupados = unir(porDia.get(`${e.id}:${formatoFecha(dia)}`) ?? []);
      for (const [a, z] of abiertos) {
        minutosDisponibles += z - a;
        for (const [inicio, fin] of ocupados) minutosOcupados += Math.max(0, Math.min(z, fin) - Math.max(a, inicio));
      }
    }
  }
  return {
    minutosDisponibles, minutosOcupados,
    porcentaje: minutosDisponibles ? Number((minutosOcupados * 100 / minutosDisponibles).toFixed(2)) : 0,
  };
}
