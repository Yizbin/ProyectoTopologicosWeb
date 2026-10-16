import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { JwtPayload } from './strategies/jwt.strategy.js';
import { Usuario, RolUsuario } from '../dominio/entidades/usuario.entity.js';

export interface LoginResponse {
  access_token: string;
  usuario: {
    id: string;
    nombre: string;
    correo: string;
    rol: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async validarCredenciales(correo: string, contrasena: string): Promise<Usuario> {
    const usuario = await this.usuariosService.buscarPorCorreo(correo);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas: correo o contraseña incorrectos.');
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales inválidas: correo o contraseña incorrectos.');
    }

    return usuario;
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const usuario = await this.validarCredenciales(loginDto.correo, loginDto.contrasena);

    const payload: JwtPayload = {
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      nombre: usuario.nombre,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }

  async registro(registroDto: RegistroDto): Promise<LoginResponse> {
  const usuario = await this.usuariosService.crearUsuario({
    ...registroDto,
    rol: RolUsuario.CLIENTE,
  });

  const payload: JwtPayload = {
    sub: usuario.id,
    correo: usuario.correo,
    rol: usuario.rol,
    nombre: usuario.nombre,
  };

  const token = await this.jwtService.signAsync(payload);

  return {
    access_token: token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  };
}
}
