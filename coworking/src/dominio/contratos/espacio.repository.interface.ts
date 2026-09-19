import { Espacio } from '../entidades/espacio.entity';
import { HorarioAtencion } from '../entidades/horario-atencion.entity';
import { Bloqueo } from '../entidades/bloqueo.entity';

export interface IEspacioRepository {
    obtenerEspacioPorId(id: string): Promise<Espacio | null>;
    obtenerHorariosPorEspacioYDia(espacioId: string, diaSemana: number): Promise<HorarioAtencion[]>;
    obtenerBloqueosPorEspacioYFecha(espacioId: string, fecha: Date): Promise<Bloqueo[]>;
}