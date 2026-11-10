import { Injectable } from '@nestjs/common';
import { IEspacioRepository } from '@/dominio/contratos/espacio.repository.interface';
import { Espacio } from '@/dominio/entidades/espacio.entity';
import { HorarioAtencion } from '@/dominio/entidades/horario-atencion.entity';
import { Bloqueo } from '@/dominio/entidades/bloqueo.entity';
import { Sede } from '@/dominio/entidades/sede.entity';
import { formatoFecha } from '../../common/utils/fecha.util.js';

@Injectable()
export class EspacioMemoryRepository implements IEspacioRepository {
    public espacios: Espacio[] = [];
    public horarios: HorarioAtencion[] = [];
    public bloqueos: Bloqueo[] = [];
    public sedes: Sede[] = []; 

    async obtenerEspacioPorId(id: string): Promise<Espacio | null> {
        return this.espacios.find(e => e.id === id) || null;
    }

    async listarEspacios(activoSolo = true): Promise<Espacio[]> {
        return activoSolo ? this.espacios.filter(e => e.activo) : this.espacios;
    }

    async guardarEspacio(espacio: Espacio): Promise<void> {
        const index = this.espacios.findIndex(e => e.id === espacio.id);
        if (index !== -1) {
            this.espacios[index] = espacio;
        } else {
            this.espacios.push(espacio);
        }
    }

    async obtenerSedePorId(id: string): Promise<Sede | null> {
        return this.sedes.find(s => s.id === id) || null;
    }

    async obtenerHorariosPorEspacio(espacioId: string): Promise<HorarioAtencion[]> {
        return this.horarios.filter(h => h.espacioId === espacioId);
    }

    async reemplazarHorarios(espacioId: string, horarios: HorarioAtencion[]): Promise<void> {
        this.horarios = this.horarios.filter(h => h.espacioId !== espacioId);
        this.horarios.push(...horarios);
    }

    async obtenerHorariosPorEspacioYDia(espacioId: string, diaSemana: number): Promise<HorarioAtencion[]> {
        return this.horarios.filter(h => h.espacioId === espacioId && h.diaSemana === diaSemana);
    }

    async obtenerBloqueosPorEspacioYFecha(espacioId: string, fecha: Date): Promise<Bloqueo[]> {
        const dia = formatoFecha(fecha);
        return this.bloqueos.filter(b =>
            b.espacioId === espacioId &&
            b.activo &&
            formatoFecha(b.fechaInicio) <= dia &&
            formatoFecha(b.fechaFin) >= dia
        );
    }

    async obtenerBloqueosPorEspacio(espacioId: string): Promise<Bloqueo[]> {
        return this.bloqueos.filter(b => b.espacioId === espacioId);
    }

    async guardarBloqueo(bloqueo: Bloqueo): Promise<void> {
        const index = this.bloqueos.findIndex(b => b.id === bloqueo.id);
        if (index !== -1) {
            this.bloqueos[index] = bloqueo;
        } else {
            this.bloqueos.push(bloqueo);
        }
    }
}