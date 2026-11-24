import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import { LoginPageComponent } from './features/auth/pages/login-page/login-page.component';
import { ModulePlaceholderComponent } from './shared/components/module-placeholder/module-placeholder.component';
import { AdminLayoutComponent } from './shared/layouts/admin-layout/admin-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPageComponent,
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './features/dashboard/pages/dashboard-page/dashboard-page.component'
          ).then((m) => m.DashboardPageComponent),
      },
      {
        path: 'espacios',
        loadComponent: () =>
          import(
            './features/espacios/pages/espacios-list-page/espacios-list-page.component'
          ).then((m) => m.EspaciosListPageComponent),
      },
      {
        path: 'espacios/nuevo',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import(
            './features/espacios/pages/espacio-form-page/espacio-form-page.component'
          ).then((m) => m.EspacioFormPageComponent),
      },
      {
        path: 'espacios/:id/editar',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import(
            './features/espacios/pages/espacio-form-page/espacio-form-page.component'
          ).then((m) => m.EspacioFormPageComponent),
      },
      {
        path: 'espacios/:id',
        loadComponent: () =>
          import(
            './features/espacios/pages/espacio-detail-page/espacio-detail-page.component'
          ).then((m) => m.EspacioDetailPageComponent),
      },
      {
        path: 'reservaciones',
        component: ModulePlaceholderComponent,
        data: {
          title: 'Reservaciones',
          description:
            'Agenda operativa, creación manual y gestión de estados de reservación.',
        },
      },
      {
        path: 'pagos',
        component: ModulePlaceholderComponent,
        data: {
          title: 'Pagos',
          description:
            'Consulta de pagos registrados, cobros en efectivo y confirmación de pendientes.',
        },
      },
      {
        path: 'usuarios',
        component: ModulePlaceholderComponent,
        data: {
          title: 'Usuarios',
          description:
            'Directorio de clientes y operadores administrativos del sistema.',
        },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
