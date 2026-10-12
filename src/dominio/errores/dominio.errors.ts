export class DominioError extends Error {
    constructor(mensaje: string) { 
        super(mensaje);
        this.name = this.constructor.name;
    }
}

export class EmpalmeReservacionError extends DominioError {
    constructor() { 
        super("No se puede completar la reservacion: Ya existe otra reservacion que ocupa este horario."); 
    }
}

export class BloqueoAdministrativoError extends DominioError {
    constructor() { 
        super("No se puede completar la reservacion: El administrador ha bloqueado este espacio en el horario solicitado."); 
    }
}

export class FueraDeHorarioError extends DominioError {
    constructor() { 
        super("No se puede agendar el espacio: El horario solicitado esta fuera de los dias y horas de atencion configurados."); 
    }
}