import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { isApiError } from '../models';
import {
  ADMIN_TOKEN_KEY,
  ADMIN_USER_KEY,
  AuthService,
} from './auth.service';

function makeTestJwt(payload: Record<string, unknown>): string {
  const encode = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const futureExp = Math.floor(Date.now() / 1000) + 3600;
  const pastExp = Math.floor(Date.now() / 1000) - 60;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('persiste la sesión y actualiza Signals cuando el usuario tiene rol ADMIN', () => {
    const token = makeTestJwt({ sub: 'admin-1', rol: 'ADMIN', exp: futureExp });
    let resultRole = '';

    service
      .login({ correo: 'admin@seeder.com', contrasena: 'Admin123*' })
      .subscribe((res) => {
        resultRole = res.usuario.rol;
      });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({
      access_token: token,
      usuario: {
        id: 'admin-1',
        nombre: 'Administrador',
        correo: 'admin@seeder.com',
        rol: 'ADMIN',
      },
    });

    expect(resultRole).toBe('ADMIN');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(true);
    expect(localStorage.getItem(ADMIN_TOKEN_KEY)).toBe(token);
    expect(localStorage.getItem(ADMIN_USER_KEY)).toContain('admin@seeder.com');
  });

  it('rechaza cuentas con rol CLIENTE sin guardar sesión ni token', () => {
    const tokenCliente = makeTestJwt({
      sub: 'cliente-1',
      rol: 'CLIENTE',
      exp: futureExp,
    });
    let capturedError: unknown;

    service
      .login({ correo: 'cliente@sistema.local', contrasena: 'Cliente123*' })
      .subscribe({
        error: (err) => {
          capturedError = err;
        },
      });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
    req.flush({
      access_token: tokenCliente,
      usuario: {
        id: 'cliente-1',
        nombre: 'Cliente Demo',
        correo: 'cliente@sistema.local',
        rol: 'CLIENTE',
      },
    });

    expect(isApiError(capturedError)).toBe(true);
    if (isApiError(capturedError)) {
      expect(capturedError.statusCode).toBe(403);
      expect(capturedError.tipoError).toBe('AdminRoleRequiredError');
      expect(capturedError.message).toContain('ADMIN');
    }
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isAdmin()).toBe(false);
    expect(localStorage.getItem(ADMIN_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(ADMIN_USER_KEY)).toBeNull();
  });

  it('limpia storage y redirige a /login inmediatamente al ejecutar logout()', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const token = makeTestJwt({ sub: 'admin-1', rol: 'ADMIN', exp: futureExp });

    service
      .login({ correo: 'admin@seeder.com', contrasena: 'Admin123*' })
      .subscribe();

    httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`).flush({
      access_token: token,
      usuario: {
        id: 'admin-1',
        nombre: 'Administrador',
        correo: 'admin@seeder.com',
        rol: 'ADMIN',
      },
    });

    service.logout('Sesión finalizada');

    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(service.authNotice()).toBe('Sesión finalizada');
    expect(localStorage.getItem(ADMIN_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(ADMIN_USER_KEY)).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });

  it('invalida y limpia sesión automáticamente si el JWT hidratado está expirado', () => {
    const expiredToken = makeTestJwt({
      sub: 'admin-1',
      rol: 'ADMIN',
      exp: pastExp,
    });
    localStorage.setItem(ADMIN_TOKEN_KEY, expiredToken);
    localStorage.setItem(
      ADMIN_USER_KEY,
      JSON.stringify({
        id: 'admin-1',
        nombre: 'Admin',
        correo: 'admin@seeder.com',
        rol: 'ADMIN',
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    const freshService = TestBed.inject(AuthService);
    expect(freshService.isAuthenticated()).toBe(false);
    expect(freshService.hasValidAdminSession()).toBe(false);
    expect(localStorage.getItem(ADMIN_TOKEN_KEY)).toBeNull();
  });
});
