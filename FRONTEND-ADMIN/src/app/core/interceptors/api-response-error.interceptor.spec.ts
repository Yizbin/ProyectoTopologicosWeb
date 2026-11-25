import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
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
} from '../services/auth.service';
import { apiResponseErrorInterceptor } from './api-response-error.interceptor';

function makeTestJwt(payload: Record<string, unknown>): string {
  const encode = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.sig`;
}

describe('apiResponseErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
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
        provideHttpClient(withInterceptors([apiResponseErrorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('desenvuelve respuestas exitosas { success: true, data } entregando data directamente', () => {
    let payload: unknown;

    http.get(`${environment.apiBaseUrl}/sedes`).subscribe((res) => {
      payload = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/sedes`);
    req.flush({
      success: true,
      data: [{ id: 'sede-1', nombre: 'Sede Central' }],
      timestamp: '2026-11-23T10:00:00.000Z',
    });

    expect(payload).toEqual([{ id: 'sede-1', nombre: 'Sede Central' }]);
  });

  it('normaliza errores HTTP 409 de dominio preservando tipoError y message', () => {
    let capturedError: unknown;

    http.post(`${environment.apiBaseUrl}/espacios`, {}).subscribe({
      error: (err) => {
        capturedError = err;
      },
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/espacios`);
    req.flush(
      {
        success: false,
        statusCode: 409,
        error: 'Conflict',
        message: 'La sede especificada no existe.',
        tipoError: 'SedeNoEncontradaError',
      },
      { status: 409, statusText: 'Conflict' },
    );

    expect(isApiError(capturedError)).toBe(true);
    if (isApiError(capturedError)) {
      expect(capturedError.statusCode).toBe(409);
      expect(capturedError.tipoError).toBe('SedeNoEncontradaError');
      expect(capturedError.message).toBe('La sede especificada no existe.');
    }
  });

  it('cierra sesión y redirige a /login ante 403 por falta de permisos en ruta protegida', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    http.get(`${environment.apiBaseUrl}/dashboard/resumen`).subscribe({ error: () => undefined });
    httpMock.expectOne(`${environment.apiBaseUrl}/dashboard/resumen`).flush(
      { message: 'Acceso denegado' }, { status: 403, statusText: 'Forbidden' },
    );
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.authNotice()).toContain('permisos de administrador');
    expect(navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });

  it('normaliza arreglos de mensajes HTTP 400 de ValidationPipe', () => {
    let capturedError: unknown;

    http.post(`${environment.apiBaseUrl}/espacios`, {}).subscribe({
      error: (err) => {
        capturedError = err;
      },
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/espacios`);
    req.flush(
      {
        success: false,
        statusCode: 400,
        error: 'Bad Request',
        message: ['El nombre es obligatorio', 'El costo debe ser positivo'],
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(isApiError(capturedError)).toBe(true);
    if (isApiError(capturedError)) {
      expect(capturedError.statusCode).toBe(400);
      expect(capturedError.message).toBe(
        'El nombre es obligatorio; El costo debe ser positivo',
      );
      expect(capturedError.details).toEqual([
        'El nombre es obligatorio',
        'El costo debe ser positivo',
      ]);
    }
  });

  it('cierra sesión y redirige a /login ante 401 en rutas protegidas, pero NO en /auth/login', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    http
      .post(`${environment.apiBaseUrl}/auth/login`, {
        correo: 'x@x.com',
        contrasena: 'bad',
      })
      .subscribe({ error: () => undefined });

    httpMock
      .expectOne(`${environment.apiBaseUrl}/auth/login`)
      .flush(
        { message: 'Credenciales inválidas' },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(authService.isAuthenticated()).toBe(true);

    http
      .get(`${environment.apiBaseUrl}/dashboard/resumen`)
      .subscribe({ error: () => undefined });

    httpMock
      .expectOne(`${environment.apiBaseUrl}/dashboard/resumen`)
      .flush(
        { message: 'No autorizado' },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect(authService.isAuthenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });
});
