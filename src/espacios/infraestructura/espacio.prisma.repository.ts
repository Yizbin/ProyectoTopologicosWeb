import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IEspacioRepository } from '../../dominio/contratos/espacio.repository.interface.js';
import { Espacio, TipoEspacio } from '../../dominio/entidades/espacio.entity.js';
import { HorarioAtencion } from '../../dominio/entidades/horario-atencion.entity.js';
import { Bloqueo } from '../../dominio/entidades/bloqueo.entity.js';
import { Sede } from '../../dominio/entidades/sede.entity.js';

@Injectable()
export class EspacioPrismaRepository implements IEspacioRepository {
  constructor(private readonly prisma: PrismaService) { }

  async obtenerEspacioPorId(id: string): Promise<Espacio | null> {
    const row = await this.prisma.espacio.findUnique({
      where: { id },
    });
    return row ? this.mapearAEspacio(row) : null;
  }

  async listarEspacios(activoSolo = true): Promise<Espacio[]> {
    const rows = await this.prisma.espacio.findMany({
      where: activoSolo ? { activo: true } : undefined,
    });
    return rows.map((r) => this.mapearAEspacio(r));
  }

  async guardarEspacio(espacio: Espacio): Promise<void> {
    await this.prisma.espacio.upsert({
      where: { id: espacio.id },
      update: {
        nombre: espacio.nombre,
        descripcion: espacio.descripcion,
        tipo: this.mapDominioAPrismaTipo(espacio.tipo),
        costoPorHora: espacio.costoPorHora,
        activo: espacio.activo,
        duracionMinutos: espacio.duracionMinutos,
        sedeId: espacio.sedeId,
        capacidadMaxima: espacio.capacidadMaxima,
        amenidades: espacio.amenidades,
        minimoHorasReserva: espacio.minimoHorasReserva,
        maximoHorasReserva: espacio.maximoHorasReserva,
      },
      create: {
        id: espacio.id,
        nombre: espacio.nombre,
        descripcion: espacio.descripcion,
        tipo: this.mapDominioAPrismaTipo(espacio.tipo),
        costoPorHora: espacio.costoPorHora,
        activo: espacio.activo,
        duracionMinutos: espacio.duracionMinutos,
        sedeId: espacio.sedeId,
        capacidadMaxima: espacio.capacidadMaxima,
        amenidades: espacio.amenidades,
        minimoHorasReserva: espacio.minimoHorasReserva,
        maximoHorasReserva: espacio.maximoHorasReserva,
      },
    });
  }

  async obtenerSedePorId(id: string): Promise<Sede | null> {
    const row = await this.prisma.sede.findUnique({
      where: { id },
    });
    return row ? this.mapearASede(row) : null;
  }

  async obtenerHorariosPorEspacioYDia(espacioId: string, diaSemana: number): Promise<HorarioAtencion[]> {
    const rows = await this.prisma.horarioAtencion.findMany({
      where: {
        espacioId,
        diaSemana,
      },
    });
    return rows.map((r) => this.mapearAHorario(r));
  }

  async obtenerBloqueosPorEspacioYFecha(espacioId: string, fecha: Date): Promise<Bloqueo[]> {
    const fechaTime = fecha.getTime();
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    const margenInicio = new Date(inicioDia.getTime() - 24 * 60 * 60 * 1000);
    const margenFin = new Date(finDia.getTime() + 24 * 60 * 60 * 1000);

    const rows = await this.prisma.bloqueo.findMany({
      where: {
        espacioId,
        activo: true,
        fechaInicio: { lte: margenFin },
        fechaFin: { gte: margenInicio },
      },
    });

    return rows
      .filter((b) => {
        const bInicioTime = new Date(b.fechaInicio).getTime();
        const bFinTime = new Date(b.fechaFin).getTime();
        const caeExacto = fechaTime >= bInicioTime && fechaTime <= bFinTime;
        const bInicioDia = new Date(b.fechaInicio);
        bInicioDia.setHours(0, 0, 0, 0);
        const bFinDia = new Date(b.fechaFin);
        bFinDia.setHours(23, 59, 59, 999);
        const caeDia = inicioDia.getTime() <= bFinDia.getTime() && finDia.getTime() >= bInicioDia.getTime();
        return b.activo && (caeExacto || caeDia);
      })
      .map((b) => this.mapearABloqueo(b));
  }

  async obtenerBloqueosPorEspacio(espacioId: string): Promise<Bloqueo[]> {
    const rows = await this.prisma.bloqueo.findMany({
      where: { espacioId },
      orderBy: { fechaInicio: 'asc' },
    });
    return rows.map((b) => this.mapearABloqueo(b));
  }

  async guardarBloqueo(bloqueo: Bloqueo): Promise<void> {
    await this.prisma.bloqueo.upsert({
      where: { id: bloqueo.id },
      update: {
        fechaInicio: bloqueo.fechaInicio,
        fechaFin: bloqueo.fechaFin,
        horaInicio: bloqueo.horaInicio,
        horaFin: bloqueo.horaFin,
        motivo: bloqueo.motivo,
        espacioId: bloqueo.espacioId,
        activo: bloqueo.activo,
      },
      create: {
        id: bloqueo.id,
        fechaInicio: bloqueo.fechaInicio,
        fechaFin: bloqueo.fechaFin,
        horaInicio: bloqueo.horaInicio,
        horaFin: bloqueo.horaFin,
        motivo: bloqueo.motivo,
        espacioId: bloqueo.espacioId,
        activo: bloqueo.activo,
      },
    });
  }

  private mapPrismaADominioTipo(tipo: string): TipoEspacio {
    switch (tipo) {
      case 'SALA':
      case 'Sala':
        return TipoEspacio.SALA;
      case 'CUBICULO':
      case 'Cubiculo':
        return TipoEspacio.CUBICULO;
      case 'PC':
        return TipoEspacio.PC;
      default:
        return TipoEspacio.SALA;
    }
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

  private mapearAEspacio(row: any): Espacio {
    const amenidades = Array.isArray(row.amenidades)
      ? (row.amenidades as string[])
      : typeof row.amenidades === 'string'
        ? JSON.parse(row.amenidades)
        : [];

    return new Espacio(
      row.id,
      row.nombre,
      row.descripcion,
      this.mapPrismaADominioTipo(row.tipo),
      row.costoPorHora,
      row.activo,
      row.duracionMinutos,
      row.sedeId,
      row.capacidadMaxima,
      amenidades,
      row.minimoHorasReserva,
      row.maximoHorasReserva
    );
  }

  private mapearAHorario(row: any): HorarioAtencion {
    return new HorarioAtencion(
      row.id,
      row.diaSemana,
      row.horaApertura,
      row.horaCierre,
      row.espacioId
    );
  }

  private mapearABloqueo(row: any): Bloqueo {
    return new Bloqueo(
      row.id,
      new Date(row.fechaInicio),
      new Date(row.fechaFin),
      row.horaInicio,
      row.horaFin,
      row.motivo,
      row.espacioId,
      row.activo
    );
  }

  private mapearASede(row: any): Sede {
    return new Sede(
      row.id,
      row.nombre,
      row.direccion,
      row.telefonoActivo,
      row.horaAperturaGeneral,
      row.horaCierreGeneral
    );
  }
}
