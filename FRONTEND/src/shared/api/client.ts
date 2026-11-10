import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from './contracts.js';

const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
const sessionExpiredEvent = 'storefront:session-expired';
let readAccessToken: () => string | null = () => null;

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export function setAccessTokenReader(reader: () => string | null) {
  readAccessToken = reader;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (!baseUrl) {
    throw new ApiClientError(
      'Falta configurar VITE_API_BASE_URL en storefront/.env.',
      0,
    );
  }

  const token = readAccessToken();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body !== undefined)
    headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiClientError(
      'No se pudo conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.',
      0,
    );
  }

  const payload = (await response.json().catch(() => null)) as
    ApiSuccessResponse<T> | ApiErrorResponse | null;

  if (!response.ok) {
    const publicAuthRoute = path === '/auth/login' || path === '/auth/registro';
    if (response.status === 401 && token && !publicAuthRoute) {
      window.dispatchEvent(new Event(sessionExpiredEvent));
    }
    const apiError =
      payload && 'success' in payload && payload.success === false
        ? payload
        : null;
    throw new ApiClientError(
      apiError?.message ??
        'Ocurrió un problema al comunicarse con el servicio.',
      response.status,
      apiError?.tipoError,
    );
  }

  if (!payload || !('success' in payload) || payload.success !== true) {
    throw new ApiClientError(
      'El servicio respondió con un formato que no reconocemos.',
      response.status,
    );
  }

  return payload.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),
};

export const API_SESSION_EXPIRED_EVENT = sessionExpiredEvent;
