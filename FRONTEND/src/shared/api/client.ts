import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError, ApiErrorResponse, ApiSuccessResponse } from './types';

export const AUTH_TOKEN_KEY = 'token';

export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

const DEFAULT_TIMEOUT_MS = 15_000;


export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    window.localStorage.getItem(AUTH_TOKEN_KEY) ??
    window.localStorage.getItem('access_token')
  );
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem('access_token');
  window.localStorage.removeItem('reservas.customer-session');
}


function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object' || !('message' in data)) {
    return null;
  }

  const rawMessage = (data as { message?: unknown }).message;
  if (Array.isArray(rawMessage)) {
    const joined = rawMessage.map(String).filter(Boolean).join('; ');
    return joined.length > 0 ? joined : null;
  }

  if (typeof rawMessage === 'string' && rawMessage.trim().length > 0) {
    return rawMessage;
  }

  return null;
}

const baseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

if (import.meta.env.DEV && !baseURL) {
  console.warn(
    '[API Client] VITE_API_BASE_URL no está configurada. Verifica tu archivo .env en la raíz de FRONTEND/.',
  );
}


const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});


axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);


axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiSuccessResponse<unknown>>) => {
    const payload = response.data;

    if (
      payload &&
      typeof payload === 'object' &&
      'success' in payload &&
      payload.success === true &&
      'data' in payload
    ) {
      return payload.data as unknown as AxiosResponse;
    }

    return payload as unknown as AxiosResponse;
  },


  (error: AxiosError<ApiErrorResponse>): Promise<never> => {
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED';
      const networkError: ApiError = {
        message: isTimeout
          ? 'La solicitud tardó demasiado en responder. Inténtalo nuevamente.'
          : 'No se pudo conectar con el servidor. Verifica tu conexión o que el servicio esté activo.',
        tipoError: isTimeout ? 'TimeoutError' : 'NetworkError',
      };
      return Promise.reject(networkError);
    }

    const { status, data } = error.response;
    const requestUrl = error.config?.url ?? '';

    if (status === 401 || status === 403) {
      const hadToken = Boolean(getAuthToken());
      if (status === 401) clearAuthToken();

      const isPublicAuthRoute =
        requestUrl.includes('/auth/login') || requestUrl.includes('/auth/registro');

      if (status === 401 && typeof window !== 'undefined' && hadToken && !isPublicAuthRoute) {
        window.dispatchEvent(
          new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { status } }),
        );
      }

      const authError: ApiError = {
        message:
          extractErrorMessage(data) ??
          (status === 401
            ? 'Tu sesión ha expirado o no es válida. Inicia sesión nuevamente.'
            : 'No tienes permisos para realizar esta acción.'),
        tipoError:
          data?.tipoError ??
          (status === 401 ? 'UnauthorizedException' : 'ForbiddenException'),
        statusCode: status,
      };
      return Promise.reject(authError);
    }

    if (status === 409) {
      const domainError: ApiError = {
        message:
          extractErrorMessage(data) ??
          'No se pudo completar la operación por una regla de negocio.',
        tipoError: data?.tipoError ?? 'ConflictException',
        statusCode: 409,
      };
      return Promise.reject(domainError);
    }

    const genericHttpError: ApiError = {
      message:
        extractErrorMessage(data) ??
        'Ocurrió un problema inesperado al comunicarse con el servicio.',
      tipoError: data?.tipoError ?? 'HttpError',
      statusCode: status,
    };
    return Promise.reject(genericHttpError);
  },
);


export interface ApiClient
  extends Omit<
    AxiosInstance,
    'request' | 'get' | 'delete' | 'head' | 'options' | 'post' | 'put' | 'patch'
  > {
  request<T = unknown, D = unknown>(config: AxiosRequestConfig<D>): Promise<T>;
  get<T = unknown, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<T>;
  delete<T = unknown, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<T>;
  head<T = unknown, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<T>;
  options<T = unknown, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>,
  ): Promise<T>;
  post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<T>;
  put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<T>;
  patch<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<T>;
}

export const apiClient: ApiClient = axiosInstance as unknown as ApiClient;

export default apiClient;
