import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  isApiError,
  type ApiError,
  type EspacioBuscado,
  type EstadoReservacion,
  type ReservacionDetallada,
  type ResultadoPaginado,
} from '../../../../core/models';
import {
  AsyncStateComponent,
  PaginationComponent,
  StatusBadgeComponent,
} from '../../../../shared/components';
import { EspaciosAdminService } from '../../../espacios/services/espacios-admin.service';
import { ReservacionesAdminService } from '../../services/reservaciones-admin.service';

type AgendaPreset = 'todas' | 'hoy' | 'proximos7' | null;

const ESTADOS_RESERVACION_VALIDOS = new Set<EstadoReservacion>([
  'pendiente',
  'confirmada',
  'completada',
  'cancelada',
]);

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

function getLocalIsoDate(offsetDays = 0): string {
  const now = new Date();
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + offsetDays,
  );
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-reservaciones-list-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AsyncStateComponent,
    PaginationComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './reservaciones-list-page.component.html',
})
export class ReservacionesListPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly reservacionesService = inject(ReservacionesAdminService);
  private readonly espaciosService = inject(EspaciosAdminService);

  readonly limit = 10;
  readonly page = signal(1);
  readonly activePreset = signal<AgendaPreset>('todas');

  readonly espacios = signal<EspacioBuscado[]>([]);
  readonly resultado = signal<ResultadoPaginado<ReservacionDetallada> | null>(
    null,
  );
  readonly isLoading = signal(true);
  readonly error = signal<ApiError | null>(null);
  readonly dateRangeError = signal<string | null>(null);

  readonly filterForm = this.fb.nonNullable.group({
    busqueda: [''],
    estado: ['' as '' | EstadoReservacion],
    espacioId: [''],
    fechaInicio: [''],
    fechaFin: [''],
  });

  private readonly appliedFilters = signal({
    busqueda: '',
    estado: '' as '' | EstadoReservacion,
    espacioId: '',
    fechaInicio: '',
    fechaFin: '',
  });

  readonly hasActiveFilters = computed(() => {
    const f = this.appliedFilters();
    return Boolean(
      f.busqueda || f.estado || f.espacioId || f.fechaInicio || f.fechaFin,
    );
  });

  ngOnInit(): void {
    const estadoParam = this.route.snapshot.queryParamMap.get('estado');
    if (
      estadoParam &&
      ESTADOS_RESERVACION_VALIDOS.has(estadoParam as EstadoReservacion)
    ) {
      const estadoInicial = estadoParam as EstadoReservacion;
      this.filterForm.controls.estado.setValue(estadoInicial);
      this.appliedFilters.update((prev) => ({
        ...prev,
        estado: estadoInicial,
      }));
    }
    this.cargarEspacios();
    this.cargarReservaciones();
  }

  cargarEspacios(): void {
    this.espaciosService.listarTodosEspacios('todos').subscribe({
      next: (lista) => this.espacios.set(lista),
      error: () => {

      },
    });
  }

  cargarReservaciones(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const filters = this.appliedFilters();
    this.reservacionesService
      .listar({
        busqueda: filters.busqueda || undefined,
        estado: filters.estado || undefined,
        espacioId: filters.espacioId || undefined,
        fechaInicio: filters.fechaInicio || undefined,
        fechaFin: filters.fechaFin || undefined,
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
                message: 'No pudimos cargar la agenda de reservaciones.',
              },
          );
        },
      });
  }

  aplicarPreset(preset: 'todas' | 'hoy' | 'proximos7'): void {
    this.dateRangeError.set(null);
    this.activePreset.set(preset);

    let fechaInicio = '';
    let fechaFin = '';
    if (preset === 'hoy') {
      const hoy = getLocalIsoDate(0);
      fechaInicio = hoy;
      fechaFin = hoy;
    } else if (preset === 'proximos7') {
      fechaInicio = getLocalIsoDate(0);
      fechaFin = getLocalIsoDate(6);
    }

    this.filterForm.patchValue({ fechaInicio, fechaFin });
    const raw = this.filterForm.getRawValue();
    this.appliedFilters.set({
      busqueda: raw.busqueda.trim(),
      estado: raw.estado,
      espacioId: raw.espacioId,
      fechaInicio,
      fechaFin,
    });
    this.page.set(1);
    this.cargarReservaciones();
  }

  aplicarFiltros(): void {
    this.dateRangeError.set(null);
    const raw = this.filterForm.getRawValue();

    let fechaInicio = raw.fechaInicio.trim();
    let fechaFin = raw.fechaFin.trim();
    if (fechaInicio && !fechaFin) {
      fechaFin = fechaInicio;
      this.filterForm.controls.fechaFin.setValue(fechaFin);
    } else if (!fechaInicio && fechaFin) {
      fechaInicio = fechaFin;
      this.filterForm.controls.fechaInicio.setValue(fechaInicio);
    }

    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      this.dateRangeError.set(
        'La fecha final no puede ser anterior a la fecha inicial.',
      );
      return;
    }

    this.activePreset.set(!fechaInicio && !fechaFin ? 'todas' : null);
    this.appliedFilters.set({
      busqueda: raw.busqueda.trim(),
      estado: raw.estado,
      espacioId: raw.espacioId,
      fechaInicio,
      fechaFin,
    });
    this.page.set(1);
    this.cargarReservaciones();
  }

  limpiarFiltros(): void {
    this.dateRangeError.set(null);
    this.activePreset.set('todas');
    this.filterForm.reset({
      busqueda: '',
      estado: '',
      espacioId: '',
      fechaInicio: '',
      fechaFin: '',
    });
    this.appliedFilters.set({
      busqueda: '',
      estado: '',
      espacioId: '',
      fechaInicio: '',
      fechaFin: '',
    });
    this.page.set(1);
    this.cargarReservaciones();
  }

  onPageChange(targetPage: number): void {
    this.page.set(targetPage);
    this.cargarReservaciones();
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
