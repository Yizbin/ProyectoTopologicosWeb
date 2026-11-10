import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { RolUsuario } from '../../dominio/entidades/usuario.entity.js';
import { obtenerJwtSecret } from '../../config/jwt.config.js';

export interface JwtPayload {
  sub: string;
  correo: string;
  rol: RolUsuario;
  nombre?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
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

    return {
      id: payload.sub,
      correo: payload.correo,
      rol: payload.rol,
      nombre: payload.nombre,
    };
  }
}
