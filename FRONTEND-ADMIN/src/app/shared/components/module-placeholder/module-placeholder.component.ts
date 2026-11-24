import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-module-placeholder',
  standalone: true,
  template: `
    <div class="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs sm:p-8">
      <span class="inline-flex items-center rounded-full bg-[#e4e9e0] px-3 py-1 text-xs font-semibold text-[#526e5c]">
        Módulo en preparación
      </span>
      <h2 class="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
        {{ title }}
      </h2>
      <p class="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        {{ description }}
      </p>
    </div>
  `,
})
export class ModulePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title =
    (this.route.snapshot.data['title'] as string | undefined) ?? 'Módulo';
  readonly description =
    (this.route.snapshot.data['description'] as string | undefined) ??
    'Ruta protegida lista dentro del Shell Administrativo.';
}
