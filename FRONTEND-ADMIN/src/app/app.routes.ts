import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import { LoginPageComponent } from './features/auth/pages/login-page/login-page.component';
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
    canActivateChild: [authGuard],
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
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import(
            './features/espacios/pages/espacio-detail-page/espacio-detail-page.component'
          ).then((m) => m.EspacioDetailPageComponent),
      },
      {
        path: 'reservaciones',
        loadComponent: () =>
          import(
            './features/reservaciones/pages/reservaciones-list-page/reservaciones-list-page.component'
          ).then((m) => m.ReservacionesListPageComponent),
      },
      {
        path: 'reservaciones/nueva',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import(
            './features/reservaciones/pages/reservacion-form-page/reservacion-form-page.component'
          ).then((m) => m.ReservacionFormPageComponent),
      },
      {
        path: 'reservaciones/:id',
        loadComponent: () =>
          import(
            './features/reservaciones/pages/reservacion-detail-page/reservacion-detail-page.component'
          ).then((m) => m.ReservacionDetailPageComponent),
      },
      {
        path: 'pagos',
        loadComponent: () =>
          import(
            './features/pagos/pages/pagos-list-page/pagos-list-page.component'
          ).then((m) => m.PagosListPageComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import(
            './features/usuarios/pages/usuarios-list-page/usuarios-list-page.component'
          ).then((m) => m.UsuariosListPageComponent),
      },
      {
        path: 'usuarios/nuevo',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import(
            './features/usuarios/pages/usuario-form-page/usuario-form-page.component'
          ).then((m) => m.UsuarioFormPageComponent),
      },
      {
        path: 'usuarios/:id/editar',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import(
            './features/usuarios/pages/usuario-form-page/usuario-form-page.component'
          ).then((m) => m.UsuarioFormPageComponent),
      },
      {
        path: 'usuarios/:id',
        loadComponent: () =>
          import(
            './features/usuarios/pages/usuario-detail-page/usuario-detail-page.component'
          ).then((m) => m.UsuarioDetailPageComponent),
      },
      {
        path: '**',
        loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
