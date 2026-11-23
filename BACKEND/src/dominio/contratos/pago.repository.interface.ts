import { EstadoPago, MetodoPago, Pago } from '../entidades/pago.entity.js';
import { EstadoReservacion } from '../entidades/reservacion.entity.js';

export interface PagoConReservacion {
    pago: Pago;
    reservacionId: string;
}

export interface FiltrosListadoPagos {
    estado?: EstadoPago;
    metodo?: MetodoPago;
}

export interface PagoDetallado {
    id: string;
    montoTotal: number;
    estado: EstadoPago;
    metodo?: MetodoPago;
    referencia?: string;
    reservacion: {
        id: string;
        fecha: Date;
        horaInicio: string;
        horaFin: string;
        estado: EstadoReservacion;
        espacioId: string;
        usuarioId: string;
        espacioNombre?: string;
        usuarioNombre?: string;
        usuarioCorreo?: string;
    } | null;
}

export interface IPagoRepository {
    guardarConReservaciones(items: PagoConReservacion[]): Promise<void>;
    obtenerPorId(id: string): Promise<Pago | null>;
    actualizar(pago: Pago): Promise<void>;
    completarSiReservacionVigente(id: string): Promise<Pago>;
    listarTodos(filtros?: FiltrosListadoPagos): Promise<PagoDetallado[]>;
}
