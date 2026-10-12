import { Injectable, Inject } from '@nestjs/common';
import type { IReservacionRepository } from '../dominio/contratos/reservacion.repository.interface.js';
import type { IEspacioRepository } from '../dominio/contratos/espacio.repository.interface.js';
import { EstadoReservacion, Reservacion } from '../dominio/entidades/reservacion.entity.js';
import { DominioError, FueraDeHorarioError, BloqueoAdministrativoError, EmpalmeReservacionError } from '../dominio/errores/dominio.errors.js';
import { RESERVACION_REPO_TOKEN, ESPACIO_REPO_TOKEN } from '../tokens/tokens.js';

@Injectable()
export class ReservacionesService {
    constructor(
        @Inject(RESERVACION_REPO_TOKEN) private readonly reservacionRepo: IReservacionRepository,
        @Inject(ESPACIO_REPO_TOKEN) private readonly espacioRepo: IEspacioRepository
    ) { }

    async crearReservacion(nuevaReservacion: Reservacion): Promise<void> {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaReserva = new Date(nuevaReservacion.fecha);
        fechaReserva.setHours(0, 0, 0, 0);
        if (fechaReserva < hoy) {
            throw new DominioError("No se puede reservar en una fecha que ya pasó.");
        }

        const minInicio = this.timeToMinutes(nuevaReservacion.horaInicio);
        const minFin = this.timeToMinutes(nuevaReservacion.horaFin);
        if (minFin <= minInicio) {
            throw new DominioError("La hora de fin debe ser estrictamente posterior a la hora de inicio.");
        }

        const espacio = await this.espacioRepo.obtenerEspacioPorId(nuevaReservacion.espacioId);
        if (!espacio || !espacio.activo) throw new DominioError("El espacio solicitado no existe.");

        if ((minFin - minInicio) % espacio.duracionMinutos !== 0) {
            throw new DominioError(`La reserva debe hacerse en bloques exactos de ${espacio.duracionMinutos} minutos.`);
        }

        const horasSolicitadas = (minFin - minInicio) / 60;
        if (horasSolicitadas < espacio.minimoHorasReserva || horasSolicitadas > espacio.maximoHorasReserva) {
            throw new DominioError(`La reserva debe ser de entre ${espacio.minimoHorasReserva} y ${espacio.maximoHorasReserva} horas.`);
        }

        if (nuevaReservacion.cantidadPersonas > espacio.capacidadMaxima) {
            throw new DominioError(`El espacio solo permite hasta ${espacio.capacidadMaxima} personas.`);
        }

        const sede = await this.espacioRepo.obtenerSedePorId(espacio.sedeId);
        if (sede && (nuevaReservacion.horaInicio < sede.horaAperturaGeneral || nuevaReservacion.horaFin > sede.horaCierreGeneral)) {
            throw new FueraDeHorarioError();
        }

        const diaSemana = nuevaReservacion.fecha.getDay(); 
        const horariosDia = await this.espacioRepo.obtenerHorariosPorEspacioYDia(espacio.id, diaSemana);
        const estaEnHorario = horariosDia.some(horario =>
            nuevaReservacion.horaInicio >= horario.horaApertura && nuevaReservacion.horaFin <= horario.horaCierre
        );
        if (!estaEnHorario) throw new FueraDeHorarioError(); 

        const bloqueos = await this.espacioRepo.obtenerBloqueosPorEspacioYFecha(espacio.id, nuevaReservacion.fecha);
        const chocaConBloqueo = bloqueos.some(b => {
            const caeEnRangoFechas = fechaReserva >= b.fechaInicio && fechaReserva <= b.fechaFin;
            return caeEnRangoFechas && this.hayEmpalme(nuevaReservacion.horaInicio, nuevaReservacion.horaFin, b.horaInicio, b.horaFin);
        });
        if (chocaConBloqueo) throw new BloqueoAdministrativoError(); 

        const reservacionesExistentes = await this.reservacionRepo.obtenerPorEspacioYFecha(espacio.id, nuevaReservacion.fecha);
        const chocaConReservacion = reservacionesExistentes.some(res =>
            (res.estado === EstadoReservacion.PENDIENTE || res.estado === EstadoReservacion.CONFIRMADA) &&
            this.hayEmpalme(nuevaReservacion.horaInicio, nuevaReservacion.horaFin, res.horaInicio, res.horaFin)
        );
        if (chocaConReservacion) throw new EmpalmeReservacionError();

        nuevaReservacion.estado = EstadoReservacion.PENDIENTE;
        nuevaReservacion.subtotal = horasSolicitadas * espacio.costoPorHora; 
        await this.reservacionRepo.guardar(nuevaReservacion);
    }

    async confirmarReservacion(id: string): Promise<void> {
        const res = await this.reservacionRepo.obtenerPorId(id);
        if (!res) throw new DominioError("La reservación no existe.");
        if (res.estado !== EstadoReservacion.PENDIENTE) throw new DominioError("Solo se pueden confirmar reservas pendientes.");
        res.estado = EstadoReservacion.CONFIRMADA;
        await this.reservacionRepo.actualizar(res);
    }

    async completarReservacion(id: string): Promise<void> {
        const res = await this.reservacionRepo.obtenerPorId(id);
        if (!res) throw new DominioError("La reservación no existe.");
        if (res.estado !== EstadoReservacion.CONFIRMADA) throw new DominioError("Solo se pueden completar reservas confirmadas.");
        res.estado = EstadoReservacion.COMPLETADA;
        await this.reservacionRepo.actualizar(res);
    }

    async cancelarReservacion(id: string): Promise<void> {
        const res = await this.reservacionRepo.obtenerPorId(id);
        if (!res) throw new DominioError("La reservación no existe.");
        if (res.estado === EstadoReservacion.COMPLETADA || res.estado === EstadoReservacion.CANCELADA) {
            throw new DominioError("No se puede cancelar una reservación completada o ya cancelada.");
        }
        res.estado = EstadoReservacion.CANCELADA;
        await this.reservacionRepo.actualizar(res);
    }

    async obtenerHistorialCliente(usuarioId: string): Promise<Reservacion[]> {
        return this.reservacionRepo.obtenerPorUsuarioId(usuarioId);
    }

    private hayEmpalme(inicioA: string, finA: string, inicioB: string, finB: string): boolean {
        return inicioA < finB && finA > inicioB;
    }

    private timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
}