export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  durationMs?: number;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  tipoError?: string;
  timestamp?: string;
  path?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  tipoError: string;
  details?: string[];
}

export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'statusCode' in value &&
    'message' in value &&
    'tipoError' in value
  );
}
