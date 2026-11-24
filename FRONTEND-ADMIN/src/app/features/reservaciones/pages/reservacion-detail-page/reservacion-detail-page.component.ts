import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import {
  isApiError,
  type ApiError,
  type Espacio,
  type Pago,
  type Reservacion,
  type UsuarioPublico,
} from '../../../../core/models';
import {
  AsyncStateComponent,
  ConfirmModalComponent,
  DomainErrorAlertComponent,
  StatusBadgeComponent,
  type ConfirmModalVariant,
} from '../../../../shared/components';
import { EspaciosAdminService } from '../../../espacios/services/espacios-admin.service';
import { PagosAdminService } from '../../../pagos/services/pagos-admin.service';
import { UsuariosAdminService } from '../../../usuarios/services/usuarios-admin.service';
import { ReservacionesAdminService } from '../../services/reservaciones-admin.service';

type PendingAction =
  | 'confirmar'
  | 'completar'
  | 'cancelar'
  | 'cobrarEfectivo'
  | 'completarPago'
  | null;

interface ModalConfig {
  title: string;
  message: string;
  detail: string | null;
  confirmLabel: string;
  variant: ConfirmModalVariant;
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

@Component({
  selector: 'app-reservacion-detail-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AsyncStateComponent,
    ConfirmModalComponent,
    DomainErrorAlertComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './reservacion-detail-page.component.html',
})
export class ReservacionDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly reservacionesService = inject(ReservacionesAdminService);
  private readonly usuariosService = inject(UsuariosAdminService);
  private readonly espaciosService = inject(EspaciosAdminService);
  private readonly pagosService = inject(PagosAdminService);

  readonly reservacionId = signal('');
  readonly reservacion = signal<Reservacion | null>(null);
  readonly usuario = signal<UsuarioPublico | null>(null);
  readonly espacio = signal<Espacio | null>(null);
  readonly pago = signal<Pago | null>(null);

  readonly isLoading = signal(true);
  readonly loadError = signal<ApiError | null>(null);

  readonly pendingAction = signal<PendingAction>(null);
  readonly isProcessingAction = signal(false);
  readonly actionError = signal<ApiError | null>(null);
  readonly actionSuccess = signal<string | null>(null);

  readonly referenciaControl = new FormControl('', { nonNullable: true });

  readonly modalConfig = computed<ModalConfig | null>(() => {
    const action = this.pendingAction();
    const res = this.reservacion();
    if (!action || !res) return null;

    switch (action) {
      case 'confirmar':
        return {
          title: 'Confirmar reservación',
          message: `¿Confirmar manualmente la reservación del ${this.formatDate(res.fecha)} (${res.horaInicio}–${res.horaFin})?`,
          detail: 'La reservación pasará de Pendiente a Confirmada.',
          confirmLabel: 'Confirmar',
          variant: 'primary',
        };
      case 'completar':
        return {
          title: 'Marcar reservación como completada',
          message: `¿Marcar como completada la reservación del ${this.formatDate(res.fecha)}?`,
          detail: 'Úsalo cuando el cliente ya haya concluido su estancia en el espacio.',
          confirmLabel: 'Marcar completada',
          variant: 'primary',
        };
      case 'cancelar':
        return {
          title: 'Cancelar reservación',
          message: `¿Seguro que deseas cancelar esta reservación por ${this.formatCurrency(res.subtotal)}?`,
          detail: 'El horario volverá a quedar libre para otros clientes.',
          confirmLabel: 'Sí, cancelar',
          variant: 'danger',
        };
      case 'cobrarEfectivo': {
        const ref = this.referenciaControl.value.trim();
        return {
          title: 'Registrar cobro en efectivo',
          message: `¿Confirmar cobro en efectivo por ${this.formatCurrency(res.subtotal)}?`,
          detail: ref
            ? `Referencia: ${ref}. El pago se registrará COMPLETADO y la reservación pasará automáticamente a CONFIRMADA.`
            : 'El pago se registrará COMPLETADO y la reservación pasará automáticamente a CONFIRMADA.',
          confirmLabel: 'Registrar cobro',
          variant: 'primary',
        };
      }
      case 'completarPago':
        return {
          title: 'Completar pago pendiente',
          message: `¿Confirmar recepción del pago pendiente por ${this.formatCurrency(res.subtotal)}?`,
          detail:
            'El pago pasará a COMPLETADO y la reservación asociada se confirmará.',
          confirmLabel: 'Completar pago',
          variant: 'primary',
        };
    }
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.reservacionId.set(id);
    this.cargarDetalle();
  }

  cargarDetalle(): void {
    const id = this.reservacionId();
    if (!id) {
      this.loadError.set({
        statusCode: 400,
        tipoError: 'BadRequestException',
        message: 'No se especificó el identificador de la reservación.',
      });
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(null);

    this.reservacionesService
      .obtenerPorId(id)
      .pipe(
        switchMap((res) =>
          forkJoin({
            reservacion: of(res),
            usuario: this.usuariosService
              .obtenerPorId(res.usuarioId)
              .pipe(catchError(() => of(null))),
            espacio: this.espaciosService
              .obtenerEspacio(res.espacioId)
              .pipe(catchError(() => of(null))),
            pago: res.pagoId
              ? this.pagosService
                  .obtenerPorId(res.pagoId)
                  .pipe(catchError(() => of(null)))
              : of(null),
          }),
        ),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: ({ reservacion, usuario, espacio, pago }) => {
          this.reservacion.set(reservacion);
          this.usuario.set(usuario);
          this.espacio.set(espacio);
          this.pago.set(pago);
        },
        error: (cause: unknown) => {
          this.loadError.set(
            isApiError(cause)
              ? cause
              : {
                  statusCode: 500,
                  tipoError: 'UnexpectedError',
                  message: 'No pudimos cargar el detalle de la reservación.',
                },
          );
        },
      });
  }

  solicitarAccion(action: Exclude<PendingAction, null>): void {
    this.actionError.set(null);
    this.actionSuccess.set(null);
    this.pendingAction.set(action);
  }

  cerrarModal(): void {
    if (!this.isProcessingAction()) {
      this.pendingAction.set(null);
    }
  }

  confirmarAccion(): void {
    const action = this.pendingAction();
    const res = this.reservacion();
    if (!action || !res || this.isProcessingAction()) {
      return;
    }

    this.isProcessingAction.set(true);
    this.actionError.set(null);
    this.actionSuccess.set(null);

    if (action === 'confirmar') {
      this.reservacionesService
        .confirmar(res.id)
        .pipe(finalize(() => this.isProcessingAction.set(false)))
        .subscribe({
          next: () => {
            this.pendingAction.set(null);
            this.actionSuccess.set('La reservación fue confirmada.');
            this.cargarDetalle();
          },
          error: (cause: unknown) => this.handleActionError(cause, 'confirmar'),
        });
      return;
    }

    if (action === 'completar') {
      this.reservacionesService
        .completar(res.id)
        .pipe(finalize(() => this.isProcessingAction.set(false)))
        .subscribe({
          next: () => {
            this.pendingAction.set(null);
            this.actionSuccess.set(
              'La reservación fue marcada como completada.',
            );
            this.cargarDetalle();
          },
          error: (cause: unknown) => this.handleActionError(cause, 'completar'),
        });
      return;
    }

    if (action === 'cancelar') {
      this.reservacionesService
        .cancelar(res.id)
        .pipe(finalize(() => this.isProcessingAction.set(false)))
        .subscribe({
          next: () => {
            this.pendingAction.set(null);
            this.actionSuccess.set('La reservación fue cancelada.');
            this.cargarDetalle();
          },
          error: (cause: unknown) => this.handleActionError(cause, 'cancelar'),
        });
      return;
    }

    if (action === 'cobrarEfectivo') {
      const ref = this.referenciaControl.value.trim();
      this.pagosService
        .registrarPago({
          reservacionIds: [res.id],
          metodo: 'EFECTIVO',
          ...(ref ? { referencia: ref } : {}),
        })
        .pipe(finalize(() => this.isProcessingAction.set(false)))
        .subscribe({
          next: () => {
            this.pendingAction.set(null);
            this.referenciaControl.setValue('');
            this.actionSuccess.set(
              'Cobro en efectivo registrado y reservación confirmada automáticamente.',
            );
            this.cargarDetalle();
          },
          error: (cause: unknown) =>
            this.handleActionError(cause, 'registrar el cobro'),
        });
      return;
    }

    const currentPago = this.pago();
    if (action === 'completarPago' && currentPago) {
      this.pagosService
        .completarPago(currentPago.id)
        .pipe(finalize(() => this.isProcessingAction.set(false)))
        .subscribe({
          next: () => {
            this.pendingAction.set(null);
            this.actionSuccess.set(
              'Pago completado y reservación confirmada.',
            );
            this.cargarDetalle();
          },
          error: (cause: unknown) =>
            this.handleActionError(cause, 'completar el pago'),
        });
    } else {
      this.isProcessingAction.set(false);
      this.pendingAction.set(null);
    }
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

  private handleActionError(cause: unknown, actionLabel: string): void {
    this.pendingAction.set(null);
    this.actionError.set(
      isApiError(cause)
        ? cause
        : {
            statusCode: 500,
            tipoError: 'UnexpectedError',
            message: `No fue posible ${actionLabel} la reservación.`,
          },
    );
  }
}
