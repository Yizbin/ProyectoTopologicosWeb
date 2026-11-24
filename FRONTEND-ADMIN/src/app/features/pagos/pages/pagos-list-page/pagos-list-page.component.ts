import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  isApiError,
  type ApiError,
  type EstadoPago,
  type MetodoPago,
  type PagoDetallado,
  type ResultadoPaginado,
} from '../../../../core/models';
import {
  AsyncStateComponent,
  ConfirmModalComponent,
  DomainErrorAlertComponent,
  PaginationComponent,
  StatusBadgeComponent,
} from '../../../../shared/components';
import { PagosAdminService } from '../../services/pagos-admin.service';

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

@Component({
  selector: 'app-pagos-list-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AsyncStateComponent,
    ConfirmModalComponent,
    DomainErrorAlertComponent,
    PaginationComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './pagos-list-page.component.html',
})
export class PagosListPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pagosService = inject(PagosAdminService);

  readonly limit = 10;
  readonly page = signal(1);
  readonly resultado = signal<ResultadoPaginado<PagoDetallado> | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<ApiError | null>(null);

  readonly pagoACompletar = signal<PagoDetallado | null>(null);
  readonly isCompleting = signal(false);
  readonly actionError = signal<ApiError | null>(null);
  readonly actionSuccess = signal<string | null>(null);

  readonly filterForm = this.fb.nonNullable.group({
    busqueda: [''],
    estado: ['' as '' | EstadoPago],
    metodo: ['' as '' | MetodoPago],
  });

  private readonly appliedFilters = signal({
    busqueda: '',
    estado: '' as '' | EstadoPago,
    metodo: '' as '' | MetodoPago,
  });

  readonly hasActiveFilters = computed(() => {
    const f = this.appliedFilters();
    return Boolean(f.busqueda || f.estado || f.metodo);
  });

  ngOnInit(): void {
    this.cargarPagos();
  }

  cargarPagos(): void {
    this.isLoading.set(true);
    this.error.set(null);
    const filters = this.appliedFilters();

    this.pagosService
      .listar({
        busqueda: filters.busqueda || undefined,
        estado: filters.estado || undefined,
        metodo: filters.metodo || undefined,
        page: this.page(),
        limit: this.limit,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.resultado.set(data),
        error: (cause: unknown) => {
          this.error.set(
            isApiError(cause)
              ? cause
              : {
                  statusCode: 500,
                  tipoError: 'UnexpectedError',
                  message: 'No pudimos cargar el listado de pagos.',
                },
          );
        },
      });
  }

  aplicarFiltros(): void {
    const raw = this.filterForm.getRawValue();
    this.appliedFilters.set({
      busqueda: raw.busqueda.trim(),
      estado: raw.estado,
      metodo: raw.metodo,
    });
    this.page.set(1);
    this.cargarPagos();
  }

  limpiarFiltros(): void {
    this.filterForm.reset({
      busqueda: '',
      estado: '',
      metodo: '',
    });
    this.appliedFilters.set({
      busqueda: '',
      estado: '',
      metodo: '',
    });
    this.page.set(1);
    this.cargarPagos();
  }

  onPageChange(targetPage: number): void {
    this.page.set(targetPage);
    this.cargarPagos();
  }

  solicitarCompletarPago(pago: PagoDetallado): void {
    this.actionError.set(null);
    this.actionSuccess.set(null);
    this.pagoACompletar.set(pago);
  }

  cerrarModal(): void {
    if (!this.isCompleting()) {
      this.pagoACompletar.set(null);
    }
  }

  confirmarCompletarPago(): void {
    const objetivo = this.pagoACompletar();
    if (!objetivo || this.isCompleting()) {
      return;
    }

    this.isCompleting.set(true);
    this.actionError.set(null);

    this.pagosService
      .completarPago(objetivo.id)
      .pipe(finalize(() => this.isCompleting.set(false)))
      .subscribe({
        next: () => {
          this.pagoACompletar.set(null);
          this.actionSuccess.set(
            `Pago ${objetivo.id.slice(0, 8)} marcado como COMPLETADO y reservación confirmada.`,
          );
          this.cargarPagos();
        },
        error: (cause: unknown) => {
          this.pagoACompletar.set(null);
          this.actionError.set(
            isApiError(cause)
              ? cause
              : {
                  statusCode: 500,
                  tipoError: 'UnexpectedError',
                  message: 'No fue posible completar el pago.',
                },
          );
        },
      });
  }

  formatCurrency(amount: number): string {
    return CURRENCY_FORMATTER.format(amount);
  }

  formatDate(value: string | Date): string {
    const iso =
      typeof value === 'string'
        ? value.slice(0, 10)
        : value.toISOString().slice(0, 10);
    const [year, month, day] = iso.split('-').map(Number);
    if (!year || !month || !day) return iso;
    return DATE_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)));
  }
}
