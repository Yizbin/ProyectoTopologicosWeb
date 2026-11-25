import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="rounded-2xl border border-stone-200 bg-white p-8 text-center" aria-live="polite">
      <p class="text-sm font-semibold text-stone-500">404</p>
      <h2 class="text-xl font-semibold text-stone-900">No encontramos este recurso</h2>
      <p class="mt-2 text-stone-600">El enlace no existe o el registro ya no está disponible.</p>
      <a [routerLink]="backLink()" class="mt-5 inline-flex rounded-xl bg-[#23312b] px-4 py-2 text-white">
        {{ backLabel() }}
      </a>
    </section>
  `,
})
export class NotFoundComponent {
  readonly backLink = input('/dashboard');
  readonly backLabel = input('Volver al tablero');
}
