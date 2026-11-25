import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import type { HasUnsavedChanges } from '../../../../core/guards/unsaved-changes.guard';
import {
  isApiError,
  type ActualizarUsuarioRequest,
  type ApiError,
  type RolUsuario,
  type UsuarioPublico,
} from '../../../../core/models';
import { AuthService } from '../../../../core/services/auth.service';
import {
  AsyncStateComponent,
  DomainErrorAlertComponent,
  FieldErrorComponent,
} from '../../../../shared/components';
import { UsuariosAdminService } from '../../services/usuarios-admin.service';

const CONTRASENA_VALIDATORS = [Validators.minLength(6), Validators.maxLength(72)];

@Component({
  selector: 'app-usuario-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AsyncStateComponent,
    DomainErrorAlertComponent,
    FieldErrorComponent,
  ],
  templateUrl: './usuario-form-page.component.html',
})
export class UsuarioFormPageComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly usuariosService = inject(UsuariosAdminService);
  private readonly authService = inject(AuthService);

  readonly isEditMode = signal(false);
  readonly usuarioId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly loadError = signal<ApiError | null>(null);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<ApiError | null>(null);
  /** Un admin no puede quitarse su propio rol: el selector se bloquea. */
  readonly esCuentaPropia = signal(false);
  private readonly savedSuccessfully = signal(false);
  private original: UsuarioPublico | null = null;

  readonly form = this.fb.nonNullable.group({
    nombre: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(120),
      ],
    ],
    correo: ['', [Validators.required, Validators.email]],
    telefono: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(30)],
    ],
    contrasena: ['', [Validators.required, ...CONTRASENA_VALIDATORS]],
    rol: ['CLIENTE' as RolUsuario, [Validators.required]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.isEditMode.set(true);
    this.usuarioId.set(id);
    this.esCuentaPropia.set(this.authService.user()?.id === id);
    // Al editar, la contraseña es opcional: vacía significa "no cambiarla".
    this.form.controls.contrasena.setValidators(CONTRASENA_VALIDATORS);
    this.form.controls.contrasena.updateValueAndValidity();
    this.cargarUsuario();
  }

  cargarUsuario(): void {
    const id = this.usuarioId();
    if (!id) return;

    this.isLoading.set(true);
    this.loadError.set(null);

    this.usuariosService
      .obtenerPorId(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (usuario) => {
          this.original = usuario;
          this.form.reset({
            nombre: usuario.nombre,
            correo: usuario.correo,
            telefono: usuario.telefono,
            contrasena: '',
            rol: usuario.rol,
          });
          if (this.esCuentaPropia()) {
            this.form.controls.rol.disable();
          }
        },
        error: (cause: unknown) => {
          this.loadError.set(
            isApiError(cause)
              ? cause
              : {
                  statusCode: 500,
                  tipoError: 'UnexpectedError',
                  message: 'No fue posible cargar el usuario.',
                },
          );
        },
      });
  }

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
    const datos = {
      nombre: raw.nombre.trim(),
      correo: raw.correo.trim(),
      telefono: raw.telefono.trim(),
      rol: raw.rol,
    };

    const id = this.usuarioId();
    const peticion = this.isEditMode() && id
      ? this.usuariosService.actualizar(id, this.soloCambios(datos, raw.contrasena))
      : this.usuariosService.crear({ ...datos, contrasena: raw.contrasena });

    this.isSubmitting.set(true);
    peticion
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (guardado) => {
          this.savedSuccessfully.set(true);
          this.form.markAsPristine();
          void this.router.navigate(['/usuarios', guardado.id], {
            replaceUrl: true,
            state: {
              aviso: this.isEditMode()
                ? 'Los cambios del usuario se guardaron correctamente.'
                : 'Usuario registrado correctamente.',
            },
          });
        },
        error: (cause: unknown) => {
          this.submitError.set(
            isApiError(cause)
              ? cause
              : {
                  statusCode: 500,
                  tipoError: 'UnexpectedError',
                  message: this.isEditMode()
                    ? 'No fue posible guardar los cambios del usuario.'
                    : 'No fue posible registrar el usuario.',
                },
          );
        },
      });
  }

  /** Envía solo lo que cambió, para no disparar reglas de rol sin necesidad. */
  private soloCambios(
    datos: { nombre: string; correo: string; telefono: string; rol: RolUsuario },
    contrasena: string,
  ): ActualizarUsuarioRequest {
    const dto: ActualizarUsuarioRequest = {};
    const o = this.original;
    if (!o || datos.nombre !== o.nombre) dto.nombre = datos.nombre;
    if (!o || datos.correo !== o.correo) dto.correo = datos.correo;
    if (!o || datos.telefono !== o.telefono) dto.telefono = datos.telefono;
    if (!this.esCuentaPropia() && (!o || datos.rol !== o.rol)) dto.rol = datos.rol;
    if (contrasena) dto.contrasena = contrasena;
    return dto;
  }
}
