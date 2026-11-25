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
import { AuthService } from '../../../../core/services/auth.service';
import {
  AsyncStateComponent,
  ConfirmModalComponent,
  DomainErrorAlertComponent,
  PaginationComponent,
  StatusBadgeComponent,
} from '../../../../shared/components';

type FiltroEstado = '' | 'activos' | 'inactivos';
import { UsuariosAdminService } from '../../services/usuarios-admin.service';

@Component({
  selector: 'app-usuarios-list-page',
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
  templateUrl: './usuarios-list-page.component.html',
})
export class UsuariosListPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosAdminService);
  private readonly authService = inject(AuthService);

  readonly limit = 10;
  readonly page = signal(1);
  readonly resultado = signal<ResultadoPaginado<UsuarioPublico> | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<ApiError | null>(null);

  readonly actionSuccess = signal<string | null>(null);
  readonly actionError = signal<ApiError | null>(null);
  readonly usuarioAConfirmar = signal<UsuarioPublico | null>(null);
  readonly isTogglingEstado = signal(false);
  readonly usuarioActualId = computed(() => this.authService.user()?.id ?? null);

  readonly filterForm = this.fb.nonNullable.group({
    busqueda: [''],
    rol: ['' as '' | RolUsuario],
    estado: ['' as FiltroEstado],
  });

  private readonly appliedFilters = signal({
    busqueda: '',
    rol: '' as '' | RolUsuario,
    estado: '' as FiltroEstado,
  });

  readonly hasActiveFilters = computed(() => {
    const f = this.appliedFilters();
    return Boolean(f.busqueda || f.rol || f.estado);
  });

  estaActivo(usuario: UsuarioPublico): boolean {
    return usuario.activo !== false;
  }

  solicitarCambioEstado(usuario: UsuarioPublico): void {
    this.actionError.set(null);
    this.actionSuccess.set(null);
    this.usuarioAConfirmar.set(usuario);
  }

  cancelarCambioEstado(): void {
    if (!this.isTogglingEstado()) {
      this.usuarioAConfirmar.set(null);
    }
  }

  confirmarCambioEstado(): void {
    const target = this.usuarioAConfirmar();
    if (!target) return;
    const nuevoEstado = !this.estaActivo(target);

    this.isTogglingEstado.set(true);
    this.usuariosService
      .cambiarEstado(target.id, nuevoEstado)
      .pipe(finalize(() => this.isTogglingEstado.set(false)))
      .subscribe({
        next: () => {
          this.usuarioAConfirmar.set(null);
          this.actionSuccess.set(
            nuevoEstado
              ? `La cuenta de ${target.nombre} fue reactivada.`
              : `La cuenta de ${target.nombre} fue desactivada: ya no podrá iniciar sesión.`,
          );
          this.cargarUsuarios();
        },
        error: (cause: unknown) => {
          this.usuarioAConfirmar.set(null);
          this.actionError.set(
            isApiError(cause)
              ? cause
              : {
                  statusCode: 500,
                  tipoError: 'UnexpectedError',
                  message: 'No fue posible cambiar el estado de la cuenta.',
                },
          );
        },
      });
  }

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
        estado: filters.estado || undefined,
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
      estado: raw.estado,
    });
    this.page.set(1);
    this.cargarUsuarios();
  }

  limpiarFiltros(): void {
    this.filterForm.reset({
      busqueda: '',
      rol: '',
      estado: '',
    });
    this.appliedFilters.set({
      busqueda: '',
      rol: '',
      estado: '',
    });
    this.page.set(1);
    this.cargarUsuarios();
  }

  onPageChange(targetPage: number): void {
    this.page.set(targetPage);
    this.cargarUsuarios();
  }
}
