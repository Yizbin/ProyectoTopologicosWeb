import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IEspacioRepository } from '../dominio/contratos/espacio.repository.interface.js';
import type { IReservacionRepository } from '../dominio/contratos/reservacion.repository.interface.js';
import { Espacio } from '../dominio/entidades/espacio.entity.js';
import { EstadoReservacion } from '../dominio/entidades/reservacion.entity.js';
import { FechaPasadaError } from '../dominio/errores/dominio.errors.js';
import { ESPACIO_REPO_TOKEN, RESERVACION_REPO_TOKEN } from '../tokens/tokens.js';
import {
  diaSemana,
  formatoFecha,
  hoy,
  horaAMinutos,
  minutosAHora,
  parseFecha,
  inicioYaPaso,
} from '../common/utils/fecha.util.js';

import type { BloqueHorario, OcupacionDia, DisponibilidadDia } from '../shared/api-contracts.js';
export type { BloqueHorario, OcupacionDia, DisponibilidadDia } from '../shared/api-contracts.js';

@Injectable()
export class DisponibilidadService {
  constructor(
    @Inject(ESPACIO_REPO_TOKEN) private readonly espacioRepo: IEspacioRepository,
    @Inject(RESERVACION_REPO_TOKEN) private readonly reservacionRepo: IReservacionRepository,
  ) { }

  async obtenerDisponibilidad(espacioId: string, fecha: Date): Promise<DisponibilidadDia> {
    const espacio = await this.espacioRepo.obtenerEspacioPorId(espacioId);
    if (!espacio) {
      throw new NotFoundException(`El espacio con ID ${espacioId} no fue encontrado.`);
    }
    return this.calcular(espacio, fecha);
  }

  async calcular(espacio: Espacio, fechaEntrada: Date): Promise<DisponibilidadDia> {
    const fecha = parseFecha(fechaEntrada);
    if (fecha.getTime() < hoy().getTime()) {
      throw new FechaPasadaError('No se puede consultar disponibilidad de una fecha que ya pasó.');
    }

    const [horarios, sede, bloqueos, reservaciones] = await Promise.all([
      this.espacioRepo.obtenerHorariosPorEspacioYDia(espacio.id, diaSemana(fecha)),
      this.espacioRepo.obtenerSedePorId(espacio.sedeId),
      this.espacioRepo.obtenerBloqueosPorEspacioYFecha(espacio.id, fecha),
      this.reservacionRepo.obtenerPorEspacioYFecha(espacio.id, fecha),
    ]);

    const ocupados: OcupacionDia[] = [
      ...reservaciones
        .filter((r) => r.estado === EstadoReservacion.PENDIENTE || r.estado === EstadoReservacion.CONFIRMADA)
        .map((r): OcupacionDia => ({ tipo: 'RESERVACION', horaInicio: r.horaInicio, horaFin: r.horaFin, estado: r.estado })),
      ...bloqueos.map((b): OcupacionDia => ({ tipo: 'BLOQUEO', horaInicio: b.horaInicio, horaFin: b.horaFin, motivo: b.motivo })),
    ].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

    const ahora = new Date();
    const duracionReservable = Math.ceil(
      espacio.minimoHorasReserva * 60 / espacio.duracionMinutos,
    ) * espacio.duracionMinutos;
    const libres: BloqueHorario[] = [];
    if (espacio.activo) {
      for (const h of horarios) {
        const apertura = Math.max(horaAMinutos(h.horaApertura), sede ? horaAMinutos(sede.horaAperturaGeneral) : 0);
        const cierre = Math.min(horaAMinutos(h.horaCierre), sede ? horaAMinutos(sede.horaCierreGeneral) : 24 * 60);
        for (let t = apertura; t + duracionReservable <= cierre && duracionReservable <= espacio.maximoHorasReserva * 60; t += espacio.duracionMinutos) {
          const bloque = { horaInicio: minutosAHora(t), horaFin: minutosAHora(t + duracionReservable) };
          const ocupado = ocupados.some((o) => bloque.horaInicio < o.horaFin && bloque.horaFin > o.horaInicio);
          if (
            !ocupado &&
            !inicioYaPaso(fecha, bloque.horaInicio, ahora)
          ) {
            libres.push(bloque);
          }
        }
      }
    }

    return {
      espacioId: espacio.id,
      fecha: formatoFecha(fecha),
      diaSemana: diaSemana(fecha),
      abierto: espacio.activo && horarios.length > 0,
      horariosAtencion: horarios.map((h) => ({ horaApertura: h.horaApertura, horaCierre: h.horaCierre })),
      ocupados,
      libres,
    };
  }
}
