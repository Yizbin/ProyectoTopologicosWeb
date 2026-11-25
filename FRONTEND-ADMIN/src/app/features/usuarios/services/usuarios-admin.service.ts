import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  ActualizarUsuarioRequest,
  CrearUsuarioRequest,
  ResultadoPaginado,
  RolUsuario,
  UsuarioPublico,
} from '../../../core/models';

export interface ListarUsuariosAdminParams {
  busqueda?: string;
  rol?: RolUsuario | '';
  estado?: 'activos' | 'inactivos' | '';
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class UsuariosAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  listar(
    params: ListarUsuariosAdminParams = {},
  ): Observable<ResultadoPaginado<UsuarioPublico>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('limit', String(params.limit ?? 10));

    const busqueda = params.busqueda?.trim();
    if (busqueda) {
      httpParams = httpParams.set('busqueda', busqueda);
    }
    if (params.rol) {
      httpParams = httpParams.set('rol', params.rol);
    }
    if (params.estado) {
      httpParams = httpParams.set('activo', params.estado === 'activos' ? 'true' : 'false');
    }

    return this.http.get<ResultadoPaginado<UsuarioPublico>>(
      `${this.apiBaseUrl}/usuarios`,
      { params: httpParams },
    );
  }

  listarTodos(rol?: RolUsuario): Observable<UsuarioPublico[]> {
    let httpParams = new HttpParams();
    if (rol) {
      httpParams = httpParams.set('rol', rol);
    }
    return this.http.get<UsuarioPublico[]>(`${this.apiBaseUrl}/usuarios`, {
      params: httpParams,
    });
  }

  obtenerPorId(id: string): Observable<UsuarioPublico> {
    return this.http.get<UsuarioPublico>(
      `${this.apiBaseUrl}/usuarios/${encodeURIComponent(id)}`,
    );
  }

  crear(dto: CrearUsuarioRequest): Observable<UsuarioPublico> {
    return this.http.post<UsuarioPublico>(`${this.apiBaseUrl}/usuarios`, dto);
  }

  actualizar(id: string, dto: ActualizarUsuarioRequest): Observable<UsuarioPublico> {
    return this.http.patch<UsuarioPublico>(
      `${this.apiBaseUrl}/usuarios/${encodeURIComponent(id)}`,
      dto,
    );
  }

  cambiarEstado(id: string, activo: boolean): Observable<UsuarioPublico> {
    return this.http.patch<UsuarioPublico>(
      `${this.apiBaseUrl}/usuarios/${encodeURIComponent(id)}/estado`,
      { activo },
    );
  }
}
