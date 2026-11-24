import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  AccionReservacionResponse,
  CrearReservacionRequest,
  EstadoReservacion,
  Reservacion,
  ReservacionDetallada,
  ResultadoPaginado,
} from '../../../core/models';

export interface ListarReservacionesAdminParams {
  busqueda?: string;
  estado?: EstadoReservacion | '';
  espacioId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ReservacionesAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  listar(
    params: ListarReservacionesAdminParams = {},
  ): Observable<ResultadoPaginado<ReservacionDetallada>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('limit', String(params.limit ?? 10));

    const busqueda = params.busqueda?.trim();
    if (busqueda) {
      httpParams = httpParams.set('busqueda', busqueda);
    }
    if (params.estado) {
      httpParams = httpParams.set('estado', params.estado);
    }
    if (params.espacioId) {
      httpParams = httpParams.set('espacioId', params.espacioId);
    }
    if (params.fechaInicio && params.fechaFin) {
      httpParams = httpParams
        .set('fechaInicio', params.fechaInicio)
        .set('fechaFin', params.fechaFin);
    }

    return this.http.get<ResultadoPaginado<ReservacionDetallada>>(
      `${this.apiBaseUrl}/reservaciones`,
      { params: httpParams },
    );
  }

  obtenerPorId(id: string): Observable<Reservacion> {
    return this.http.get<Reservacion>(
      `${this.apiBaseUrl}/reservaciones/${encodeURIComponent(id)}`,
    );
  }

  listarPorCliente(usuarioId: string): Observable<Reservacion[]> {
    return this.http.get<Reservacion[]>(
      `${this.apiBaseUrl}/reservaciones/cliente/${encodeURIComponent(usuarioId)}`,
    );
  }

  crear(dto: CrearReservacionRequest): Observable<Reservacion> {
    return this.http.post<Reservacion>(
      `${this.apiBaseUrl}/reservaciones`,
      dto,
    );
  }

  confirmar(id: string): Observable<AccionReservacionResponse> {
    return this.http.patch<AccionReservacionResponse>(
      `${this.apiBaseUrl}/reservaciones/${encodeURIComponent(id)}/confirmar`,
      {},
    );
  }

  completar(id: string): Observable<AccionReservacionResponse> {
    return this.http.patch<AccionReservacionResponse>(
      `${this.apiBaseUrl}/reservaciones/${encodeURIComponent(id)}/completar`,
      {},
    );
  }

  cancelar(id: string): Observable<AccionReservacionResponse> {
    return this.http.patch<AccionReservacionResponse>(
      `${this.apiBaseUrl}/reservaciones/${encodeURIComponent(id)}/cancelar`,
      {},
    );
  }
}
