import type { TimeBlock, OccupiedBlock } from './reservaciones';

export interface SpaceSummary {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'Sala' | 'Cubiculo' | 'PC';
  costoPorHora: number;
  activo: boolean;
  duracionMinutos: number;
  sedeId: string;
  capacidadMaxima: number;
  amenidades: string[];
  minimoHorasReserva: number;
  maximoHorasReserva: number;
}

export interface DayAvailability {
  espacioId: string;
  fecha: string;
  diaSemana: number;
  abierto: boolean;
  horariosAtencion: { horaApertura: string; horaCierre: string }[];
  ocupados: OccupiedBlock[];
  libres: TimeBlock[];
}