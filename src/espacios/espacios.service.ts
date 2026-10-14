import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IEspacioRepository } from '../dominio/contratos/espacio.repository.interface.js';
import { Espacio, TipoEspacio } from '../dominio/entidades/espacio.entity.js';
import { HorarioAtencion } from '../dominio/entidades/horario-atencion.entity.js';
import { Bloqueo } from '../dominio/entidades/bloqueo.entity.js';
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

    await this.prisma.espacio.create({
      data: {
        id,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        tipo: this.mapDominioAPrismaTipo(dto.tipo),
        costoPorHora: dto.costoPorHora,
        activo: dto.activo ?? true,
        duracionMinutos: dto.duracionMinutos,
        sedeId: dto.sedeId,
        capacidadMaxima: dto.capacidadMaxima,
        amenidades: dto.amenidades,
        minimoHorasReserva: dto.minimoHorasReserva,
        maximoHorasReserva: dto.maximoHorasReserva,
      },
    });

    const creado = await this.espacioRepo.obtenerEspacioPorId(id);
    return creado!;
  }

  async listarEspacios(activoSolo = true): Promise<Espacio[]> {
    const rows = await this.prisma.espacio.findMany({
      where: activoSolo ? { activo: true } : undefined,
    });

    return rows.map(
      (row) =>
        new Espacio(
          row.id,
          row.nombre,
          row.descripcion,
          row.tipo as TipoEspacio,
          row.costoPorHora,
          row.activo,
          row.duracionMinutos,
          row.sedeId,
          row.capacidadMaxima,
          Array.isArray(row.amenidades)
            ? (row.amenidades as string[])
            : typeof row.amenidades === 'string'
              ? JSON.parse(row.amenidades)
              : [],
          row.minimoHorasReserva,
          row.maximoHorasReserva,
        ),
    );
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
    await this.obtenerEspacioPorId(espacioId);

    const id = dto.id ?? randomUUID();
    const row = await this.prisma.bloqueo.create({
      data: {
        id,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: new Date(dto.fechaFin),
        horaInicio: dto.horaInicio,
        horaFin: dto.horaFin,
        motivo: dto.motivo,
        espacioId,
        activo: dto.activo ?? true,
      },
    });

    return new Bloqueo(
      row.id,
      row.fechaInicio,
      row.fechaFin,
      row.horaInicio,
      row.horaFin,
      row.motivo,
      row.espacioId,
      row.activo,
    );
  }

  private mapDominioAPrismaTipo(tipo: TipoEspacio): 'SALA' | 'CUBICULO' | 'PC' {
    switch (tipo) {
      case TipoEspacio.CUBICULO:
        return 'CUBICULO';
      case TipoEspacio.PC:
        return 'PC';
      case TipoEspacio.SALA:
      default:
        return 'SALA';
    }
  }
}
