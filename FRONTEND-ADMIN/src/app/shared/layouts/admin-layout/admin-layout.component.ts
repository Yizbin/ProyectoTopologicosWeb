import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { RolUsuario } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';

export type NavIconKey = 'dashboard' | 'espacios' | 'reservaciones' | 'pagos' | 'usuarios';

export interface AdminNavItem {
  label: string;
  route: string;
  icon: NavIconKey;
  roles: RolUsuario[];
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'Tablero',
    route: '/dashboard',
    icon: 'dashboard',
    roles: ['ADMIN'],
  },
  {
    label: 'Espacios',
    route: '/espacios',
    icon: 'espacios',
    roles: ['ADMIN'],
  },
  {
    label: 'Reservaciones',
    route: '/reservaciones',
    icon: 'reservaciones',
    roles: ['ADMIN'],
  },
  {
    label: 'Pagos',
    route: '/pagos',
    icon: 'pagos',
    roles: ['ADMIN'],
  },
  {
    label: 'Usuarios',
    route: '/usuarios',
    icon: 'usuarios',
    roles: ['ADMIN'],
  },
];

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, StatusBadgeComponent],
  templateUrl: './admin-layout.component.html',
  host: {
    '(document:keydown.escape)': 'closeMobileMenu()',
  },
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.user;
  readonly mobileMenuOpen = signal(false);

  // El control de acceso esta en los Guards del back
  //JwtAuthGuard y RolesGuard
  readonly visibleNavItems = computed<AdminNavItem[]>(() => {
    const rol = this.user()?.rol;
    if (!rol) {
      return [];
    }
    return ADMIN_NAV_ITEMS.filter((item) => item.roles.includes(rol));
  });

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.closeMobileMenu();
    this.authService.logout('Sesión cerrada correctamente.');
  }
}
