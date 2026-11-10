export class DominioError extends Error {
    constructor(mensaje: string) {
        super(mensaje);
        this.name = this.constructor.name;
    }
}

export class EmpalmeReservacionError extends DominioError {
    constructor(mensaje: string = "No se puede completar la reservacion: Ya existe otra reservacion que ocupa este horario.") {
        super(mensaje);
    }
}

export class BloqueoAdministrativoError extends DominioError {
    constructor(mensaje: string = "No se puede completar la reservacion: El administrador ha bloqueado este espacio en el horario solicitado.") {
        super(mensaje);
    }
}

export class FueraDeHorarioError extends DominioError {
    constructor(mensaje: string = "No se puede agendar el espacio: El horario solicitado esta fuera de los dias y horas de atencion configurados.") {
        super(mensaje);
    }
}

export class FechaPasadaError extends DominioError {
    constructor(mensaje: string = "No se puede reservar en una fecha que ya pasó.") {
        super(mensaje);
    }
}

export class HoraInvalidaError extends DominioError {
    constructor(mensaje: string = "La hora de fin debe ser estrictamente posterior a la hora de inicio.") {
        super(mensaje);
    }
}

export class CapacidadExcedidaError extends DominioError {
    constructor(mensaje: string = "La cantidad de personas excede la capacidad máxima del espacio.") {
        super(mensaje);
    }
}

export class DuracionBloqueInvalidaError extends DominioError {
    constructor(mensaje: string = "La duración de la reservación debe respetar los bloques de minutos del espacio.") {
        super(mensaje);
    }
}

export class MinimoHorasReservaError extends DominioError {
    constructor(mensaje: string = "La duración de la reservación no cumple con el mínimo de horas requerido.") {
        super(mensaje);
    }
}

export class MaximoHorasReservaError extends DominioError {
    constructor(mensaje: string = "La duración de la reservación excede el máximo de horas permitido.") {
        super(mensaje);
    }
}

export class RangoHorasReservaInvalidoError extends DominioError {
    constructor(mensaje: string = "La duración de la reservación no cumple con el rango de horas permitido.") {
        super(mensaje);
    }
}

export class EspacioInactivoError extends DominioError {
    constructor(mensaje: string = "El espacio solicitado se encuentra inactivo para reservaciones.") {
        super(mensaje);
    }
}

export class EspacioNoEncontradoError extends DominioError {
    constructor(mensaje: string = "El espacio solicitado no existe.") {
        super(mensaje);
    }
}

export class ReservacionNoEncontradaError extends DominioError {
    constructor(mensaje: string = "La reservación solicitada no fue encontrada.") {
        super(mensaje);
    }
}

export class EstadoReservacionInvalidoError extends DominioError {
    constructor(mensaje: string = "La acción solicitada no es válida para el estado actual de la reservación.") {
        super(mensaje);
    }
}
export class HorarioAtencionInvalidoError extends DominioError {
    constructor(mensaje: string = "El horario de atención no es válido.") {
        super(mensaje);
    }
}

export class PagoNoEncontradoError extends DominioError {
    constructor(mensaje: string = "El pago solicitado no fue encontrado.") {
        super(mensaje);
    }
}

export class ReservacionYaPagadaError extends DominioError {
    constructor(mensaje: string = "La reservación ya tiene un pago registrado.") {
        super(mensaje);
    }
}

export class PagoEstadoInvalidoError extends DominioError {
    constructor(mensaje: string = "La acción solicitada no es válida para el estado actual del pago.") {
        super(mensaje);
    }
}

export class SedeNoEncontradaError extends DominioError {
    constructor(mensaje: string = "La sede especificada no existe.") {
        super(mensaje);
    }
}

export class CantidadPersonasInvalidaError extends DominioError {
    constructor(mensaje: string = "La cantidad de personas debe ser de al menos 1.") {
        super(mensaje);
    }
}

export class FechasReservaRequeridasError extends DominioError {
    constructor(mensaje: string = "Debes indicar al menos una fecha para reservar.") {
        super(mensaje);
    }
}

export class RangoFechasInvalidoError extends DominioError {
    constructor(mensaje: string = "El rango de fechas indicado no es válido.") {
        super(mensaje);
    }
}