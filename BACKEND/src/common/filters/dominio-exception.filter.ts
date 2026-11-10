import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { DominioError } from '../../dominio/errores/dominio.errors.js';

@Catch()
export class DominioExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = exception instanceof DominioError
      ? HttpStatus.CONFLICT
      : exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse = exception instanceof HttpException ? exception.getResponse() : undefined;
    const responseBody = typeof errorResponse === 'string' ? undefined : errorResponse;
    const rawMessage = responseBody && typeof responseBody === 'object' && 'message' in responseBody
      ? responseBody.message
      : exception instanceof DominioError
        ? exception.message
        : statusCode === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Error interno del servidor.'
          : exception instanceof HttpException
            ? exception.message
            : 'Error interno del servidor.';
    const message = Array.isArray(rawMessage) ? rawMessage.join('; ') : String(rawMessage);

    response.status(statusCode).json({
      success: false,
      statusCode,
      error: responseBody && typeof responseBody === 'object' && 'error' in responseBody
        ? responseBody.error
        : statusCode === HttpStatus.CONFLICT
          ? 'Conflict'
          : statusCode === HttpStatus.INTERNAL_SERVER_ERROR
            ? 'Internal Server Error'
            : 'Http Error',
      message,
      tipoError: exception instanceof Error ? exception.name : 'Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
