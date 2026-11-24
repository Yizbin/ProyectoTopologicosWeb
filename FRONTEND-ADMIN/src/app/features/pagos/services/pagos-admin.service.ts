import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  CompletarPagoResponse,
  CrearPagoRequest,
  CrearPagoResponse,
  EstadoPago,
  MetodoPago,
  Pago,
  PagoDetallado,
  ResultadoPaginado,
} from '../../../core/models';

export interface ListarPagosAdminParams {
  busqueda?: string;
  estado?: EstadoPago | '';
  metodo?: MetodoPago | '';
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class PagosAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  listar(
    params: ListarPagosAdminParams = {},
  ): Observable<ResultadoPaginado<PagoDetallado>> {
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
    if (params.metodo) {
      httpParams = httpParams.set('metodo', params.metodo);
    }

    return this.http.get<ResultadoPaginado<PagoDetallado>>(
      `${this.apiBaseUrl}/pagos`,
      { params: httpParams },
    );
  }

  obtenerPorId(id: string): Observable<Pago> {
    return this.http.get<Pago>(
      `${this.apiBaseUrl}/pagos/${encodeURIComponent(id)}`,
    );
  }

  registrarPago(dto: CrearPagoRequest): Observable<CrearPagoResponse> {
    return this.http.post<CrearPagoResponse>(`${this.apiBaseUrl}/pagos`, dto);
  }

  completarPago(id: string): Observable<CompletarPagoResponse> {
    return this.http.patch<CompletarPagoResponse>(
      `${this.apiBaseUrl}/pagos/${encodeURIComponent(id)}/completar`,
      {},
    );
  }
}
