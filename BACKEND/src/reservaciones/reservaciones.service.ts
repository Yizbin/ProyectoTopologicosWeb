import { Injectable, Inject } from '@nestjs/common';
import type { IReservacionRepository } from '../dominio/contratos/reservacion.repository.interface.js';
import type { IEspacioRepository } from '../dominio/contratos/espacio.repository.interface.js';
import { EstadoReservacion, Reservacion } from '../dominio/entidades/reservacion.entity.js';
import {
  FueraDeHorarioError,
  BloqueoAdministrativoError,
  EmpalmeReservacionError,
  FechaPasadaError,
  HoraInvalidaError,
  CapacidadExcedidaError,
  CantidadPersonasInvalidaError,
  DuracionBloqueInvalidaError,
  MinimoHorasReservaError,
  MaximoHorasReservaError,
  EspacioInactivoError,
  EspacioNoEncontradoError,
  ReservacionNoEncontradaError,
  EstadoReservacionInvalidoError,
  FechasReservaRequeridasError,
  RangoFechasInvalidoError,
  DominioError,
} from '../dominio/errores/dominio.errors.js';
import { RESERVACION_REPO_TOKEN, ESPACIO_REPO_TOKEN } from '../tokens/tokens.js';
import { diaSemana, formatoFecha, hoy, horaAMinutos, parseFecha } from '../common/utils/fecha.util.js';

export interface FiltrosListadoReservaciones {
  fecha?: Date;
  desde?: Date;
  hasta?: Date;
  espacioId?: string;
  estado?: EstadoReservacion;
}

export interface SolicitudReservacionMultiple {
  fechas: string[];
  horaInicio: string;
  horaFin: string;
  espacioId: string;
  usuarioId: string;
  cantidadPersonas: number;
  generarId: () => string;
}

@Injectable()
export class ReservacionesService {
  constructor(
    @Inject(RESERVACION_REPO_TOKEN) private readonly reservacionRepo: IReservacionRepository,
    @Inject(ESPACIO_REPO_TOKEN) private readonly espacioRepo: IEspacioRepository,
  ) { }

  async crearReservacion(nuevaReservacion: Reservacion): Promise<void> {
    await this.validarYPreparar(nuevaReservacion);
    await this.reservacionRepo.guardar(nuevaReservacion);
  }

  async crearReservacionesMultiples(solicitud: SolicitudReservacionMultiple): Promise<Reservacion[]> {
    const fechasUnicas = [...new Set(solicitud.fechas.map((f) => formatoFecha(parseFecha(f))))].sort();
    if (fechasUnicas.length === 0) {
      throw new FechasReservaRequeridasError('Debes indicar al menos una fecha.');
    }

    const reservaciones: Reservacion[] = [];
    for (const fecha of fechasUnicas) {
      const reservacion = new Reservacion(
        solicitud.generarId(),
        parseFecha(fecha),
        solicitud.horaInicio,
        solicitud.horaFin,
        EstadoReservacion.PENDIENTE,
        solicitud.espacioId,
        solicitud.usuarioId,
        '',
        solicitud.cantidadPersonas,
        0,
      );
      try {
        await this.validarYPreparar(reservacion);
      } catch (error) {
        if (error instanceof DominioError) {
          const Tipo = error.constructor as new (mensaje: string) => DominioError;
          throw new Tipo(`Fecha ${fecha}: ${error.message}`);
        }
        throw error;
      }
      reservaciones.push(reservacion);
    }

    await this.reservacionRepo.guardarVarias(reservaciones);
    return reservaciones;
  }

  private async validarYPreparar(nuevaReservacion: Reservacion): Promise<void> {
    nuevaReservacion.fecha = parseFecha(nuevaReservacion.fecha);
    const fechaReserva = nuevaReservacion.fecha;

    if (fechaReserva.getTime() < hoy().getTime()) {
      throw new FechaPasadaError();
    }

    const minInicio = horaAMinutos(nuevaReservacion.horaInicio);
    const minFin = horaAMinutos(nuevaReservacion.horaFin);
    if (minFin <= minInicio) {
      throw new HoraInvalidaError();
    }

    const espacio = await this.espacioRepo.obtenerEspacioPorId(nuevaReservacion.espacioId);
    if (!espacio) {
      throw new EspacioNoEncontradoError(`El espacio con ID ${nuevaReservacion.espacioId} no existe.`);
    }
    if (!espacio.activo) {
      throw new EspacioInactivoError(`El espacio '${espacio.nombre}' se encuentra inactivo para reservaciones.`);
    }

    const duracionSolicitadaMinutos = minFin - minInicio;
    if (duracionSolicitadaMinutos % espacio.duracionMinutos !== 0) {
      throw new DuracionBloqueInvalidaError(
        `La reserva debe hacerse en bloques exactos de ${espacio.duracionMinutos} minutos.`,
      );
    }

    const horasSolicitadas = duracionSolicitadaMinutos / 60;
    if (horasSolicitadas < espacio.minimoHorasReserva) {
      throw new MinimoHorasReservaError(
        `La reserva debe ser de al menos ${espacio.minimoHorasReserva} horas.`,
      );
    }
    if (horasSolicitadas > espacio.maximoHorasReserva) {
      throw new MaximoHorasReservaError(
        `La reserva no puede exceder ${espacio.maximoHorasReserva} horas.`,
      );
    }

    if (nuevaReservacion.cantidadPersonas <= 0) {
      throw new CantidadPersonasInvalidaError('La cantidad de personas debe ser de al menos 1.');
    }
    if (nuevaReservacion.cantidadPersonas > espacio.capacidadMaxima) {
      throw new CapacidadExcedidaError(
        `El espacio solo permite hasta ${espacio.capacidadMaxima} personas.`,
      );
    }

    const sede = await this.espacioRepo.obtenerSedePorId(espacio.sedeId);
    if (sede && (nuevaReservacion.horaInicio < sede.horaAperturaGeneral || nuevaReservacion.horaFin > sede.horaCierreGeneral)) {
      throw new FueraDeHorarioError(
        `El horario solicitado (${nuevaReservacion.horaInicio} - ${nuevaReservacion.horaFin}) excede el horario de atención de la sede (${sede.horaAperturaGeneral} - ${sede.horaCierreGeneral}).`,
      );
    }

    const horariosDia = await this.espacioRepo.obtenerHorariosPorEspacioYDia(espacio.id, diaSemana(fechaReserva));
    const estaEnHorario = horariosDia.some((horario) =>
      nuevaReservacion.horaInicio >= horario.horaApertura && nuevaReservacion.horaFin <= horario.horaCierre,
    );
    if (!estaEnHorario) {
      throw new FueraDeHorarioError();
    }

    const bloqueos = await this.espacioRepo.obtenerBloqueosPorEspacioYFecha(espacio.id, fechaReserva);
    const chocaConBloqueo = bloqueos.some((b) => {
      const caeEnRangoFechas =
        fechaReserva.getTime() >= parseFecha(b.fechaInicio).getTime() &&
        fechaReserva.getTime() <= parseFecha(b.fechaFin).getTime();
      return caeEnRangoFechas && this.hayEmpalme(nuevaReservacion.horaInicio, nuevaReservacion.horaFin, b.horaInicio, b.horaFin);
    });
    if (chocaConBloqueo) {
      throw new BloqueoAdministrativoError();
    }

    const reservacionesExistentes = await this.reservacionRepo.obtenerPorEspacioYFecha(espacio.id, fechaReserva);
    const chocaConReservacion = reservacionesExistentes.some((res) =>
      (res.estado === EstadoReservacion.PENDIENTE || res.estado === EstadoReservacion.CONFIRMADA) &&
      this.hayEmpalme(nuevaReservacion.horaInicio, nuevaReservacion.horaFin, res.horaInicio, res.horaFin),
    );
    if (chocaConReservacion) {
      throw new EmpalmeReservacionError();
    }

    nuevaReservacion.estado = EstadoReservacion.PENDIENTE;
    nuevaReservacion.subtotal = horasSolicitadas * espacio.costoPorHora;
  }

  async confirmarReservacion(id: string): Promise<void> {
    const res = await this.reservacionRepo.obtenerPorId(id);
    if (!res) {
      throw new ReservacionNoEncontradaError('La reservación no existe.');
    }
    if (res.estado !== EstadoReservacion.PENDIENTE) {
      throw new EstadoReservacionInvalidoError('Solo se pueden confirmar reservas pendientes.');
    }
    res.estado = EstadoReservacion.CONFIRMADA;
    await this.reservacionRepo.actualizar(res);
  }

  async completarReservacion(id: string): Promise<void> {
    const res = await this.reservacionRepo.obtenerPorId(id);
    if (!res) {
      throw new ReservacionNoEncontradaError('La reservación no existe.');
    }
    if (res.estado !== EstadoReservacion.CONFIRMADA) {
      throw new EstadoReservacionInvalidoError('Solo se pueden completar reservas confirmadas.');
    }
    res.estado = EstadoReservacion.COMPLETADA;
    await this.reservacionRepo.actualizar(res);
  }

  async cancelarReservacion(id: string): Promise<void> {
    const res = await this.reservacionRepo.obtenerPorId(id);
    if (!res) {
      throw new ReservacionNoEncontradaError('La reservación no existe.');
    }
    if (res.estado === EstadoReservacion.COMPLETADA || res.estado === EstadoReservacion.CANCELADA) {
      throw new EstadoReservacionInvalidoError('No se puede cancelar una reservación completada o ya cancelada.');
    }
    res.estado = EstadoReservacion.CANCELADA;
    await this.reservacionRepo.actualizar(res);
  }

  async obtenerHistorialCliente(usuarioId: string): Promise<Reservacion[]> {
    return this.reservacionRepo.obtenerPorUsuarioId(usuarioId);
  }

  async obtenerPorId(id: string): Promise<Reservacion | null> {
    return this.reservacionRepo.obtenerPorId(id);
  }

  async listarTodas(): Promise<Reservacion[]> {
    return this.reservacionRepo.obtenerTodas();
  }

  async obtenerPorRangoFechas(fechaInicio: Date, fechaFin: Date, espacioId?: string): Promise<Reservacion[]> {
    return this.reservacionRepo.obtenerPorRangoFechas(fechaInicio, fechaFin, espacioId);
  }

  async listarReservaciones(filtros: FiltrosListadoReservaciones = {}): Promise<Reservacion[]> {
    const desde = filtros.fecha ?? filtros.desde;
    const hasta = filtros.fecha ?? filtros.hasta;

    if ((desde && !hasta) || (!desde && hasta)) {
      throw new RangoFechasInvalidoError('Para filtrar por rango indica fechaInicio y fechaFin.');
    }
    if (desde && hasta && parseFecha(hasta) < parseFecha(desde)) {
      throw new RangoFechasInvalidoError('fechaFin no puede ser anterior a fechaInicio.');
    }

    const base = desde && hasta
      ? await this.reservacionRepo.obtenerPorRangoFechas(parseFecha(desde), parseFecha(hasta), filtros.espacioId)
      : await this.reservacionRepo.obtenerTodas();

    return base
      .filter((r) => (filtros.espacioId ? r.espacioId === filtros.espacioId : true))
      .filter((r) => (filtros.estado ? r.estado === filtros.estado : true))
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime() || a.horaInicio.localeCompare(b.horaInicio));
  }

  private hayEmpalme(inicioA: string, finA: string, inicioB: string, finB: string): boolean {
    return inicioA < finB && finA > inicioB;
  }
}