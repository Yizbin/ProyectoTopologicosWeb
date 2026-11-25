import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (
  component,
) => {
  // El cierre de sesión y la expiración deben abandonar la vista protegida.
  if (!inject(AuthService).isAuthenticated()) return true;
  if (!component || typeof component.hasUnsavedChanges !== 'function') {
    return true;
  }

  if (!component.hasUnsavedChanges()) {
    return true;
  }

  return window.confirm(
    'Tienes cambios sin guardar en el formulario. ¿Deseas salir sin guardar?',
  );
};
