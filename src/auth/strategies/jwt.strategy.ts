import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { RolUsuario } from '../../dominio/entidades/usuario.entity.js';

export interface JwtPayload {
  sub: string;
  correo: string;
  rol: RolUsuario;
  nombre?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    if (!process.env.JWT_SECRET) {
      process.loadEnvFile?.('.env');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secreto_jwt_para_sistema_reservas_2026',
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
