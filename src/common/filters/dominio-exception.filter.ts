import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { DominioError } from '../../dominio/errores/dominio.errors.js';

@Catch(DominioError)
export class DominioExceptionFilter implements ExceptionFilter {
  catch(exception: DominioError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    response.status(HttpStatus.CONFLICT).json({
      success: false,
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      message: exception.message,
      tipoError: exception.name,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
