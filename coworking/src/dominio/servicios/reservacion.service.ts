import { IReservacionRepository } from '../contratos/reservacion.repository.interface';
import { IEspacioRepository } from '../contratos/espacio.repository.interface';
import { Reservacion, EstadoReservacion } from '../entidades/reservacion.entity';
import { EmpalmeReservacionError, BloqueoAdministrativoError, FueraDeHorarioError, DominioError } from '../errores/dominio.errors';

export class ReservacionService {
    // interfaces inyectadas, la logica del negocio no depende de alguna BD en especifico
    constructor(
        private reservacionRepo: IReservacionRepository,
        private espacioRepo: IEspacioRepository
    ) {}

    async crearReservacion(nuevaReservacion: Reservacion): Promise<void> {
        const espacio = await this.espacioRepo.obtenerEspacioPorId(nuevaReservacion.espacioId);
        if (!espacio || !espacio.activo) {
            throw new DominioError("El espacio solicitado no existe o está inactivo.");
        }

        const diaSemana = nuevaReservacion.fecha.getDay(); // 0 = domingo 1 = lunes y asi
        const horariosDia = await this.espacioRepo.obtenerHorariosPorEspacioYDia(espacio.id, diaSemana);

        // Regla de los horarios de atencion
        const estaEnHorario = horariosDia.some(horario => 
            nuevaReservacion.horaInicio >= horario.horaApertura && 
            nuevaReservacion.horaFin <= horario.horaCierre
        );
        if (!estaEnHorario) {
            throw new FueraDeHorarioError(); // error de dominio.errors.ts
        }

        // regla de bloqueos 
        const bloqueosDelDia = await this.espacioRepo.obtenerBloqueosPorEspacioYFecha(espacio.id, nuevaReservacion.fecha);
        const chocaConBloqueo = bloqueosDelDia.some(bloqueo => 
            this.hayEmpalme(nuevaReservacion.horaInicio, nuevaReservacion.horaFin, bloqueo.horaInicio, bloqueo.horaFin)
        );
        if (chocaConBloqueo) {
            throw new BloqueoAdministrativoError(); // error de dominio.errors.ts
        }

        // regla de empalmes (doble reservacion)
        const reservacionesExistentes = await this.reservacionRepo.obtenerPorEspacioYFecha(espacio.id, nuevaReservacion.fecha);
        const chocaConReservacion = reservacionesExistentes.some(res => 
            (res.estado === EstadoReservacion.PENDIENTE || res.estado === EstadoReservacion.CONFIRMADA) &&
            this.hayEmpalme(nuevaReservacion.horaInicio, nuevaReservacion.horaFin, res.horaInicio, res.horaFin)
        );
        if (chocaConReservacion) {
            throw new EmpalmeReservacionError(); // error de dominio.errors.ts
        }

        // si pasa todo la guardamos
        nuevaReservacion.estado = EstadoReservacion.PENDIENTE;
        await this.reservacionRepo.guardar(nuevaReservacion);
    }

    async cancelarReservacion(id: string): Promise<void> {
        const reservacion = await this.reservacionRepo.obtenerPorId(id);
        if (!reservacion) {
            throw new DominioError("La reservación no existe.");
        }
        reservacion.estado = EstadoReservacion.CANCELADA;
        await this.reservacionRepo.actualizar(reservacion);
    }

    
    private hayEmpalme(inicioA: string, finA: string, inicioB: string, finB: string): boolean {
        return inicioA < finB && finA > inicioB;
    }
}