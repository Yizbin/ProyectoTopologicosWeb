import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
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
  type CrearEspacioDto,
  type Sede,
  type TipoEspacio,
} from '../../../../core/models';
import {
  AsyncStateComponent,
  DomainErrorAlertComponent,
  FieldErrorComponent,
} from '../../../../shared/components';
import { EspaciosAdminService } from '../../services/espacios-admin.service';

function validarRangoHoras(group: AbstractControl): ValidationErrors | null {
  const minCtrl = group.get('minimoHorasReserva');
  const maxCtrl = group.get('maximoHorasReserva');
  if (!minCtrl || !maxCtrl) {
    return null;
  }

  const min = Number(minCtrl.value);
  const max = Number(maxCtrl.value);
  const hasNumbers =
    minCtrl.value !== null &&
    minCtrl.value !== '' &&
    maxCtrl.value !== null &&
    maxCtrl.value !== '' &&
    Number.isFinite(min) &&
    Number.isFinite(max);

  const currentErrors = maxCtrl.errors ?? {};

  if (hasNumbers && max < min) {
    if (!currentErrors['rangoHorasInvalido']) {
      maxCtrl.setErrors({ ...currentErrors, rangoHorasInvalido: true });
    }
    return { rangoHorasInvalido: true };
  }

  if (currentErrors['rangoHorasInvalido']) {
    const { rangoHorasInvalido: _removed, ...rest } = currentErrors;
    maxCtrl.setErrors(Object.keys(rest).length > 0 ? rest : null);
  }

  return null;
}

@Component({
  selector: 'app-espacio-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AsyncStateComponent,
    DomainErrorAlertComponent,
    FieldErrorComponent,
  ],
  templateUrl: './espacio-form-page.component.html',
})
export class EspacioFormPageComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly espaciosService = inject(EspaciosAdminService);

  readonly espacioId = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly sedes = signal<Sede[]>([]);

  readonly isLoading = signal(true);
  readonly loadError = signal<ApiError | null>(null);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<ApiError | null>(null);

  readonly amenidades = signal<string[]>([]);
  readonly nuevaAmenidad = signal('');
  private readonly amenidadesModified = signal(false);
  private readonly savedSuccessfully = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      nombre: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(120),
        ],
      ],
      descripcion: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(500),
        ],
      ],
      tipo: ['Sala' as TipoEspacio, [Validators.required]],
      sedeId: ['', [Validators.required]],
      costoPorHora: [150, [Validators.required, Validators.min(1)]],
      capacidadMaxima: [
        4,
        [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
      ],
      duracionMinutos: [
        60,
        [Validators.required, Validators.min(15), Validators.pattern(/^\d+$/)],
      ],
      minimoHorasReserva: [
        1,
        [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
      ],
      maximoHorasReserva: [
        4,
        [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
      ],
      activo: [true],
    },
    { validators: validarRangoHoras },
  );

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
    return this.form.dirty || this.amenidadesModified();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.espacioId.set(id);
    this.isEditMode.set(Boolean(id));
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    const id = this.espacioId();
    if (id) {
      forkJoin({
        sedes: this.espaciosService.listarSedes(),
        espacio: this.espaciosService.obtenerEspacio(id),
      })
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: ({ sedes, espacio }) => {
            this.sedes.set(sedes);
            this.form.reset({
              nombre: espacio.nombre,
              descripcion: espacio.descripcion,
              tipo: espacio.tipo,
              sedeId: espacio.sedeId,
              costoPorHora: espacio.costoPorHora,
              capacidadMaxima: espacio.capacidadMaxima,
              duracionMinutos: espacio.duracionMinutos,
              minimoHorasReserva: espacio.minimoHorasReserva,
              maximoHorasReserva: espacio.maximoHorasReserva,
              activo: espacio.activo,
            });
            this.amenidades.set([...espacio.amenidades]);
            this.amenidadesModified.set(false);
            this.form.markAsPristine();
          },
          error: (cause: unknown) => {
            this.loadError.set(
              isApiError(cause)
                ? cause
                : {
                  statusCode: 500,
                  tipoError: 'UnexpectedError',
                  message: 'No pudimos cargar los datos del espacio.',
                },
            );
          },
        });
      return;
    }

    this.espaciosService
      .listarSedes()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (sedes) => {
          this.sedes.set(sedes);
          if (sedes.length === 1 && !this.form.controls.sedeId.value) {
            this.form.controls.sedeId.setValue(sedes[0].id);
            this.form.markAsPristine();
          }
        },
        error: (cause: unknown) => {
          this.loadError.set(
            isApiError(cause)
              ? cause
              : {
                statusCode: 500,
                tipoError: 'UnexpectedError',
                message: 'No pudimos cargar el catálogo de sedes.',
              },
          );
        },
      });
  }

  agregarAmenidad(): void {
    const valor = this.nuevaAmenidad().trim();
    if (!valor) {
      return;
    }

    const existe = this.amenidades().some(
      (item) => item.toLowerCase() === valor.toLowerCase(),
    );
    if (!existe) {
      this.amenidades.update((lista) => [...lista, valor]);
      this.amenidadesModified.set(true);
    }
    this.nuevaAmenidad.set('');
  }

  onAmenidadKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.agregarAmenidad();
    }
  }

  eliminarAmenidad(index: number): void {
    this.amenidades.update((lista) => lista.filter((_, i) => i !== index));
    this.amenidadesModified.set(true);
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
    const payload: CrearEspacioDto = {
      nombre: raw.nombre.trim(),
      descripcion: raw.descripcion.trim(),
      tipo: raw.tipo,
      sedeId: raw.sedeId,
      costoPorHora: Number(raw.costoPorHora),
      capacidadMaxima: Number(raw.capacidadMaxima),
      duracionMinutos: Number(raw.duracionMinutos),
      minimoHorasReserva: Number(raw.minimoHorasReserva),
      maximoHorasReserva: Number(raw.maximoHorasReserva),
      amenidades: this.amenidades(),
      activo: raw.activo,
    };

    this.isSubmitting.set(true);
    const id = this.espacioId();
    const request$ = id
      ? this.espaciosService.actualizarEspacio(id, payload)
      : this.espaciosService.crearEspacio(payload);

    request$
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (saved) => {
          this.savedSuccessfully.set(true);
          this.form.markAsPristine();
          this.amenidadesModified.set(false);
          void this.router.navigate(['/espacios', saved.id], {
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
                message: 'No fue posible guardar el espacio.',
              },
          );
        },
      });
  }
}
