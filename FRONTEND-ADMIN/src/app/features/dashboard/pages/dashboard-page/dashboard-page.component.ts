import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { OnDestroy } from '@angular/core';
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
  imports: [RouterLink, ReactiveFormsModule, AsyncStateComponent, StatusBadgeComponent],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly fb = inject(FormBuilder);
  private request?: Subscription;
  private readonly hoy = new Date();
  private fechaLocal(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  private fechaInicioInicial(): string {
    const inicioMes = new Date(this.hoy.getFullYear(), this.hoy.getMonth(), 1);
    const hace7Dias = new Date(this.hoy.getFullYear(), this.hoy.getMonth(), this.hoy.getDate() - 7);
    return this.fechaLocal(hace7Dias < inicioMes ? hace7Dias : inicioMes);
  }
  private fechaFinInicial(): string {
    return this.fechaLocal(new Date(this.hoy.getFullYear(), this.hoy.getMonth(), this.hoy.getDate() + 14));
  }
  readonly periodoForm = this.fb.nonNullable.group({
    fechaInicio: [this.fechaInicioInicial(), Validators.required],
    fechaFin: [this.fechaFinInicial(), Validators.required],
  });
  readonly periodoError = signal<string | null>(null);

  ngOnDestroy(): void { this.request?.unsubscribe(); }

  readonly resumen = signal<DashboardResumen | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<ApiError | null>(null);

  ngOnInit(): void {
    this.cargarResumen();
  }

  cargarResumen(): void {
    const periodo = this.periodoForm.getRawValue();
    const dias = (Date.parse(periodo.fechaFin) - Date.parse(periodo.fechaInicio)) / 86400000;
    if (this.periodoForm.invalid || !Number.isFinite(dias) || dias < 0 || dias > 365) {
      this.periodoForm.markAllAsTouched();
      this.periodoError.set('Indica un período válido de hasta 366 días, con fin posterior o igual al inicio.');
      return;
    }
    this.periodoError.set(null);
    this.request?.unsubscribe();
    this.isLoading.set(true);
    this.error.set(null);

    this.request = this.dashboardService
      .obtenerResumen(periodo)
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

  formatHours(minutes: number): string {
    return Number((minutes / 60).toFixed(2)).toString();
  }

  formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) {
      return isoDate;
    }
    return DATE_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)));
  }
}
