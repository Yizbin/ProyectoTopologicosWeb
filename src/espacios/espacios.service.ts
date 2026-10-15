import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IEspacioRepository } from '../dominio/contratos/espacio.repository.interface.js';
import { Espacio } from '../dominio/entidades/espacio.entity.js';
import { HorarioAtencion } from '../dominio/entidades/horario-atencion.entity.js';
import { Bloqueo } from '../dominio/entidades/bloqueo.entity.js';
import {
  RangoHorasReservaInvalidoError,
  HoraInvalidaError,
  EspacioNoEncontradoError,
} from '../dominio/errores/dominio.errors.js';
import { ESPACIO_REPO_TOKEN } from '../tokens/tokens.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearEspacioDto } from './dto/crear-espacio.dto.js';
import { CrearBloqueoDto } from './dto/crear-bloqueo.dto.js';

@Injectable()
export class EspaciosService {
  constructor(
    @Inject(ESPACIO_REPO_TOKEN) private readonly espacioRepo: IEspacioRepository,
    private readonly prisma: PrismaService,
  ) { }

  async crearEspacio(dto: CrearEspacioDto): Promise<Espacio> {
    if (dto.minimoHorasReserva > dto.maximoHorasReserva) {
      throw new RangoHorasReservaInvalidoError(
        `El mínimo de horas de reserva (${dto.minimoHorasReserva}h) no puede ser mayor al máximo de horas (${dto.maximoHorasReserva}h).`,
      );
    }

    const id = dto.id ?? randomUUID();

    const sede = await this.espacioRepo.obtenerSedePorId(dto.sedeId);
    if (!sede) {
      await this.prisma.sede.create({
        data: {
          id: dto.sedeId,
          nombre: 'Sede Principal',
          direccion: 'Dirección Principal',
          telefonoActivo: '555-0100',
          horaAperturaGeneral: '08:00',
          horaCierreGeneral: '20:00',
        },
      });
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

    const creado = await this.espacioRepo.obtenerEspacioPorId(id);
    return creado ?? nuevoEspacio;
  }

  async listarEspacios(activoSolo = true): Promise<Espacio[]> {
    return this.espacioRepo.listarEspacios(activoSolo);
  }

  async obtenerEspacioPorId(id: string): Promise<Espacio> {
    const espacio = await this.espacioRepo.obtenerEspacioPorId(id);
    if (!espacio) {
      throw new NotFoundException(`El espacio con ID ${id} no fue encontrado.`);
    }
    return espacio;
  }

  async obtenerHorarios(espacioId: string, diaSemana: number): Promise<HorarioAtencion[]> {
    await this.obtenerEspacioPorId(espacioId);
    return this.espacioRepo.obtenerHorariosPorEspacioYDia(espacioId, diaSemana);
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

    const fInicio = new Date(dto.fechaInicio);
    const fFin = new Date(dto.fechaFin);
    if (fFin < fInicio) {
      throw new HoraInvalidaError('La fecha de fin del bloqueo no puede ser anterior a la fecha de inicio.');
    }

    if (dto.fechaInicio === dto.fechaFin && dto.horaFin <= dto.horaInicio) {
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
}
