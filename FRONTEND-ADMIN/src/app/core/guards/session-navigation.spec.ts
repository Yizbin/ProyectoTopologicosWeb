import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService, ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from '../services/auth.service';
import { NotFoundComponent } from '../../shared/components/not-found/not-found.component';
import { authGuard } from './auth.guard';
import { unsavedChangesGuard } from './unsaved-changes.guard';

@Component({ standalone: true, template: '<p>Formulario protegido</p>' })
class FormularioPrueba {
  hasUnsavedChanges(): boolean { return true; }
}
@Component({ standalone: true, template: '<p>Inicio de sesión</p>' })
class LoginPrueba {}
@Component({ standalone: true, imports: [RouterOutlet], template: '<router-outlet />' })
class ShellPrueba {}

describe('Salida segura de formularios protegidos y rutas desconocidas', () => {
  afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it('cerrar sesión navega al login aunque el operador rechazaría descartar cambios', async () => {
    const payload = btoa(JSON.stringify({ rol: 'ADMIN', sub: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 }));
    localStorage.setItem(ADMIN_TOKEN_KEY, `header.${payload}.signature`);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify({ id: 'admin', nombre: 'Admin', correo: 'a@test.com', rol: 'ADMIN' }));
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      provideRouter([
        { path: 'formulario', component: FormularioPrueba, canActivate: [authGuard], canDeactivate: [unsavedChangesGuard] },
        { path: 'login', component: LoginPrueba },
      ]),
    ] });
    const harness = await RouterTestingHarness.create('/formulario');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    TestBed.inject(AuthService).logout();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/login');
    expect(harness.routeNativeElement?.textContent).toContain('Inicio de sesión');
    expect(confirm).not.toHaveBeenCalled();
  });

  it('una ruta inexistente (/no-existe) sin sesión redirige a /login y nunca muestra NotFoundComponent', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: LoginPrueba },
          {
            path: '',
            component: ShellPrueba,
            canActivate: [authGuard],
            canActivateChild: [authGuard],
            children: [
              { path: '**', component: NotFoundComponent },
            ],
          },
          { path: '**', redirectTo: 'login' },
        ]),
      ],
    });

    const harness = await RouterTestingHarness.create('/no-existe');
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Fno-existe');
    expect(harness.routeNativeElement?.textContent).toContain('Inicio de sesión');
    expect(harness.routeNativeElement?.textContent).not.toContain('404');
  });
});
