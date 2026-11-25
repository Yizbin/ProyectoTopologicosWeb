import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import {
  isApiError,
  type ApiError,
  type EspacioBuscado,
  type Reservacion,
  type UsuarioPublico,
} from '../../../../core/models';
import { AuthService } from '../../../../core/services/auth.service';
import {
  AsyncStateComponent,
  ConfirmModalComponent,
  DomainErrorAlertComponent,
  StatusBadgeComponent,
} from '../../../../shared/components';
import { EspaciosAdminService } from '../../../espacios/services/espacios-admin.service';
import { ReservacionesAdminService } from '../../../reservaciones/services/reservaciones-admin.service';
import { UsuariosAdminService } from '../../services/usuarios-admin.service';

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

function toIsoDateKey(value: string | Date): string {
  return typeof value === 'string'
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-usuario-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    AsyncStateComponent,
    ConfirmModalComponent,
    DomainErrorAlertComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './usuario-detail-page.component.html',
})
export class UsuarioDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly usuariosService = inject(UsuariosAdminService);
  private readonly reservacionesService = inject(ReservacionesAdminService);
  private readonly espaciosService = inject(EspaciosAdminService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuarioId = signal('');
  readonly usuario = signal<UsuarioPublico | null>(null);
  readonly reservaciones = signal<Reservacion[]>([]);
  readonly espacios = signal<EspacioBuscado[]>([]);

  readonly isLoading = signal(true);
  readonly loadError = signal<ApiError | null>(null);

  readonly aviso = signal<string | null>(null);
  readonly actionError = signal<ApiError | null>(null);
  readonly confirmandoEstado = signal(false);
  readonly isTogglingEstado = signal(false);

  readonly estaActivo = computed(() => this.usuario()?.activo !== false);
  readonly esCuentaPropia = computed(
    () => this.authService.user()?.id === this.usuarioId(),
  );

  readonly espaciosMap = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const esp of this.espacios()) {
      map[esp.id] = esp.nombre;
    }
    return map;
  });

  readonly historialOrdenado = computed<Reservacion[]>(() => {
    return [...this.reservaciones()].sort((a, b) => {
      const cmpFecha = toIsoDateKey(b.fecha).localeCompare(
        toIsoDateKey(a.fecha),
      );
      if (cmpFecha !== 0) return cmpFecha;
      return b.horaInicio.localeCompare(a.horaInicio);
    });
  });

  readonly metricas = computed(() => {
    const lista = this.reservaciones();
    let pendientes = 0;
    let confirmadasOCompletadas = 0;
    let canceladas = 0;
    let montoAcumulado = 0;

    for (const r of lista) {
      if (r.estado === 'pendiente') {
        pendientes++;
        montoAcumulado += r.subtotal;
      } else if (r.estado === 'confirmada' || r.estado === 'completada') {
        confirmadasOCompletadas++;
        montoAcumulado += r.subtotal;
      } else if (r.estado === 'cancelada') {
        canceladas++;
      }
    }

    return {
      total: lista.length,
      pendientes,
      confirmadasOCompletadas,
      canceladas,
      montoAcumulado,
    };
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.usuarioId.set(id);
    const aviso: unknown =
      this.router.currentNavigation()?.extras.state?.['aviso'] ??
      (typeof history !== 'undefined' ? history.state?.aviso : undefined);
    if (typeof aviso === 'string') {
      this.aviso.set(aviso);
    }
    this.cargarPerfilYHistorial();
  }

  solicitarCambioEstado(): void {
    this.actionError.set(null);
    this.confirmandoEstado.set(true);
  }

  cancelarCambioEstado(): void {
    if (!this.isTogglingEstado()) {
      this.confirmandoEstado.set(false);
    }
  }

  confirmarCambioEstado(): void {
    const actual = this.usuario();
    if (!actual) return;
    const nuevoEstado = !this.estaActivo();

    this.isTogglingEstado.set(true);
    this.usuariosService
      .cambiarEstado(actual.id, nuevoEstado)
      .pipe(finalize(() => this.isTogglingEstado.set(false)))
      .subscribe({
        next: (actualizado) => {
          this.usuario.set({ ...actual, ...actualizado });
          this.confirmandoEstado.set(false);
          this.aviso.set(
            nuevoEstado
              ? 'La cuenta fue reactivada: el usuario ya puede iniciar sesión.'
              : 'La cuenta fue desactivada: el usuario ya no puede iniciar sesión.',
          );
        },
        error: (cause: unknown) => {
          this.confirmandoEstado.set(false);
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

  cargarPerfilYHistorial(): void {
    const id = this.usuarioId();
    if (!id) {
      this.loadError.set({
        statusCode: 400,
        tipoError: 'BadRequestException',
        message: 'No se especificó el identificador del usuario.',
      });
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(null);

    forkJoin({
      usuario: this.usuariosService.obtenerPorId(id),
      reservaciones: this.reservacionesService.listarPorCliente(id),
      espacios: this.espaciosService
        .listarTodosEspacios('todos')
        .pipe(catchError(() => of([] as EspacioBuscado[]))),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ usuario, reservaciones, espacios }) => {
          this.usuario.set(usuario);
          this.reservaciones.set(reservaciones);
          this.espacios.set(espacios);
        },
        error: (cause: unknown) => {
          this.loadError.set(
            isApiError(cause)
              ? cause
              : {
                  statusCode: 500,
                  tipoError: 'UnexpectedError',
                  message:
                    'No pudimos cargar el perfil y el historial del usuario.',
                },
          );
        },
      });
  }

  getEspacioNombre(espacioId: string): string {
    return this.espaciosMap()[espacioId] ?? espacioId;
  }

  formatCurrency(amount: number): string {
    return CURRENCY_FORMATTER.format(amount);
  }

  formatDate(value: string | Date): string {
    const iso = toIsoDateKey(value);
    const [year, month, day] = iso.split('-').map(Number);
    if (!year || !month || !day) return iso;
    return DATE_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)));
  }
}
