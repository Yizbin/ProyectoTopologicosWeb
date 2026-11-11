import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IEspacioRepository } from '../dominio/contratos/espacio.repository.interface.js';
import { Espacio, TipoEspacio } from '../dominio/entidades/espacio.entity.js';
import { HorarioAtencion } from '../dominio/entidades/horario-atencion.entity.js';
import { Bloqueo } from '../dominio/entidades/bloqueo.entity.js';
import { Sede } from '../dominio/entidades/sede.entity.js';
import {
  RangoHorasReservaInvalidoError,
  HoraInvalidaError,
  EspacioNoEncontradoError,
  HorarioAtencionInvalidoError,
  SedeNoEncontradaError,
} from '../dominio/errores/dominio.errors.js';
import { ESPACIO_REPO_TOKEN } from '../tokens/tokens.js';
import { CrearEspacioDto } from './dto/crear-espacio.dto.js';
import { ActualizarEspacioDto } from './dto/actualizar-espacio.dto.js';
import { CrearBloqueoDto } from './dto/crear-bloqueo.dto.js';
import { HorarioAtencionDto } from './dto/horario-atencion.dto.js';
import { BloqueHorario, DisponibilidadDia, DisponibilidadService } from './disponibilidad.service.js';
import { parseFecha } from '../common/utils/fecha.util.js';

export interface FiltrosEspacios {
  fecha?: Date;
  capacidad?: number;
  tipo?: TipoEspacio;
  sedeId?: string;
  activoSolo?: boolean;
}

export type EspacioBuscado = Espacio & { horariosLibres?: BloqueHorario[] };

@Injectable()
export class EspaciosService {
  constructor(
    @Inject(ESPACIO_REPO_TOKEN) private readonly espacioRepo: IEspacioRepository,
    private readonly disponibilidad: DisponibilidadService,
  ) { }

  async crearEspacio(dto: CrearEspacioDto): Promise<Espacio> {
    if (dto.minimoHorasReserva > dto.maximoHorasReserva) {
      throw new RangoHorasReservaInvalidoError(
        `El mínimo de horas de reserva (${dto.minimoHorasReserva}h) no puede ser mayor al máximo de horas (${dto.maximoHorasReserva}h).`,
      );
    }

    const id = dto.id ?? randomUUID();
    const horarios = dto.horarios ? this.construirHorarios(id, dto.horarios) : undefined;

    const sede = await this.espacioRepo.obtenerSedePorId(dto.sedeId);
    if (!sede) {
      await this.espacioRepo.guardarSede(
        new Sede(
          dto.sedeId,
          'Sede Principal',
          'Dirección Principal',
          '555-0100',
          '08:00',
          '20:00',
        ),
      );
    }

    const amenidades = Array.isArray(dto.amenidades)
      ? dto.amenidades
      : typeof dto.amenidades === 'string'
        ? JSON.parse(dto.amenidades)
        : [];

    const nuevoEspacio = new Espacio(
      id,
      dto.nombre,
      dto.descripcion,
      dto.tipo,
      dto.costoPorHora,
      dto.activo ?? true,
      dto.duracionMinutos,
      dto.sedeId,
      dto.capacidadMaxima,
      amenidades,
      dto.minimoHorasReserva,
      dto.maximoHorasReserva,
    );

    await this.espacioRepo.guardarEspacio(nuevoEspacio);
    if (horarios) {
      await this.espacioRepo.reemplazarHorarios(id, horarios);
    }

    const creado = await this.espacioRepo.obtenerEspacioPorId(id);
    return creado ?? nuevoEspacio;
  }

  async actualizarEspacio(id: string, dto: ActualizarEspacioDto): Promise<Espacio> {
    const actual = await this.obtenerEspacioPorId(id);

    const minimo = dto.minimoHorasReserva ?? actual.minimoHorasReserva;
    const maximo = dto.maximoHorasReserva ?? actual.maximoHorasReserva;
    if (minimo > maximo) {
      throw new RangoHorasReservaInvalidoError(
        `El mínimo de horas de reserva (${minimo}h) no puede ser mayor al máximo de horas (${maximo}h).`,
      );
    }

    if (dto.sedeId && dto.sedeId !== actual.sedeId) {
      const sede = await this.espacioRepo.obtenerSedePorId(dto.sedeId);
      if (!sede) {
        throw new SedeNoEncontradaError(`La sede con ID ${dto.sedeId} no fue encontrada.`);
      }
    }

    const actualizado = new Espacio(
      actual.id,
      dto.nombre ?? actual.nombre,
      dto.descripcion ?? actual.descripcion,
      dto.tipo ?? actual.tipo,
      dto.costoPorHora ?? actual.costoPorHora,
      dto.activo ?? actual.activo,
      dto.duracionMinutos ?? actual.duracionMinutos,
      dto.sedeId ?? actual.sedeId,
      dto.capacidadMaxima ?? actual.capacidadMaxima,
      dto.amenidades ?? actual.amenidades,
      minimo,
      maximo,
    );

    await this.espacioRepo.guardarEspacio(actualizado);
    return (await this.espacioRepo.obtenerEspacioPorId(id)) ?? actualizado;
  }

  async listarEspacios(activoSolo = true): Promise<Espacio[]> {
    return this.espacioRepo.listarEspacios(activoSolo);
  }

  async buscarEspacios(filtros: FiltrosEspacios = {}): Promise<EspacioBuscado[]> {
    const todos = await this.espacioRepo.listarEspacios(filtros.activoSolo ?? true);
    const candidatos = todos
      .filter((e) => (filtros.tipo ? e.tipo === filtros.tipo : true))
      .filter((e) => (filtros.sedeId ? e.sedeId === filtros.sedeId : true))
      .filter((e) => (filtros.capacidad ? e.capacidadMaxima >= filtros.capacidad : true));

    if (!filtros.fecha) {
      return candidatos;
    }

    const resultado: EspacioBuscado[] = [];
    for (const espacio of candidatos) {
      const dia = await this.disponibilidad.calcular(espacio, filtros.fecha);
      if (dia.libres.length > 0) {
        resultado.push({ ...espacio, horariosLibres: dia.libres });
      }
    }
    return resultado;
  }

  async obtenerDisponibilidad(espacioId: string, fecha: Date): Promise<DisponibilidadDia> {
    return this.disponibilidad.obtenerDisponibilidad(espacioId, fecha);
  }

  async obtenerEspacioPorId(id: string): Promise<Espacio> {
    const espacio = await this.espacioRepo.obtenerEspacioPorId(id);
    if (!espacio) {
      throw new NotFoundException(`El espacio con ID ${id} no fue encontrado.`);
    }
    return espacio;
  }

  async obtenerHorarios(espacioId: string, diaSemana?: number): Promise<HorarioAtencion[]> {
    await this.obtenerEspacioPorId(espacioId);
    return diaSemana === undefined
      ? this.espacioRepo.obtenerHorariosPorEspacio(espacioId)
      : this.espacioRepo.obtenerHorariosPorEspacioYDia(espacioId, diaSemana);
  }

  async reemplazarHorarios(espacioId: string, horarios: HorarioAtencionDto[]): Promise<HorarioAtencion[]> {
    await this.obtenerEspacioPorId(espacioId);
    await this.espacioRepo.reemplazarHorarios(espacioId, this.construirHorarios(espacioId, horarios));
    return this.espacioRepo.obtenerHorariosPorEspacio(espacioId);
  }

  async obtenerBloqueos(espacioId: string, fecha: Date): Promise<Bloqueo[]> {
    await this.obtenerEspacioPorId(espacioId);
    return this.espacioRepo.obtenerBloqueosPorEspacioYFecha(espacioId, fecha);
  }

  async crearBloqueo(espacioId: string, dto: CrearBloqueoDto): Promise<Bloqueo> {
    const espacio = await this.espacioRepo.obtenerEspacioPorId(espacioId);
    if (!espacio) {
      throw new EspacioNoEncontradoError(`El espacio con ID ${espacioId} no fue encontrado.`);
    }

    const fInicio = parseFecha(dto.fechaInicio);
    const fFin = parseFecha(dto.fechaFin);
    if (fFin < fInicio) {
      throw new HoraInvalidaError('La fecha de fin del bloqueo no puede ser anterior a la fecha de inicio.');
    }

    if (dto.horaFin <= dto.horaInicio) {
      throw new HoraInvalidaError('La hora de fin del bloqueo debe ser estrictamente posterior a la hora de inicio.');
    }

    const id = dto.id ?? randomUUID();
    const nuevoBloqueo = new Bloqueo(
      id,
      fInicio,
      fFin,
      dto.horaInicio,
      dto.horaFin,
      dto.motivo,
      espacioId,
      dto.activo ?? true,
    );

    await this.espacioRepo.guardarBloqueo(nuevoBloqueo);
    return nuevoBloqueo;
  }


  private construirHorarios(espacioId: string, dtos: HorarioAtencionDto[]): HorarioAtencion[] {
    for (const h of dtos) {
      if (h.horaCierre <= h.horaApertura) {
        throw new HorarioAtencionInvalidoError(
          `Día ${h.diaSemana}: la hora de cierre (${h.horaCierre}) debe ser posterior a la de apertura (${h.horaApertura}).`,
        );
      }
    }
    for (let dia = 0; dia <= 6; dia++) {
      const delDia = dtos
        .filter((h) => h.diaSemana === dia)
        .sort((a, b) => a.horaApertura.localeCompare(b.horaApertura));
      for (let i = 1; i < delDia.length; i++) {
        if (delDia[i].horaApertura < delDia[i - 1].horaCierre) {
          throw new HorarioAtencionInvalidoError(`Día ${dia}: hay horarios de atención que se traslapan.`);
        }
      }
    }
    return dtos.map((h) => new HorarioAtencion(randomUUID(), h.diaSemana, h.horaApertura, h.horaCierre, espacioId));
  }
}
