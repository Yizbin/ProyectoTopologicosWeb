import type { EstadoReservacion, TipoEspacio } from './domain.models';

export interface TopEspacioResumen {
  espacioId: string;
  nombre: string;
  tipo: TipoEspacio;
  totalReservaciones: number;
  ingresosGenerados: number;
}

export interface ReservacionRecienteResumen {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoReservacion;
  subtotal: number;
  espacio: {
    id: string;
    nombre: string;
    tipo: TipoEspacio;
  };
  cliente: {
    id: string;
    nombre: string;
    correo: string;
  };
}

export interface DashboardResumen {
  periodo: { fechaInicio: string; fechaFin: string };
  ocupacion: { minutosDisponibles: number; minutosOcupados: number; porcentaje: number };
  espacios: {
    total: number;
    activos: number;
    inactivos: number;
  };
  reservaciones: {
    total: number;
    pendientes: number;
    confirmadas: number;
    completadas: number;
    canceladas: number;
    hoy: number;
    proximos7Dias: number;
  };
  ingresos: {
    acumulados: number;
    pendientesPorCobrar: number;
    pagosCompletados: number;
    pagosPendientes: number;
  };
  usuarios: {
    total: number;
    clientes: number;
    admins: number;
  };
  topEspacios: TopEspacioResumen[];
  ultimasReservaciones: ReservacionRecienteResumen[];
}
