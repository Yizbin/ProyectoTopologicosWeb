import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { formatoFecha, hoy, sumarDias } from '../common/utils/fecha.util.js';
import { TipoEspacio } from '../dominio/entidades/espacio.entity.js';
import { EstadoReservacion } from '../dominio/entidades/reservacion.entity.js';

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

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerResumen(): Promise<DashboardResumen> {
    const [espacios, reservaciones, pagos, usuarios] = await Promise.all([
      this.prisma.espacio.findMany({
        select: { id: true, nombre: true, tipo: true, activo: true },
      }),
      this.prisma.reservacion.findMany({
        include: {
          espacio: { select: { id: true, nombre: true, tipo: true } },
          usuario: { select: { id: true, nombre: true, correo: true } },
          pago: { select: { id: true, estado: true, montoTotal: true } },
        },
        orderBy: [{ fecha: 'desc' }, { horaInicio: 'desc' }],
      }),
      this.prisma.pago.findMany({
        select: { id: true, montoTotal: true, estado: true },
      }),
      this.prisma.usuario.findMany({
        select: { id: true, rol: true },
      }),
    ]);

    const hoyDate = hoy();
    const hoyIso = formatoFecha(hoyDate);
    const dentro7DiasIso = formatoFecha(sumarDias(hoyDate, 7));

    const espaciosActivos = espacios.filter((e) => e.activo).length;

    let pendientes = 0;
    let confirmadas = 0;
    let completadas = 0;
    let canceladas = 0;
    let reservasHoy = 0;
    let reservasProximos7Dias = 0;
    let subtotalSinPagoActivo = 0;

    const mapaTop = new Map<string, TopEspacioResumen>();
    for (const esp of espacios) {
      mapaTop.set(esp.id, {
        espacioId: esp.id,
        nombre: esp.nombre,
        tipo: this.normalizarTipo(esp.tipo),
        totalReservaciones: 0,
        ingresosGenerados: 0,
      });
    }

    for (const r of reservaciones) {
      const estado = this.normalizarEstado(r.estado);
      if (estado === EstadoReservacion.PENDIENTE) pendientes++;
      else if (estado === EstadoReservacion.CONFIRMADA) confirmadas++;
      else if (estado === EstadoReservacion.COMPLETADA) completadas++;
      else if (estado === EstadoReservacion.CANCELADA) canceladas++;

      const fechaIso = formatoFecha(new Date(r.fecha));
      if (estado !== EstadoReservacion.CANCELADA) {
        if (fechaIso === hoyIso) {
          reservasHoy++;
        }
        if (fechaIso >= hoyIso && fechaIso <= dentro7DiasIso) {
          reservasProximos7Dias++;
        }
      }

      if (
        !r.pago &&
        (estado === EstadoReservacion.PENDIENTE || estado === EstadoReservacion.CONFIRMADA)
      ) {
        subtotalSinPagoActivo += r.subtotal;
      }

      if (estado !== EstadoReservacion.CANCELADA && r.espacio) {
        const actual = mapaTop.get(r.espacio.id) ?? {
          espacioId: r.espacio.id,
          nombre: r.espacio.nombre,
          tipo: this.normalizarTipo(r.espacio.tipo),
          totalReservaciones: 0,
          ingresosGenerados: 0,
        };
        actual.totalReservaciones += 1;
        if (r.pago?.estado === 'COMPLETADO') {
          actual.ingresosGenerados += r.pago.montoTotal;
        } else if (
          estado === EstadoReservacion.CONFIRMADA ||
          estado === EstadoReservacion.COMPLETADA
        ) {
          actual.ingresosGenerados += r.subtotal;
        }
        mapaTop.set(r.espacio.id, actual);
      }
    }

    const pagosCompletadosLista = pagos.filter((p) => p.estado === 'COMPLETADO');
    const pagosPendientesLista = pagos.filter((p) => p.estado === 'PENDIENTE');

    const ingresosAcumulados = pagosCompletadosLista.reduce((acc, p) => acc + p.montoTotal, 0);
    const montoPagosPendientes = pagosPendientesLista.reduce((acc, p) => acc + p.montoTotal, 0);

    const admins = usuarios.filter((u) => u.rol === 'ADMIN').length;
    const clientes = usuarios.filter((u) => u.rol === 'CLIENTE').length;

    const topEspacios = Array.from(mapaTop.values())
      .filter((item) => item.totalReservaciones > 0)
      .sort(
        (a, b) =>
          b.totalReservaciones - a.totalReservaciones ||
          b.ingresosGenerados - a.ingresosGenerados,
      )
      .slice(0, 5);

    const ultimasReservaciones: ReservacionRecienteResumen[] = reservaciones
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        fecha: formatoFecha(new Date(r.fecha)),
        horaInicio: r.horaInicio,
        horaFin: r.horaFin,
        estado: this.normalizarEstado(r.estado),
        subtotal: r.subtotal,
        espacio: {
          id: r.espacio.id,
          nombre: r.espacio.nombre,
          tipo: this.normalizarTipo(r.espacio.tipo),
        },
        cliente: {
          id: r.usuario.id,
          nombre: r.usuario.nombre,
          correo: r.usuario.correo,
        },
      }));

    return {
      espacios: {
        total: espacios.length,
        activos: espaciosActivos,
        inactivos: espacios.length - espaciosActivos,
      },
      reservaciones: {
        total: reservaciones.length,
        pendientes,
        confirmadas,
        completadas,
        canceladas,
        hoy: reservasHoy,
        proximos7Dias: reservasProximos7Dias,
      },
      ingresos: {
        acumulados: ingresosAcumulados,
        pendientesPorCobrar: montoPagosPendientes + subtotalSinPagoActivo,
        pagosCompletados: pagosCompletadosLista.length,
        pagosPendientes: pagosPendientesLista.length,
      },
      usuarios: {
        total: usuarios.length,
        clientes,
        admins,
      },
      topEspacios,
      ultimasReservaciones,
    };
  }

  private normalizarTipo(tipo: string): TipoEspacio {
    switch (tipo) {
      case 'CUBICULO':
      case 'Cubiculo':
        return TipoEspacio.CUBICULO;
      case 'PC':
        return TipoEspacio.PC;
      case 'SALA':
      case 'Sala':
      default:
        return TipoEspacio.SALA;
    }
  }

  private normalizarEstado(estado: string): EstadoReservacion {
    switch (estado) {
      case 'CONFIRMADA':
      case 'confirmada':
        return EstadoReservacion.CONFIRMADA;
      case 'CANCELADA':
      case 'cancelada':
        return EstadoReservacion.CANCELADA;
      case 'COMPLETADA':
      case 'completada':
        return EstadoReservacion.COMPLETADA;
      case 'PENDIENTE':
      case 'pendiente':
      default:
        return EstadoReservacion.PENDIENTE;
    }
  }
}
