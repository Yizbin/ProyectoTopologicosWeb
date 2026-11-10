export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  durationMs: number;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  tipoError: string;
  timestamp: string;
  path: string;
}