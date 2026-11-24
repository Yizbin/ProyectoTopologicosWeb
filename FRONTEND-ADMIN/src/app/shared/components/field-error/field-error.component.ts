import { Component, computed, effect, input, signal } from '@angular/core';
import type { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-field-error',
  standalone: true,
  template: `
    @if (errorMessage(); as msg) {
      <p role="alert" class="mt-1 text-xs font-medium text-red-600">
        {{ msg }}
      </p>
    }
  `,
})
export class FieldErrorComponent {
  readonly control = input<AbstractControl | null>(null);
  readonly fieldName = input('');
  readonly customMessages = input<Record<string, string>>({});

  private readonly controlVersion = signal(0);

  constructor() {
    effect((onCleanup) => {
      const ctrl = this.control();
      this.controlVersion.update((v) => v + 1);

      if (!ctrl) {
        return;
      }

      const sub = ctrl.events.subscribe(() => {
        this.controlVersion.update((v) => v + 1);
      });

      onCleanup(() => sub.unsubscribe());
    });
  }

  readonly errorMessage = computed<string | null>(() => {
    this.controlVersion();
    const ctrl = this.control();

    if (!ctrl || !ctrl.invalid || !(ctrl.touched || ctrl.dirty)) {
      return null;
    }

    const errors = ctrl.errors;
    if (!errors) {
      return null;
    }

    const custom = this.customMessages();
    const label = this.fieldName().trim();
    const firstKey = Object.keys(errors)[0];

    if (firstKey && custom[firstKey]) {
      return custom[firstKey];
    }

    if (errors['required']) {
      return label
        ? `El campo ${label} es obligatorio.`
        : 'Este campo es obligatorio.';
    }

    if (errors['email']) {
      return 'Ingresa un correo electrónico válido.';
    }

    if (errors['minlength']) {
      const req = (errors['minlength'] as { requiredLength: number })
        .requiredLength;
      return `Debe tener al menos ${req} caracteres.`;
    }

    if (errors['maxlength']) {
      const req = (errors['maxlength'] as { requiredLength: number })
        .requiredLength;
      return `No puede exceder ${req} caracteres.`;
    }

    if (errors['min']) {
      const min = (errors['min'] as { min: number }).min;
      return `El valor mínimo permitido es ${min}.`;
    }

    if (errors['max']) {
      const max = (errors['max'] as { max: number }).max;
      return `El valor máximo permitido es ${max}.`;
    }

    if (errors['pattern']) {
      return label
        ? `El formato de ${label} no es válido.`
        : 'El formato ingresado no es válido.';
    }

    const rawError = firstKey ? errors[firstKey] : null;
    if (typeof rawError === 'string' && rawError.trim().length > 0) {
      return rawError;
    }

    return 'Valor inválido.';
  });
}
