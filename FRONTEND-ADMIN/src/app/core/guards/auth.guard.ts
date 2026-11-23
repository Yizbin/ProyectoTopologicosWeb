import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function isSafeReturnUrl(url: string | null | undefined): url is string {
  return (
    typeof url === 'string' &&
    url.startsWith('/') &&
    !url.startsWith('//') &&
    !url.startsWith('/login')
  );
}

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasValidAdminSession()) {
    return true;
  }

  if (!authService.authNotice()) {
    authService.setAuthNotice(
      'Inicia sesión con una cuenta de administrador para acceder al panel.',
    );
  }

  return router.createUrlTree(['/login'], {
    queryParams: isSafeReturnUrl(state.url) ? { returnUrl: state.url } : undefined,
  });
};

export const adminRoleGuard: CanActivateFn = authGuard;
