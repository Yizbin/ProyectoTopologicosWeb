import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  isApiError,
  type ApiError,
  type EspacioBuscado,
  type ResultadoPaginado,
  type Sede,
  type TipoEspacio,
} from '../../../../core/models';
import {
  AsyncStateComponent,
  ConfirmModalComponent,
  DomainErrorAlertComponent,
  PaginationComponent,
  StatusBadgeComponent,
} from '../../../../shared/components';
import { EspaciosAdminService } from '../../services/espacios-admin.service';

@Component({
  selector: 'app-espacios-list-page',
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
  templateUrl: './espacios-list-page.component.html',
})
export class EspaciosListPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly espaciosService = inject(EspaciosAdminService);

  readonly limit = 8;
  readonly page = signal(1);
  readonly sedes = signal<Sede[]>([]);
  readonly sedesMap = computed<Record<string, string>>(() => {
    const lookup: Record<string, string> = {};
    for (const sede of this.sedes()) {
      lookup[sede.id] = sede.nombre;
    }
    return lookup;
  });

  readonly resultado = signal<ResultadoPaginado<EspacioBuscado> | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<ApiError | null>(null);

  readonly actionError = signal<ApiError | null>(null);
  readonly actionSuccess = signal<string | null>(null);

  readonly espacioAConfirmar = signal<EspacioBuscado | null>(null);
  readonly isTogglingEstado = signal(false);

  readonly filterForm = this.fb.nonNullable.group({
    busqueda: [''],
    tipo: ['' as '' | TipoEspacio],
    estadoActivo: ['todos' as 'todos' | 'activos' | 'inactivos'],
    sedeId: [''],
  });

  readonly hasActiveFilters = computed(() => {
    const applied = this.appliedFilters();
    return Boolean(
      applied.busqueda ||
      applied.tipo ||
      applied.sedeId ||
      applied.estadoActivo !== 'todos',
    );
  });

  private readonly appliedFilters = signal({
    busqueda: '',
    tipo: '' as '' | TipoEspacio,
    estadoActivo: 'todos' as 'todos' | 'activos' | 'inactivos',
    sedeId: '',
  });

  ngOnInit(): void {
    this.cargarSedes();
    this.cargarEspacios();
  }

  cargarSedes(): void {
    this.espaciosService.listarSedes().subscribe({
      next: (lista) => this.sedes.set(lista),
      error: () => {

      },
    });
  }

  cargarEspacios(): void {
    this.isLoading.set(true);
    this.error.set(null);
    const filters = this.appliedFilters();

    this.espaciosService
      .listarEspacios({
        busqueda: filters.busqueda || undefined,
        tipo: filters.tipo || undefined,
        sedeId: filters.sedeId || undefined,
        estadoActivo: filters.estadoActivo,
        page: this.page(),
        limit: this.limit,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.resultado.set(data);
        },
        error: (cause: unknown) => {
          this.error.set(
            isApiError(cause)
              ? cause
              : {
                statusCode: 500,
                tipoError: 'UnexpectedError',
                message: 'No pudimos cargar el listado de espacios.',
              },
          );
        },
      });
  }

  aplicarFiltros(): void {
    const raw = this.filterForm.getRawValue();
    this.appliedFilters.set({
      busqueda: raw.busqueda.trim(),
      tipo: raw.tipo,
      estadoActivo: raw.estadoActivo,
      sedeId: raw.sedeId,
    });
    this.page.set(1);
    this.cargarEspacios();
  }

  limpiarFiltros(): void {
    this.filterForm.reset({
      busqueda: '',
      tipo: '',
      estadoActivo: 'todos',
      sedeId: '',
    });
    this.appliedFilters.set({
      busqueda: '',
      tipo: '',
      estadoActivo: 'todos',
      sedeId: '',
    });
    this.page.set(1);
    this.cargarEspacios();
  }

  onPageChange(targetPage: number): void {
    this.page.set(targetPage);
    this.cargarEspacios();
  }

  solicitarCambioEstado(espacio: EspacioBuscado): void {
    this.actionError.set(null);
    this.actionSuccess.set(null);
    this.espacioAConfirmar.set(espacio);
  }

  cancelarCambioEstado(): void {
    if (!this.isTogglingEstado()) {
      this.espacioAConfirmar.set(null);
    }
  }

  confirmarCambioEstado(): void {
    const objetivo = this.espacioAConfirmar();
    if (!objetivo || this.isTogglingEstado()) {
      return;
    }

    const nuevoEstado = !objetivo.activo;
    this.isTogglingEstado.set(true);
    this.actionError.set(null);

    this.espaciosService
      .actualizarEspacio(objetivo.id, { activo: nuevoEstado })
      .pipe(finalize(() => this.isTogglingEstado.set(false)))
      .subscribe({
        next: () => {
          this.espacioAConfirmar.set(null);
          this.actionSuccess.set(
            nuevoEstado
              ? `El espacio "${objetivo.nombre}" fue reactivado correctamente.`
              : `El espacio "${objetivo.nombre}" fue desactivado correctamente.`,
          );
          this.cargarEspacios();
        },
        error: (cause: unknown) => {
          this.espacioAConfirmar.set(null);
          this.actionError.set(
            isApiError(cause)
              ? cause
              : {
                statusCode: 500,
                tipoError: 'UnexpectedError',
                message: 'No fue posible actualizar el estado del espacio.',
              },
          );
        },
      });
  }

  getSedeNombre(sedeId: string): string {
    return this.sedesMap()[sedeId] ?? sedeId;
  }
}
