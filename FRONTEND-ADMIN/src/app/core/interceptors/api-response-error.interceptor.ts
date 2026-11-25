import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, map, throwError } from 'rxjs';
import { isApiError, type ApiError, type ApiErrorResponse } from '../models';
import { AuthService } from '../services/auth.service';

function isEnvelopeResponse(
  body: unknown,
): body is { success: true; data: unknown } {
  return (
    typeof body === 'object' &&
    body !== null &&
    'success' in body &&
    (body as { success?: unknown }).success === true &&
    'data' in body
  );
}

function normalizeHttpError(error: HttpErrorResponse): ApiError {
  if (error.status === 0) {
    return {
      statusCode: 0,
      tipoError: 'NetworkError',
      message:
        'No se pudo conectar con el servicio backend. Verifica tu conexión o que el servidor esté activo.',
    };
  }

  const body = error.error as Partial<ApiErrorResponse> | undefined;
  const rawMessage = body?.message;

  let message = 'Ocurrió un error inesperado al comunicarse con el servicio.';
  let details: string[] | undefined;

  if (Array.isArray(rawMessage)) {
    const cleaned = rawMessage.map(String).filter(Boolean);
    if (cleaned.length > 0) {
      message = cleaned.join('; ');
      details = cleaned;
    }
  } else if (typeof rawMessage === 'string' && rawMessage.trim().length > 0) {
    message = rawMessage;
  } else if (error.status === 401) {
    message = 'Credenciales inválidas o sesión expirada.';
  } else if (error.status === 403) {
    message = 'No cuentas con permisos de administrador para esta acción.';
  }

  const defaultTipo =
    error.status === 409
      ? 'ConflictException'
      : error.status === 400
        ? 'BadRequestException'
        : error.status === 401
          ? 'UnauthorizedException'
          : error.status === 403
            ? 'ForbiddenException'
            : error.status === 404
              ? 'NotFoundException'
              : 'HttpError';

  return {
    statusCode: error.status,
    message,
    tipoError: body?.tipoError ?? defaultTipo,
    details,
  };
}

export const apiResponseErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && isEnvelopeResponse(event.body)) {
        return event.clone({ body: event.body.data });
      }
      return event;
    }),
    catchError((cause: unknown) => {
      if (isApiError(cause)) {
        return throwError(() => cause);
      }

      if (cause instanceof HttpErrorResponse) {
        const normalized = normalizeHttpError(cause);
        const isLoginRequest = req.url.includes('/auth/login');

        if ((cause.status === 401 || cause.status === 403) && !isLoginRequest) {
          authService.logout(
            cause.status === 403
              ? 'Tu cuenta no tiene permisos de administrador. Inicia sesión nuevamente.'
              : 'Tu sesión ha expirado o ya no es válida. Inicia sesión nuevamente.',
          );
        }

        return throwError(() => normalized);
      }

      const fallback: ApiError = {
        statusCode: 500,
        tipoError: 'UnexpectedError',
        message: 'Ocurrió un error inesperado al procesar la solicitud.',
      };
      return throwError(() => fallback);
    }),
  );
};
