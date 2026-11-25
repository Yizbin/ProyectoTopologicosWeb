import {
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import type { HasUnsavedChanges } from '../../../../core/guards/unsaved-changes.guard';
import {
  isApiError,
  type ApiError,
  type EspacioBuscado,
  type UsuarioPublico,
} from '../../../../core/models';
import {
  AsyncStateComponent,
  DomainErrorAlertComponent,
  FieldErrorComponent,
} from '../../../../shared/components';
import { EspaciosAdminService } from '../../../espacios/services/espacios-admin.service';
import { UsuariosAdminService } from '../../../usuarios/services/usuarios-admin.service';
import { ReservacionesAdminService } from '../../services/reservaciones-admin.service';

const HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

function horaAMinutos(hhmm: string): number {
  const [horas, minutos] = hhmm.split(':').map(Number);
  return horas * 60 + minutos;
}

function setControlError(
  ctrl: AbstractControl,
  key: string,
  active: boolean,
): void {
  const current = ctrl.errors ?? {};
  if (active) {
    if (!current[key]) {
      ctrl.setErrors({ ...current, [key]: true });
    }
    return;
  }
  if (current[key]) {
    const { [key]: _removed, ...rest } = current;
    ctrl.setErrors(Object.keys(rest).length > 0 ? rest : null);
  }
}

function validarHorarioReservacion(
  group: AbstractControl,
): ValidationErrors | null {
  const inicioCtrl = group.get('horaInicio');
  const finCtrl = group.get('horaFin');
  if (!inicioCtrl || !finCtrl) {
    return null;
  }

  const inicio = String(inicioCtrl.value ?? '').trim();
  const fin = String(finCtrl.value ?? '').trim();
  const formatoValido =
    HH_MM_PATTERN.test(inicio) && HH_MM_PATTERN.test(fin);

  const invalido = formatoValido && horaAMinutos(fin) <= horaAMinutos(inicio);
  setControlError(finCtrl, 'horaFinInvalida', invalido);

  return invalido ? { horarioInvalido: true } : null;
}

@Component({
  selector: 'app-reservacion-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AsyncStateComponent,
    DomainErrorAlertComponent,
    FieldErrorComponent,
  ],
  templateUrl: './reservacion-form-page.component.html',
})
export class ReservacionFormPageComponent
  implements OnInit, HasUnsavedChanges
{
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reservacionesService = inject(ReservacionesAdminService);
  private readonly usuariosService = inject(UsuariosAdminService);
  private readonly espaciosService = inject(EspaciosAdminService);

  readonly usuarios = signal<UsuarioPublico[]>([]);
  readonly espacios = signal<EspacioBuscado[]>([]);

  readonly isLoading = signal(true);
  readonly loadError = signal<ApiError | null>(null);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<ApiError | null>(null);
  private readonly savedSuccessfully = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      usuarioId: ['', [Validators.required]],
      espacioId: ['', [Validators.required]],
      fecha: ['', [Validators.required]],
      horaInicio: [
        '10:00',
        [Validators.required, Validators.pattern(HH_MM_PATTERN)],
      ],
      horaFin: [
        '12:00',
        [Validators.required, Validators.pattern(HH_MM_PATTERN)],
      ],
      cantidadPersonas: [
        1,
        [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
      ],
    },
    { validators: validarHorarioReservacion },
  );

  private readonly formSnapshot = signal(this.form.getRawValue());

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.formSnapshot.set(this.form.getRawValue());
    });
  }

  readonly selectedEspacio = computed<EspacioBuscado | null>(() => {
    const id = this.formSnapshot().espacioId;
    return this.espacios().find((e) => e.id === id) ?? null;
  });

  readonly selectedUsuario = computed<UsuarioPublico | null>(() => {
    const id = this.formSnapshot().usuarioId;
    return this.usuarios().find((u) => u.id === id) ?? null;
  });

  readonly duracionHoras = computed<number>(() => {
    const snap = this.formSnapshot();
    if (
      !HH_MM_PATTERN.test(snap.horaInicio) ||
      !HH_MM_PATTERN.test(snap.horaFin)
    ) {
      return 0;
    }
    const diff = horaAMinutos(snap.horaFin) - horaAMinutos(snap.horaInicio);
    return diff > 0 ? Number((diff / 60).toFixed(2)) : 0;
  });

  readonly subtotalEstimado = computed<number>(() => {
    const espacio = this.selectedEspacio();
    if (!espacio || this.duracionHoras() <= 0) {
      return 0;
    }
    return this.duracionHoras() * espacio.costoPorHora;
  });

  readonly capacidadExcedidaWarning = computed<boolean>(() => {
    const espacio = this.selectedEspacio();
    if (!espacio) return false;
    return Number(this.formSnapshot().cantidadPersonas) > espacio.capacidadMaxima;
  });

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  hasUnsavedChanges(): boolean {
    if (this.savedSuccessfully()) {
      return false;
    }
    return this.form.dirty;
  }

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    const preselectedUserId = this.route.snapshot.queryParamMap.get('usuarioId');

    forkJoin({
      usuarios: this.usuariosService.listarTodos(),
      espacios: this.espaciosService.listarTodosEspacios('activos'),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ usuarios: todos, espacios }) => {
          // Las cuentas desactivadas no pueden recibir reservaciones nuevas.
          const usuarios = todos.filter((u) => u.activo !== false);
          this.usuarios.set(usuarios);
          this.espacios.set(espacios);

          if (
            preselectedUserId &&
            usuarios.some((u) => u.id === preselectedUserId)
          ) {
            this.form.controls.usuarioId.setValue(preselectedUserId);
            this.form.markAsPristine();
            this.formSnapshot.set(this.form.getRawValue());
          }
        },
        error: (cause: unknown) => {
          this.loadError.set(
            isApiError(cause)
              ? cause
              : {
                  statusCode: 500,
                  tipoError: 'UnexpectedError',
                  message:
                    'No pudimos cargar los usuarios y espacios activos.',
                },
          );
        },
      });
  }

  hasFieldError(controlName: keyof typeof this.form.controls): boolean {
    const ctrl = this.form.controls[controlName];
    return ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  onSubmit(): void {
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.isSubmitting.set(true);

    this.reservacionesService
      .crear({
        usuarioId: raw.usuarioId,
        espacioId: raw.espacioId,
        fecha: raw.fecha,
        horaInicio: raw.horaInicio,
        horaFin: raw.horaFin,
        cantidadPersonas: Number(raw.cantidadPersonas),
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (creada) => {
          this.savedSuccessfully.set(true);
          this.form.markAsPristine();
          void this.router.navigate(['/reservaciones', creada.id], {
            replaceUrl: true,
          });
        },
        error: (cause: unknown) => {
          this.submitError.set(
            isApiError(cause)
              ? cause
              : {
                  statusCode: 500,
                  tipoError: 'UnexpectedError',
                  message: 'No fue posible crear la reservación manual.',
                },
          );
        },
      });
  }

  formatCurrency(amount: number): string {
    return CURRENCY_FORMATTER.format(amount);
  }
}
