import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { ADMIN_TOKEN_KEY, ADMIN_USER_KEY, AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { unsavedChangesGuard } from './unsaved-changes.guard';

function makeTestJwt(payload: Record<string, unknown>): string {
  const encode = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.sig`;
}

describe('Core Functional Guards', () => {
  const route = {} as ActivatedRouteSnapshot;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('authGuard redirige a /login con returnUrl cuando no hay sesión', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    const state = { url: '/dashboard' } as RouterStateSnapshot;
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result instanceof UrlTree).toBe(true);
    if (result instanceof UrlTree) {
      expect(result.toString()).toBe('/login?returnUrl=%2Fdashboard');
    }
    const authService = TestBed.inject(AuthService);
    expect(authService.authNotice()).toContain('administrador');
  });

  it('authGuard permite acceso cuando hay JWT ADMIN vigente y guestGuard redirige a /dashboard', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem(
      ADMIN_TOKEN_KEY,
      makeTestJwt({ sub: 'admin-1', rol: 'ADMIN', exp }),
    );
    localStorage.setItem(
      ADMIN_USER_KEY,
      JSON.stringify({
        id: 'admin-1',
        nombre: 'Admin',
        correo: 'admin@seeder.com',
        rol: 'ADMIN',
      }),
    );

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    const state = { url: '/dashboard' } as RouterStateSnapshot;
    const authResult = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(authResult).toBe(true);

    const guestResult = TestBed.runInInjectionContext(() =>
      guestGuard(route, { url: '/login' } as RouterStateSnapshot),
    );
    expect(guestResult instanceof UrlTree).toBe(true);
    if (guestResult instanceof UrlTree) {
      expect(guestResult.toString()).toBe('/dashboard');
    }
  });

  it('unsavedChangesGuard solicita confirmación solo si hay cambios pendientes', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const dummyState = { url: '/espacios' } as RouterStateSnapshot;

    const cleanResult = unsavedChangesGuard(
      { hasUnsavedChanges: () => false },
      route,
      dummyState,
      dummyState,
    );
    expect(cleanResult).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();

    const dirtyResult = unsavedChangesGuard(
      { hasUnsavedChanges: () => true },
      route,
      dummyState,
      dummyState,
    );
    expect(dirtyResult).toBe(false);
    expect(confirmSpy).toHaveBeenCalledOnce();

    confirmSpy.mockRestore();
  });
});
