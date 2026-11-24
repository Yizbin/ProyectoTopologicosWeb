import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { DashboardResumen } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  obtenerResumen(): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(
      `${this.apiBaseUrl}/dashboard/resumen`,
    );
  }
}
