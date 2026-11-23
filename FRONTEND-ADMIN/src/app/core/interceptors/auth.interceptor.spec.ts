import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

function makeTestJwt(payload: Record<string, unknown>): string {
  const encode = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.sig`;
}

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let validToken: string;

  beforeEach(() => {
    localStorage.clear();
    const exp = Math.floor(Date.now() / 1000) + 3600;
    validToken = makeTestJwt({ sub: 'admin-1', rol: 'ADMIN', exp });
    localStorage.setItem(ADMIN_TOKEN_KEY, validToken);
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
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('agrega Authorization: Bearer a peticiones hacia environment.apiBaseUrl', () => {
    http.get(`${environment.apiBaseUrl}/dashboard/resumen`).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard/resumen`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
    req.flush({});
  });

  it('NO adjunta Authorization en /auth/login', () => {
    http
      .post(`${environment.apiBaseUrl}/auth/login`, {
        correo: 'admin@seeder.com',
        contrasena: 'Admin123*',
      })
      .subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
