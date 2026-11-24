import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  isApiError,
  type ApiError,
  type ResultadoPaginado,
  type RolUsuario,
  type UsuarioPublico,
} from '../../../../core/models';
import {
  AsyncStateComponent,
  PaginationComponent,
  StatusBadgeComponent,
} from '../../../../shared/components';
import { UsuariosAdminService } from '../../services/usuarios-admin.service';

@Component({
  selector: 'app-usuarios-list-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AsyncStateComponent,
    PaginationComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './usuarios-list-page.component.html',
})
export class UsuariosListPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosAdminService);

  readonly limit = 10;
  readonly page = signal(1);
  readonly resultado = signal<ResultadoPaginado<UsuarioPublico> | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<ApiError | null>(null);

  readonly filterForm = this.fb.nonNullable.group({
    busqueda: [''],
    rol: ['' as '' | RolUsuario],
  });

  private readonly appliedFilters = signal({
    busqueda: '',
    rol: '' as '' | RolUsuario,
  });

  readonly hasActiveFilters = computed(() => {
    const f = this.appliedFilters();
    return Boolean(f.busqueda || f.rol);
  });

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.isLoading.set(true);
    this.error.set(null);
    const filters = this.appliedFilters();

    this.usuariosService
      .listar({
        busqueda: filters.busqueda || undefined,
        rol: filters.rol || undefined,
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
                  message: 'No pudimos cargar el directorio de usuarios.',
                },
          );
        },
      });
  }

  aplicarFiltros(): void {
    const raw = this.filterForm.getRawValue();
    this.appliedFilters.set({
      busqueda: raw.busqueda.trim(),
      rol: raw.rol,
    });
    this.page.set(1);
    this.cargarUsuarios();
  }

  limpiarFiltros(): void {
    this.filterForm.reset({
      busqueda: '',
      rol: '',
    });
    this.appliedFilters.set({
      busqueda: '',
      rol: '',
    });
    this.page.set(1);
    this.cargarUsuarios();
  }

  onPageChange(targetPage: number): void {
    this.page.set(targetPage);
    this.cargarUsuarios();
  }
}
