import { Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import type { HasUnsavedChanges } from '../../../../core/guards/unsaved-changes.guard';
import { isApiError, type ApiError, type RolUsuario } from '../../../../core/models';
import {
  DomainErrorAlertComponent,
  FieldErrorComponent,
} from '../../../../shared/components';
import { UsuariosAdminService } from '../../services/usuarios-admin.service';

@Component({
  selector: 'app-usuario-form-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DomainErrorAlertComponent,
    FieldErrorComponent,
  ],
  templateUrl: './usuario-form-page.component.html',
})
export class UsuarioFormPageComponent implements HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usuariosService = inject(UsuariosAdminService);

  readonly isSubmitting = signal(false);
  readonly submitError = signal<ApiError | null>(null);
  private readonly savedSuccessfully = signal(false);

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
    contrasena: [
      '',
      [Validators.required, Validators.minLength(6), Validators.maxLength(72)],
    ],
    rol: ['CLIENTE' as RolUsuario, [Validators.required]],
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

    this.usuariosService
      .crear({
        nombre: raw.nombre.trim(),
        correo: raw.correo.trim(),
        telefono: raw.telefono.trim(),
        contrasena: raw.contrasena,
        rol: raw.rol,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (creado) => {
          this.savedSuccessfully.set(true);
          this.form.markAsPristine();
          void this.router.navigate(['/usuarios', creado.id], {
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
                  message: 'No fue posible registrar el usuario.',
                },
          );
        },
      });
  }
}
