import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    _context?: ExecutionContext,
    _status?: any,
  ): TUser {
    if (err || !user) {
      const mensaje =
        err?.message ||
        (info?.message
          ? `No autorizado: ${info.message}.`
          : 'No autorizado. Token no proporcionado o inválido.');
      throw new UnauthorizedException(mensaje);
    }
    return user;
  }
}
