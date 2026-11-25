import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { DashboardResumen } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  obtenerResumen(periodo?: { fechaInicio: string; fechaFin: string }): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(
      `${this.apiBaseUrl}/dashboard/resumen`,
      { params: periodo ? new HttpParams({ fromObject: periodo }) : new HttpParams() },
    );
  }
}
