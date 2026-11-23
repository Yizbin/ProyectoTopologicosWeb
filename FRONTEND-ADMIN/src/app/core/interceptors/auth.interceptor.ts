import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  const isApiRequest = req.url.startsWith(apiBaseUrl) || req.url.startsWith('/');
  const isLoginRequest = req.url.includes('/auth/login');

  if (!isApiRequest || isLoginRequest) {
    return next(req);
  }

  const token = authService.getToken();
  if (!token) {
    return next(req);
  }

  const authenticatedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authenticatedRequest);
};
