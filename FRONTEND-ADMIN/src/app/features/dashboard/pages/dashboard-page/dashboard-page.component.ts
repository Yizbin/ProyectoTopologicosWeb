import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { isApiError, type ApiError, type DashboardResumen } from '../../../../core/models';
import {
  AsyncStateComponent,
  StatusBadgeComponent,
} from '../../../../shared/components';
import { DashboardService } from '../../services/dashboard.service';

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink, AsyncStateComponent, StatusBadgeComponent],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly resumen = signal<DashboardResumen | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<ApiError | null>(null);

  ngOnInit(): void {
    this.cargarResumen();
  }

  cargarResumen(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.dashboardService
      .obtenerResumen()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.resumen.set(data);
        },
        error: (cause: unknown) => {
          this.error.set(
            isApiError(cause)
              ? cause
              : {
                  statusCode: 500,
                  tipoError: 'UnexpectedError',
                  message: 'No pudimos cargar las métricas del tablero.',
                },
          );
        },
      });
  }

  formatCurrency(amount: number): string {
    return CURRENCY_FORMATTER.format(amount);
  }

  formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) {
      return isoDate;
    }
    return DATE_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)));
  }
}
