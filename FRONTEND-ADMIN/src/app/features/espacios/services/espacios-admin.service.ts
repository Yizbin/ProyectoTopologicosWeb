import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  ActualizarEspacioDto,
  Bloqueo,
  CrearBloqueoRequest,
  CrearEspacioDto,
  DesactivarBloqueoResponse,
  Espacio,
  EspacioBuscado,
  GuardarHorariosRequest,
  HorarioAtencion,
  ResultadoPaginado,
  Sede,
  TipoEspacio,
} from '../../../core/models';

export interface ListarEspaciosAdminParams {
  busqueda?: string;
  tipo?: TipoEspacio | '';
  sedeId?: string;
  estadoActivo?: 'todos' | 'activos' | 'inactivos';
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class EspaciosAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  listarSedes(): Observable<Sede[]> {
    return this.http.get<Sede[]>(`${this.apiBaseUrl}/sedes`);
  }

  listarEspacios(
    params: ListarEspaciosAdminParams = {},
  ): Observable<ResultadoPaginado<EspacioBuscado>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('limit', String(params.limit ?? 8));

    const busqueda = params.busqueda?.trim();
    if (busqueda) {
      httpParams = httpParams.set('busqueda', busqueda);
    }
    if (params.tipo) {
      httpParams = httpParams.set('tipo', params.tipo);
    }
    if (params.sedeId) {
      httpParams = httpParams.set('sedeId', params.sedeId);
    }
    if (params.estadoActivo) {
      httpParams = httpParams.set('estadoActivo', params.estadoActivo);
    }

    return this.http.get<ResultadoPaginado<EspacioBuscado>>(
      `${this.apiBaseUrl}/espacios`,
      { params: httpParams },
    );
  }

  obtenerEspacio(id: string): Observable<Espacio> {
    return this.http.get<Espacio>(
      `${this.apiBaseUrl}/espacios/${encodeURIComponent(id)}`,
    );
  }

  crearEspacio(dto: CrearEspacioDto): Observable<Espacio> {
    return this.http.post<Espacio>(`${this.apiBaseUrl}/espacios`, dto);
  }

  actualizarEspacio(id: string, dto: ActualizarEspacioDto): Observable<Espacio> {
    return this.http.patch<Espacio>(
      `${this.apiBaseUrl}/espacios/${encodeURIComponent(id)}`,
      dto,
    );
  }

  obtenerHorarios(espacioId: string): Observable<HorarioAtencion[]> {
    return this.http.get<HorarioAtencion[]>(
      `${this.apiBaseUrl}/espacios/${encodeURIComponent(espacioId)}/horarios`,
    );
  }

  guardarHorarios(
    espacioId: string,
    payload: GuardarHorariosRequest,
  ): Observable<HorarioAtencion[]> {
    return this.http.put<HorarioAtencion[]>(
      `${this.apiBaseUrl}/espacios/${encodeURIComponent(espacioId)}/horarios`,
      payload,
    );
  }

  obtenerBloqueos(
    espacioId: string,
    soloActivos?: boolean,
  ): Observable<Bloqueo[]> {
    let httpParams = new HttpParams();
    if (soloActivos !== undefined) {
      httpParams = httpParams.set('soloActivos', String(soloActivos));
    }
    return this.http.get<Bloqueo[]>(
      `${this.apiBaseUrl}/espacios/${encodeURIComponent(espacioId)}/bloqueos`,
      { params: httpParams },
    );
  }

  crearBloqueo(
    espacioId: string,
    payload: CrearBloqueoRequest,
  ): Observable<Bloqueo> {
    return this.http.post<Bloqueo>(
      `${this.apiBaseUrl}/espacios/${encodeURIComponent(espacioId)}/bloqueos`,
      payload,
    );
  }

  desactivarBloqueo(
    espacioId: string,
    bloqueoId: string,
  ): Observable<DesactivarBloqueoResponse> {
    return this.http.patch<DesactivarBloqueoResponse>(
      `${this.apiBaseUrl}/espacios/${encodeURIComponent(espacioId)}/bloqueos/${encodeURIComponent(bloqueoId)}/desactivar`,
      {},
    );
  }
}
