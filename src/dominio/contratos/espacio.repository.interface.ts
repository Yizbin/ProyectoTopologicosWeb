import { Espacio } from '../entidades/espacio.entity.js';
import { HorarioAtencion } from '../entidades/horario-atencion.entity.js';
import { Bloqueo } from '../entidades/bloqueo.entity.js';
import { Sede } from '../entidades/sede.entity.js';

export interface IEspacioRepository {
    obtenerEspacioPorId(id: string): Promise<Espacio | null>;
    obtenerHorariosPorEspacioYDia(espacioId: string, diaSemana: number): Promise<HorarioAtencion[]>;
    obtenerBloqueosPorEspacioYFecha(espacioId: string, fecha: Date): Promise<Bloqueo[]>;
    obtenerSedePorId(id: string): Promise<Sede | null>;
}