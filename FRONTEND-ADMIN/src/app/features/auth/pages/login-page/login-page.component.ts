import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { isSafeReturnUrl } from '../../../../core/guards/auth.guard';
import { isApiError } from '../../../../core/models';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly authNotice = this.authService.authNotice;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly errorTipo = signal<string | null>(null);

  readonly loginForm = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]],
  });

  dismissNotice(): void {
    this.authService.clearAuthNotice();
  }

  hasFieldError(controlName: 'correo' | 'contrasena'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  getFieldErrorMessage(controlName: 'correo' | 'contrasena'): string | null {
    const control = this.loginForm.controls[controlName];
    if (!control.invalid || !(control.touched || control.dirty)) {
      return null;
    }

    if (control.errors?.['required']) {
      return controlName === 'correo'
        ? 'Ingresa el correo electrónico de administrador.'
        : 'Ingresa tu contraseña.';
    }

    if (control.errors?.['email']) {
      return 'Ingresa un correo electrónico válido.';
    }

    if (control.errors?.['minlength']) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    return 'Campo inválido.';
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    this.errorTipo.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { correo, contrasena } = this.loginForm.getRawValue();
    this.isSubmitting.set(true);

    this.authService
      .login({ correo: correo.trim(), contrasena })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          const destination = isSafeReturnUrl(returnUrl)
            ? returnUrl
            : '/dashboard';
          void this.router.navigateByUrl(destination, { replaceUrl: true });
        },
        error: (cause: unknown) => {
          if (isApiError(cause)) {
            this.errorMessage.set(cause.message);
            this.errorTipo.set(cause.tipoError);
            return;
          }

          this.errorMessage.set(
            'No fue posible iniciar sesión en este momento. Inténtalo de nuevo.',
          );
          this.errorTipo.set('UnexpectedError');
        },
      });
  }
}
