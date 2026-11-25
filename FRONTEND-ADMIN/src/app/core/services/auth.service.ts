import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ApiError,
  LoginRequest,
  LoginResponse,
  UsuarioAutenticado,
} from '../models';

export const ADMIN_TOKEN_KEY = 'admin_access_token';
export const ADMIN_USER_KEY = 'admin_user';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  private readonly _user = signal<UsuarioAutenticado | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _authNotice = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly authNotice = this._authNotice.asReadonly();

  readonly isAuthenticated = computed(
    () => this._token() !== null && this._user() !== null,
  );
  readonly isAdmin = computed(
    () => this.isAuthenticated() && this._user()?.rol === 'ADMIN',
  );

  constructor() {
    this.hydrateFromStorage();
  }

  getToken(): string | null {
    const current = this._token();
    if (!current) {
      return null;
    }
    if (!this.isTokenValid(current)) {
      this.logout('Tu sesión ha expirado. Inicia sesión nuevamente.');
      return null;
    }
    return current;
  }

  hasValidAdminSession(): boolean {
    const currentToken = this._token();
    const currentUser = this._user();

    if (!currentToken || !currentUser || currentUser.rol !== 'ADMIN') {
      this.clearSession();
      return false;
    }

    if (!this.isTokenValid(currentToken)) {
      this.clearSession();
      return false;
    }

    return true;
  }

  setAuthNotice(message: string | null): void {
    this._authNotice.set(message);
  }

  clearAuthNotice(): void {
    this._authNotice.set(null);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, credentials)
      .pipe(
        map((response) => {
          if (response.usuario?.rol !== 'ADMIN') {
            this.clearSession();
            const error: ApiError = {
              statusCode: 403,
              tipoError: 'AdminRoleRequiredError',
              message:
                'Acceso exclusivo para cuentas con rol ADMIN. Los usuarios cliente deben usar el portal público.',
            };
            throw error;
          }

          if (!this.isTokenValid(response.access_token)) {
            this.clearSession();
            const error: ApiError = {
              statusCode: 401,
              tipoError: 'InvalidTokenError',
              message: 'La credencial recibida no es válida o ya expiró.',
            };
            throw error;
          }

          return response;
        }),
        tap((response) => {
          this.persistSession(response.access_token, response.usuario);
          this.clearAuthNotice();
        }),
      );
  }

  logout(reason?: string): void {
    this.clearSession();
    if (reason) {
      this._authNotice.set(reason);
    }
    void this.router.navigate(['/login'], { replaceUrl: true });
  }

  clearSession(): void {
    this._token.set(null);
    this._user.set(null);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    }
  }

  private hydrateFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const storedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    const storedUserRaw = localStorage.getItem(ADMIN_USER_KEY);

    if (!storedToken || !storedUserRaw) {
      this.clearSession();
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUserRaw) as Partial<UsuarioAutenticado>;
      const hasValidUser =
        typeof parsedUser.id === 'string' &&
        typeof parsedUser.nombre === 'string' &&
        typeof parsedUser.correo === 'string' &&
        parsedUser.rol === 'ADMIN';

      if (!hasValidUser || !this.isTokenValid(storedToken)) {
        this.clearSession();
        return;
      }

      this._token.set(storedToken);
      this._user.set(parsedUser as UsuarioAutenticado);
    } catch {
      this.clearSession();
    }
  }

  private persistSession(token: string, usuario: UsuarioAutenticado): void {
    this._token.set(token);
    this._user.set(usuario);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(usuario));
    }
  }

  private isTokenValid(token: string | null): boolean {
    if (!token) {
      return false;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      return false;
    }

    const exp = payload['exp'];
    if (typeof exp !== 'number' || !Number.isFinite(exp)) {
      return false;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (exp <= nowInSeconds) {
      return false;
    }

    const rol = payload['rol'];
    if (typeof rol === 'string' && rol !== 'ADMIN') {
      return false;
    }

    return true;
  }
}
