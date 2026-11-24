import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import {
  isApiError,
  type ApiError,
  type Bloqueo,
  type Espacio,
  type HorarioAtencion,
  type Sede,
} from '../../../../core/models';
import {
  AsyncStateComponent,
  ConfirmModalComponent,
  DomainErrorAlertComponent,
  FieldErrorComponent,
  StatusBadgeComponent,
} from '../../../../shared/components';
import { EspaciosAdminService } from '../../services/espacios-admin.service';

type DetailTab = 'info' | 'horarios' | 'bloqueos';

interface DiaHorarioForm {
  diaSemana: FormControl<number>;
  nombreDia: FormControl<string>;
  activo: FormControl<boolean>;
  horaApertura: FormControl<string>;
  horaCierre: FormControl<string>;
}

const WEEKDAYS: { diaSemana: number; nombre: string }[] = [
  { diaSemana: 1, nombre: 'Lunes' },
  { diaSemana: 2, nombre: 'Martes' },
  { diaSemana: 3, nombre: 'Miércoles' },
  { diaSemana: 4, nombre: 'Jueves' },
  { diaSemana: 5, nombre: 'Viernes' },
  { diaSemana: 6, nombre: 'Sábado' },
  { diaSemana: 0, nombre: 'Domingo' },
];

const HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

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

function validarFilaHorario(group: AbstractControl): ValidationErrors | null {
  const activo = Boolean(group.get('activo')?.value);
  const aperturaCtrl = group.get('horaApertura');
  const cierreCtrl = group.get('horaCierre');
  if (!aperturaCtrl || !cierreCtrl) {
    return null;
  }

  if (!activo) {
    setControlError(aperturaCtrl, 'aperturaRequerida', false);
    setControlError(cierreCtrl, 'cierreRequerido', false);
    setControlError(cierreCtrl, 'horaCierreInvalida', false);
    return null;
  }

  const apertura = String(aperturaCtrl.value ?? '').trim();
  const cierre = String(cierreCtrl.value ?? '').trim();

  const missingApertura = !HH_MM_PATTERN.test(apertura);
  const missingCierre = !HH_MM_PATTERN.test(cierre);
  setControlError(aperturaCtrl, 'aperturaRequerida', missingApertura);
  setControlError(cierreCtrl, 'cierreRequerido', missingCierre);

  const invalidOrder = !missingApertura && !missingCierre && cierre <= apertura;
  setControlError(cierreCtrl, 'horaCierreInvalida', invalidOrder);

  return missingApertura || missingCierre || invalidOrder
    ? { horarioInvalido: true }
    : null;
}

function validarBloqueoFechasYHoras(
  group: AbstractControl,
): ValidationErrors | null {
  const fInicioCtrl = group.get('fechaInicio');
  const fFinCtrl = group.get('fechaFin');
  const hInicioCtrl = group.get('horaInicio');
  const hFinCtrl = group.get('horaFin');
  if (!fInicioCtrl || !fFinCtrl || !hInicioCtrl || !hFinCtrl) {
    return null;
  }

  const fInicio = String(fInicioCtrl.value ?? '');
  const fFin = String(fFinCtrl.value ?? '');
  const invalidFecha = Boolean(fInicio && fFin && fFin < fInicio);
  setControlError(fFinCtrl, 'fechaFinInvalida', invalidFecha);

  const hInicio = String(hInicioCtrl.value ?? '');
  const hFin = String(hFinCtrl.value ?? '');
  const invalidHora =
    HH_MM_PATTERN.test(hInicio) &&
    HH_MM_PATTERN.test(hFin) &&
    hFin <= hInicio;
  setControlError(hFinCtrl, 'horaFinInvalida', invalidHora);

  return invalidFecha || invalidHora ? { bloqueoInvalido: true } : null;
}

@Component({
  selector: 'app-espacio-detail-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AsyncStateComponent,
    ConfirmModalComponent,
    DomainErrorAlertComponent,
    FieldErrorComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './espacio-detail-page.component.html',
})
export class EspacioDetailPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly espaciosService = inject(EspaciosAdminService);

  readonly espacioId = signal('');
  readonly activeTab = signal<DetailTab>('info');

  readonly espacio = signal<Espacio | null>(null);
  readonly sedes = signal<Sede[]>([]);
  readonly sedeInfo = computed<Sede | null>(() => {
    const current = this.espacio();
    if (!current) return null;
    return this.sedes().find((s) => s.id === current.sedeId) ?? null;
  });

  readonly isLoading = signal(true);
  readonly loadError = signal<ApiError | null>(null);

  readonly confirmToggleEspacio = signal(false);
  readonly isTogglingEspacio = signal(false);
  readonly espacioActionError = signal<ApiError | null>(null);
  readonly espacioActionSuccess = signal<string | null>(null);

  readonly horariosArray = new FormArray<FormGroup<DiaHorarioForm>>(
    WEEKDAYS.map((day) =>
      this.fb.nonNullable.group(
        {
          diaSemana: [day.diaSemana],
          nombreDia: [day.nombre],
          activo: [false],
          horaApertura: ['09:00'],
          horaCierre: ['18:00'],
        },
        { validators: validarFilaHorario },
      ),
    ),
  );
  readonly horariosForm = this.fb.group({
    dias: this.horariosArray,
  });
  readonly isSavingHorarios = signal(false);
  readonly horariosError = signal<ApiError | null>(null);
  readonly horariosSuccess = signal<string | null>(null);

  readonly bloqueos = signal<Bloqueo[]>([]);
  readonly soloActivos = signal(false);
  readonly isLoadingBloqueos = signal(false);
  readonly bloqueosLoadError = signal<ApiError | null>(null);

  readonly isCreatingBloqueo = signal(false);
  readonly bloqueoFormError = signal<ApiError | null>(null);
  readonly bloqueoSuccess = signal<string | null>(null);

  readonly bloqueoADesactivar = signal<Bloqueo | null>(null);
  readonly isDeactivatingBloqueo = signal(false);

  readonly bloqueoForm = this.fb.nonNullable.group(
    {
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      horaInicio: [
        '09:00',
        [Validators.required, Validators.pattern(HH_MM_PATTERN)],
      ],
      horaFin: [
        '11:00',
        [Validators.required, Validators.pattern(HH_MM_PATTERN)],
      ],
      motivo: ['', [Validators.required, Validators.minLength(5)]],
    },
    { validators: validarBloqueoFechasYHoras },
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.espacioId.set(id);
    this.cargarTodo();
  }

  cargarTodo(): void {
    const id = this.espacioId();
    if (!id) {
      this.loadError.set({
        statusCode: 400,
        tipoError: 'BadRequestException',
        message: 'No se especificó el identificador del espacio.',
      });
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(null);

    forkJoin({
      espacio: this.espaciosService.obtenerEspacio(id),
      sedes: this.espaciosService.listarSedes(),
      horarios: this.espaciosService.obtenerHorarios(id),
      bloqueos: this.espaciosService.obtenerBloqueos(
        id,
        this.soloActivos() ? true : undefined,
      ),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ espacio, sedes, horarios, bloqueos }) => {
          this.espacio.set(espacio);
          this.sedes.set(sedes);
          this.poblarHorarios(horarios);
          this.bloqueos.set(bloqueos);
        },
        error: (cause: unknown) => {
          this.loadError.set(
            isApiError(cause)
              ? cause
              : {
                statusCode: 500,
                tipoError: 'UnexpectedError',
                message: 'No pudimos cargar el detalle del espacio.',
              },
          );
        },
      });
  }

  setTab(tab: DetailTab): void {
    this.activeTab.set(tab);
  }

  confirmarCambioEstadoEspacio(): void {
    const actual = this.espacio();
    if (!actual || this.isTogglingEspacio()) {
      return;
    }

    const nuevoEstado = !actual.activo;
    this.isTogglingEspacio.set(true);
    this.espacioActionError.set(null);
    this.espacioActionSuccess.set(null);

    this.espaciosService
      .actualizarEspacio(actual.id, { activo: nuevoEstado })
      .pipe(finalize(() => this.isTogglingEspacio.set(false)))
      .subscribe({
        next: (updated) => {
          this.espacio.set(updated);
          this.confirmToggleEspacio.set(false);
          this.espacioActionSuccess.set(
            nuevoEstado
              ? 'El espacio fue reactivado correctamente.'
              : 'El espacio fue desactivado correctamente.',
          );
        },
        error: (cause: unknown) => {
          this.confirmToggleEspacio.set(false);
          this.espacioActionError.set(
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

  guardarHorarios(): void {
    this.horariosError.set(null);
    this.horariosSuccess.set(null);

    if (this.horariosForm.invalid) {
      this.horariosForm.markAllAsTouched();
      return;
    }

    const activos = this.horariosArray.controls
      .map((ctrl) => ctrl.getRawValue())
      .filter((d) => d.activo)
      .map((d) => ({
        diaSemana: d.diaSemana,
        horaApertura: d.horaApertura,
        horaCierre: d.horaCierre,
      }));

    this.isSavingHorarios.set(true);
    this.espaciosService
      .guardarHorarios(this.espacioId(), { horarios: activos })
      .pipe(finalize(() => this.isSavingHorarios.set(false)))
      .subscribe({
        next: (updated) => {
          this.poblarHorarios(updated);
          this.horariosSuccess.set(
            'Horarios de atención actualizados correctamente.',
          );
        },
        error: (cause: unknown) => {
          this.horariosError.set(
            isApiError(cause)
              ? cause
              : {
                statusCode: 500,
                tipoError: 'UnexpectedError',
                message: 'No fue posible guardar los horarios de atención.',
              },
          );
        },
      });
  }

  cambiarFiltroBloqueos(soloActivos: boolean): void {
    this.soloActivos.set(soloActivos);
    this.recargarBloqueos();
  }

  recargarBloqueos(): void {
    this.isLoadingBloqueos.set(true);
    this.bloqueosLoadError.set(null);

    this.espaciosService
      .obtenerBloqueos(
        this.espacioId(),
        this.soloActivos() ? true : undefined,
      )
      .pipe(finalize(() => this.isLoadingBloqueos.set(false)))
      .subscribe({
        next: (lista) => this.bloqueos.set(lista),
        error: (cause: unknown) => {
          this.bloqueosLoadError.set(
            isApiError(cause)
              ? cause
              : {
                statusCode: 500,
                tipoError: 'UnexpectedError',
                message: 'No pudimos cargar los bloqueos del espacio.',
              },
          );
        },
      });
  }

  registrarBloqueo(): void {
    this.bloqueoFormError.set(null);
    this.bloqueoSuccess.set(null);

    if (this.bloqueoForm.invalid) {
      this.bloqueoForm.markAllAsTouched();
      return;
    }

    const raw = this.bloqueoForm.getRawValue();
    this.isCreatingBloqueo.set(true);

    this.espaciosService
      .crearBloqueo(this.espacioId(), {
        fechaInicio: raw.fechaInicio,
        fechaFin: raw.fechaFin,
        horaInicio: raw.horaInicio,
        horaFin: raw.horaFin,
        motivo: raw.motivo.trim(),
      })
      .pipe(finalize(() => this.isCreatingBloqueo.set(false)))
      .subscribe({
        next: () => {
          this.bloqueoSuccess.set('Bloqueo administrativo registrado.');
          this.bloqueoForm.reset({
            fechaInicio: '',
            fechaFin: '',
            horaInicio: '09:00',
            horaFin: '11:00',
            motivo: '',
          });
          this.recargarBloqueos();
        },
        error: (cause: unknown) => {
          this.bloqueoFormError.set(
            isApiError(cause)
              ? cause
              : {
                statusCode: 500,
                tipoError: 'UnexpectedError',
                message: 'No pudimos registrar el bloqueo.',
              },
          );
        },
      });
  }

  confirmarDesactivarBloqueo(): void {
    const target = this.bloqueoADesactivar();
    if (!target || this.isDeactivatingBloqueo()) {
      return;
    }

    this.isDeactivatingBloqueo.set(true);
    this.bloqueoFormError.set(null);
    this.bloqueoSuccess.set(null);

    this.espaciosService
      .desactivarBloqueo(this.espacioId(), target.id)
      .pipe(finalize(() => this.isDeactivatingBloqueo.set(false)))
      .subscribe({
        next: () => {
          this.bloqueoADesactivar.set(null);
          this.bloqueoSuccess.set('El bloqueo administrativo fue desactivado.');
          this.recargarBloqueos();
        },
        error: (cause: unknown) => {
          this.bloqueoADesactivar.set(null);
          this.bloqueoFormError.set(
            isApiError(cause)
              ? cause
              : {
                statusCode: 500,
                tipoError: 'UnexpectedError',
                message: 'No pudimos desactivar el bloqueo.',
              },
          );
        },
      });
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

  private poblarHorarios(horarios: HorarioAtencion[]): void {
    const mapByDay = new Map<number, HorarioAtencion>();
    for (const h of horarios) {
      if (!mapByDay.has(h.diaSemana)) {
        mapByDay.set(h.diaSemana, h);
      }
    }

    for (const ctrl of this.horariosArray.controls) {
      const dia = ctrl.controls.diaSemana.value;
      const match = mapByDay.get(dia);
      ctrl.patchValue({
        activo: Boolean(match),
        horaApertura: match ? match.horaApertura : '09:00',
        horaCierre: match ? match.horaCierre : '18:00',
      });
      ctrl.markAsPristine();
      ctrl.markAsUntouched();
      ctrl.updateValueAndValidity();
    }
  }
}
