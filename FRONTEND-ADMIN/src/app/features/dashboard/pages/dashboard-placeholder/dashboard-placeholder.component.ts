import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-placeholder',
  standalone: true,
  template: `
    <div class="min-h-screen bg-[#f6f5f0] px-4 py-10 text-[#23312b]">
      <div class="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-6 shadow-xs sm:p-8">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <span class="inline-flex items-center rounded-full bg-[#e4e9e0] px-3 py-1 text-xs font-semibold text-[#526e5c]">
              Sesión ADMIN verificada
            </span>
            <h1 class="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
              Casa Norte · Panel Administrativo
            </h1>
            @if (user(); as currentUser) {
              <p class="mt-1 text-sm text-stone-600">
                Conectado como <strong class="font-semibold text-stone-900">{{ currentUser.nombre }}</strong>
                ({{ currentUser.correo }}) · Rol: <span class="font-mono text-xs">{{ currentUser.rol }}</span>
              </p>
            }
          </div>

          <button
            type="button"
            (click)="cerrarSesion()"
            class="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
          >
            <svg
              aria-hidden="true"
              class="h-4 w-4 text-stone-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>
        </div>

        <p class="mt-5 text-sm leading-relaxed text-stone-600">
          Placeholder temporal de /dashboard 
        </p>
      </div>
    </div>
  `,
})
export class DashboardPlaceholderComponent {
  private readonly authService = inject(AuthService);
  readonly user = this.authService.user;

  cerrarSesion(): void {
    this.authService.logout('Sesión cerrada correctamente.');
  }
}
