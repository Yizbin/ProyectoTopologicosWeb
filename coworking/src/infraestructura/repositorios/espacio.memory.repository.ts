import { IEspacioRepository } from '../../dominio/contratos/espacio.repository.interface';
import { Espacio } from '../../dominio/entidades/espacio.entity';
import { HorarioAtencion } from '../../dominio/entidades/horario-atencion.entity';
import { Bloqueo } from '../../dominio/entidades/bloqueo.entity';

export class EspacioMemoryRepository implements IEspacioRepository {
    public espacios: Espacio[] = [];
    public horarios: HorarioAtencion[] = [];
    public bloqueos: Bloqueo[] = [];

    async obtenerEspacioPorId(id: string): Promise<Espacio | null> {
        return this.espacios.find(e => e.id === id) || null;
    }

    async obtenerHorariosPorEspacioYDia(espacioId: string, diaSemana: number): Promise<HorarioAtencion[]> {
        return this.horarios.filter(h => h.espacioId === espacioId && h.diaSemana === diaSemana);
    }

    async obtenerBloqueosPorEspacioYFecha(espacioId: string, fecha: Date): Promise<Bloqueo[]> {
        return this.bloqueos.filter(b => 
            b.espacioId === espacioId && 
            b.fecha.toDateString() === fecha.toDateString() &&
            b.activo
        );
    }
}