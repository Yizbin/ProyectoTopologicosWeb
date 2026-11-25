import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { RolUsuario } from '../../dominio/entidades/usuario.entity.js';
import { obtenerJwtSecret } from '../../config/jwt.config.js';
import { UsuariosService } from '../../usuarios/usuarios.service.js';

export interface JwtPayload {
  sub: string;
  correo: string;
  rol: RolUsuario;
  nombre?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usuariosService: UsuariosService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: obtenerJwtSecret(),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub || !payload.rol) {
      throw new UnauthorizedException('Token inválido o incompleto.');
    }

    // La cuenta se revalida en cada petición: si fue desactivada o cambió de rol,
    // la credencial deja de valer de inmediato y el cliente debe iniciar sesión otra vez.
    const estado = await this.usuariosService.obtenerEstadoSesion(payload.sub);
    if (!estado || !estado.activo) {
      throw new UnauthorizedException('La cuenta ya no está activa. Inicia sesión nuevamente.');
    }
    if (estado.rol !== payload.rol) {
      throw new UnauthorizedException('Los permisos de la cuenta cambiaron. Inicia sesión nuevamente.');
    }

    return {
      id: payload.sub,
      correo: payload.correo,
      rol: payload.rol,
      nombre: payload.nombre,
    };
  }
}
