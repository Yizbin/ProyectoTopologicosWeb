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
  DuracionBloqueInvalidaError,
  MinimoHorasReservaError,
  MaximoHorasReservaError,
  EspacioInactivoError,
  EspacioNoEncontradoError,
  ReservacionNoEncontradaError,
  EstadoReservacionInvalidoError,
} from '../dominio/errores/dominio.errors.js';
import { RESERVACION_REPO_TOKEN, ESPACIO_REPO_TOKEN } from '../tokens/tokens.js';

@Injectable()
export class ReservacionesService {
  constructor(
    @Inject(RESERVACION_REPO_TOKEN) private readonly reservacionRepo: IReservacionRepository,
    @Inject(ESPACIO_REPO_TOKEN) private readonly espacioRepo: IEspacioRepository,
  ) { }

  async crearReservacion(nuevaReservacion: Reservacion): Promise<void> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaReserva = new Date(nuevaReservacion.fecha);
    fechaReserva.setHours(0, 0, 0, 0);
    if (fechaReserva < hoy) {
      throw new FechaPasadaError();
    }

    const minInicio = this.timeToMinutes(nuevaReservacion.horaInicio);
    const minFin = this.timeToMinutes(nuevaReservacion.horaFin);
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
      throw new CapacidadExcedidaError('La cantidad de personas debe ser de al menos 1.');
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

    const diaSemana = nuevaReservacion.fecha.getDay();
    const horariosDia = await this.espacioRepo.obtenerHorariosPorEspacioYDia(espacio.id, diaSemana);
    const estaEnHorario = horariosDia.some((horario) =>
      nuevaReservacion.horaInicio >= horario.horaApertura && nuevaReservacion.horaFin <= horario.horaCierre,
    );
    if (!estaEnHorario) {
      throw new FueraDeHorarioError();
    }

    const bloqueos = await this.espacioRepo.obtenerBloqueosPorEspacioYFecha(espacio.id, nuevaReservacion.fecha);
    const chocaConBloqueo = bloqueos.some((b) => {
      const bInicioDia = new Date(b.fechaInicio);
      bInicioDia.setHours(0, 0, 0, 0);
      const bFinDia = new Date(b.fechaFin);
      bFinDia.setHours(23, 59, 59, 999);
      const caeEnRangoFechas = fechaReserva.getTime() >= bInicioDia.getTime() && fechaReserva.getTime() <= bFinDia.getTime();
      return caeEnRangoFechas && this.hayEmpalme(nuevaReservacion.horaInicio, nuevaReservacion.horaFin, b.horaInicio, b.horaFin);
    });
    if (chocaConBloqueo) {
      throw new BloqueoAdministrativoError();
    }

    const reservacionesExistentes = await this.reservacionRepo.obtenerPorEspacioYFecha(espacio.id, nuevaReservacion.fecha);
    const chocaConReservacion = reservacionesExistentes.some((res) =>
      (res.estado === EstadoReservacion.PENDIENTE || res.estado === EstadoReservacion.CONFIRMADA) &&
      this.hayEmpalme(nuevaReservacion.horaInicio, nuevaReservacion.horaFin, res.horaInicio, res.horaFin),
    );
    if (chocaConReservacion) {
      throw new EmpalmeReservacionError();
    }

    nuevaReservacion.estado = EstadoReservacion.PENDIENTE;
    nuevaReservacion.subtotal = horasSolicitadas * espacio.costoPorHora;
    await this.reservacionRepo.guardar(nuevaReservacion);
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

  private hayEmpalme(inicioA: string, finA: string, inicioB: string, finB: string): boolean {
    return inicioA < finB && finA > inicioB;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}